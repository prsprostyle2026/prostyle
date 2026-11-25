import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session-token";

// Quick redirect for visitors without a valid session. The bill page also
// checks the session on the server (lib/auth.ts), so this is not the only guard.
export async function proxy(request: NextRequest) {
  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/bill/:path*",
    "/bills/:path*",
    "/customers/:path*",
    "/enquiries/:path*",
    "/payments/:path*",
    "/reports/:path*",
    "/staff/:path*",
    "/account/:path*",
  ],
};
