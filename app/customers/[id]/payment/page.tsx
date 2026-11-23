import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getCustomerSummary } from "@/lib/customer-data";
import { balanceLabel } from "@/lib/format";
import StaffBar from "../../../components/StaffBar";
import PaymentForm from "./PaymentForm";

export const metadata: Metadata = {
  title: "Record payment — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function PaymentPage({ params }: PageProps<"/customers/[id]/payment">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <PaymentContent params={params} />
    </Suspense>
  );
}

async function PaymentContent({ params }: { params: PageProps<"/customers/[id]/payment">["params"] }) {
  const me = await requireUser();
  const { id } = await params;
  const customer = await getCustomerSummary(id);
  if (!customer) notFound();

  return (
    <>
      <StaffBar user={me} />
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link href={`/customers/${id}`} className="text-sm font-semibold text-foreground/60 hover:text-accent-ink">
            ← {customer.name}
          </Link>
          <div className="mt-2 rounded-2xl border border-foreground/10 bg-background p-6 shadow-xl sm:p-8">
            <h1 className="text-2xl font-black uppercase italic tracking-tight">Record payment</h1>
            <p className="mt-1 text-sm text-foreground/60">
              From <span className="font-semibold text-foreground">{customer.name}</span>
              {customer.phone && ` · ${customer.phone}`}
            </p>
            <div className="mt-4 flex items-baseline justify-between rounded-md bg-foreground/5 px-3 py-2 text-sm">
              <span>Pending balance now</span>
              <span className={`font-bold ${customer.pending > 0 ? "text-accent-ink" : ""}`}>
                {balanceLabel(customer.pending)}
              </span>
            </div>
            <PaymentForm
              customerId={id}
              pending={customer.pending}
              today={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}
            />
          </div>
        </div>
      </main>
    </>
  );
}
