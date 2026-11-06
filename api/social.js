import { readJSON, writeJSON, auth } from './_db.js';

const norm = s => String(s || '').trim().toLowerCase();
const drinksOf = b => [{ d: b.dt || '' }].concat(b.more || []);

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).end();
    const me = await auth(req);
    if (!me) return res.status(401).json({ error: 'PIN' });
    const b = req.body || {};
    const users = await readJSON('users.json', []);

    if (b.action === 'recommend') {
      const to = users.find(x => x.id === b.to && x.id !== me.id);
      if (!to) return res.status(404).json({ error: 'Nie ma takiego użytkownika' });
      const nm = String(b.nm || '').trim().slice(0, 120);
      if (!nm) return res.status(400).json({ error: 'Brak nazwy piwa' });
      const ik = 'inbox-' + to.id + '.json';
      const inbox = await readJSON(ik, []);
      inbox.push({
        id: Date.now() + Math.floor(Math.random() * 1000), from: me.name, nm,
        br: String(b.br || '').slice(0, 80), st: String(b.st || '').slice(0, 60), nt: String(b.nt || '').slice(0, 200)
      });
      await writeJSON(ik, inbox.slice(-100));
      return res.status(200).json({ ok: true });
    }

    const sharing = users.filter(x => x.share !== false);
    const datas = await Promise.all(sharing.map(async u => {
      let d = { beers: [] };
      try { d = await readJSON('data-' + u.id + '.json', { beers: [] }); } catch (_) {}
      return { u, d };
    }));

    if (b.action === 'feed') {
      const rows = [];
      for (const { u, d } of datas) {
        for (const x of d.beers || []) {
          for (const k of drinksOf(x)) {
            if (!k.d) continue;
            rows.push({ uid: u.id, name: u.name, av: u.av, nm: x.nm, br: x.br || '', st: x.st || '', rt: x.rt || 0, d: k.d, ph: x.ph || '', bid: x.id });
          }
        }
      }
      rows.sort((a, c) => c.d.localeCompare(a.d) || c.bid - a.bid);
      return res.status(200).json(rows.slice(0, 40));
    }

    if (b.action === 'ratings') {
      const out = [];
      for (const { u, d } of datas) {
        if (u.id === me.id) continue;
        for (const x of d.beers || []) {
          const sameName = norm(x.nm) === norm(b.nm);
          const sameBrew = !norm(x.br) || !norm(b.br) || norm(x.br) === norm(b.br);
          if (sameName && sameBrew) out.push({ name: u.name, rt: +x.rt || 0, count: drinksOf(x).length });
        }
      }
      return res.status(200).json(out);
    }
    res.status(400).json({ error: 'Nieznana akcja' });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
