import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getSignups } from "@/lib/signups";
import StaffBar from "../../components/StaffBar";

export const metadata: Metadata = {
  title: "Notify me sign-ups — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function SignupsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <SignupsContent />
    </Suspense>
  );
}

async function SignupsContent() {
  const me = await requireUser();
  const signups = await getSignups();

  return (
    <>
      <StaffBar user={me} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tight">Sign-ups</h1>
            <p className="mt-1 text-sm text-foreground/60">
              People who asked to be told when the shop launches, from the &ldquo;Notify me&rdquo; form on the home page.
            </p>
          </div>
          {signups.length > 0 && (
            <a
              href="/reports/signups/export"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover"
            >
              Download CSV
            </a>
          )}
        </div>

        <section aria-labelledby="signup-list" className="mt-6 rounded-xl border border-foreground/10">
          <h2 id="signup-list" className="border-b border-foreground/10 px-4 py-3 text-sm font-bold">
            {signups.length} {signups.length === 1 ? "sign-up" : "sign-ups"}
          </h2>
          {signups.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-foreground/60">No one has signed up yet.</p>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {signups.map((s) => (
                <li key={s.email} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <a href={`mailto:${s.email}`} className="break-all font-semibold hover:text-accent-ink hover:underline">
                    {s.email}
                  </a>
                  <span className="shrink-0 text-xs text-foreground/60">{s.signedUp}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
