"use client";

import { useState, type FormEvent } from "react";

export default function NotifyForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: send `email` to your backend or mailing-list provider.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="mt-10 text-sm font-medium text-accent">
        Thanks! We&apos;ll notify you at {email}.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-lg border border-foreground/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      <button
        type="submit"
        className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
      >
        Notify me
      </button>
    </form>
  );
}
