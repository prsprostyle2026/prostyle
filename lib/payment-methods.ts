// How a customer paid. Used by the bill form (advance / paid now) and Record Payment.
export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank transfer", "Cheque", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const isPaymentMethod = (v: unknown): v is PaymentMethod => PAYMENT_METHODS.includes(v as PaymentMethod);
