"use server";

import { isValidPhone } from "@/app/bill/phone";
import { PRODUCTS } from "@/lib/catalog";
import { query } from "@/lib/db";
import { LIMITS, OTHER_PRODUCT } from "@/lib/enquiry-options";

export type EnquiryState =
  | { ok: true; name: string }
  | { ok: false; error: string; values: Record<string, string> }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PRODUCT_NAMES = new Set([...PRODUCTS.map((p) => p.name), OTHER_PRODUCT]);

// Saves a wholesale enquiry from the public /home page. Staff see it at /enquiries.
export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const get = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const values = {
    name: get("name", LIMITS.name),
    phone: get("phone", 20),
    email: get("email", LIMITS.email),
    organisation: get("organisation", LIMITS.organisation),
    product: get("product", LIMITS.product),
    quantity: get("quantity", 10),
    message: get("message", LIMITS.message),
  };

  // Hidden "website" field: people never see it, bots fill it in. Pretend it worked.
  if (String(formData.get("website") ?? "") !== "") return { ok: true, name: values.name };

  const fail = (error: string): EnquiryState => ({ ok: false, error, values });
  if (!values.name) return fail("Please enter your name.");
  if (!isValidPhone(values.phone)) return fail("Please enter a valid 10-digit mobile number.");
  if (values.email && !EMAIL_RE.test(values.email)) return fail("Please check the email address, or leave it blank.");
  if (values.product && !PRODUCT_NAMES.has(values.product)) return fail("Please choose a product from the list.");
  const quantity = values.quantity === "" ? null : Number(values.quantity);
  if (quantity !== null && !(Number.isInteger(quantity) && quantity >= 1 && quantity <= 1_000_000)) {
    return fail("Enter the quantity as a whole number, or leave it blank.");
  }

  try {
    await query(
      `INSERT INTO enquiries (name, phone, email, organisation, product, quantity, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [values.name, values.phone, values.email, values.organisation, values.product, quantity, values.message],
    );
  } catch (err) {
    console.error("enquiry save failed", err);
    return fail("Sorry, something went wrong. Please try again, or call us.");
  }
  return { ok: true, name: values.name };
}
