import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session-token";

// BILL_USERS in .env.local: "user1:password1,user2:password2"
function getUsers(): Map<string, string> {
  const users = new Map<string, string>();
  for (const entry of (process.env.BILL_USERS ?? "").split(",")) {
    const i = entry.indexOf(":");
    if (i > 0) users.set(entry.slice(0, i).trim().toLowerCase(), entry.slice(i + 1).trim());
  }
  return users;
}

const sha256 = (text: string) => createHash("sha256").update(text).digest();

// Returns the canonical username when the credentials match, otherwise null.
export function checkCredentials(username: string, password: string): string | null {
  const name = username.trim().toLowerCase();
  const expected = getUsers().get(name);
  // Compare hashes in constant time, and do the work even for unknown users.
  const match = timingSafeEqual(sha256(password), sha256(expected ?? "\0invalid"));
  return expected !== undefined && match ? name : null;
}

// Reads the session cookie; sends the visitor to /login unless signed in as a current user.
export async function requireUser(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const username = await verifySessionToken(token);
  if (!username || !getUsers().has(username)) redirect("/login");
  return username;
}
