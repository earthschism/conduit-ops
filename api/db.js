// Vercel serverless function — proxies Supabase REST API
// Credentials stay server-side, never exposed to browser

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  // Extract the path after /api/db/
  const path = req.query.path ? (Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path) : '';

  // Build query string (exclude 'path' param)
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') params.append(key, value);
  }
  const qs = params.toString();
  const url = `${SUPABASE_URL}/rest/v1/${path}${qs ? '?' + qs : ''}`;

  // Forward auth token from client if present, else use service key
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace('Bearer ', '') : SUPABASE_KEY;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': req.headers['prefer'] || 'return=minimal',
      },
      body: ['POST','PATCH','PUT'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);
    res.setHeader('Content-Type', contentType || 'application/json');

    if (response.status === 204 || response.status === 201) {
      return res.end();
    }

    const text = await response.text();
    return res.send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}