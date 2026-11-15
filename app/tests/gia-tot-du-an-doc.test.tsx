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
  dealsRoute: (await ngoai("../../data-api/src/routes/deals.ts")).dealsRoute,
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
