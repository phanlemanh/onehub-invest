// ty-le-listing-gop.test.tsx — hồ sơ ty-le-listing-khu-vuc-gop: dòng «Listing» của thẻ hiệu chuẩn dùng đúng mẫu số của
// bảng Độ phủ trung thực (tổng listing S02 của mọi market thành phần) — ON10 Ngoài-13.
// Hàm thuần bằng ma trận viết trước; truy vấn chạy ĐÚNG getAirdnaComparison/getTruthfulCoverage trên fixture trong
// BEGIN…ROLLBACK (Postgres local :5433, khoá 33033 như hieu-chuan.test.tsx); thẻ vẽ trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

import { tongListingS02 } from "../src/lib/calibration";
import { getAirdnaComparison, getTruthfulCoverage, type AirdnaComparison } from "../src/lib/queries";

test("TL-AC-1 mẫu số chung tongListingS02", () => {
  const MA_TRAN: [(number | null)[], number | null][] = [
    [[], null],
    [[null], null],
    [[null, null], null],
    [[4, 9], 13],
    [[0, 9], 9],
    [[null, 5], 5],
    [[0], 0],
  ];
  let dem = 0;
  for (const [vao, ra] of MA_TRAN) {
    assert.equal(tongListingS02(vao), ra, `tongListingS02(${JSON.stringify(vao)})`);
    dem++;
  }
  assert.equal(dem, 7, "số dòng ma trận");
});

// ---- Truy vấn trên fixture (BEGIN…ROLLBACK) ----

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const GOP = "vn-zz-tl-gop";
const RONG = "vn-zz-tl-rong";
const MOT = "vn-zz-tl-mot";
const LECH_KY = "vn-zz-tl-lech-ky";
const MOT_NULL = "vn-zz-tl-mot-null";
const BA = "vn-zz-tl-ba";

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

type MarketSeed = {
  id: string;
  listing: number | null;
  /** Kỳ của số listing (mặc định 2026-09); kỳ cũ hơn 2026-08 luôn mang 1000 để bắt phép cộng mọi kỳ. */
  ky?: string;
  adr?: number;
  occ?: number;
  score?: number;
  subs?: number;
};

async function khuVuc(c: pg.Client, areaId: string, ten: string, tuThu: number, markets: MarketSeed[]) {
  await c.query(`INSERT INTO areas (id, region_type, name, country_code) VALUES ($1, 'market', $2, 'vn')`, [areaId, ten]);
  for (let i = 0; i < tuThu; i++) {
    await c.query(`INSERT INTO listings (id, area_id, last_seen) VALUES ($1, $2, now())`, [`${areaId}-l${i}`, areaId]);
  }
  for (const m of markets) {
    await c.query(`INSERT INTO airdna_markets (airdna_id, name, country_code) VALUES ($1, $2, 'vn')`, [m.id, `Zz ${m.id}`]);
    await c.query(`INSERT INTO area_sources (area_id, source, source_area_key) VALUES ($1, 'S02', $2)`, [areaId, m.id]);
    const so: [string, number | undefined | null, string][] = [
      ["listing_count", m.listing, m.ky ?? "2026-09"],
      ["adr", m.adr, "2026-09"],
      ["occupancy", m.occ, "2026-09"],
    ];
    for (const [metric, v, ky] of so) {
      if (v === null || v === undefined) continue;
      await c.query(`INSERT INTO airdna_market_metrics (airdna_id, metric, period, value) VALUES ($1, $2, $3, $4)`, [m.id, metric, ky, v]);
    }
    // Kỳ cũ hơn với số khác: mẫu số phải lấy kỳ mới nhất, không cộng mọi kỳ.
    if (m.listing !== null && (m.ky ?? "2026-09") > "2026-08") {
      await c.query(`INSERT INTO airdna_market_metrics (airdna_id, metric, period, value) VALUES ($1, 'listing_count', '2026-08', 1000)`, [m.id]);
    }
    if (m.score !== undefined) {
      await c.query(
        `INSERT INTO airdna_scores (airdna_id, total, seasonality, revenue_growth, regulation, rental_demand) VALUES ($1, $2, 1, 2, 3, 4)`,
        [m.id, m.score],
      );
    }
    for (let i = 0; i < (m.subs ?? 0); i++) {
      await c.query(`INSERT INTO airdna_submarket_metrics (airdna_sub_id, airdna_market_id, name) VALUES ($1, $2, 'p')`, [`${m.id}-s${i}`, m.id]);
    }
  }
}

/** Khu vực gộp: zz3 (listing 4) chèn TRƯỚC zz4 (listing 9) → đại diện zz4, tổng 13; 7 listing tự thu. */
async function seed(c: pg.Client) {
  await khuVuc(c, GOP, "Tỉnh Zz Gộp", 7, [
    { id: "zz-tl-3", listing: 4, adr: 500000, occ: 0.3, score: 40, subs: 1 },
    { id: "zz-tl-4", listing: 9, adr: 1000000, occ: 0.6, score: 70, subs: 2 },
  ]);
  await khuVuc(c, RONG, "Tỉnh Zz Rỗng", 3, [
    { id: "zz-tl-5", listing: null, adr: 800000 },
    { id: "zz-tl-6", listing: null },
  ]);
  await khuVuc(c, MOT, "Tỉnh Zz Một", 2, [{ id: "zz-tl-7", listing: 6, adr: 700000 }]);
  // Market không đại diện chỉ có số ở kỳ cũ hơn: mỗi market lấy kỳ mới nhất của chính nó → 2 + 9.
  await khuVuc(c, LECH_KY, "Tỉnh Zz Lệch Kỳ", 5, [
    { id: "zz-tl-8", listing: 2, ky: "2026-08" },
    { id: "zz-tl-9", listing: 9, adr: 900000 },
  ]);
  await khuVuc(c, MOT_NULL, "Tỉnh Zz Một Trống", 7, [
    { id: "zz-tl-10", listing: null },
    { id: "zz-tl-11", listing: 5, adr: 600000 },
  ]);
  await khuVuc(c, BA, "Tỉnh Zz Ba", 4, [
    { id: "zz-tl-12", listing: 1 },
    { id: "zz-tl-13", listing: 2 },
    { id: "zz-tl-14", listing: 3, adr: 400000 },
  ]);
}

const dong = (d: AirdnaComparison | null, metric: string) => d?.metrics.find((m) => m.metric === metric);
const stash: { gop?: AirdnaComparison; ba?: AirdnaComparison; mot?: AirdnaComparison } = {};

test("TL-AC-2/3/4/5 thẻ và bảng Độ phủ trên fixture", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c);
    const gop = await getAirdnaComparison(GOP, c);
    const cov = await getTruthfulCoverage(c);
    const covGop = cov.find((r) => r.areaId === GOP);

    // AC-2: ô S02 dòng Listing = 13 (cộng hai market), tỉ lệ = 7/13.
    assert.deepEqual(gop?.representative, { airdnaId: "zz-tl-4", ofMarkets: 2 }, "TL-AC-2 market đại diện");
    const listing = dong(gop, "Listing");
    assert.equal(listing?.ourValue, 7, "TL-AC-2 tự thu");
    assert.equal(listing?.airdnaValue, 13, "TL-AC-2 ô S02 phải là tổng hai market");
    assert.equal(listing?.ratio, 7 / 13, "TL-AC-2 tỉ lệ = tự thu ÷ tổng");
    assert.notEqual(listing?.ratio, 7 / 9, "TL-AC-2 chia cho market đại diện");

    // AC-3: thẻ = bảng Độ phủ.
    assert.ok(covGop, "TL-AC-3 bảng Độ phủ thiếu dòng khu vực gộp");
    assert.equal(listing?.ratio, covGop.ratio, "TL-AC-3 tỉ lệ thẻ ≠ Độ phủ");
    assert.equal(listing?.airdnaValue, covGop.airdnaActive, "TL-AC-3 ô S02 thẻ ≠ listing S02 của Độ phủ");
    const lechKy = dong(await getAirdnaComparison(LECH_KY, c), "Listing");
    const covLechKy = cov.find((r) => r.areaId === LECH_KY);
    assert.equal(lechKy?.airdnaValue, 11, "TL-AC-3 lệch kỳ: mỗi market lấy kỳ mới nhất của nó (2 + 9)");
    assert.equal(lechKy?.airdnaValue, covLechKy?.airdnaActive, "TL-AC-3 lệch kỳ: ô S02 thẻ ≠ Độ phủ");
    assert.equal(lechKy?.ratio, covLechKy?.ratio, "TL-AC-3 lệch kỳ: tỉ lệ thẻ ≠ Độ phủ");

    // AC-4: các số khác vẫn của market đại diện zz-tl-4.
    assert.equal(dong(gop, "ADR")?.airdnaValue, 1000000, "TL-AC-4 ADR của market đại diện");
    assert.equal(dong(gop, "Công suất")?.airdnaValue, 0.6, "TL-AC-4 công suất của market đại diện");
    assert.equal(gop?.marketScore?.total, 70, "TL-AC-4 điểm của market đại diện");
    assert.equal(gop?.submarketCount, 2, "TL-AC-4 tiểu thị trường của market đại diện");

    // AC-5: mọi market chưa có listing → trống, không chia cho 0; một market → số của chính nó.
    const rong = dong(await getAirdnaComparison(RONG, c), "Listing");
    assert.equal(rong?.airdnaValue, null, "TL-AC-5 khu vực không số listing: ô S02 phải trống");
    assert.equal(rong?.ratio, null, "TL-AC-5 khu vực không số listing: tỉ lệ phải trống");
    assert.equal(cov.find((r) => r.areaId === RONG), undefined, "TL-AC-5 Độ phủ không có dòng khu vực không số");
    const motNull = dong(await getAirdnaComparison(MOT_NULL, c), "Listing");
    assert.equal(motNull?.airdnaValue, 5, "TL-AC-5 hai market một trống: ô S02 = market có số");
    assert.equal(motNull?.ratio, cov.find((r) => r.areaId === MOT_NULL)?.ratio, "TL-AC-5 hai market một trống khớp Độ phủ");
    const motThe = await getAirdnaComparison(MOT, c);
    const mot = dong(motThe, "Listing");
    assert.equal(mot?.airdnaValue, 6, "TL-AC-5 một market");
    assert.equal(mot?.ratio, cov.find((r) => r.areaId === MOT)?.ratio, "TL-AC-5 một market khớp Độ phủ");

    stash.gop = gop!;
    stash.mot = motThe!;
    stash.ba = (await getAirdnaComparison(BA, c))!;
  });
});

// ---- Thẻ vẽ (jsdom) ----
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/quality" });
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.assign(dom.window.Element.prototype, { getAnimations: () => [] });
for (const k of ["ResizeObserver", "matchMedia"] as const) {
  if (!(k in globalThis)) {
    Object.assign(globalThis, {
      [k]:
        k === "matchMedia"
          ? () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
          : class { observe() {} unobserve() {} disconnect() {} },
    });
    Object.assign(dom.window, { [k]: (globalThis as Record<string, unknown>)[k] });
  }
}

async function draw(el: React.ReactElement) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await React.act(async () => root.render(el));
  return { host, done: async () => { await React.act(async () => root.unmount()); host.remove(); } };
}

const CAU = "Dòng Listing: S02 cộng cả 2 thị trường; ADR, công suất và điểm lấy thị trường đại diện.";

test("TL-AC-6 câu chú thích của thẻ khu vực gộp", async () => {
  const { CalibrationTable } = await import("../src/components/ops/quality-tables");
  assert.ok(stash.gop, "ca TL-AC-2/3/4/5 phải chạy trước");
  const gop = await draw(<CalibrationTable marketName="Zz Gộp" data={stash.gop} />);
  try {
    assert.ok(gop.host.textContent?.includes(CAU), `TL-AC-6 thẻ gộp thiếu câu «${CAU}»`);
  } finally {
    await gop.done();
  }
  const ba = await draw(<CalibrationTable marketName="Zz Ba" data={stash.ba!} />);
  try {
    assert.ok(ba.host.textContent?.includes(CAU.replace("cả 2", "cả 3")), "TL-AC-6 thẻ ba market thiếu «cộng cả 3 thị trường»");
  } finally {
    await ba.done();
  }
  // Đối chứng: kết quả thật của khu vực một market → không có câu.
  const mot = await draw(<CalibrationTable marketName="Zz Một" data={stash.mot!} />);
  try {
    assert.ok(!mot.host.textContent?.includes("Dòng Listing:"), "TL-AC-6 thẻ một market vẫn có câu cộng");
  } finally {
    await mot.done();
  }
});
