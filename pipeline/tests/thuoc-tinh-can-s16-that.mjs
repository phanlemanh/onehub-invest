#!/usr/bin/env node
// thuoc-tinh-can-s16-that.mjs — hồ sơ thuoc-tinh-can-s16 (DA40), thước «TTC-AC-11» (E13) trên dữ liệu thật. Ngoài CI.
// Chỉ đọc (giao dịch READ ONLY): DATABASE_URL, mặc định DB máy thu :5433/oneinvest. Không import pipeline/lib/thuoc-tinh-can-s16.mjs
// — luật trường viết lại bằng SQL ở đây để là phép đếm độc lập.
// Bốn cột mỗi ô của năm dự án đã nối: «đếm thẳng» (stg + bí danh) · «view» (v_unit_thuoc_tinh, v_s16_gia_cdt) · «chạy thử»
// (khối ```chay-thu của _acceptance/thuoc-tinh-can-s16/ap-may-thu.md, nếu có) · «bảng phủ ca» (bang-phu-ca.md §1, đếm từ tệp
// thu gốc 18/11 — chỉ so khi snapshot là lượt 18/11).
// Thoát: 0 khớp · 1 lệch (in ô) · 3 chưa áp 113 hay bảng nạp rỗng. Chỉ in số và tên dự án ngắn; không mã căn, không snapshot.
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../..");
const HO_SO = join(GOC, "_acceptance/thuoc-tinh-can-s16");
const COT = ["noi", "living_area", "dien_tich_2", "bedrooms", "bathrooms", "direction_faces", "property_type", "gia_cdt"];

/** Bảng §1 của bảng phủ ca: tên ngắn → ô (cột «Tim tường» = tim tường + đất sau Cổng 1). */
export function docBangPhuCa(md) {
  const out = new Map();
  for (const l of md.split("\n")) {
    const c = l.split("|").map((x) => x.trim());
    if (c.length < 15 || !/^[a-z0-9-]+$/.test(c[1])) continue;
    const so = (x) => (x === "—" ? 0 : Number(x.replace(/\./g, "")));
    out.set(c[1], { noi: so(c[5]), living_area: so(c[7]), dien_tich_2: so(c[8]), bedrooms: so(c[9]), bathrooms: so(c[10]),
      direction_faces: so(c[11]), property_type: so(c[12]), gia_cdt: so(c[13]) });
  }
  return out;
}

const SO_DU_AN = 5;

/**
 * So từng ô. Ma trận viết trước là năm dự án của khối chạy thử × tám cột: dự án vắng trong kết quả đếm, thiếu khối, thiếu cột so
 * đều tính là lệch, không được biến mất khỏi phép so. `ten` đổi tên dự án trong DB ra tên ngắn của hồ sơ.
 */
export function soCacO({ thang, view, chayThu, bang, luot1811, ten = (d) => d }) {
  const dong = [];
  const thieu = [];
  let lech = 0;
  let soO = 0;
  if (chayThu.size !== SO_DU_AN) { thieu.push(`khối chạy thử có ${chayThu.size}/${SO_DU_AN} dự án`); lech++; }
  const theoTen = new Map(thang.map((r) => [ten(r.du_an), r]));
  for (const r of thang) if (!chayThu.has(ten(r.du_an))) { thieu.push(ten(r.du_an)); lech++; }
  for (const t of chayThu.keys()) {
    const r = theoTen.get(t);
    if (!r) { thieu.push(t); lech += COT.length; continue; }
    for (const k of COT) {
      soO++;
      const v = view.get(r.du_an)?.[k] ?? 0;
      const ct = chayThu.get(t)?.[k];
      const bp = bang.get(t)?.[k];
      const sai = r[k] !== v || ct !== v || (luot1811 && bp !== v);
      if (sai) lech++;
      dong.push([t, k, r[k], v, ct ?? "-", bp ?? "-"].join(" | ") + (sai ? "  ← LỆCH" : ""));
    }
  }
  if (soO !== SO_DU_AN * COT.length) lech++;
  return { dong, thieu, lech, soO };
}

const SQL_THANG = `
WITH snap AS (SELECT s.snapshot_id, s.collected_at FROM airbnb_snapshots s
               WHERE EXISTS (SELECT 1 FROM stg_s16_can_chi_tiet x WHERE x.snapshot_id = s.snapshot_id)
               ORDER BY s.collected_at DESC NULLS LAST, s.snapshot_id DESC LIMIT 1),
d AS (SELECT c.*, upper(btrim(c.ma_can)) AS ma FROM stg_s16_can_chi_tiet c JOIN snap USING (snapshot_id)),
k AS (SELECT DISTINCT ON (d.du_an, d.ma) d.* FROM d
       WHERE (d.du_an, d.ma) IN (SELECT du_an, ma FROM d GROUP BY du_an, ma HAVING count(DISTINCT toa) = 1)
         AND NOT EXISTS (SELECT 1 FROM v_s16_can m WHERE m.mo_ho AND m.du_an = d.du_an AND m.ma_can = d.ma)
       ORDER BY d.du_an, d.ma, d.dong),
n AS (SELECT k.* FROM k JOIN registry_aliases a ON a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
        AND a.object_key LIKE 'unt\\_%' AND a.value = k.du_an || '/' || k.ma)
SELECT du_an, count(*)::int AS noi,
  count(*) FILTER (WHERE area_using > 0)::int AS living_area,
  count(*) FILTER (WHERE area_building > 0 AND height_type IN ('HIGH_RISE', 'LOW_RISE'))::int AS dien_tich_2,
  count(*) FILTER (WHERE bedroom > 0)::int AS bedrooms,
  count(*) FILTER (WHERE bathroom > 0)::int AS bathrooms,
  count(*) FILTER (WHERE upper(CASE height_type WHEN 'HIGH_RISE' THEN balcony_direction WHEN 'LOW_RISE' THEN direction END)
                   ~ '^(N|S|E|W|NE|NW|SE|SW|NORTH|SOUTH|EAST|WEST)(_(N|S|E|W|NE|NW|SE|SW|NORTH|SOUTH|EAST|WEST))?$')::int AS direction_faces,
  count(*) FILTER (WHERE upper(property_type) IN ('APARTMENT', 'PENT_HOUSE', 'ROW_HOUSE', 'SEMI_DETACHED_VILLA', 'DETACHED_VILLA',
                   'QUADRUPLE_VILLA', 'SHOP_HOUSE', 'ROW_SHOP_HOUSE', 'SEMI_DETACHED_SHOP', 'DETACHED_SHOP', 'COMMERCIAL_SERVICE'))::int AS property_type,
  count(*) FILTER (WHERE sale_price > 0)::int AS gia_cdt,
  (SELECT collected_at FROM snap) AS luc_thu
FROM n GROUP BY du_an`;

const SQL_VIEW = `
WITH a AS MATERIALIZED (SELECT object_key, split_part(value, '/', 1) AS du_an FROM registry_aliases
                         WHERE source = 'S16' AND kind = 'ma_nguon' AND retired_at IS NULL AND object_key LIKE 'unt\\_%'),
v AS MATERIALIZED (SELECT * FROM v_unit_thuoc_tinh), g AS MATERIALIZED (SELECT unit_key FROM v_s16_gia_cdt)
SELECT a.du_an, count(v.unit_key)::int AS noi,
  count(v.living_area)::int AS living_area,
  count(*) FILTER (WHERE v.building_area_total IS NOT NULL OR v.lot_size_area IS NOT NULL)::int AS dien_tich_2,
  count(v.bedrooms_total)::int AS bedrooms, count(v.bathrooms_total_integer)::int AS bathrooms,
  count(v.direction_faces)::int AS direction_faces, count(v.property_sub_type)::int AS property_type,
  count(g.unit_key)::int AS gia_cdt
FROM a LEFT JOIN v ON v.unit_key = a.object_key LEFT JOIN g ON g.unit_key = a.object_key GROUP BY a.du_an`;

async function main() {
  const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query("BEGIN READ ONLY");
    await c.query("SET LOCAL search_path = public");
    const co = (await c.query("SELECT to_regclass('public.v_unit_thuoc_tinh') IS NOT NULL AS co")).rows[0].co;
    if (!co) { console.log("thuoc-tinh-can-s16-that: chưa áp 113 — căn danh bạ có thuộc tính: 0"); return 3; }
    const thang = (await c.query(SQL_THANG)).rows;
    if (!thang.length) { console.log("thuoc-tinh-can-s16-that: bảng nạp chưa có dòng nối danh bạ — 0"); return 3; }
    const view = new Map((await c.query(SQL_VIEW)).rows.map((r) => [r.du_an, r]));
    const bang = docBangPhuCa(readFileSync(join(HO_SO, "bang-phu-ca.md"), "utf8"));
    const apTep = join(HO_SO, "ap-may-thu.md");
    const chayThu = new Map();
    if (existsSync(apTep)) {
      const m = readFileSync(apTep, "utf8").match(/```chay-thu\n([\s\S]*?)```/);
      for (const l of m ? m[1].trim().split("\n") : []) {
        const [ten, ...so] = l.split(/\s*\|\s*/);
        if (so.length === COT.length) chayThu.set(ten, Object.fromEntries(COT.map((k, i) => [k, Number(so[i])])));
      }
    }
    const luot1811 = new Date(thang[0].luc_thu).toISOString().slice(0, 10) === "2026-11-18";
    const ten = (duAn) => [...bang.keys()].find((b) => duAn === b || duAn.endsWith(`-${b}`)) ?? "(khác)";
    console.log(`lượt thu ${luot1811 ? "18/11 — so cả bảng phủ ca" : "khác 18/11 — cột bảng phủ ca chỉ in, không so"} · cột chạy thử: ${chayThu.size ? "có" : "chưa có"}`);
    console.log(["du_an", "o", "dem_thang", "view", "chay_thu", "bang_phu_ca"].join(" | "));
    const { dong, thieu, lech, soO } = soCacO({ thang: [...thang].sort((a, b) => b.noi - a.noi), view, chayThu, bang, luot1811, ten });
    for (const l of dong) console.log(l);
    if (thieu.length) console.log(`thiếu hoặc lạ so với ma trận viết trước: ${thieu.join(", ")}  ← LỆCH`);
    const tong = [...view.values()].reduce((s, r) => s + r.noi, 0);
    console.log(`tổng căn danh bạ có thuộc tính (view): ${tong} · ô đã so: ${soO}/${SO_DU_AN * COT.length} · ô lệch: ${lech}`);
    return lech ? 1 : 0;
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code)).catch((e) => { console.error(e.message); process.exit(2); });
}
