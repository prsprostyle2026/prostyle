"use server";

import { refresh } from "next/cache";
import { MIN_PASSWORD_LENGTH, USERNAME_RULE, hashPassword, requireUserWithRole } from "@/lib/auth";
import { query } from "@/lib/db";

// Every action here is for root users only. The page hides the controls from other
// staff, but these checks are what actually enforce it.
const NOT_ROOT = "Only a root user can manage staff.";

export type AddStaffState = { error?: string; success?: string; username?: string } | undefined;

export async function addStaffUser(_prev: AddStaffState, formData: FormData): Promise<AddStaffState> {
  const me = await requireUserWithRole();
  if (!me.isRoot) return { error: NOT_ROOT };
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!USERNAME_RULE.test(username)) {
    return { error: "Username must be 2–32 characters: letters, numbers, dot, dash or underscore.", username };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, username };
  }
  if (password !== confirm) return { error: "The two passwords do not match.", username };

  const { rowCount } = await query(
    "INSERT INTO staff_users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
    [username, await hashPassword(password)],
  );
  if (!rowCount) return { error: `A staff user named "${username}" already exists.`, username };

  refresh();
  return { success: `Added ${username}. They can sign in now.` };
}

// Enable or disable a (non-root) staff user. Root users can't be disabled from the app,
// so the root account can never be locked out by mistake.
export async function setStaffActive(formData: FormData): Promise<void> {
  const me = await requireUserWithRole();
  if (!me.isRoot) return;
  const username = String(formData.get("username") ?? "");
  const active = formData.get("active") === "true";
  if (username === me.username) return;
  await query("UPDATE staff_users SET active = $2, updated_at = now() WHERE username = $1 AND NOT is_root", [
    username,
    active,
  ]);
  refresh();
}

export type ResetPasswordState = { error?: string; success?: string } | undefined;

// Root sets a new password for a (non-root) staff user, without needing their current one.
export async function resetStaffPassword(
  username: string,
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const me = await requireUserWithRole();
  if (!me.isRoot) return { error: NOT_ROOT };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) return { error: "The two passwords do not match." };

  const { rowCount } = await query(
    "UPDATE staff_users SET password_hash = $2, updated_at = now() WHERE username = $1 AND NOT is_root",
    [String(username), await hashPassword(password)],
  );
  if (!rowCount) {
    return { error: "Can't set this password here. Root users change their own on the Change password page." };
  }
  return { success: `Password updated for ${username}. Tell them the new password.` };
}
