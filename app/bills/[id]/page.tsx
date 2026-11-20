import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getBalanceBefore, getDocument } from "@/lib/documents";
import StaffBar from "../../components/StaffBar";
import DocumentView from "./DocumentView";

export const metadata: Metadata = {
  title: "Document — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function DocumentPage({ params, searchParams }: PageProps<"/bills/[id]">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <DocumentContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function DocumentContent({
  params,
  searchParams,
}: {
  params: PageProps<"/bills/[id]">["params"];
  searchParams: PageProps<"/bills/[id]">["searchParams"];
}) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const doc = await getDocument(id);
  if (!doc) notFound();
  // A Customer Bill prints the customer's balance just before it, worked out from the ledger.
  const previousBalance = doc.docType === "Customer Bill" ? await getBalanceBefore(doc.id) : 0;

  return (
    <>
      <StaffBar user={user} />
      <DocumentView doc={doc} previousBalance={previousBalance} justSaved={sp.saved === "1"} />
    </>
  );
}
