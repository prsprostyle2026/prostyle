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

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="print:hidden sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="bg-foreground py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-background">
        Launching soon &middot; Built for performance
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="relative text-sm font-semibold uppercase tracking-wider text-foreground/80 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:text-foreground hover:after:w-full"
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
            className="hidden -skew-x-12 rounded-md bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-accent-hover sm:inline-block"
          >
            <span className="inline-block skew-x-12">Get Notified</span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-foreground/5 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-foreground/10 md:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-foreground/5 py-3 text-sm font-semibold uppercase tracking-wider"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <a
                href="#notify"
                onClick={() => setOpen(false)}
                className="block rounded-md bg-accent py-3 text-center text-sm font-bold uppercase tracking-wider text-white"
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
