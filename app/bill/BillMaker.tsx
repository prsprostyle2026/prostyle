"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { amountInWords } from "./amountInWords";
import CustomerPicker from "./CustomerPicker";
import { GST_RATE_SUGGESTIONS, STATES, round2, taxBreakup } from "./gst";

type DocType = "Quotation" | "Invoice" | "Proforma Invoice";

type Item = { id: number; name: string; hsn: string; rate: string; qty: string; gst: string };

type Business = {
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

// Defaults taken from EST-7. Edit here to change what every new bill starts with.
const DEFAULT_BUSINESS: Business = {
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

// Stamp/signature shown above "Authorized Signatory". Replace public/signature.png to change it.
const DEFAULT_SIGNATURE = "/signature.png";

// GST % each new item starts with.
const DEFAULT_GST_RATE = "5";

const COPY_LABELS = [
  "ORIGINAL FOR RECIPIENT",
  "DUPLICATE FOR TRANSPORTER",
  "TRIPLICATE FOR SUPPLIER",
];

const NUMBER_PREFIX: Record<DocType, string> = {
  Quotation: "EST-",
  Invoice: "INV-",
  "Proforma Invoice": "PI-",
};

let nextItemId = 1;
const newItem = (): Item => ({
  id: nextItemId++,
  name: "",
  hsn: "",
  rate: "",
  qty: "",
  gst: DEFAULT_GST_RATE,
});

const toNumber = (v: string) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);

const money = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-11-16" -> "16 Nov 2026"
function displayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BillMaker() {
  const [docType, setDocType] = useState<DocType>("Quotation");
  const [copyLabel, setCopyLabel] = useState(COPY_LABELS[0]);
  const [number, setNumber] = useState("EST-1");
  // This component is client-only (see ClientBillMaker), so reading today's date here is safe.
  const [date, setDate] = useState(() => isoDate(new Date()));
  const [dueDate, setDueDate] = useState(() => isoDate(new Date()));
  const [customerName, setCustomerName] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDetails, setCustomerDetails] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("29-KARNATAKA");
  const [items, setItems] = useState<Item[]>(() => [newItem()]);
  const [applyGst, setApplyGst] = useState(true);
  const [roundOff, setRoundOff] = useState(true);
  const [advance, setAdvance] = useState("");
  const [advanceNote, setAdvanceNote] = useState("");
  const [business, setBusiness] = useState<Business>(DEFAULT_BUSINESS);
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);

  const rows = items.map((it) => {
    const taxable = round2(toNumber(it.rate) * toNumber(it.qty));
    const gstRate = applyGst ? toNumber(it.gst) : 0;
    const tax = round2((taxable * gstRate) / 100);
    return { ...it, taxable, gstRate, tax, amount: round2(taxable + tax) };
  });
  const filledRows = rows.filter((r) => r.name.trim());
  const totalQty = filledRows.reduce((sum, r) => sum + toNumber(r.qty), 0);
  const taxableTotal = round2(filledRows.reduce((sum, r) => sum + r.taxable, 0));

  // Same state as our GSTIN -> CGST + SGST, different state -> IGST.
  const intraState = placeOfSupply.slice(0, 2) === business.gstin.slice(0, 2);
  const taxLines = taxBreakup(filledRows, intraState);
  const exactTotal = round2(taxableTotal + taxLines.reduce((sum, l) => sum + l.amount, 0));
  const total = roundOff ? Math.round(exactTotal) : exactTotal;
  const roundOffAmount = round2(total - exactTotal);
  const advancePaid = round2(toNumber(advance));
  const balanceDue = round2(total - advancePaid);

  function changeDocType(t: DocType) {
    // Swap the number prefix if the user hasn't customised it.
    const oldPrefix = NUMBER_PREFIX[docType];
    if (number.startsWith(oldPrefix)) setNumber(NUMBER_PREFIX[t] + number.slice(oldPrefix.length));
    setDocType(t);
  }

  function updateItem(id: number, field: keyof Omit<Item, "id">, value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function onSignatureUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSignature(String(reader.result));
    reader.readAsDataURL(file);
  }

  function printBill() {
    // Browsers use the page title as the default PDF file name, e.g. "EST-7_for_Pradeep".
    const original = document.title;
    const who = customerName.trim().replace(/\s+/g, "_");
    document.title = who ? `${number}_for_${who}` : number;
    window.print();
    document.title = original;
  }

  function newBill() {
    if (!confirm("Clear the customer and items to start a new bill?")) return;
    const match = number.match(/^(.*?)(\d+)$/);
    if (match) setNumber(`${match[1]}${Number(match[2]) + 1}`);
    setCustomerName("");
    setCustomerGstin("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerDetails("");
    setItems([newItem()]);
    setAdvance("");
    setAdvanceNote("");
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] print:block print:max-w-none print:p-0">
      {/* ---------- Form ---------- */}
      <section className="space-y-6 print:hidden">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight">Create Bill</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Fill in the details. The preview updates as you type.
          </p>
        </div>

        <Fieldset title="Document">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className={inputCls} value={docType} onChange={(e) => changeDocType(e.target.value as DocType)}>
                {(Object.keys(NUMBER_PREFIX) as DocType[]).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Number">
              <input className={inputCls} value={number} onChange={(e) => setNumber(e.target.value)} />
            </Field>
            <Field label="Date">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={docType === "Quotation" ? "Valid until" : "Due date"}>
              <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Copy">
            <select className={inputCls} value={copyLabel} onChange={(e) => setCopyLabel(e.target.value)}>
              {COPY_LABELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </Fieldset>

        <Fieldset title="Customer">
          <CustomerPicker
            onSelect={(c) => {
              setCustomerName(c.name);
              setCustomerGstin(c.gstin);
              setCustomerPhone(c.phone);
              setCustomerEmail(c.email);
              setCustomerDetails(c.details);
              setPlaceOfSupply(c.placeOfSupply);
            }}
          />
          <p className="border-t border-foreground/10 pt-3 text-xs text-foreground/60">
            Details on this bill (edit here for a one-off change):
          </p>
          <Field label="Name">
            <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Pradeep" />
          </Field>
          <Field label="GSTIN (optional)">
            <input className={`${inputCls} uppercase`} value={customerGstin} maxLength={15} onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone (optional)">
              <input className={inputCls} type="tel" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </Field>
            <Field label="Email (optional)">
              <input className={inputCls} type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </Field>
          </div>
          <Field label="Address (optional)">
            <textarea rows={2} className={inputCls} value={customerDetails} onChange={(e) => setCustomerDetails(e.target.value)} />
          </Field>
          <Field label="Place of supply">
            <select className={inputCls} value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)}>
              {STATES.map(([code, name]) => (
                <option key={code} value={`${code}-${name}`}>{`${code}-${name}`}</option>
              ))}
            </select>
          </Field>
        </Fieldset>

        <Fieldset title="GST">
          <Toggle checked={applyGst} onChange={setApplyGst} label="Apply GST" />
          {applyGst && (
            <p className="text-xs text-foreground/60">
              {intraState
                ? "Same state as your GSTIN: tax is split into CGST + SGST."
                : "Different state from your GSTIN: tax is charged as IGST."}
              {" "}Item rates are entered before tax.
            </p>
          )}
          <Toggle checked={roundOff} onChange={setRoundOff} label="Round total to nearest rupee" />
        </Fieldset>

        <Fieldset title="Items">
          <datalist id="gst-rates">
            {GST_RATE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          {rows.map((it, i) => (
            <div key={it.id} className="space-y-2 rounded-lg border border-foreground/10 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/60">Item {i + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input className={inputCls} placeholder="Item name, e.g. School set" value={it.name} onChange={(e) => updateItem(it.id, "name", e.target.value)} />
              <div className={`grid gap-2 ${applyGst ? "grid-cols-4" : "grid-cols-3"}`}>
                <SmallField label="HSN">
                  <input className={inputCls} value={it.hsn} onChange={(e) => updateItem(it.id, "hsn", e.target.value)} />
                </SmallField>
                {applyGst && (
                  <SmallField label="GST %">
                    <input className={inputCls} type="number" min="0" step="0.01" list="gst-rates" value={it.gst} onChange={(e) => updateItem(it.id, "gst", e.target.value)} />
                  </SmallField>
                )}
                <SmallField label="Rate (₹)">
                  <input className={inputCls} type="number" min="0" step="0.01" value={it.rate} onChange={(e) => updateItem(it.id, "rate", e.target.value)} />
                </SmallField>
                <SmallField label="Qty">
                  <input className={inputCls} type="number" min="0" step="1" value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)} />
                </SmallField>
              </div>
              <p className="text-right text-xs text-foreground/60">
                {applyGst && it.tax > 0 && <>₹{money(it.taxable)} + ₹{money(it.tax)} GST = </>}
                Amount: ₹{money(it.amount)}
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, newItem()])}
            className="w-full rounded-lg border border-dashed border-foreground/25 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            + Add item
          </button>
        </Fieldset>

        <Fieldset title="Payment">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Advance paid (₹)">
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" value={advance} onChange={(e) => setAdvance(e.target.value)} />
            </Field>
            <Field label="Payment note (optional)">
              <input className={inputCls} placeholder="e.g. UPI, 10 Nov" value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-between rounded-md bg-foreground/5 px-3 py-2 text-sm">
            <span>Balance due</span>
            <span className="font-bold">₹{money(balanceDue)}</span>
          </div>
          {advancePaid > total && (
            <p className="text-xs font-semibold text-accent">
              Advance is more than the bill total. The customer has overpaid by ₹{money(-balanceDue)}.
            </p>
          )}
        </Fieldset>

        <Fieldset title="Authorized signature">
          <p className="text-xs text-foreground/60">
            The Prostyle stamp is added by default. Upload a different image to use it for this bill only.
          </p>
          <input type="file" accept="image/*" onChange={onSignatureUpload} className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-foreground/10 file:px-3 file:py-2 file:text-sm file:font-semibold" />
          <div className="flex gap-4">
            {signature !== DEFAULT_SIGNATURE && (
              <button type="button" onClick={() => setSignature(DEFAULT_SIGNATURE)} className="text-xs font-semibold text-accent hover:underline">
                Use Prostyle stamp
              </button>
            )}
            {signature && (
              <button type="button" onClick={() => setSignature("")} className="text-xs font-semibold text-accent hover:underline">
                Remove signature
              </button>
            )}
          </div>
        </Fieldset>

        <details className="rounded-xl border border-foreground/10 p-4">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-wider">
            Business &amp; bank details
          </summary>
          <div className="mt-4 space-y-3">
            {(Object.keys(DEFAULT_BUSINESS) as (keyof Business)[]).map((key) => (
              <Field key={key} label={BUSINESS_LABELS[key]}>
                <input
                  className={inputCls}
                  value={business[key]}
                  onChange={(e) => setBusiness((b) => ({ ...b, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
        </details>

        <div className="sticky bottom-4 flex gap-3">
          <button type="button" onClick={printBill} className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:bg-accent-hover">
            Print / Save as PDF
          </button>
          <button type="button" onClick={newBill} className="rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm font-semibold hover:bg-foreground/5">
            New bill
          </button>
        </div>
      </section>

      {/* ---------- Preview (this is what gets printed) ---------- */}
      <section className="min-w-0 overflow-x-auto print:overflow-visible">
        <div className="bill-sheet mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white p-[12mm] text-[13px] text-neutral-800 shadow-xl ring-1 ring-black/5 print:shadow-none print:ring-0">
          <div className="flex items-start justify-between">
            <p className="text-lg font-bold uppercase tracking-[0.3em] text-blue-600">{docType}</p>
            <p className="pt-1 text-[11px] font-medium tracking-wider text-neutral-500">{copyLabel}</p>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-neutral-900">{business.name}</h2>
          <p className="text-[12px]">
            <span className="font-semibold">GSTIN</span> <span className="font-bold">{business.gstin}</span>
          </p>
          <p className="leading-snug">{business.address1}</p>
          <p className="leading-snug">{business.address2}</p>
          <p className="leading-snug">{business.address3}</p>

          <div className="mt-4 grid grid-cols-3 text-[12px]">
            <p><span className="font-semibold">{docType} #:</span> <span className="text-[14px] font-bold">{number}</span></p>
            <p><span className="font-semibold">{docType} Date:</span> <span className="text-[14px] font-bold">{displayDate(date)}</span></p>
            <p><span className="font-semibold">{docType === "Quotation" ? "Validity" : "Due Date"}:</span> <span className="text-[14px]">{displayDate(dueDate)}</span></p>
          </div>

          <p className="mt-4 text-[12px] font-semibold">Customer Details:</p>
          <p className="mt-1 font-bold">{customerName || "—"}</p>
          {customerGstin && <p className="text-[12px]"><span className="font-semibold">GSTIN</span> {customerGstin}</p>}
          {customerDetails && <p className="whitespace-pre-line text-[12px]">{customerDetails}</p>}
          {customerPhone && <p className="text-[12px]"><span className="font-semibold">Ph:</span> {customerPhone}</p>}
          {customerEmail && <p className="text-[12px]"><span className="font-semibold">Email:</span> {customerEmail}</p>}
          <p className="mt-3 text-[12px] font-semibold">Place of Supply:</p>
          <p className="font-bold">{placeOfSupply}</p>

          <table className="mt-4 w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-y border-blue-600 bg-blue-50/60">
                <th className="w-7 py-1.5 pl-2 text-left font-semibold">#</th>
                <th className="py-1.5 text-left font-semibold">Item</th>
                <th className="w-24 py-1.5 text-right font-semibold">Rate / Item</th>
                <th className="w-14 py-1.5 text-center font-semibold">Qty</th>
                {applyGst && (
                  <>
                    <th className="w-24 py-1.5 text-right font-semibold">Taxable Value</th>
                    <th className="w-24 py-1.5 text-right font-semibold">Tax Amount</th>
                  </>
                )}
                <th className="w-28 py-1.5 pr-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filledRows.map((r, i) => (
                <tr key={r.id} className="border-b border-neutral-200">
                  <td className="py-2 pl-2 align-middle">{i + 1}</td>
                  <td className="py-2">
                    <p className="text-[13px] font-semibold text-neutral-900">{r.name}</p>
                    {r.hsn && <p className="text-[11px] text-neutral-600">HSN: {r.hsn}</p>}
                  </td>
                  <td className="py-2 text-right font-semibold">{money(toNumber(r.rate))}</td>
                  <td className="py-2 text-center">{r.qty}</td>
                  {applyGst && (
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
              {filledRows.length === 0 && (
                <tr className="border-b border-neutral-200">
                  <td colSpan={applyGst ? 7 : 5} className="py-6 text-center text-neutral-400 print:hidden">
                    Add items in the form to see them here
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-2 flex justify-end">
            <div className="w-64 text-[12px]">
              {(taxLines.length > 0 || roundOffAmount !== 0) && (
                <dl className="mb-1 space-y-0.5">
                  <SummaryRow label="Taxable Amount" value={`₹${money(taxableTotal)}`} />
                  {taxLines.map((l) => (
                    <SummaryRow key={l.label} label={l.label} value={`₹${money(l.amount)}`} />
                  ))}
                  {roundOffAmount !== 0 && (
                    <SummaryRow label="Round Off" value={`${roundOffAmount > 0 ? "+" : "-"}₹${money(Math.abs(roundOffAmount))}`} />
                  )}
                </dl>
              )}
              <div className="flex items-baseline justify-between border-t border-neutral-300 pt-1 text-lg font-bold text-neutral-900">
                <span>Total</span>
                <span>₹{money(total)}</span>
              </div>
              {advancePaid > 0 && (
                <>
                  <dl className="mt-1 space-y-0.5">
                    <SummaryRow
                      label={advanceNote ? `Advance Paid (${advanceNote})` : "Advance Paid"}
                      value={`-₹${money(advancePaid)}`}
                    />
                  </dl>
                  <div className="mt-1 flex items-baseline justify-between border-t border-neutral-300 pt-1 text-base font-bold text-blue-600">
                    <span>{balanceDue < 0 ? "Excess Paid" : "Balance Due"}</span>
                    <span>₹{money(Math.abs(balanceDue))}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-1 flex justify-between gap-4 border-b border-blue-600 pb-1 text-[11px]">
            <span className="shrink-0 pl-2">Total Items / Qty : {filledRows.length} / {totalQty}</span>
            <span className="text-right">Total amount (in words): {amountInWords(total)}</span>
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
            <div className="flex w-52 shrink-0 flex-col items-center text-[12px]">
              <p className="text-neutral-600">For {business.name}</p>
              <div className="flex h-24 w-full items-center justify-center">
                {signature ? (
                  // eslint-disable-next-line @next/next/no-img-element -- may be a user-uploaded data URL
                  <img src={signature} alt="Authorized signature" className="max-h-22 max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] text-neutral-300 print:hidden">Signature / stamp</span>
                )}
              </div>
              <p className="text-neutral-600">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const BUSINESS_LABELS: Record<keyof Business, string> = {
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

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

function Fieldset({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-foreground/10 p-4">
      <legend className="px-1 text-sm font-bold uppercase tracking-wider">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

function SmallField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-0.5">
      <span className="text-[11px] text-foreground/60">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-(--accent)" />
      {label}
    </label>
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
