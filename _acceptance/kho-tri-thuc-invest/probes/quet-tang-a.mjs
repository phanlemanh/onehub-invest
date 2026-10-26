// quet-tang-a.mjs <gốc kho> <tệp…> — thoát 1 khi tệp chứa tên nguồn thật. Tên lấy từ migrations (bộ của kho) và
// source_registry ở DB local; in MÃ S0x và số chỗ, KHÔNG in tên. DB không tới được → thoát 2 (không chạy mù).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [root, ...tep] = process.argv.slice(2);
const { sourceRegistrySeeds, findSourceNames } = await import(path.join(root, 'scripts/lib/tier-a-source-names.mjs'));
const entries = sourceRegistrySeeds(root).map(s => ({ code: s.code, realName: s.realName }));
try {
  const main = path.dirname((await import('node:child_process')).execFileSync('git', ['-C', root, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim());
  const req = createRequire(path.join(main, 'app/package.json'));
  const { Client } = req('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://oneinvest:oneinvest@localhost:5433/oneinvest' });
  await c.connect(); const r = await c.query('select code, real_name from source_registry where real_name is not null'); await c.end();
  for (const x of r.rows) entries.push({ code: x.code, realName: x.real_name });
} catch (e) { console.error('quet-tang-a: không đọc được source_registry local — ' + e.message); process.exit(2); }
let bad = 0;
for (const f of tep) {
  const by = {}; for (const h of findSourceNames(readFileSync(f, 'utf8'), entries)) by[h.code] = (by[h.code] || 0) + 1;
  const s = Object.entries(by).map(([k, v]) => `${k}×${v}`).join(' ');
  if (s) { bad++; console.log(`tầng A ${path.basename(f)}: ${s}`); }
}
process.exit(bad ? 1 : 0);
