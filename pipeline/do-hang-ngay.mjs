#!/usr/bin/env node
// do-hang-ngay.mjs — DO1 (AC-3..AC-7, AC-9): dòng chuyển bậc từng đơn vị + bốn nhóm số đo hằng ngày vào dq_check_results.
//   node pipeline/do-hang-ngay.mjs [--write] [--ngay YYYY-MM-DD]
// Không --write: tính trong giao dịch rồi ROLLBACK, in tóm tắt. --write: khoá advisory 56083 trong giao dịch, ghi
// data_level_change (gộp nhiều lần chạy trong ngày thành một dòng mỗi đơn vị), thay data_level_unit, ghi lại các dòng do1-*
// của ngày (giờ VN). Lần đầu (data_level_unit rỗng) chỉ lập mốc. Chạy sau bac-du-lieu.mjs (cùng hai hàm SQL của 056).
// Bảng 083 chỉ ở máy thu; số gộp lên cloud qua dq_check_results (đã có trong FILL của sync-cloud.mjs). detail qua chanLo.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import {
  boSot, chanLo, chuyenBac, demChuyenBac, giuNhap, khoaSilver, ngayVn, phanRa, tinHieu, tuanIso,
} from "./lib/do-hang-ngay.mjs";
import { khoangNgay, LAT_CUON_CHIEU, oBoDocLuat } from "./mau-soat-cuon-chieu.mjs";

const CORE_SQL = (o) => `jsonb_build_object(
  'kind', coalesce(${o}.kind <> '', false), 'property_type', coalesce(${o}.property_type <> 'unknown', false),
  'price_vnd', coalesce(${o}.price_vnd > 0, false), 'area_m2', coalesce(${o}.area_m2 > 0, false),
  'area_id', coalesce(${o}.area_id <> '', false),
  'measured', (SELECT bool_and(coalesce(${o}.field_provenance -> k ->> 'measured', '') = 'true')
                 FROM unnest(ARRAY['kind','property_type','price_vnd','area_m2','area_id']) k))`;

/** Bậc hiện tại của mọi đơn vị — cùng tập đơn vị với 610_data_level.sql. */
export async function donViHienTai(client) {
  const { rows } = await client.query(`
    WITH can AS (
      SELECT 'can:' || p.id AS unit_key, 'can' AS unit, b.data_level, b.ke_thieu, p.area_id, p.project_node,
             (SELECT min(o.source) FROM property_offers po JOIN sale_offers o USING (offer_id) WHERE po.property_id = p.id) AS source,
             (SELECT jsonb_build_object(
                'kind', bool_or((c->>'kind')::boolean), 'property_type', bool_or((c->>'property_type')::boolean),
                'price_vnd', bool_or((c->>'price_vnd')::boolean), 'area_m2', bool_or((c->>'area_m2')::boolean),
                'area_id', bool_or((c->>'area_id')::boolean), 'measured', coalesce(bool_or((c->>'measured')::boolean), false),
                'tin', coalesce(jsonb_agg(x.offer_id ORDER BY x.offer_id), '[]'::jsonb),
                'toa_chu', bool_or(x.block_raw IS NOT NULL AND x.block_raw <> ''))
                FROM (SELECT o.offer_id, o.block_raw, ${CORE_SQL("o")} AS c
                        FROM property_offers po JOIN sale_offers o USING (offer_id) WHERE po.property_id = p.id) x) AS core
        FROM property_data_level(NULL) b JOIN properties p ON p.id = b.property_id
    ), tin AS (
      SELECT 'tin:' || o.offer_id, 'tin_le', l.data_level, l.ke_thieu, o.area_id, NULL::bigint, o.source,
             ${CORE_SQL("o")} || jsonb_build_object('tin', '[]'::jsonb, 'toa_chu', coalesce(o.block_raw <> '', false))
        FROM sale_offers o
       CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id, false) l
       WHERE o.source IN ('S03', 'S05', 'S06') AND NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id)
    )
    SELECT d.*, w.id AS ward_id, m.id AS market_id
      FROM (SELECT * FROM can UNION ALL SELECT * FROM tin) d
      LEFT JOIN areas w ON w.id = d.area_id AND w.region_type = 'submarket'
      LEFT JOIN areas m ON m.region_type = 'market' AND m.id IN (d.area_id, (SELECT parent_id FROM areas WHERE id = d.area_id))`);
  return new Map(rows.map((r) => [r.unit_key, {
    unit_key: r.unit_key, unit: r.unit, source: r.source, data_level: r.data_level, ke_thieu: r.ke_thieu,
    core: { ...r.core, tin: r.core?.tin ?? [] }, market_id: r.market_id, ward_id: r.ward_id,
    project_key: r.project_node ? `node:${r.project_node}` : null, building_key: null,
  }]));
}

const chuaGan = (u, chieu) => (chieu === "toa" && u.core?.toa_chu ? { chua: "chua-co-danh-ba" } : { chua: "khong-tin-hieu" });
export const KHOA_LAT_DON_VI = {
  thi_truong: (u) => u.market_id ?? { chua: "khong-tin-hieu" },
  phuong: (u) => u.ward_id ?? { chua: "khong-tin-hieu" },
  du_an: (u) => u.project_key ?? chuaGan(u, "du_an"),
  toa: (u) => u.building_key ?? chuaGan(u, "toa"),
};

/** Ghi dòng chuyển của ngày: gộp với dòng đã có cùng (ngày, đơn vị) — giữ from đầu ngày, to mới nhất; về bậc cũ thì xoá. */
async function ghiChuyen(client, ngay, dong) {
  for (const d of dong) {
    const { rows: [cu] } = await client.query(
      `SELECT from_level, ly_do FROM data_level_change WHERE snap_date = $1 AND unit_key = $2`, [ngay, d.unit_key]);
    const from = cu ? cu.from_level : d.from_level;
    if (cu && from === d.to_level) {
      await client.query(`DELETE FROM data_level_change WHERE snap_date = $1 AND unit_key = $2`, [ngay, d.unit_key]);
      continue;
    }
    const huong = from === null ? "moi" : d.to_level === null ? "mat" : d.to_level > from ? "len" : "tut";
    const lyDo = [...new Set([...(cu?.ly_do ?? []), ...d.ly_do])];
    await client.query(
      `INSERT INTO data_level_change (snap_date, unit_key, unit, source, from_level, to_level, huong, ly_do, market_id, ward_id,
                                      project_key, building_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (snap_date, unit_key) DO UPDATE SET to_level = EXCLUDED.to_level, huong = EXCLUDED.huong, ly_do = EXCLUDED.ly_do`,
      [ngay, d.unit_key, d.unit, d.source, from, d.to_level, huong, lyDo, d.market_id, d.ward_id, d.project_key, d.building_key]);
  }
}

async function thayDonVi(client, nay, ngay) {
  await client.query("DELETE FROM data_level_unit");
  const ds = [...nay.values()];
  for (let i = 0; i < ds.length; i += 2000) {
    const lo = ds.slice(i, i + 2000);
    await client.query(
      `INSERT INTO data_level_unit (unit_key, unit, source, data_level, ke_thieu, core, market_id, ward_id, project_key, building_key, seen_on)
       SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(unit_key text, unit text, source text, data_level text, ke_thieu text,
              core jsonb, market_id text, ward_id text, project_key text, building_key text, seen_on date)`,
      [JSON.stringify(lo.map((u) => ({ ...u, seen_on: ngay })))]);
  }
}

/** Thẻ mẫu soát hai tuần gần nhất kèm nhãn người (nhãn mới nhất mỗi ô, mọi người gắn) và khu vực của tin. */
export async function docThe(client, ngay) {
  const { rows } = await client.query(
    `SELECT i.item_id, i.ref_id, i.stratum AS ngay, i.draft, o.area_id, w.id AS ward_id, m.id AS market_id,
            (SELECT jsonb_object_agg(field, jsonb_build_object('value', value, 'not_stated', not_stated))
               FROM (SELECT DISTINCT ON (field) field, value, not_stated FROM eval_labels l WHERE l.item_id = i.item_id
                      ORDER BY field, labeled_at DESC) x) AS nhan
       FROM eval_label_items i
       LEFT JOIN LATERAL (SELECT r.area_id FROM sale_offer_records r WHERE r.source = 'S03' AND i.ref_id = ANY (r.post_ids)
                           ORDER BY (r.retired_at IS NULL) DESC LIMIT 1) o ON true
       LEFT JOIN areas w ON w.id = o.area_id AND w.region_type = 'submarket'
       LEFT JOIN areas m ON m.region_type = 'market' AND m.id IN (o.area_id, (SELECT parent_id FROM areas WHERE id = o.area_id))
      WHERE i.lat = $1 AND i.stratum >= to_char($2::date - 13, 'YYYY-MM-DD') AND i.stratum <= $3`,
    [LAT_CUON_CHIEU, ngay, ngay]);
  return rows.map((r) => ({ ...r, item_id: Number(r.item_id) }));
}

/** Giá trị ô của thẻ: nhãn người trước, rồi nháp của cách đọc hiện. */
const oThe = (t, f) => t.nhan?.[f]?.value ?? t.draft?.cach_doc?.[t.draft?.hien]?.o?.[f] ?? null;
/** Chưa có liên kết danh bạ cho thẻ: bài nêu tên (dự án/toà) → «chưa có trong danh bạ», không nêu → «không nêu chỗ». */
const chuaThe = (t, f) => ({ chua: oThe(t, f) ? "chua-co-danh-ba" : "khong-tin-hieu" });
export const KHOA_LAT_THE = {
  thi_truong: (t) => t.market_id ?? { chua: "khong-tin-hieu" },
  phuong: (t) => t.ward_id ?? { chua: "khong-tin-hieu" },
  du_an: (t) => chuaThe(t, "project"),
  du_an_theo_chu: (t) => {
    const v = oThe(t, "project");
    return v ? `theo-chu-bai:${v}` : { chua: "khong-tin-hieu" };
  },
  toa: (t) => chuaThe(t, "building"),
};

/** Phân rã một tập thẻ theo mọi chiều: số thẻ và (n, giữ) của cách đọc hiện trên ô các thẻ đã soát. */
function latThe(the, ngay) {
  const tNay = tuanIso(ngay);
  const nay = the.filter((t) => tuanIso(t.ngay) === tNay);
  const ra = {};
  for (const [chieu, k] of Object.entries(KHOA_LAT_THE)) ra[chieu] = phanRa(nay, k);
  return ra;
}

/** Bốn nhóm số + dòng chuyển bậc của một ngày. Trả dòng dq (chưa ghi) và số đếm. */
export async function doHangNgay(client, { ngay = ngayVn(Date.now()), write = false, dotBien } = {}) {
  const ra = [];
  // ---- Chuyển bậc ----
  const nay = await donViHienTai(client);
  const { rows: truocRows } = await client.query("SELECT * FROM data_level_unit");
  let lapMoc = false, chuyen = [];
  if (!truocRows.length) {
    lapMoc = true;
    ra.push({ check_name: "do1-chuyen-bac", entity: "tat-ca", status: "skip", detail: { ly_do: "lap-moc", don_vi: nay.size } });
  } else {
    const truoc = new Map(truocRows.map((r) => [r.unit_key, r]));
    const tinTruoc = [...truoc.keys()].filter((k) => k.startsWith("tin:")).map((k) => k.slice(4));
    for (const u of truoc.values()) if (u.unit === "can") tinTruoc.push(...(u.core?.tin ?? []));
    const { rows: nghiRows } = await client.query(
      "SELECT offer_id FROM sale_offer_records WHERE retired_at IS NOT NULL AND offer_id = ANY ($1)", [tinTruoc]);
    chuyen = chuyenBac(truoc, nay, { nghi: new Set(nghiRows.map((r) => r.offer_id)), dotBien });
    await ghiChuyen(client, ngay, chuyen);
    const { rows: ngayRows } = await client.query("SELECT * FROM data_level_change WHERE snap_date = $1", [ngay]);
    // data_level_change không mang core: tra đơn vị (lần này, hoặc lần trước với đơn vị đã mất) để biết bài có nêu toà không.
    const donVi = (r) => nay.get(r.unit_key) ?? truoc.get(r.unit_key) ?? r;
    const lat = Object.fromEntries(Object.entries(KHOA_LAT_DON_VI).map(([c, k]) => [c, phanRa(ngayRows, (r) => k(dotBien === "lat-tren-dong" ? r : donVi(r)), () => 1, 30, { dotBien })]));
    ra.push({ check_name: "do1-chuyen-bac", entity: "tat-ca", status: "pass", detail: { ngay, ...demChuyenBac(ngayRows, { dotBien }), lat } });
  }
  await thayDonVi(client, nay, ngay);

  // ---- Mẫu soát: giữ nháp, bỏ sót ----
  const the = await docThe(client, ngay);
  const g = giuNhap(the, ngay, { dotBien });
  const coSoat = the.some((t) => t.nhan);
  ra.push({ check_name: "do1-giu-nhap", entity: "S03", status: coSoat ? "pass" : "skip",
    detail: { ngay, ...g, lat: latThe(the.filter((t) => t.nhan), ngay), ...(coSoat ? {} : { ly_do: "chua-co-the-soat" }) } });
  const b = boSot(the, ngay, { dotBien });
  ra.push({ check_name: "do1-bo-sot", entity: "S03", status: b.length ? "pass" : "skip",
    detail: { ngay, cach_doc: b, lat: latThe(the.filter((t) => t.nhan?.listing_intent?.value === "offer"), ngay) } });

  // ---- Tín hiệu không cần nhãn ----
  const [tu, den] = khoangNgay(ngay);
  const { rows: sl } = await client.query(
    `SELECT post_id, model, prompt_version, json_ok, listing_intent, kind, quote_ok, quote, probabilities
       FROM silver_labels WHERE source_code = 'S03' AND labeled_at >= $1 AND labeled_at < $2`, [tu, den]);
  const { rows: bietRows } = await client.query(
    `SELECT DISTINCT model, prompt_version, min(labeled_at) OVER (PARTITION BY model, prompt_version) AS dau
       FROM silver_labels WHERE source_code = 'S03' AND labeled_at >= $1::timestamptz - interval '14 days' AND labeled_at < $2`, [tu, den]);
  const daBiet = [...new Set(bietRows.map(khoaSilver))];
  const pids = [...new Set(sl.map((r) => r.post_id))];
  const { rows: tinSl } = await client.query(
    `SELECT DISTINCT ON (pid) pid, r.* FROM sale_offer_records r, unnest(r.post_ids) pid
      WHERE r.source = 'S03' AND pid = ANY ($1) ORDER BY pid, (r.retired_at IS NULL) DESC, r.offer_id`, [pids]);
  const th = tinHieu(sl, daBiet, new Map(tinSl.map((r) => [r.pid, oBoDocLuat(r)])), { dotBien });
  // Lát của tín hiệu: khu vực của tin mà bài thành (bài không thành tin → không nêu chỗ).
  const { rows: kv } = await client.query(
    `SELECT a.id, CASE WHEN a.region_type = 'submarket' THEN a.id END AS ward_id,
            CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END AS market_id
       FROM areas a WHERE a.id = ANY ($1)`, [[...new Set(tinSl.map((r) => r.area_id).filter(Boolean))]]);
  const kvCua = new Map(kv.map((r) => [r.id, r]));
  const viTri = new Map(tinSl.map((r) => [r.pid, kvCua.get(r.area_id) ?? {}]));
  const toaChu = new Set(tinSl.filter((r) => r.block_raw).map((r) => r.pid));
  const duAnChu = new Set(sl.filter((r) => r.probabilities?.o?.project?.v).map((r) => r.post_id));
  const latSl = {
    thi_truong: phanRa(sl, (r) => viTri.get(r.post_id)?.market_id ?? { chua: "khong-tin-hieu" }),
    phuong: phanRa(sl, (r) => viTri.get(r.post_id)?.ward_id ?? { chua: "khong-tin-hieu" }),
    du_an: phanRa(sl, (r) => ({ chua: duAnChu.has(r.post_id) ? "chua-co-danh-ba" : "khong-tin-hieu" })),
    toa: phanRa(sl, (r) => ({ chua: toaChu.has(r.post_id) ? "chua-co-danh-ba" : "khong-tin-hieu" })),
  };
  ra.push({ check_name: "do1-tin-hieu", entity: "S03", status: th.cach_doc.some((x) => x.status === "pass") ? "pass" : "skip", detail: { ngay, ...th, lat: latSl } });
  // Khoá đọc gộp mới chưa có dòng so cặp (AC-10): ghi skip «chưa so cặp» một lần.
  const gopTheoDau = bietRows.filter((r) => String(r.prompt_version).startsWith("dg")).sort((a, b2) => a.dau - b2.dau).map(khoaSilver);
  for (const k of [...new Set(gopTheoDau)].slice(1)) {
    const { rows: [co] } = await client.query(
      "SELECT 1 FROM dq_check_results WHERE check_name = 'do1-so-sanh' AND entity = $1 LIMIT 1", [k]);
    if (!co) ra.push({ check_name: "do1-so-sanh", entity: k, status: "skip", detail: { ngay, ly_do: "chua-so-cap" } });
  }

  // ---- Chặn rò (AC-9) rồi ghi ----
  const cam = await chuoiCam(client, the, sl, tinSl);
  if (dotBien?.startsWith("lo:")) for (const r of ra) r.detail = { ...r.detail, x: dotBien.slice(3) };
  for (const r of ra) chanLo(dotBien === "lo-trich" ? { ...r.detail, trich: sl.find((x) => x.quote)?.quote } : dotBien === "lo-labeler" ? { ...r.detail, nguoi: cam.find((x) => x.nhan === "LABELER")?.chuoi } : r.detail, cam);
  if (write) {
    // Một dòng mỗi (kiểm, đối tượng, ngày đo): xoá theo ngày đo ghi trong detail (không theo giờ chạy), đóng dấu clock_timestamp()
    // để các lần chạy trong cùng giao dịch vẫn xếp được trước sau.
    await client.query(
      `DELETE FROM dq_check_results WHERE check_name IN ('do1-chuyen-bac', 'do1-giu-nhap', 'do1-bo-sot', 'do1-tin-hieu')
         AND (detail::jsonb ->> 'ngay' = $1 OR (checked_at >= $2 AND checked_at < $3))`, [ngay, tu, den]);
    for (const r of ra) {
      await client.query(`INSERT INTO dq_check_results (checked_at, check_name, entity, status, detail) VALUES (clock_timestamp(), $1, $2, $3, $4)`,
        [r.check_name, r.entity, r.status, JSON.stringify({ ngay, ...r.detail })]);
    }
  }
  return { chuyen: chuyen.length, lap_moc: lapMoc, dq: ra };
}

/** Chuỗi không được có trong detail: tên nguồn thật, người gắn nhãn, chữ bài mẫu, câu trích dài, tên/SĐT người đăng. */
export async function chuoiCam(client, the, sl, tinSl) {
  const cam = [];
  const { rows: reg } = await client.query("SELECT real_name FROM source_registry");
  for (const r of reg) if (r.real_name?.length >= 4) cam.push({ nhan: "TEN NGUON", chuoi: r.real_name });
  const ids = the.map((t) => t.item_id);
  const { rows: lab } = await client.query("SELECT DISTINCT labeler_id FROM eval_labels WHERE item_id = ANY ($1)", [ids]);
  for (const r of lab) if (r.labeler_id?.length >= 6) cam.push({ nhan: "LABELER", chuoi: r.labeler_id });
  const { rows: bai } = await client.query(
    "SELECT DISTINCT ON (post_id) text, sender_name FROM stg_zalo_posts WHERE post_id = ANY ($1)", [the.map((t) => t.ref_id)]);
  for (const r of bai) {
    if (r.text?.length >= 20) cam.push({ nhan: "CHU BAI", chuoi: r.text.slice(0, 40) });
    if (r.sender_name?.length >= 4) cam.push({ nhan: "NGUOI DANG", chuoi: r.sender_name });
  }
  for (const r of sl) if (r.quote?.length >= 12) cam.push({ nhan: "TRICH", chuoi: r.quote });
  for (const r of tinSl) {
    if (r.seller_phone) cam.push({ nhan: "SDT", chuoi: r.seller_phone });
    if (r.seller_name?.length >= 4) cam.push({ nhan: "NGUOI DANG", chuoi: r.seller_name });
  }
  return cam;
}

async function main() {
  const a = process.argv.slice(2);
  const write = a.includes("--write");
  const ngay = a.includes("--ngay") ? a[a.indexOf("--ngay") + 1] : ngayVn(Date.now());
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(56083)");
    const kq = await doHangNgay(client, { ngay, write });
    await client.query(write ? "COMMIT" : "ROLLBACK");
    console.log(`do-hang-ngay ${ngay}: ${kq.lap_moc ? "lập mốc" : `${kq.chuyen} đơn vị đổi bậc`}; ${kq.dq.map((r) => `${r.check_name}=${r.status}`).join(" ")}${write ? "" : " (không ghi)"}`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { await client.end(); }
}
const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
