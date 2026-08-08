"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getProductById, resolveVariant } from "./products";

/**
 * Cart state, persisted to localStorage so a customer who closes the tab does
 * not lose their basket.
 *
 * Only ids and quantities are stored. Prices are looked up from the catalogue
 * on render and recomputed on the server at checkout, so a stale cart written
 * before a price change cannot charge the old price.
 *
 * localStorage is an external store, so the cart is modelled as one and read
 * with useSyncExternalStore rather than mirrored into useState from an effect.
 * That gives correct hydration (the server snapshot is an empty cart) and
 * cross-tab sync (a second tab's changes arrive via the storage event) without
 * a cascading render on mount.
 */

export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type CartLine = CartItem & {
  productName: string;
  productSlug: string;
  variantName: string;
  colour: string;
  imageSrc: string;
  imageAlt: string;
  unitPaise: number;
  linePaise: number;
};

const STORAGE_KEY = "petalora.cart.v1";
const MAX_QUANTITY = 10;

// Stable reference for the server and for an empty cart. Returning a fresh []
// from getSnapshot would make React think the store changed on every read.
const EMPTY: CartItem[] = [];

let snapshot: CartItem[] | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): CartItem[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    // Drop anything malformed. A corrupt or hand-edited localStorage entry
    // should degrade to an empty cart, not crash the app.
    const clean = parsed.filter(
      (i): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CartItem).productId === "string" &&
        typeof (i as CartItem).variantId === "string" &&
        Number.isInteger((i as CartItem).quantity) &&
        (i as CartItem).quantity > 0 &&
        (i as CartItem).quantity <= MAX_QUANTITY,
    );
    return clean.length > 0 ? clean : EMPTY;
  } catch {
    return EMPTY;
  }
}

function readStorage(): CartItem[] {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Safari in private mode throws on localStorage access.
    return EMPTY;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = readStorage();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function getSnapshot(): CartItem[] {
  if (snapshot === null) snapshot = readStorage();
  return snapshot;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function write(next: CartItem[]): void {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Out of quota or private mode. The in-memory cart still works for this
    // session, which is better than throwing mid-checkout.
  }
  emit();
}

/** True once the client store has taken over from the server snapshot. */
function subscribeHydration(): () => void {
  return () => {};
}

type CartContextValue = {
  items: CartItem[];
  /** Detailed lines with catalogue data joined in, invalid entries dropped. */
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  /** False during SSR and hydration, so we do not flash "your cart is empty". */
  hydrated: boolean;
  add: (item: CartItem) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  remove: (productId: string, variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );

  const add = useCallback((item: CartItem) => {
    const current = getSnapshot();
    const existing = current.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId,
    );
    if (!existing) {
      write([...current, { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) }]);
      return;
    }
    write(
      current.map((i) =>
        i === existing
          ? { ...i, quantity: Math.min(i.quantity + item.quantity, MAX_QUANTITY) }
          : i,
      ),
    );
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    const current = getSnapshot();
    if (quantity <= 0) {
      write(current.filter((i) => !(i.productId === productId && i.variantId === variantId)));
      return;
    }
    write(
      current.map((i) =>
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) }
          : i,
      ),
    );
  }, []);

  const remove = useCallback((productId: string, variantId: string) => {
    write(
      getSnapshot().filter((i) => !(i.productId === productId && i.variantId === variantId)),
    );
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  const lines = useMemo<CartLine[]>(() => {
    return items.flatMap((item) => {
      const resolved = resolveVariant(item.productId, item.variantId);
      const product = getProductById(item.productId);
      // A line whose product was removed from the catalogue silently drops out
      // rather than rendering as a broken row.
      if (!resolved || !product) return [];
      const image = product.images[0];
      return [
        {
          ...item,
          productName: product.name,
          productSlug: product.slug,
          variantName: resolved.variant.name,
          colour: product.colour,
          imageSrc: image?.src ?? "",
          imageAlt: image?.alt ?? product.name,
          unitPaise: resolved.variant.pricePaise,
          linePaise: resolved.variant.pricePaise * item.quantity,
        },
      ];
    });
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalPaise: lines.reduce((n, l) => n + l.linePaise, 0),
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, lines, hydrated, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
