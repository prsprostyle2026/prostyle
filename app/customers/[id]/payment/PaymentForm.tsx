"use client";

import { useActionState, useState } from "react";
import { balanceLabel } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { RECEIVERS } from "@/lib/receivers";
import { recordPayment } from "./actions";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function PaymentForm({
  customerId,
  pending,
  today,
}: {
  customerId: string;
  pending: number;
  today: string; // yyyy-mm-dd, India time
}) {
  const [state, formAction, saving] = useActionState(recordPayment.bind(null, customerId), undefined);
  const [amount, setAmount] = useState("");
  const paying = Math.round((Number(amount) || 0) * 100) / 100;

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Amount received (₹)</span>
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputCls}
        />
      </label>
      {pending > 0 && (
        <button
          type="button"
          onClick={() => setAmount(String(pending))}
          className="-mt-2 text-xs font-semibold text-accent-ink hover:underline"
        >
          Fill full balance ({balanceLabel(pending)})
        </button>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-foreground/70">Paid on</span>
          <input name="paidOn" type="date" required defaultValue={state?.values?.paidOn ?? today} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-foreground/70">Method</span>
          <select name="method" required defaultValue={state?.values?.method ?? "Cash"} className={inputCls}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Received by</span>
        <select name="receivedBy" required defaultValue={state?.values?.receivedBy ?? ""} className={inputCls}>
          <option value="" disabled>
            Choose…
          </option>
          {RECEIVERS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Note (optional)</span>
        <input name="note" maxLength={500} placeholder="e.g. UPI ref 4321" defaultValue={state?.values?.note} className={inputCls} />
      </label>

      {paying > 0 && (
        <p className="text-sm text-foreground/70">
          Balance after this payment:{" "}
          <span className="font-bold text-foreground">{balanceLabel(Math.round((pending - paying) * 100) / 100)}</span>
        </p>
      )}

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save payment"}
      </button>
    </form>
  );
}
