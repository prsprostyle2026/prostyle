// Formatting shared by server and client components.

export const money = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const rupees = (n: number) => `₹${money(n)}`;

// Pending balance as shown to staff: positive = owes us, negative = has credit.
export const balanceLabel = (pending: number) =>
  pending < 0 ? `${rupees(-pending)} credit` : rupees(pending);
