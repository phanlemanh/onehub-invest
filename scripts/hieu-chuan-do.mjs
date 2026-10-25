#!/usr/bin/env node
// Đo vùng «Hiệu chuẩn» của /ops/quality trên dữ liệu thật của DB local (hồ sơ hieu-chuan-mot-bo-so, ON10 — đường đo của
// ngưỡng hàng). Chỉ đọc. Dùng ĐÚNG ba hàm truy vấn của trang; số «có số» đếm lại bằng một câu SQL độc lập.
// Dùng (cần tsx của app để nạp .ts): cd app && node --import tsx ../scripts/hieu-chuan-do.mjs
import { createRequire } from "node:module";

import { isThin, splitCalibrated } from "../app/src/lib/calibration.ts";
import { shortAreaName } from "../app/src/lib/market-names.ts";
import { getAirdnaComparison, getAirdnaMarkets, getTruthfulCoverage } from "../app/src/lib/queries.ts";

const require = createRequire(new URL("../app/package.json", import.meta.url));
const pg = require("pg");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Đếm thị trường có ít nhất một số, KHÔNG qua splitCalibrated/isEmptyComparison: market đại diện chọn lại bằng SQL
// (nhiều listing_count S02 kỳ mới nhất nhất, hoà thì mã nhỏ nhất), rồi hỏi thẳng các bảng nguồn.
const CO_SO_SQL = `
WITH xw AS (
  SELECT x.area_id, x.source_area_key AS k,
         (SELECT value FROM airdna_market_metrics
           WHERE airdna_id = x.source_area_key AND metric = 'listing_count' ORDER BY period DESC LIMIT 1) AS lc
    FROM area_sources x JOIN areas a ON a.id = x.area_id AND a.region_type = 'market'
   WHERE x.source = 'S02'
), rep AS (
  SELECT DISTINCT ON (area_id) area_id, k FROM xw
   ORDER BY area_id, coalesce(lc, 0) DESC, CASE WHEN k ~ '^[0-9]+$' THEN k::numeric END NULLS LAST, k
), ap AS (
  SELECT airdna_id, max(period) AS p FROM airdna_market_metrics WHERE metric = 'adr' GROUP BY 1
)
SELECT r.area_id FROM rep r
 WHERE coalesce((SELECT total FROM airdna_scores s WHERE s.airdna_id = r.k), 0) <> 0
    OR EXISTS (SELECT 1 FROM airdna_market_metrics m JOIN ap ON ap.airdna_id = m.airdna_id AND m.period = ap.p
                WHERE m.airdna_id = r.k AND m.metric IN ('adr', 'occupancy', 'listing_count') AND coalesce(m.value, 0) <> 0)
    OR EXISTS (SELECT 1 FROM market_metrics mm WHERE mm.area_id = r.area_id
                AND (coalesce(mm.revenue, 0) > 0 OR coalesce(mm.booked_nights, 0) > 0))
    OR EXISTS (SELECT 1 FROM listings l JOIN areas sa ON sa.id = l.area_id WHERE coalesce(sa.parent_id, sa.id) = r.area_id)`;

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  const { rows: markets } = await c.query(`SELECT id, name FROM areas WHERE region_type = 'market' ORDER BY name`);
  const comparisons = [];
  let nhieu = 0;
  let lech2Lan = 0;
  for (const m of markets) {
    const a = await getAirdnaComparison(m.id, c);
    const b = await getAirdnaComparison(m.id, c);
    if (a?.representative.ofMarkets > 1) nhieu++;
    if (JSON.stringify(a?.representative) !== JSON.stringify(b?.representative)) lech2Lan++;
    comparisons.push({ market: m, data: a });
  }
  check(lech2Lan === 0 && nhieu >= 1, `chọn market đại diện hai lần cùng kết quả (${nhieu} khu vực nhiều market${lech2Lan ? `, ${lech2Lan} lệch` : ""})`);

  // Một số tự thu: so số ba hàm trả, theo khu vực.
  const cov = await getTruthfulCoverage(c);
  const nat = await getAirdnaMarkets(c);
  const byArea = new Map();
  const add = (id, nguon, n) => {
    if (!id || n === null || n === undefined) return;
    const e = byArea.get(id) ?? [];
    e.push([nguon, n]);
    byArea.set(id, e);
  };
  for (const { market, data } of comparisons) if (data) add(market.id, "thẻ", data.ourListings);
  for (const r of cov) add(r.areaId, "Độ phủ", r.ourListings);
  for (const r of nat) add(r.ourAreaId, "toàn quốc", r.ourListings);
  let soSanh = 0;
  const lech = [];
  for (const [id, vals] of byArea) {
    if (vals.length < 2) continue;
    soSanh++;
    if (new Set(vals.map(([, n]) => n)).size > 1) lech.push(`${id} ${vals.map(([s, n]) => `${s}=${n}`).join("/")}`);
  }
  check(lech.length === 0 && soSanh > 0, `tự thu bằng nhau ở ba nguồn cho ${soSanh} khu vực${lech.length ? ` — lệch: ${lech.join("; ")}` : ""}`);

  // Tỉ lệ «Listing»: thẻ (đầu ra thật của getAirdnaComparison) = bảng Độ phủ (getTruthfulCoverage) — hồ sơ
  // ty-le-listing-khu-vuc-gop. Một bên trống còn bên kia có số là lệch.
  const covBy = new Map(cov.map((r) => [r.areaId, r]));
  let soTiLe = 0;
  let soGop = 0;
  const lechTiLe = [];
  for (const { market, data } of comparisons) {
    const r = covBy.get(market.id);
    if (!data || !r) continue;
    const a = data.metrics.find((m) => m.metric === "Listing")?.ratio ?? null;
    const b = r.ratio;
    soTiLe++;
    if (data.representative.ofMarkets > 1) soGop++;
    if ((a === null) !== (b === null) || (a !== null && Math.abs(a - b) > 1e-12)) lechTiLe.push(`${market.id} thẻ=${a} Độ phủ=${b}`);
  }
  check(lechTiLe.length === 0 && soTiLe > 0 && soGop > 0, `tỉ lệ Listing thẻ = Độ phủ cho ${soTiLe} khu vực (${soGop} gộp nhiều market)${lechTiLe.length ? ` — lệch: ${lechTiLe.join("; ")}` : ""}`);
  // Đối chứng: tỉ lệ kiểu cũ (tự thu ÷ listing S02 của riêng market đại diện) lệch Độ phủ ở ít nhất một khu vực.
  const lcBy = new Map(
    (await c.query(`SELECT DISTINCT ON (airdna_id) airdna_id, value FROM airdna_market_metrics
                     WHERE metric = 'listing_count' ORDER BY airdna_id, period DESC`)).rows.map((r) => [r.airdna_id, Number(r.value)]),
  );
  let lechCuTiLe = 0;
  for (const { market, data } of comparisons) {
    const r = covBy.get(market.id);
    const lc = data ? lcBy.get(data.representative.airdnaId) : undefined;
    if (!data || !r || r.ratio === null || !lc) continue;
    if (Math.abs(data.ourListings / lc - r.ratio) > 1e-12) lechCuTiLe++;
  }
  check(lechCuTiLe >= 1, `đối chứng: tỉ lệ chia cho market đại diện lệch ở ${lechCuTiLe} khu vực`);

  // Đếm thị trường hiệu chuẩn: SQL độc lập so với splitCalibrated.
  const cal = splitCalibrated(comparisons);
  const coSo = new Set((await c.query(CO_SO_SQL)).rows.map((r) => r.area_id));
  const cal_ids = new Set(cal.calibrated.map((x) => x.market.id));
  const chiMot = [...coSo].filter((id) => !cal_ids.has(id)).concat([...cal_ids].filter((id) => !coSo.has(id)));
  check(chiMot.length === 0, `số thị trường hiệu chuẩn = ${cal.calibrated.length} (SQL độc lập ${coSo.size})${chiMot.length ? ` — chỉ một phía: ${chiMot.join(", ")}` : ""}`);
  console.log(`     đầu trang: «${cal.label}» · chưa có số (${cal.empty.length}): ${cal.empty.join(", ")}`);

  const mong = cal.calibrated.filter((x) => isThin(x.data.sampleListings));
  console.log(`mẫu mỏng: ${mong.map((x) => `${shortAreaName(x.market.name)} (${x.data.sampleListings})`).join(", ") || "không có"}`);

  // Đối chứng: định nghĩa cũ của thẻ (max listing_count market_metrics) lệch số tự thu chung.
  const cu = new Map((await c.query(`SELECT area_id, max(listing_count)::int AS n FROM market_metrics GROUP BY 1`)).rows.map((r) => [r.area_id, r.n]));
  const lechCu = comparisons.filter(({ market, data }) => data && cu.has(market.id) && cu.get(market.id) !== data.ourListings).length;
  check(lechCu >= 1, `đối chứng: cũ lệch ở ${lechCu} khu vực`);
} finally {
  await c.end();
}
if (fails.length) {
  console.error(`${fails.length} phép đo đỏ`);
  process.exit(1);
}
process.exit(0);
