"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Staff pages have their own top bar (StaffBar), so the shop's marketing header and
// footer are hidden there — on a phone they would take up most of the screen.
const STAFF_PREFIXES = ["/bill", "/customers", "/enquiries", "/payments", "/reports", "/staff", "/account"];

export const isStaffPath = (path: string) =>
  STAFF_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || (p === "/bill" && path.startsWith("/bills")));

export default function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isStaffPath(pathname) ? null : children;
}
