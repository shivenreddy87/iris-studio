/**
 * Token encryption and OAuth state signing (server-only).
 *
 * Access tokens are stored encrypted with AES-GCM so nobody browsing the
 * database sees a usable credential. Keys come from generated secrets.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(value: string): Uint8Array {
  const raw = atob(value);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function aesKey(): Promise<CryptoKey> {
  const secret = process.env["INSTAGRAM_TOKEN_SECRET"];
  if (!secret) throw new Error("INSTAGRAM_TOKEN_SECRET is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await aesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext)),
  );
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return b64(packed);
}

export async function decryptToken(stored: string): Promise<string> {
  const key = await aesKey();
  const packed = unb64(stored);
  const iv = packed.slice(0, 12) as unknown as BufferSource;
  const cipher = packed.slice(12) as unknown as BufferSource;
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return decoder.decode(plain);
}

/* ------------------------------ oauth state ----------------------------- */

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env["INSTAGRAM_STATE_SECRET"];
  if (!secret) throw new Error("INSTAGRAM_STATE_SECRET is not configured.");
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export type OAuthState = {
  /** "connect" links to the signed-in user; "login" signs the person in. */
  mode: "connect" | "login";
  userId: string | null;
  origin: string;
  issuedAt: number;
};

const STATE_TTL_MS = 10 * 60 * 1000;

export async function signState(state: OAuthState): Promise<string> {
  const payload = b64(encoder.encode(JSON.stringify(state)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const key = await hmacKey();
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  const mac = b64(sig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${payload}.${mac}`;
}

export async function verifyState(value: string): Promise<OAuthState | null> {
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const key = await hmacKey();
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  const expectedMac = b64(expected).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (expectedMac.length !== mac.length) return null;
  let diff = 0;
  for (let i = 0; i < mac.length; i++) diff |= expectedMac.charCodeAt(i) ^ mac.charCodeAt(i);
  if (diff !== 0) return null;

  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decoder.decode(unb64(padded + "=".repeat((4 - (padded.length % 4)) % 4)));
    const parsed = JSON.parse(json) as OAuthState;
    if (Date.now() - parsed.issuedAt > STATE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
