"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/bill", label: "Create bill" },
  { href: "/bills", label: "Bills" },
  { href: "/customers", label: "Customers" },
  { href: "/reports/gst", label: "GST report" },
  { href: "/staff", label: "Staff" },
  { href: "/account/password", label: "Change password" },
];

// Staff top bar. Wide screens: links in a row. Phones: a ☰ button opens the menu.
export default function StaffNav({ user, logout }: { user: string; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = LINKS.find((l) => isActive(pathname, l.href));

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/bills" className="flex shrink-0 items-center gap-2" aria-label="Prostyle staff home">
          <span aria-hidden className="flex h-8 w-8 -skew-x-12 items-center justify-center rounded-md bg-accent font-black italic text-white">
            <span className="skew-x-12">P</span>
          </span>
          <span className="hidden text-base font-black uppercase italic tracking-tight sm:inline">Prostyle</span>
        </Link>

        {/* Phones: show where you are next to the logo */}
        <span className="truncate text-sm font-semibold text-foreground/70 lg:hidden">{current?.label}</span>

        <nav aria-label="Staff" className="ml-2 hidden lg:block">
          <ul className="flex gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} active={isActive(pathname, link.href)}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-3 text-sm lg:flex">
          <span className="text-foreground/60">
            Signed in as <span className="font-semibold text-foreground">{user}</span>
          </span>
          <form action={logout}>
            <button type="submit" className="rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/5">
              Sign out
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="staff-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-foreground/5 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="staff-menu" aria-label="Staff" className="border-t border-foreground/10 lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-3 text-base font-semibold ${
                    isActive(pathname, link.href) ? "bg-accent/10 text-accent" : "hover:bg-foreground/5"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex items-center justify-between gap-3 border-t border-foreground/10 px-3 pb-2 pt-4 text-sm">
              <span className="text-foreground/60">
                Signed in as <span className="font-semibold text-foreground">{user}</span>
              </span>
              <form action={logout}>
                <button type="submit" className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-semibold hover:bg-foreground/5">
                  Sign out
                </button>
              </form>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold ${
        active ? "bg-accent/10 text-accent" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
