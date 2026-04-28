// build.js — run before every push: node build.js
const fs   = require('fs');
const path = require('path');

// Read .env if it exists (local dev), otherwise use process.env (Netlify)
const env = {};
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) env[key.trim()] = val.join('=').trim();
  });
}
// Merge with process.env (Netlify env vars take priority)
const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not found in .env or environment');
  process.exit(1);
}

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Inject keys
const key = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
// Use Netlify proxy to avoid tracking prevention blocks
const proxyUrl = 'https://conduitorders.com/supabase';
html = html.replace("'YOUR_SUPABASE_URL'", `'${proxyUrl}'`);
html = html.replace("'YOUR_SUPABASE_ANON_KEY'", `'${key}'`);

// Inject build timestamp for cache busting
const ts = new Date().toISOString();
html = html.replace('BUILD_TIMESTAMP', ts);

// Inject logo
const logoPath = path.join(__dirname, 'CONDUIT_LOGO.png');
if (fs.existsSync(logoPath)) {
  const logoB64 = fs.readFileSync(logoPath).toString('base64');
  html = html.replace("'YOUR_LOGO_B64'", `'${logoB64}'`);
  console.log('✓ Logo embedded');
} else {
  console.log('⚠ CONDUIT_LOGO.png not found — text wordmark used');
}

// Write to docs/
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
fs.writeFileSync(path.join(docsDir, 'index.html'), html);
// Copy Supabase library to docs/
const supaSrc = path.join(__dirname, 'supabase.min.js');
if (fs.existsSync(supaSrc)) {
  fs.copyFileSync(supaSrc, path.join(docsDir, 'supabase.min.js'));
  console.log('✓ Supabase library bundled locally');
}

console.log('✓ Built docs/index.html — version: ' + ts);
console.log('  URL: ' + SUPABASE_URL);
console.log('  Key: ' + SUPABASE_ANON_KEY.substring(0, 20) + '...');
