import { createRequire } from "node:module"; const require = createRequire(import.meta.url);
const { Client } = require("/Users/manhphan/dev/onehub-invest/app/node_modules/pg");
const { fold, nameVariants } = await import("../../../pipeline/lib/mask-source-names.mjs");
const c = new Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" }); await c.connect();
const rows = (await c.query("SELECT code, real_name, coalesce(source_ids,'{}') ids FROM source_registry ORDER BY code")).rows;
const names = (await c.query("SELECT node_type, name FROM asset_nodes WHERE name IS NOT NULL")).rows.map((r) => [r.node_type, ` ${fold(r.name).replace(/[^\p{L}\p{N}]+/gu, " ")} `]);
for (const r of rows) {
  const toks = [r.real_name, ...r.ids].filter(Boolean);
  const all = toks.map((t) => { const f = fold(t.trim()); const w = f.split(/[\s.\-_/]+/).filter(Boolean); return { full: f, joined: w.join(""), first: w.length > 1 && w[0].length >= 4 ? w[0] : null }; });
  const fulls = new Set(all.flatMap((a) => [a.full, a.joined]));
  all.forEach((a, k) => { if (!a.first) return;
    const thua = fulls.has(a.first); // từ đầu trùng tên đủ/viết liền của token khác cùng nguồn
    const tuRieng = names.filter(([, n]) => n.includes(` ${a.first} `)).length; // tên danh bạ chứa đúng từ ấy đứng riêng
    console.log(`${r.code} token${k} từ-đầu dài ${a.first.length}: trùng tên đủ của chính nguồn=${thua} · tên danh bạ chứa từ đứng riêng=${tuRieng}`); });
}
await c.end();
