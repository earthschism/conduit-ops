const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.includes("'YOUR_SUPABASE_URL'");
console.log('Found placeholder:', before);
h = h.replace("'YOUR_SUPABASE_URL'", "'https://conduitorders.com/supabase'");
const after = h.includes('conduitorders.com/supabase');
console.log('Replaced successfully:', after);