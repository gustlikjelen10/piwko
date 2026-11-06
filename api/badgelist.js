import { readJSON } from './_db.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const d = await readJSON('badges.json', { list: null });
    res.status(200).json({ list: Array.isArray(d.list) ? d.list : null });
  } catch (_) {
    res.status(200).json({ list: null });
  }
}
