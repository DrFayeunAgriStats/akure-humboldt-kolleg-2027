// Fails if any homepage-referenced local asset is missing. Run before merging: npm run check:assets
import { readFileSync, existsSync } from 'node:fs';
const html = readFileSync('lib/home.ts', 'utf8');
const refs = [...new Set([...html.matchAll(/src=\\?"(\/(?:branding|images|assets)\/[^"\\]+)/g)].map(m => m[1]))];
const missing = refs.filter(r => !existsSync('public' + r));
refs.forEach(r => console.log((missing.includes(r) ? 'MISSING ' : 'ok      ') + r));
if (missing.length) { console.error(`\n${missing.length} asset(s) missing — see ASSET_SOURCES.md`); process.exit(1); }
