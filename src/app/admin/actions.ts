"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// Aliased: the exported server action below is also called updateOrder, and it
// is the name the admin form binds to.
import { isOrderStatus, updateOrder as persistOrder } from "@/lib/db";
import {
  checkPassword,
  createAdminSession,
  destroyAdminSession,
  isAdmin,
  isAdminConfigured,
} from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) {
    return { error: "Set ADMIN_PASSWORD in .env.local to a real password first." };
  }

  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Wrong password." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin");
}

/**
 * Marks an order shipped and records the tracking details, or moves it to any
 * other status. Every server action re-checks the session: the cookie is the
 * only thing standing between the internet and the order book.
 */
export async function updateOrder(formData: FormData): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Not authorised");
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const courier = String(formData.get("courier") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  // isOrderStatus narrows the string, so an edited form cannot write an
  // arbitrary value into the status column.
  if (!id || !isOrderStatus(status)) {
    throw new Error("Invalid update");
  }

  await persistOrder(id, {
    status,
    courier: courier || null,
    trackingNumber: trackingNumber || null,
  });

  revalidatePath("/admin");
}
