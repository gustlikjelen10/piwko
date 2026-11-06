import { put, head } from '@vercel/blob';
import { createHash } from 'crypto';

// Odczyt przez head() (liczy się jako "prosta" operacja), a nie list() (to "zaawansowana", limit 2000/miesiąc)
export async function readJSON(key, fallback) {
  let url;
  try { url = (await head(key)).url; }
  catch (e) {
    if (e && (e.name === 'BlobNotFoundError' || /not.?found|does not exist/i.test(String(e.message || '')))) return fallback;
    throw e;
  }
  const r = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) return fallback;
  return await r.json();
}
export async function writeJSON(key, data) {
  await put(key, JSON.stringify(data), {
    access: 'public', addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json', cacheControlMaxAge: 0
  });
}
export const hash = (salt, pin) => createHash('sha256').update(salt + pin).digest('hex');
export async function auth(req) {
  const id = req.headers['x-user'], pin = String(req.headers['x-pin'] || '');
  const users = await readJSON('users.json', []);
  const u = users.find(x => x.id === id);
  return u && hash(u.salt, pin) === u.h ? u : null;
}
export function warsawDate() {
  try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date()); }
  catch (_) { return new Date().toISOString().slice(0, 10); }
}
