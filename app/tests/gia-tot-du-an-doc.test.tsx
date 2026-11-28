// gia-tot-du-an-doc.test.tsx — hồ sơ gia-tot-cap-du-an (CG10), ca xuyên lớp AC-6 (trang một căn), AC-7 (danh sách /ops/deals),
// AC-8 (hai API). DB thử trắng dựng từ db/migrations của nhánh (pipeline/scripts/gia-tot-du-an-fixture.itest.mjs, view 105 tạm),
// chấm bằng chính bước chấm (xepHangGia); số kỳ vọng đọc thẳng từ offer_price_rank / project_area_band bằng SQL viết riêng.
// Hàm đọc của app đi qua `pool` → trong ca, pool.query trỏ vào client của DB thử. Chữ ghim nguyên văn theo kế hoạch CG10.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type pg from "pg";

import { cauChungMinh, chuDaiM2, lyDoRoi } from "../src/lib/deals-chi-tiet";

const ngoai = (rel: string) => import(pathToFileURL(join(import.meta.dirname, rel)).href);
process.env.DATABASE_URL ??= process.env.CI ? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" : "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg10_doc_khong_dung";

const nap = async () => ({
  fx: await ngoai("../../pipeline/scripts/gia-tot-du-an-fixture.itest.mjs"),
  xep: (await ngoai("../../pipeline/xep-hang-gia.mjs")).xepHangGia as (c: pg.Client, o?: object) => Promise<unknown>,
  deals: await import("../src/lib/deals"),
  pool: (await import("../src/lib/db")).pool,
  GET: (await import("../src/app/api/v1/deals/route")).GET,
  poolApi: (await ngoai("../../data-api/src/db/client.ts")).pool as pg.Pool,
  listingsRoute: (await ngoai("../../data-api/src/routes/listings.ts")).listingsRoute,
  LISTING_KEY_NAMES: (await ngoai("../../data-api/src/contract/listing.ts")).LISTING_KEY_NAMES as string[],
});
let m: Awaited<ReturnType<typeof nap>>;
const M = 1_000_000;
const im = { log: () => {} };

/** Trong fn, pool của app và của data-api chạy câu trên client cho trước. */
async function quaClient<T>(c: pg.Client, fn: () => Promise<T>): Promise<T> {
  const { pool, poolApi } = m;
  const goc = [pool.query, poolApi.query];
  const q = ((...a: unknown[]) => (c.query as (...x: unknown[]) => unknown)(...a)) as typeof m.pool.query;
  pool.query = q;
  poolApi.query = q as typeof poolApi.query;
  try {
    return await fn();
  } finally {
    [pool.query, poolApi.query] = goc as [typeof pool.query, typeof poolApi.query];
  }
}
const so = (x: unknown) => (x === null || x === undefined ? null : Number(x));
async function dong(c: pg.Client, id: string) {
  return (await c.query(`SELECT * FROM offer_price_rank WHERE offer_id = $1`, [id])).rows[0];
}

let c6: pg.Client;
let d6: number;
before(async () => {
  m = await nap();
  await m.fx.dungMau();
  // ---- fixture AC-6 ----
  c6 = await m.fx.dbCa();
  d6 = await m.fx.duAn(c6, { ten: "Khu thử Sáu" });
  const A = m.fx.A;
  for (let i = 0; i < 10; i++) await m.fx.tin(c6, { id: `d6-ban-${i}`, duAn: d6, phuong: A(i % 2 ? "a1" : "a2"), m2: 50 + i, pn: 2, perm2: (40 + 2 * i) * M });
  for (let i = 0; i < 10; i++) await m.fx.tin(c6, { id: `d6-thue-${i}`, duAn: d6, kind: "rent_lt", phuong: A("a1"), pn: 2, gia: (10 + i) * M });
  for (let i = 0; i < 12; i++) await m.fx.tin(c6, { id: `d6-phuong-${i}`, phuong: A("a3"), m2: 60, perm2: (40 + i) * M });
  const d59 = await m.fx.duAn(c6, { ten: "Khu thử Năm Chín" });
  for (let i = 0; i < 6; i++) await m.fx.tin(c6, { id: `d6-59-${i}`, duAn: d59, phuong: A("a5"), m2: 60, perm2: (40 + i) * M });
  await m.fx.tin(c6, { id: "d6-thieu-m2", duAn: d6, phuong: A("a1"), pn: 2, gia: 3_000_000_000 });
  await m.xep(c6, im);
});
after(async () => {
  await m.fx.donHet();
});

// ---------- AC-6: trang một căn ----------
test("CG10-AC-6 trang một căn: câu cấp dự án + Giá tốt, thuê giá tháng, phường giữ chữ CG9, nhom-5-9, dải m² suy ra; đột biến N đỏ", async () => {
  const mot = async (id: string) => (await quaClient(c6, () => m.deals.getDeal(id))).deal!;
  // tin bán cấp dự án có nhãn
  const k0 = await dong(c6, "d6-ban-0");
  assert.equal(k0.cap, "du_an");
  assert.equal(k0.nhan, "gia-tot", "đối chứng dương: tin rẻ nhất dự án phải mang gia-tot");
  const b0 = await mot("d6-ban-0");
  const cau0 = cauChungMinh(b0)!;
  assert.ok(cau0.startsWith(`So với ${k0.n} căn cùng dự án Khu thử Sáu, cùng loại (căn hộ), cùng 2PN`), cau0);
  assert.ok(cau0.includes("— Giá tốt"), cau0);
  const sai = cauChungMinh({ ...b0, rank: { ...b0.rank!, n: 11 } })!;
  assert.ok(!sai.includes(`So với ${k0.n} căn`), "CG10-AC-6 đột biến N = số tin phải lệch số căn của bảng");
  // tin thuê thiếu m² theo giá tháng
  const kt = await dong(c6, "d6-thue-0");
  assert.equal(kt.thuoc, "gia-thang-pn");
  const cauT = cauChungMinh(await mot("d6-thue-0"))!;
  assert.ok(cauT.includes(`So với ${kt.n} căn cùng dự án Khu thử Sáu, cùng loại (căn hộ), cùng 2PN, theo giá thuê tháng`), cauT);
  // tin cấp phường giữ chữ CG9, không có «cùng dự án»
  const kp = await dong(c6, "d6-phuong-0");
  assert.equal(kp.cap, "phuong");
  const cauP = cauChungMinh(await mot("d6-phuong-0"))!;
  assert.ok(cauP.startsWith(`So với ${kp.n} căn cùng phường, cùng loại (căn hộ)`) && cauP.includes("Rẻ trong phường"), cauP);
  assert.ok(!cauP.includes("cùng dự án"), `tin cấp phường không được nói «cùng dự án»: ${cauP}`);
  // nhóm 5–9 cấp dự án
  const k59 = await dong(c6, "d6-59-0");
  assert.equal(k59.cap, "du_an");
  assert.equal((await mot("d6-59-0")).roiDanhSach, "Nhóm so sánh chỉ có 5–9 căn — có số, chưa gắn nhãn");
  // dải m² suy ra cho căn hộ thiếu diện tích — tin bán thiếu m² không chấm nên không cấp dự án; dùng tin thuê thiếu m²
  const band = (await c6.query(`SELECT p10, p90 FROM project_area_band WHERE project_node_id = $1 AND bedrooms = 2`, [d6])).rows[0];
  assert.ok(band, "đối chứng: dự án × 2PN phải có dải (10 mẫu m²)");
  const dt = await mot("d6-thue-0");
  assert.deepEqual(dt.daiM2, { p10: Number(band.p10), p90: Number(band.p90) });
  assert.equal(chuDaiM2(dt.daiM2!), `≈ ${Math.round(Number(band.p10))}–${Math.round(Number(band.p90))} m² · suy ra`);
  const db0 = await mot("d6-ban-0");
  assert.equal(db0.daiM2, null, "tin có m² không mang dải suy ra");
  // lược đồ không có project_area_band: không lỗi, không dải
  await c6.query(`BEGIN`);
  try {
    await c6.query(`DROP TABLE project_area_band`);
    const khong = await mot("d6-thue-0");
    assert.equal(khong.daiM2, null, "không có bảng 106 thì không dải, không lỗi");
  } finally {
    await c6.query(`ROLLBACK`);
  }
  // lyDoRoi không đổi chữ khi tin cấp dự án có nhãn
  assert.equal(lyDoRoi(b0, false), null);
});

// ---------- AC-7: danh sách /ops/deals ----------
test("CG10-AC-7 danh sách: lọc dự án không cắt 30, mỗi căn một dòng «N tin», tab Cần xác minh toàn tập và theo dự án, chỉ tin bán, id thật rỗng ≠ id lạ", async () => {
  const c = await m.fx.dbCa();
  const A = m.fx.A;
  const d1 = await m.fx.duAn(c, { ten: "Khu thử Bảy" });
  const d2 = await m.fx.duAn(c, { ten: "Khu thử Tám" });
  const dRong = await m.fx.duAn(c, { ten: "Khu thử Rỗng" });
  // d1: 180 phiếu căn hộ bán 40–57,9 tr/m² (36 dưới p20) + 3 tin rẻ quá 35% (cần xác minh) + một căn ba tin
  for (let i = 0; i < 177; i++) await m.fx.tin(c, { id: `d7-${i}`, duAn: d1, phuong: A(i % 3 ? "a1" : "a2"), m2: 60, perm2: Math.round((40 + 0.1 * i) * M) });
  for (let i = 0; i < 3; i++) await m.fx.tin(c, { id: `d7-xm-${i}`, duAn: d1, phuong: A("a1"), m2: 60, perm2: Math.round((29 + 0.5 * i) * M) });
  for (let i = 0; i < 3; i++) await m.fx.tin(c, { id: `d7-can-${i}`, duAn: d1, phuong: A("a1"), m2: 60, perm2: Math.round((40.05 + 0.01 * i) * M) });
  await m.fx.can(c, ["d7-can-0", "d7-can-1", "d7-can-2"]);
  // d1: tin thuê có nhãn — không vào danh sách
  for (let i = 0; i < 10; i++) await m.fx.tin(c, { id: `d7-thue-${i}`, duAn: d1, kind: "rent_lt", phuong: A("a1"), m2: 60, perm2: (200 + 10 * i) * 1000 });
  // d2: 10 phiếu, một tin cần xác minh (đối chứng đếm tab theo dự án)
  for (let i = 0; i < 9; i++) await m.fx.tin(c, { id: `d8-${i}`, duAn: d2, phuong: A("a3"), m2: 60, perm2: (50 + i) * M });
  await m.fx.tin(c, { id: "d8-xm", duAn: d2, phuong: A("a3"), m2: 60, perm2: 33 * M });
  // dRong: 4 tin — có thật mà không nhóm nào đủ
  for (let i = 0; i < 4; i++) await m.fx.tin(c, { id: `d9-${i}`, duAn: dRong, phuong: A("a4"), m2: 60, perm2: (50 + i) * M });
  await m.xep(c, im);

  // kỳ vọng đọc thẳng từ bảng
  const ky = async (nut: string | null) => (await c.query(
    `SELECT h.offer_id, h.can_xac_minh, coalesce((SELECT min(property_id)::text FROM property_offers po WHERE po.offer_id = h.offer_id), h.offer_id) AS can
       FROM offer_price_rank h WHERE h.kind = 'sale' AND h.nhan IS NOT NULL AND h.duoi_trung_vi_pct BETWEEN 5 AND 50
        AND ($1::text IS NULL OR (h.cap = 'du_an' AND h.nut = $1))`, [nut])).rows as { offer_id: string; can_xac_minh: boolean; can: string }[];
  const k1 = await ky(String(d1));
  const can1 = new Set(k1.map((r) => r.can));
  assert.ok(can1.size > 30, `đối chứng: dự án 1 phải có hơn 30 căn nhãn (có ${can1.size})`);

  const ds1 = await quaClient(c, () => m.deals.getDeals(undefined, 5, { project: String(d1) }));
  assert.equal(ds1.rows.length, can1.size, "CG10-AC-7 lọc dự án: mỗi căn một dòng, không cắt 30");
  assert.ok(ds1.rows.every((r) => r.rank?.level === "du_an" && r.rank.node === String(d1)), "CG10-AC-7 lọc dự án lọt tin ngoài dự án");
  const ba = ds1.rows.filter((r) => r.offerId.startsWith("d7-can-"));
  assert.deepEqual(ba.map((r) => [r.offerId, r.soTin]), [["d7-can-2", 3]], "CG10-AC-7 căn ba tin: một dòng, đại diện là tin thấy sau cùng, soTin = 3");
  assert.ok(ds1.rows.every((r) => !r.offerId.startsWith("d7-thue-")), "CG10-AC-7 tin thuê lọt danh sách");

  // tab Cần xác minh trên toàn tập
  const xmAll = await quaClient(c, () => m.deals.getXacMinh());
  const kyXm = (await ky(null)).filter((r) => r.can_xac_minh);
  assert.equal(xmAll!.tong, new Set(kyXm.map((r) => r.can)).size, "CG10-AC-7 tab toàn tập: đếm sai");
  assert.equal(xmAll!.tong, 4);
  assert.equal(xmAll!.rows.length, 4, "CG10-AC-7 tab toàn tập: liệt kê thiếu");
  const ds30 = await quaClient(c, () => m.deals.getDeals());
  assert.equal(ds30.rows.length, 30, "đối chứng: danh sách không lọc cắt 30");
  // đột biến «đếm tab trong 30 dòng đã cắt» → lệch tổng
  const demTrong30 = ds30.rows.filter((r) => r.suspect).length;
  assert.notEqual(demTrong30, xmAll!.tong, "CG10-AC-7 đột biến đếm tab trên 30 dòng đã cắt phải lệch toàn tập");
  // theo dự án
  assert.equal((await quaClient(c, () => m.deals.getXacMinh({ project: String(d1) })))!.tong, 3, "CG10-AC-7 tab theo dự án 1");
  assert.equal((await quaClient(c, () => m.deals.getXacMinh({ project: String(d2) })))!.tong, 1, "CG10-AC-7 tab theo dự án 2");

  // id có thật mà rỗng ≠ id lạ
  const rong = await quaClient(c, () => m.deals.getDeals(undefined, 5, { project: String(dRong) }));
  assert.equal(rong.rows.length, 0);
  assert.deepEqual(await quaClient(c, () => m.deals.getDuAn(String(dRong))), { id: String(dRong), ten: "Khu thử Rỗng" });
  assert.equal(await quaClient(c, () => m.deals.getDuAn("999999999")), null, "id lạ phải không có dự án");
  // tham số sai khuôn
  for (const v of ["abc", "1;drop", "1".repeat(19), "", undefined, "-1"]) assert.equal(m.deals.parseProject(v), null, `parseProject(${v})`);
  assert.equal(m.deals.parseProject(String(d1)), String(d1));
  assert.equal(m.deals.parseProject(["7", "8"]), "7");
  // CG9 danh sách không lọc vẫn một nguồn với câu SQL: so_tin có mặt, tin trong danh sách theo bảng
  assert.ok(ds30.rows.every((r) => (r.soTin ?? 0) >= 1));
  assert.ok(so(ds30.rows[0].discountPct) !== null);
});

// ---------- AC-8: hai API ----------
type DongApi = { offerId: string; discountPct: number; rank?: { level: string | null; node: string | null; label: string | null; n: number | null } } & Record<string, unknown>;
// Bảng khoá cũ viết trước: tên + kiểu (typeof, "null" khi được rỗng) — đổi kiểu một khoá cũ là phá hợp đồng API như mất khoá.
const SO = ["number", "null"], CHU = ["string", "null"];
const KHOA_CU_DATA_API: [string, string[]][] = [["offerId", ["string"]], ["priceVnd", SO], ["areaM2", SO], ["pricePerm2", SO],
  ["bedrooms", SO], ["phuong", CHU], ["marketId", CHU], ["propertyType", CHU], ["medianPerm2", SO], ["discountPct", SO],
  ["confidence", CHU], ["firstSeen", CHU], ["lastSeen", CHU], ["nReposts", SO]];
const KHOA_CU_APP: [string, string[]][] = [["offerId", ["string"]], ["source", CHU], ["priceVnd", SO], ["areaM2", SO], ["pricePerm2", SO],
  ["bedrooms", SO], ["phuong", CHU], ["medianPerm2", SO], ["rulerN", SO], ["discountPct", SO], ["confidence", CHU], ["lastSeen", CHU]];
const kieu = (v: unknown) => (v === null ? "null" : typeof v);

// PB2 (data-api-hop-dong-reso-dd-2-1, GS xác nhận 27/11): /v1/deals của data-api đã gộp vào /v1/listings?minBelowMedianPct=.
// Chỉ phần gọi data-api đổi: lời gọi cũ dịch sang tham số mới (min_discount → minBelowMedianPct; kind vắng → sale như /v1/deals
// cũ), phần tử mới dịch về tên khoá cũ theo bảng khoá cũ → mới của hồ sơ PB2 (khoa-cu-moi.md) — mỗi ca giữ nguyên điều nó
// khẳng định (cùng tập tin, cùng thứ tự, cùng ngưỡng). Phần tử gốc còn được so với tập khoá của tệp hợp đồng Listing.
const thamSoMoi = (q: string) => {
  const ra = new URLSearchParams();
  // Nghĩa cũ của /v1/deals: `Number(min_discount) || 5` (0 đọc thành 5), limit mặc định 30, trần 100 — dịch đúng nghĩa đó.
  for (const [k, v] of new URLSearchParams(q)) {
    if (k === "min_discount") ra.set("minBelowMedianPct", String(Math.max(0, Math.min(50, Number(v) || 5))));
    else if (k === "limit") ra.set("limit", String(Math.min(100, Number(v) || 30)));
    else ra.set(k, v);
  }
  if (!ra.has("kind")) ra.set("kind", "sale");
  if (!ra.has("minBelowMedianPct")) ra.set("minBelowMedianPct", "5");
  if (!ra.has("limit")) ra.set("limit", "30");
  return ra.toString();
};
const loaiNoiBo = (pt: unknown, pst: unknown) =>
  pst === "Condominium" ? "apartment" : pst === "Unimproved Land" ? "land" : pst === "Room" ? "room"
    : typeof pt === "string" && pt.startsWith("Commercial") ? "commercial"
      : pt === "Residential" || pt === "Residential Lease" ? "house" : null;
/** Phần tử Listing → tên khoá cũ của /v1/deals. `khoaMoi` giữ tập khoá gốc để so với tệp hợp đồng. */
const veHinhCu = (d: Record<string, unknown>) => ({
  offerId: d.listingKey, priceVnd: d.listPrice ?? d.leaseAmount, areaM2: d.livingArea, pricePerm2: d.salePricePerArea ?? d.leasePricePerArea,
  bedrooms: d.bedroomsTotal, phuong: d.city, marketId: d.mlsAreaMajor, propertyType: loaiNoiBo(d.propertyType, d.propertySubType),
  medianPerm2: d.comparableMedianPricePerArea, discountPct: d.belowMedianPct, confidence: d.confidence, firstSeen: d.onMarketTimestamp,
  lastSeen: d.lastSeenTimestamp, nReposts: d.repostCount, ...(d.priceRank ? { rank: d.priceRank } : {}), khoaMoi: Object.keys(d).sort(),
});
const goiListings = async (route: { request: (u: string) => Response | Promise<Response> }, q: string) => {
  const res = await route.request(`/?${thamSoMoi(q)}`);
  const j = (await res.json()) as { data?: Record<string, unknown>[] } & Record<string, unknown>;
  return { status: res.status, body: { ...j, data: (j.data ?? []).map(veHinhCu) } };
};
function kiemKhoaCu(ten: string, x: Record<string, unknown>, khoa: [string, string[]][]) {
  for (const [k, cho] of khoa) {
    assert.ok(k in x, `${ten} ${String(x.offerId)} thiếu khoá cũ ${k}`);
    assert.ok(cho.includes(kieu(x[k])), `${ten} ${String(x.offerId)} khoá cũ ${k} đổi kiểu: ${kieu(x[k])} (cũ: ${cho.join("|")})`);
  }
}
test("CG10-AC-8 đối chứng bảng khoá cũ: mất khoá hay đổi kiểu đều đỏ", () => {
  const dong = { offerId: "x", source: "S03", priceVnd: 1, areaM2: 1, pricePerm2: 1, bedrooms: null, phuong: "p", medianPerm2: 1, rulerN: 5,
    discountPct: 10, confidence: "high", lastSeen: "2026-11-01" };
  kiemKhoaCu("đối chứng", dong, KHOA_CU_APP);
  assert.throws(() => kiemKhoaCu("đối chứng", { ...dong, priceVnd: "1" }, KHOA_CU_APP), /đổi kiểu/);
  const { rulerN: _bo, ...thieu } = dong;
  assert.throws(() => kiemKhoaCu("đối chứng", thieu, KHOA_CU_APP), /thiếu khoá cũ rulerN/);
});
test("CG10-AC-8 /v1/deals và /api/v1/deals: project lọc tin cấp dự án, rank.node, project sai → 400, khoá cũ đủ, lược đồ kiểu cloud 200", async () => {
  const kyTap = async (cl: pg.Client, nut: string) => new Set((await cl.query(
    `SELECT offer_id FROM offer_price_rank WHERE kind = 'sale' AND nhan IS NOT NULL AND duoi_trung_vi_pct BETWEEN 0 AND 50
        AND cap = 'du_an' AND nut = $1`, [nut])).rows.map((r) => r.offer_id as string));
  const ky = await kyTap(c6, String(d6));
  assert.ok(ky.size > 0, "đối chứng: dự án Sáu phải có tin bán nhãn cấp dự án");
  const dataApi = async (cl: pg.Client, q: string) => quaClient(cl, async () => {
    const r = await goiListings(m.listingsRoute, q);
    for (const x of r.body.data) assert.deepEqual(x.khoaMoi, [...m.LISTING_KEY_NAMES].sort(), `data-api ${String(x.offerId)}: tập khoá lệch tệp hợp đồng Listing`);
    return { status: r.status, body: r.body as unknown as { data: DongApi[] } };
  });
  const cu = process.env.OPS_API_TOKEN;
  process.env.OPS_API_TOKEN = "cg10-thu-token";
  const app = async (cl: pg.Client, q: string) => quaClient(cl, async () => {
    const res = await m.GET(new Request(`http://x/api/v1/deals?${q}`, { headers: { authorization: "Bearer cg10-thu-token" } }));
    return { status: res.status, body: (await res.json()) as { data: DongApi[] } };
  });
  try {
    for (const [ten, goi, khoa] of [["data-api", dataApi, KHOA_CU_DATA_API], ["app", app, KHOA_CU_APP]] as const) {
      const r = await goi(c6, `project=${d6}&limit=100&min_discount=0`);
      assert.equal(r.status, 200, `${ten} project hợp lệ`);
      assert.deepEqual(new Set(r.body.data.map((x) => x.offerId)), ky, `${ten}: project trả đúng tập tin cấp dự án của nút`);
      for (const x of r.body.data) {
        assert.equal(x.rank?.level, "du_an", `${ten} ${x.offerId} level`);
        assert.equal(x.rank?.node, String(d6), `${ten} ${x.offerId} node`);
        kiemKhoaCu(ten, x, khoa);
      }
      assert.ok(r.body.data.some((x) => x.rank?.label === "gia-tot"), `${ten}: có dòng gia-tot`);
      const tatCa = await goi(c6, "limit=100&min_discount=0");
      assert.ok(tatCa.body.data.some((x) => x.rank?.level === "phuong"), `${ten}: đối chứng — không lọc thì có cả dòng cấp phường`);
      assert.ok(tatCa.body.data.some((x) => x.rank?.node === "cg10-a3"), `${ten}: dòng cấp phường mang node = area_id`);
      for (const sai of ["abc", "1;drop", "1".repeat(19)]) assert.equal((await goi(c6, `project=${encodeURIComponent(sai)}`)).status, 400, `${ten} project=${sai}`);
      // lược đồ kiểu cloud: không view 105, không 106 — bảng hạng chỉ cấp phường
      const cloud = await m.fx.dbCa({ view: false, bo106: true });
      await m.fx.tin(cloud, { id: "cl-0", phuong: m.fx.A("a1"), m2: 60, perm2: 40 * M });
      await m.xep(cloud, im);
      const rc = await goi(cloud, `project=${d6}&limit=100&min_discount=0`);
      assert.equal(rc.status, 200, `${ten}: lược đồ kiểu cloud vẫn 200`);
      assert.deepEqual(rc.body.data, [], `${ten}: lược đồ kiểu cloud không có tin cấp dự án`);
    }
  } finally {
    if (cu === undefined) delete process.env.OPS_API_TOKEN;
    else process.env.OPS_API_TOKEN = cu;
  }
});
