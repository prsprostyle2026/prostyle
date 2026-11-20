"use server";

import { diff, writeAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { query, withTransaction, type PoolClient } from "@/lib/db";
import type { Customer } from "./CustomerPicker";
import { isValidPhone, phoneKey } from "./phone";

type Row = {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  details: string;
  place_of_supply: string;
};

const toCustomer = (r: Row): Customer => ({
  id: r.id,
  name: r.name,
  gstin: r.gstin,
  phone: r.phone,
  email: r.email,
  details: r.details,
  placeOfSupply: r.place_of_supply,
});

const COLUMNS = "id, name, gstin, phone, email, details, place_of_supply";

// Field names as they appear in the activity history.
const LABELS = {
  name: "Name",
  gstin: "GSTIN",
  phone: "Phone",
  email: "Email",
  details: "Address",
  placeOfSupply: "Place of supply",
} as const;

export type CustomerInput = Omit<Customer, "id">;

export type SaveResult =
  | { ok: true; customer: Customer }
  | { ok: false; field?: "name" | "phone"; error: string };

type Failure = Extract<SaveResult, { ok: false }>;
type Clean = { name: string; gstin: string; phone: string; email: string; details: string; placeOfSupply: string };

// Trims and checks the input.
function clean(input: CustomerInput): Clean | Failure {
  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  if (!name) return { ok: false, field: "name", error: "Customer name is required." };
  if (phone && !isValidPhone(phone)) {
    return { ok: false, field: "phone", error: "Enter a valid 10-digit phone number." };
  }
  return {
    name,
    gstin: String(input.gstin ?? "").trim().toUpperCase(),
    phone,
    email: String(input.email ?? "").trim(),
    details: String(input.details ?? "").trim(),
    placeOfSupply: String(input.placeOfSupply ?? "29-KARNATAKA"),
  };
}

const values = (c: Clean) => [c.name, c.gstin, c.phone, c.email, c.details, c.placeOfSupply];

// Turns a unique-index violation into a message for the form; rethrows anything else.
async function conflictMessage(err: unknown, c: Clean): Promise<Failure> {
  const constraint = (err as { constraint?: string }).constraint;
  if (constraint === "customers_name_lower_idx") {
    return { ok: false, field: "name", error: `A customer named "${c.name}" already exists.` };
  }
  if (constraint === "customers_phone_idx") {
    const { rows } = await query<{ name: string }>(
      `SELECT name FROM customers
       WHERE phone <> '' AND right(regexp_replace(phone, '\\D', '', 'g'), 10) = $1`,
      [phoneKey(c.phone)],
    );
    const owner = rows[0]?.name;
    return {
      ok: false,
      field: "phone",
      error: owner ? `This phone number already belongs to ${owner}.` : "This phone number is already in use.",
    };
  }
  throw err;
}

async function insertCustomer(db: PoolClient, c: Clean, actor: string): Promise<Customer> {
  const { rows } = await db.query<Row>(
    `INSERT INTO customers (name, gstin, phone, email, details, place_of_supply, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING ${COLUMNS}`,
    [...values(c), actor],
  );
  const customer = toCustomer(rows[0]);
  await writeAudit(db, {
    customerId: customer.id,
    entity: "customer",
    entityId: customer.id,
    action: "created",
    summary: `Customer ${customer.name} added`,
    actor,
  });
  return customer;
}

// Updates by id and logs which fields changed. Returns null if the customer is gone.
async function updateById(db: PoolClient, id: string, c: Clean, actor: string): Promise<Customer | null> {
  const before = await db.query<Row>(`SELECT ${COLUMNS} FROM customers WHERE id = $1 FOR UPDATE`, [id]);
  if (!before.rows[0]) return null;
  const old = toCustomer(before.rows[0]);
  const { rows } = await db.query<Row>(
    `UPDATE customers SET name = $2, gstin = $3, phone = $4, email = $5, details = $6,
       place_of_supply = $7, updated_by = $8, updated_at = now()
     WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, ...values(c), actor],
  );
  const updated = toCustomer(rows[0]);
  const changes = diff(old, updated, LABELS);
  if (changes) {
    await writeAudit(db, {
      customerId: id,
      entity: "customer",
      entityId: id,
      action: "updated",
      summary: `Changed ${Object.keys(changes).join(", ")}`,
      changes,
      actor,
    });
  }
  return updated;
}

export async function listCustomers(): Promise<Customer[]> {
  await requireUser();
  const { rows } = await query<Row>(`SELECT ${COLUMNS} FROM customers ORDER BY lower(name)`);
  return rows.map(toCustomer);
}

// Bill page: inserts, or updates the existing customer with the same name (case-insensitive).
export async function saveCustomer(input: CustomerInput): Promise<SaveResult> {
  const actor = await requireUser();
  const c = clean(input);
  if ("ok" in c) return c;
  try {
    const customer = await withTransaction(async (db) => {
      const existing = await db.query<{ id: string }>("SELECT id FROM customers WHERE lower(name) = lower($1)", [c.name]);
      if (existing.rows[0]) return (await updateById(db, existing.rows[0].id, c, actor))!;
      return insertCustomer(db, c, actor);
    });
    return { ok: true, customer };
  } catch (err) {
    return conflictMessage(err, c);
  }
}

// Customers dashboard: adds a new customer; a name that already exists is an error.
export async function createCustomer(input: CustomerInput): Promise<SaveResult> {
  const actor = await requireUser();
  const c = clean(input);
  if ("ok" in c) return c;
  try {
    return { ok: true, customer: await withTransaction((db) => insertCustomer(db, c, actor)) };
  } catch (err) {
    return conflictMessage(err, c);
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GONE: Failure = { ok: false, error: "This customer no longer exists. Reload the page." };

// Customers dashboard: edits one customer by id.
export async function updateCustomer(id: string, input: CustomerInput): Promise<SaveResult> {
  const actor = await requireUser();
  const c = clean(input);
  if ("ok" in c) return c;
  if (!UUID_RE.test(String(id))) return GONE;
  try {
    const customer = await withTransaction((db) => updateById(db, id, c, actor));
    return customer ? { ok: true, customer } : GONE;
  } catch (err) {
    return conflictMessage(err, c);
  }
}

// Customers with saved bills or payments can't be deleted, so their balance history stays intact.
export async function deleteCustomer(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireUser();
  if (!UUID_RE.test(String(id))) return { ok: true };
  try {
    await withTransaction(async (db) => {
      const { rows } = await db.query<Row>(`DELETE FROM customers WHERE id = $1 RETURNING ${COLUMNS}`, [id]);
      if (!rows[0]) return;
      await writeAudit(db, {
        customerId: id,
        entity: "customer",
        entityId: id,
        action: "deleted",
        summary: `Customer ${rows[0].name} deleted`,
        changes: { "Deleted record": { from: toCustomer(rows[0]), to: null } },
        actor,
      });
    });
    return { ok: true };
  } catch (err) {
    // 23001 = restrict_violation (ON DELETE RESTRICT), 23503 = foreign_key_violation.
    const code = (err as { code?: string }).code;
    if (code === "23001" || code === "23503") {
      return { ok: false, error: "This customer has saved bills or payments, so they can't be deleted." };
    }
    throw err;
  }
}
