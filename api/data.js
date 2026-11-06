import { readJSON, writeJSON, auth } from './_db.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const u = await auth(req);
    if (!u) return res.status(401).json({ error: 'PIN' });
    const key = 'data-' + u.id + '.json';
    if (req.method === 'GET') {
      const d = await readJSON(key, { beers: [], wish: [] });
      const ik = 'inbox-' + u.id + '.json';
      const inbox = await readJSON(ik, []);
      if (Array.isArray(inbox) && inbox.length) {
        const add = inbox.map(x => ({
          id: x.id, nm: x.nm, br: x.br || '', st: x.st || '',
          nt: ((x.nt ? x.nt + ' · ' : '') + 'polecił(a) ' + x.from).slice(0, 300), from: x.from
        }));
        d.wish = add.concat(d.wish || []);
        await writeJSON(key, { beers: d.beers || [], wish: d.wish });
        await writeJSON(ik, []);
      }
      return res.status(200).json({ beers: d.beers || [], wish: d.wish || [], share: u.share !== false });
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      await writeJSON(key, { beers: b.beers || [], wish: b.wish || [] });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
