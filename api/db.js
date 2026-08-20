// Vercel serverless function — proxies Supabase REST API
// Place at: api/db.js (root level)

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  // req.url will be something like /api/db/coffees?select=*&active=eq.true
  // Extract everything after /api/db/
  const fullPath = req.url || '';
  const match = fullPath.match(/\/api\/db\/(.*)$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  const supabasePath = match[1]; // e.g. "coffees?select=*&active=eq.true"
  const supabaseUrl = `${SUPABASE_URL}/rest/v1/${supabasePath}`;

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  
  if (req.headers['prefer']) {
    headers['Prefer'] = req.headers['prefer'];
  }

  try {
    const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && req.body
      ? JSON.stringify(req.body)
      : undefined;

    const response = await fetch(supabaseUrl, {
      method: req.method,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);
    if (contentType) res.setHeader('Content-Type', contentType);
    if (response.status === 204) return res.end();

    const text = await response.text();
    return res.send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}