import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getBalanceBefore, getDocument, getPendingBalance, type DocRecord } from "@/lib/documents";
import StaffBar from "../components/StaffBar";
import type { InitialDoc } from "./BillMaker";
import BillMaker from "./ClientBillMaker";
import { isBillingType, isOfferType, type DocType } from "./docTypes";

export const metadata: Metadata = {
  title: "Create Bill — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

// /bill                     new document
// /bill?edit=<id>           edit a saved document
// /bill?from=<id>&to=Invoice convert a quotation/proforma into an Invoice or Customer Bill
export default function BillPage({ searchParams }: PageProps<"/bill">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <AuthorizedBill searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthorizedBill({ searchParams }: { searchParams: PageProps<"/bill">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : null;
  const fromId = typeof sp.from === "string" ? sp.from : null;
  const to = sp.to === "Invoice" || sp.to === "Customer Bill" ? (sp.to as DocType) : "Invoice";

  let initial: InitialDoc | undefined;
  let problem: { message: string; link?: string } | null = null;

  if (editId) {
    const doc = await getDocument(editId);
    if (!doc) problem = { message: "That document doesn't exist." };
    else if (doc.voided) problem = { message: `${doc.number} is cancelled and can't be edited.`, link: `/bills/${doc.id}` };
    else initial = toInitial(doc, "edit", doc.docType, isBillingType(doc.docType) ? await getBalanceBefore(doc.id) : 0);
  } else if (fromId) {
    const doc = await getDocument(fromId);
    const active = doc?.convertedTo.find((d) => !d.voided);
    if (!doc || !isOfferType(doc.docType)) problem = { message: "Only quotations and proformas can be converted." };
    else if (doc.voided) problem = { message: `${doc.number} is cancelled and can't be converted.`, link: `/bills/${doc.id}` };
    else if (active) problem = { message: `${doc.number} was already converted to ${active.number}.`, link: `/bills/${active.id}` };
    else initial = toInitial(doc, "convert", to, await getPendingBalance(doc.customerId));
  }

  return (
    <>
      <StaffBar user={user} />
      {problem ? (
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
          <p className="text-lg font-semibold">{problem.message}</p>
          <p className="mt-4 flex justify-center gap-4 text-sm font-semibold">
            {problem.link && <Link href={problem.link} className="text-accent-ink hover:underline">Open it</Link>}
            <Link href="/bill" className="text-accent-ink hover:underline">Create a new bill</Link>
          </p>
        </main>
      ) : (
        // key: a fresh form when switching between new / edit / convert
        <BillMaker key={`${editId ?? ""}-${fromId ?? ""}-${to}`} initial={initial} />
      )}
    </>
  );
}

function toInitial(doc: DocRecord, mode: "edit" | "convert", docType: DocType, balanceBefore: number): InitialDoc {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return {
    mode,
    id: doc.id,
    sourceLabel: `${doc.docType} ${doc.number}`,
    docType,
    number: mode === "edit" ? doc.number : "",
    financialYear: mode === "edit" ? doc.financialYear : null,
    // A conversion is a new sale, dated today.
    date: mode === "edit" ? doc.date : today,
    dueDate: mode === "edit" ? doc.dueDate : today,
    customerId: doc.customerId,
    customer: doc.customer,
    items: doc.items,
    applyGst: doc.applyGst,
    roundOff: doc.roundOff,
    paid: doc.paid,
    paymentNote: doc.paymentNote,
    business: doc.business,
    signature: doc.signature,
    balanceBefore,
  };
}
