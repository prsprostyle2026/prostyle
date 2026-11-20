"use client";

import { useActionState } from "react";
import { resetStaffPassword } from "./actions";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

// Root only: set a staff user's password without knowing their current one.
export default function ResetPasswordForm({ username }: { username: string }) {
  const [state, formAction, saving] = useActionState(resetStaffPassword.bind(null, username), undefined);

  return (
    <details className="mt-2" open={!!state?.error}>
      <summary className="cursor-pointer text-xs font-semibold text-foreground/60 hover:text-accent">
        Set password
      </summary>
      <form action={formAction} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        {/* Lets password managers know which account this is for. */}
        <input type="hidden" name="username" autoComplete="username" value={username} />
        <label>
          <span className="sr-only">New password for {username}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="New password (8+ characters)"
            className={inputCls}
          />
        </label>
        <label>
          <span className="sr-only">Repeat new password</span>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repeat password"
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Set password"}
        </button>
      </form>
      {state?.error && <p role="alert" className="mt-1 text-xs font-medium text-accent">{state.error}</p>}
      {state?.success && (
        <p role="status" className="mt-1 text-xs font-medium text-green-700 dark:text-green-400">{state.success}</p>
      )}
    </details>
  );
}
