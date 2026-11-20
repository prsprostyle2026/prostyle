"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { DocRecord } from "@/lib/documents";
import { rupees } from "@/lib/format";
import BillSheet from "../../bill/BillSheet";
import FitToWidth from "../../components/FitToWidth";
import { voidDocument } from "../../bill/bills";
import { COPY_LABELS, isOfferType } from "../../bill/docTypes";
import { downloadFile, pdfFileName, sheetToPdf } from "../../bill/pdf";

export default function DocumentView({
  doc,
  previousBalance,
  justSaved,
}: {
  doc: DocRecord;
  previousBalance: number;
  justSaved: boolean;
}) {
  const [copyLabel, setCopyLabel] = useState(COPY_LABELS[0]);
  const [voidState, voidAction, voiding] = useActionState(voidDocument.bind(null, doc.id), undefined);
  const activeConversion = doc.convertedTo.find((d) => !d.voided);
  const sheetBox = useRef<HTMLDivElement>(null);
  // The PDF is prepared in the background so tapping Share opens the share sheet straight
  // away (phones only allow sharing right after a tap, not after a long wait).
  const pdf = useRef<{ label: string; file: File } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const fileName = pdfFileName(doc.number, doc.customer.name);

  async function makePdf(): Promise<File> {
    const sheet = sheetBox.current?.querySelector<HTMLElement>(".bill-sheet");
    if (!sheet) throw new Error("sheet not rendered");
    const file = await sheetToPdf(sheet, fileName);
    pdf.current = { label: copyLabel, file };
    return file;
  }

  useEffect(() => {
    pdf.current = null;
    const t = setTimeout(() => void makePdf().catch(() => {}), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild only when the printed copy label changes
  }, [copyLabel]);

  async function share() {
    setShareMsg("");
    let file = pdf.current?.label === copyLabel ? pdf.current.file : null;
    if (!file) {
      setSharing(true);
      try {
        file = await makePdf();
      } catch {
        setShareMsg("Couldn't create the PDF. Please try again.");
        return;
      } finally {
        setSharing(false);
      }
    }
    const data: ShareData = { files: [file], title: `${doc.docType} ${doc.number}` };
    if (typeof navigator.canShare === "function" && navigator.canShare(data)) {
      try {
        await navigator.share(data);
      } catch (err) {
        const name = (err as Error).name;
        if (name === "AbortError") return; // closed the share sheet
        if (name === "NotAllowedError") {
          setShareMsg("The PDF is ready. Tap Share again.");
          return;
        }
        downloadFile(file);
        setShareMsg("Couldn't open sharing, so the PDF was downloaded instead.");
      }
    } else {
      downloadFile(file);
      setShareMsg("This browser can't share files, so the PDF was downloaded. Attach it from your downloads.");
    }
  }

  function print() {
    // Browsers use the page title as the default PDF file name.
    const original = document.title;
    document.title = fileName.replace(/\.pdf$/, "");
    window.print();
    document.title = original;
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 content-start gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] print:block print:max-w-none print:p-0">
      <aside className="space-y-4 print:hidden">
        <div>
          <Link href={`/customers/${doc.customerId}`} className="text-sm font-semibold text-foreground/60 hover:text-accent">
            ← {doc.customer.name}
          </Link>
          <h1 className="mt-1 text-2xl font-black uppercase italic tracking-tight">{doc.docType}</h1>
          <p className="font-mono text-sm font-semibold">{doc.number}</p>
        </div>

        {justSaved && !doc.voided && (
          <div role="status" className="rounded-xl border border-green-600/30 bg-green-600/10 p-3 text-sm">
            <p className="font-bold">Saved {doc.number}.</p>
            <p className="mt-0.5 text-foreground/70">Share the PDF with the customer or print it.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={share}
            disabled={sharing}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-accent-hover disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
            {sharing ? "Preparing…" : "Share PDF"}
          </button>
          <button
            type="button"
            onClick={print}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-accent py-3 text-sm font-bold uppercase tracking-wider text-accent hover:bg-accent/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
            </svg>
            Print
          </button>
        </div>
        {shareMsg && <p role="status" className="text-sm text-foreground/70">{shareMsg}</p>}

        {doc.voided && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
            <p className="font-bold text-accent">Cancelled</p>
            <p className="mt-1">{doc.voidReason}</p>
            <p className="mt-1 text-xs text-foreground/60">by {doc.voidedBy} on {doc.voidedAt}</p>
          </div>
        )}

        <dl className="space-y-1 rounded-xl border border-foreground/10 p-3 text-sm">
          <Row label="Total" value={rupees(doc.total)} />
          {doc.paid > 0 && <Row label="Paid" value={rupees(doc.paid)} />}
          <Row label="Created" value={`${doc.createdBy}, ${doc.createdAt}`} />
          {doc.updatedBy && <Row label="Last edited" value={`${doc.updatedBy}, ${doc.updatedAt}`} />}
          {doc.convertedFrom && (
            <Row
              label="Converted from"
              value={<Link className="text-accent hover:underline" href={`/bills/${doc.convertedFrom.id}`}>{doc.convertedFrom.docType} {doc.convertedFrom.number}</Link>}
            />
          )}
          {doc.convertedTo.map((c) => (
            <Row
              key={c.id}
              label="Converted to"
              value={
                <Link className="text-accent hover:underline" href={`/bills/${c.id}`}>
                  {c.docType} {c.number}{c.voided ? " (cancelled)" : ""}
                </Link>
              }
            />
          ))}
        </dl>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-foreground/70">Copy</span>
          <select
            value={copyLabel}
            onChange={(e) => setCopyLabel(e.target.value)}
            className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm"
          >
            {COPY_LABELS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          {!doc.voided && (
            <Link href={`/bill?edit=${doc.id}`} className="rounded-lg border border-foreground/20 py-2.5 text-center text-sm font-semibold hover:bg-foreground/5">
              Edit
            </Link>
          )}
          {!doc.voided && isOfferType(doc.docType) && !activeConversion && (
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/bill?from=${doc.id}&to=Invoice`} className="rounded-lg border border-foreground/20 py-2.5 text-center text-sm font-semibold hover:bg-foreground/5">
                → Invoice
              </Link>
              <Link href={`/bill?from=${doc.id}&to=Customer%20Bill`} className="rounded-lg border border-foreground/20 py-2.5 text-center text-sm font-semibold hover:bg-foreground/5">
                → Customer Bill
              </Link>
            </div>
          )}
          <Link href="/bill" className="py-1 text-center text-sm font-semibold text-foreground/60 hover:text-accent">
            + Create another
          </Link>
        </div>

        {!doc.voided && (
          <details className="rounded-xl border border-foreground/10 p-3" open={!!voidState?.error}>
            <summary className="cursor-pointer text-sm font-semibold text-accent">Cancel this {doc.docType.toLowerCase()}</summary>
            <form action={voidAction} className="mt-3 space-y-2">
              <p className="text-xs text-foreground/60">
                It keeps its number and stays on record marked &quot;Cancelled&quot;, but no longer counts toward the
                customer&apos;s balance or reports. This can&apos;t be undone.
              </p>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground/70">Reason</span>
                <input name="reason" required minLength={3} maxLength={300} placeholder="e.g. Wrong customer, re-issued" className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm" />
              </label>
              {voidState?.error && <p role="alert" className="text-xs font-medium text-accent">{voidState.error}</p>}
              <button type="submit" disabled={voiding} className="w-full rounded-md border border-accent py-2 text-sm font-bold text-accent hover:bg-accent/10 disabled:opacity-60">
                {voiding ? "Cancelling…" : "Cancel document"}
              </button>
            </form>
          </details>
        )}
      </aside>

      <section className="min-w-0" ref={sheetBox}>
        <FitToWidth>
        <BillSheet
          doc={{
            docType: doc.docType,
            copyLabel,
            number: doc.number,
            date: doc.date,
            dueDate: doc.dueDate,
            business: doc.business,
            customer: doc.customer,
            items: doc.items,
            applyGst: doc.applyGst,
            roundOff: doc.roundOff,
            paid: doc.paid,
            paymentNote: doc.paymentNote,
            previousBalance,
            signature: doc.signature,
            voidReason: doc.voided ? doc.voidReason : null,
          }}
        />
        </FitToWidth>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-foreground/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
