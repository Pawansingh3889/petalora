import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-password gate for /admin.
 *
 * This is a one-person shop, so there is no user table: one password in the
 * environment, and a signed cookie proving it was entered. That is a real
 * trade-off, not an oversight. If you ever add staff who should not see
 * revenue, replace this with real accounts.
 *
 * The cookie holds an HMAC of its own expiry rather than the password, so a
 * stolen cookie cannot be turned back into the password, and it expires on
 * its own.
 */

const COOKIE_NAME = "petalora_admin";
const SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  return password;
}

export function isAdminConfigured(): boolean {
  const password = process.env.ADMIN_PASSWORD;
  // Refuse to authenticate against the placeholder that ships in .env.example.
  return Boolean(password) && password !== "change-me-before-launch";
}

function sign(expiry: number): string {
  return crypto.createHmac("sha256", secret()).update(String(expiry)).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

export async function createAdminSession(): Promise<void> {
  const expiry = Date.now() + SESSION_MS;
  const jar = await cookies();
  jar.set(COOKIE_NAME, `${expiry}.${sign(expiry)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const [expiryPart, signature] = raw.split(".");
  if (!expiryPart || !signature) return false;

  const expiry = Number(expiryPart);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  try {
    return safeEqual(sign(expiry), signature);
  } catch {
    // ADMIN_PASSWORD missing at runtime. Fail closed.
    return false;
  }
}
