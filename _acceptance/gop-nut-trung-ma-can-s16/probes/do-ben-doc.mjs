#!/usr/bin/env node
// do-ben-doc.mjs — S1 DA53: các bên đọc trên main trước/sau khi gộp 389 vào 48 (giao dịch ROLLBACK, cùng cách apNoi của DA46).
// Chỉ chạy trên DB thử oneinvest_<…>. In số, không in chữ bài.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(URL_DB)) { console.error("do-ben-doc: chỉ chạy trên DB thử oneinvest_<…>"); process.exit(2); }
const pg = createRequire(`${ROOT}/pipeline/package.json`)("pg");
const { docTenPhanKhu, BANG_VIET_TAT } = await import(pathToFileURL(`${ROOT}/pipeline/lib/phan-khu-s16-bi-danh.mjs`).href);
const { doBiDanh } = await import(pathToFileURL(`${ROOT}/pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs`).href);
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
const doMot = async () => {
  const ten = (await docTenPhanKhu(c)).filter((r) => r.du_an === "16");
  const { rows: toa } = await c.query("SELECT region_node_id::int AS nut, count(*)::int n FROM v_toa_nut_vung WHERE region_node_id IN (48,389) GROUP BY 1 ORDER BY 1");
  const { rows: [pk] } = await c.query("SELECT count(*)::int n FROM asset_nodes WHERE node_type='subzone' AND COALESCE((meta->>'nghi')::boolean,false)=false");
  const { rows: [pk16] } = await c.query("SELECT count(*)::int n FROM asset_nodes WHERE node_type='subzone' AND parent_id=16 AND COALESCE((meta->>'nghi')::boolean,false)=false");
  const gt5 = await doBiDanh(c, { ruleId: null, bang: BANG_VIET_TAT });
  return { tu_dien_grand_park: ten.length, nut_mang_rainbow: ten.filter((r) => [r.name, ...(r.aliases ?? [])].some((x) => /rainbow/i.test(x))).map((r) => r.nut),
    toa_theo_nut: toa, phan_khu_song: pk.n, phan_khu_song_grand_park: pk16.n, gt5: { tin: gt5.tin, doc_duoc: gt5.sau } };
};
const truoc = await doMot();
await c.query("BEGIN");
const { rows: [m] } = await c.query("SELECT aliases, meta FROM asset_nodes WHERE id = 389");
const { rows: [k] } = await c.query("SELECT aliases FROM asset_nodes WHERE id = 48");
const them = (m.aliases ?? []).filter((x) => !(k.aliases ?? []).includes(x));
await c.query("UPDATE asset_nodes SET aliases = $2, meta = jsonb_set(meta, '{s16_khu_ids}', COALESCE(meta->'s16_khu_ids','[]'::jsonb) || $3::jsonb) WHERE id = $1",
  [48, [...(k.aliases ?? []), ...them], JSON.stringify(m.meta?.s16_khu_ids ?? [])]);
await c.query("UPDATE asset_nodes SET parent_id = 48, meta = meta || '{\"nghi\": true, \"s16_khu_ids\": []}'::jsonb WHERE id = 389");
const sau = await doMot();
await c.query("ROLLBACK");
console.log(JSON.stringify({ truoc, sau }, null, 1));
await c.end();
