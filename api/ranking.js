import { readJSON, warsawDate } from './_db.js';

const weekStart = ds => {
  const d = new Date(ds + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    const today = warsawDate(), ws = weekStart(today), ms = today.slice(0, 7);
    const users = await readJSON('users.json', []);
    const out = await Promise.all(users.map(async u => {
      let count = 0, week = 0, month = 0;
      try {
        const d = await readJSON('data-' + u.id + '.json', { beers: [] });
        for (const b of d.beers || []) {
          for (const x of [{ d: b.dt }].concat(b.more || [])) {
            count++;
            const dd = x.d || '';
            if (dd >= ws && dd <= today) week++;
            if (dd.startsWith(ms)) month++;
          }
        }
      } catch (_) {}
      return { id: u.id, name: u.name, av: u.av, count, week, month };
    }));
    out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pl'));
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
