// The printed A4 document. Used for the live preview while editing and for reprinting
// saved documents, so both always look the same.
import { amountInWords } from "./amountInWords";
import Image from "next/image";
import SheetLogo from "./SheetLogo";
import { computeTotals, type DocItem } from "./calc";
import type { Business, DocCustomer, DocType } from "./docTypes";
import { round2 } from "./gst";

export type SheetData = {
  docType: DocType;
  copyLabel: string;
  number: string;
  date: string; // yyyy-mm-dd
  dueDate: string;
  business: Business;
  customer: DocCustomer;
  items: DocItem[];
  applyGst: boolean;
  roundOff: boolean;
  paid: number;
  paymentNote: string;
  previousBalance: number; // printed only on a Customer Bill
  signature: string; // "" = none
  voidReason?: string | null; // set when the document is cancelled
};

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "2026-11-16" -> "16 Nov 2026"
export function displayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BillSheet({ doc }: { doc: SheetData }) {
  const { docType, business, customer } = doc;
  const t = computeTotals({
    items: doc.items,
    applyGst: doc.applyGst,
    roundOff: doc.roundOff,
    placeOfSupply: customer.placeOfSupply,
    sellerGstin: business.gstin,
  });
  const isCustomerBill = docType === "Customer Bill";
  const previousBalance = isCustomerBill ? doc.previousBalance : 0;
  const totalPayable = round2(t.total + previousBalance);
  const balanceDue = round2(totalPayable - doc.paid);

  return (
    <div className="bill-sheet relative mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white p-[12mm] text-[13px] text-neutral-800 shadow-xl ring-1 ring-black/5 print:shadow-none print:ring-0">
      {doc.voidReason != null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="-rotate-30 rounded-lg border-8 border-red-600/40 px-8 py-2 text-7xl font-black uppercase tracking-widest text-red-600/40">
            Cancelled
          </span>
        </div>
      )}
      <SheetLogo />
      <div className="flex items-start justify-between">
        <p className="text-lg font-bold uppercase tracking-[0.3em] text-gold-dark">{docType}</p>
        <p className="pt-1 text-[11px] font-medium tracking-wider text-neutral-500">{doc.copyLabel}</p>
      </div>

      <div className="pr-[50mm]">
        <h2 className="mt-3 text-2xl font-bold text-neutral-900">{business.name}</h2>
        <p className="text-[12px]">
          <span className="font-semibold">GSTIN</span> <span className="font-bold">{business.gstin}</span>
        </p>
        <p className="leading-snug">{business.address1}</p>
        <p className="leading-snug">{business.address2}</p>
        <p className="leading-snug">{business.address3}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 text-[12px]">
        <p><span className="font-semibold">{docType} #:</span> <span className="text-[14px] font-bold">{doc.number}</span></p>
        <p><span className="font-semibold">{docType} Date:</span> <span className="text-[14px] font-bold">{displayDate(doc.date)}</span></p>
        <p><span className="font-semibold">{docType === "Quotation" ? "Validity" : "Due Date"}:</span> <span className="text-[14px]">{displayDate(doc.dueDate)}</span></p>
      </div>

      <p className="mt-4 text-[12px] font-semibold">Customer Details:</p>
      <p className="mt-1 font-bold">{customer.name || "—"}</p>
      {customer.gstin && <p className="text-[12px]"><span className="font-semibold">GSTIN</span> {customer.gstin}</p>}
      {customer.details && <p className="whitespace-pre-line text-[12px]">{customer.details}</p>}
      {customer.phone && <p className="text-[12px]"><span className="font-semibold">Ph:</span> {customer.phone}</p>}
      {customer.email && <p className="text-[12px]"><span className="font-semibold">Email:</span> {customer.email}</p>}
      <p className="mt-3 text-[12px] font-semibold">Place of Supply:</p>
      <p className="font-bold">{customer.placeOfSupply}</p>

      <table className="mt-4 w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-y border-gold bg-gold-soft">
            <th className="w-7 py-1.5 pl-2 text-left font-semibold">#</th>
            <th className="py-1.5 text-left font-semibold">Item</th>
            <th className="w-24 py-1.5 text-right font-semibold">Rate / Item</th>
            <th className="w-14 py-1.5 text-center font-semibold">Qty</th>
            {doc.applyGst && (
              <>
                <th className="w-24 py-1.5 text-right font-semibold">Taxable Value</th>
                <th className="w-24 py-1.5 text-right font-semibold">Tax Amount</th>
              </>
            )}
            <th className="w-28 py-1.5 pr-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-200">
              <td className="py-2 pl-2 align-middle">{i + 1}</td>
              <td className="py-2">
                <p className="text-[13px] font-semibold text-neutral-900">{r.name}</p>
                {r.hsn && <p className="text-[11px] text-neutral-600">HSN: {r.hsn}</p>}
              </td>
              <td className="py-2 text-right font-semibold">{money(r.rate)}</td>
              <td className="py-2 text-center">{r.qty}</td>
              {doc.applyGst && (
                <>
                  <td className="py-2 text-right">{money(r.taxable)}</td>
                  <td className="py-2 text-right">
                    {money(r.tax)}
                    <span className="block text-[10px] text-neutral-500">({r.gstRate}%)</span>
                  </td>
                </>
              )}
              <td className="py-2 pr-2 text-right">{money(r.amount)}</td>
            </tr>
          ))}
          {t.rows.length === 0 && (
            <tr className="border-b border-neutral-200">
              <td colSpan={doc.applyGst ? 7 : 5} className="py-6 text-center text-neutral-400 print:hidden">
                Add items in the form to see them here
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-2 flex justify-end">
        <div className="w-64 text-[12px]">
          {(t.taxLines.length > 0 || t.roundOffAmount !== 0) && (
            <dl className="mb-1 space-y-0.5">
              <SummaryRow label="Taxable Amount" value={`₹${money(t.taxableTotal)}`} />
              {t.taxLines.map((l) => (
                <SummaryRow key={l.label} label={l.label} value={`₹${money(l.amount)}`} />
              ))}
              {t.roundOffAmount !== 0 && (
                <SummaryRow
                  label="Round Off"
                  value={`${t.roundOffAmount > 0 ? "+" : "-"}₹${money(Math.abs(t.roundOffAmount))}`}
                />
              )}
            </dl>
          )}
          <div className="flex items-baseline justify-between border-t border-neutral-300 pt-1 text-lg font-bold text-neutral-900">
            <span>Total</span>
            <span>₹{money(t.total)}</span>
          </div>
          {isCustomerBill ? (
            <>
              <dl className="mt-1 space-y-0.5">
                {previousBalance !== 0 && (
                  <>
                    <SummaryRow
                      label={previousBalance < 0 ? "Previous Credit" : "Previous Balance"}
                      value={`${previousBalance < 0 ? "-" : "+"}₹${money(Math.abs(previousBalance))}`}
                    />
                    <div className="flex justify-between font-semibold text-neutral-900">
                      <dt>Total Payable</dt>
                      <dd>₹{money(totalPayable)}</dd>
                    </div>
                  </>
                )}
                {doc.paid > 0 && (
                  <SummaryRow
                    label={doc.paymentNote ? `Paid (${doc.paymentNote})` : "Paid"}
                    value={`-₹${money(doc.paid)}`}
                  />
                )}
              </dl>
              <div className="mt-1 flex items-baseline justify-between border-t border-neutral-300 pt-1 text-base font-bold text-gold-dark">
                <span>{balanceDue < 0 ? "Credit Balance" : "Balance Due"}</span>
                <span>₹{money(Math.abs(balanceDue))}</span>
              </div>
            </>
          ) : (
            doc.paid > 0 && (
              <>
                <dl className="mt-1 space-y-0.5">
                  <SummaryRow
                    label={doc.paymentNote ? `Advance Paid (${doc.paymentNote})` : "Advance Paid"}
                    value={`-₹${money(doc.paid)}`}
                  />
                </dl>
                <div className="mt-1 flex items-baseline justify-between border-t border-neutral-300 pt-1 text-base font-bold text-gold-dark">
                  <span>{balanceDue < 0 ? "Excess Paid" : "Balance Due"}</span>
                  <span>₹{money(Math.abs(balanceDue))}</span>
                </div>
              </>
            )
          )}
        </div>
      </div>
      <div className="mt-1 flex justify-between gap-4 border-b border-gold pb-1 text-[11px]">
        <span className="shrink-0 pl-2">Total Items / Qty : {t.rows.length} / {t.totalQty}</span>
        <span className="text-right">Total amount (in words): {amountInWords(t.total)}</span>
      </div>

      <div className="mt-6 flex justify-between gap-6">
        <div>
          <p className="text-[12px] font-semibold">Bank Details:</p>
          <dl className="mt-1 grid grid-cols-[9rem_1fr] gap-y-1 text-[12px]">
            <dt>Bank:</dt><dd className="font-semibold">{business.bank}</dd>
            <dt>Account Holder:</dt><dd className="font-semibold">{business.accountHolder}</dd>
            <dt>Account #:</dt><dd className="font-semibold">{business.accountNumber}</dd>
            <dt>IFSC Code:</dt><dd className="font-semibold">{business.ifsc}</dd>
            <dt>Branch:</dt><dd className="font-semibold">{business.branch}</dd>
          </dl>
        </div>
        {/* Payment QR (HDFC SmartHub: UPI and cards) on every document type. Vector (SVG), rebuilt from the bank QR's
            data, so it stays sharp in print and in the shared PDF. */}
        <div className="flex shrink-0 flex-col items-center text-center text-[11px]">
          <Image
            src="/prostyle-qr.svg"
            alt="Scan to pay Prostyle Sports Wear"
            width={65}
            height={65}
            loading="eager"
            unoptimized
            className="h-[36mm] w-[36mm]"
          />
          <p className="font-semibold">Scan &amp; pay</p>
          <p className="text-neutral-600">UPI / Cards</p>
        </div>
        <div className="flex w-52 shrink-0 flex-col items-center text-[12px]">
          <p className="text-neutral-600">For {business.name}</p>
          <div className="flex h-24 w-full items-center justify-center">
            {doc.signature ? (
              // eslint-disable-next-line @next/next/no-img-element -- may be a user-uploaded data URL
              <img src={doc.signature} alt="Authorized signature" className="max-h-22 max-w-full object-contain" />
            ) : (
              <span className="text-[11px] text-neutral-300 print:hidden">Signature / stamp</span>
            )}
          </div>
          <p className="text-neutral-600">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-600">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
