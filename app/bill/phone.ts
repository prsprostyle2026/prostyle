// Shared by the browser forms and the server actions.

// Accepts 10 digits, optionally prefixed with 0 or +91/91, with spaces or dashes.
export function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return (
    digits.length === 10 ||
    (digits.length === 11 && digits.startsWith("0")) ||
    (digits.length === 12 && digits.startsWith("91"))
  );
}

// Two numbers are the same customer phone when their last 10 digits match.
// Matches the customers_phone_idx expression in db/schema.sql.
export const phoneKey = (phone: string) => phone.replace(/\D/g, "").slice(-10);
