"use client";

import { useActionState } from "react";
import { login } from "./actions";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Username</span>
        <input
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          defaultValue={state?.username}
          className={inputCls}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
