#!/usr/bin/env node
// thuoc-tinh-can-s16.mjs — DA40 thuoc-tinh-can-s16: thuộc tính căn S16 (stg_s16_can_chi_tiet, migration 113) → phát biểu
// field_assertions resource Unit (S16, lớp fact, phương pháp source_field) cho căn danh bạ có bí danh ma_nguon S16 còn sống.
// Thiết kế: _acceptance/thuoc-tinh-can-s16/design.md §5. Luật trường: pipeline/lib/thuoc-tinh-can-s16.mjs.
//
//   node pipeline/scripts/thuoc-tinh-can-s16.mjs            chạy thử: in bảng số theo dự án × trường, không ghi
//   node pipeline/scripts/thuoc-tinh-can-s16.mjs --ghi      ghi phát biểu (một giao dịch; chạy lại 0 dòng mới)
//     --snapshot <id>   chọn snapshot (mặc định: snapshot mới nhất có dòng trong bảng nạp)
//     --json            thêm một dòng JSON cuối (bảng số)
//     --db-that         bắt buộc khi --ghi vào DB tên `oneinvest` (DB máy thu); DB thử oneinvest_* khác thì không cần
// DATABASE_URL (mặc định DB local :5433/oneinvest). Máy chủ ngoài máy này luôn bị chặn.
// Không in mã căn, mã toà hay snapshot_id (tên snapshot mang tên nguồn thật); evidence chỉ mang mã S16 + băm snapshot.
// Cột du_an in nguyên mã dự án của nguồn: đầu ra chỉ ở terminal máy thu — chép vào hồ sơ thì dùng tên ngắn.
import { createHash } from "node:crypto";
import pg from "pg";
import { NGUON_S16, gopKhoa, khoaCan, phatBieuTuDong } from "../lib/thuoc-tinh-can-s16.mjs";

export const TRUONG = ["living_area", "building_area_total", "lot_size_area", "bedrooms", "bathrooms", "direction_faces", "property_type"];
export const PHUONG_PHAP_BAN = "thuoc-tinh-can-s16@1";

/** Đọc + tính, không ghi. Trả { bang, phat, chua_ap } — phat là các dòng sẵn để chèn. */
export async function tinh(c, { snapshot = null } = {}) {
  const { rows: co } = await c.query("SELECT to_regclass('public.stg_s16_can_chi_tiet') IS NOT NULL AS co");
  if (!co[0].co) return { chua_ap: true, bang: [], phat: [] };
  const { rows: sn } = await c.query(
    `SELECT s.snapshot_id, s.collected_at FROM airbnb_snapshots s
      WHERE EXISTS (SELECT 1 FROM stg_s16_can_chi_tiet x WHERE x.snapshot_id = s.snapshot_id)
        AND ($1::text IS NULL OR s.snapshot_id = $1)
      ORDER BY s.collected_at DESC NULLS LAST, s.snapshot_id DESC LIMIT 1`, [snapshot]);
  if (!sn.length) return { chua_ap: false, bang: [], phat: [], snapshot: null };
  const { snapshot_id: snap, collected_at: lucThu } = sn[0];
  const { rows } = await c.query(
    `SELECT du_an, toa, ma_can, dong, height_type, property_type, floor_number, bedroom, bathroom, direction, balcony_direction,
            sale_price, area_using, area_building FROM stg_s16_can_chi_tiet WHERE snapshot_id = $1`, [snap]);
  const { rows: bd } = await c.query(
    `SELECT a.value, u.unit_key, u.floor FROM registry_aliases a JOIN units u ON u.unit_key = a.object_key
      WHERE a.source = $1 AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.object_key LIKE 'unt\\_%'`, [NGUON_S16]);
  const biDanh = new Map(bd.map((r) => [r.value, r]));
  const danhBaTheoDuAn = new Map();
  for (const r of bd) { const d = r.value.split("/")[0]; danhBaTheoDuAn.set(d, (danhBaTheoDuAn.get(d) ?? 0) + 1); }

  const bam = createHash("sha256").update(snap).digest("hex").slice(0, 12);
  const theoDuAn = new Map();
  const o = (d) => {
    let x = theoDuAn.get(d);
    if (!x) theoDuAn.set(d, (x = { du_an: d, danh_ba: danhBaTheoDuAn.get(d) ?? 0, co_tt: 0, noi: 0, chua_can: 0, nhieu_toa: 0,
      ...Object.fromEntries(TRUONG.map((t) => [t, 0])), gia_cdt: 0, tang_lech: 0 }));
    return x;
  };
  const phat = [];
  for (const g of gopKhoa(rows).values()) {
    const x = o(g.du_an);
    x.co_tt++;
    if (g.nhieu_toa) { x.nhieu_toa++; continue; }
    const can = biDanh.get(khoaCan(g.du_an, g.ma));
    if (!can) { x.chua_can++; continue; }
    x.noi++;
    if (g.dong.floor_number && can.floor && String(g.dong.floor_number).trim() !== can.floor) x.tang_lech++;
    if (Number(g.dong.sale_price) > 0) x.gia_cdt++;
    const { phat: p } = phatBieuTuDong(g.dong);
    for (const t of new Set(p.map((v) => v.field))) x[t]++;
    for (const v of p) {
      phat.push({ subject_key: can.unit_key, field: v.field, value: v.value,
        evidence: { nguon: NGUON_S16, snap_bam: bam, lan_thu: lucThu ? new Date(lucThu).toISOString() : null } });
    }
  }
  const bang = [...theoDuAn.values()].sort((a, b) => b.co_tt - a.co_tt || a.du_an.localeCompare(b.du_an));
  return { chua_ap: false, bang, phat, snapshot: { bam, luc_thu: lucThu }, observed_at: lucThu ?? new Date() };
}

/** Chèn phát biểu (người gọi giữ giao dịch). Trả số dòng mới. */
export async function ghi(c, phat, observedAt, runId) {
  if (!phat.length) return 0;
  const res = await c.query(
    `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, method_version, evidence,
                                   observed_at, changed_by, run_id)
     SELECT 'Unit', s, f, v, 'fact', 'source_field', $5, e, $6, 'thuoc-tinh-can-s16', $7
       FROM unnest($1::text[], $2::text[], $3::text[], $4::jsonb[]) AS t(s, f, v, e)
     ON CONFLICT DO NOTHING`,
    [phat.map((p) => p.subject_key), phat.map((p) => p.field), phat.map((p) => p.value),
      phat.map((p) => JSON.stringify(p.evidence)), PHUONG_PHAP_BAN, observedAt, runId]);
  return res.rowCount;
}

export function inBang(bang) {
  const cot = ["du_an", "danh_ba", "co_tt", "noi", "chua_can", "nhieu_toa", ...TRUONG, "gia_cdt", "tang_lech"];
  const out = [cot.join(" | ")];
  for (const r of bang) out.push(cot.map((k) => r[k]).join(" | "));
  const tong = Object.fromEntries(cot.map((k) => [k, k === "du_an" ? "TONG" : bang.reduce((s, r) => s + r[k], 0)]));
  out.push(cot.map((k) => tong[k]).join(" | "));
  return out.join("\n");
}

function chanDich(url, ghiVao, dbThat) {
  const u = new URL(url.replace(/^postgres(ql)?:/, "http:"));
  const host = process.env.PGHOST ?? u.searchParams.get("host") ?? u.hostname;
  if (!["localhost", "127.0.0.1", "::1", "[::1]", ""].includes(host)) throw Object.assign(new Error(`thuoc-tinh-can-s16: máy chủ ngoài máy này bị chặn (${host})`), { ma: 2 });
  const ten = u.pathname.replace(/^\//, "");
  if (ghiVao && ten === "oneinvest" && !dbThat) throw Object.assign(new Error("thuoc-tinh-can-s16: --ghi vào DB máy thu cần --db-that"), { ma: 2 });
}

async function main() {
  const a = process.argv.slice(2);
  const coGhi = a.includes("--ghi");
  const i = a.indexOf("--snapshot");
  const snapshot = i >= 0 ? a[i + 1] : null;
  const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  chanDich(url, coGhi, a.includes("--db-that"));
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    if (coGhi) await c.query("BEGIN");
    const kq = await tinh(c, { snapshot });
    if (kq.chua_ap) { console.log("thuoc-tinh-can-s16: chưa áp 113 — không có bảng nạp"); if (coGhi) await c.query("ROLLBACK"); return; }
    if (!kq.snapshot) { console.log("thuoc-tinh-can-s16: bảng nạp chưa có dòng"); if (coGhi) await c.query("ROLLBACK"); return; }
    console.log(`snapshot ${kq.snapshot.bam} · thu ${kq.snapshot.luc_thu ? new Date(kq.snapshot.luc_thu).toISOString() : "?"}`);
    console.log(inBang(kq.bang));
    console.log(`phat_bieu ${kq.phat.length}`);
    let moi = 0;
    if (coGhi) {
      moi = await ghi(c, kq.phat, kq.observed_at, `ttc-${Date.now()}`);
      await c.query("COMMIT");
      console.log(`ghi ${moi} dòng mới`);
      // Lượt đầu chèn vài trăm nghìn phát biểu: thiếu thống kê thì câu đọc của trang Danh bạ chọn kế hoạch hàng phút (đo 18/11).
      if (moi > 0) await c.query("ANALYZE field_assertions");
    } else {
      console.log("chạy thử — không ghi (thêm --ghi để ghi)");
    }
    if (a.includes("--json")) console.log(JSON.stringify({ bang: kq.bang, phat_bieu: kq.phat.length, ghi: moi }));
  } catch (e) {
    if (coGhi) await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(e.ma ?? 1); });
}
