export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'Brak klucza GEMINI_API_KEY w ustawieniach Vercel' });
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const b64 = Buffer.concat(chunks).toString('base64');
    const models = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : ['gemini-3.8-flash', 'gemini-3.5-flash'];
    const prompt = 'Na zdjęciu jest piwo (butelka, puszka, kufel lub etykieta). Zidentyfikuj je. Odczytaj napisy z etykiety i uzupełnij dane. ' +
      'Jeśli rozpoznajesz piwo po wyglądzie etykiety lub nazwie, uzupełnij browar i styl na podstawie swojej wiedzy. ' +
      'Napisy mogą być częściowo zasłonięte przez dłoń lub obcięte: dopisz brakującą część nazwy, jeśli jest oczywista. ' +
      'Zwróć TYLKO JSON w formacie {"nm":"pełna nazwa piwa","br":"browar","st":"styl piwa, np. Lager, IPA, Stout","ab":"zawartość alkoholu jako liczba, np. 5.2"}. ' +
      'Pole ab zostaw puste, jeśli % alkoholu nie jest widoczne i nie jesteś pewien. Pozostałe pola wypełnij najlepiej, jak potrafisz.';
    const body = JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } }
    });
    let j = null, lastErr = 'Błąd Gemini';
    for (const model of models) {
      try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body,
          signal: AbortSignal.timeout(20000)
        });
        const d = await r.json();
        if (r.ok) { j = d; break; }
        lastErr = (d.error && d.error.message) || lastErr;
        if (![400, 404, 429, 500, 503].includes(r.status)) break;
      } catch (e) {
        lastErr = 'Model ' + model + ' nie odpowiedział na czas';
      }
    }
    if (!j) return res.status(502).json({ error: lastErr });
    const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    const t = parts.map(p => p.text || '').join('');
    let o = {};
    const clean = t.replace(/```json|```/g, '').trim();
    try { o = JSON.parse(clean); } catch (_) {
      const m = clean.match(/\{[\s\S]*\}/);
      if (m) { try { o = JSON.parse(m[0]); } catch (_) {} }
    }
    if (Array.isArray(o)) o = o[0] || {};
    const s = v => String(v == null ? '' : v).trim();
    res.status(200).json({
      raw: clean.slice(0, 300),
      nm: s(o.nm), br: s(o.br), st: s(o.st),
      ab: s(o.ab).replace(',', '.').replace(/[^\d.]/g, '')
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
