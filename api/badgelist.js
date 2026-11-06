import { readJSON } from './_db.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const safe = async k => { try { return await readJSON(k, { list: null }); } catch (_) { return { list: null }; } };
    const [b, a] = await Promise.all([safe('badges.json'), safe('ach.json')]);
    res.status(200).json({ list: Array.isArray(b.list) ? b.list : null, ach: Array.isArray(a.list) ? a.list : null });
  } catch (_) {
    res.status(200).json({ list: null, ach: null });
  }
}
