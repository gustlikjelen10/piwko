import { readJSON, writeJSON, auth } from './_db.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const u = await auth(req);
    if (!u) return res.status(401).json({ error: 'PIN' });
    const key = 'data-' + u.id + '.json';
    if (req.method === 'GET') return res.status(200).json(await readJSON(key, { beers: [], wish: [] }));
    if (req.method === 'POST') {
      const b = req.body || {};
      await writeJSON(key, { beers: b.beers || [], wish: b.wish || [] });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
