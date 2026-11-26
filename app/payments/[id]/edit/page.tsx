import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getCustomerSummary } from "@/lib/customer-data";
import { getPayment, receiptNumber } from "@/lib/documents";
import { balanceLabel } from "@/lib/format";
import StaffBar from "../../../components/StaffBar";
import PaymentForm from "../../../customers/[id]/payment/PaymentForm";

export const metadata: Metadata = {
  title: "Edit payment — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function EditPaymentPage({ params }: PageProps<"/payments/[id]/edit">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <EditPaymentContent params={params} />
    </Suspense>
  );
}

async function EditPaymentContent({ params }: { params: PageProps<"/payments/[id]/edit">["params"] }) {
  const me = await requireUser();
  const { id } = await params;
  const p = await getPayment(id);
  if (!p) notFound();
  if (p.voided) redirect(`/payments/${id}`); // cancelled payments can't be edited
  const customer = await getCustomerSummary(p.customerId);
  if (!customer) notFound();
  // The customer's balance as if this payment hadn't been made, so "balance after" is right.
  const before = Math.round((customer.pending + p.amount) * 100) / 100;

  return (
    <>
      <StaffBar user={me} />
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link href={`/payments/${id}`} className="text-sm font-semibold text-foreground/60 hover:text-accent-ink">
            ← Receipt {receiptNumber(id)}
          </Link>
          <div className="mt-2 rounded-2xl border border-foreground/10 bg-background p-6 shadow-xl sm:p-8">
            <h1 className="text-2xl font-black uppercase italic tracking-tight">Edit payment</h1>
            <p className="mt-1 text-sm text-foreground/60">
              From <span className="font-semibold text-foreground">{customer.name}</span>
              {customer.phone && ` · ${customer.phone}`}
            </p>
            <div className="mt-4 flex items-baseline justify-between rounded-md bg-foreground/5 px-3 py-2 text-sm">
              <span>Balance without this payment</span>
              <span className={`font-bold ${before > 0 ? "text-accent-ink" : ""}`}>{balanceLabel(before)}</span>
            </div>
            <PaymentForm
              customerId={p.customerId}
              pending={before}
              today={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}
              payment={{ id: p.id, amount: p.amount, paidOn: p.paidOn, method: p.method, receivedBy: p.receivedBy, note: p.note }}
            />
            <p className="mt-4 text-xs text-foreground/60">
              Changes are saved in the customer&apos;s history with your name.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
