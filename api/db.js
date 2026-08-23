module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  // Parse the raw URL to get query string
  // req.url looks like /api/db?path=cycles%3Fselect%3D*
  const rawUrl = req.url || '';
  const qMark = rawUrl.indexOf('?');
  const qs = qMark !== -1 ? rawUrl.slice(qMark + 1) : '';
  
  // Parse query string manually
  const params = {};
  qs.split('&').forEach(function(pair) {
    const eq = pair.indexOf('=');
    if (eq !== -1) {
      const key = decodeURIComponent(pair.slice(0, eq));
      const val = decodeURIComponent(pair.slice(eq + 1));
      params[key] = val;
    }
  });

  const supabasePath = params['path'] || '';

  if (!supabasePath) {
    return res.status(400).json({ 
      error: 'Missing path',
      rawUrl: rawUrl,
      qs: qs,
      params: params
    });
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