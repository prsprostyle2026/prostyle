"use client";

import { useActionState } from "react";
import { displayDate } from "@/app/bill/BillSheet";
import { balanceLabel } from "@/lib/format";
import { saveOpeningBalance } from "./opening-actions";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

// Opening balance: shows the current one, and a form (collapsed until opened) to set, change or remove it.
export default function OpeningBalanceForm({
  customerId,
  amount,
  date,
  note,
  maxDate,
}: {
  customerId: string;
  amount: number; // + owes us, - credit, 0 = none
  date: string | null;
  note: string;
  maxDate: string; // the earlier of today and the customer's first bill/payment
}) {
  const [state, formAction, saving] = useActionState(saveOpeningBalance.bind(null, customerId), undefined);
  const v = state?.values;
  const has = amount !== 0;

  return (
    <div className="px-4 py-3 text-sm">
      <p>
        {has ? (
          <>
            <span className="font-bold">{amount < 0 ? "Credit (advance held)" : "Owed from earlier"}: {balanceLabel(Math.abs(amount))}</span>
            <span className="text-foreground/60"> · as of {date && displayDate(date)}{note && ` · ${note}`}</span>
          </>
        ) : (
          <span className="text-foreground/60">None. Add one if this customer had dues or an advance before you started using this app.</span>
        )}
      </p>

      <details className="mt-2" open={!!state?.error}>
        <summary className="cursor-pointer select-none text-sm font-semibold text-accent-ink hover:underline">
          {has ? "Change opening balance" : "+ Add opening balance"}
        </summary>
        <form action={formAction} className="mt-3 max-w-xl space-y-3">
          <fieldset className="flex flex-wrap gap-x-5 gap-y-1">
            <legend className="sr-only">Type</legend>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="direction" value="owes" defaultChecked={(v?.direction ?? (amount < 0 ? "credit" : "owes")) === "owes"} className="accent-accent" />
              Customer owes us
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="direction" value="credit" defaultChecked={(v?.direction ?? (amount < 0 ? "credit" : "owes")) === "credit"} className="accent-accent" />
              We hold their advance (credit)
            </label>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground/70">Amount (₹)</span>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={v?.amount ?? (has ? String(Math.abs(amount)) : "")}
                className={inputCls}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground/70">As of date</span>
              <input name="date" type="date" required max={maxDate} defaultValue={v?.date ?? date ?? maxDate} className={inputCls} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-foreground/70">Note (optional)</span>
            <input name="note" maxLength={200} placeholder="e.g. From old ledger book, page 12" defaultValue={v?.note ?? note} className={inputCls} />
          </label>
          <p className="text-xs text-foreground/60">
            It becomes the first entry on their account, before every bill and payment, so it&apos;s dated on or before{" "}
            {displayDate(maxDate)}. Every change is recorded in the activity history.
          </p>
          {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save opening balance"}
            </button>
            {has && (
              <button
                type="submit"
                name="intent"
                value="remove"
                formNoValidate
                disabled={saving}
                className="rounded-md border border-danger/40 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
        </form>
      </details>
    </div>
  );
}
