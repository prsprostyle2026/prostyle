"use client";

import { useActionState } from "react";
import { voidPayment } from "../../customers/[id]/payment/actions";

export default function VoidPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, action, pending] = useActionState(voidPayment.bind(null, paymentId), undefined);
  return (
    <details className="mx-auto mt-6 max-w-md rounded-xl border border-foreground/10 p-3 print:hidden" open={!!state?.error}>
      <summary className="cursor-pointer text-sm font-semibold text-accent">Cancel this payment</summary>
      <form action={action} className="mt-3 space-y-2">
        <p className="text-xs text-foreground/60">
          Use this if the payment was recorded by mistake. It stays on record marked &quot;Cancelled&quot; and no longer
          reduces the customer&apos;s balance. This can&apos;t be undone.
        </p>
        <input
          name="reason"
          required
          minLength={3}
          maxLength={300}
          placeholder="Reason, e.g. Entered twice"
          aria-label="Reason for cancelling"
          className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm"
        />
        {state?.error && <p role="alert" className="text-xs font-medium text-accent">{state.error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-md border border-accent py-2 text-sm font-bold text-accent hover:bg-accent/10 disabled:opacity-60">
          {pending ? "Cancelling…" : "Cancel payment"}
        </button>
      </form>
    </details>
  );
}
