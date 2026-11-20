"use server";

import { MIN_PASSWORD_LENGTH, checkCredentials, hashPassword, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export type ChangePasswordState = { error?: string; success?: string } | undefined;

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const me = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!(await checkCredentials(me, current))) return { error: "Your current password is incorrect." };
  if (next.length < MIN_PASSWORD_LENGTH) {
    return { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (next !== confirm) return { error: "The two new passwords do not match." };
  if (next === current) return { error: "Choose a password different from your current one." };

  await query("UPDATE staff_users SET password_hash = $2, updated_at = now() WHERE username = $1", [
    me,
    await hashPassword(next),
  ]);
  return { success: "Password changed. Use the new password next time you sign in." };
}
