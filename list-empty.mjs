import fs from 'fs';
const c = fs.readFileSync('src/i18n/convert.js', 'utf8');
const lines = c.split('\n');
const emptyKeys = [];
for (const line of lines) {
  if (line.includes('ru: ""') || line.includes('th: ""')) {
    const m = line.match(/"([^"]+)":\s*\{/);
    if (m) emptyKeys.push(m[1]);
  }
}
console.log(`Total empty: ${emptyKeys.length}`);
// Show first 30
emptyKeys.slice(0, 30).forEach(k => console.log(k));
