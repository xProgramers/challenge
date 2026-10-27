import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptPayload } from '../worker/push.ts';
import { b64url, concat, enc } from '../worker/util.ts';

// Faz o papel do navegador: decifra com a chave privada da inscrição (RFC 8291).
async function hmac(key: Uint8Array, data: Uint8Array) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

test('mensagem cifrada abre no lado do navegador', async () => {
  const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const uaPublic = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const msg = JSON.stringify({ title: 'Vai deixar a chama apagar?', body: 'ç ã é 🔥' });

  const out = await encryptPayload(b64url(uaPublic), b64url(auth), enc.encode(msg));
  const salt = out.slice(0, 16);
  assert.equal(new DataView(out.buffer).getUint32(16), 4096);
  const idlen = out[20];
  const asPublic = out.slice(21, 21 + idlen);
  const cipher = out.slice(21 + idlen);

  const asKey = await crypto.subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, ua.privateKey, 256));
  const ikm = (await hmac(await hmac(auth, shared), concat(enc.encode('WebPush: info\0'), uaPublic, asPublic, new Uint8Array([1])))).slice(0, 32);
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, cipher));
  assert.equal(plain[plain.length - 1], 2);
  assert.equal(new TextDecoder().decode(plain.slice(0, -1)), msg);
});
