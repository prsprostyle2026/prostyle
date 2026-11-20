"use client";

import { useActionState } from "react";
import { addStaffUser } from "./actions";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function AddStaffForm() {
  const [state, formAction, pending] = useActionState(addStaffUser, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Username</span>
        <input
          name="username"
          required
          autoComplete="off"
          autoCapitalize="none"
          pattern="[A-Za-z0-9._\-]{2,32}"
          title="2–32 characters: letters, numbers, dot, dash or underscore"
          defaultValue={state?.username}
          className={inputCls}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Password (at least 8 characters)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Repeat password</span>
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
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add staff user"}
      </button>
    </form>
  );
}
