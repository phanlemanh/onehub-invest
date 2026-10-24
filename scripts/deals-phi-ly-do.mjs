#!/usr/bin/env node
// Đo «Căn giá tốt» trên dữ liệu thật của DB local (hồ sơ deals-loai-tin-phi-ly, ON11 — đường đo của ngưỡng hàng):
// chạy bước đêm refreshBaitGap rồi lấy danh sách bằng ĐÚNG câu dealsSql() của app, tất cả trong BEGIN…ROLLBACK.
// In số tin bị loại theo lý do và số giảm của 5 tin đầu; kiểm danh sách không còn tin phi lý, đầu danh sách không
// phải tin cần xác minh khi DB còn tin đủ điều kiện ≤ 35%; DB không đổi sau lượt đo.
// Dùng (cần tsx của app để nạp deals.ts): cd app && node --import tsx ../scripts/deals-phi-ly-do.mjs
import { createRequire } from "node:module";

import { implausibleReason } from "../pipeline/lib/deal-plausibility.mjs";
import { refreshBaitGap } from "../pipeline/refresh-bait-gap.mjs";
import { NGHI_NGO_PCT, dealsSql, toDealRow } from "../app/src/lib/deals.ts";

const require = createRequire(new URL("../app/package.json", import.meta.url));
const pg = require("pg");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

const snapshot = async (c) =>
  (await c.query(`SELECT count(*)::int AS n,
      md5(coalesce(string_agg(offer_id || ':' || coalesce(bait_gap_pct::text, '∅'), ',' ORDER BY offer_id), '')) AS h
    FROM sale_offers`)).rows[0];
const phiLy = (rows) => rows.filter((r) => implausibleReason({ areaM2: r.areaM2, bedrooms: r.bedrooms }));

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
const truoc = await snapshot(c);
try {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  const params = [5, 30];
  const cu = (await c.query(dealsSql(), params)).rows.map(toDealRow);

  const log = console.log;
  console.log = () => {}; // nhật ký của bước đêm không thuộc phép đo
  try {
    await refreshBaitGap(c);
  } finally {
    console.log = log;
  }
  const audit = (await c.query(
    `SELECT detail FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly' ORDER BY id DESC LIMIT 1`,
  )).rows[0];
  const loai = audit?.detail ?? { total: 0, by_reason: {} };
  console.log(`loại: ${loai.total} tin ${JSON.stringify(loai.by_reason)}`);

  const moi = (await c.query(dealsSql(), params)).rows.map(toDealRow);
  console.log(`5 tin đầu: ${moi.slice(0, 5).map((r) => `${r.discountPct}%${r.suspect ? " (cần xác minh)" : ""}`).join(" · ") || "(rỗng)"}`);

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

  // Đối chứng: danh sách lấy trên số giảm TRƯỚC luật loại phải còn tin phi lý — chứng phép đo phân biệt được.
  check(phiLy(cu).length > 0, `đối chứng: bản chưa loại còn ${phiLy(cu).length} tin phi lý`);
} finally {
  await c.query("ROLLBACK").catch(() => {});
}
const sau = await snapshot(c);
await c.end();
check(truoc.n === sau.n && truoc.h === sau.h, `DB không đổi (${truoc.n} tin, băm ${truoc.h.slice(0, 8)})`);

console.log(fails.length === 0 ? "\ndeals-phi-ly-do: ĐẠT" : `\ndeals-phi-ly-do: ${fails.length} lỗi`);
process.exit(fails.length === 0 ? 0 : 1);
