// Document types, numbering and seller defaults. Shared by browser and server.

export const DOC_TYPES = ["Quotation", "Proforma Invoice", "Invoice", "Customer Bill"] as const;
export type DocType = (typeof DOC_TYPES)[number];

// Invoices and Customer Bills are sales: they add to the customer's balance.
// Quotations and Proformas are offers: saved and printable, but not on the account
// until converted into an Invoice or Customer Bill.
export type BillingDocType = "Invoice" | "Customer Bill";
export const isBillingType = (t: unknown): t is BillingDocType => t === "Invoice" || t === "Customer Bill";
export const isOfferType = (t: unknown): t is "Quotation" | "Proforma Invoice" =>
  t === "Quotation" || t === "Proforma Invoice";
export const isDocType = (t: unknown): t is DocType => DOC_TYPES.includes(t as DocType);

export const NUMBER_PREFIX: Record<DocType, string> = {
  Quotation: "EST",
  "Proforma Invoice": "PI",
  Invoice: "INV",
  "Customer Bill": "BILL",
};

// Indian financial year (April–March) for a yyyy-mm-dd date: "2026-11-20" -> "2026-27".
export function financialYear(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

// "INV/2026-27/004" — at most 16 characters, as GST requires for invoice numbers.
export const formatDocNumber = (t: DocType, fy: string, seq: number) =>
  `${NUMBER_PREFIX[t]}/${fy}/${String(seq).padStart(3, "0")}`;

export type Business = {
  name: string;
  gstin: string;
  address1: string;
  address2: string;
  address3: string;
  bank: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
};

// Defaults taken from EST-7. Edit here to change what every new document starts with.
export const DEFAULT_BUSINESS: Business = {
  name: "PROSTYLE SPORTS WEAR",
  gstin: "29ABJFP8990N1Z0",
  address1: "CN 83/131, GROUND FLOOR",
  address2: "RAMNAIKANAHALLI, KATHRIGUPPE ROAD,OPPOSITE BANASHANKARI BRICKS, Bengaluru",
  address3: "Bengaluru Urban, KARNATAKA, 562125",
  bank: "HDFC Bank",
  accountHolder: "PROSTYLE SPORTS WEAR",
  accountNumber: "50200124091058",
  ifsc: "HDFC0009233",
  branch: "DAIRY CIRCLE ROAD",
};

export const BUSINESS_LABELS: Record<keyof Business, string> = {
  name: "Business name",
  gstin: "GSTIN",
  address1: "Address line 1",
  address2: "Address line 2",
  address3: "Address line 3",
  bank: "Bank",
  accountHolder: "Account holder",
  accountNumber: "Account number",
  ifsc: "IFSC code",
  branch: "Branch",
};

// Stamp/signature shown above "Authorized Signatory". Replace public/signature.png to change it.
export const DEFAULT_SIGNATURE = "/signature.png";

export const COPY_LABELS = ["ORIGINAL FOR RECIPIENT", "DUPLICATE FOR TRANSPORTER", "TRIPLICATE FOR SUPPLIER"];

export type DocCustomer = {
  name: string;
  gstin: string;
  phone: string;
  email: string;
  details: string;
  placeOfSupply: string;
};
