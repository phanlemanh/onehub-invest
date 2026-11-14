// hang-gia-doc.test.tsx — hồ sơ bang-hang-gia-m2 (CG9), ca xuyên lớp AC-6 (/ops/deals) và AC-7 (/api/v1/deals của app, /v1/deals
// của data-api). DB thử trống dựng từ db/migrations của nhánh (pipeline/scripts/hang-gia-fixture.mjs), chấm bằng chính bước chấm
// (xepHangGia); số kỳ vọng đọc thẳng từ offer_price_rank bằng SQL viết riêng, không dùng mã đọc của hàng. Hai route đọc qua `pool`
// → trong ca, pool.query trỏ vào client của DB thử. Hàm thuần (lyDoRoi, cauChungMinh) có ma trận chữ viết trước.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type pg from "pg";

import {
  CHU_CAN_XAC_MINH,
  CHU_LY_DO_LA,
  type DealChiTiet,
  type HangGia,
  cauChungMinh,
  lyDoRoi,
} from "../src/lib/deals-chi-tiet";

const ngoai = (rel: string) => import(pathToFileURL(join(import.meta.dirname, rel)).href);
process.env.DATABASE_URL ??= process.env.CI ? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" : "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg9_doc_khong_dung";

const nap = async () => ({
  fx: await ngoai("../../pipeline/scripts/hang-gia-fixture.mjs"),
  xep: (await ngoai("../../pipeline/xep-hang-gia.mjs")).xepHangGia as (c: pg.Client, o?: object) => Promise<unknown>,
  deals: await import("../src/lib/deals"),
  pool: (await import("../src/lib/db")).pool,
  GET: (await import("../src/app/api/v1/deals/route")).GET,
  poolApi: (await ngoai("../../data-api/src/db/client.ts")).pool as pg.Pool,
  dealsRoute: (await ngoai("../../data-api/src/routes/deals.ts")).dealsRoute,
});
let m: Awaited<ReturnType<typeof nap>>;
type Db = { c: pg.Client; dong: () => Promise<void> };
const db: Record<string, Db> = {};
const TEN = (k: string) => `oneinvest_dbv_cg9doc_${process.pid}_${k}`;
before(async () => {
  m = await nap();
  const [co, rong, khong] = await Promise.all([m.fx.moDb(TEN("co")), m.fx.moDb(TEN("rong")), m.fx.moDb(TEN("khong"), { hetSo: 103 })]);
  Object.assign(db, { co, rong, khong });
  await m.fx.fixtureDoc(co.c);
  await m.xep(co.c, { log: () => {} });
  await m.fx.fixtureDoc(rong.c);   // có 104 nhưng chưa chấm lượt nào
  await m.fx.fixtureDoc(khong.c);  // chưa áp 104
});
after(async () => {
  for (const d of Object.values(db)) await d.dong();
});

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
type DongBang = { offer_id: string; kind: string; n: number; trung_vi: string; p20: string; hang_pct: string; duoi_trung_vi_pct: string;
  nhan: string | null; can_xac_minh: boolean; pn_nhom: number | null; ly_do: string | null; thuoc: string | null; cap: string | null };
async function bang(c: pg.Client): Promise<Map<string, DongBang>> {
  const { rows } = await c.query(`SELECT * FROM offer_price_rank`);
  return new Map(rows.map((r: DongBang) => [r.offer_id, r]));
}
const so = (x: unknown) => (x === null || x === undefined ? null : Number(x));

// ---------- AC-6: /ops/deals ----------
test("CG9-AC-6 dealsSql: đúng tập tin bán có nhãn (P1 và P2), thứ tự, số = bảng; không thuê, không unknown", async () => {
  const { c } = db.co;
  const b = await bang(c);
  const { rows } = await c.query(m.deals.dealsSql({ coBang: true }), [5, 100]);
  const ky = [...b.values()].filter((r) => r.kind === "sale" && r.nhan && Number(r.duoi_trung_vi_pct) >= 5 && Number(r.duoi_trung_vi_pct) <= 50);
  ky.sort((x, y) => Number(x.can_xac_minh) - Number(y.can_xac_minh) || Number(y.duoi_trung_vi_pct) - Number(x.duoi_trung_vi_pct) || x.offer_id.localeCompare(y.offer_id));
  assert.deepEqual(rows.map((r) => r.offer_id), ky.map((r) => r.offer_id), "tập và thứ tự danh sách = tin bán có nhãn của bảng");
  assert.ok(rows.some((r) => r.source === "S06"), "tin S06 (P2) vào danh sách — gánh CG2");
  assert.ok(rows.every((r) => !String(r.offer_id).startsWith("doc-a4") && r.offer_id !== "doc-unknown"), "không tin thuê, không unknown");
  for (const r of rows) {
    const k = b.get(r.offer_id)!;
    assert.equal(so(r.discount_pct), so(k.duoi_trung_vi_pct), `${r.offer_id}: % giảm = bảng`);
    assert.equal(so(r.ruler_n), so(k.n), `${r.offer_id}: số căn = bảng`);
    assert.equal(so(r.median_perm2), so(k.trung_vi), `${r.offer_id}: trung vị = bảng`);
  }
  assert.equal(rows.at(-1)?.offer_id, "doc-a1-0", "tin cần xác minh đứng cuối");
});

test("CG9-AC-6 trang một căn: cauChungMinh N = n của bảng, «cùng 2PN», nhãn, cặp «Cần xác minh»; đột biến N = số tin đỏ", async () => {
  const { c } = db.co;
  const b = await bang(c);
  const mot = async (id: string) => quaClient(c, () => m.deals.getDeal(id));
  const d42 = (await mot("doc-a1-1")).deal!;   // tin S06, 42 tr/m², có nhãn, không cần xác minh
  const k42 = b.get("doc-a1-1")!;
  const cau42 = cauChungMinh(d42)!;
  assert.ok(cau42.includes(`So với ${k42.n} căn cùng phường, cùng loại`), cau42);
  assert.ok(cau42.includes("Rẻ trong phường"), cau42);
  assert.ok(!cau42.includes(CHU_CAN_XAC_MINH), `tin không cờ không mang «${CHU_CAN_XAC_MINH}»: ${cau42}`);
  const d30 = (await mot("doc-a1-0")).deal!;
  assert.ok(cauChungMinh(d30)!.includes(CHU_CAN_XAC_MINH), `tin có cờ mang «${CHU_CAN_XAC_MINH}»`);
  assert.equal(d30.suspect, true);
  const dpn = (await mot("doc-a2-0")).deal!;
  assert.ok(cauChungMinh(dpn)!.includes("cùng 2PN"), cauChungMinh(dpn)!);
  // Đột biến: câu lấy N = số tin của nhóm (13 tin a1 gồm unknown) thay vì số phiếu → phép so phải đỏ.
  const sai = cauChungMinh({ ...d42, rank: { ...d42.rank!, n: 13 } })!;
  assert.ok(!sai.includes(`So với ${k42.n} căn`), "đột biến N = số tin phải lệch số căn của bảng");
  // Lý do rời danh sách đọc từ bảng.
  assert.equal((await mot("doc-a3-0")).deal!.roiDanhSach, "Nhóm so sánh chỉ có 5–9 căn — có số, chưa gắn nhãn");
  assert.equal((await mot("doc-a1-11")).deal!.roiDanhSach, "Đắt hơn trung vị nhóm 21.6%, không phải căn giá tốt");
});

const H = (p: Partial<HangGia>): HangGia => ({ n: null, median: null, p20: null, pct: null, below: null, label: null,
  needsVerification: false, bedroomsGroup: null, reason: null, metric: null, ...p });
test("CG9-AC-6 ma trận mã lý do: mỗi mã một chữ ghim, mã lạ ra chữ mặc định", () => {
  const MA_TRAN: [string, string][] = [
    ["chua-ro-loai", "Chưa rõ loại hình — không so được với căn cùng loại"],
    ["thieu-phuong", "Chưa rõ phường — không có nhóm để so"],
    ["thieu-gia", "Thiếu giá hoặc diện tích — không tính được giá/m²"],
    ["thieu-dt-va-pn", "Tin thuê thiếu cả diện tích lẫn số phòng ngủ — không so được"],
    ["ngoai-khoang", "Giá nằm ngoài khoảng hợp lệ để so"],
    ["phi-ly:phong-qua-nho", "Diện tích hoặc số phòng phi lý — đã loại khỏi so sánh"],
    ["phi-ly:dien-tich-ngoai-khoang", "Diện tích hoặc số phòng phi lý — đã loại khỏi so sánh"],
    ["nhom-duoi-5", "Nhóm so sánh dưới 5 căn — chưa chấm hạng"],
    ["ma-la-xyz", CHU_LY_DO_LA],
  ];
  const d = { discountPct: null, medianPerm2: null, propertyType: "apartment" } as const;
  for (const [ma, chu] of MA_TRAN) assert.equal(lyDoRoi({ ...d, rank: H({ reason: ma }) }, false), chu, `mã ${ma}`);
  assert.equal(lyDoRoi({ ...d, rank: H({ n: 7, below: 10, reason: "nhom-5-9" }) }, false), "Nhóm so sánh chỉ có 5–9 căn — có số, chưa gắn nhãn");
  assert.equal(lyDoRoi({ ...d, rank: H({ n: 12, below: 8, reason: "pn-duoi-10" }) }, false), "Không nằm trong 20% rẻ nhất của nhóm",
    "pn-duoi-10 chỉ là lùi cấp: tin có số mà không nhãn thì nói vì sao không nhãn");
  assert.equal(lyDoRoi({ ...d, rank: H({ n: 12, below: 12, label: "re-trong-phuong", reason: "pn-duoi-10" }) }, false), null);
  const cau = cauChungMinh({ propertyType: "apartment", rank: H({ n: 12, below: 8, reason: "pn-duoi-10" }) } as DealChiTiet);
  assert.ok(cau?.startsWith("So với 12 căn cùng phường, cùng loại (căn hộ):"), String(cau));
});

test("CG9-AC-6 bảng chưa có hoặc rỗng: dealsSql/getDeals/getDeal đọc theo thước CG8, không lỗi", async () => {
  for (const k of ["khong", "rong"]) {
    const { c } = db[k];
    assert.equal(await quaClient(c, () => m.deals.coBangHang()), false, `${k}: coBangHang phải false`);
    const ds = await quaClient(c, () => m.deals.getDeals());
    assert.ok(Array.isArray(ds.rows), `${k}: getDeals trả mảng`);
    assert.ok(ds.rows.every((r) => r.rank == null), `${k}: không có khối hạng khi đọc thước CG8`);
    const mot = await quaClient(c, () => m.deals.getDeal("doc-a1-1"));
    assert.equal(mot.deal, null, `${k}: thước CG8 chỉ mở tin P1 — tin S06 không mở`);
  }
  assert.equal(await quaClient(db.co.c, () => m.deals.coBangHang()), true, "đối chứng: DB đã chấm → true");
});

// ---------- AC-7: hai API ----------
const KHOA_CU_APP: Record<string, string> = { offerId: "string", source: "string", priceVnd: "number", areaM2: "number", pricePerm2: "number",
  bedrooms: "object|number", phuong: "string", medianPerm2: "number|object", rulerN: "number", discountPct: "number", confidence: "string", lastSeen: "string" };
const KHOA_CU_API: Record<string, string> = { offerId: "string", priceVnd: "number", areaM2: "number", pricePerm2: "number", bedrooms: "object|number",
  phuong: "string", marketId: "string", propertyType: "string", medianPerm2: "number|object", discountPct: "number", confidence: "string",
  firstSeen: "string", lastSeen: "string", nReposts: "number", contact: "object", postText: "object|string" };
function kiemKhoa(row: Record<string, unknown>, bo: Record<string, string>, nhan: string) {
  for (const [k, kieu] of Object.entries(bo)) {
    assert.ok(k in row, `${nhan}: thiếu trường cũ ${k}`);
    assert.ok(kieu.split("|").includes(typeof row[k]), `${nhan}: ${k} kiểu ${typeof row[k]} ∉ ${kieu}`);
  }
}
type Dong = Record<string, unknown> & { offerId: string; discountPct: number; rank?: Record<string, unknown> };
function kiemRank(rows: Dong[], b: Map<string, DongBang>, kind: string, nhan: string) {
  assert.ok(rows.length > 0, `${nhan}: rỗng`);
  for (const r of rows) {
    const k = b.get(r.offerId)!;
    assert.equal(k.kind, kind, `${nhan} ${r.offerId}: sai loại tin`);
    assert.ok(k.nhan, `${nhan} ${r.offerId}: không nhãn`);
    assert.equal(r.discountPct, so(k.duoi_trung_vi_pct), `${nhan} ${r.offerId}: discountPct`);
    assert.equal(r.rank?.n, so(k.n));
    assert.equal(r.rank?.median, so(k.trung_vi));
    assert.equal(r.rank?.p20, so(k.p20));
    assert.equal(r.rank?.percentile, so(k.hang_pct));
    assert.equal(r.rank?.label, k.nhan);
    assert.equal(r.rank?.needsVerification, k.can_xac_minh);
  }
}

test("CG9-AC-7 /v1/deals data-api: kind vắng/sale/rent_lt, số = bảng, trường cũ đủ, lọc area/market/limit/min_discount, kind sai → 400", async () => {
  const { c } = db.co;
  const b = await bang(c);
  const goi = async (q: string) => quaClient(c, async () => {
    const res = await m.dealsRoute.request(`/?${q}`);
    return { status: res.status, body: (await res.json()) as { data: Dong[]; meta: Record<string, unknown> } };
  });
  const vang = await goi("limit=100&min_discount=0");
  kiemRank(vang.body.data, b, "sale", "data-api kind vắng");
  for (const r of vang.body.data) kiemKhoa(r, KHOA_CU_API, `data-api ${r.offerId}`);
  assert.deepEqual((await goi("kind=sale&limit=100&min_discount=0")).body.data.map((r) => r.offerId), vang.body.data.map((r) => r.offerId));
  const thue = await goi("kind=rent_lt&limit=100&min_discount=0");
  kiemRank(thue.body.data, b, "rent_lt", "data-api kind=rent_lt");
  assert.ok(vang.body.data.every((r) => !r.offerId.startsWith("doc-a4")), "tin thuê chỉ có khi kind=rent_lt");
  assert.deepEqual((await goi("area=cg9-a2&limit=100&min_discount=0")).body.data.map((r) => r.offerId).every((id) => id.startsWith("doc-a2")), true);
  assert.equal((await goi("market=cg9-tinh&limit=100&min_discount=0")).body.data.length, vang.body.data.length);
  assert.equal((await goi("limit=1&min_discount=0")).body.data.length, 1);
  assert.ok((await goi("limit=100&min_discount=15")).body.data.every((r) => r.discountPct >= 15));
  assert.equal((await goi("kind=xyz")).status, 400);
  for (const k of ["khong", "rong"]) {
    const res = (await quaClient(db[k].c, () => m.dealsRoute.request("/?limit=100&min_discount=0"))) as Response;
    assert.equal(res.status, 200, `data-api ${k}: bảng thiếu/rỗng vẫn 200`);
    const j = (await res.json()) as { data: Dong[] };
    assert.ok(j.data.every((r) => r.rank === undefined), `data-api ${k}: đọc thước CG8, không khối rank`);
  }
});

test("CG9-AC-7 /api/v1/deals app (token ops): kind, số = bảng, trường cũ đủ, kind sai → 400, bảng thiếu/rỗng → 200", async () => {
  const { c } = db.co;
  const b = await bang(c);
  const cu = process.env.OPS_API_TOKEN;
  process.env.OPS_API_TOKEN = "cg9-thu-token";
  try {
    const goi = async (q: string, cl = c) => quaClient(cl, async () => {
      const res = await m.GET(new Request(`http://x/api/v1/deals?${q}`, { headers: { authorization: "Bearer cg9-thu-token" } }));
      return { status: res.status, body: (await res.json()) as { data: Dong[]; meta: Record<string, unknown> } };
    });
    const vang = await goi("limit=100&min_discount=0");
    kiemRank(vang.body.data, b, "sale", "app kind vắng");
    for (const r of vang.body.data) kiemKhoa(r, KHOA_CU_APP, `app ${r.offerId}`);
    kiemRank((await goi("kind=rent_lt&limit=100&min_discount=0")).body.data, b, "rent_lt", "app kind=rent_lt");
    assert.equal((await goi("kind=xyz")).status, 400);
    for (const k of ["khong", "rong"]) {
      const r = await goi("limit=100&min_discount=0", db[k].c);
      assert.equal(r.status, 200, `app ${k}: 200`);
      assert.ok(r.body.data.every((x) => x.rank === undefined), `app ${k}: đọc thước CG8`);
    }
  } finally {
    if (cu === undefined) delete process.env.OPS_API_TOKEN;
    else process.env.OPS_API_TOKEN = cu;
  }
});
