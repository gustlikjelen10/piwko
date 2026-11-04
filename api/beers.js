import { put, list } from '@vercel/blob';

const KEY = 'beers.json';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: KEY });
      const b = blobs.find(x => x.pathname === KEY);
      if (!b) return res.status(200).json([]);
      const r = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' });
      const data = await r.json();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      await put(KEY, body, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
