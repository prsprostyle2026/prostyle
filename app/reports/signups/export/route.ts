import { requireUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { getSignups } from "@/lib/signups";

// GET /reports/signups/export — every "Notify me" email as a CSV file.
export async function GET() {
  await requireUser();
  const signups = await getSignups();
  return csvResponse([["Email", "Signed up (IST)"], ...signups.map((s) => [s.email, s.signedUp])], "notify-signups.csv");
}
