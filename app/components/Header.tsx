"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

// Shop pages don't exist yet, so these point to "#" until they launch.
const NAV_LINKS = [
  { label: "Men", href: "#" },
  { label: "Women", href: "#" },
  { label: "Kids", href: "#" },
  { label: "Collections", href: "#" },
  { label: "About", href: "#" },
];

// Public site header. White bar (the logo is made for a light background) with gold accents.
// Colours are fixed so it looks the same in light and dark mode.
export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="print:hidden sticky top-0 z-50 border-b-2 border-gold bg-white text-neutral-900 shadow-sm">
      <div className="bg-neutral-950 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-gold-light">
        Launching soon &middot; Built for performance
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Logo className="h-9 w-auto sm:h-12" />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="relative text-sm font-bold uppercase tracking-wider text-neutral-700 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all hover:text-black hover:after:w-full"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#notify"
            className="hidden -skew-x-12 rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-gold-light lg:inline-block"
          >
            <span className="inline-block skew-x-12">Get Notified</span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-neutral-900 hover:bg-neutral-100 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-neutral-200 bg-white lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-neutral-100 py-3 text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-gold-dark"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <a
                href="#notify"
                onClick={() => setOpen(false)}
                className="block rounded-md bg-gold py-3 text-center text-sm font-bold uppercase tracking-wider text-black"
              >
                Get Notified
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
