"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function AdminLogin() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="mx-auto max-w-sm px-4 py-24 sm:px-6">
      <h1 className="text-3xl font-semibold text-plum-900">Petalora admin</h1>
      <p className="mt-2 text-sm text-ink-soft">Orders, dispatch and tracking.</p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border border-plum-200 bg-white px-3 py-2.5 text-sm focus:border-plum-500"
          />
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-plum-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-plum-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-plum-900 disabled:bg-plum-400"
        >
          {pending ? "Checking..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
