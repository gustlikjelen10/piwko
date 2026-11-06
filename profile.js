import { readJSON, writeJSON, hash, auth } from './_db.js';
import { randomBytes } from 'crypto';

const goodAv = a => /^b[1-5]$/.test(a) || /^https:\/\//.test(a);

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).end();
    const me = await auth(req);
    if (!me) return res.status(401).json({ error: 'PIN' });
    const { name, av, newPin, cur } = req.body || {};
    const users = await readJSON('users.json', []);
    const u = users.find(x => x.id === me.id);
    if (!u) return res.status(404).json({ error: 'Nie ma takiego użytkownika' });
    if (name !== undefined) {
      const n = String(name).trim().slice(0, 20);
      if (!n) return res.status(400).json({ error: 'Imię nie może być puste' });
      if (users.some(x => x.id !== u.id && x.name.toLowerCase() === n.toLowerCase())) return res.status(409).json({ error: 'Taki użytkownik już istnieje' });
      u.name = n;
    }
    if (av !== undefined) {
      if (!goodAv(av)) return res.status(400).json({ error: 'Zły awatar' });
      u.av = av;
    }
    if (newPin) {
      if (!/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'PIN musi mieć 4 cyfry' });
      if (hash(u.salt, String(cur || '')) !== u.h) return res.status(403).json({ error: 'Obecny PIN jest zły' });
      u.salt = randomBytes(8).toString('hex');
      u.h = hash(u.salt, newPin);
    }
    await writeJSON('users.json', users);
    res.status(200).json({ ok: true, name: u.name, av: u.av });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
