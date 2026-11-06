import { list, del } from '@vercel/blob';
import { readJSON, writeJSON, hash } from './_db.js';
import { randomBytes, timingSafeEqual } from 'crypto';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const goodAv = a => /^b[1-5]$/.test(a) || /^https:\/\//.test(a);
function okPw(given) {
  const w = process.env.ADMIN_PASSWORD || '';
  const a = Buffer.from(String(given || '')), b = Buffer.from(w);
  return w.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).end();
    if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'Brak zmiennej ADMIN_PASSWORD w ustawieniach Vercel' });
    if (!okPw(req.headers['x-admin'])) { await sleep(800); return res.status(401).json({ error: 'Złe hasło' }); }
    const { action, id, pin, av, name } = req.body || {};
    const users = await readJSON('users.json', []);

    if (action === 'list') {
      const out = await Promise.all(users.map(async u => {
        let n = 0;
        try {
          const d = await readJSON('data-' + u.id + '.json', { beers: [] });
          n = (d.beers || []).reduce((s, b) => s + 1 + ((b.more || []).length), 0);
        } catch (_) {}
        return { id: u.id, name: u.name, av: u.av, count: n };
      }));
      return res.status(200).json(out);
    }

    const u = users.find(x => x.id === id);
    if (!u) return res.status(404).json({ error: 'Nie ma takiego użytkownika' });

    if (action === 'resetPin') {
      if (!/^\d{4}$/.test(pin || '')) return res.status(400).json({ error: 'PIN musi mieć 4 cyfry' });
      u.salt = randomBytes(8).toString('hex');
      u.h = hash(u.salt, pin);
    } else if (action === 'setAv') {
      if (!goodAv(av)) return res.status(400).json({ error: 'Zły awatar' });
      u.av = av;
    } else if (action === 'rename') {
      const n = String(name || '').trim().slice(0, 20);
      if (!n) return res.status(400).json({ error: 'Imię nie może być puste' });
      if (users.some(x => x.id !== u.id && x.name.toLowerCase() === n.toLowerCase())) return res.status(409).json({ error: 'Taki użytkownik już istnieje' });
      u.name = n;
    } else if (action === 'delete') {
      const rest = users.filter(x => x.id !== id);
      await writeJSON('users.json', rest);
      const key = 'data-' + id + '.json';
      const { blobs } = await list({ prefix: key });
      for (const b of blobs) if (b.pathname === key) await del(b.url);
      return res.status(200).json({ ok: true });
    } else {
      return res.status(400).json({ error: 'Nieznana akcja' });
    }
    await writeJSON('users.json', users);
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
