"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";

const LINKS = [
  { href: "/bill", label: "Create bill" },
  { href: "/bills", label: "Bills" },
  { href: "/customers", label: "Customers" },
  { href: "/enquiries", label: "Enquiries" },
  { href: "/reports/gst", label: "GST report" },
  { href: "/reports/received", label: "Received by" },
  { href: "/reports/signups", label: "Sign-ups" },
  { href: "/staff", label: "Staff" },
  { href: "/account/password", label: "Change password" },
];

// Staff top bar. Wide screens: links in a row. Phones: a ☰ button opens the menu.
export default function StaffNav({ user, logout }: { user: string; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = LINKS.find((l) => isActive(pathname, l.href));

  return (
    <header className="sticky top-0 z-50 border-b-2 border-gold bg-white text-neutral-900 shadow-sm print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo href="/bills" label="Prostyle staff home" className="h-8 w-auto sm:h-10" />

        {/* Phones: show where you are next to the logo */}
        <span className="min-w-0 truncate border-l border-neutral-200 pl-3 text-sm font-semibold text-neutral-600 xl:hidden">{current?.label}</span>

        <nav aria-label="Staff" className="ml-2 hidden xl:block">
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

        <div className="ml-auto hidden items-center gap-3 text-sm xl:flex">
          <span className="whitespace-nowrap text-neutral-500" title={`Signed in as ${user}`}>
            <span className="hidden 2xl:inline">Signed in as </span>
            <span className="font-semibold text-neutral-900">{user}</span>
          </span>
          <form action={logout}>
            <button type="submit" className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100">
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
          className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-neutral-100 xl:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="staff-menu" aria-label="Staff" className="border-t border-neutral-200 bg-white xl:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-3 text-base font-semibold ${
                    isActive(pathname, link.href) ? "bg-gold-soft text-gold-dark" : "text-neutral-800 hover:bg-neutral-100"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex items-center justify-between gap-3 border-t border-neutral-200 px-3 pb-2 pt-4 text-sm">
              <span className="text-neutral-500">
                Signed in as <span className="font-semibold text-neutral-900">{user}</span>
              </span>
              <form action={logout}>
                <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-100">
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
        active ? "bg-gold-soft text-gold-dark" : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
      }`}
    >
      {children}
    </Link>
  );
}
