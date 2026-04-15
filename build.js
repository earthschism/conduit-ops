// build.js - Run this once before pushing: node build.js
// Reads .env and injects Supabase keys into index.html -> dist/index.html

const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_ANON_KEY missing from .env');
  process.exit(1);
}

// Read index.html
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Inject keys
html = html.replace("'YOUR_SUPABASE_URL'", `'${env.SUPABASE_URL}'`);
html = html.replace("'YOUR_SUPABASE_ANON_KEY'", `'${env.SUPABASE_ANON_KEY}'`);

// Write to dist/index.html
const distDir = path.join(__dirname, 'docs');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
fs.writeFileSync(path.join(distDir, 'index.html'), html);

console.log('✓ Built dist/index.html with keys injected');
console.log(`  URL: ${env.SUPABASE_URL}`);
console.log(`  Key: ${env.SUPABASE_ANON_KEY.substring(0, 20)}...`);
