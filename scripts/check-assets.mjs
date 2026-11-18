// Fails if any locally referenced image asset is missing. Run before merging: npm run check:assets
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const files = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) && files.push(p); } };
['app', 'components', 'lib'].forEach(walk);
const refs = new Set();
for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/["'(](\/(?:branding|images|assets)\/[^"')\s]+)/g)) refs.add(m[1]);
const missing = [...refs].filter(r => !existsSync('public' + r));
[...refs].forEach(r => console.log((missing.includes(r) ? 'MISSING ' : 'ok      ') + r));
if (missing.length) { console.error(`\n${missing.length} asset(s) missing — see ASSET_SOURCES.md`); process.exit(1); }
