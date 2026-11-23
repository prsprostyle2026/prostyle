import { CONTACT_EMAIL, CONTACT_PHONES, displayPhone, telHref } from "@/lib/contact";

// Email and phone numbers as tap-to-mail / tap-to-call links.
// "light": on the always-white footer. "page": follows the page theme (light or dark mode).
const TONES = {
  light: "text-neutral-700 [&_a:hover]:text-gold-dark",
  page: "text-foreground/80 [&_a:hover]:text-accent-ink",
};

export default function ContactDetails({ className = "", tone = "light" }: { className?: string; tone?: keyof typeof TONES }) {
  return (
    <address className={`not-italic ${TONES[tone]} ${className}`}>
      <ul className="space-y-2.5 text-sm">
        <li>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-start gap-2.5 transition-colors"
          >
            <Icon>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </Icon>
            <span className="break-all">{CONTACT_EMAIL}</span>
          </a>
        </li>
        <li className="flex items-start gap-2.5">
          <Icon>
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
          </Icon>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            {CONTACT_PHONES.map((n) => (
              <a key={n} href={telHref(n)} className="whitespace-nowrap tabular-nums transition-colors">
                +91 {displayPhone(n)}
              </a>
            ))}
          </span>
        </li>
      </ul>
    </address>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="mt-0.5 h-4 w-4 shrink-0 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
