// do-lech-s03-s06-doc.test.tsx — hồ sơ do-lech-s03-s06-canh-hang (CG15), ca AC-5 (đường đọc dealsSql/trang một căn gắn mặt bằng
// S03 so S06) và AC-6 (chữ trên danh sách và trang một căn). DB thử trắng dựng từ db/migrations của nhánh
// (pipeline/scripts/gia-tot-du-an-fixture.itest.mjs), chấm bằng chính bước chấm; số kỳ vọng đọc thẳng từ project_source_baseline
// bằng SQL viết riêng. Chữ ghim nguyên văn theo thiết kế §2.3.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import type pg from "pg";

import { chuMatBang, chuMatBangChiTiet, type MatBang } from "../src/lib/deals-chi-tiet";

const ngoai = (rel: string) => import(pathToFileURL(join(import.meta.dirname, rel)).href);
process.env.DATABASE_URL ??= process.env.CI ? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" : "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg15_doc_khong_dung";

const nap = async () => ({
  fx: await ngoai("../../pipeline/scripts/gia-tot-du-an-fixture.itest.mjs"),
  xep: (await ngoai("../../pipeline/xep-hang-gia.mjs")).xepHangGia as (c: pg.Client, o?: object) => Promise<unknown>,
  deals: await import("../src/lib/deals"),
  pool: (await import("../src/lib/db")).pool,
});
let m: Awaited<ReturnType<typeof nap>>;
const M = 1_000_000;
const im = { log: () => {} };

/** Trong fn, pool của app chạy câu trên client cho trước. */
async function quaClient<T>(c: pg.Client, fn: () => Promise<T>): Promise<T> {
  const goc = m.pool.query;
  m.pool.query = ((...a: unknown[]) => (c.query as (...x: unknown[]) => unknown)(...a)) as typeof m.pool.query;
  try {
    return await fn();
  } finally {
    m.pool.query = goc;
  }
}

/** Dự án một phường: bán căn hộ 2PN — S03 hai tin rẻ (có nhãn) + 4 tin, S06 8 tin; một tin S03 không dự án. */
async function fixture(c: pg.Client): Promise<number> {
  const d = await m.fx.duAn(c, { ten: "Khu thử Mười Lăm" });
  const s03 = [30, 31, 50, 51, 52, 53];
  for (const [i, v] of s03.entries()) await m.fx.tin(c, { id: `d15-s03-${i}`, duAn: d, m2: 60, pn: 2, perm2: v * M });
  for (let i = 0; i < 8; i++) await m.fx.tinS06(c, { id: `d15-s06-${i}`, duAn: d, m2: 60, pn: 2, perm2: (54 + i) * M });
  await m.fx.tin(c, { id: "d15-phuong", phuong: m.fx.A("a3"), m2: 60, pn: 2, perm2: 40 * M });
  await m.xep(c, im);
  return d;
}
async function dongBang(c: pg.Client, d: number) {
  const { rows } = await c.query(`SELECT * FROM project_source_baseline WHERE nut = $1 AND kind = 'sale'`, [String(d)]);
  assert.equal(rows.length, 1, `CG15-AC-5 dự án ${d} cần đúng một dòng mặt bằng bán`);
  return rows[0];
}
const soMb = (r: Record<string, unknown>): MatBang => ({
  nS03: Number(r.n_s03), medianS03: r.trung_vi_s03 == null ? null : Number(r.trung_vi_s03), nS06: Number(r.n_s06),
  medianS06: r.trung_vi_s06 == null ? null : Number(r.trung_vi_s06), lechPct: r.lech_pct == null ? null : Number(r.lech_pct),
  trangThai: r.trang_thai as MatBang["trangThai"],
});

let c: pg.Client;
let d: number;
let cCloud: pg.Client;
before(async () => {
  m = await nap();
  await m.fx.dungMau();
  c = await m.fx.dbCa();
  d = await fixture(c);
  cCloud = await m.fx.dbCa({ bo107: true });
  await fixture(cCloud);
});
after(async () => {
  await m.fx.donHet();
  await m.pool.end().catch(() => {});
});

// ---------- AC-5 ----------
test("CG15-AC-5 danh sách và trang một căn gắn đúng dòng mặt bằng cho tin S03 cấp dự án; S06, cấp phường null; lược đồ không bảng null", async () => {
  const ky = soMb(await dongBang(c, d));
  assert.equal(ky.trangThai, "du", "CG15-AC-5 đối chứng: nhóm thử phải đủ hai bên");
  const ds = await quaClient(c, () => m.deals.getDeals(undefined, 0, { project: String(d) }));
  const s03 = ds.rows.filter((x) => x.source === "S03");
  assert.ok(s03.length >= 2, `CG15-AC-5 danh sách dự án thiếu tin S03 có nhãn: ${ds.rows.map((x) => x.offerId).join(", ")}`);
  for (const x of s03) assert.deepEqual(x.matBang, ky, `CG15-AC-5 ${x.offerId} matBang khác dòng bảng`);
  const mot = async (cl: pg.Client, id: string) => (await quaClient(cl, () => m.deals.getDeal(id))).deal;
  assert.deepEqual((await mot(c, "d15-s03-3"))?.matBang, ky, "CG15-AC-5 trang một căn S03 không nhãn: matBang khác dòng bảng");
  assert.equal((await mot(c, "d15-s06-0"))?.matBang, null, "CG15-AC-5 tin S06 có matBang");
  assert.equal((await mot(c, "d15-phuong"))?.matBang, null, "CG15-AC-5 tin cấp phường có matBang");
  // lược đồ không bảng 107 (kiểu cloud): không ném, null mọi dòng — đối chứng dương là chính các ca trên
  const dsCloud = await quaClient(cCloud, () => m.deals.getDeals(undefined, 0, {}));
  assert.ok(dsCloud.rows.length > 0, "CG15-AC-5 đối chứng: lược đồ không bảng vẫn phải có danh sách");
  assert.ok(dsCloud.rows.every((x) => x.matBang === null), "CG15-AC-5 lược đồ không bảng mà có matBang");
  assert.equal((await mot(cCloud, "d15-s03-3"))?.matBang, null, "CG15-AC-5 lược đồ không bảng: trang một căn có matBang");
});

// ---------- AC-6 ----------
const MB: Record<string, [MatBang, string | null, string]> = {
  "đủ, S03 rẻ hơn": [{ nS03: 7, medianS03: 55.6 * M, nS06: 92, medianS06: 58 * M, lechPct: -4.1, trangThai: "du" }, "gia-m2", "S06 58 tr/m² · 92 căn · S03 −4,1%"],
  "đủ, S03 đắt hơn": [{ nS03: 9, medianS03: 61.8 * M, nS06: 40, medianS06: 60 * M, lechPct: 3, trangThai: "du" }, "gia-m2", "S06 60 tr/m² · 40 căn · S03 +3,0%"],
  "thiếu S06": [{ nS03: 12, medianS03: 50 * M, nS06: 3, medianS06: 52 * M, lechPct: null, trangThai: "thieu-s06" }, "gia-m2", "S06 chưa đủ để so (3 căn)"],
  "thiếu S03": [{ nS03: 4, medianS03: 50 * M, nS06: 50, medianS06: 52 * M, lechPct: null, trangThai: "thieu-s03" }, "gia-m2", "S03 chưa đủ để so (4 căn) · S06 52 tr/m² · 50 căn"],
  "thiếu hai": [{ nS03: 2, medianS03: 50 * M, nS06: 3, medianS06: 52 * M, lechPct: null, trangThai: "thieu-hai" }, "gia-m2", "Chưa đủ căn hai nguồn để so (S03 2 · S06 3)"],
  "thuê giá tháng": [{ nS03: 6, medianS03: 12.36 * M, nS06: 40, medianS06: 12 * M, lechPct: 3, trangThai: "du" }, "gia-thang-pn", "S06 12 tr/tháng · 40 căn · S03 +3,0%"],
  // nhóm 9 căn mang 10 tin: số trên màn là số căn của bảng (n_s06 = 9), không phải số tin
  "9 căn 10 tin": [{ nS03: 5, medianS03: 57 * M, nS06: 9, medianS06: 60 * M, lechPct: -5, trangThai: "du" }, "gia-m2", "S06 60 tr/m² · 9 căn · S03 −5,0%"],
};
type ChuFn = (mb: MatBang, metric: string | null) => string;
function kiemChu(fn: ChuFn) {
  for (const [ten, [mb, metric, ky]] of Object.entries(MB)) assert.equal(fn(mb, metric), ky, `CG15-AC-6 «${ten}»`);
}
/** Bản chép deals-chi-tiet.ts cạnh tệp gốc (import tương đối còn đúng), thay một chuỗi; trả chuMatBang của bản chép. */
let soChep = 0;
const chep: string[] = [];
async function banChep(cu: string, moi: string): Promise<ChuFn> {
  const goc = join(import.meta.dirname, "../src/lib/deals-chi-tiet.ts");
  const s = readFileSync(goc, "utf8");
  assert.ok(s.includes(cu), `đột biến rỗng: không thấy «${cu}» trong deals-chi-tiet.ts`);
  const tep = join(import.meta.dirname, `../src/lib/.cg15-chep-${process.pid}-${++soChep}.ts`);
  writeFileSync(tep, s.split(cu).join(moi));
  chep.push(tep);
  return (await import(pathToFileURL(tep).href)).chuMatBang as ChuFn;
}
after(() => { for (const t of chep) rmSync(t, { force: true }); });

/** Câu trang một căn: đủ hai bên ghi cả hai nguồn; thiếu bên trùng câu danh sách. */
const CHI_TIET: Record<string, string> = {
  "đủ, S03 rẻ hơn": "S03 56 tr/m² · 7 căn · S06 58 tr/m² · 92 căn · S03 −4,1%",
  "đủ, S03 đắt hơn": "S03 62 tr/m² · 9 căn · S06 60 tr/m² · 40 căn · S03 +3,0%",
  "thuê giá tháng": "S03 12 tr/tháng · 6 căn · S06 12 tr/tháng · 40 căn · S03 +3,0%",
  "9 căn 10 tin": "S03 57 tr/m² · 5 căn · S06 60 tr/m² · 9 căn · S03 −5,0%",
};
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
async function htmlTinh(el: React.ReactElement) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  return renderToStaticMarkup(<AppRouterContext.Provider value={ROUTER as never}>{el}</AppRouterContext.Provider>);
}
/** DealHang tối thiểu cho ô danh sách và trang một căn (khuôn của ca OD1-AC-9). */
const hang = (mb: MatBang | null, metric: string | null) => ({
  offerId: "cg15-o", source: "S03", priceVnd: 2e9, areaM2: 50, pricePerm2: 4e7, bedrooms: 2, phuong: "Phường thử", areaPath: "/vn/x",
  medianPerm2: 6e7, rulerN: 20, discountPct: 10, suspect: false, confidence: "high", firstSeen: "2026-11-01", lastSeen: "2026-11-07",
  nReposts: 1, sellerName: null, sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null, propertyType: "apartment",
  block: null, floor: null, unit: null, streetNumber: null, street: null, district: null, images: [], postTextFull: null, roiDanhSach: null,
  ten: "Căn thử", thieu: [], cau: null, tel: null, sdt: null, xemAnh: false,
  rank: { n: 20, median: 6e7, p20: 5e7, pct: 10, below: 10, label: "gia-tot", needsVerification: false, bedroomsGroup: 2, reason: null, metric, level: "du_an", node: "1", nodeName: "Khu thử" },
  matBang: mb,
});
/** Bỏ thẻ HTML, gộp khoảng trắng — so câu trên đầu ra dựng thật. */
const chu = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("CG15-AC-6 bốn câu theo trạng thái, đơn vị căn, thuê tr/tháng; ô danh sách và trang một căn dựng thật; ba đột biến đỏ", async () => {
  kiemChu(chuMatBang);
  const { DiscountBar } = await import("../src/components/ops/deals-cells");
  const { DealBody } = await import("../src/components/ops/deal-body");
  for (const [ten, [mb, metric, ky]] of Object.entries(MB)) {
    const o = chu(await htmlTinh(<DiscountBar d={hang(mb, metric) as never} gon />));
    assert.ok(o.includes(ky), `CG15-AC-6 ô danh sách «${ten}» thiếu «${ky}»: ${o}`);
    const t = chu(await htmlTinh(<DealBody d={hang(mb, metric) as never} xemNoiDung mayThu beMat="trang" />));
    const kyCt = CHI_TIET[ten] ?? ky;
    assert.equal(chuMatBangChiTiet(mb, metric), kyCt, `CG15-AC-6 câu trang một căn «${ten}»`);
    assert.ok(t.includes("Mặt bằng S06 cùng dự án") && t.includes(kyCt), `CG15-AC-6 trang một căn «${ten}» thiếu «${kyCt}»: ${t}`);
  }
  // dòng không matBang: không có chữ «S06» ở ô danh sách, không có hàng mặt bằng ở trang một căn
  const o0 = chu(await htmlTinh(<DiscountBar d={hang(null, "gia-m2") as never} gon />));
  assert.ok(!o0.includes("S06"), `CG15-AC-6 ô danh sách không matBang mà có chữ S06: ${o0}`);
  const t0 = chu(await htmlTinh(<DealBody d={hang(null, "gia-m2") as never} xemNoiDung mayThu beMat="trang" />));
  assert.ok(!t0.includes("Mặt bằng S06 cùng dự án"), "CG15-AC-6 trang một căn không matBang mà có hàng mặt bằng");
  // ba đột biến
  const DOT: [string, string, string][] = [
    ["đảo dấu", "${pct < 0 ? \"−\" : \"+\"}", "${pct < 0 ? \"+\" : \"−\"}"],
    ["câu thieu-s06 cho thieu-s03", "    case \"thieu-s03\":\n      return `S03 chưa đủ để so (${m.nS03} căn) · ${s06}`;", "    case \"thieu-s03\":\n      return `S06 chưa đủ để so (${m.nS06} căn)`;"],
    ["n S03 làm số căn S06", "const s06 = `S06 ${chuTrungVi(m.medianS06, metric)} · ${m.nS06} căn`;", "const s06 = `S06 ${chuTrungVi(m.medianS06, metric)} · ${m.nS03} căn`;"],
  ];
  for (const [ten, cu, moi] of DOT) {
    const fn = await banChep(cu, moi);
    assert.throws(() => kiemChu(fn), /CG15-AC-6 «/, `CG15-AC-6 đột biến «${ten}» không đỏ`);
  }
});
