"use client";

import dynamic from "next/dynamic";

// The bill maker uses today's date and browser-only APIs (print, file upload),
// so render it only in the browser.
const ClientBillMaker = dynamic(() => import("./BillMaker"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-sm text-foreground/60">Loading…</p>,
});

export default ClientBillMaker;
