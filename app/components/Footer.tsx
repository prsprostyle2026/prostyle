import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "./Logo";

// Placeholder links ("#") until these pages and accounts exist.
const COLUMNS = [
  {
    title: "Shop",
    links: ["Men", "Women", "Kids", "New Arrivals", "Accessories"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Sustainability", "Press"],
  },
  {
    title: "Support",
    links: ["Contact", "Shipping", "Returns", "Size Guide", "FAQ"],
  },
];

const SOCIALS: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3.5h2V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" />,
  },
  {
    label: "X",
    href: "#",
    icon: <path d="M4 4l16 16M20 4L4 20" />,
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
      </>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="print:hidden border-t border-foreground/10 bg-foreground/3">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/70">
            Performance sportswear designed to move with you, from training
            sessions to game day.
          </p>
          <ul className="mt-6 flex gap-3">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 text-foreground/70 transition-colors hover:border-accent hover:bg-accent hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    {s.icon}
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-1 lg:col-span-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((label) => (
                  <li key={label}>
                    <Link
                      href="#"
                      className="text-sm text-foreground/70 transition-colors hover:text-accent"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-foreground/60 sm:flex-row sm:px-6">
          <p>&copy; 2026 Prostyle Sports Wear. All rights reserved.</p>
          <ul className="flex gap-5">
            <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
