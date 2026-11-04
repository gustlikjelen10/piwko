import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const buf = Buffer.concat(chunks);
    const dir = (req.url || '').includes('avatar') ? 'avatars/' : 'photos/';
    const blob = await put(dir + Date.now() + '.jpg', buf, { access: 'public', contentType: 'image/jpeg' });
    res.status(200).json({ url: blob.url });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
