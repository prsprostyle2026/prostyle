import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import StaffBar from "../../components/StaffBar";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata: Metadata = {
  title: "Change password — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <ChangePasswordContent />
    </Suspense>
  );
}

async function ChangePasswordContent() {
  const me = await requireUser();
  return (
    <>
      <StaffBar user={me} />
      <main className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-8 shadow-xl">
          <h1 className="text-2xl font-black uppercase italic tracking-tight">Change password</h1>
          <p className="mt-1 text-sm text-foreground/60">
            For <span className="font-semibold text-foreground">{me}</span>
          </p>
          <ChangePasswordForm username={me} />
        </div>
      </main>
    </>
  );
}
