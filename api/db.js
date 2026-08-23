module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  // Extract path param — Vercel parses query string automatically
  const supabasePath = req.query && req.query.path ? req.query.path : '';

  if (!supabasePath) {
    return res.status(400).json({ error: 'Missing path parameter', url: req.url, query: req.query });
  }

  const supabaseUrl = `${SUPABASE_URL}/rest/v1/${supabasePath}`;

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (req.headers['prefer']) headers['Prefer'] = req.headers['prefer'];

  try {
    const body = ['POST','PATCH','PUT','DELETE'].includes(req.method) && req.body
      ? JSON.stringify(req.body) : undefined;

    const response = await fetch(supabaseUrl, { method: req.method, headers, body });
    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);
    if (contentType) res.setHeader('Content-Type', contentType);
    if (response.status === 204) return res.end();
    return res.send(await response.text());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}