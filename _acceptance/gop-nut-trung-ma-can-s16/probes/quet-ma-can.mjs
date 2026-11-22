#!/usr/bin/env node
// quet-ma-can.mjs — S1 DA53, CHỈ ĐỌC: với mọi nút phân khu do luật S16 đúc còn sống, so mã căn S16 của khu nó mang với mã căn
// của khu thuộc từng nút phân khu khác cùng dự án (không do luật đúc, chưa nghỉ). In số, không in mã khu/toà/căn thô.
// Hai thước: trùng = mã căn có ở cả hai khu; thuoc_toa = mã căn mang tiền tố một toà của khu nút kia (ranh giới như AC-1).
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(`${ROOT}/pipeline/package.json`)("pg");
const { khoaKhu } = await import(pathToFileURL(`${ROOT}/pipeline/lib/s16-phan-khu.mjs`).href);
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
await c.query("SET default_transaction_read_only = on");
const { rows: nut } = await c.query(`
  SELECT n.id::int, n.name, n.parent_id::int, n.meta, p.node_type AS cha_loai,
         COALESCE((n.meta->>'nghi')::boolean,false) AS nghi, (n.meta->>'s16_rule_id') IS NOT NULL AS luat
    FROM asset_nodes n JOIN asset_nodes p ON p.id = n.parent_id WHERE n.node_type = 'subzone'`);
const duAnCua = new Map();
const byId = new Map(nut.map((n) => [n.id, n]));
const goc = (n) => { let x = n; while (x && byId.has(x.parent_id)) x = byId.get(x.parent_id); return x ? x.parent_id : null; };
for (const n of nut) duAnCua.set(n.id, goc(n));
// Mã căn theo khoá khu (bản snapshot mới nhất của từng khu).
const { rows: can } = await c.query(`
  WITH moi AS (SELECT du_an, khu_id, max(snapshot_id) s FROM stg_s16_khu GROUP BY 1,2)
  SELECT t.du_an, t.khu_id, t.toa_ten, c.ma_can
    FROM moi JOIN stg_s16_toa t ON t.snapshot_id = moi.s AND t.du_an = moi.du_an AND t.khu_id = moi.khu_id
    JOIN stg_s16_can c ON c.snapshot_id = t.snapshot_id AND c.toa_id = t.toa_id`);
const khu = new Map();
for (const r of can) {
  const k = khoaKhu(r.du_an, r.khu_id);
  const x = khu.get(k) ?? { ma: new Set(), toa: new Set() };
  x.ma.add(r.ma_can); if (r.toa_ten) x.toa.add(r.toa_ten); khu.set(k, x);
}
const gom = (n) => { const ma = new Set(), toa = new Set(); for (const k of n.meta?.s16_khu_ids ?? []) { const x = khu.get(k); if (x) { x.ma.forEach((m) => ma.add(m)); x.toa.forEach((t) => toa.add(t)); } } return { ma, toa }; };
// Ranh giới: sau tên toà là dấu chấm, hoặc tên toà có dấu chấm và sau là chữ số («S1» không nhận «S10.01»).
const thuocToa = (m, toa) => [...toa].some((t) => { if (!m.startsWith(t)) return false; const r = m.slice(t.length); return r.startsWith(".") || (t.includes(".") && /^[0-9]/.test(r)); });
const luat = nut.filter((n) => n.luat && !n.nghi);
const ra = [];
for (const m of luat) {
  const a = gom(m);
  if (!a.ma.size) { ra.push({ moi: `${m.id} ${m.name}`, so_ma: 0, ung_vien: [] }); continue; }
  const uv = [];
  for (const n of nut) {
    if (n.id === m.id || n.nghi || n.luat || duAnCua.get(n.id) !== duAnCua.get(m.id)) continue;
    const b = gom(n);
    if (!b.ma.size) continue;
    const trung = [...a.ma].filter((x) => b.ma.has(x)).length;
    const thuoc = [...a.ma].filter((x) => thuocToa(x, b.toa)).length;
    if (trung || thuoc) uv.push({ nut: `${n.id} ${n.name}`, trung, thuoc_toa: thuoc, so_ma_nut: b.ma.size });
  }
  ra.push({ moi: `${m.id} ${m.name}`, so_ma: a.ma.size, ung_vien: uv });
}
console.log(JSON.stringify({ nut_luat_song: luat.length, ket: ra }, null, 1));
await c.end();
