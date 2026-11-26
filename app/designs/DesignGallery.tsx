"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DESIGN_IMAGE, type Design } from "@/lib/designs";

// Grid of catalogue designs. Tapping one opens it large, with previous / next and an enquiry link.
export default function DesignGallery({ designs }: { designs: Design[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = open === null ? null : designs[open];

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const step = (by: number) => setOpen((i) => (i === null ? i : (i + by + designs.length) % designs.length));

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((d, i) => (
          <li key={d.no}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block w-full overflow-hidden rounded-xl border border-foreground/10 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Image
                src={d.src}
                alt={`Design ${d.no}, front and back`}
                width={DESIGN_IMAGE.width}
                height={DESIGN_IMAGE.height}
                sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="flex items-center justify-between border-t border-neutral-200 px-4 py-2.5 text-neutral-900">
                <span className="text-sm font-black uppercase italic tracking-tight">Design {d.no}</span>
                <span className="text-xs font-semibold text-gold-dark">View</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        aria-label={current ? `Design ${current.no}` : "Design"}
        className="m-auto w-[min(100vw-2rem,64rem)] max-w-none rounded-2xl bg-white p-0 text-neutral-900 shadow-2xl backdrop:bg-black/80"
      >
        {current && (
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <p className="text-lg font-black uppercase italic tracking-tight">
                Design {current.no} <span className="text-sm font-semibold not-italic text-neutral-500">of {designs.length}</span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-neutral-100"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <Image
                key={current.no}
                src={current.src}
                alt={`Design ${current.no}, front and back`}
                width={DESIGN_IMAGE.width}
                height={DESIGN_IMAGE.height}
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="h-auto w-full"
              />
              <NavButton side="left" onClick={() => step(-1)} />
              <NavButton side="right" onClick={() => step(1)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
              <p className="text-xs text-neutral-500">Any colours, names, numbers and logos.<span className="hidden sm:inline"> Use ← → to browse.</span></p>
              <Link
                href={`/home?design=${current.no}#enquire`}
                className="w-full rounded-md bg-gold px-5 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-black hover:bg-gold-light sm:w-auto"
              >
                Enquire about this design
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous design" : "Next design"}
      className={`absolute top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={side === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}
