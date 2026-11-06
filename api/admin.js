import { del, head } from '@vercel/blob';
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

    if (action === 'saveBadges') {
      const list = req.body.list;
      if (!Array.isArray(list) || list.length > 300) return res.status(400).json({ error: 'Zła lista odznak' });
      const clean = [];
      for (const x of list) {
        const n = String((x && x.n) || '').trim().slice(0, 60);
        const d = (Array.isArray(x && x.d) ? x.d : []).filter(k => /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(k));
        const t = String((x && x.t) || '').trim().slice(0, 300);
        if (n && d.length) clean.push({ n, d, t });
      }
      await writeJSON('badges.json', { list: clean });
      return res.status(200).json({ ok: true, count: clean.length });
    }
    if (action === 'saveAch') {
      const list = req.body.list;
      if (!Array.isArray(list) || list.length > 100) return res.status(400).json({ error: 'Zła lista osiągnięć' });
      const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
      const clean = [];
      for (const x of list) {
        const n = str(x && x.n, 40), t = str(x && x.t, 120), i = str(x && x.i, 8) || '🏅';
        const f = ['st', 'nm', 'br', 'co'].includes(x && x.f) ? x.f : 'st';
        const kw = (Array.isArray(x && x.kw) ? x.kw : []).map(k => str(k, 30).toLowerCase()).filter(Boolean).slice(0, 10);
        const m = Math.min(500, Math.max(1, parseInt(x && x.m, 10) || 1));
        const id = /^[a-z0-9_-]{1,24}$/i.test((x && x.id) || '') ? x.id : 'c' + Date.now().toString(36) + clean.length;
        if (n && kw.length) clean.push({ id, i, n, t, f, kw, m });
      }
      await writeJSON('ach.json', { list: clean });
      return res.status(200).json({ ok: true, count: clean.length });
    }
    if (action === 'resetAch') {
      await writeJSON('ach.json', { list: null });
      return res.status(200).json({ ok: true });
    }
    if (action === 'resetBadges') {
      await writeJSON('badges.json', { list: null });
      return res.status(200).json({ ok: true });
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
      for (const key of ['data-' + id + '.json', 'inbox-' + id + '.json']) {
        try { const h = await head(key); await del(h.url); } catch (_) {}
      }
      return res.status(200).json({ ok: true });
    } else {
      return res.status(400).json({ error: 'Nieznana akcja' });
    }
    await writeJSON('users.json', users);
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
