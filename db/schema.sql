-- Database schema. Safe to run repeatedly: npm run db:setup
-- Tables are created if missing; later additions are ALTERs so existing data is kept.

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  gstin           text NOT NULL DEFAULT '',
  phone           text NOT NULL DEFAULT '',
  email           text NOT NULL DEFAULT '',
  details         text NOT NULL DEFAULT '',
  place_of_supply text NOT NULL DEFAULT '29-KARNATAKA',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- Who created / last changed each customer (full history is in audit_log).
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by text NOT NULL DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by text NOT NULL DEFAULT '';

-- Same name (any case) = same customer.
CREATE UNIQUE INDEX IF NOT EXISTS customers_name_lower_idx ON customers (lower(name));

-- One customer per phone number. Compares the last 10 digits, so
-- "+91 98450 12345", "098450-12345" and "9845012345" count as the same number.
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_idx
  ON customers (right(regexp_replace(phone, '\D', '', 'g'), 10))
  WHERE phone <> '';

-- ---------------------------------------------------------------------------
-- Staff. Manage with: npm run staff
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL UNIQUE CHECK (username = lower(username) AND username <> ''),
  password_hash text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- Root staff can add, disable/enable and reset passwords for other staff.
-- Grant with: npm run staff -- make-root <username>
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS is_root boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Documents: quotations, proforma invoices, invoices and customer bills.
-- (The table is called "bills" for historical reasons.)
-- Only Invoices and Customer Bills that are not voided count toward balances.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number           text NOT NULL UNIQUE,
  customer_id      uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  bill_date        date NOT NULL,
  due_date         date,
  customer         jsonb NOT NULL,          -- name/phone/etc. as printed
  items            jsonb NOT NULL,          -- [{name, hsn, rate, qty, gst}]
  apply_gst        boolean NOT NULL,
  round_off        boolean NOT NULL,
  taxable          numeric(12,2) NOT NULL,
  tax              numeric(12,2) NOT NULL,
  total            numeric(12,2) NOT NULL CHECK (total >= 0),
  paid             numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid >= 0),
  previous_balance numeric(12,2) NOT NULL,  -- customer's balance when it was saved (history only)
  payment_note     text NOT NULL DEFAULT '',
  created_by       text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bills_customer_idx ON bills (customer_id);

ALTER TABLE bills ADD COLUMN IF NOT EXISTS doc_type text NOT NULL DEFAULT 'Customer Bill';
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_doc_type_check;
ALTER TABLE bills ADD CONSTRAINT bills_doc_type_check
  CHECK (doc_type IN ('Quotation', 'Proforma Invoice', 'Invoice', 'Customer Bill'));

-- Numbering: <PREFIX>/<financial year>/<seq>, e.g. INV/2026-27/001. Assigned by the
-- server, never typed, so invoice numbers run without gaps within a financial year.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS financial_year text;   -- '2026-27'; null for old numbers
ALTER TABLE bills ADD COLUMN IF NOT EXISTS seq integer;

-- What was printed, so a saved document reprints exactly.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS business jsonb;        -- seller name/GSTIN/address/bank
ALTER TABLE bills ADD COLUMN IF NOT EXISTS signature text;        -- null = default stamp; else image data URL

ALTER TABLE bills ADD COLUMN IF NOT EXISTS updated_by text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Voiding keeps the record (and its number) but removes it from balances and reports.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS voided_by text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS void_reason text;

-- A quotation/proforma converted into an invoice/customer bill.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS converted_from uuid REFERENCES bills(id);
CREATE INDEX IF NOT EXISTS bills_converted_from_idx ON bills (converted_from);
CREATE INDEX IF NOT EXISTS bills_date_idx ON bills (bill_date);

-- Last number used per document type and financial year.
CREATE TABLE IF NOT EXISTS doc_counters (
  doc_type       text NOT NULL,
  financial_year text NOT NULL,
  last_seq       integer NOT NULL,
  PRIMARY KEY (doc_type, financial_year)
);

-- ---------------------------------------------------------------------------
-- Payments a customer makes outside a bill (e.g. paying off their balance).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  paid_on     date NOT NULL,
  method      text NOT NULL DEFAULT '',
  note        text NOT NULL DEFAULT '',
  created_by  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_payments_customer_idx ON customer_payments (customer_id);
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS voided_by text;
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS void_reason text;

-- ---------------------------------------------------------------------------
-- Audit log: who did what to a customer's records, and when. No foreign key,
-- so the history survives even if the customer is deleted.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  customer_id uuid,
  entity      text NOT NULL,          -- 'customer' | 'bill' | 'payment'
  entity_id   text NOT NULL,
  action      text NOT NULL,          -- 'created' | 'updated' | 'deleted' | 'voided' | 'converted'
  summary     text NOT NULL,          -- human-readable, e.g. "Invoice INV/2026-27/004 for ₹1,200.00"
  changes     jsonb,                  -- for updates: {"Phone": {"from": "...", "to": "..."}}
  actor       text NOT NULL,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_customer_idx ON audit_log (customer_id, at DESC);
CREATE INDEX IF NOT EXISTS audit_log_at_idx ON audit_log (at DESC);

-- ---------------------------------------------------------------------------
-- Balances. These views are the one place balances are calculated.
-- When changing a view, only add columns at the end (Postgres can't drop or
-- reorder view columns in place).
-- ---------------------------------------------------------------------------

-- Every entry on a customer's account: debit = billed, credit = paid.
CREATE OR REPLACE VIEW customer_ledger_entries AS
SELECT customer_id, 'bill'::text AS kind, id AS entry_id, doc_type, number AS ref,
       bill_date AS entry_date, created_at, total AS debit, paid AS credit, payment_note AS note
FROM bills
WHERE doc_type IN ('Invoice', 'Customer Bill') AND voided_at IS NULL
UNION ALL
SELECT customer_id, 'payment'::text, id, NULL, method, paid_on, created_at, 0, amount, note
FROM customer_payments
WHERE voided_at IS NULL;

-- Same entries with the running balance after each one (positive = customer owes us).
CREATE OR REPLACE VIEW customer_ledger AS
SELECT e.*,
       sum(e.debit - e.credit) OVER (PARTITION BY e.customer_id
                                     ORDER BY e.entry_date, e.created_at, e.entry_id
                                     ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
FROM customer_ledger_entries e;

-- Totals per customer: pending = (Invoices + Customer Bills) - paid on them - separate payments.
CREATE OR REPLACE VIEW customer_balances AS
SELECT c.id AS customer_id,
       coalesce(b.billed, 0)        AS billed,
       coalesce(b.paid_on_bills, 0) AS paid_on_bills,
       coalesce(p.payments, 0)      AS payments,
       coalesce(b.billed, 0) - coalesce(b.paid_on_bills, 0) - coalesce(p.payments, 0) AS pending,
       coalesce(b.bill_count, 0)    AS bill_count,
       coalesce(b.invoice_count, 0) AS invoice_count,
       coalesce(b.customer_bill_count, 0) AS customer_bill_count
FROM customers c
LEFT JOIN (SELECT customer_id, sum(total) AS billed, sum(paid) AS paid_on_bills, count(*)::int AS bill_count,
                  (count(*) FILTER (WHERE doc_type = 'Invoice'))::int AS invoice_count,
                  (count(*) FILTER (WHERE doc_type = 'Customer Bill'))::int AS customer_bill_count
           FROM bills
           WHERE doc_type IN ('Invoice', 'Customer Bill') AND voided_at IS NULL
           GROUP BY customer_id) b ON b.customer_id = c.id
LEFT JOIN (SELECT customer_id, sum(amount) AS payments
           FROM customer_payments
           WHERE voided_at IS NULL
           GROUP BY customer_id) p ON p.customer_id = c.id;
