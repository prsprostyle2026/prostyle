// Signed session tokens: "<payload>.<signature>", HMAC-SHA256 via Web Crypto.
// Uses only Web APIs so it works in both proxy.ts and server code.

export const SESSION_COOKIE = "prostyle_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours, in seconds

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short. Set it in .env.local.");
  }
  return secret;
}

function hmacKey(usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function createSessionToken(username: string): Promise<string> {
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 })),
  );
  const signature = await crypto.subtle.sign("HMAC", await hmacKey("sign"), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

// Returns the username if the token is authentic and not expired, otherwise null.
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey("verify"),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const { u, exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (typeof u !== "string" || typeof exp !== "number" || exp < Date.now()) return null;
    return u;
  } catch {
    return null;
  }
}
