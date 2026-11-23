"use client";

import { useActionState } from "react";
import { subscribe } from "../notify-actions";

// "Notify me" sign-up. Saved to the database (notify_signups); staff see the list at /signups.
export default function NotifyForm() {
  const [state, formAction, pending] = useActionState(subscribe, undefined);

  if (state?.ok) {
    return (
      <p role="status" className="mt-10 text-sm font-medium text-accent-ink">
        Thanks! We&apos;ll notify you at {state.email}.
      </p>
    );
  }

  return (
    <form action={formAction} className="mx-auto mt-10 w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={state?.ok === false ? state.email : ""}
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={state?.ok === false || undefined}
          aria-describedby={state?.ok === false ? "notify-error" : undefined}
          className="flex-1 rounded-lg border border-foreground/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        {/* Spam trap: hidden from people and screen readers. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Notify me"}
        </button>
      </div>
      {state?.ok === false && (
        <p id="notify-error" role="alert" className="mt-2 text-left text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
