module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  // Debug: return everything we can see
  const debugInfo = {
    url: req.url,
    method: req.method,
    query: req.query,
  };

  // Try multiple ways to get the path
  let supabasePath = '';
  
  // Method 1: req.query (Vercel auto-parsed)
  if (req.query && req.query.path) {
    supabasePath = req.query.path;
  }
  // Method 2: parse URL manually
  else if (req.url) {
    const qIndex = req.url.indexOf('?');
    if (qIndex !== -1) {
      const qs = req.url.slice(qIndex + 1);
      const params = {};
      qs.split('&').forEach(p => {
        const [k, v] = p.split('=');
        if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
      });
      supabasePath = params['path'] || '';
    }
  }

  if (!supabasePath) {
    return res.status(400).json({ error: 'Missing path', debug: debugInfo });
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