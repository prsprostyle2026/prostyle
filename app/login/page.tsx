import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-8 shadow-xl">
        <h1 className="text-2xl font-black uppercase italic tracking-tight">Staff sign in</h1>
        <p className="mt-1 text-sm text-foreground/60">Sign in to create bills.</p>
        <LoginForm />
      </div>
    </main>
  );
}
