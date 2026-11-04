export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'Brak klucza GEMINI_API_KEY w ustawieniach Vercel' });
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const b64 = Buffer.concat(chunks).toString('base64');
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const prompt = 'Na zdjęciu jest piwo (butelka, puszka lub etykieta). Odczytaj z etykiety dane i zwróć TYLKO JSON w formacie ' +
      '{"nm":"nazwa piwa","br":"browar","st":"styl piwa, np. IPA, Stout, Lager","ab":"zawartość alkoholu jako liczba, np. 5.2"}. ' +
      'Jeśli czegoś nie widać na zdjęciu, wpisz pusty tekst "". Nie zgaduj.';
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'Błąd Gemini' });
    const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    const t = parts.map(p => p.text || '').join('');
    let o = {};
    try { o = JSON.parse(t.replace(/```json|```/g, '').trim()); } catch (_) {}
    const s = v => String(v == null ? '' : v).trim();
    res.status(200).json({
      nm: s(o.nm), br: s(o.br), st: s(o.st),
      ab: s(o.ab).replace(',', '.').replace(/[^\d.]/g, '')
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
