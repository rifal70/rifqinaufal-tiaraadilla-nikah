"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <main className="section-wedding">
      <form action={action} className="glass-card w-full max-w-sm" id="admin-login">
        <h1 className="font-display text-3xl text-gold-shimmer text-center">Admin</h1>
        <label htmlFor="email" className="admin-label mt-6">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="admin-input" />
        <label htmlFor="password" className="admin-label mt-4">Kata sandi</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="admin-input" />
        <button type="submit" className="btn-gold mt-6 w-full" disabled={pending} id="admin-login-submit">
          {pending ? "Masuk…" : "Masuk"}
        </button>
        {state.error && <p className="mt-3 text-sm text-red-300 text-center">{state.error}</p>}
      </form>
    </main>
  );
}
