"use server";

import { query } from "@/lib/db";

export type NotifyState = { ok: true; email: string } | { ok: false; error: string; email: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Saves an email from the public "Notify me" form. Signing up twice is fine (kept once),
// and the reply is the same either way so the form can't be used to check who signed up.
export async function subscribe(_prev: NotifyState, formData: FormData): Promise<NotifyState> {
  const email = String(formData.get("email") ?? "").trim();

  // Hidden "website" field: people never see it, bots fill it in. Pretend it worked.
  if (String(formData.get("website") ?? "") !== "") return { ok: true, email };

  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address.", email };
  }

  try {
    await query("INSERT INTO notify_signups (email) VALUES ($1) ON CONFLICT DO NOTHING", [email]);
  } catch (err) {
    console.error("notify signup failed", err);
    return { ok: false, error: "Sorry, something went wrong. Please try again in a moment.", email };
  }
  return { ok: true, email };
}
