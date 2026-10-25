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
    metrics: [m("ADR", o.adr, "VND"), m("Công suất", o.occ, "%"), m("Listing", o.listing, "")],
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
    assert.equal(card?.metrics.find((m) => m.metric === "Listing")?.ourValue, 7, "dòng Listing của thẻ");
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

// ---- Thẻ/bảng vẽ (jsdom) ----
import { readFileSync } from "node:fs";
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

/** Vẽ một phần tử, trả gốc DOM; gọi `done()` để gỡ. */
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

/** Các ô của cột có tiêu đề đúng `title` (bảng data-grid). */
function column(host: HTMLElement, title: string): string[] {
  const heads = [...host.querySelectorAll("thead th")];
  const i = heads.findIndex((th) => th.textContent?.trim() === title);
  assert.ok(i >= 0, `không thấy cột «${title}»`);
  return [...host.querySelectorAll("tbody tr")].map((tr) => tr.querySelectorAll("td")[i]?.textContent?.trim() ?? "");
}

const leaf = (host: HTMLElement, text: string) =>
  [...host.querySelectorAll("*")].filter((el) => el.children.length === 0 && el.textContent?.trim() === text);

test("HC-AC-1/2/3/4 vẽ thẻ và hai bảng từ kết quả fixture", async () => {
  const { AirdnaMarketsTable, CalibrationTable, TruthfulCoverageTable } = await import("../src/components/ops/quality-tables");
  assert.ok(stash.card && stash.cov && stash.nat, "ca HC-AC-2 phải chạy trước");
  const card = await draw(<CalibrationTable marketName="Zz Thử" data={stash.card} />);
  const cov = await draw(<TruthfulCoverageTable rows={[stash.cov]} />);
  const nat = await draw(<AirdnaMarketsTable rows={stash.nat} />);
  try {
    // AC-1: thẻ ghi số market S02 nó đại diện.
    assert.ok(card.host.textContent?.includes("đại diện cho 2 thị trường S02"), "HC-AC-1 thẻ thiếu «đại diện cho 2 thị trường S02»");
    // AC-2: số ĐÃ VẼ ở ba chỗ bằng nhau và bằng số listing trong cây (7).
    const tren = (rows: string[]) => rows.map((t) => t.replace(/\D/g, ""));
    const theCard = card.host.querySelectorAll("tbody tr");
    const dongListing = [...theCard].find((tr) => tr.querySelector("td")?.textContent?.trim() === "Listing");
    assert.ok(dongListing, "HC-AC-2 thẻ thiếu dòng «Listing»");
    assert.equal(dongListing.querySelectorAll("td")[1]?.textContent?.trim(), "7", "HC-AC-2 thẻ");
    assert.deepEqual(tren(column(cov.host, "Listing tự thu")), ["7"], "HC-AC-2 Độ phủ");
    assert.deepEqual(tren(column(nat.host, "Listing tự thu")), ["7", "7"], "HC-AC-2 toàn quốc");
    // AC-3: mỗi bảng có câu định nghĩa.
    for (const [ten, h] of [["thẻ", card], ["Độ phủ", cov], ["toàn quốc", nat]] as const) {
      assert.ok(h.host.textContent?.includes(TU_THU_DINH_NGHIA), `HC-AC-3 ${ten} thiếu câu định nghĩa`);
    }
    // AC-4: cây 7 listing nhưng ADR/công suất từ 1 listing → mẫu mỏng.
    assert.equal(leaf(card.host, "mẫu mỏng").length, 1, "HC-AC-4 thẻ cây 7 / mẫu 1 thiếu nhãn mẫu mỏng");
  } finally {
    await card.done();
    await cov.done();
    await nat.done();
  }
  // AC-4 chiều không: cỡ mẫu 5 → không nhãn.
  const du = await draw(<CalibrationTable marketName="Đủ" data={{ ...stash.card, sampleListings: 5 }} />);
  try {
    assert.equal(leaf(du.host, "mẫu mỏng").length, 0, "HC-AC-4 cỡ mẫu 5 vẫn có nhãn");
  } finally {
    await du.done();
  }
});

test("HC-AC-5 một dòng «Chưa có số»", async () => {
  const { CalibrationEmptyLine } = await import("../src/components/ops/quality-tables");
  const cal = splitCalibrated(NAM_THI_TRUONG());
  const h = await draw(<CalibrationEmptyLine names={cal.empty} />);
  try {
    const dong = [...h.host.querySelectorAll("*")].filter((el) => el.textContent?.trim().startsWith("Chưa có số:") && el.children.length === 0);
    assert.equal(dong.length, 1, "HC-AC-5 phải đúng một dòng");
    assert.equal(dong[0].textContent?.trim(), "Chưa có số: Trống Hết, Toàn Không");
  } finally {
    await h.done();
  }
  const rong = await draw(<CalibrationEmptyLine names={[]} />);
  try {
    assert.equal(rong.host.textContent, "", "HC-AC-5 không thị trường trống thì không dòng");
  } finally {
    await rong.done();
  }
});

test("HC-AC-6 trang đếm và vẽ từ cùng một kết quả chia", () => {
  const src = readFileSync(new URL("../src/app/ops/quality/page.tsx", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  assert.equal(src.match(/splitCalibrated\(/g)?.length, 1, "HC-AC-6 gọi splitCalibrated đúng một lần");
  const bien = src.match(/const (\w+) = splitCalibrated\(/)?.[1];
  assert.ok(bien, "HC-AC-6 kết quả chia phải gán vào một biến");
  assert.ok(src.includes(`${bien}.label`), "HC-AC-6 nhãn đầu trang lấy từ kết quả chia");
  assert.ok(src.includes(`${bien}.calibrated.map(`), "HC-AC-6 danh sách thẻ lấy từ kết quả chia");
  assert.ok(src.includes(`${bien}.empty`), "HC-AC-6 dòng «Chưa có số» lấy từ kết quả chia");
  assert.doesNotMatch(src, /data !== null/, "HC-AC-6 còn bộ lọc cũ");
});
