"use client";

import { useActionState } from "react";
import { changePassword } from "./actions";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function ChangePasswordForm({ username }: { username: string }) {
  const [state, formAction, pending] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {/* Lets password managers know which account this is for. */}
      <input type="hidden" name="username" autoComplete="username" value={username} />
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Current password</span>
        <input name="current" type="password" required autoComplete="current-password" className={inputCls} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">New password (at least 8 characters)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Repeat new password</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-accent">{state.error}</p>
      )}
      {state?.success && (
        <p role="status" className="text-sm font-medium text-green-700 dark:text-green-400">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
