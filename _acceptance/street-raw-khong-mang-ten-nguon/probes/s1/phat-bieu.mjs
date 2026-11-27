// phat-bieu.mjs — bảng phủ ca S1 (PL39), lớp phát biểu: phát biểu SỐNG ở đường, toà, tầng theo nguồn × phương pháp, đếm số trúng
// bộ dò tên nguồn (kể cả phát biểu đang bị phát biểu khác che). Chỉ đọc, không in giá trị.
import { createRequire } from "node:module";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const P = join(resolve(dirname(fileURLToPath(import.meta.url)), "../../../.."), "pipeline");
const pg = createRequire(join(P, "package.json"))("pg");
const { docSourceNameEntries } = await import(pathToFileURL(join(P, "lib/source-name-entries.mjs")));
const { findSourceNames } = await import(pathToFileURL(join(P, "lib/mask-source-names.mjs")));
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, options: "-c default_transaction_read_only=on" });
await c.connect();
const e = await docSourceNameEntries(c);
const { rows } = await c.query(`SELECT split_part(subject_key, ':', 1) AS nguon, field, method, value FROM field_assertions
  WHERE retracted_at IS NULL AND field IN ('street_raw', 'block_raw', 'floor_raw')`);
const out = {};
for (const r of rows) {
  const k = `${r.nguon}\t${r.field}\t${r.method}`;
  const b = (out[k] ??= { song: 0, trung: 0 });
  b.song++;
  if (findSourceNames(r.value, e).length) b.trung++;
}
for (const [k, v] of Object.entries(out).sort()) console.log(`${k}\t${v.song}\t${v.trung}`);
await c.end();
