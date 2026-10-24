// hieu-chuan.test.tsx — hồ sơ hieu-chuan-mot-bo-so (ON10): vùng «Hiệu chuẩn» của /ops/quality.
// Hàm thuần bằng ma trận viết trước; truy vấn chạy ĐÚNG ba hàm của trang trên fixture trong BEGIN…ROLLBACK
// (Postgres local :5433, khoá 33033); thẻ/bảng vẽ trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

import {
  isEmptyComparison,
  isThin,
  pickRepresentative,
  splitCalibrated,
  TU_THU_DINH_NGHIA,
} from "../src/lib/calibration";
import { getAirdnaComparison, getAirdnaMarkets, getTruthfulCoverage, type AirdnaComparison } from "../src/lib/queries";

// ---- Hàm thuần ----

test("HC-AC-1 market đại diện", () => {
  const pick = (ms: [string, number | null][]) => pickRepresentative(ms.map(([airdnaId, listingCount]) => ({ airdnaId, listingCount })));
  assert.deepEqual(pick([["10", 10], ["3", 3]]), { airdnaId: "10", ofMarkets: 2 }, "nhiều listing nhất");
  assert.deepEqual(pick([["7", 5], ["12", 5]]), { airdnaId: "7", ofMarkets: 2 }, "hoà → mã nhỏ hơn (so số)");
  assert.deepEqual(pick([["1", 0], ["2", 7]]), { airdnaId: "2", ofMarkets: 2 }, "market rỗng cạnh market có listing");
  assert.deepEqual(pick([["1", null], ["2", 2]]), { airdnaId: "2", ofMarkets: 2 }, "chưa có số coi là 0");
  assert.deepEqual(pick([["a9", 4], ["a10", 4]]), { airdnaId: "a10", ofMarkets: 2 }, "mã chữ so chuỗi");
  assert.deepEqual(pick([["5", 1]]), { airdnaId: "5", ofMarkets: 1 }, "một market");
  assert.equal(pick([]), null, "không market");
  // Thứ tự đầu vào không đổi kết quả (chạy hai lần ra cùng số).
  assert.deepEqual(pick([["3", 3], ["10", 10]]), pick([["10", 10], ["3", 3]]), "đảo thứ tự");
});

test("HC-AC-4 mẫu mỏng", () => {
  const table: [number | null, boolean][] = [[0, true], [1, true], [4, true], [5, false], [6, false], [null, false]];
  for (const [n, want] of table) assert.equal(isThin(n), want, `isThin(${n})`);
});

/** Một thẻ so sánh với các số cho trước (null = trống). */
function cmp(o: { score?: number | null; adr?: [number | null, number | null]; occ?: [number | null, number | null]; listing?: [number | null, number | null] }): AirdnaComparison {
  const m = (metric: string, v: [number | null, number | null] | undefined, unit: string) => ({
    metric, ourValue: v?.[0] ?? null, ourUnit: unit, airdnaValue: v?.[1] ?? null, airdnaUnit: unit, ratio: null,
  });
  return {
    marketScore: o.score === undefined || o.score === null ? null : { total: o.score, seasonality: 0, revenueGrowth: 0, regulation: 0, rentalDemand: 0 },
    metrics: [m("ADR", o.adr, "VND"), m("Công suất", o.occ, "%"), m("Listing tự thu", o.listing, "")],
    submarketCount: 0,
    capturedAt: null,
    representative: { airdnaId: "1", ofMarkets: 1 },
    ourListings: o.listing?.[0] ?? 0,
    sampleListings: null,
  };
}

const NAM_THI_TRUONG = () => [
  { market: { id: "vn-a", name: "Thành phố Đủ Số" }, data: cmp({ score: 80, adr: [900000, 1000000], occ: [0.5, 0.6], listing: [20, 300] }) },
  { market: { id: "vn-b", name: "Tỉnh Chỉ Điểm" }, data: cmp({ score: 61 }) },
  { market: { id: "vn-c", name: "Tỉnh Chỉ Tự Thu" }, data: cmp({ listing: [3, null] }) },
  { market: { id: "vn-d", name: "Tỉnh Trống Hết" }, data: null },
  { market: { id: "vn-e", name: "Tỉnh Toàn Không" }, data: cmp({ score: 0, adr: [0, 0], occ: [0, 0], listing: [0, 0] }) },
];

test("HC-AC-5 gộp thị trường chưa có số", () => {
  assert.equal(isEmptyComparison(null), true);
  assert.equal(isEmptyComparison(cmp({ score: 0, adr: [0, 0], occ: [0, 0], listing: [0, 0] })), true, "toàn 0 là chưa có số");
  assert.equal(isEmptyComparison(cmp({ score: 61 })), false, "chỉ điểm vẫn có số");
  const cal = splitCalibrated(NAM_THI_TRUONG());
  assert.deepEqual(cal.calibrated.map((c) => c.market.id), ["vn-a", "vn-b", "vn-c"]);
  assert.deepEqual(cal.empty, ["Trống Hết", "Toàn Không"], "tên ngắn của thị trường chưa có số");
  // Chiều đỏ: bộ lọc cũ của trang giữ cả thị trường toàn 0.
  assert.equal(NAM_THI_TRUONG().filter((c) => c.data !== null).length, 4, "đối chứng bộ lọc cũ");
});

test("HC-AC-6 đếm", () => {
  assert.equal(splitCalibrated(NAM_THI_TRUONG()).label, "3 thị trường hiệu chuẩn");
});

test("HC-AC-3 câu định nghĩa nguyên văn", () => {
  assert.equal(TU_THU_DINH_NGHIA, "Listing tự thu: số listing đang theo dõi trong cả khu vực (gồm phường con)");
});

// ---- Truy vấn trên fixture (BEGIN…ROLLBACK) ----

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const KV = "vn-zz-hc-test";
const CU_XW = `SELECT source_area_key FROM area_sources WHERE area_id = $1 AND source = 'S02' LIMIT 1`;

async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/**
 * Khu vực thử gộp hai market S02: `zz1` rỗng (listing 0) chèn TRƯỚC `zz2` (listing 9). Listing tự thu: 3 ở khu vực + 4 ở
 * phường con = 7 trong cây; market_metrics chỉ có 1 listing (ca Đồng Nai: cây nhiều, mẫu tính ADR ít).
 */
async function seed(c: pg.Client) {
  await c.query(`INSERT INTO areas (id, region_type, name, country_code) VALUES ($1, 'market', 'Tỉnh Zz Thử', 'vn')`, [KV]);
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, $2, 'submarket', 'Phường Zz', 'vn')`, [`${KV}-p1`, KV]);
  for (let i = 0; i < 7; i++) {
    await c.query(`INSERT INTO listings (id, area_id, last_seen) VALUES ($1, $2, now())`, [`zz-hc-${i}`, i < 3 ? KV : `${KV}-p1`]);
  }
  await c.query(
    `INSERT INTO market_metrics (area_id, month, listing_count, booked_nights, available_nights, revenue)
     VALUES ($1, date '2026-10-01', 1, 29, 1, 29000000)`,
    [KV],
  );
  for (const [id, n] of [["zz1", 0], ["zz2", 9]] as const) {
    await c.query(`INSERT INTO airdna_markets (airdna_id, name, country_code) VALUES ($1, $2, 'vn')`, [id, `Zz ${id}`]);
    await c.query(`INSERT INTO area_sources (area_id, source, source_area_key) VALUES ($1, 'S02', $2)`, [KV, id]);
    await c.query(`INSERT INTO airdna_market_metrics (airdna_id, metric, period, value) VALUES ($1, 'listing_count', '2026-09', $2)`, [id, n]);
  }
  await c.query(`INSERT INTO airdna_market_metrics (airdna_id, metric, period, value) VALUES ('zz2', 'adr', '2026-09', 1000000)`);
}

test("HC-AC-1 fixture: hai lần cùng market đại diện", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c);
    const a = await getAirdnaComparison(KV, c);
    const b = await getAirdnaComparison(KV, c);
    assert.deepEqual(a?.representative, { airdnaId: "zz2", ofMarkets: 2 }, "market có listing, đại diện cho 2");
    assert.deepEqual(b?.representative, a?.representative, "lần hai cùng kết quả");
    // Chiều đỏ: câu cũ LIMIT 1 không ORDER BY bốc market rỗng chèn trước.
    assert.equal((await c.query(CU_XW, [KV])).rows[0].source_area_key, "zz1", "đối chứng câu cũ");
  });
});

test("HC-AC-2 một số tự thu ở ba hàm", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c);
    const card = await getAirdnaComparison(KV, c);
    const cov = (await getTruthfulCoverage(c)).find((r) => r.areaId === KV);
    const nat = (await getAirdnaMarkets(c)).filter((r) => r.ourAreaId === KV);
    assert.equal(card?.ourListings, 7, "thẻ");
    assert.equal(card?.metrics.find((m) => m.metric === "Listing tự thu")?.ourValue, 7, "dòng Listing tự thu của thẻ");
    assert.equal(cov?.ourListings, 7, "Độ phủ");
    assert.deepEqual(nat.map((r) => r.ourListings), [7, 7], "toàn quốc (hai market cùng khu vực)");
    assert.equal(card?.sampleListings, 1, "cỡ mẫu metrics");
    // Chiều đỏ: định nghĩa cũ của thẻ (max listing_count market_metrics) ra số khác.
    const cu = (await c.query(`SELECT max(listing_count) n FROM market_metrics WHERE area_id = $1`, [KV])).rows[0].n;
    assert.notEqual(Number(cu), 7, "đối chứng định nghĩa cũ");
    stash.card = card!;
    stash.cov = cov!;
    stash.nat = nat;
  });
});

/** Kết quả thật của ba hàm trên fixture — ca vẽ bên dưới dùng lại. */
const stash: { card?: AirdnaComparison; cov?: Awaited<ReturnType<typeof getTruthfulCoverage>>[number]; nat?: Awaited<ReturnType<typeof getAirdnaMarkets>> } = {};
