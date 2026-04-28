// build.js — run before every push: node build.js
const fs   = require('fs');
const path = require('path');

// Read .env if it exists (local), otherwise use process.env (Netlify)
const env = {};
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function(line) {
    const parts = line.split('=');
    const key = parts[0];
    const val = parts.slice(1).join('=');
    if (key && val) env[key.trim()] = val.trim();
  });
}

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_ANON_KEY not found');
  process.exit(1);
}

// Read index.html
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Use Netlify proxy URL for Supabase (avoids tracking prevention in all browsers)
const PROXY_URL = 'https://conduitorders.com/supabase';

// Replace placeholders - using split/join to avoid any quote character issues
html = html.split("'YOUR_SUPABASE_URL'").join("'" + PROXY_URL + "'");
html = html.split("'YOUR_SUPABASE_ANON_KEY'").join("'" + SUPABASE_ANON_KEY + "'");

// Inject build timestamp
const ts = new Date().toISOString();
html = html.split('BUILD_TIMESTAMP').join(ts);

// Inject logo
const logoPath = path.join(__dirname, 'CONDUIT_LOGO.png');
if (fs.existsSync(logoPath)) {
  const logoB64 = fs.readFileSync(logoPath).toString('base64');
  html = html.split("'YOUR_LOGO_B64'").join("'" + logoB64 + "'");
  console.log('✓ Logo embedded');
} else {
  console.log('⚠ CONDUIT_LOGO.png not found');
}

// Copy supabase.min.js to docs/
const supaPath = path.join(__dirname, 'supabase.min.js');
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
if (fs.existsSync(supaPath)) {
  fs.copyFileSync(supaPath, path.join(docsDir, 'supabase.min.js'));
  console.log('✓ Supabase library bundled locally');
}

// Write docs/index.html
fs.writeFileSync(path.join(docsDir, 'index.html'), html);

console.log('✓ Built docs/index.html — version: ' + ts);
console.log('  Proxy URL: ' + PROXY_URL);
console.log('  Key: ' + SUPABASE_ANON_KEY.substring(0, 20) + '...');
