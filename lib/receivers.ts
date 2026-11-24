// Who took the money for a bill's payment or a separate payment. Kept in the database
// for the "Received by" report; never printed on bills, receipts or statements.
export const RECEIVERS = ["PRS", "Suresh", "Pavan", "Rambabu"] as const;
export type Receiver = (typeof RECEIVERS)[number];

export const isReceiver = (v: unknown): v is Receiver => RECEIVERS.includes(v as Receiver);
