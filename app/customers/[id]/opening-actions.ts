"use server";

import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { isUuid } from "@/lib/documents";
import { balanceLabel } from "@/lib/format";

export type OpeningState = { error?: string; values?: Record<string, string> } | undefined;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const todayIst = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const show = (amount: number, date: string | null, note: string) =>
  amount === 0 ? "none" : `${balanceLabel(amount)} as of ${date}${note ? ` (${note})` : ""}`;

// Set, change or clear a customer's opening balance (money owed, or credit held, from before
// the app was used). It becomes the first entry on their account, so every balance includes it.
export async function saveOpeningBalance(customerId: string, _prev: OpeningState, formData: FormData): Promise<OpeningState> {
  const actor = await requireUser();
  const values = {
    direction: String(formData.get("direction") ?? "owes"),
    amount: String(formData.get("amount") ?? "").trim(),
    date: String(formData.get("date") ?? ""),
    note: String(formData.get("note") ?? "").trim().slice(0, 200),
  };
  if (!isUuid(customerId)) return { error: "This customer no longer exists." };

  const remove = formData.get("intent") === "remove";
  const raw = remove || values.amount === "" ? 0 : Number(values.amount);
  if (!Number.isFinite(raw) || raw < 0 || raw >= 1e10) return { error: "Enter the amount as a number, or 0 to remove it.", values };
  if (values.direction !== "owes" && values.direction !== "credit") return { error: "Choose whether they owe us or have credit.", values };
  const amount = Math.round(raw * 100) * (values.direction === "credit" ? -1 : 1) / 100;
  const clearing = amount === 0;
  if (!clearing) {
    if (!DATE_RE.test(values.date)) return { error: "Enter the date of the opening balance.", values };
    if (values.date > todayIst()) return { error: "The opening balance date can't be in the future.", values };
  }

  const error = await withTransaction(async (db) => {
    // Same lock as saving a bill or payment, so balances stay consistent.
    const { rows } = await db.query<{ amount: number; date: string | null; note: string }>(
      `SELECT opening_balance::float8 AS amount, to_char(opening_balance_date, 'YYYY-MM-DD') AS date,
              opening_balance_note AS note
       FROM customers WHERE id = $1 FOR UPDATE`,
      [customerId],
    );
    const old = rows[0];
    if (!old) return "This customer no longer exists.";

    if (!clearing) {
      const first = await db.query<{ d: string | null }>(
        `SELECT to_char(min(entry_date), 'YYYY-MM-DD') AS d FROM customer_ledger_entries
         WHERE customer_id = $1 AND kind <> 'opening'`,
        [customerId],
      );
      const firstDate = first.rows[0].d;
      if (firstDate && values.date > firstDate) {
        return `It's a balance from before their first bill or payment (${firstDate}), so date it on or before that.`;
      }
    }

    const next = clearing ? { amount: 0, date: null, note: "" } : { amount, date: values.date, note: values.note };
    if (old.amount === next.amount && old.date === next.date && old.note === next.note) return null;

    await db.query(
      `UPDATE customers SET opening_balance = $2, opening_balance_date = $3, opening_balance_note = $4,
         updated_by = $5, updated_at = now()
       WHERE id = $1`,
      [customerId, next.amount, next.date, next.note, actor],
    );
    const pending = await db.query<{ pending: number }>(
      "SELECT pending::float8 AS pending FROM customer_balances WHERE customer_id = $1",
      [customerId],
    );
    await writeAudit(db, {
      customerId,
      entity: "customer",
      entityId: customerId,
      action: "updated",
      summary: `${clearing ? "Opening balance removed" : old.amount === 0 ? "Opening balance set" : "Opening balance changed"}; ` +
        `balance now ${balanceLabel(pending.rows[0].pending)}`,
      changes: { "Opening balance": { from: show(old.amount, old.date, old.note), to: show(next.amount, next.date, next.note) } },
      actor,
    });
    return null;
  });
  if (error) return { error, values };
  redirect(`/customers/${customerId}?opening=saved`);
}
