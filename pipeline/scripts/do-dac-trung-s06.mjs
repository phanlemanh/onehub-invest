// do-dac-trung-s06.mjs — hồ sơ _acceptance/dac-trung-nha-s06-len-canonical (HD5) AC-7, AC-8: thước trên bản chép dữ liệu thật.
// Một giao dịch ROLLBACK trên DATABASE_URL (chỉ DB thử oneinvest_<dãy>_<việc>), khoá 33033, nạp 045/059 (mở cổng) + 061:
//   1. transform-chotot của commit gốc GOC (trước HD5; cột 061 có mà rỗng) → chụp «trước»; thước AC-7 trên «trước» phải đỏ
//      với dòng «<trường>: X/Y < 95%» (không phải lỗi SQL);
//   2. transform-chotot của cây → chụp «sau»; AC-7: mỗi đặc trưng in ba số bằng SQL độc lập với bộ đọc (có khoá khác rỗng ·
//      bị loại là rác kèm ba giá trị rác phổ biến · có ô), tỉ lệ có ô / hợp lệ ≥ 95% (Hỏi-1: mẫu số hợp lệ); mọi ô mới khác
//      rỗng có phát biểu sống cùng giá trị;
//   3. AC-8: tập tin sống, năm cột cũ + offer_status của mọi tin sống, bathrooms của S03/S05 trước = sau; CLOUD_ALLOW không có
//      cột mới; đối chứng dương: đổi property_type một tin trên bản chép thì thước gọi tên tin.
// Không in số thật: chỉ số đếm, mã tin, hình dạng giá trị rác (chữ số → d). Sai → exit 1.
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { napDacTrung } from "../lib/nap-061.mjs";
import { CLOUD_ALLOW } from "../sync-cloud.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";
import { ASSERTION_FIELD } from "../lib/vocab.generated.mjs";

const GOC = "25ce701b";
const NGUONG = 0.95;
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-dac-trung-s06: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  process.exit(2);
}
const PIPE = join(import.meta.dirname, "..");
const A = ASSERTION_FIELD;
const BAY = [A.street_number, A.unit_number, A.frontage_length, A.lot_size_dimensions, A.stories, A.latitude, A.longitude];

// Mỗi đặc trưng: biểu thức «có khoá khác rỗng», «hợp lệ» và «giá trị nguồn» trên stg (a = tin stg, viết độc lập với bộ đọc).
const SO = (e) => `(CASE WHEN (${e}) ~ '^\\s*[0-9]+([.,][0-9]+)?\\s*(m|mét|tầng|t)?\\s*$' THEN replace(substring((${e}) from '[0-9]+(?:[.,][0-9]+)?'), ',', '.')::numeric END)`;
const DT = {
  street_number: { khoa: `coalesce(nullif(btrim(a.payload->>'street_number'),''), nullif(btrim(a.payload->>'streetnumber_display'),''))`, hop_le: null },
  unit_number: { khoa: `coalesce(nullif(btrim(a.payload->>'unitnumber_display'),''), nullif(btrim(a.payload->>'unitnumber'),''))`, hop_le: null },
  frontage_length: { khoa: `nullif(btrim(a.payload->>'width'),'')`, hop_le: `${SO("a.payload->>'width'")} > 0 AND ${SO("a.payload->>'width'")} <= 200` },
  lot_size_dimensions: { khoa: `CASE WHEN nullif(btrim(a.payload->>'width'),'') IS NOT NULL AND nullif(btrim(a.payload->>'length'),'') IS NOT NULL THEN (a.payload->>'width') || ' x ' || (a.payload->>'length') END`,
    hop_le: `${SO("a.payload->>'width'")} > 0 AND ${SO("a.payload->>'width'")} <= 200 AND ${SO("a.payload->>'length'")} > 0 AND ${SO("a.payload->>'length'")} <= 200` },
  stories: { khoa: `nullif(btrim(a.payload->>'floors'),'')`, hop_le: `${SO("a.payload->>'floors'")} BETWEEN 1 AND 100 AND ${SO("a.payload->>'floors'")} = trunc(${SO("a.payload->>'floors'")})` },
  latitude: { khoa: `CASE WHEN a.latitude IS NOT NULL AND a.longitude IS NOT NULL THEN a.latitude::text END`, hop_le: `a.latitude BETWEEN 8 AND 24 AND a.longitude BETWEEN 102 AND 110` },
  longitude: { khoa: `CASE WHEN a.latitude IS NOT NULL AND a.longitude IS NOT NULL THEN a.longitude::text END`, hop_le: `a.latitude BETWEEN 8 AND 24 AND a.longitude BETWEEN 102 AND 110` },
};

/** Ba số mỗi đặc trưng trên tin S06 sống, nối stg qua originating_system_key = list_id. */
async function demBaSo(c) {
  const kq = {};
  for (const [f, d] of Object.entries(DT)) {
    const hopLe = d.hop_le ?? "TRUE";
    const { rows: [r] } = await c.query(`
      SELECT count(*) FILTER (WHERE (${d.khoa}) IS NOT NULL)::int AS co_khoa,
             count(*) FILTER (WHERE (${d.khoa}) IS NOT NULL AND NOT coalesce(${hopLe}, false))::int AS rac,
             count(*) FILTER (WHERE (${d.khoa}) IS NOT NULL AND coalesce(${hopLe}, false))::int AS hop_le,
             count(*) FILTER (WHERE (${d.khoa}) IS NOT NULL AND coalesce(${hopLe}, false) AND o.${f} IS NOT NULL)::int AS co_o
        FROM sale_offers o JOIN stg_chotot_ads a ON a.list_id::text = o.originating_system_key
       WHERE o.source = 'S06'`);
    const { rows: mau } = await c.query(`
      SELECT regexp_replace(left(${d.khoa}, 20), '[0-9]', 'd', 'g') AS h, count(*)::int AS n
        FROM sale_offers o JOIN stg_chotot_ads a ON a.list_id::text = o.originating_system_key
       WHERE o.source = 'S06' AND (${d.khoa}) IS NOT NULL AND NOT coalesce(${hopLe}, false)
       GROUP BY 1 ORDER BY 2 DESC LIMIT 3`);
    kq[f] = { ...r, mau: mau.map((m) => `«${m.h}»×${m.n}`).join(" ") };
  }
  return kq;
}
/** Thước AC-7 trên trạng thái hiện tại: trả dòng đỏ (rỗng = đạt). */
function doBay(kq) {
  const do_ = [];
  for (const f of BAY) {
    const { hop_le, co_o } = kq[f];
    if (!hop_le) { do_.push(`${f}: mẫu số 0 — DB rỗng hay trỏ nhầm`); continue; }
    if (co_o / hop_le < NGUONG) do_.push(`${f}: ${co_o}/${hop_le} < 95%`);
  }
  return do_;
}
const COT_CU = [A.property_type, A.bedrooms, A.street_raw, A.block_raw, "floor_raw", A.offer_status];
async function chup(c) {
  const { rows } = await c.query(`SELECT offer_id, source, ${COT_CU.join(", ")}, bathrooms FROM sale_offers
    WHERE source IN ('S03','S05','S06') ORDER BY offer_id`);
  return rows;
}
/** Lệch cột cũ giữa hai chụp — mỗi phần tử gọi tên tin + cột. bathrooms chỉ xét S03/S05 (S06 nhận WC mới từ toilets). */
function lechCot(a, b) {
  const mb = new Map(b.map((t) => [t.offer_id, t]));
  const lech = [];
  for (const t of a) {
    const u = mb.get(t.offer_id);
    if (!u) { lech.push(`mất ${t.offer_id}`); continue; }
    for (const k of [...COT_CU, ...(t.source === "S06" ? [] : ["bathrooms"])]) if (String(t[k]) !== String(u[k])) lech.push(`${t.offer_id}.${k}`);
  }
  for (const u of b) if (!a.some((t) => t.offer_id === u.offer_id)) lech.push(`thêm ${u.offer_id}`);
  return lech;
}

let hong = 0;
const bao = (ok, dong) => { console.log(`${ok ? "✔" : "✖"} ${dong}`); if (!ok) hong++; };
const tam = [];
const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  const src = execFileSync("git", ["show", `${GOC}:pipeline/transform-chotot.mjs`], { cwd: PIPE, encoding: "utf8" });
  const f = join(PIPE, `.dds-tc-${process.pid}.mjs`);
  writeFileSync(f, src);
  tam.push(f);
  const goc = await import(pathToFileURL(f).href);

  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  await napPhatBieu(c);
  await napDacTrung(c);

  await goc.runTransformChotot(c);
  const truoc = await chup(c);
  let doTruoc;
  try { doTruoc = doBay(await demBaSo(c)); } catch (e) { doTruoc = null; console.log(`  lỗi SQL ở lượt gốc: ${e.message}`); }
  bao(Array.isArray(doTruoc) && doTruoc.length === BAY.length && doTruoc.every((d) => / < 95%$/.test(d)),
    `DT-AC-7 đỏ trên lượt gốc ${GOC} (cột có mà rỗng): ${doTruoc ? doTruoc.join("; ") : "lỗi SQL — thước không đo gì"}`);

  await runTransformChotot(c);
  const sau = await chup(c);
  const kq = await demBaSo(c);
  for (const f of BAY) {
    const { co_khoa, rac, hop_le, co_o, mau } = kq[f];
    console.log(`  ${f}: có khoá ${co_khoa} · rác ${rac}${mau ? ` (${mau})` : ""} · hợp lệ ${hop_le} · có ô ${co_o} · ${hop_le ? ((100 * co_o) / hop_le).toFixed(1) : "—"}%`);
  }
  const doSau = doBay(kq);
  bao(doSau.length === 0, `DT-AC-7 bản mới: mỗi đặc trưng ≥ 95% trên mẫu số hợp lệ${doSau.length ? ` — ${doSau.join("; ")}` : ""}`);
  const { rows: thieu } = await c.query(`
    SELECT o.offer_id, x.f FROM sale_offers o
      CROSS JOIN LATERAL (VALUES ('street_number', o.street_number), ('unit_number', o.unit_number),
        ('frontage_length', o.frontage_length::text), ('lot_size_dimensions', o.lot_size_dimensions), ('stories', o.stories::text),
        ('latitude', o.latitude::text), ('longitude', o.longitude::text)) AS x(f, v)
     WHERE o.source = 'S06' AND x.v IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM field_assertions fa WHERE fa.subject_key = 'S06:' || o.originating_system_key
             AND fa.field = x.f AND fa.retracted_at IS NULL AND fa.value_key = assertion_value_key(x.v))`);
  bao(thieu.length === 0, `DT-AC-7 mọi ô mới khác rỗng có phát biểu sống cùng giá trị — thiếu ${thieu.length}${thieu.length ? ` (${thieu.slice(0, 5).map((t) => `${t.offer_id}.${t.f}`).join("; ")})` : ""}`);

  const lech = lechCot(truoc, sau);
  bao(lech.length === 0 && truoc.length > 0, `DT-AC-8 tập tin + năm cột cũ + offer_status (mọi nguồn) + bathrooms (S03/S05): ${truoc.length} tin · lệch ${lech.length}${lech.length ? ` (${lech.slice(0, 10).join("; ")})` : ""}`);
  const doi = truoc.map((t, i) => (i === 0 ? { ...t, property_type: `${t.property_type}-x` } : t));
  const lechDoi = lechCot(truoc, doi);
  bao(lechDoi.length === 1 && lechDoi[0] === `${truoc[0].offer_id}.property_type`, `DT-AC-8 đối chứng: đổi property_type một tin thì thước gọi tên (${lechDoi.join("; ")})`);
  const loCloud = (CLOUD_ALLOW.sale_offers ?? []).filter((c2) => BAY.includes(c2));
  bao(loCloud.length === 0, `DT-AC-8 CLOUD_ALLOW.sale_offers không có cột mới${loCloud.length ? ` — có ${loCloud.join(", ")}` : ""}`);
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
  for (const f of tam) rmSync(f, { force: true });
}
console.log(hong ? `do-dac-trung-s06: ${hong} dòng đỏ` : "do-dac-trung-s06: xanh");
process.exit(hong ? 1 : 0);
