import { createRequire } from "node:module"; import { readdirSync, readFileSync, statSync } from "node:fs"; const require = createRequire(import.meta.url);
const { Client } = require("/Users/manhphan/dev/onehub-invest/app/node_modules/pg");
const { fold } = await import("../../../pipeline/lib/mask-source-names.mjs");
const c = new Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" }); await c.connect();
const rows = (await c.query("SELECT code, real_name, coalesce(source_ids,'{}') ids FROM source_registry ORDER BY code")).rows;
const dir = "/Users/manhphan/dev/onehub-invest/pipeline/logs";
const logs = readdirSync(dir).filter((f) => f.endsWith(".log")).map((f) => fold(readFileSync(`${dir}/${f}`, "utf8").slice(-3_000_000)));
const hb = (await c.query("SELECT to_regclass('public.ops_heartbeat') r")).rows[0].r ? fold((await c.query("SELECT coalesce(string_agg(row_to_json(h)::text, ' '),'') t FROM (SELECT * FROM ops_heartbeat ORDER BY 1 DESC LIMIT 500) h")).rows[0].t) : "";
for (const r of rows) {
  const toks = [r.real_name, ...r.ids].filter(Boolean).map((t) => { const f = fold(t.trim()); const w = f.split(/[\s.\-_/]+/).filter(Boolean); return { full: f, joined: w.join(""), first: w.length > 1 && w[0].length >= 4 ? w[0] : null }; });
  const fulls = toks.flatMap((a) => [a.full, a.joined]);
  toks.forEach((a, k) => { if (!a.first || fulls.includes(a.first)) return;
    // dòng log chứa từ-đầu nhưng KHÔNG chứa tên đủ/viết liền nào của nguồn = chỗ chỉ biến thể từ-đầu che được
    let chi = 0, tong = 0;
    for (const L of logs) for (const line of L.split("\n")) if (line.includes(a.first)) { tong++; if (!fulls.some((f) => line.includes(f))) chi++; }
    const hbChi = hb.split(a.first).length - 1;
    console.log(`${r.code} token${k} từ-đầu dài ${a.first.length}: dòng log chứa ${tong}, trong đó CHỈ từ-đầu che được ${chi} · ops_heartbeat chứa ${hbChi}`); });
}
await c.end();
