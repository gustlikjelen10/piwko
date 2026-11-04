import { put, list } from '@vercel/blob';
import { createHash } from 'crypto';

export async function readJSON(key, fallback) {
  const { blobs } = await list({ prefix: key });
  const b = blobs.find(x => x.pathname === key);
  if (!b) return fallback;
  const r = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' });
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
