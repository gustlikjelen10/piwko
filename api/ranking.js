import { readJSON } from './_db.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const users = await readJSON('users.json', []);
    const out = await Promise.all(users.map(async u => {
      let n = 0;
      try {
        const d = await readJSON('data-' + u.id + '.json', { beers: [] });
        n = (d.beers || []).reduce((s, b) => s + 1 + ((b.more || []).length), 0);
      } catch (_) {}
      return { id: u.id, name: u.name, av: u.av, count: n };
    }));
    out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pl'));
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
