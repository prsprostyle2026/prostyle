"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/session-token";

export type LoginState = { error?: string; username?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username.trim() || !password) {
    return { error: "Enter your username and password.", username };
  }

  const user = checkCredentials(username, password);
  if (!user) {
    return { error: "Incorrect username or password.", username };
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/bill");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
