import type { Metadata } from "next";
import SheetLogo from "@/app/bill/SheetLogo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { amountInWords } from "@/app/bill/amountInWords";
import { displayDate } from "@/app/bill/BillSheet";
import { DEFAULT_BUSINESS } from "@/app/bill/docTypes";
import { requireUser } from "@/lib/auth";
import { getPayment, receiptNumber } from "@/lib/documents";
import { balanceLabel, rupees } from "@/lib/format";
import FitToWidth from "../../components/FitToWidth";
import PrintButton from "../../components/PrintButton";
import StaffBar from "../../components/StaffBar";
import VoidPaymentForm from "./VoidPaymentForm";

export const metadata: Metadata = {
  title: "Payment receipt — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function ReceiptPage({ params, searchParams }: PageProps<"/payments/[id]">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <ReceiptContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ReceiptContent({
  params,
  searchParams,
}: {
  params: PageProps<"/payments/[id]">["params"];
  searchParams: PageProps<"/payments/[id]">["searchParams"];
}) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const p = await getPayment(id);
  if (!p) notFound();
  const business = DEFAULT_BUSINESS;
  const no = receiptNumber(p.id);

  return (
    <>
      <StaffBar user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:p-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/customers/${p.customerId}`} className="text-sm font-semibold text-foreground/60 hover:text-accent-ink">
            ← {p.customerName}
          </Link>
          <PrintButton fileName={`${no}_${p.customerName.replace(/\s+/g, "_")}`} autoPrint={sp.print === "1" && !p.voided} />
        </div>

        {p.voided && (
          <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm print:hidden">
            <p className="font-bold text-danger">This payment was cancelled</p>
            <p className="mt-1">{p.voidReason}</p>
            <p className="mt-1 text-xs text-foreground/60">by {p.voidedBy} on {p.voidedAt}</p>
          </div>
        )}

        <FitToWidth>
          <div className="bill-sheet relative mx-auto w-[210mm] bg-white p-[12mm] text-[13px] text-neutral-800 shadow-xl ring-1 ring-black/5 print:shadow-none print:ring-0">
            {p.voided && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <span className="-rotate-12 rounded-lg border-8 border-red-600/40 px-8 py-2 text-6xl font-black uppercase tracking-widest text-red-600/40">
                  Cancelled
                </span>
              </div>
            )}
            <SheetLogo />
            <p className="text-lg font-bold uppercase tracking-[0.3em] text-gold-dark">Payment Receipt</p>
            <div className="pr-[50mm]">
              <h2 className="mt-3 text-2xl font-bold text-neutral-900">{business.name}</h2>
              <p className="text-[12px]"><span className="font-semibold">GSTIN</span> <span className="font-bold">{business.gstin}</span></p>
              <p className="leading-snug">{business.address1}</p>
              <p className="leading-snug">{business.address2}</p>
              <p className="leading-snug">{business.address3}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-y-1 text-[12px]">
              <p><span className="font-semibold">Receipt #:</span> <span className="text-[14px] font-bold">{no}</span></p>
              <p className="text-right"><span className="font-semibold">Date:</span> <span className="text-[14px] font-bold">{displayDate(p.paidOn)}</span></p>
            </div>

            <div className="mt-6 space-y-3 border-y border-gold py-5 text-[14px]">
              <p>
                Received with thanks from <span className="font-bold">{p.customerName}</span>
                {p.customerPhone && <span className="text-neutral-600"> ({p.customerPhone})</span>}
              </p>
              <p>
                the sum of <span className="font-bold">{amountInWords(p.amount)}</span>
              </p>
              <p>
                by <span className="font-bold">{p.method}</span>
                {p.note && <> — {p.note}</>}
              </p>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div className="text-[12px]">
                {p.balanceAfter !== null && (
                  <p>
                    <span className="font-semibold">Balance after this payment:</span> {balanceLabel(p.balanceAfter)}
                  </p>
                )}
                <p className="mt-1 text-neutral-500">Recorded by {p.createdBy}, {p.createdAt}</p>
              </div>
              <div className="rounded-lg border-2 border-gold px-5 py-2 text-2xl font-bold text-gold-dark">{rupees(p.amount)}</div>
            </div>

            <div className="mt-12 flex justify-end text-[12px]">
              <div className="flex w-52 flex-col items-center">
                <p className="text-neutral-600">For {business.name}</p>
                <div className="flex h-20 w-full items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static stamp image */}
                  <img src="/signature.png" alt="Authorized signature" className="max-h-18 max-w-full object-contain" />
                </div>
                <p className="text-neutral-600">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </FitToWidth>

        {!p.voided && <VoidPaymentForm paymentId={p.id} />}
      </main>
    </>
  );
}
