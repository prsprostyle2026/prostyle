import type { Metadata } from "next";
import Link from "next/link";
import { DESIGN_TERMS, DESIGNS } from "@/lib/designs";
import DesignGallery from "./DesignGallery";

export const metadata: Metadata = {
  title: "Design Catalogue: Prostyle Sports Wear",
  description: `${DESIGNS.length} ready-made sublimation jersey designs from Prostyle Sports Wear. Pick one and we'll print it in your colours with your names, numbers and logos.`,
};

// Public design catalogue: every design from the Prostyle catalogue PDF.
export default function DesignsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent-ink">Prostyle Sports Wear</p>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight sm:text-4xl">Design catalogue</h1>
          <p className="mt-2 text-foreground/70">
            {DESIGNS.length} ready-made sublimation designs. Pick one and we&apos;ll print it in your team or company
            colours, with names, numbers and logos, on any of our fabrics. Each design shows the front and back.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/home" className="rounded-lg border border-foreground/20 px-4 py-2.5 text-sm font-semibold hover:bg-foreground/5">
            ← Products
          </Link>
          <Link href="/home#enquire" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover">
            Get a quote
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <DesignGallery designs={DESIGNS} />
      </div>

      <p className="mt-8 text-xs text-foreground/60">
        <span className="font-semibold">Terms &amp; conditions:</span> {DESIGN_TERMS}
      </p>
      <p className="mt-2 text-sm text-foreground/70">
        Don&apos;t see what you want? Send us your own design or idea and we&apos;ll make a mock-up.{" "}
        <Link href="/home#enquire" className="font-semibold text-accent-ink hover:underline">
          Send an enquiry
        </Link>
      </p>
    </main>
  );
}
