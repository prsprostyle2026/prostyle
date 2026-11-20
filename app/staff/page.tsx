import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUserWithRole } from "@/lib/auth";
import { query } from "@/lib/db";
import StaffBar from "../components/StaffBar";
import { setStaffActive } from "./actions";
import AddStaffForm from "./AddStaffForm";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Staff — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function StaffPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <StaffContent />
    </Suspense>
  );
}

type StaffRow = { username: string; active: boolean; isRoot: boolean; added: string };

async function StaffContent() {
  const { username: me, isRoot } = await requireUserWithRole();
  const { rows: staff } = await query<StaffRow>(
    `SELECT username, active, is_root AS "isRoot", to_char(created_at, 'DD Mon YYYY') AS added
     FROM staff_users ORDER BY is_root DESC, username`,
  );

  return (
    <>
      <StaffBar user={me} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-black uppercase italic tracking-tight">Staff</h1>
        <p className="mt-1 text-sm text-foreground/60">
          People who can sign in to create bills and manage customers.
          {!isRoot && " Only a root user can add staff, disable them or set their passwords."}
        </p>

        <div className={`mt-6 grid gap-6 ${isRoot ? "lg:grid-cols-[1fr_320px]" : ""}`}>
          <section aria-labelledby="staff-list" className="rounded-xl border border-foreground/10">
            <h2 id="staff-list" className="border-b border-foreground/10 px-4 py-3 text-sm font-bold">
              {staff.length} staff {staff.length === 1 ? "user" : "users"}
            </h2>
            <ul className="divide-y divide-foreground/10">
              {staff.map((u) => (
                <li key={u.username} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {u.username}
                        {u.isRoot && (
                          <span className="ml-2 rounded bg-foreground px-1.5 py-0.5 text-[11px] font-bold uppercase text-background">
                            Root
                          </span>
                        )}
                        {u.username === me && (
                          <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-bold uppercase text-accent">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {u.active ? "Active" : "Disabled — can't sign in"} · added {u.added}
                      </p>
                    </div>
                    {isRoot && !u.isRoot && (
                      <form action={setStaffActive}>
                        <input type="hidden" name="username" value={u.username} />
                        <input type="hidden" name="active" value={String(!u.active)} />
                        <button
                          type="submit"
                          className="rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/5"
                        >
                          {u.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                    )}
                  </div>
                  {isRoot && !u.isRoot && <ResetPasswordForm username={u.username} />}
                </li>
              ))}
            </ul>
          </section>

          {isRoot && (
            <section aria-labelledby="add-staff" className="h-fit rounded-xl border border-foreground/10 p-4">
              <h2 id="add-staff" className="text-sm font-bold">Add staff user</h2>
              <AddStaffForm />
            </section>
          )}
        </div>
      </main>
    </>
  );
}
