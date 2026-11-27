/**
 * PB2 (data-api-hop-dong-reso-dd-2-1) — /v1/listings theo RESO DD 2.1, căn giá tốt là bộ lọc, price-stats, đường 410.
 *
 * Chạy trên DB thử có lược đồ thật:
 *   bash db/db-thu.sh oneinvest_suite_dapi_reso --chay sh -c 'cd data-api && node --import tsx --test test/listings-reso.test.ts'
 * Dòng cấy ở một thị trường + phường riêng (khoá mang hạt PB2_HAT để chạy lặp trên cùng DB). Thông điệp ghim:
 * «PB2 <đường> sai tập khoá: <khoá>», «PB2 <đường> sai giá trị <khoá>», «PB2-AC-n …».
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const url = process.env.DATABASE_URL ?? "";
const tenDb = url.split("?")[0].split("/").pop() ?? "";
if (!tenDb.includes("_suite_")) {
  throw new Error(`PB2 từ chối chạy: DATABASE_URL phải trỏ DB thử oneinvest_suite_* (đang là «${tenDb || "trống"}»)`);
}
delete process.env.DATA_API_KEYS;
delete process.env.LISTING_KEY_SECRET;
process.env.NODE_ENV = "test";

const { pool } = await import("../src/db/client.js");
const { default: app } = await import("../src/app.js");
const { LISTING_KEY_NAMES, PRICE_RANK_KEYS } = await import("../src/contract/listing.js");
const { KHOA_THU } = await import("../src/lib/listing-key.js");

const DATA_API = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HAT = (process.env.PB2_HAT ?? String(process.pid)).replace(/[^0-9]/g, "").padStart(5, "0").slice(-5);
const TT = `vn-pb2${HAT}`;            // thị trường
const PH = `${TT}-phuong-1`;           // phường
const id = (s: string) => `pb2-${HAT}-${s}`;
const BAN = id("ban"), THUE = id("thue"), LA = id("nguon-la");
const NGAN = `abnb_9${HAT}77101`, NGAN_KHONG_ANH = `abnb_9${HAT}77102`;
const ANH = `https://anh.test/pb2-${HAT}-anh-1.jpg`;
const hmac = (s: string) => createHmac("sha256", KHOA_THU).update(s).digest("hex").slice(0, 16);
const KHOA_CU = ["offerId", "priceVnd", "areaM2", "pricePerm2", "bedrooms", "phuong", "marketId", "firstSeen", "lastSeen", "nReposts", "id", "name",
  "priceListed", "lat", "lng", "photoUrls", "area", "market", "stats", "photos", "originalEntryTimestamp", "roomType", "discountPct", "medianPerm2", "rank"];

const sql = (q: string, p: unknown[] = []) => pool.query(q, p) as Promise<{ rows: Record<string, any>[] }>;
async function goi(duong: string) {
  const res = await app.request(duong);
  const than = (await res.json()) as Record<string, any>;
  return { status: res.status, than, vanBan: JSON.stringify(than) };
}
const tapKhoa = (o: object) => Object.keys(o).sort();
function kiemKhoa(duong: string, d: object) {
  const thua = Object.keys(d).filter((k) => !LISTING_KEY_NAMES.includes(k));
  const thieu = LISTING_KEY_NAMES.filter((k) => !(k in d));
  assert.deepEqual([...thua, ...thieu], [], `PB2 ${duong} sai tập khoá: ${[...thua, ...thieu].join(",")}`);
  for (const k of KHOA_CU) assert.ok(!(k in d), `PB2 ${duong} sai tập khoá: ${k}`);
}
function bang(duong: string, d: Record<string, any>, mong: Record<string, unknown>) {
  for (const [k, v] of Object.entries(mong)) assert.deepEqual(d[k], v, `PB2 ${duong} sai giá trị ${k}`);
}
const theoKhoa = (data: any[], k: string) => data.find((d) => d.listingKey === k);

// Ma trận loại hình design §3 — viết trước, số ca = số ô.
const MA_TRAN: [string, string | null, string | null, string | null][] = [
  ["sale", "apartment", "Residential", "Condominium"], ["sale", "house", "Residential", null], ["sale", "land", "Land", "Unimproved Land"],
  ["sale", "commercial", "Commercial Sale", null], ["sale", "room", null, null], ["sale", "unknown", null, null], ["sale", null, null, null],
  ["rent_lt", "apartment", "Residential Lease", "Condominium"], ["rent_lt", "house", "Residential Lease", null], ["rent_lt", "land", null, null],
  ["rent_lt", "commercial", "Commercial Lease", null], ["rent_lt", "room", "Residential Lease", "Room"], ["rent_lt", "unknown", null, null], ["rent_lt", null, null, null],
];

async function cayTin(oid: string, kind: string, loai: string | null, o: { gia?: number; m2?: number; perm2?: number; source?: string; songNgay?: number } = {}) {
  await sql(
    `INSERT INTO sale_offer_records (offer_id, kind, area_id, price_vnd, area_m2, price_perm2, bedrooms, bathrooms, confidence,
       first_seen, last_seen, n_reposts, source, property_type, latitude, longitude, offer_status)
     VALUES ($1, $2, $3, $4, $5, $6, 2, 2, 'high', '2026-11-01T00:00:00Z', now() - ($9 || ' days')::interval, 3, $7, $8, 21.03, 105.85, 'active')`,
    [oid, kind, PH, o.gia ?? 5_000_000_000, o.m2 ?? 70, o.perm2 ?? 71_428_571, o.source ?? "S06", loai, String(o.songNgay ?? 1)],
  );
}

before(async () => {
  await sql(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, NULL, 'market', $3, 'vn'), ($2, $1, 'submarket', $4, 'vn')`,
    [TT, PH, `PB2 Thị trường ${HAT}`, `PB2 Phường ${HAT}`]);
  await cayTin(BAN, "sale", "apartment", { gia: 5_000_000_000, m2: 70, perm2: 71_428_571 });
  await cayTin(THUE, "rent_lt", "apartment", { gia: 15_000_000, m2: 60, perm2: 250_000 });
  await cayTin(LA, "sale", "house", { source: "nguon-la-pb2" });
  for (const [i, [k, l]] of MA_TRAN.entries()) await cayTin(id(`mt-${i}`), k, l);
  // Ngắn hạn: một có ảnh + đêm, một không ảnh.
  await sql(
    `INSERT INTO listings (id, area_id, name, room_type, property_type, bedrooms, bathrooms, accommodates, price_listed, minimum_nights,
       latitude, longitude, last_seen, photo_urls, review_count)
     VALUES ($1, $3, 'PB2 Căn ngắn hạn', 'Entire home/apt', 'Apartment', 1, 1.5, 3, 900000, 2, 21.03, 105.85, now(), jsonb_build_array($4::text), 12),
            ($2, $3, 'PB2 Căn không ảnh', 'Private room', 'Room', 1, 1, 2, 500000, 1, 21.03, 105.85, now(), NULL, 0)`,
    [NGAN, NGAN_KHONG_ANH, PH, ANH],
  );
  await sql(`INSERT INTO nights (listing_id, night, available, price) VALUES ($1, '2026-12-01', false, 1000000), ($1, '2026-12-02', false, 800000),
             ($1, '2026-12-03', true, 900000), ($1, '2026-12-04', true, 900000)`, [NGAN]);
});

after(async () => {
  await pool.end();
});

test("PB2-AC-1 listings sale, rent_lt theo RESO", async () => {
  for (const [kind, k, mong] of [
    ["sale", BAN, { listPrice: 5_000_000_000, leaseAmount: null, leaseAmountFrequency: null, salePricePerArea: 71_428_571, leasePricePerArea: null }],
    ["rent_lt", THUE, { listPrice: null, leaseAmount: 15_000_000, leaseAmountFrequency: "Monthly", salePricePerArea: null, leasePricePerArea: 250_000 }],
  ] as const) {
    const r = await goi(`/v1/listings?kind=${kind}&area=${PH}&limit=200`);
    assert.equal(r.status, 200);
    const d = theoKhoa(r.than.data, k);
    assert.ok(d, `PB2 listings ${kind} thiếu tin cấy`);
    kiemKhoa(`listings ${kind}`, d);
    bang(`listings ${kind}`, d, {
      ...mong, kind, livingArea: kind === "sale" ? 70 : 60, livingAreaUnits: "Square Meters", pricePerAreaUnit: "Square Meters",
      bedroomsTotal: 2, bathroomsTotalInteger: 2, city: `PB2 Phường ${HAT}`, mlsAreaMinor: PH, mlsAreaMajor: TT, latitude: 21.03, longitude: 105.85,
      onMarketTimestamp: "2026-11-01T00:00:00.000Z", originatingSystemName: "S06", propertyType: kind === "sale" ? "Residential" : "Residential Lease",
      propertySubType: "Condominium", media: null, repostCount: 3, confidence: "high",
    });
  }
  const la = theoKhoa((await goi(`/v1/listings?kind=sale&area=${PH}&limit=200`)).than.data, LA);
  assert.equal(la.originatingSystemName, null, "PB2 listings sai giá trị originatingSystemName (nguồn lạ phải null)");
});

test("PB2-AC-2 listings rent_st theo RESO", async () => {
  const r = await goi(`/v1/listings?kind=rent_st&area=${PH}`);
  assert.equal(r.status, 200);
  const d = theoKhoa(r.than.data, hmac(`S01|${NGAN}`));
  assert.ok(d, "PB2 rent_st listingKey không phải HMAC");
  kiemKhoa("listings rent_st", d);
  bang("listings rent_st", d, {
    kind: "rent_st", leaseAmount: 900000, leaseAmountFrequency: "Daily", propertyType: "Residential Lease", propertySubType: null,
    originatingSystemName: "S01", media: null, listingTitle: "PB2 Căn ngắn hạn", spaceType: "Entire home/apt", accommodates: 3,
    minimumNights: 2, reviewCount: 12, occupancyRate: 50, averageDailyRevenue: 900000, bathroomsTotalInteger: 2, listPrice: null,
  });
  const khongAnh = theoKhoa(r.than.data, hmac(`S01|${NGAN_KHONG_ANH}`));
  assert.ok(khongAnh && khongAnh.media === null, "PB2 rent_st lộ ảnh");
  assert.ok(!r.vanBan.includes(ANH), "PB2 rent_st lộ ảnh");
  // Không lộ id gốc hay phần số của nó, kể cả sau khi giải base64, hex.
  const so = NGAN.replace(/^abnb_/, "");
  const giai = (s: string) => [s, Buffer.from(s, "base64").toString("latin1"), /^[0-9a-f]+$/i.test(s) && s.length % 2 === 0 ? Buffer.from(s, "hex").toString("latin1") : ""];
  const moiChuoi: string[] = [];
  JSON.parse(r.vanBan, (_k, v) => { if (typeof v === "string") moiChuoi.push(v); return v; });
  for (const s of moiChuoi) for (const g of giai(s)) assert.ok(!g.includes(NGAN) && !g.includes(so), "PB2 rent_st lộ id gốc");
  // Đối chứng đột biến: khoá dựng bằng base64('S01|'+id) phải bị bộ dò bắt.
  const dotBien = Buffer.from(`S01|${NGAN}`).toString("base64");
  assert.ok(giai(dotBien).some((g) => g.includes(so)), "PB2 rent_st lộ id gốc — bộ dò không bắt được đột biến base64");
  // Môi trường đóng thiếu khoá bí mật → không khởi động.
  const kq = spawnSync("node", ["--import", "tsx", "src/index.ts"], {
    cwd: DATA_API, encoding: "utf8", timeout: 30_000,
    env: { ...process.env, NODE_ENV: "production", DATA_API_KEYS: "khoa-thu-pb2", LISTING_KEY_SECRET: "", PORT: "0" },
  });
  assert.notEqual(kq.status, 0, "PB2 thiếu khoá bí mật của listingKey mà vẫn khởi động");
  assert.ok(`${kq.stdout}${kq.stderr}`.includes("PB2 thiếu khoá bí mật của listingKey"), "PB2 thiếu khoá bí mật của listingKey — thông điệp lệch");
});

test("PB2-AC-3 listings kind, lọc, trang, chi tiết", async () => {
  const tat = await goi(`/v1/listings?area=${PH}&limit=200`);
  assert.equal(tat.status, 200);
  const kinds = new Set((tat.than.data as any[]).map((d) => d.kind));
  assert.deepEqual([...kinds].sort(), ["rent_lt", "rent_st", "sale"], "PB2-AC-3 không kind thiếu loại tin");
  const keys = (tat.than.data as any[]).map((d) => d.listingKey);
  assert.deepEqual(keys, [...keys].sort(), "PB2-AC-3 không sắp theo listingKey");
  const la = await goi(`/v1/listings?kind=xyz`);
  assert.equal(la.status, 400);
  assert.deepEqual(tapKhoa(la.than.error), ["code", "message"]);
  const pn = await goi(`/v1/listings?area=${PH}&bedroomsTotal=1&limit=200`);
  assert.ok((pn.than.data as any[]).length > 0 && (pn.than.data as any[]).every((d) => d.bedroomsTotal === 1), "PB2-AC-3 bedroomsTotal lọc sai");
  const tt = await goi(`/v1/listings?market=${TT}&limit=200`);
  assert.equal((tt.than.data as any[]).length, (tat.than.data as any[]).length, "PB2-AC-3 market lọc sai");
  const n = keys.length;
  const t1 = await goi(`/v1/listings?area=${PH}&limit=${Math.ceil(n / 2)}&offset=0`);
  const t2 = await goi(`/v1/listings?area=${PH}&limit=${Math.ceil(n / 2)}&offset=${Math.ceil(n / 2)}`);
  assert.deepEqual([...t1.than.data, ...t2.than.data].map((d: any) => d.listingKey), keys, "PB2-AC-3 hai trang trùng hay sót");
  for (const k of [BAN, THUE, hmac(`S01|${NGAN}`)]) {
    const r = await goi(`/v1/listings/${k}`);
    assert.equal(r.status, 200, `PB2-AC-3 chi tiết ${k} không 200`);
    kiemKhoa("listings chi tiết", r.than.data);
    assert.equal(r.than.data.listingKey, k);
  }
  const khong = await goi(`/v1/listings/khong-co-pb2`);
  assert.equal(khong.status, 404);
  assert.equal(khong.than.error.code, "NOT_FOUND");
});

test("PB2-AC-4 ma trận loại hình", async () => {
  const r = await goi(`/v1/listings?area=${PH}&limit=200`);
  const data = r.than.data as any[];
  assert.equal(MA_TRAN.length + 1, 15, "PB2-AC-4 ma trận phải có 15 ô");
  for (const [i, [kind, loai, pt, pst]] of MA_TRAN.entries()) {
    const d = theoKhoa(data, id(`mt-${i}`));
    assert.ok(d, `PB2-AC-4 thiếu ô ${kind} × ${loai}`);
    assert.deepEqual([d.propertyType, d.propertySubType], [pt, pst], `PB2 listings sai giá trị propertyType (${kind} × ${loai})`);
  }
  const st = theoKhoa(data, hmac(`S01|${NGAN}`));
  assert.deepEqual([st.propertyType, st.propertySubType], ["Residential Lease", null], "PB2 listings sai giá trị propertyType (rent_st)");
  const noiBo = ["apartment", "house", "land", "commercial", "room", "unknown"];
  for (const d of data) assert.ok(!noiBo.includes(d.propertyType) && !noiBo.includes(d.propertySubType), "PB2-AC-4 lộ mã loại hình nội bộ");
});

test("PB2-AC-5 căn giá tốt là bộ lọc của listings", async () => {
  // Nhánh bảng hạng: hạng cho tin bán cấy.
  await sql(
    `INSERT INTO offer_price_rank (offer_id, kind, property_type, thuoc, cap, nut, n, trung_vi, p20, hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do, run_id)
     VALUES ($1, 'sale', 'apartment', 'gia-m2', 'phuong', $2, 12, 90000000, 75000000, 8, 20.6, 'gia-tot', false, 'pb2', 'pb2-run')`,
    [BAN, PH],
  );
  const h = await goi(`/v1/listings?kind=sale&minBelowMedianPct=10&area=${PH}`);
  assert.equal(h.status, 200);
  const d = theoKhoa(h.than.data, BAN);
  assert.ok(d, "PB2 listings sai giá trị belowMedianPct — thiếu tin có hạng");
  kiemKhoa("listings giá tốt", d);
  bang("listings giá tốt", d, { belowMedianPct: 20.6, comparableMedianPricePerArea: 90000000 });
  assert.deepEqual(tapKhoa(d.priceRank), [...PRICE_RANK_KEYS].sort(), "PB2 listings sai tập khoá: priceRank");
  const cao = await goi(`/v1/listings?kind=sale&minBelowMedianPct=30&area=${PH}`);
  assert.ok(!theoKhoa(cao.than.data, BAN), "PB2-AC-5 minBelowMedianPct không loại tin dưới ngưỡng");
  const thue = await goi(`/v1/listings?kind=rent_lt&minBelowMedianPct=0&area=${PH}`);
  assert.ok((thue.than.data as any[]).every((x) => x.kind === "rent_lt"), "PB2-AC-5 kind=rent_lt lọc sai");
  // Nhánh CG8: bảng hạng rỗng → thước v_ruler_p2 (cần ≥ 5 căn cùng phường × loại).
  await sql(`DELETE FROM offer_price_rank`);
  for (let i = 0; i < 5; i++) {
    const oid = id(`cg8-${i}`);
    await cayTin(oid, "sale", "apartment", { perm2: i === 0 ? 40_000_000 : 50_000_000, gia: (i === 0 ? 40_000_000 : 50_000_000) * 70 });
    const { rows } = await sql(`INSERT INTO properties (kind, area_id, property_type) VALUES ('sale', $1, 'apartment') RETURNING id`, [PH]);
    await sql(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [rows[0].id, oid]);
  }
  const cg = await goi(`/v1/listings?kind=sale&minBelowMedianPct=10&area=${PH}`);
  const c8 = theoKhoa(cg.than.data, id("cg8-0"));
  assert.ok(c8, "PB2 listings sai giá trị belowMedianPct — nhánh CG8 thiếu tin");
  kiemKhoa("listings giá tốt CG8", c8);
  bang("listings giá tốt CG8", c8, { belowMedianPct: 20, comparableMedianPricePerArea: 50000000, priceRank: null });
  const g = await goi(`/v1/deals`);
  assert.equal(g.status, 410);
  assert.deepEqual(g.than, { error: { code: "GONE", message: "/v1/deals đã gộp vào /v1/listings: dùng ?minBelowMedianPct=" } }, "PB2 deals còn sống");
});

test("PB2-AC-11 price-stats", async () => {
  await sql(`INSERT INTO market_asset_stats (area_id, kind, n_offers, median_price, p25_price, p75_price, median_perm2, median_rent, updated_at)
             VALUES ($1, 'apartment', 12, 5000000000, 4000000000, 6000000000, 70000000, 15000000, now())`, [PH]).catch(() => undefined);
  const a = await goi(`/v1/price-stats?area=${PH}`);
  const m = await goi(`/v1/price-stats?market=${TT}`);
  assert.equal(a.status, 200, "PB2 price-stats ?area không 200");
  assert.equal(m.status, 200, "PB2 price-stats ?market không 200");
  const thieu = await goi(`/v1/price-stats`);
  assert.equal(thieu.status, 400);
  const cu = await goi(`/v1/asset-stats?area=${PH}`);
  assert.equal(cu.status, 410);
  assert.deepEqual(cu.than, { error: { code: "GONE", message: "/v1/asset-stats đã đổi tên thành /v1/price-stats" } }, "PB2 price-stats — asset-stats còn sống");
});

test("PB2-AC-10c openapi và version", async () => {
  const api = (await goi("/openapi.json")).than;
  assert.equal(api.info.version, "0.2.0");
  assert.equal((await goi("/health")).than.version, "0.2.0");
  assert.deepEqual(Object.keys(api.components.schemas.Listing.properties).sort(), [...LISTING_KEY_NAMES].sort(), "PB2 openapi Listing lệch tệp hợp đồng");
  for (const p of ["/v1/deals", "/v1/asset-stats"]) assert.ok(!(p in api.paths), `PB2 openapi còn ${p} như đường sống`);
});
