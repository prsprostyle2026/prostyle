const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (!hundreds) return twoDigits(rest);
  return `${ONES[hundreds]} Hundred${rest ? ` And ${twoDigits(rest)}` : ""}`;
}

// Indian numbering system: crore / lakh / thousand / hundred.
function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor(n / 1e5) % 100;
  const thousand = Math.floor(n / 1e3) % 100;
  const rest = n % 1000;
  if (crore) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(", ");
}

// e.g. 198160 -> "INR One Lakh, Ninety-Eight Thousand, One Hundred And Sixty Rupees Only."
export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = `INR ${integerToWords(rupees)} Rupees`;
  if (paise) words += ` And ${twoDigits(paise)} Paise`;
  return `${words} Only.`;
}
