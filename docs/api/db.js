// Vercel serverless function — proxies Supabase REST API
// Credentials stay server-side via environment variables

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  // The full supabase path comes after /api/db/
  // e.g. /api/db/orders?select=*&cycle_id=eq.123
  const url = new URL(req.url, 'http://localhost');
  
  // Extract everything after /api/db/
  const pathMatch = url.pathname.match(/^\/api\/db\/(.*)$/);
  const supabasePath = pathMatch ? pathMatch[1] : '';
  const queryString = url.search; // includes the ?
  
  const supabaseUrl = `${SUPABASE_URL}/rest/v1/${supabasePath}${queryString}`;

  // Forward user's JWT if present for RLS
  const authHeader = req.headers['authorization'];
  const preferHeader = req.headers['prefer'];

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': authHeader || `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (preferHeader) headers['Prefer'] = preferHeader;

  try {
    const body = ['POST','PATCH','PUT'].includes(req.method)
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