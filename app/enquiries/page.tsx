import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { telHref } from "@/lib/contact";
import { ENQUIRY_FILTERS, getEnquiries, getEnquiryCounts, isEnquiryFilter, type Enquiry } from "@/lib/enquiries";
import { CLOSED_RESULTS, type EnquiryResult } from "@/lib/enquiry-options";
import { requireUser } from "@/lib/auth";
import StaffBar from "../components/StaffBar";
import StatTiles from "../components/StatTiles";
import FollowUpForm from "./FollowUpForm";

export const metadata: Metadata = {
  title: "Enquiries: Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function EnquiriesPage({ searchParams }: PageProps<"/enquiries">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <EnquiriesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function EnquiriesContent({ searchParams }: { searchParams: PageProps<"/enquiries">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter = isEnquiryFilter(sp.show) ? sp.show : "new";
  const [enquiries, counts] = await Promise.all([getEnquiries(filter), getEnquiryCounts()]);

  return (
    <>
      <StaffBar user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-black uppercase italic tracking-tight">Enquiries</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Wholesale enquiries from the website. Call each one back, then record who attended it and the result.
        </p>

        <StatTiles
          tiles={[
            { label: "New (not attended)", value: counts.new, strong: counts.new > 0 },
            { label: "In progress", value: counts.open },
            { label: "Orders confirmed", value: counts.orders },
            { label: "All enquiries", value: counts.all },
          ]}
        />

        <nav aria-label="Filter enquiries" className="mt-6 flex flex-wrap gap-2">
          {ENQUIRY_FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "new" ? "/enquiries" : `/enquiries?show=${f.key}`}
              aria-current={f.key === filter ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                f.key === filter ? "border-accent bg-accent text-accent-foreground" : "border-foreground/15 hover:bg-foreground/5"
              }`}
            >
              {f.label} ({counts[f.key]})
            </Link>
          ))}
        </nav>

        {enquiries.length === 0 ? (
          <p className="mt-6 rounded-xl border border-foreground/10 px-4 py-10 text-center text-sm text-foreground/60">
            {filter === "new" ? "No new enquiries. You're all caught up." : "No enquiries here."}
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {enquiries.map((e) => (
              <EnquiryCard key={e.id} e={e} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function EnquiryCard({ e }: { e: Enquiry }) {
  const digits = e.phone.replace(/\D/g, "").slice(-10);
  const closed = e.result !== null && CLOSED_RESULTS.includes(e.result as EnquiryResult);
  const status = !e.attendedBy ? "New" : closed ? e.result! : e.result ?? "Attended";

  return (
    <li className="rounded-xl border border-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-foreground/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-base font-bold">
            {e.name}
            {e.organisation && <span className="font-normal text-foreground/60"> · {e.organisation}</span>}
          </p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <a href={telHref(digits)} className="font-semibold text-accent-ink hover:underline">
              {e.phone}
            </a>
            <a href={`https://wa.me/91${digits}`} target="_blank" rel="noopener noreferrer" className="text-accent-ink hover:underline">
              WhatsApp
            </a>
            {e.email && (
              <a href={`mailto:${e.email}`} className="break-all text-accent-ink hover:underline">
                {e.email}
              </a>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
              !e.attendedBy ? "bg-accent text-accent-foreground" : closed ? "bg-foreground/10 text-foreground/70" : "bg-accent/15 text-accent-ink"
            }`}
          >
            {status}
          </span>
          <p className="text-xs text-foreground/60 sm:mt-1">{e.createdAt}</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3 text-sm">
        {(e.product || e.quantity) && (
          <p>
            {e.product && <><span className="text-foreground/60">Product:</span> <span className="font-semibold">{e.product}</span></>}
            {e.product && e.quantity && <span className="text-foreground/40"> · </span>}
            {e.quantity && <><span className="text-foreground/60">Qty:</span> <span className="font-semibold">{e.quantity}</span></>}
          </p>
        )}
        {e.message && <p className="whitespace-pre-line rounded-md bg-foreground/3 px-3 py-2">{e.message}</p>}
        {e.attendedBy && (
          <p className="text-xs text-foreground/60">
            Attended by <span className="font-semibold text-foreground">{e.attendedBy}</span>
            {e.attendedAt && `, ${e.attendedAt}`}
          </p>
        )}

        <FollowUpForm id={e.id} attendedBy={e.attendedBy} result={e.result} resultNote={e.resultNote} />

        <details className="text-xs">
          <summary className="cursor-pointer select-none text-foreground/60 hover:text-foreground">History ({e.history.length})</summary>
          {e.history.length === 0 ? (
            <p className="mt-1.5 text-foreground/60">No changes yet.</p>
          ) : (
            <ol className="mt-1.5 space-y-1.5 border-l-2 border-gold/40 pl-3">
              {e.history.map((a, i) => (
                <li key={i}>
                  <p>{a.summary}</p>
                  <p className="text-foreground/60">
                    <span className="font-semibold text-foreground">{a.actor}</span> · {a.at}
                  </p>
                  {a.changes && (
                    <ul className="mt-0.5 text-foreground/70">
                      {Object.entries(a.changes).map(([field, c]) => (
                        <li key={field}>
                          {field}: {show(c.from)} → {show(c.to)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </details>
      </div>
    </li>
  );
}

const show = (v: unknown) => (v === null || v === "" || v === undefined ? "—" : String(v));
