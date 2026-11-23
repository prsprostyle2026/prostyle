import "server-only";
import { query } from "./db";

export type Signup = { email: string; signedUp: string };

// "Notify me" sign-ups, newest first, with the time in India time.
export async function getSignups(): Promise<Signup[]> {
  const { rows } = await query<Signup>(
    `SELECT email, to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') AS "signedUp"
     FROM notify_signups ORDER BY created_at DESC`,
  );
  return rows;
}
