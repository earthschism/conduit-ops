// build.js — run before every push: node build.js
const fs   = require('fs');
const path = require('path');

// Read .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) { console.error('ERROR: .env file not found'); process.exit(1); }
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_ANON_KEY missing from .env');
  process.exit(1);
}

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Inject keys
html = html.replace("'YOUR_SUPABASE_URL'", `'${env.SUPABASE_URL}'`);
html = html.replace("'YOUR_SUPABASE_ANON_KEY'", `'${env.SUPABASE_ANON_KEY}'`);

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

console.log('✓ Built docs/index.html — version: ' + ts);
console.log('  URL: ' + env.SUPABASE_URL);
console.log('  Key: ' + env.SUPABASE_ANON_KEY.substring(0, 20) + '...');
