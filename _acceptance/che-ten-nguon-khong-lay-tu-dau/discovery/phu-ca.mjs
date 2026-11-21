// Bảng phủ ca che-ten-nguon-khong-lay-tu-dau — CHỈ in mã S0x, loại biến thể, độ dài, số dòng trúng. Không in tên.
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
const require = createRequire(import.meta.url);
const { Client } = require("/Users/manhphan/dev/onehub-invest/app/node_modules/pg");
const { fold } = await import("../../../pipeline/lib/mask-source-names.mjs");
const { FILL } = await import("/Users/manhphan/dev/onehub-invest/pipeline/sync-cloud.mjs");
const V = { a: "aàáảãạăằắẳẵặâầấẩẫậ", d: "dđ", e: "eèéẻẽẹêềếểễệ", i: "iìíỉĩị", o: "oòóỏõọôồốổỗộơờớởỡợ", u: "uùúủũụưừứửữự", y: "yỳýỷỹỵ" };
const re = (v) => [...v].map((c) => V[c] ? `[${V[c]}]` : c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
const variants = (name) => {
  const full = fold(name.trim()); const words = full.split(/[\s.\-_/]+/).filter(Boolean);
  const out = [["du", full], ["lien", words.join("")]];
  if (words.length > 1 && words[0].length >= 4) out.push(["tu-dau", words[0]]);
  const seen = new Set(); return out.filter(([, v]) => v.length >= 3 && !seen.has(v) && seen.add(v));
};
const c = new Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" }); await c.connect();
await c.query("SET statement_timeout = '120s'");
let rows = (await c.query("SELECT code, real_name, coalesce(source_ids,'{}') ids FROM source_registry ORDER BY code")).rows;
const extra = process.argv[2];
if (extra && existsSync(extra)) for (const r of JSON.parse(readFileSync(extra, "utf8"))) rows.push({ code: r.code + "*", real_name: r.real_name, ids: r.source_ids ?? [] });
const fillTables = FILL.filter((t) => !/^airdna_/.test(t));
const dem = async (sql, p) => { try { return Number((await c.query(sql, p)).rows[0].n); } catch (e) { return "lỗi:" + e.code; } };
console.log("mã | token | loại | dài | asset_nodes theo node_type | registry_aliases | bảng cloud trúng (bảng:số dòng)");
for (const r of rows) {
  const toks = [["ten", r.real_name], ...r.ids.map((x, k) => [`id${k}`, x])].filter(([, t]) => t && t.length);
  for (const [tk, t] of toks) for (const [kind, v] of variants(t)) {
    const rx = re(v);
    const nodes = (await c.query("SELECT node_type, count(*) n FROM asset_nodes WHERE name ~* $1 GROUP BY 1 ORDER BY 1", [rx])).rows.map((x) => `${x.node_type}:${x.n}`).join(",") || "0";
    const al = await dem("SELECT count(*) n FROM registry_aliases WHERE value ~* $1", [rx]);
    const cl = [];
    for (const tb of fillTables) { const n = await dem(`SELECT count(*) n FROM ${tb} t WHERE row_to_json(t)::text ~* $1`, [rx]); if (n !== 0) cl.push(`${tb}:${n}`); }
    console.log(`${r.code} | ${tk} | ${kind} | ${v.length} | ${nodes} | ${al} | ${cl.join(",") || "0"}`);
  }
}
await c.end();
