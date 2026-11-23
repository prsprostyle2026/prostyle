"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Customer } from "../bill/CustomerPicker";
import type { CustomerInput, SaveResult } from "../bill/customers";
import { STATES } from "../bill/gst";
import { isValidPhone, phoneKey } from "../bill/phone";

type Errors = { name?: string; phone?: string; form?: string };

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";
const errorCls = "border-accent ring-2 ring-accent/30";

const EMPTY: CustomerInput = { name: "", gstin: "", phone: "", email: "", details: "", placeOfSupply: "29-KARNATAKA" };

// Add / edit customer, shown as a modal over the dashboard.
export default function CustomerForm({
  initial,
  others,
  onSave,
  onCancel,
}: {
  initial?: Customer;
  others: Customer[]; // every other customer, for the duplicate checks
  onSave: (input: CustomerInput) => Promise<SaveResult>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CustomerInput>(initial ?? EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const set = (field: keyof CustomerInput) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "name" || field === "phone") setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const errs: Errors = {};
    if (!name) errs.name = "Customer name is required.";
    else if (others.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      errs.name = `A customer named "${name}" already exists.`;
    }
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!isValidPhone(form.phone)) errs.phone = "Enter a valid 10-digit phone number.";
    else {
      const owner = others.find((c) => c.phone && phoneKey(c.phone) === phoneKey(form.phone));
      if (owner) errs.phone = `This phone number already belongs to ${owner.name}.`;
    }
    setErrors(errs);
    if (errs.name || errs.phone) return;

    setSaving(true);
    try {
      const result = await onSave({ ...form, name });
      if (!result.ok) setErrors(result.field ? { [result.field]: result.error } : { form: result.error });
    } catch {
      setErrors({ form: "Could not save. Check the connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  const title = initial ? `Edit ${initial.name}` : "Add customer";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10" onMouseDown={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
        className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="customer-form-title" className="text-lg font-black">{title}</h2>
        <form onSubmit={submit} noValidate className="mt-4 space-y-3">
          <Field label="Customer name *" error={errors.name}>
            <input
              autoFocus
              className={`${inputCls} ${errors.name ? errorCls : ""}`}
              aria-invalid={!!errors.name}
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
            />
          </Field>
          <Field label="Phone number *" error={errors.phone}>
            <input
              type="tel"
              inputMode="tel"
              className={`${inputCls} ${errors.phone ? errorCls : ""}`}
              aria-invalid={!!errors.phone}
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </Field>
          <Field label="GSTIN">
            <input className={`${inputCls} uppercase`} maxLength={15} value={form.gstin} onChange={(e) => set("gstin")(e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email")(e.target.value)} />
          </Field>
          <Field label="Address">
            <textarea rows={2} className={inputCls} value={form.details} onChange={(e) => set("details")(e.target.value)} />
          </Field>
          <Field label="Place of supply">
            <select className={inputCls} value={form.placeOfSupply} onChange={(e) => set("placeOfSupply")(e.target.value)}>
              {STATES.map(([code, name]) => (
                <option key={code} value={`${code}-${name}`}>{`${code}-${name}`}</option>
              ))}
            </select>
          </Field>

          {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-accent py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save changes" : "Add customer"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-foreground/20 px-4 py-2.5 text-sm font-semibold hover:bg-foreground/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      {children}
      {error && <span className="block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}
