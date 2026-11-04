import { readJSON, writeJSON, hash } from './_db.js';
import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const users = await readJSON('users.json', []);
    if (req.method === 'GET') return res.status(200).json(users.map(({ id, name, av }) => ({ id, name, av })));
    if (req.method === 'POST') {
      const { name, av, pin } = req.body || {};
      if (!name || !name.trim() || !/^\d{4}$/.test(pin || '')) return res.status(400).json({ error: 'Podaj imię i 4-cyfrowy PIN' });
      if (users.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) return res.status(409).json({ error: 'Taki użytkownik już istnieje' });
      const salt = randomBytes(8).toString('hex');
      const id = 'u' + randomBytes(5).toString('hex');
      users.push({ id, name: name.trim().slice(0, 20), av: av || 'b1', salt, h: hash(salt, pin) });
      if (users.length === 1) {
        const legacy = await readJSON('beers.json', null);
        if (Array.isArray(legacy)) await writeJSON('data-' + id + '.json', { beers: legacy, wish: [] });
      }
      await writeJSON('users.json', users);
      return res.status(200).json({ id });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
