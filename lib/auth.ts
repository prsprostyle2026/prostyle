import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./session-token";

// Staff users live in the staff_users table (manage them with `npm run staff`).
// Password hashes look like "scrypt$N$r$p$<salt base64>$<hash base64>",
// written by scripts/staff.mjs.

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected);
}

// Same rules as scripts/staff.mjs.
export const USERNAME_RULE = /^[a-z0-9._-]{2,32}$/;
export const MIN_PASSWORD_LENGTH = 8;

// Same format as hashPassword() in scripts/staff.mjs.
export async function hashPassword(password: string): Promise<string> {
  const [N, r, p] = [16384, 8, 1];
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

// Checked for unknown usernames so a login takes the same time either way.
// An all-zero hash, which no password produces.
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

// Returns the canonical username when the credentials match, otherwise null.
export async function checkCredentials(username: string, password: string): Promise<string | null> {
  const name = username.trim().toLowerCase();
  const { rows } = await query<{ username: string; password_hash: string }>(
    "SELECT username, password_hash FROM staff_users WHERE username = $1 AND active",
    [name],
  );
  const user = rows[0];
  const match = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  return user && match ? user.username : null;
}

// The active staff user with this name, or null. Cached for the duration of one request.
const getActiveUser = cache(async (username: string) => {
  const { rows } = await query<{ is_root: boolean }>(
    "SELECT is_root FROM staff_users WHERE username = $1 AND active",
    [username],
  );
  return rows[0] ? { username, isRoot: rows[0].is_root } : null;
});

async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const username = await verifySessionToken(token);
  return username ? getActiveUser(username) : null;
}

// Reads the session cookie; sends the visitor to /login unless signed in as a current user.
// Removing or deactivating a user in the database signs them out on their next request.
export async function requireUser(): Promise<string> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user.username;
}

// Same as requireUser, plus whether they are a root user (can manage other staff).
export async function requireUserWithRole(): Promise<{ username: string; isRoot: boolean }> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
