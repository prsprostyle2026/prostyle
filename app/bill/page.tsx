import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { logout } from "../login/actions";
import BillMaker from "./ClientBillMaker";

export const metadata: Metadata = {
  title: "Create Bill — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function BillPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <AuthorizedBill />
    </Suspense>
  );
}

async function AuthorizedBill() {
  const user = await requireUser();
  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3 px-4 pt-4 text-sm sm:px-6 print:hidden">
        <span className="text-foreground/60">
          Signed in as <span className="font-semibold text-foreground">{user}</span>
        </span>
        <form action={logout}>
          <button type="submit" className="rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/5">
            Sign out
          </button>
        </form>
      </div>
      <BillMaker />
    </>
  );
}
