// can-gia-cung-loai-db.test.tsx — hồ sơ can-gia-tot-cung-loai (CG8), ca xuyên lớp AC-3 (/ops/deals), AC-5 (/api/v1/deals của app),
// AC-6 (/v1/deals của data-api). Fixture và giao dịch dùng chung với itest pipeline (can-gia-cung-loai-fixture.itest.mjs: BEGIN…ROLLBACK,
// lược đồ riêng). Hai route đọc qua `pool` dùng chung → trong ca, pool.query trỏ vào client của giao dịch (cùng lược đồ riêng);
// thước kỳ vọng tính lại độc lập bằng SQL viết riêng trên v_ruler_p2, không dùng mã của hàng.
// Chạy: npm test (hoặc node --import tsx --test tests/can-gia-cung-loai-db.test.tsx). Ngoài máy chủ Next `cookies()` ném lỗi,
// nên ca 401 đo cổng với phiên rỗng và vị trí cổng trước truy vấn trong route — cùng khuôn tin-rao-cong-khai.test.tsx.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type pg from "pg";
import { canCallOpsApi } from "../src/lib/ops-access";

// Tệp ngoài app (pipeline .mjs, data-api .ts) nạp qua URL: tsc của app không kiểu-hoá chéo module.
const ngoai = (rel: string) => import(pathToFileURL(join(import.meta.dirname, rel)).href);
// Không mặc định về DB dùng chung ở máy: thiếu DATABASE_URL thì dừng (npm test và can-gia-cung-loai-db.sh đều đặt DB thử).
// Trên CI (biến CI) DB «oneinvest» là DB trống dựng từ migration cho riêng lượt, nên mặc định về nó như các test khác.
const DB_URL = process.env.DATABASE_URL ?? (process.env.CI ? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" : "");
if (!DB_URL) throw new Error("can-gia-cung-loai-db.test: thiếu DATABASE_URL — chạy qua npm test hoặc can-gia-cung-loai-db.sh itest");
process.env.DATABASE_URL = DB_URL;

const nap = async () => ({
  fx: await ngoai("../../pipeline/scripts/can-gia-cung-loai-fixture.itest.mjs"),
  refreshBaitGap: (await import("../../pipeline/refresh-bait-gap.mjs")).refreshBaitGap,
  deals: await import("../src/lib/deals"),
  pool: (await import("../src/lib/db")).pool,
  GET: (await import("../src/app/api/v1/deals/route")).GET,
  poolApi: (await ngoai("../../data-api/src/db/client.ts")).pool as pg.Pool,
  dealsRoute: (await ngoai("../../data-api/src/routes/deals.ts")).dealsRoute,
});
let m: Awaited<ReturnType<typeof nap>>;
before(async () => {
  m = await nap();
});

/** Trong fn, pool của app và của data-api chạy câu trên client giao dịch. */
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

/** Thước kỳ vọng, SQL viết riêng: (phường, loại) → {m, n}. */
async function thuocKyVong(c: pg.Client): Promise<Map<string, { m: number; n: number }>> {
  const { rows } = await c.query(`SELECT area_id, property_type, m, n FROM v_ruler_p2`);
  return new Map(rows.map((r) => [`${r.area_id}|${r.property_type}`, { m: Number(r.m), n: Number(r.n) }]));
}

/** Loại hình và phường của từng tin, đọc thẳng từ bảng. */
async function tinCua(c: pg.Client): Promise<Map<string, { area: string; type: string | null; kind: string; perm2: number }>> {
  const { rows } = await c.query(`SELECT offer_id, area_id, property_type, kind, price_perm2 FROM sale_offer_records`);
  return new Map(rows.map((r) => [r.offer_id, { area: r.area_id, type: r.property_type, kind: r.kind, perm2: Number(r.price_perm2) }]));
}

const gapLai = (perm2: number, m: number) => Math.round((1 - perm2 / m) * 1000) / 10;

async function chuanBi(c: pg.Client) {
  const ids = await m.fx.dungFixture(c);
  const goc = console.log;
  console.log = () => {};
  try {
    await m.refreshBaitGap(c);
  } finally {
    console.log = goc;
  }
  return { ...ids, thuoc: await thuocKyVong(c), tin: await tinCua(c) };
}

test("CG8-AC-3 /ops/deals: trung vị và số căn in ra là của đúng dòng v_ruler_p2 cùng phường × loại", async () => {
  await m.fx.withTx(async (c: pg.Client) => {
    const { ac1, ac2, thuoc, tin } = await chuanBi(c);
    const ds = (await c.query(m.deals.dealsSql(), [0, 100])).rows;
    assert.ok(ds.some((r) => r.offer_id === ac1.apartment), "CG8-AC-3 đối chứng dương: căn hộ có thước không có trong danh sách");
    for (const r of ds) {
      const t = tin.get(r.offer_id)!;
      const k = thuoc.get(`${t.area}|${t.type}`);
      assert.ok(k, `CG8-AC-3 ${r.offer_id}: không có dòng thước cùng phường × loại`);
      assert.equal(Number(r.median_perm2), k.m, `CG8-AC-3 ${r.offer_id}: median_perm2 không phải thước cùng loại`);
      assert.equal(Number(r.ruler_n), k.n, `CG8-AC-3 ${r.offer_id}: ruler_n không phải thước cùng loại`);
      assert.notEqual(r.property_type, "unknown", `CG8-AC-3 ${r.offer_id}: tin chưa rõ loại trong danh sách`);
    }
    for (const id of Object.values(ac1)) {
      const r = (await c.query(m.deals.dealSql(), [id])).rows[0];
      const t = tin.get(id)!;
      assert.equal(Number(r.median_perm2), thuoc.get(`${t.area}|${t.type}`)!.m, `CG8-AC-3 dealSql ${id}: sai thước`);
    }
    assert.equal(ds.filter((r) => r.offer_id === ac2.unknown || r.offer_id === ac2.null).length, 0, "CG8-AC-3 tin chưa rõ loại lọt danh sách");
    // Đột biến: thước cả phường (câu trước CG8) → trung vị in ra lệch ở dòng căn hộ.
    const cu = m.deals.dealsSql()
      .replace(m.deals.THUOC_CUNG_LOAI, "SELECT area_id, NULL::text AS property_type, m, n FROM v_ruler_p2_area")
      .replace("AND r.property_type = o.property_type", "");
    const dbCu = (await c.query(cu, [0, 100])).rows.find((r) => r.offer_id === ac1.apartment);
    assert.notEqual(Number(dbCu?.median_perm2), thuoc.get(`${m.fx.PA}|apartment`)!.m, "CG8-AC-3 đột biến v_ruler_p2_area không đỏ");
  });
});

test("CG8-AC-5 /api/v1/deals: số giảm theo thước cùng loại, không unknown, không thuê; không token → 401", async () => {
  await m.fx.withTx(async (c: pg.Client) => {
    const { ac1, ac2, thuoc, tin } = await chuanBi(c);
    const cu = process.env.OPS_API_TOKEN;
    process.env.OPS_API_TOKEN = "cg8-thu-token";
    try {
      const res = await quaClient(c, () => m.GET(new Request("http://x/api/v1/deals?limit=100&min_discount=0", {
        headers: { authorization: "Bearer cg8-thu-token" },
      })));
      assert.equal(res.status, 200);
      const body = await res.json();
      const ma = body.data.map((d: { offerId: string }) => d.offerId);
      assert.ok(ma.includes(ac1.apartment), "CG8-AC-5 đối chứng dương: tin bán cùng phường không có");
      for (const d of body.data) {
        const t = tin.get(d.offerId)!;
        assert.equal(t.kind, "sale", `CG8-AC-5 ${d.offerId}: tin thuê`);
        assert.ok(t.type && t.type !== "unknown", `CG8-AC-5 ${d.offerId}: tin chưa rõ loại`);
        const k = thuoc.get(`${t.area}|${t.type}`)!;
        assert.ok(Math.abs(d.discountPct - gapLai(t.perm2, k.m)) <= 0.1, `CG8-AC-5 ${d.offerId}: số giảm lệch thước cùng loại`);
      }
      for (const id of [ac2.unknown, ac2.null, ac2.thue]) assert.ok(!ma.includes(id), `CG8-AC-5 ${id} lọt danh sách`);
      assert.match(body.meta.ruler, /phường × loại hình/);
      delete process.env.OPS_API_TOKEN;
      assert.equal(await canCallOpsApi(new Request("http://x/api/v1/deals"), async () => null), false, "CG8-AC-5 không token mà cổng mở");
      const nguon = readFileSync(join(import.meta.dirname, "../src/app/api/v1/deals/route.ts"), "utf8");
      const cong = nguon.indexOf("canCallOpsApi(req, getSessionUser)");
      assert.ok(cong > 0 && cong < nguon.indexOf("pool.query"), "CG8-AC-5 cổng 401 không đứng trước truy vấn");
    } finally {
      if (cu === undefined) delete process.env.OPS_API_TOKEN;
      else process.env.OPS_API_TOKEN = cu;
    }
  });
});

// Bảng khoá của phản hồi /v1/deals trước CG8 (viết trước): tên → typeof; `null` cho khoá có thể rỗng.
const KHOA_CU: Record<string, string[]> = {
  offerId: ["string"], priceVnd: ["number", "null"], areaM2: ["number", "null"], pricePerm2: ["number", "null"],
  bedrooms: ["number", "null"], phuong: ["string", "null"], marketId: ["string", "null"], medianPerm2: ["number", "null"],
  discountPct: ["number", "null"], confidence: ["string"], firstSeen: ["string"], lastSeen: ["string"], nReposts: ["number"],
  contact: ["object", "null"], postText: ["string", "null"],
};
const kieu = (v: unknown) => (v === null ? "null" : typeof v);

test("CG8-AC-6 data-api /v1/deals: propertyType, thước cùng loại, khoá cũ giữ, lọc như trước", async () => {
  await m.fx.withTx(async (c: pg.Client) => {
    const { ac1, ac2, thuoc, tin } = await chuanBi(c);
    const goi = async (q: string) => quaClient(c, async () => (await (await m.dealsRoute.request(`/?${q}`)).json()) as {
      data: Record<string, unknown>[]; meta: { minDiscount: number };
    });
    const tat = await goi("limit=100&min_discount=0");
    const ma = tat.data.map((d) => d.offerId);
    assert.ok(ma.includes(ac1.apartment), "CG8-AC-6 đối chứng dương: tin bán cùng phường không có");
    for (const d of tat.data) {
      const t = tin.get(d.offerId as string)!;
      assert.ok(d.propertyType && d.propertyType !== "unknown", `CG8-AC-6 ${d.offerId}: propertyType ${d.propertyType}`);
      assert.equal(d.propertyType, t.type, `CG8-AC-6 ${d.offerId}: propertyType khác tin`);
      assert.equal(t.kind, "sale", `CG8-AC-6 ${d.offerId}: tin thuê`);
      const k = thuoc.get(`${t.area}|${t.type}`)!;
      assert.ok(Math.abs((d.discountPct as number) - gapLai(t.perm2, k.m)) <= 0.1, `CG8-AC-6 ${d.offerId}: số giảm lệch`);
      for (const [khoa, ks] of Object.entries(KHOA_CU)) {
        assert.ok(khoa in d && ks.includes(kieu(d[khoa])), `CG8-AC-6 ${d.offerId}: khoá ${khoa} mất hay đổi kiểu (${kieu(d[khoa])})`);
      }
    }
    for (const id of [ac2.unknown, ac2.null, ac2.thue]) assert.ok(!ma.includes(id), `CG8-AC-6 ${id} lọt danh sách`);
    // Lọc: area, market, limit, min_discount (fixture: căn hộ 20%, đất 46,7%, mặt bằng 33,3% ở phường A; nhà 60% vượt trần 50).
    const theoArea = await goi(`area=${m.fx.PA}&min_discount=0`);
    assert.ok(theoArea.data.length > 0 && theoArea.data.every((d) => tin.get(d.offerId as string)!.area === m.fx.PA), "CG8-AC-6 lọc area");
    const theoMarket = await goi(`market=${m.fx.THI_TRUONG}&min_discount=0`);
    assert.deepEqual(theoMarket.data.map((d) => d.offerId).sort(), theoArea.data.map((d) => d.offerId).sort(), "CG8-AC-6 lọc market");
    assert.equal((await goi(`area=${m.fx.PA}&min_discount=0&limit=1`)).data.length, 1, "CG8-AC-6 limit");
    const tu30 = await goi(`area=${m.fx.PA}&min_discount=30`);
    assert.ok(tu30.data.length > 0 && tu30.data.every((d) => (d.discountPct as number) >= 30), "CG8-AC-6 min_discount");
    assert.ok(!tu30.data.some((d) => d.offerId === ac1.apartment), "CG8-AC-6 min_discount để lọt căn hộ 20%");
    // Đột biến: câu trước CG8 (market_asset_stats theo phường × bán/thuê) — bảng không có loại hình, tin căn hộ không còn số đúng.
    const sqlCu = `SELECT ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) AS g FROM sale_offers o
      LEFT JOIN market_asset_stats s ON s.area_id = o.area_id AND s.kind = o.kind WHERE o.offer_id = $1`;
    const gCu = await c.query(sqlCu, [ac1.apartment]).then((r) => r.rows[0]?.g, () => null);
    assert.notEqual(gCu === null || gCu === undefined ? null : Number(gCu), m.fx.gapCua(m.fx.THUOC_A.apartment[1]), "CG8-AC-6 đột biến market_asset_stats không đỏ");
  });
});
