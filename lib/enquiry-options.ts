// Shared by the public enquiry form, the staff follow-up form and the server actions.

// What came of an enquiry, chosen by staff when following it up.
export const ENQUIRY_RESULTS = [
  "Quotation sent",
  "Order confirmed",
  "Follow up later",
  "Not interested",
  "No response",
  "Invalid / spam",
] as const;
export type EnquiryResult = (typeof ENQUIRY_RESULTS)[number];
export const isEnquiryResult = (v: unknown): v is EnquiryResult =>
  typeof v === "string" && (ENQUIRY_RESULTS as readonly string[]).includes(v);

// Results that close an enquiry (nothing more to do).
export const CLOSED_RESULTS: readonly EnquiryResult[] = ["Order confirmed", "Not interested", "Invalid / spam"];

export const OTHER_PRODUCT = "Other / not sure";

export const LIMITS = { name: 100, email: 254, organisation: 120, product: 80, message: 2000, note: 1000 } as const;
