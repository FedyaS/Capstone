/**
 * Edge-safe session helpers.
 *
 * IMPORTANT: this module is imported by `middleware.ts`, so it must stay free of
 * Node-only APIs (no `crypto` module, no `fs`, no Octokit). Everything here runs
 * on Web Crypto, which exists in both the Edge runtime and Node 18+.
 *
 * Token format:  v1.<expiryMs>.<base64url(hmacSha256("v1.<expiryMs>"))>
 */

export const SESSION_COOKIE = 'cap_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  // AUTH_SECRET is the real key. Falling back to SECRET_PATTERN keeps local dev
  // working with minimal setup, but it is a weaker key — set AUTH_SECRET in prod.
  return process.env.AUTH_SECRET || process.env.SECRET_PATTERN || '';
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const chars = Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join('');
  return btoa(chars).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64UrlEncode(sig);
}

/** Length-independent, branch-free-ish string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const expiry = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${expiry}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !secret()) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;

  const [, expiryRaw, signature] = parts;
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  return safeEqual(signature, await sign(`v1.${expiryRaw}`));
}

/** Normalises "0-1-2", "0,1,2" and "012" into a canonical "0-1-2". */
export function normalizePattern(raw: string): string {
  const digits = (raw || '').match(/\d/g);
  return digits ? digits.join('-') : '';
}

export const isConfigured = () => Boolean(process.env.SECRET_PATTERN);
