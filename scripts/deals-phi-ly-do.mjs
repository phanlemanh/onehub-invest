#!/usr/bin/env node
// Đo «Căn giá tốt» trên dữ liệu thật của DB local (hồ sơ deals-loai-tin-phi-ly, ON11 — đường đo của ngưỡng hàng):
// chạy bước đêm refreshBaitGap rồi lấy danh sách bằng ĐÚNG câu dealsSql() của app, tất cả trong BEGIN…ROLLBACK.
// In số tin bị loại theo lý do và số giảm của 5 tin đầu; kiểm danh sách không còn tin phi lý, đầu danh sách không
// phải tin cần xác minh khi DB còn tin đủ điều kiện ≤ 35%; DB không đổi sau lượt đo.
// Đối chứng tự dựng (hồ sơ deals-phi-ly-do-doi-chung-tu-tinh): bước đêm đã loại tin phi lý khỏi DB thật, nên lượt đo xoá
// diện tích của tin đầu danh sách trong một SAVEPOINT để có một tin phi lý chắc chắn, đòi luật loại bắt đúng tin ấy, rồi lùi
// về SAVEPOINT — phần đo chính chạy trên dữ liệu nguyên.
// Dùng (cần tsx của app để nạp deals.ts): cd app && node --import tsx ../scripts/deals-phi-ly-do.mjs
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { implausibleReason } from "../pipeline/lib/deal-plausibility.mjs";
import { refreshBaitGap } from "../pipeline/refresh-bait-gap.mjs";
import { NGHI_NGO_PCT, dealsSql, toDealRow } from "../app/src/lib/deals.ts";

const PARAMS = [5, 30];
const phiLy = (rows) => rows.filter((r) => implausibleReason({ areaM2: r.areaM2, bedrooms: r.bedrooms }));

/**
 * Lõi đo, chạy trong giao dịch người gọi đã mở (không BEGIN/ROLLBACK ở đây). `refresh` là bước đêm — test truyền bản
 * hỏng để chứng chiều đỏ. Trả danh sách kiểm `{ ok, msg }` và `dat` (mọi kiểm ok).
 * @param {import("pg").Client} c
 * @param {{ refresh?: (c: import("pg").Client) => Promise<unknown>, log?: (s: string) => void }} [opts]
 */
export async function doTrongGiaoDich(c, { refresh = refreshBaitGap, log = console.log } = {}) {
  const kiem = [];
  const check = (ok, msg) => {
    log(`${ok ? "ok  " : "FAIL"} ${msg}`);
    kiem.push({ ok: Boolean(ok), msg });
  };
  const danhSach = async () => (await c.query(dealsSql(), PARAMS)).rows.map(toDealRow);
  const chayDem = async () => {
    const log0 = console.log;
    console.log = () => {}; // nhật ký của bước đêm không thuộc phép đo
    try {
      await refresh(c);
    } finally {
      console.log = log0;
    }
    return (await c.query(
      `SELECT detail FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly' ORDER BY id DESC LIMIT 1`,
    )).rows[0]?.detail ?? { total: 0, by_reason: {}, offer_ids: [] };
  };

  // ---- Đối chứng trong SAVEPOINT: tin đầu danh sách mất diện tích → phi lý «thieu-dien-tich», số giảm giữ nguyên. Bản chưa
  // loại phải còn nó, luật loại của bước đêm phải bắt đúng nó (quan hệ, không chỉ đếm). Lùi về SAVEPOINT rồi mới đo chính. ----
  const dau = (await danhSach())[0];
  if (!dau) {
    check(false, "không dựng được tin đối chứng: danh sách rỗng trước lượt đo");
    return { kiem, dat: false, doiChung: null, dau: null };
  }
  await c.query("SAVEPOINT doi_chung");
  try {
    await c.query(`UPDATE sale_offers SET area_m2 = NULL WHERE offer_id = $1`, [dau.offerId]);
    const cu = await danhSach();
    const loaiDc = await chayDem();
    check(phiLy(cu).some((r) => r.offerId === dau.offerId), `đối chứng: bản chưa loại còn ${phiLy(cu).length} tin phi lý`);
    check((loaiDc.offer_ids ?? []).includes(dau.offerId), `luật loại bắt tin đối chứng ${dau.offerId}`);
  } finally {
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");
  }

  // ---- Đo chính trên dữ liệu nguyên ----
  const loai = await chayDem();
  log(`loại: ${loai.total} tin ${JSON.stringify(loai.by_reason)}`);

  const moi = await danhSach();
  log(`5 tin đầu: ${moi.slice(0, 5).map((r) => `${r.discountPct}%${r.suspect ? " (cần xác minh)" : ""}`).join(" · ") || "(rỗng)"}`);

  check(!moi.some((r) => implausibleReason({ areaM2: r.areaM2, bedrooms: r.bedrooms }) === "thieu-dien-tich"),
    "không tin thiếu diện tích trong danh sách");
  check(!moi.some((r) => implausibleReason({ areaM2: r.areaM2, bedrooms: r.bedrooms }) === "phong-qua-nho"),
    "không tin phòng quá nhỏ trong danh sách");
  check(phiLy(moi).length === 0, `không tin phi lý nào trong danh sách (${phiLy(moi).length})`);

  // Lối thoát «nhóm thường rỗng» chỉ khi đếm trên toàn DB (cùng điều kiện của danh sách) không còn tin ≤ 35%.
  const thuong = (await c.query(
    `SELECT count(*)::int AS n FROM sale_offers o JOIN v_ruler_p2_area r ON r.area_id = o.area_id
     WHERE o.price_tier = 'P1' AND o.kind = 'sale' AND o.last_seen >= now() - interval '45 days'
       AND o.bait_gap_pct >= 5 AND o.bait_gap_pct <= $1`,
    [NGHI_NGO_PCT],
  )).rows[0].n;
  if (thuong > 0) check(moi.length > 0 && !moi[0].suspect, `đầu danh sách ≤ ${NGHI_NGO_PCT}% (DB còn ${thuong} tin ≤ ${NGHI_NGO_PCT}%)`);
  else check(true, `DB không còn tin đủ điều kiện ≤ ${NGHI_NGO_PCT}% — đầu danh sách là tin cần xác minh`);

  return { kiem, dat: kiem.every((k) => k.ok), doiChung: dau.offerId, dau: moi[0]?.offerId ?? null };
}

async function main() {
  const require = createRequire(new URL("../app/package.json", import.meta.url));
  const pg = require("pg");
  const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const snapshot = async (c) =>
    (await c.query(`SELECT count(*)::int AS n,
        md5(coalesce(string_agg(offer_id || ':' || coalesce(bait_gap_pct::text, '∅') || ':' || coalesce(area_m2::text, '∅'),
          ',' ORDER BY offer_id), '')) AS h,
        (SELECT count(*)::int FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly') AS audit
      FROM sale_offers`)).rows[0];

  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  const truoc = await snapshot(c);
  let kq;
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    kq = await doTrongGiaoDich(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
  }
  const sau = await snapshot(c);
  await c.end();
  const khongDoi = truoc.n === sau.n && truoc.h === sau.h && truoc.audit === sau.audit;
  console.log(`${khongDoi ? "ok  " : "FAIL"} DB không đổi (${truoc.n} tin, băm ${truoc.h.slice(0, 8)}, ${truoc.audit} dòng audit loại)`);

  const loi = kq.kiem.filter((k) => !k.ok).length + (khongDoi ? 0 : 1);
  console.log(loi === 0 ? "\ndeals-phi-ly-do: ĐẠT" : `\ndeals-phi-ly-do: ${loi} lỗi`);
  process.exit(loi === 0 ? 0 : 1);
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
