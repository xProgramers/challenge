// Web Push sem dependências: chaves VAPID (RFC 8292) + criptografia aes128gcm (RFC 8291).
import type { Env } from './auth.ts';
import { b64url, concat, enc, unb64url } from './util.ts';

interface Vapid { publicKey: string; privateJwk: JsonWebKey }

let vapidCache: Vapid | null = null;

/** Lê as chaves VAPID do banco; na primeira vez gera e guarda. */
export async function vapid(env: Env): Promise<Vapid> {
  if (vapidCache) return vapidCache;
  const row = await env.DB.prepare("SELECT value FROM config WHERE key = 'vapid'").first<{ value: string }>();
  if (row) return (vapidCache = JSON.parse(row.value));
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey) as ArrayBuffer;
  const fresh: Vapid = { publicKey: b64url(raw), privateJwk: await crypto.subtle.exportKey('jwk', pair.privateKey) as JsonWebKey };
  // INSERT OR IGNORE + releitura: se dois pedidos gerarem ao mesmo tempo, vale o primeiro.
  await env.DB.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('vapid', ?)").bind(JSON.stringify(fresh)).run();
  const saved = await env.DB.prepare("SELECT value FROM config WHERE key = 'vapid'").first<{ value: string }>();
  return (vapidCache = JSON.parse(saved!.value));
}

async function vapidAuth(v: Vapid, endpoint: string): Promise<string> {
  const header = b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64url(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: 'mailto:avisos@challenge.app',
  })));
  const key = await crypto.subtle.importKey('jwk', v.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64url(sig)}, k=${v.publicKey}`;
}

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

/** Criptografa a mensagem para uma inscrição (um único registro aes128gcm). */
export async function encryptPayload(p256dh: string, auth: string, payload: Uint8Array, salt = crypto.getRandomValues(new Uint8Array(16))): Promise<Uint8Array> {
  const uaPublic = unb64url(p256dh);
  const authSecret = unb64url(auth);
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey) as ArrayBuffer);
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey } as SubtleCryptoDeriveKeyAlgorithm, local.privateKey, 256));

  const prkKey = await hmac(authSecret, shared);
  const ikm = (await hmac(prkKey, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic, new Uint8Array([1])))).slice(0, 32);
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);

  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, concat(payload, new Uint8Array([2]))));

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, cipher);
}

export interface PushMessage { title: string; body: string; url?: string; tag?: string }

/** Manda para todos os aparelhos do usuário. Apaga inscrições que o navegador já cancelou. */
export async function pushToUser(env: Env, userId: string, msg: PushMessage): Promise<number> {
  const { results } = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE user_id = ?')
    .bind(userId).all<{ endpoint: string; p256dh: string; auth: string }>();
  if (!results.length) return 0;
  const v = await vapid(env);
  const body = enc.encode(JSON.stringify(msg));
  let sent = 0;
  await Promise.all(results.map(async s => {
    try {
      const r = await fetch(s.endpoint, {
        method: 'POST',
        headers: {
          authorization: await vapidAuth(v, s.endpoint),
          'content-encoding': 'aes128gcm',
          'content-type': 'application/octet-stream',
          ttl: '14400',
          urgency: 'high',
        },
        body: await encryptPayload(s.p256dh, s.auth, body),
      });
      if (r.status === 404 || r.status === 410) {
        await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(s.endpoint).run();
      } else if (r.ok) sent++;
      else console.log('push falhou', r.status, await r.text());
    } catch (e) {
      console.log('push erro', String(e));
    }
  }));
  return sent;
}
