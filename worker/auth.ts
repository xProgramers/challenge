import { b64url, enc, randomId, sha256, unb64url } from './util.ts';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  color: string;
  invite_code: string;
  tz: string;
  tone: string;
  theme: string | null;
}

const SESSION_DAYS = 180;
export const COOKIE = 'sid';

export function getCookie(req: Request, name: string): string | null {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function createSession(env: Env, userId: string): Promise<string> {
  const token = randomId(32);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, Date.now() + SESSION_DAYS * 864e5).run();
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

export async function endSession(env: Env, req: Request): Promise<string> {
  const token = getCookie(req, COOKIE);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function currentUser(env: Env, req: Request): Promise<User | null> {
  const token = getCookie(req, COOKIE);
  if (!token) return null;
  return env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.color, u.invite_code, u.tz, u.tone, u.theme
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  ).bind(await sha256(token), Date.now()).first<User>();
}

/* ---------- senha (login por e-mail) ---------- */

const ITER = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64url(salt)}$${b64url(await pbkdf2(password, salt, ITER))}`;
}

export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [, iter, salt, hash] = stored.split('$');
  const got = b64url(await pbkdf2(password, unb64url(salt), Number(iter)));
  return got.length === hash.length && crypto.subtle.timingSafeEqual(enc.encode(got), enc.encode(hash));
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

/* ---------- Google ---------- */

export interface GoogleProfile { sub: string; email?: string; email_verified?: boolean; name?: string; given_name?: string }

let jwksCache: { keys: (JsonWebKey & { kid: string })[]; until: number } | null = null;

async function googleKeys(): Promise<(JsonWebKey & { kid: string })[]> {
  if (jwksCache && jwksCache.until > Date.now()) return jwksCache.keys;
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!r.ok) throw new Error('Não deu para buscar as chaves do Google');
  const { keys } = await r.json<{ keys: (JsonWebKey & { kid: string })[] }>();
  jwksCache = { keys, until: Date.now() + 3600e3 };
  return keys;
}

/** Valida o ID token que o botão "Continuar com Google" devolve. */
export async function verifyGoogleToken(token: string, clientId: string): Promise<GoogleProfile> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('Token inválido');
  const header = JSON.parse(new TextDecoder().decode(unb64url(h)));
  const jwk = (await googleKeys()).find(k => k.kid === header.kid);
  if (!jwk || header.alg !== 'RS256') throw new Error('Chave do token desconhecida');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64url(s), enc.encode(`${h}.${p}`));
  if (!ok) throw new Error('Assinatura inválida');
  const claims = JSON.parse(new TextDecoder().decode(unb64url(p)));
  if (claims.aud !== clientId) throw new Error('Token de outro app');
  if (claims.iss !== 'accounts.google.com' && claims.iss !== 'https://accounts.google.com') throw new Error('Emissor inválido');
  if (claims.exp * 1000 < Date.now()) throw new Error('Token expirado');
  return claims;
}
