"use client";

import { useActionState } from "react";
import { submitEnquiry } from "../enquiry-actions";
import { LIMITS, OTHER_PRODUCT } from "@/lib/enquiry-options";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

// Public wholesale enquiry form on /home. Saved to the database; staff follow up at /enquiries.
export default function EnquiryForm({ groups }: { groups: { label: string; products: string[] }[] }) {
  const [state, formAction, pending] = useActionState(submitEnquiry, undefined);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-accent/40 bg-background p-6">
        <p className="text-lg font-bold">Thank you{state.name ? `, ${state.name}` : ""}!</p>
        <p className="mt-2 text-sm text-foreground/70">
          We&apos;ve received your enquiry and will call you back shortly with a mock-up and price.
        </p>
      </div>
    );
  }

  const v = state?.ok === false ? state.values : undefined;
  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-foreground/10 bg-background p-5 sm:p-6">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent-ink">Send an enquiry</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name" required>
          <input name="name" required maxLength={LIMITS.name} autoComplete="name" defaultValue={v?.name} className={inputCls} />
        </Field>
        <Field label="Mobile number" required>
          <input name="phone" type="tel" required inputMode="tel" maxLength={20} autoComplete="tel" placeholder="10-digit mobile" defaultValue={v?.phone} className={inputCls} />
        </Field>
        <Field label="Team / organisation">
          <input name="organisation" maxLength={LIMITS.organisation} autoComplete="organization" defaultValue={v?.organisation} className={inputCls} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" maxLength={LIMITS.email} autoComplete="email" defaultValue={v?.email} className={inputCls} />
        </Field>
        <Field label="Product">
          <select name="product" defaultValue={v?.product ?? ""} className={inputCls}>
            <option value="">Choose…</option>
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.products.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </optgroup>
            ))}
            <option>{OTHER_PRODUCT}</option>
          </select>
        </Field>
        <Field label="Approx. quantity">
          <input name="quantity" type="number" min={1} step={1} inputMode="numeric" placeholder="e.g. 25" defaultValue={v?.quantity} className={inputCls} />
        </Field>
      </div>
      <Field label="Message">
        <textarea
          name="message"
          rows={3}
          maxLength={LIMITS.message}
          placeholder="Sport, fabric, colours, sizes, when you need it…"
          defaultValue={v?.message}
          className={inputCls}
        />
      </Field>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state?.ok === false && (
        <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground/70">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}
