// deals-loc-xep-hang.test.tsx — hồ sơ can-gia-tot-loc-xep-hang (CG3). DB thử trắng dựng từ db/migrations của nhánh, hạng do chính bước
// chấm xepHangGia ghi; kỳ vọng tính độc lập bằng SQL viết riêng trong tệp này. Số là số bịa; không tên nguồn thật.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import type pg from "pg";

import { DealHangNhom, DiscountBar } from "../src/components/ops/deals-cells";
import { DealsGrid } from "../src/components/ops/deals-grid";
import { CO_TRANG_DEAL, docThamSoDeal, type DealHang, type TabTrang, type ThamSoDeal, type TrangDeal, urlThamSoDeal } from "../src/lib/deals-chi-tiet";

const ngoai = (rel: string) => import(pathToFileURL(join(import.meta.dirname, rel)).href);
process.env.DATABASE_URL ??= "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg3_khong_dung";

const nap = async () => ({
  fx: await ngoai("../../pipeline/scripts/gia-tot-du-an-fixture.itest.mjs"),
  xep: (await ngoai("../../pipeline/xep-hang-gia.mjs")).xepHangGia as (c: pg.Client, o?: object) => Promise<unknown>,
  deals: await import("../src/lib/deals"),
  pool: (await import("../src/lib/db")).pool,
});
let m: Awaited<ReturnType<typeof nap>>;
let c: pg.Client;
let d1: number, d2: number;
const M = 1_000_000;
const SDT = "0912345678", TEN = "Người Bán Cấy", DUONG = "Đường Cấy Thử";
const TS = (p: Partial<ThamSoDeal> = {}): ThamSoDeal => ({ location: null, project: null, type: null, kind: "sale", tab: "all", page: 1, size: 15, ...p });

async function qua<T>(fn: () => Promise<T>): Promise<T> {
  const goc = m.pool.query;
  m.pool.query = ((...a: unknown[]) => (c.query as (...x: unknown[]) => unknown)(...a)) as typeof m.pool.query;
  try { return await fn(); } finally { m.pool.query = goc; }
}
/** Bản đột biến của lib/deals đang được đo; null là bản thật. */
let dotBien: typeof m.deals | null = null;
const dl = () => dotBien ?? m.deals;
const doc = (t: ThamSoDeal, vai = true) => qua(() => dl().getDealsTrang(t, vai)).then((r) => r!);

/** Chép lib/deals.ts, thay đúng một đoạn, chạy `fn` trên bản chép: ca phải đỏ đúng thông điệp. */
async function phaiDo(tu: string, thanh: string, fn: () => Promise<void>, thongDiep: RegExp) {
  const goc = readFileSync(join(import.meta.dirname, "../src/lib/deals.ts"), "utf8");
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`);
  const lib = join(import.meta.dirname, "../src/lib");
  const nha = mkdtempSync(join(tmpdir(), "cg3-dot-bien-"));
  const tep = join(nha, "deals.ts");
  writeFileSync(tep, goc.replace(tu, thanh).replace(/from "\.\/([\w./-]+)"/g, (_m, ten: string) => `from "${pathToFileURL(join(lib, `${ten}.ts`)).href}"`));
  try {
    dotBien = await import(pathToFileURL(tep).href);
    await assert.rejects(fn, thongDiep);
  } finally {
    dotBien = null;
    rmSync(nha, { recursive: true, force: true });
  }
}
async function hetTrang(t: ThamSoDeal, vai = true) {
  const dau = await doc({ ...t, page: 1 }, vai);
  const trang = [dau];
  for (let p = 2; p <= Math.ceil(dau.trang.tong / t.size); p++) trang.push(await doc({ ...t, page: p }, vai));
  return { dau, trang, ma: trang.flatMap((x) => x.rows.map((d) => d.offerId)) };
}

/** Tập căn tính độc lập: mỗi căn lấy tin thấy sau cùng. */
async function tapDocLap(kind = "sale") {
  const { rows } = await c.query(
    `SELECT h.offer_id, h.cap, h.nut, h.hang_pct::float8 AS hang, h.duoi_trung_vi_pct::float8 AS duoi, coalesce(h.can_xac_minh, false) AS xm, o.area_id,
            a.parent_id, o.property_type, o.last_seen,
            coalesce((SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id), o.offer_id) AS can
       FROM offer_price_rank h JOIN sale_offers o ON o.offer_id = h.offer_id LEFT JOIN areas a ON a.id = o.area_id
      WHERE h.kind = $1 AND h.nhan IS NOT NULL AND h.duoi_trung_vi_pct BETWEEN 5 AND 50`, [kind]);
  const theoCan = new Map<string, (typeof rows)[number]>();
  for (const r of [...rows].sort((a, b) => +a.last_seen - +b.last_seen || (a.offer_id < b.offer_id ? 1 : -1))) theoCan.set(r.can, r);
  return [...theoCan.values()];
}
const thuTuDung = (a: { xm: boolean; cap: string; hang: number; duoi: number; offer_id: string }, b: typeof a) =>
  Number(a.xm) - Number(b.xm) || Number(b.cap === "du_an") - Number(a.cap === "du_an") || a.hang - b.hang || b.duoi - a.duoi || (a.offer_id < b.offer_id ? -1 : 1);

before(async () => {
  m = await nap();
  await m.fx.dungMau();
  c = await m.fx.dbCa();
  const A = m.fx.A;
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ('cg3-tinh2', NULL, 'market', 'Tỉnh hai', 'vn'), ('cg3-b1', 'cg3-tinh2', 'submarket', 'Phường B1', 'vn')`);
  d1 = await m.fx.duAn(c, { ten: "Khu Một" });
  d2 = await m.fx.duAn(c, { ten: "Khu Hai" });
  // Dự án trải hai phường, có căn cần xác minh và một căn ba tin nằm trong nhóm rẻ nhất.
  for (let i = 0; i < 90; i++) await m.fx.tin(c, { id: `a-${i}`, duAn: d1, phuong: A(i % 3 ? "a1" : "a2"), m2: 60, perm2: Math.round((40 + 0.2 * i) * M) });
  for (let i = 0; i < 3; i++) await m.fx.tin(c, { id: `a-xm-${i}`, duAn: d1, phuong: A("a1"), m2: 60, perm2: Math.round((29 + 0.5 * i) * M) });
  for (let i = 0; i < 3; i++) await m.fx.tin(c, { id: `a-can-${i}`, duAn: d1, phuong: A("a1"), m2: 60, perm2: Math.round((40.05 + 0.01 * i) * M) });
  await m.fx.can(c, ["a-can-0", "a-can-1", "a-can-2"]);
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `b-${i}`, duAn: d2, phuong: A("a3"), m2: 60, perm2: (50 + i) * M });
  // Cấp phường, nhà riêng, căn gắn thẳng tỉnh, tỉnh thứ hai.
  for (let i = 0; i < 40; i++) await m.fx.tin(c, { id: `p-${i}`, phuong: A("a4"), m2: 60, perm2: (40 + 0.5 * i) * M });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `n-${i}`, loai: "house", phuong: A("a4"), m2: 80, perm2: (60 + i) * M });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `t-${i}`, phuong: "cg10-tinh", m2: 60, perm2: (30 + i) * M });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `q-${i}`, phuong: "cg3-b1", m2: 60, perm2: (30 + i) * M });
  // Thuê: có m² và thiếu m² (thước giá tháng theo số phòng ngủ).
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `r-${i}`, kind: "rent_lt", duAn: d1, phuong: A("a1"), m2: 60, perm2: (200 + 10 * i) * 1000 });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `rt-${i}`, kind: "rent_lt", duAn: d2, phuong: A("a3"), pn: 2, gia: (10 + i) * M });
  await c.query(`UPDATE sale_offer_records SET seller_phone = $1, seller_name = $2, street_raw = $3`, [SDT, TEN, DUONG]);
  await m.xep(c, { log: () => {} });
});
after(async () => { await m.fx.donHet(); await m.pool.end().catch(() => {}); });

test("CG3-AC-1 thứ tự mặc định: căn thường cấp dự án, căn thường cấp phường, rồi căn cần xác minh", async () => {
  const tap = await tapDocLap();
  assert.ok(new Set(tap.map((r) => r.cap)).size === 2 && tap.some((r) => r.xm), "đối chứng: fixture phải đủ hai cấp và có căn cần xác minh");
  const ky = [...tap].sort(thuTuDung).map((r) => r.offer_id);
  const { ma } = await hetTrang(TS());
  assert.deepEqual(ma, ky, "CG3-AC-1 sai thứ tự danh sách");
  const sai = await c.query(m.deals.dealsNheSql().replace("(g.cap = 'du_an') DESC, ", ""), ["sale", 5, null]);
  assert.notDeepEqual(sai.rows.map((r) => r.offer_id), ky, "CG3-AC-1 đột biến bỏ ưu tiên cấp dự án phải lệch");
  const dao = await c.query(m.deals.dealsNheSql().replace("g.hang_pct ASC", "g.hang_pct DESC"), ["sale", 5, null]);
  assert.notDeepEqual(dao.rows.map((r) => r.offer_id), ky, "CG3-AC-1 đột biến đảo hạng phải lệch");
});

const dongMau = (o: Partial<DealHang>): DealHang => ({
  offerId: "x", source: "S03", priceVnd: 2e9, areaM2: 60, pricePerm2: 33.7e6, bedrooms: 2, phuong: "Phường Mẫu", areaPath: null, medianPerm2: 50e6, rulerN: 40,
  discountPct: 33.7, suspect: false, confidence: "high", firstSeen: "2026-11-01", lastSeen: "2026-11-02", nReposts: 1, sellerName: null, sellerPhone: null, groupName: null,
  brokerNAds: null, brokerMedianGap: null, propertyType: "apartment", block: null, floor: null, unit: null, streetNumber: null, street: null, district: null, images: [],
  postTextFull: null, roiDanhSach: null, ten: "Căn", thieu: [], cau: null, tel: null, sdt: null, xemAnh: false, ...o,
});
const hang = (o: object) => ({ n: 40, median: 50e6, p20: 40e6, pct: 3, below: 33.7, label: "gia-tot", needsVerification: false, bedroomsGroup: null, reason: null, metric: "gia-m2", level: "du_an", node: "1", nodeName: "Khu Mẫu", ...o });

test("CG3-AC-2 mỗi dòng ghi nhãn, nhóm so sánh, số căn, lý do lùi cấp, độ tin", () => {
  const ve = (o: object, d: Partial<DealHang> = {}) => renderToStaticMarkup(<DealHangNhom d={dongMau({ rank: hang(o), ...d })} />);
  const duAn = ve({});
  for (const chu of ["Giá tốt", "Khu Mẫu", "40 căn", "Độ tin: cao"]) assert.ok(duAn.includes(chu), `CG3-AC-2 dòng cấp dự án thiếu «${chu}»`);
  assert.ok(!duAn.includes("data-deal-ly-do"), "CG3-AC-2 đối chứng: không có lý do thì không in lý do");
  const phuong = ve({ label: "re-trong-phuong", level: "phuong", nodeName: null });
  for (const chu of ["Rẻ trong phường", "Phường Mẫu"]) assert.ok(phuong.includes(chu), `CG3-AC-2 dòng cấp phường thiếu «${chu}»`);
  assert.ok(ve({ reason: "pn-duoi-10" }).includes("Chưa đủ 10 căn cùng số phòng ngủ"), "CG3-AC-2 thiếu lý do lùi cấp");
  assert.ok(ve({}, { confidence: "medium" }).includes("Độ tin: trung bình"), "CG3-AC-2 sai độ tin");
  const thue = renderToStaticMarkup(<DiscountBar d={dongMau({ medianPerm2: null, rank: hang({ metric: "gia-thang-pn", median: 12e6 }) })} />);
  assert.ok(thue.includes("tr/tháng") && !thue.includes("tr/m²"), "CG3-AC-2 dòng thuê phải ghi tr/tháng");
  const thueM2 = renderToStaticMarkup(<DiscountBar d={dongMau({ medianPerm2: 250_000, rank: hang({ median: 250_000 }) })} donViCan />);
  assert.ok(thueM2.includes("250 nghìn/m²") && !thueM2.includes("0 tr/m²"), "CG3-AC-2 giá thuê dưới một triệu không được tròn về 0");
  assert.ok(thueM2.includes("40 căn") && !thueM2.includes("40 tin"), "CG3-AC-2 cùng một nhóm phải cùng đơn vị căn");
  assert.ok(ve({ reason: "pn-duoi-10" }).includes("trong dự án") && !ve({ reason: "pn-duoi-10" }).includes("trong phường"), "CG3-AC-2 dòng cấp dự án không được nói nhóm trong phường");
});

test("CG3-AC-3 số trên tab đếm trên toàn tập theo vai, Tất cả bằng tổng ba tab", async () => {
  for (const vai of [true, false]) {
    const { dau } = await hetTrang(TS(), vai);
    const { dem, tong } = dau.trang;
    assert.equal(dem.all, (await tapDocLap()).length, "CG3-AC-3 Tất cả lệch tập độc lập");
    assert.equal(dem.du + dem["xac-minh"] + dem.thieu, dem.all, "CG3-AC-3 ba tab không cộng đúng Tất cả");
    assert.equal(tong, dem.all, "CG3-AC-3 tổng của tab đang mở");
    assert.ok(dau.rows.length < dem.all, "CG3-AC-3 đối chứng: tập phải lớn hơn một trang, đếm trong trang sẽ lệch");
    for (const tab of ["du", "xac-minh", "thieu"] as const) {
      const { ma } = await hetTrang(TS({ tab }), vai);
      assert.equal(ma.length, dem[tab], `CG3-AC-3 tab ${tab} lệch số đếm`);
    }
  }
  assert.equal((await doc(TS())).trang.dem["xac-minh"], (await tapDocLap()).filter((r) => r.xm).length, "CG3-AC-3 Cần xác minh lệch tập độc lập");
});

test("CG3-AC-4 đi hết các trang theo từng tab, vai và lược đồ: không trùng, không sót", async () => {
  const kiem = async (vai: boolean) => {
    for (const tab of ["all", "du", "xac-minh", "thieu"] as TabTrang[]) {
      const { dau, trang, ma } = await hetTrang(TS({ tab }), vai);
      assert.equal(ma.length, dau.trang.dem[tab], `CG3-AC-4 tab ${tab}: hợp các trang lệch số trên tab`);
      assert.equal(new Set(ma).size, ma.length, `CG3-AC-4 tab ${tab}: có căn lặp giữa các trang`);
      trang.slice(0, -1).forEach((x) => assert.equal(x.rows.length, 15, `CG3-AC-4 tab ${tab}: trang giữa thiếu dòng`));
    }
  };
  await kiem(true);
  await kiem(false);
  await phaiDo(
    "const cua = chon.slice((page - 1) * thamSo.size, page * thamSo.size);",
    "const cua = trongViTri.slice((page - 1) * thamSo.size, page * thamSo.size).filter((r) => chon.includes(r));",
    () => kiem(true), /CG3-AC-4 tab (du|xac-minh|thieu): /);
  const nhieuTin = (await hetTrang(TS())).ma.filter((id) => id.startsWith("a-can-"));
  assert.equal(nhieuTin.length, 1, "CG3-AC-4 căn ba tin phải hiện đúng một dòng");
  // Lược đồ kiểu cloud: lỗi thiếu bảng làm hỏng giao dịch đang mở, nên đổi tên bảng thật trên DB riêng của ca rồi trả lại.
  await c.query("ALTER TABLE stg_zalo_posts RENAME TO stg_zalo_posts_tam");
  try {
    await kiem(true);
    assert.equal((await doc(TS())).mayThu, false, "CG3-AC-4 lược đồ cloud phải báo mayThu = false");
  } finally { await c.query("ALTER TABLE stg_zalo_posts_tam RENAME TO stg_zalo_posts"); }
  const tong = (await doc(TS())).trang.tong;
  assert.equal((await doc(TS({ page: 999 }))).trang.page, Math.ceil(tong / 15), "CG3-AC-4 trang vượt cuối phải về trang cuối");
  const MA_TRAN: [Record<string, string>, number, number][] = [[{ page: "0" }, 1, 15], [{ page: "-1" }, 1, 15], [{ page: "abc" }, 1, 15], [{ page: "2" }, 2, 15], [{ size: "7" }, 1, 15], [{ size: "abc" }, 1, 15], [{ size: "25" }, 1, 25]];
  for (const [sp, p, s] of MA_TRAN) { const t = docThamSoDeal(sp); assert.deepEqual([t.page, t.size], [p, s], `CG3-AC-4 tham số ${JSON.stringify(sp)}`); }
  assert.deepEqual([...CO_TRANG_DEAL], [15, 25, 50]);
  const cuoi = (await doc(TS({ page: 3 }))).rows[0].offerId;
  assert.equal((await qua(() => m.deals.getDeal(cuoi))).deal?.offerId, cuoi, "CG3-AC-4 căn ngoài trang đang xem phải mở được");
});

test("CG3-AC-5 chọn tỉnh, phường, dự án trên cây: đúng tập, đúng số trên mục, tổng các tỉnh bằng tổng tập", async () => {
  const tap = await tapDocLap();
  const dau = await doc(TS());
  const CA: [string, Partial<ThamSoDeal>, (r: (typeof tap)[number]) => boolean][] = [
    ["tỉnh có căn gắn thẳng", { location: "cg10-tinh" }, (r) => r.area_id === "cg10-tinh" || r.parent_id === "cg10-tinh"],
    ["tỉnh hai", { location: "cg3-tinh2" }, (r) => r.area_id === "cg3-tinh2" || r.parent_id === "cg3-tinh2"],
    ["phường", { location: "cg10-a4" }, (r) => r.area_id === "cg10-a4"],
    ["dự án trải hai phường", { project: String(d1) }, (r) => r.cap === "du_an" && r.nut === String(d1)],
    ["mã lạ", { location: "cg10-khong-co" }, () => false],
  ];
  const kiemCa = async () => {
    for (const [ten, t, loc] of CA) {
      const ky = tap.filter(loc).map((r) => r.offer_id).sort();
      assert.deepEqual([...(await hetTrang(TS(t))).ma].sort(), ky, `CG3-AC-5 ${ten}: sai tập căn`);
    }
  };
  await kiemCa();
  await phaiDo("r.area_id === location || r.parent_id === location", "r.area_id === location || r.parent_id === location || r.parent_id === null", kiemCa, /CG3-AC-5 .+: sai tập căn/);
  assert.ok(new Set(tap.filter((r) => r.nut === String(d1)).map((r) => r.area_id)).size >= 2, "đối chứng: dự án phải trải hai phường");
  assert.ok(!(await hetTrang(TS({ location: "cg10-a1" }))).ma.some((id) => id.startsWith("t-")), "CG3-AC-5 căn gắn thẳng tỉnh không thuộc phường");
  assert.equal(dau.trang.cay.reduce((s, t) => s + t.count, 0), dau.trang.dem.all, "CG3-AC-5 tổng các tỉnh lệch tổng tập");
  for (const t of dau.trang.cay) {
    const ts = TS({ location: t.value.split(":")[1] });
    assert.equal((await doc(ts)).trang.dem.all, t.count, `CG3-AC-5 số trên mục ${t.label}`);
    for (const n of t.children ?? []) for (const x of n.children ?? []) {
      const [loai, ma] = x.value.split(":");
      assert.equal((await doc(TS(loai === "area" ? { location: ma } : { project: ma }))).trang.dem.all, x.count, `CG3-AC-5 số trên mục ${x.label}`);
    }
  }
  const nha = await doc(TS({ type: "house" }));
  assert.equal(nha.trang.cay.reduce((s, t) => s + t.count, 0), nha.trang.dem.all, "CG3-AC-5 cây phải theo loại hình đang chọn");
  assert.equal(urlThamSoDeal(TS({ project: String(d1) })), `/ops/deals?project=${d1}`, "CG3-AC-5 đường dẫn dự án giữ nguyên");
});

test("CG3-AC-6 bán hay thuê kết hợp loại hình và vị trí; giá trị lạ bị bỏ qua", async () => {
  const banTap = await tapDocLap("sale"), thueTap = await tapDocLap("rent_lt");
  const kiemBan = async () => assert.deepEqual([...(await hetTrang(TS())).ma].sort(), banTap.map((r) => r.offer_id).sort(), "CG3-AC-6 mặc định phải là tin bán");
  await kiemBan();
  await phaiDo("WHERE h.kind = $1 AND h.nhan IS NOT NULL", "WHERE $1::text IS NOT NULL AND h.nhan IS NOT NULL", kiemBan, /CG3-AC-6 mặc định phải là tin bán/);
  assert.deepEqual([...(await hetTrang(TS({ kind: "rent" }))).ma].sort(), thueTap.map((r) => r.offer_id).sort(), "CG3-AC-6 Cho thuê sai tập");
  const nha = (await hetTrang(TS({ type: "house", location: "cg10-a4" }))).ma;
  assert.deepEqual([...nha].sort(), banTap.filter((r) => r.property_type === "house" && r.area_id === "cg10-a4").map((r) => r.offer_id).sort(), "CG3-AC-6 loại hình × vị trí sai tập");
  assert.ok(nha.length > 0, "đối chứng: phải có căn nhà riêng");
  const thang = (await hetTrang(TS({ kind: "rent", project: String(d2) }))).trang.flatMap((x) => x.rows);
  assert.ok(thang.length > 0 && thang.every((d) => d.rank?.metric === "gia-thang-pn"), "CG3-AC-6 tin thuê thiếu m² phải theo thước giá tháng");
  const sai = docThamSoDeal({ kind: "abc", type: "abc", tab: "abc", location: "DROP TABLE", project: "x1" });
  assert.deepEqual([sai.kind, sai.type, sai.tab, sai.location, sai.project], ["sale", null, "all", null, null], "CG3-AC-6 giá trị lạ phải bị bỏ qua");
});

const trangMau = (o: Omit<Partial<TrangDeal>, "thamSo"> & { thamSo?: Partial<ThamSoDeal> }): TrangDeal => ({ dem: { all: 0, du: 0, "xac-minh": 0, thieu: 0 }, tong: 0, page: 1, cay: [], ...o, thamSo: TS(o.thamSo) });
const veLuoi = (t: TrangDeal, rows: DealHang[] = [], xemNoiDung = true) =>
  renderToStaticMarkup(<DealsGrid rows={rows} xemNoiDung={xemNoiDung} mayThu trang={t} onDoi={() => {}} />);

test("CG3-AC-7 trạng thái trống có hành động, thanh lọc vẫn đứng", () => {
  const CA: [TrangDeal, string, string][] = [
    [trangMau({ dem: { all: 5, du: 0, "xac-minh": 5, thieu: 0 }, thamSo: { tab: "du" } }), "Mục này chưa có căn.", "Xem tất cả"],
    [trangMau({ thamSo: { location: "vn-hanoi" } }), "Không có căn nào khớp bộ lọc.", "Xoá bộ lọc"],
    [trangMau({}), "Chưa có căn nào trong danh sách.", "Xem chất lượng dữ liệu"],
  ];
  for (const [t, chu, nut] of CA) {
    const h = veLuoi(t);
    assert.ok(h.includes(chu) && h.includes(nut), `CG3-AC-7 thiếu «${chu}» hay nút «${nut}»`);
    assert.ok(h.includes("data-deals-bo-loc"), `CG3-AC-7 trạng thái «${chu}» mất thanh lọc`);
  }
  const co = veLuoi(trangMau({ dem: { all: 1, du: 1, "xac-minh": 0, thieu: 0 }, tong: 1 }), [dongMau({ rank: hang({}) as never })]);
  assert.ok(!co.includes("Mục này chưa có căn."), "CG3-AC-7 đối chứng: có dữ liệu thì không có chữ trống");
  const chan = veLuoi(trangMau({ dem: { all: 7385, du: 1, "xac-minh": 0, thieu: 7384 }, tong: 7385 }), [dongMau({ rank: hang({}) as never })]);
  assert.ok(chan.includes("1–15 / 7.385"), "CG3-AC-3 chân bảng phải ghi khoảng đang hiện trên tổng, có dấu chấm ngăn nghìn");
  const trang = readFileSync(join(import.meta.dirname, "../src/app/ops/deals/page.tsx"), "utf8");
  assert.ok(trang.includes(`<RegionError what="danh sách căn">`) && trang.includes("<Suspense fallback={<DealsSkeleton />}>"), "CG3-AC-7 thiếu khung lỗi hay khung tải");
});

test("CG3-AC-8 vai Người xem không nhận liên hệ, nội dung ở mọi trang và mọi điều kiện lọc", async () => {
  const quet = async (t: ThamSoDeal, vai: boolean) => {
    const kq = await doc(t, vai);
    return JSON.stringify(kq.rows.map((d) => dl().dealHang(dl().dealTheoVai(d, { lienHe: vai, noiDung: vai }), { xemNoiDung: vai, mayThu: kq.mayThu })));
  };
  const kiemXem = async () => {
    for (const t of [TS(), TS({ page: 2 }), TS({ project: String(d1) }), TS({ kind: "rent" })]) {
      const xem = await quet(t, false);
      for (const cay of [SDT, TEN, DUONG]) assert.ok(!xem.includes(cay), `CG3-AC-8 vai Người xem lộ «${cay}»`);
    }
  };
  await kiemXem();
  await phaiDo("const lienHe = vai.lienHe ? {} :", "const lienHe = vai ? {} :", kiemXem, /CG3-AC-8 vai Người xem lộ/);
  const vh = await quet(TS(), true);
  assert.ok(vh.includes(SDT.slice(-3)) && vh.includes(TEN), "CG3-AC-8 đối chứng: vai Vận hành phải có liên hệ");
  const id = (await doc(TS({ page: 3 }))).rows[0].offerId;
  const mot = (await qua(() => m.deals.getDeal(id))).deal!;
  const moXem = JSON.stringify(m.deals.dealHang(m.deals.dealTheoVai(mot, { lienHe: false, noiDung: false }), { xemNoiDung: false, mayThu: true }));
  for (const cay of [SDT, TEN, DUONG]) assert.ok(!moXem.includes(cay), `CG3-AC-8 mở căn ngoài trang lộ «${cay}»`);
  const t = trangMau({ dem: { all: 1, du: 1, "xac-minh": 0, thieu: 0 }, tong: 1 });
  assert.ok(!veLuoi(t, [dongMau({ rank: hang({}) as never })], false).includes("Gọi ai"), "CG3-AC-8 vai Người xem còn cột Gọi ai");
  assert.ok(veLuoi(t, [dongMau({ rank: hang({}) as never })], true).includes("Gọi ai"), "CG3-AC-8 đối chứng: vai Vận hành có cột Gọi ai");
  const nguon = readFileSync(join(import.meta.dirname, "../src/app/ops/deals/page.tsx"), "utf8");
  assert.ok(nguon.slice(nguon.indexOf("async function DealsTrangContent")).includes("Ảnh, chữ bài chỉ có ở máy thu"), "CG3-AC-8 danh sách theo trang thiếu lời báo cloud");
});

test("CG3-AC-9 bảng và đầu trang không còn chữ cũ, phần trăm dùng dấu phẩy, nguồn chỉ hiện mã", () => {
  const t = trangMau({ dem: { all: 1, du: 1, "xac-minh": 0, thieu: 0 }, tong: 1 });
  const h = veLuoi(t, [dongMau({ rank: hang({}) as never })]);
  assert.ok(h.includes("33,7") && !h.includes("33.7%"), "CG3-AC-9 phần trăm phải dùng dấu phẩy");
  assert.ok(!h.includes("thước phường"), "CG3-AC-9 bảng còn chữ «thước phường»");
  assert.throws(() => assert.ok(!`${h} thước phường`.includes("thước phường"), "chiều đỏ"), /chiều đỏ/);
  assert.ok(/S0\d/.test(h), "CG3-AC-9 cột nguồn phải hiện mã S0x");
  const trang = readFileSync(join(import.meta.dirname, "../src/app/ops/deals/page.tsx"), "utf8");
  assert.ok(!trang.includes("Tin nội bộ S03, S05 rẻ hơn thước S06 cùng phường"), "CG3-AC-9 còn câu mô tả cũ");
});
