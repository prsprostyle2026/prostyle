import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "../components/PrintButton";
import SizeChart, { HowToMeasure } from "../components/SizeChart";
import { ALL_PRODUCTS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Size Guide: Prostyle Sports Wear",
  description: "Prostyle size chart for all sports: jerseys (short and regular cut), shorts and pants, kids 1Y to adults 4XL, in inches.",
};

const BLANK_ROWS = 22;

// Public, printable size guide: the full chart (one for every sport and product), how to measure,
// and a blank size list customers can fill in and send back with a wholesale order.
export default function SizeGuidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 print:max-w-none print:p-[10mm]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent-ink">Prostyle Sports Wear</p>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight sm:text-4xl">Size guide</h1>
          <p className="mt-2 text-foreground/70">One chart for every sport. All measurements in inches. W = width (waist for shorts and pants), L = length.</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href="/home" className="rounded-lg border border-foreground/20 px-4 py-2.5 text-sm font-semibold hover:bg-foreground/5">
            ← Products
          </Link>
          <PrintButton fileName="Prostyle size guide" />
        </div>
      </div>

      <SizeChart className="mt-8" />
      <HowToMeasure className="mt-6" />

      <section aria-labelledby="covers-heading" className="mt-10 print:hidden">
        <h2 id="covers-heading" className="text-lg font-bold">One chart for all our products</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {ALL_PRODUCTS.map((p) => (
            <li key={p.code} className="rounded-full border border-foreground/15 px-3 py-1">
              {p.name}
            </li>
          ))}
        </ul>
      </section>

      {/* Blank size list for customers to fill in and send back. Starts on a new printed page. */}
      <section aria-labelledby="list-heading" className="mt-12 print:mt-0 print:break-before-page">
        <h2 id="list-heading" className="text-lg font-bold">Order size list</h2>
        <p className="mt-1 text-sm text-foreground/60">Fill in one line per player and send it to us with your design.</p>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {["Team / organisation", "Product & fabric", "Contact number"].map((label) => (
            <div key={label}>
              <dt className="font-semibold">{label}</dt>
              <dd className="mt-5 border-b border-foreground/40" />
            </div>
          ))}
        </dl>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-lg border-collapse text-sm [&_td+td]:border-l [&_td+td]:border-foreground/20">
            <thead>
              <tr className="border-y-2 border-accent bg-accent/10 text-left">
                <th scope="col" className="w-10 px-2 py-2">#</th>
                <th scope="col" className="px-2 py-2">Name to print</th>
                <th scope="col" className="w-20 px-2 py-2">Number</th>
                <th scope="col" className="w-20 px-2 py-2">Jersey size</th>
                <th scope="col" className="w-20 px-2 py-2">Sleeve</th>
                <th scope="col" className="w-24 px-2 py-2">Shorts / pants size</th>
                <th scope="col" className="w-14 px-2 py-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: BLANK_ROWS }, (_, i) => (
                <tr key={i} className="h-9 border-b border-foreground/20">
                  <td className="px-2 text-foreground/50">{i + 1}</td>
                  <td /><td /><td /><td /><td /><td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
