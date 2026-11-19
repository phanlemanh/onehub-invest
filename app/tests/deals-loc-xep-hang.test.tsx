// deals-loc-xep-hang.test.tsx — hồ sơ can-gia-tot-loc-xep-hang (CG3). DB thử trắng dựng từ db/migrations của nhánh, hạng do chính bước
// chấm xepHangGia ghi; kỳ vọng tính độc lập bằng SQL viết riêng trong tệp này. Số là số bịa; không tên nguồn thật.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import { Suspense, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type pg from "pg";

import { DealBody } from "../src/components/ops/deal-body";
import { DealsSkeleton } from "../src/components/ops/deal-skeleton";
import { DealHangNhom, DiscountBar } from "../src/components/ops/deals-cells";
import { DealsGrid, DealsGridTrang } from "../src/components/ops/deals-grid";
import { LocalOnlyAlert } from "../src/components/ops/local-only-alert";
import { PageHeader } from "../src/components/page/page-header";
import { RegionError } from "../src/components/states/region-error";
import { fmtInt } from "../src/lib/format";
import { CO_TRANG_DEAL, docThamSoDeal, LOAI_LOC, type DealHang, type TabTrang, type ThamSoDeal, type TrangDeal, urlThamSoDeal } from "../src/lib/deals-chi-tiet";

const ngoai = (rel: string) => import(pathToFileURL(join(import.meta.dirname, rel)).href);
process.env.DATABASE_URL ??= "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg3_khong_dung";

const nap = async () => ({
  fx: await ngoai("../../pipeline/scripts/gia-tot-du-an-fixture.itest.mjs"),
  xep: (await ngoai("../../pipeline/xep-hang-gia.mjs")).xepHangGia as (c: pg.Client, o?: object) => Promise<unknown>,
  cotCloud: (await ngoai("../../pipeline/sync-cloud.mjs")).CLOUD_ALLOW.sale_offers as string[],
  deals: await import("../src/lib/deals"),
  pool: (await import("../src/lib/db")).pool,
});
let m: Awaited<ReturnType<typeof nap>>;
let c: pg.Client;
let d1: number, d2: number;
const M = 1_000_000;
const SDT = "+84912345678", TEN = "Người Bán Cấy", DUONG = "Đường Cấy Thử";
const NHOM = "Nhóm Cấy Thử", BAI = "Chữ bài cấy thử", TOA = "Toà Cấy Thử", TANG = "Tầng Cấy Thử", CAN = "Căn Cấy Thử", SO_NHA = "Số Nhà Cấy Thử", QUAN = "Quận Cấy Thử";
// Mã vị trí đúng khuôn URL thật (bước đọc URL từ chối mã khác), để mọi ca đi trọn vòng ghi đường dẫn rồi đọc lại.
const T1 = "vn-cg3-tinh1", T2 = "vn-cg3-tinh2", B1 = "vn-cg3-b1", P = (w: string) => `vn-cg3-${w}`;
/** Năm loại hình lọc được, viết tay; ghim bằng sổ từ vựng ở ca AC-6. */
const LOAI = ["apartment", "house", "land", "room", "commercial"];
/** Một chuỗi bất kỳ trong dữ liệu mang số đã cấy, ở mọi cách viết (+84…, 0… có dấu cách, tel:). */
const coSoCay = (x: unknown): boolean => typeof x === "string" ? x.replace(/\D/g, "").includes("912345678")
  : Array.isArray(x) ? x.some(coSoCay) : x !== null && typeof x === "object" ? Object.values(x).some(coSoCay) : false;
const TS = (p: Partial<ThamSoDeal> = {}): ThamSoDeal => ({ location: null, project: null, type: null, kind: "sale", tab: "all", page: 1, size: 15, ...p });

async function qua<T>(fn: () => Promise<T>): Promise<T> {
  const goc = m.pool.query;
  m.pool.query = ((...a: unknown[]) => (c.query as (...x: unknown[]) => unknown)(...a)) as typeof m.pool.query;
  try { return await fn(); } finally { m.pool.query = goc; }
}
/** Bản đột biến của lib/deals đang được đo; null là bản thật. Trang chép cũng đọc đúng bản này. */
let dotBien: typeof m.deals | null = null;
let dotBienUrl: string | null = null;
const dl = () => dotBien ?? m.deals;
const doc = (t: ThamSoDeal) => qua(() => dl().getDealsTrang(t)).then((r) => r!);

/** Chép lib/deals.ts, thay đúng một đoạn, chạy `fn` trên bản chép: ca phải đỏ đúng thông điệp. */
async function phaiDo(tu: string, thanh: string, fn: () => Promise<void>, thongDiep: RegExp) {
  const goc = readFileSync(join(import.meta.dirname, "../src/lib/deals.ts"), "utf8");
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`);
  const lib = join(import.meta.dirname, "../src/lib");
  const nha = mkdtempSync(join(tmpdir(), "cg3-dot-bien-"));
  const tep = join(nha, "deals.ts");
  writeFileSync(tep, goc.replace(tu, thanh).replace(/from "\.\/([\w./-]+)"/g, (_m, ten: string) => `from "${pathToFileURL(join(lib, `${ten}.ts`)).href}"`));
  try {
    dotBienUrl = pathToFileURL(tep).href;
    dotBien = await import(dotBienUrl);
    await assert.rejects(fn, thongDiep);
  } finally {
    dotBien = null;
    dotBienUrl = null;
    rmSync(nha, { recursive: true, force: true });
  }
}

// Đo đúng phần trang gửi xuống: chép trang thật, chỉ thay bước đọc phiên, gọi thẳng component máy chủ rồi đọc props của lưới.
const APP = join(import.meta.dirname, "..");
const CHEP = join(import.meta.dirname, `.ban-chep-cg3-${process.pid}`);
let nChep = 0;
type Thay = { sau?: string; tu: string; thanh: string };
type VaiTrang = "viewer" | "ops";
function apThay(goc: string, t?: Thay) {
  if (!t) return goc;
  const j = goc.indexOf(t.tu, t.sau ? goc.indexOf(t.sau) : 0);
  assert.ok(j >= 0 && (!t.sau || goc.includes(t.sau)), `đột biến không áp được: ${t.tu}`);
  return goc.slice(0, j) + t.thanh + goc.slice(j + t.tu.length);
}
async function napTrang(rel: string, thay?: Thay) {
  const dong = `import { getSessionUser } from "@/lib/auth";`;
  const goc = readFileSync(join(APP, rel), "utf8");
  assert.ok(goc.includes(dong), "bản chép không áp được bước đọc phiên");
  let ma = apThay(goc, thay).replace(dong, `const getSessionUser = async () => ({ id: 1, email: "ops@local.test", role: (globalThis as { __cg3Vai?: string }).__cg3Vai }) as never;`);
  if (dotBienUrl) ma = ma.replaceAll(`from "@/lib/deals"`, `from "${dotBienUrl}"`);
  mkdirSync(CHEP, { recursive: true });
  const f = join(CHEP, `trang-${++nChep}.tsx`);
  writeFileSync(f, `import React from "react";\n${ma}`);
  return import(pathToFileURL(f).href);
}
type PhanTu = ReactElement<Record<string, unknown>>;
function tim(n: ReactNode, khop: (e: PhanTu) => boolean): PhanTu | null {
  if (Array.isArray(n)) { for (const x of n) { const r = tim(x, khop); if (r) return r; } return null; }
  if (!isValidElement(n)) return null;
  const e = n as PhanTu;
  return khop(e) ? e : tim(e.props.children as ReactNode, khop);
}
/** Dựng /ops/deals theo vai: cây trang trả về, khung tải, nội dung máy chủ và props lưới nhận được. */
async function veTrang(sp: Record<string, string>, vai: VaiTrang, thay?: Thay) {
  const t = await napTrang("src/app/ops/deals/page.tsx", thay);
  (globalThis as { __cg3Vai?: string }).__cg3Vai = vai;
  return qua(async () => {
    const cay = await t.default({ searchParams: Promise.resolve(sp) }) as ReactNode;
    const khungTai = tim(cay, (e) => e.type === Suspense);
    assert.ok(khungTai, "trang không có khung tải");
    const nd = khungTai.props.children as PhanTu;
    const ra = await (nd.type as (p: unknown) => Promise<ReactNode>)(nd.props);
    const luoiTrang = tim(ra, (e) => e.type === DealsGridTrang);
    assert.ok(luoiTrang, "trang không dựng lưới theo trang");
    const props = luoiTrang.props as unknown as ComponentProps<typeof DealsGrid>;
    return { cay, khungTai, ra, props, rows: props.rows, trang: props.trang! };
  });
}
/** Dựng /ops/deals/[offerId] theo vai, trả đúng dòng trang đưa xuống phần thân. */
async function veMotCan(id: string, vai: VaiTrang, thay?: Thay) {
  const t = await napTrang("src/app/ops/deals/[offerId]/page.tsx", thay);
  (globalThis as { __cg3Vai?: string }).__cg3Vai = vai;
  return qua(async () => {
    const cay = await t.default({ params: Promise.resolve({ offerId: id }) }) as ReactNode;
    const nd = tim(cay, (e) => e.type === Suspense)!.props.children as PhanTu;
    const than = tim(await (nd.type as (p: unknown) => Promise<ReactNode>)(nd.props), (e) => e.type === DealBody);
    assert.ok(than, "trang một căn không dựng phần thân");
    return than.props.d as DealHang;
  });
}
/** Lược đồ kiểu cloud theo đúng pipeline/sync-cloud.mjs: không có bài gốc, không có bảng ảnh, tin chỉ còn các cột trong CLOUD_ALLOW. */
async function trenCloud<T>(fn: () => Promise<T>): Promise<T> {
  const { rows } = await c.query(`SELECT column_name AS cot FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_offers'`);
  const bo = rows.map((r) => r.cot as string).filter((x) => !m.cotCloud.includes(x));
  assert.ok(bo.includes("unit_number") && bo.includes("street_number"), "đối chứng: cloud không có số căn, số nhà");
  await c.query("ALTER TABLE stg_zalo_posts RENAME TO stg_zalo_posts_tam");
  await c.query("ALTER TABLE media RENAME TO media_tam");
  for (const x of bo) await c.query(`ALTER VIEW sale_offers RENAME COLUMN "${x}" TO "${x}_tam"`);
  try { return await fn(); } finally {
    for (const x of bo) await c.query(`ALTER VIEW sale_offers RENAME COLUMN "${x}_tam" TO "${x}"`);
    await c.query("ALTER TABLE media_tam RENAME TO media");
    await c.query("ALTER TABLE stg_zalo_posts_tam RENAME TO stg_zalo_posts");
  }
}

/** Bộ giao diện đang được đo; đột biến chép hai tệp, thay đúng một đoạn, ca phải đỏ đúng thông điệp. */
let luoi = { DealsGrid, DealHangNhom, DiscountBar };
async function phaiDoGiaoDien(tep: "deals-grid.tsx" | "deals-cells.tsx", thay: Thay, fn: () => Promise<void>, thongDiep: RegExp) {
  const nha = join(CHEP, `giao-dien-${++nChep}`);
  mkdirSync(nha, { recursive: true });
  for (const ten of ["deals-grid.tsx", "deals-cells.tsx"]) {
    const goc = readFileSync(join(APP, "src/components/ops", ten), "utf8");
    writeFileSync(join(nha, ten), `import React from "react";\n` + (ten === tep ? apThay(goc, thay) : goc).replace(/from "\.\/(deal-cho-ghep|deal-sheet)"/g, `from "@/components/ops/$1"`));
  }
  const goc = luoi;
  const [g, o] = await Promise.all([import(pathToFileURL(join(nha, "deals-grid.tsx")).href), import(pathToFileURL(join(nha, "deals-cells.tsx")).href)]);
  luoi = { DealsGrid: g.DealsGrid, DealHangNhom: o.DealHangNhom, DiscountBar: o.DiscountBar };
  try { await assert.rejects(fn, thongDiep); } finally { luoi = goc; }
}
/** Ô của một cột trên HTML dựng thật, theo vị trí tiêu đề cột. */
function oCot(html: string, cot: string) {
  const dom = new JSDOM(html).window.document;
  const i = [...dom.querySelectorAll("thead th")].findIndex((th) => th.textContent?.trim() === cot);
  assert.ok(i >= 0, `bảng thiếu cột «${cot}»`);
  return [...dom.querySelectorAll("tbody tr")].map((tr) => tr.children[i]);
}
const veTuTrang = (p: ComponentProps<typeof DealsGrid>) => renderToStaticMarkup(<luoi.DealsGrid {...p} onDoi={() => {}} />);
async function hetTrang(t: ThamSoDeal) {
  const dau = await doc({ ...t, page: 1 });
  const trang = [dau];
  for (let p = 2; p <= Math.ceil(dau.trang.tong / t.size); p++) trang.push(await doc({ ...t, page: p }));
  return { dau, trang, ma: trang.flatMap((x) => x.rows.map((d) => d.offerId)) };
}

/** Tập căn tính độc lập: lọc tin theo điều kiện trước, rồi mỗi căn lấy tin thấy sau cùng. */
type TinDocLap = { offer_id: string; cap: string; nut: string | null; area_id: string | null; parent_id: string | null; property_type: string | null; xm: boolean; hang: number; duoi: number };
async function tapDocLap(kind = "sale", loc: (r: TinDocLap) => boolean = () => true) {
  const { rows } = await c.query(
    `SELECT h.offer_id, h.cap, h.nut, h.hang_pct::float8 AS hang, h.duoi_trung_vi_pct::float8 AS duoi, coalesce(h.can_xac_minh, false) AS xm, o.area_id,
            a.parent_id, o.property_type, o.last_seen,
            coalesce((SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id), o.offer_id) AS can
       FROM offer_price_rank h JOIN sale_offers o ON o.offer_id = h.offer_id LEFT JOIN areas a ON a.id = o.area_id
      WHERE h.kind = $1 AND h.nhan IS NOT NULL AND h.duoi_trung_vi_pct BETWEEN 5 AND 50`, [kind]);
  const theoCan = new Map<string, (typeof rows)[number]>();
  for (const r of rows.filter(loc).sort((a, b) => +a.last_seen - +b.last_seen || (a.offer_id < b.offer_id ? 1 : -1))) theoCan.set(r.can, r);
  return [...theoCan.values()];
}
const thuTuDung = (a: { xm: boolean; cap: string; hang: number; duoi: number; offer_id: string }, b: typeof a) =>
  Number(a.xm) - Number(b.xm) || Number(b.cap === "du_an") - Number(a.cap === "du_an") || a.hang - b.hang || b.duoi - a.duoi || (a.offer_id < b.offer_id ? -1 : 1);

before(async () => {
  m = await nap();
  await m.fx.dungMau();
  c = await m.fx.dbCa();
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, NULL, 'market', 'Tỉnh một', 'vn'), ($2, NULL, 'market', 'Tỉnh hai', 'vn'), ($3, $2, 'submarket', 'Phường B1', 'vn')`, [T1, T2, B1]);
  for (const w of ["a1", "a2", "a3", "a4"]) await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, $2, 'submarket', $1, 'vn')`, [P(w), T1]);
  d1 = await m.fx.duAn(c, { ten: "Khu Một" });
  d2 = await m.fx.duAn(c, { ten: "Khu Hai" });
  // Dự án trải hai phường, có căn cần xác minh và một căn ba tin nằm trong nhóm rẻ nhất.
  for (let i = 0; i < 90; i++) await m.fx.tin(c, { id: `a-${i}`, duAn: d1, phuong: P(i % 3 ? "a1" : "a2"), m2: 60, perm2: Math.round((40 + 0.2 * i) * M) });
  for (let i = 0; i < 3; i++) await m.fx.tin(c, { id: `a-xm-${i}`, duAn: d1, phuong: P("a1"), m2: 60, perm2: Math.round((29 + 0.5 * i) * M) });
  for (let i = 0; i < 3; i++) await m.fx.tin(c, { id: `a-can-${i}`, duAn: d1, phuong: P("a1"), m2: 60, perm2: Math.round((40.05 + 0.01 * i) * M) });
  await m.fx.can(c, ["a-can-0", "a-can-1", "a-can-2"]);
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `b-${i}`, duAn: d2, phuong: P("a3"), m2: 60, perm2: (50 + i) * M });
  // Cấp phường, nhà riêng, căn gắn thẳng tỉnh, tỉnh thứ hai.
  for (let i = 0; i < 40; i++) await m.fx.tin(c, { id: `p-${i}`, phuong: P("a4"), m2: 60, perm2: (40 + 0.5 * i) * M });
  for (let i = 0; i < 3; i++) await m.fx.tin(c, { id: `p-xm-${i}`, phuong: P("a4"), m2: 60, perm2: Math.round((28 + 0.5 * i) * M) });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `n-${i}`, loai: "house", phuong: P("a4"), m2: 80, perm2: (60 + i) * M });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `t-${i}`, phuong: T1, m2: 60, perm2: (30 + i) * M });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `q-${i}`, phuong: B1, m2: 60, perm2: (30 + i) * M });
  // Một căn hai tin ở hai dự án, hai phường; tin thấy sau cùng thuộc dự án hai: chọn dự án một hay phường a1 vẫn phải thấy căn.
  await m.fx.tin(c, { id: "g-1", duAn: d1, phuong: P("a1"), m2: 60, perm2: 41.5 * M });
  await m.fx.tin(c, { id: "g-2", duAn: d2, phuong: P("a3"), m2: 60, perm2: 46 * M });
  await m.fx.can(c, ["g-1", "g-2"]);
  // Thuê: có m² và thiếu m² (thước giá tháng theo số phòng ngủ).
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `r-${i}`, kind: "rent_lt", duAn: d1, phuong: P("a1"), m2: 60, perm2: (200 + 10 * i) * 1000 });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `rt-${i}`, kind: "rent_lt", duAn: d2, phuong: P("a3"), pn: 2, gia: (10 + i) * M });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `rn-${i}`, kind: "rent_lt", loai: "house", phuong: P("a4"), m2: 80, perm2: (150 + 10 * i) * 1000 });
  // Ba loại hình còn lại của sổ từ vựng: đất bán, phòng thuê, mặt bằng bán.
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `l-${i}`, loai: "land", phuong: P("a2"), m2: 100, perm2: (20 + i) * M });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `ro-${i}`, kind: "rent_lt", loai: "room", phuong: P("a1"), m2: 20, perm2: (150 + 10 * i) * 1000 });
  for (let i = 0; i < 20; i++) await m.fx.tin(c, { id: `cm-${i}`, loai: "commercial", phuong: P("a3"), m2: 50, perm2: (70 + i) * M });
  await c.query(`UPDATE sale_offer_records SET seller_phone = $1, seller_name = $2, street_raw = $3, block_raw = $4, floor_raw = $5, unit_number = $6, street_number = $7, district_raw = $8`,
    [SDT, TEN, DUONG, TOA, TANG, CAN, SO_NHA, QUAN]);
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('cg3-snap', 'vn', 'cg3-thu', '{}'::jsonb) ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) SELECT p, 'cg3-snap', $1, $2 FROM sale_offer_records r CROSS JOIN LATERAL unnest(r.post_ids) p`, [BAI, NHOM]);
  await c.query(`INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_url, media_order)
    SELECT md5(offer_id), offer_id, 'S03', offer_id, 'https://anh.thu/' || offer_id, 1 FROM sale_offer_records`);
  await m.xep(c, { log: () => {} });
});
after(async () => { rmSync(CHEP, { recursive: true, force: true }); await m.fx.donHet(); await m.pool.end().catch(() => {}); });

test("CG3-AC-1 thứ tự mặc định: căn thường cấp dự án, căn thường cấp phường, rồi căn cần xác minh", async () => {
  const tap = await tapDocLap();
  assert.equal(new Set(tap.map((r) => `${r.cap}|${r.xm}`)).size, 4, "đối chứng: fixture phải đủ bốn nhóm: hai cấp, mỗi cấp có căn thường và căn cần xác minh");
  const ky = [...tap].sort(thuTuDung).map((r) => r.offer_id);
  const { ma } = await hetTrang(TS());
  assert.deepEqual(ma, ky, "CG3-AC-1 sai thứ tự danh sách");
  const sai = await c.query(m.deals.dealsNheSql().replace("(g.cap = 'du_an') DESC, ", ""), ["sale", 5, null, null, null]);
  assert.notDeepEqual(sai.rows.map((r) => r.offer_id), ky, "CG3-AC-1 đột biến bỏ ưu tiên cấp dự án phải lệch");
  const dao = await c.query(m.deals.dealsNheSql().replace("g.hang_pct ASC", "g.hang_pct DESC"), ["sale", 5, null, null, null]);
  assert.notDeepEqual(dao.rows.map((r) => r.offer_id), ky, "CG3-AC-1 đột biến đảo hạng phải lệch");
});

test("CG3-AC-1 tập căn chỉ gồm tin thấy trong 45 ngày, dưới trung vị từ 5% tới 50%", async () => {
  const [sat, san, tran, qua50, cu] = (await tapDocLap()).filter((r) => r.offer_id.startsWith("p-") && !r.xm).map((r) => r.offer_id);
  const truoc = (await doc(TS())).trang.dem.all;
  await c.query("BEGIN");
  try {
    await c.query("UPDATE offer_price_rank SET duoi_trung_vi_pct = 4.9 WHERE offer_id = $1", [sat]);
    await c.query("UPDATE offer_price_rank SET duoi_trung_vi_pct = 5 WHERE offer_id = $1", [san]);
    await c.query("UPDATE offer_price_rank SET duoi_trung_vi_pct = 50 WHERE offer_id = $1", [tran]);
    await c.query("UPDATE offer_price_rank SET duoi_trung_vi_pct = 50.1 WHERE offer_id = $1", [qua50]);
    await c.query("UPDATE sale_offer_records SET last_seen = now() - interval '46 days' WHERE offer_id = $1", [cu]);
    const kiem = async () => {
      const { trang } = await veTrang({}, "ops");
      assert.equal(trang.dem.all, truoc - 3, "CG3-AC-1 màn phải loại đúng ba căn ngoài ngưỡng");
      const ma = new Set((await hetTrang(TS())).ma);
      for (const id of [san, tran]) assert.ok(ma.has(id), `CG3-AC-1 căn đúng biên ${id} phải có mặt`);
      for (const id of [sat, qua50, cu]) assert.ok(!ma.has(id), `CG3-AC-1 căn ngoài ngưỡng ${id} không được có mặt`);
    };
    await kiem();
    await phaiDo("AND o.last_seen >= now() - interval '${NGAY_TOI_DA} days'\n         AND h.duoi_trung_vi_pct >= $2", "AND h.duoi_trung_vi_pct >= $2", kiem, /CG3-AC-1 màn phải loại đúng ba căn/);
    await phaiDo("AND h.duoi_trung_vi_pct >= $2\n         AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = $3)", "AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = $3 OR $2::numeric IS NULL)", kiem, /CG3-AC-1 màn phải loại đúng ba căn/);
    const t = await veTrang({}, "ops", { tu: "getDeals(undefined, NGUONG_VAO_PCT, { thamSo })", thanh: "getDeals(undefined, 0, { thamSo })" });
    assert.equal(t.trang.dem.all, truoc - 2, "đối chứng: trang truyền ngưỡng 0 thì căn dưới sàn hiện lại");
  } finally { await c.query("ROLLBACK"); }
});

const dongMau = (o: Partial<DealHang>): DealHang => ({
  offerId: "x", source: "S03", priceVnd: 2e9, areaM2: 60, pricePerm2: 33.7e6, bedrooms: 2, phuong: "Phường Mẫu", areaPath: null, medianPerm2: 50e6, rulerN: 40,
  discountPct: 33.7, suspect: false, confidence: "high", firstSeen: "2026-11-01", lastSeen: "2026-11-02", nReposts: 1, sellerName: null, sellerPhone: null, groupName: null,
  brokerNAds: null, brokerMedianGap: null, propertyType: "apartment", block: null, floor: null, unit: null, streetNumber: null, street: null, district: null, images: [],
  postTextFull: null, roiDanhSach: null, ten: "Căn", thieu: [], cau: null, tel: null, sdt: null, xemAnh: false, ...o,
});
const hang = (o: object) => ({ n: 40, median: 50e6, p20: 40e6, pct: 3, below: 33.7, label: "gia-tot", needsVerification: false, bedroomsGroup: null, reason: null, metric: "gia-m2", level: "du_an", node: "1", nodeName: "Khu Mẫu", ...o });

test("CG3-AC-2 dòng đọc từ DB hiện đúng nhãn, nhóm, số căn, lý do lùi cấp, độ tin trên ô của bảng", async () => {
  const NHAN: Record<string, string> = { "gia-tot": "Giá tốt", "re-trong-phuong": "Rẻ trong phường" };
  const DO_TIN: Record<string, string> = { high: "cao", medium: "trung bình", low: "thấp" };
  const LY_DO: Record<string, string> = { du_an: "Chưa đủ 10 căn cùng số phòng ngủ — so với cả nhóm cùng loại trong dự án", phuong: "Chưa đủ 10 căn cùng số phòng ngủ — so với cả nhóm cùng loại trong phường" };
  const p = (await doc(TS())).rows[0].offerId, q = (await doc(TS({ location: P("a4") }))).rows[0].offerId;
  await c.query("BEGIN");
  try {
    await c.query("UPDATE offer_price_rank SET ly_do = 'pn-duoi-10' WHERE offer_id = ANY($1)", [[p, q]]);
    await c.query("UPDATE sale_offer_records SET confidence = 'low' WHERE offer_id = $1", [p]);
    await c.query("UPDATE sale_offer_records SET confidence = 'medium' WHERE offer_id = $1", [q]);
    const { rows } = await c.query(`SELECT h.offer_id, h.nhan, h.n, h.ly_do, h.cap, h.thuoc, h.trung_vi::float8 AS trung_vi, h.duoi_trung_vi_pct::float8 AS duoi, pn.name AS du_an, a.name AS phuong, o.confidence
      FROM offer_price_rank h JOIN sale_offers o ON o.offer_id = h.offer_id LEFT JOIN areas a ON a.id = o.area_id LEFT JOIN asset_nodes pn ON h.cap = 'du_an' AND pn.id::text = h.nut`);
    const ky = new Map(rows.map((r) => [r.offer_id as string, r]));
    const kiem = async () => {
      const gap = new Set<string>();
      for (const sp of [{}, { location: P("a4") }, { kind: "rent" }, { kind: "rent", project: String(d2) }] as Record<string, string>[]) {
        const { props, rows: dong } = await veTrang(sp, "ops");
        const html = veTuTrang(props), oHang = oCot(html, "Hạng giá"), oGiam = oCot(html, "Giảm so thước");
        dong.forEach((d, i) => {
          const r = ky.get(d.offerId)!;
          const nhom = r.cap === "du_an" ? r.du_an : r.phuong;
          const lyDo = r.ly_do === "pn-duoi-10" ? LY_DO[r.cap] : "";
          assert.equal(oHang[i].textContent, `${NHAN[r.nhan]}${nhom}· ${r.n} căn${lyDo}Độ tin: ${DO_TIN[r.confidence]}`, `CG3-AC-2 ô Hạng giá của ${d.offerId} sai`);
          const giam = Number(/^−(\d+(?:,\d+)?)%/.exec(oGiam[i].textContent ?? "")?.[1].replace(",", "."));
          assert.ok(Math.abs(giam - r.duoi) <= 0.05, `CG3-AC-2 mức giảm của ${d.offerId} phải là mức dưới trung vị`);
          if (r.thuoc === "gia-thang-pn") assert.ok(!(oHang[i].parentElement?.textContent ?? "").includes("/m²"), `CG3-AC-2 dòng thuê theo tháng ${d.offerId} không được ghi giá theo m²`);
          if (r.thuoc === "gia-thang-pn") assert.ok(oGiam[i].textContent?.includes(`Trung vị ${fmtInt(r.trung_vi / 1e6)} tr/tháng · ${r.n} căn`), `CG3-AC-2 trung vị giá tháng của ${d.offerId} sai`);
          gap.add(`${r.cap}|${r.thuoc}|${r.ly_do ?? ""}|${r.confidence}`);
        });
      }
      for (const o of ["du_an|gia-m2|pn-duoi-10|low", "phuong|gia-m2|pn-duoi-10|medium"]) assert.ok(gap.has(o), `đối chứng: bảng đo phải có dòng ${o}`);
      assert.ok([...gap].some((x) => x.includes("gia-thang-pn")), "đối chứng: bảng đo phải có dòng thuê theo giá tháng");
    };
    await kiem();
    await phaiDo("nodeName: (r.rank_node_name as string | null) ?? null,", "nodeName: null,", kiem, /CG3-AC-2 ô Hạng giá/);
    await phaiDo("reason: (r.rank_reason as string | null) ?? null,", "reason: null,", kiem, /CG3-AC-2 ô Hạng giá/);
    await phaiDo("confidence: r.confidence as string,", `confidence: "high",`, kiem, /CG3-AC-2 ô Hạng giá/);
    await phaiDo("h.nhan AS rank_label", "CASE h.nhan WHEN 'gia-tot' THEN 're-trong-phuong' ELSE 'gia-tot' END AS rank_label", kiem, /CG3-AC-2 ô Hạng giá/);
    await phaiDoGiaoDien("deals-cells.tsx", { tu: "d.rank.median / 1e6", thanh: "d.rank.median / 1e5" }, kiem, /CG3-AC-2 trung vị giá tháng/);
  } finally { await c.query("ROLLBACK"); }
});

test("CG3-AC-2 mỗi dòng ghi nhãn, nhóm so sánh, số căn, lý do lùi cấp, độ tin", async () => {
  const ve = (o: object, d: Partial<DealHang> = {}) => renderToStaticMarkup(<luoi.DealHangNhom d={dongMau({ rank: hang(o), ...d })} />);
  const chu = (h: string) => new JSDOM(h).window.document.body.textContent;
  const kiemLyDo = async () => {
    assert.equal(chu(ve({})), "Giá tốtKhu Mẫu· 40 cănĐộ tin: cao", "CG3-AC-2 dòng không có lý do lùi cấp phải đúng bốn mục, không thêm chữ lý do");
    const lyDo = new JSDOM(ve({ reason: "pn-duoi-10" })).window.document.querySelector('[data-deal-ly-do="pn-duoi-10"]');
    assert.match(lyDo?.textContent ?? "", /Chưa đủ 10 căn cùng số phòng ngủ/, "CG3-AC-2 thiếu lý do lùi cấp");
  };
  await kiemLyDo();
  await phaiDoGiaoDien("deals-cells.tsx", {
    tu: `{lyDo && <span className="text-muted-foreground max-w-full truncate text-xs" title={lyDo} data-deal-ly-do={r.reason}>{lyDo}</span>}`,
    thanh: `<span className="text-muted-foreground max-w-full truncate text-xs">{lyDo ?? "Chưa chấm được hạng giá"}</span>`,
  }, kiemLyDo, /CG3-AC-2 dòng không có lý do lùi cấp/);
  const duAn = ve({});
  for (const c of ["Giá tốt", "Khu Mẫu", "40 căn", "Độ tin: cao"]) assert.ok(duAn.includes(c), `CG3-AC-2 dòng cấp dự án thiếu «${c}»`);
  const phuong = ve({ label: "re-trong-phuong", level: "phuong", nodeName: null });
  for (const c of ["Rẻ trong phường", "Phường Mẫu"]) assert.ok(phuong.includes(c), `CG3-AC-2 dòng cấp phường thiếu «${c}»`);
  assert.ok(ve({}, { confidence: "medium" }).includes("Độ tin: trung bình"), "CG3-AC-2 sai độ tin");
  const thue = renderToStaticMarkup(<DiscountBar d={dongMau({ medianPerm2: null, rank: hang({ metric: "gia-thang-pn", median: 12e6 }) })} />);
  assert.ok(thue.includes("tr/tháng") && !thue.includes("tr/m²"), "CG3-AC-2 dòng thuê phải ghi tr/tháng");
  const xm = veLuoi(trangMau({ dem: { all: 1, du: 0, "xac-minh": 1, thieu: 0 }, tong: 1, tabDong: { x: "xac-minh" } }), [dongMau({ suspect: true, rank: hang({ needsVerification: true }) as never })]);
  const thanXm = xm.slice(xm.indexOf("<tbody"));
  assert.ok(thanXm.includes("Giá tốt") && thanXm.includes("Cần xác minh"), "CG3-AC-2 dòng cần xác minh phải ghi cả nhãn hạng và tình trạng");
  const thueM2 = renderToStaticMarkup(<DiscountBar d={dongMau({ medianPerm2: 250_000, rank: hang({ median: 250_000 }) })} donViCan />);
  assert.ok(thueM2.includes("250 nghìn/m²") && !thueM2.includes("0 tr/m²"), "CG3-AC-2 giá thuê dưới một triệu không được tròn về 0");
  assert.ok(thueM2.includes("40 căn") && !thueM2.includes("40 tin"), "CG3-AC-2 cùng một nhóm phải cùng đơn vị căn");
  assert.ok(ve({ reason: "pn-duoi-10" }).includes("trong dự án") && !ve({ reason: "pn-duoi-10" }).includes("trong phường"), "CG3-AC-2 dòng cấp dự án không được nói nhóm trong phường");
});

/** Tab của từng căn tính độc lập từ cột thô, viết lại luật đầy đủ: thiếu một trong bảy mục thì vào «Còn thiếu». */
async function tabDocLap(cloud = false, kind = "sale") {
  // Cloud không giữ ảnh, chữ bài: căn không bị tính là thiếu hai mục đó.
  const { rows } = await c.query(
    `SELECT o.offer_id, coalesce(h.can_xac_minh, false) AS xm, h.thuoc, h.trung_vi, o.property_type, o.area_m2, o.block_raw, o.street_raw, o.seller_phone,
            ${cloud ? "true" : "EXISTS (SELECT 1 FROM media a WHERE a.resource_record_key = o.offer_id AND (a.local_file IS NOT NULL OR a.media_url IS NOT NULL))"} AS anh,
            ${cloud ? "true" : "EXISTS (SELECT 1 FROM stg_zalo_posts z WHERE z.post_id = ANY(o.post_ids) AND z.text IS NOT NULL)"} AS chu
       FROM offer_price_rank h JOIN sale_offers o ON o.offer_id = h.offer_id WHERE h.kind = $1`, [kind]);
  const theoMa = new Map(rows.map((r) => [r.offer_id as string, r]));
  const tab = (r: (typeof rows)[number]) => {
    if (r.xm) return "xac-minh" as const;
    const duBay = LOAI.includes(r.property_type) && r.area_m2 && (r.block_raw || r.street_raw) && r.trung_vi !== null && r.anh && r.chu && r.seller_phone;
    return duBay ? "du" as const : "thieu" as const;
  };
  const ma = (await tapDocLap(kind)).map((r) => r.offer_id);
  const theoTab = { du: [] as string[], "xac-minh": [] as string[], thieu: [] as string[] };
  for (const id of ma) theoTab[tab(theoMa.get(id)!)].push(id);
  return theoTab;
}

test("CG3-AC-3 số trên tab đếm trên toàn tập, như nhau ở mọi vai, Tất cả bằng tổng ba tab", async () => {
  // Bán và thuê, mỗi loại tin một tập: số từng tab tính độc lập bằng luật đầy đủ.
  const kiemSo = async (cloud = false) => {
    for (const [kind, kindDb] of [["sale", "sale"], ["rent", "rent_lt"]] as const) {
      const ky = await tabDocLap(cloud, kindDb);
      const { dau } = await hetTrang(TS({ kind }));
      const { dem, tong } = dau.trang;
      assert.equal(dem.all, (await tapDocLap(kindDb)).length, `CG3-AC-3 Tất cả lệch tập độc lập (${kind})`);
      for (const tab of ["du", "xac-minh", "thieu"] as const) {
        assert.equal(dem[tab], ky[tab].length, `CG3-AC-3 tab ${tab} lệch số tính độc lập (${kind})`);
        const { ma, trang } = await hetTrang(TS({ kind, tab }));
        assert.deepEqual([...ma].sort(), [...ky[tab]].sort(), `CG3-AC-3 tab ${tab} sai tập căn (${kind})`);
        assert.ok(trang.every((x) => x.rows.every((d) => x.trang.tabDong[d.offerId] === tab)), `CG3-AC-3 dòng của tab ${tab} mang tab khác (${kind})`);
      }
      assert.equal(dem.du + dem["xac-minh"] + dem.thieu, dem.all, `CG3-AC-3 ba tab không cộng đúng Tất cả (${kind})`);
      assert.equal(tong, dem.all, `CG3-AC-3 tổng của tab đang mở (${kind})`);
      assert.ok(dau.rows.length < dem.all, `CG3-AC-3 đối chứng: tập phải lớn hơn một trang, đếm trong trang sẽ lệch (${kind})`);
      if (kind === "sale") assert.ok(dem.du > 10 && dem["xac-minh"] > 0 && (cloud || dem.thieu > 0), "CG3-AC-3 đối chứng: fixture phải có căn ở các tab");
      else assert.ok(dem.du > 0 && (cloud || dem.thieu > 0), "CG3-AC-3 đối chứng: tin thuê phải có căn đủ và căn thiếu");
    }
  };
  await kiemSo();
  await trenCloud(async () => {
    await kiemSo(true);
    await phaiDo("}, { xemNoiDung: true, mayThu }),", "}, { xemNoiDung: true, mayThu: true }),", () => kiemSo(true), /CG3-AC-3 tab (du|thieu) lệch số/);
  });
  await phaiDo("for (const { tab } of theoTab) dem[tab] += 1;", "for (const { tab } of theoTab.slice(0, thamSo.size)) dem[tab] += 1;", () => kiemSo(), /CG3-AC-3 tab (du|xac-minh|thieu) lệch số/);
  await phaiDo("for (const { tab } of theoTab) dem[tab] += 1;", `for (const { tab } of theoTab) dem[tab === "thieu" ? "du" : tab] += 1;`, () => kiemSo(), /CG3-AC-3 tab du lệch số/);
  await phaiDo("for (const { tab } of theoTab) dem[tab] += 1;", `for (const { tab } of theoTab) dem[tab === "du" ? "thieu" : tab] += 1;`, () => kiemSo(), /CG3-AC-3 tab du lệch số/);
  await phaiDo("}, { xemNoiDung: true, mayThu }),", "}, { xemNoiDung: false, mayThu }),", () => kiemSo(), /CG3-AC-3 tab (du|thieu) lệch số/);
  await phaiDo(`medianPerm2: r.thuoc === "gia-m2" && r.trung_vi !== null ? Number(r.trung_vi) : null,`, `medianPerm2: r.thuoc === "gia-m2" && Number(r.trung_vi) >= 1e6 ? Number(r.trung_vi) : null,`, () => kiemSo(), /CG3-AC-3 tab (du|thieu) lệch số tính độc lập \(rent\)/);

  // Bảy căn đang đủ, mỗi căn mất đúng một mục của luật đầy đủ: số viết tay là dời đúng bảy căn từ «Đủ để gọi» sang «Còn thiếu».
  const truoc = (await doc(TS())).trang.dem;
  const [a, b, d, e, f, g, h, coDuong, anhMay, coToa] = (await tabDocLap()).du.filter((id) => !id.startsWith("a-can-") && !id.startsWith("g-"));
  await c.query("BEGIN");
  try {
    await c.query("UPDATE sale_offer_records SET property_type = 'unknown' WHERE offer_id = $1", [a]);
    await c.query("UPDATE sale_offer_records SET area_m2 = NULL WHERE offer_id = $1", [b]);
    await c.query("UPDATE sale_offer_records SET block_raw = NULL, street_raw = NULL WHERE offer_id = $1", [d]);
    await c.query("UPDATE offer_price_rank SET trung_vi = NULL WHERE offer_id = $1", [e]);
    await c.query("DELETE FROM media WHERE resource_record_key = $1", [f]);
    await c.query("DELETE FROM stg_zalo_posts WHERE post_id IN (SELECT unnest(post_ids) FROM sale_offer_records WHERE offer_id = $1)", [g]);
    await c.query("UPDATE sale_offer_records SET seller_phone = NULL WHERE offer_id = $1", [h]);
    // Hai căn vẫn đủ: chỉ có đường, không có toà; ảnh chỉ nằm trên máy thu.
    await c.query("UPDATE sale_offer_records SET block_raw = NULL WHERE offer_id = $1", [coDuong]);
    await c.query("UPDATE sale_offer_records SET street_raw = NULL WHERE offer_id = $1", [coToa]);
    await c.query("UPDATE media SET media_url = NULL, local_file = 'cg3-snap/media/cg3.jpg' WHERE resource_record_key = $1", [anhMay]);
    const sau = (await doc(TS())).trang.dem;
    assert.deepEqual(sau, { all: truoc.all, du: truoc.du - 7, "xac-minh": truoc["xac-minh"], thieu: truoc.thieu + 7 }, "CG3-AC-3 bảy căn mất một mục phải dời đúng sang Còn thiếu");
    const conThieu = new Set((await hetTrang(TS({ tab: "thieu" }))).ma);
    for (const id of [a, b, d, e, f, g, h]) assert.ok(conThieu.has(id), `CG3-AC-3 căn ${id} mất một mục phải ở Còn thiếu`);
    const kiemVanDu = async () => {
      const du = new Set((await hetTrang(TS({ tab: "du" }))).ma);
      assert.ok(du.has(coDuong), "CG3-AC-3 căn có đường, không có toà vẫn đủ");
      assert.ok(du.has(coToa), "CG3-AC-3 căn có toà, không có đường vẫn đủ");
      assert.ok(du.has(anhMay), "CG3-AC-3 căn có ảnh trên máy thu vẫn đủ");
    };
    await kiemVanDu();
    await phaiDo("street: (r.street_raw as string | null) ?? null,\n      medianPerm2: r.thuoc", "street: null,\n      medianPerm2: r.thuoc", kiemVanDu, /CG3-AC-3 căn có đường/);
    await phaiDo("block: (r.block_raw as string | null) ?? null,\n      street: (r.street_raw", "block: null,\n      street: (r.street_raw", kiemVanDu, /CG3-AC-3 căn có toà/);
    await phaiDo("AND (m.local_file IS NOT NULL OR m.media_url IS NOT NULL))`;\n  const coChu", "AND (m.media_url IS NOT NULL))`;\n  const coChu", kiemVanDu, /CG3-AC-3 căn có ảnh trên máy thu/);

    // Vai Người xem: dòng trang gửi xuống mang đúng tab, ô Tình trạng trên bảng dựng thật ghi đúng tab đó.
    const CHU: Record<"du" | "xac-minh" | "thieu", RegExp> = { du: /^Đủ để gọi$/, "xac-minh": /^Cần xác minh$/, thieu: /^(Còn thiếu|Thiếu \d+)$/ };
    const kiemO = async () => {
      let conThieuTrong = 0;
      for (const tab of ["du", "xac-minh", "thieu"] as const) {
        const so = Math.ceil(sau[tab] / 15);
        const ma: string[] = [];
        for (let page = 1; page <= so; page++) {
          const { props, rows, trang } = await veTrang({ tab, page: String(page) }, "viewer");
          ma.push(...rows.map((r) => r.offerId));
          const o = oCot(veTuTrang(props), "Tình trạng").map((n) => n.textContent?.trim() ?? "");
          assert.equal(o.length, rows.length, `CG3-AC-3 tab ${tab}: số ô Tình trạng lệch số dòng`);
          o.forEach((chu, i) => {
            assert.equal(trang.tabDong[rows[i].offerId], tab, `CG3-AC-3 vai Người xem tab ${tab}: dòng ${rows[i].offerId} mang tab khác`);
            assert.match(chu, CHU[tab], `CG3-AC-3 vai Người xem tab ${tab}: ô Tình trạng ghi sai`);
            if (chu === "Còn thiếu") conThieuTrong += 1;
          });
        }
        assert.deepEqual(ma.sort(), (await hetTrang(TS({ tab }))).ma.sort(), `CG3-AC-3 vai Người xem tab ${tab}: lệch tập của luật đầy đủ`);
      }
      assert.ok(conThieuTrong > 0, "CG3-AC-3 đối chứng: phải có căn vai Người xem không thấy mục thiếu mà vẫn ở Còn thiếu");
    };
    await kiemO();
    await phaiDoGiaoDien("deals-grid.tsx", { tu: `: "Còn thiếu"}</Badge>`, thanh: `: "Sai tab"}</Badge>` }, kiemO, /CG3-AC-3 vai Người xem tab thieu: ô Tình trạng ghi sai/);
  } finally { await c.query("ROLLBACK"); }
});

test("CG3-AC-4 đi hết các trang theo từng tab, vai và lược đồ: không trùng, không sót", async () => {
  const VAI: [string, VaiTrang][] = [["Người xem", "viewer"], ["Vận hành", "ops"]];
  const kiem = async () => {
    const tatCa = (await hetTrang(TS())).ma;
    assert.deepEqual(tatCa, (await tapDocLap()).sort(thuTuDung).map((r) => r.offer_id), "CG3-AC-4 hợp các trang lệch thứ tự AC-1");
    for (const tab of ["all", "du", "xac-minh", "thieu"] as TabTrang[]) {
      const { dau, trang, ma } = await hetTrang(TS({ tab }));
      assert.equal(ma.length, dau.trang.dem[tab], `CG3-AC-4 tab ${tab}: hợp các trang lệch số trên tab`);
      assert.equal(new Set(ma).size, ma.length, `CG3-AC-4 tab ${tab}: có căn lặp giữa các trang`);
      trang.slice(0, -1).forEach((x) => assert.equal(x.rows.length, 15, `CG3-AC-4 tab ${tab}: trang giữa thiếu dòng`));
      const trongTab = new Set(ma);
      assert.deepEqual(ma, tatCa.filter((id) => trongTab.has(id)), `CG3-AC-4 tab ${tab}: thứ tự lệch AC-1`);
      // Mỗi vai đi hết các trang bằng đúng phần trang gửi xuống: cùng căn, cùng số của hạng, cùng tab.
      for (const [ten, vai] of VAI) for (const [i, x] of trang.entries()) {
        const gui = await veTrang({ tab, page: String(i + 1) }, vai);
        assert.deepEqual(gui.rows.map((d) => d.offerId), x.rows.map((d) => d.offerId), `CG3-AC-4 tab ${tab} vai ${ten}: trang ${i + 1} lệch căn`);
        gui.rows.forEach((h, j) => {
          const d = x.rows[j];
          assert.ok(d.rank?.label, `CG3-AC-4 tab ${tab}: dòng đọc lên không có nhãn hạng`);
          assert.deepEqual([h.rank, h.discountPct, h.priceVnd, h.source], [d.rank, d.discountPct, d.priceVnd, d.source], `CG3-AC-4 tab ${tab} vai ${ten}: dòng mất số của hạng`);
          assert.equal(gui.trang.tabDong[h.offerId], tab === "all" ? x.trang.tabDong[d.offerId] : tab, `CG3-AC-4 tab ${tab} vai ${ten}: dòng mang tab khác`);
        });
      }
    }
  };
  // Mỗi tab có một căn hai tin nằm đúng biên trang 1 và trang 2: gộp phải xảy ra trước khi cắt trang, ở mọi tab, vai, lược đồ.
  const daDung = new Set<string>();
  const bien: { tab: TabTrang; ids: string[]; can: number }[] = [];
  const goc = new Map<TabTrang, string[]>();
  // Danh sách từng tab tính độc lập (thứ tự AC-1, tab theo luật đầy đủ), để sản phẩm hỏng không làm hỏng bước dựng căn biên.
  const thuTuDoc = (await tapDocLap()).sort(thuTuDung).map((r) => r.offer_id), kyTab = await tabDocLap();
  goc.set("all", thuTuDoc);
  for (const tab of ["du", "xac-minh", "thieu"] as const) goc.set(tab, thuTuDoc.filter((id) => kyTab[tab].includes(id)));
  for (const tab of ["all", "du", "xac-minh", "thieu"] as TabTrang[]) {
    const ds = goc.get(tab)!;
    if (ds.length < 17) continue;
    let k = 14;
    while (k + 1 < ds.length && [ds[k], ds[k + 1]].some((id) => daDung.has(id) || id.startsWith("a-can-") || id.startsWith("g-"))) k += 1;
    if (k + 1 >= ds.length || k > 28) continue;
    const ids = [ds[k], ds[k + 1]];
    ids.forEach((id) => daDung.add(id));
    bien.push({ tab, ids, can: await m.fx.can(c, ids) });
  }
  assert.deepEqual(bien.map((x) => x.tab).sort(), ["all", "du", "thieu"], "đối chứng: phải dựng được căn biên trang ở các tab có hơn một trang");
  try {
    // Tập từng tab tính độc lập theo đúng lược đồ đang đo; căn biên trang hiện đúng một lần ở tab của nó.
    const kiemBien = async (cloud = false) => {
      const ky = { all: (await tapDocLap()).map((r) => r.offer_id), ...(await tabDocLap(cloud)) };
      for (const tab of ["all", "du", "xac-minh", "thieu"] as TabTrang[]) {
        const sau = (await hetTrang(TS({ tab }))).ma;
        assert.deepEqual([...sau].sort(), [...ky[tab]].sort(), `CG3-AC-4 tab ${tab}: căn hai tin ở biên trang phải gộp một dòng`);
        for (const { ids } of bien) assert.ok(sau.filter((id) => ids.includes(id)).length === (tab === "all" ? 1 : ids.some((id) => ky[tab].includes(id)) ? 1 : 0), `CG3-AC-4 tab ${tab}: căn hai tin ở biên trang phải hiện đúng một lần`);
      }
    };
    await kiem();
    await kiemBien();
    // Cỡ 25 và 50: đi hết các trang được đúng tập, mỗi trang đủ cỡ trừ trang cuối.
    const kiemCo = async () => {
      for (const size of [25, 50]) for (const tab of ["all", "thieu"] as TabTrang[]) {
        const { ma, trang } = await hetTrang(TS({ tab, size }));
        assert.deepEqual(ma, (await hetTrang(TS({ tab }))).ma, `CG3-AC-4 cỡ ${size} tab ${tab}: lệch tập hay thứ tự của cỡ 15`);
        trang.slice(0, -1).forEach((x) => assert.equal(x.rows.length, size, `CG3-AC-4 cỡ ${size} tab ${tab}: trang giữa thiếu dòng`));
        if (size === 25 && tab === "all") assert.ok(trang.length > 1, "đối chứng: cỡ 25 tab Tất cả phải có hơn một trang");
      }
    };
    await kiemCo();
    await phaiDo("const cua = chon.slice((page - 1) * thamSo.size, page * thamSo.size);", "const cua = chon.slice((page - 1) * thamSo.size, page * thamSo.size).slice(0, 15);", kiemCo, /CG3-AC-4 cỡ \d+ tab \w+: /);
    await phaiDo("return { ...d, ...lienHe, ...noiDung };", "return { ...d, ...lienHe, ...noiDung, ...(vai.lienHe ? {} : { rank: null, discountPct: null, priceVnd: null, source: null }) };", () => kiem(), /CG3-AC-4 tab all vai Người xem: dòng mất số của hạng/);
    await phaiDo("SELECT DISTINCT ON (l.can_key) l.*\n       FROM loc l", "SELECT l.*\n       FROM loc l", async () => { await kiemBien(); }, /CG3-AC-4 tab all: căn hai tin ở biên trang phải gộp một dòng/);
    await phaiDo(
      "const cua = chon.slice((page - 1) * thamSo.size, page * thamSo.size);",
      "const cua = nhe.slice((page - 1) * thamSo.size, page * thamSo.size).filter((r) => chon.includes(r));",
      () => kiem(), /CG3-AC-4 tab (du|xac-minh|thieu): /);
    // Lược đồ kiểu cloud: đổi tên bảng thật trên DB riêng của ca rồi trả lại; bản cloud không được đọc bảng ảnh.
    await trenCloud(async () => {
      await kiem();
      await kiemBien(true);
      assert.equal((await doc(TS())).mayThu, false, "CG3-AC-4 lược đồ cloud phải báo mayThu = false");
      await phaiDo('const coAnh = cloud ? "false" : `EXISTS', "const coAnh = `EXISTS", () => kiem(), /media/);
      await phaiDo('${cloud ? "NULL AS unit_number, NULL AS street_number" : "o.unit_number, o.street_number"}', "o.unit_number, o.street_number", () => kiem(), /unit_number/);
    });
  } finally {
    for (const { can } of bien) {
      await c.query("DELETE FROM property_offers WHERE property_id = $1", [can]);
      await c.query("DELETE FROM properties WHERE id = $1", [can]);
    }
  }
  const nhieuTin = (await hetTrang(TS())).ma.filter((id) => id.startsWith("a-can-"));
  assert.equal(nhieuTin.length, 1, "CG3-AC-4 căn ba tin phải hiện đúng một dòng");
  const tong = (await doc(TS())).trang.tong;
  assert.equal((await doc(TS({ page: 999 }))).trang.page, Math.ceil(tong / 15), "CG3-AC-4 trang vượt cuối phải về trang cuối");
  const MA_TRAN: [Record<string, string>, number, number][] = [[{ page: "0" }, 1, 15], [{ page: "-1" }, 1, 15], [{ page: "abc" }, 1, 15], [{ page: "1.5" }, 1, 15], [{ page: "2" }, 2, 15], [{ size: "7" }, 1, 15], [{ size: "abc" }, 1, 15], [{ size: "25" }, 1, 25]];
  for (const [sp, p, s] of MA_TRAN) { const t = docThamSoDeal(sp); assert.deepEqual([t.page, t.size], [p, s], `CG3-AC-4 tham số ${JSON.stringify(sp)}`); }
  assert.deepEqual([...CO_TRANG_DEAL], [15, 25, 50]);
  const cuoi = (await doc(TS({ page: 3 }))).rows[0].offerId;
  assert.equal((await qua(() => m.deals.getDeal(cuoi))).deal?.offerId, cuoi, "CG3-AC-4 căn ngoài trang đang xem phải mở được");
  // ?can= của căn ngoài trang chuyển sang trang một căn; căn trong trang mở ngay trên danh sách.
  const moCan = async (thay?: Thay) => {
    await assert.rejects(() => veTrang({ can: cuoi }, "ops", thay), (e: { digest?: string }) => String(e.digest).includes(`/ops/deals/${encodeURIComponent(cuoi)}`));
    const tren = (await doc(TS())).rows[0].offerId;
    assert.equal((await veTrang({ can: tren }, "ops", thay)).props.moBanDau, tren, "CG3-AC-4 căn trong trang phải mở trên danh sách");
  };
  await moCan();
  await assert.rejects(() => moCan({ sau: "async function DealsTrangContent", tu: "if (can && !tho.some((d) => d.offerId === can)) redirect(`/ops/deals/${encodeURIComponent(can)}`);", thanh: "" }), /Missing expected rejection/);
});

test("CG3-AC-5 chọn tỉnh, phường, dự án trên cây: đúng tập, đúng số trên mục, tổng các tỉnh bằng tổng tập", async () => {
  const moLai = (t: ThamSoDeal) => docThamSoDeal(Object.fromEntries(new URL(urlThamSoDeal(t), "http://may-thu").searchParams));
  const CA: [string, Partial<ThamSoDeal>, (r: TinDocLap) => boolean][] = [
    ["tỉnh có căn gắn thẳng", { location: T1 }, (r) => r.area_id === T1 || r.parent_id === T1],
    ["tỉnh hai", { location: T2 }, (r) => r.area_id === T2 || r.parent_id === T2],
    ["phường", { location: P("a4") }, (r) => r.area_id === P("a4")],
    ["phường của tin cũ trong căn hai phường", { location: P("a1") }, (r) => r.area_id === P("a1")],
    ["dự án trải hai phường", { project: String(d1) }, (r) => r.cap === "du_an" && r.nut === String(d1)],
    ["dự án của tin mới trong căn hai dự án", { project: String(d2) }, (r) => r.cap === "du_an" && r.nut === String(d2)],
    ["mã lạ", { location: "vn-cg3-khong-co" }, () => false],
  ];
  const kiemCa = async () => {
    for (const [ten, t, loc] of CA) {
      const ts = TS(t), tuUrl = moLai(ts);
      assert.deepEqual(tuUrl, ts, `CG3-AC-5 ${ten}: mở lại đường dẫn sai điều kiện`);
      const ky = (await tapDocLap("sale", loc)).map((r) => r.offer_id).sort();
      const kq = await hetTrang(tuUrl);
      assert.deepEqual([...kq.ma].sort(), ky, `CG3-AC-5 ${ten}: sai tập căn`);
      assert.equal(kq.dau.trang.dem.all, ky.length, `CG3-AC-5 ${ten}: số trên tab lệch`);
    }
  };
  await kiemCa();
  const macDinh = (await hetTrang(TS())).ma;
  assert.ok(macDinh.includes("g-2") && !macDinh.includes("g-1"), "đối chứng: không lọc thì căn hai tin hiện bằng tin thấy sau cùng");
  assert.ok((await hetTrang(TS({ project: String(d1) }))).ma.includes("g-1"), "CG3-AC-5 chọn dự án phải thấy căn có tin thuộc dự án đó");
  assert.ok((await hetTrang(TS({ location: P("a1") }))).ma.includes("g-1"), "CG3-AC-5 chọn phường phải thấy căn có tin ở phường đó");
  await phaiDo("d.area_id = $4 OR d.cha = $4", "d.area_id = $4 OR d.cha = $4 OR d.cha IS NULL", kiemCa, /CG3-AC-5 .+: sai tập căn/);
  // Tỉnh có hai nhánh Dự án và Phường; mỗi mục đúng tên, đúng số căn tính độc lập.
  const demNut = async (loc: (r: TinDocLap) => boolean) => (await tapDocLap("sale", loc)).length;
  const kiemCay = async () => {
    const tinh = (await doc(TS())).trang.cay.find((t) => t.value === `area:${T1}`);
    assert.equal(tinh?.label, "Tỉnh một", "CG3-AC-5 cây thiếu tỉnh một");
    assert.deepEqual(tinh.children?.map((n) => [n.value, n.label]), [[`nhom:du-an:${T1}`, "Dự án"], [`nhom:phuong:${T1}`, "Phường"]], "CG3-AC-5 tỉnh phải có hai nhánh Dự án và Phường");
    const muc = (n: number) => [...(tinh.children![n].children ?? [])].map((x) => [x.value, x.label, x.count]).sort();
    assert.deepEqual(muc(0), [[`project:${d1}`, "Khu Một", await demNut((r) => r.nut === String(d1))], [`project:${d2}`, "Khu Hai", await demNut((r) => r.nut === String(d2))]].sort(), "CG3-AC-5 nhánh Dự án sai mục");
    const phuong = await Promise.all(["a1", "a2", "a3", "a4"].map(async (w) => [`area:${P(w)}`, P(w), await demNut((r) => r.area_id === P(w))] as [string, string, number]));
    assert.deepEqual(muc(1), phuong.filter((x) => x[2] > 0).sort(), "CG3-AC-5 nhánh Phường sai mục");
  };
  await kiemCay();
  await phaiDo("...(duAn.length ? [{ value: `nhom:du-an:${ma}`", "...(duAn.length < 0 ? [{ value: `nhom:du-an:${ma}`", kiemCay, /CG3-AC-5 tỉnh phải có hai nhánh/);
  await phaiDo("...(phuong.length ? [{ value: `nhom:phuong:${ma}`", "...(phuong.length < 0 ? [{ value: `nhom:phuong:${ma}`", kiemCay, /CG3-AC-5 tỉnh phải có hai nhánh/);
  await phaiDo(".map(([k, v]) => ({ value: `${tien}:${k}`, label: v.ten, count: v.can.size }));", ".map(([k, v]) => ({ value: `${tien}:${k}`, label: k, count: v.can.size }));", kiemCay, /CG3-AC-5 nhánh Dự án sai mục/);
  const tap = await tapDocLap();
  assert.ok(new Set((await tapDocLap("sale", (r) => r.nut === String(d1))).map((r) => r.area_id)).size >= 2, "đối chứng: dự án phải trải hai phường");
  assert.ok(tap.some((r) => r.area_id === T1), "đối chứng: phải có căn gắn thẳng tỉnh");
  assert.ok(!(await hetTrang(TS({ location: P("a1") }))).ma.some((id) => id.startsWith("t-")), "CG3-AC-5 căn gắn thẳng tỉnh không thuộc phường");
  const DUNG: [Record<string, string>, Partial<ThamSoDeal>][] = [
    [{ location: P("a1") }, { location: P("a1") }], [{ location: T2 }, { location: T2 }], [{ project: String(d1) }, { project: String(d1) }],
    [{ type: "house" }, { type: "house" }], [{ kind: "rent" }, { kind: "rent" }], [{ tab: "xac-minh" }, { tab: "xac-minh" }],
    [{ location: P("a1"), type: "apartment", kind: "rent", tab: "du", page: "2", size: "25" }, { location: P("a1"), type: "apartment", kind: "rent", tab: "du", page: 2, size: 25 }],
  ];
  for (const [sp, ky] of DUNG) {
    assert.deepEqual(docThamSoDeal(sp), TS(ky), `CG3-AC-5 đường dẫn ${JSON.stringify(sp)} phải giữ điều kiện`);
    assert.deepEqual(moLai(TS(ky)), TS(ky), `CG3-AC-5 ghi rồi đọc lại ${JSON.stringify(sp)}`);
  }
  for (const kind of ["sale", "rent"] as const) for (const type of [null, ...LOAI]) {
    const nen = { kind, type }, goc = await doc(TS(nen));
    assert.equal(goc.trang.cay.reduce((s, t) => s + t.count, 0), goc.trang.dem.all, `CG3-AC-5 ${kind} × ${type}: tổng các tỉnh lệch tổng tập`);
    for (const t of goc.trang.cay) {
      assert.equal((await doc(TS({ ...nen, location: t.value.split(":")[1] }))).trang.dem.all, t.count, `CG3-AC-5 ${kind} × ${type}: số trên mục ${t.label}`);
      for (const n of t.children ?? []) for (const x of n.children ?? []) {
        const [loai, ma] = x.value.split(":");
        assert.equal((await doc(TS({ ...nen, ...(loai === "area" ? { location: ma } : { project: ma }) }))).trang.dem.all, x.count, `CG3-AC-5 ${kind} × ${type}: số trên mục ${x.label}`);
      }
    }
  }
  assert.equal(urlThamSoDeal(TS({ project: String(d1) })), `/ops/deals?project=${d1}`, "CG3-AC-5 đường dẫn dự án giữ nguyên");
});

test("CG3-AC-6 bán hay thuê kết hợp loại hình và vị trí; giá trị lạ bị bỏ qua", async () => {
  const banTap = await tapDocLap("sale"), thueTap = await tapDocLap("rent_lt");
  const kiemBan = async () => assert.deepEqual([...(await hetTrang(TS())).ma].sort(), banTap.map((r) => r.offer_id).sort(), "CG3-AC-6 mặc định phải là tin bán");
  await kiemBan();
  await phaiDo("WHERE h.kind = $1 AND h.nhan IS NOT NULL", "WHERE $1::text IS NOT NULL AND h.nhan IS NOT NULL", kiemBan, /CG3-AC-6 mặc định phải là tin bán/);
  assert.deepEqual([...(await hetTrang(TS({ kind: "rent" }))).ma].sort(), thueTap.map((r) => r.offer_id).sort(), "CG3-AC-6 Cho thuê sai tập");
  // Ma trận viết trước: mỗi ô kind × type × vị trí so tập mã với tập tính độc lập.
  const VI_TRI: [string, Partial<ThamSoDeal>, (r: TinDocLap) => boolean][] = [
    ["mọi vị trí", {}, () => true],
    ["tỉnh", { location: T1 }, (r) => r.area_id === T1 || r.parent_id === T1],
    ["phường a1", { location: P("a1") }, (r) => r.area_id === P("a1")],
    ["phường a4", { location: P("a4") }, (r) => r.area_id === P("a4")],
    ["dự án một", { project: String(d1) }, (r) => r.cap === "du_an" && r.nut === String(d1)],
    ["dự án hai", { project: String(d2) }, (r) => r.cap === "du_an" && r.nut === String(d2)],
  ];
  const oKhacRong = new Set<string>();
  const kiemMaTran = async () => {
    for (const [kind, kindDb] of [["sale", "sale"], ["rent", "rent_lt"]] as const) for (const type of [null, ...LOAI]) for (const [ten, vt, loc] of VI_TRI) {
      const ky = (await tapDocLap(kindDb, (r) => (type === null || r.property_type === type) && loc(r))).map((r) => r.offer_id).sort();
      assert.deepEqual([...(await hetTrang(TS({ kind, type, ...vt }))).ma].sort(), ky, `CG3-AC-6 ô ${kind} × ${type} × ${ten} sai tập`);
      if (ky.length > 0) oKhacRong.add(`${kind}|${type}|${ten}`);
    }
  };
  await kiemMaTran();
  assert.deepEqual(LOAI, [...LOAI_LOC], "CG3-AC-6 ma trận phải phủ đủ loại hình lọc được của sổ từ vựng");
  for (const o of ["sale|house|phường a4", "rent|house|phường a4", "rent|apartment|phường a1", "rent|apartment|dự án hai", "sale|land|mọi vị trí", "rent|room|phường a1", "sale|commercial|mọi vị trí"]) assert.ok(oKhacRong.has(o), `đối chứng: ô ${o} phải có căn`);
  await phaiDo("AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = $3)", "AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = CASE WHEN $3 = 'land' THEN 'apartment' ELSE $3 END)", kiemMaTran, /CG3-AC-6 ô sale × land × .+ sai tập/);
  await phaiDo("AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = $3)", "AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR h.kind <> 'sale' OR o.property_type = $3)", kiemMaTran, /CG3-AC-6 ô rent × (apartment|house) × .+ sai tập/);
  const thang = (await hetTrang(TS({ kind: "rent", project: String(d2) }))).trang.flatMap((x) => x.rows);
  assert.ok(thang.length > 0 && thang.every((d) => d.rank?.metric === "gia-thang-pn"), "CG3-AC-6 tin thuê thiếu m² phải theo thước giá tháng");
  const sai = docThamSoDeal({ kind: "abc", type: "abc", tab: "abc", location: "DROP TABLE", project: "x1" });
  assert.deepEqual([sai.kind, sai.type, sai.tab, sai.location, sai.project], ["sale", null, "all", null, null], "CG3-AC-6 giá trị lạ phải bị bỏ qua");
});

const trangMau = (o: Omit<Partial<TrangDeal>, "thamSo"> & { thamSo?: Partial<ThamSoDeal> }): TrangDeal => ({ dem: { all: 0, du: 0, "xac-minh": 0, thieu: 0 }, tong: 0, page: 1, cay: [], tabDong: {}, ...o, thamSo: TS(o.thamSo) });
const veLuoi = (t: TrangDeal, rows: DealHang[] = [], xemNoiDung = true) =>
  renderToStaticMarkup(<luoi.DealsGrid rows={rows} xemNoiDung={xemNoiDung} mayThu trang={t} onDoi={() => {}} />);

test("CG3-AC-7 trạng thái trống có hành động, thanh lọc vẫn đứng", async () => {
  const CA: [TrangDeal, string, string, string][] = [
    [trangMau({ dem: { all: 5, du: 0, "xac-minh": 5, thieu: 0 }, thamSo: { tab: "du" } }), "tab", "Mục này chưa có căn.", "Xem tất cả"],
    [trangMau({ thamSo: { location: "vn-hanoi" } }), "loc", "Không có căn nào khớp bộ lọc.", "Xoá bộ lọc"],
    [trangMau({}), "tap", "Chưa có căn nào trong danh sách.", "Xem chất lượng dữ liệu"],
  ];
  for (const [t, loai, chu, nut] of CA) {
    const dom = new JSDOM(veLuoi(t)).window.document;
    const vung = dom.querySelector(`[data-deals-trong="${loai}"]`);
    assert.ok(vung, `CG3-AC-7 thiếu vùng trống «${loai}»`);
    assert.ok(vung.textContent?.includes(chu), `CG3-AC-7 vùng trống «${loai}» thiếu «${chu}»`);
    assert.deepEqual([...vung.querySelectorAll("button, a")].map((n) => n.textContent?.trim()), [nut], `CG3-AC-7 vùng trống «${loai}» phải có đúng nút «${nut}»`);
    const boLoc = dom.querySelector("[data-deals-bo-loc]");
    assert.ok(boLoc && !vung.contains(boLoc), `CG3-AC-7 trạng thái «${chu}» mất thanh lọc`);
  }
  const co = veLuoi(trangMau({ dem: { all: 1, du: 1, "xac-minh": 0, thieu: 0 }, tong: 1 }), [dongMau({ rank: hang({}) as never })]);
  assert.ok(!co.includes("Mục này chưa có căn."), "CG3-AC-7 đối chứng: có dữ liệu thì không có chữ trống");
  const chan = veLuoi(trangMau({ dem: { all: 7385, du: 1, "xac-minh": 0, thieu: 7384 }, tong: 7385 }), [dongMau({ rank: hang({}) as never })]);
  assert.ok(chan.includes("1–15 / 7.385"), "CG3-AC-3 chân bảng phải ghi khoảng đang hiện trên tổng, có dấu chấm ngăn nghìn");
  const kiemTai = async (thay?: Thay) => {
    const { cay, khungTai } = await veTrang({}, "ops", thay);
    const tai = khungTai.props.fallback as ReactElement | null;
    assert.equal(tai?.type, DealsSkeleton, "CG3-AC-7 trang phải hiện khung tải của danh sách");
    assert.ok(renderToStaticMarkup(tai).includes('data-slot="skeleton"'), "CG3-AC-7 khung tải không dựng ra ô chờ");
    assert.ok(tim(cay, (e) => e.type === RegionError && e.props.what === "danh sách căn"), "CG3-AC-7 danh sách phải nằm trong khung lỗi");
  };
  await kiemTai();
  // Lỗi hạ tầng không được coi là lược đồ cloud: khung lỗi có Thử lại phải nhận được lỗi.
  const goc = m.pool.query;
  const kiemLoi = async (lib: typeof m.deals) => {
    m.pool.query = ((sql: string, ...a: unknown[]) => (String(sql).includes("AS co_anh") && !String(sql).includes("false AS co_anh") ? Promise.reject(Object.assign(new Error("cg3-ket-khoa"), { code: "40P01" })) : (c.query as (...x: unknown[]) => unknown)(sql, ...a))) as typeof m.pool.query;
    try { await assert.rejects(() => lib.getDealsTrang(TS()), /cg3-ket-khoa/, "CG3-AC-7 lỗi hạ tầng phải tới khung lỗi"); } finally { m.pool.query = goc; }
  };
  await kiemLoi(m.deals);
  await phaiDo("if (!thieuLuocDo(e)) throw e;\n    const { rows } = await pool.query(sql({ cloud: true, coBang }), values);", "const { rows } = await pool.query(sql({ cloud: true, coBang }), values);", () => kiemLoi(dotBien!), /CG3-AC-7 lỗi hạ tầng phải tới khung lỗi/);
  await assert.rejects(() => kiemTai({ tu: "<Suspense fallback={<DealsSkeleton />}>", thanh: "<Suspense fallback={null}>" }), /CG3-AC-7 trang phải hiện khung tải/);
});

test("CG3-AC-8 vai Người xem không nhận liên hệ, nội dung ở mọi trang và mọi điều kiện lọc", async () => {
  const CAY = [TEN, NHOM, DUONG, BAI, TOA, TANG, CAN, SO_NHA, QUAN];
  const guiXuong = async (sp: Record<string, string>, vai: VaiTrang, thay?: Thay) => JSON.stringify((await veTrang(sp, vai, thay)).props);
  const DIEU_KIEN: Record<string, string>[] = [{}, { page: "2" }, { project: String(d1) }, { project: String(d1), page: "2" }, { location: P("a1"), type: "apartment" }, { kind: "rent" }];
  const kiemXem = async (thay?: Thay) => {
    for (const sp of DIEU_KIEN) {
      const xem = await guiXuong(sp, "viewer", thay);
      assert.ok(xem.length > 2, `CG3-AC-8 đối chứng: điều kiện ${JSON.stringify(sp)} phải có dòng`);
      for (const cay of [...CAY, "/api/zalo-media"]) assert.ok(!xem.includes(cay), `CG3-AC-8 vai Người xem lộ «${cay}»`);
      assert.ok(!coSoCay(JSON.parse(xem)), "CG3-AC-8 vai Người xem lộ số điện thoại");
    }
  };
  await kiemXem();
  await phaiDo("const lienHe = vai.lienHe ? {} :", "const lienHe = vai ? {} :", () => kiemXem(), /CG3-AC-8 vai Người xem lộ/);
  await phaiDo("{ sellerName: null, sellerPhone: null, groupName: null,", "{ sellerName: null, groupName: null,", () => kiemXem(), /CG3-AC-8 vai Người xem lộ số điện thoại/);
  await assert.rejects(() => kiemXem({ sau: "async function DealsTrangContent", tu: "dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })", thanh: "dealHang(d, { xemNoiDung: true, mayThu })" }), /CG3-AC-8 vai Người xem lộ/);
  await assert.rejects(() => kiemXem({ tu: "const xemNoiDung = xemNoiDungTin(user);", thanh: "const xemNoiDung = true;" }), /CG3-AC-8 vai Người xem lộ/);
  const vh = await guiXuong({ project: String(d1) }, "ops");
  assert.ok(vh.includes(TEN), "CG3-AC-8 đối chứng: vai Vận hành phải có tên người bán");
  // Đối chứng dương đủ ba dạng số mà dòng mang: số gốc, số in sẵn, liên kết gọi.
  assert.ok((await veTrang({ project: String(d1) }, "ops")).rows.some((d) => d.sellerPhone === SDT && d.sdt === "0912 345 678" && d.tel === `tel:${SDT}`), "CG3-AC-8 đối chứng: vai Vận hành phải có số ở cả ba dạng");
  for (const cay of [NHOM, BAI, TOA, TANG, CAN, SO_NHA, DUONG, QUAN]) assert.ok(vh.includes(cay), `CG3-AC-8 đối chứng: vai Vận hành phải có «${cay}»`);
  assert.ok((await veTrang({ project: String(d1) }, "ops")).rows.some((d) => d.images.length > 0), "CG3-AC-8 đối chứng: vai Vận hành phải có ảnh");
  assert.ok((await veTrang({ project: String(d1) }, "viewer")).rows.every((d) => d.images.length === 0), "CG3-AC-8 vai Người xem nhận ảnh");
  // Căn của dự án có bài gốc, nằm ngoài trang 1 của danh sách đang lọc: đo đúng dòng trang một căn đưa xuống phần thân.
  const id = (await doc(TS({ project: String(d1), page: 2 }))).rows[0].offerId;
  const kiemMot = async (thay?: Thay) => {
    const moXem = await veMotCan(id, "viewer", thay), moVh = await veMotCan(id, "ops", thay);
    assert.deepEqual([moXem.offerId, moVh.offerId], [id, id], "CG3-AC-8 phải mở đúng căn ngoài trang");
    assert.ok(coSoCay(moVh) && moVh.tel === `tel:${SDT}`, "CG3-AC-8 đối chứng mở căn ngoài trang: vai Vận hành phải có số");
    assert.ok(!coSoCay(moXem), "CG3-AC-8 mở căn ngoài trang lộ số điện thoại");
    for (const cay of CAY) {
      assert.ok(JSON.stringify(moVh).includes(cay), `CG3-AC-8 đối chứng mở căn ngoài trang: vai Vận hành phải có «${cay}»`);
      assert.ok(!JSON.stringify(moXem).includes(cay), `CG3-AC-8 mở căn ngoài trang lộ «${cay}»`);
    }
  };
  await kiemMot();
  await assert.rejects(() => kiemMot({ tu: "dealHang(dealTheoVai(deal, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })", thanh: "dealHang(deal, { xemNoiDung: true, mayThu })" }), /CG3-AC-8 mở căn ngoài trang lộ/);
  await phaiDo("const xong = await hoanTat([{ ...d, roiDanhSach: lyDoRoi(d, rows[0].qua_han === true) }], mayThu);",
    "const xong = await hoanTat([{ ...d, sellerName: null, sellerPhone: null, street: null, block: null, floor: null, unit: null, streetNumber: null, district: null, postTextFull: null, roiDanhSach: lyDoRoi(d, rows[0].qua_han === true) }], mayThu);",
    () => kiemMot(), /CG3-AC-8 đối chứng mở căn ngoài trang/);
  const cotGoi = async (vai: VaiTrang) => [...new JSDOM(veTuTrang((await veTrang({}, vai)).props)).window.document.querySelectorAll("thead th")].some((th) => th.textContent?.trim() === "Gọi ai");
  assert.equal(await cotGoi("viewer"), false, "CG3-AC-8 vai Người xem còn cột Gọi ai");
  assert.equal(await cotGoi("ops"), true, "CG3-AC-8 đối chứng: vai Vận hành có cột Gọi ai");
  // Lời báo cloud đo trên phần trang dựng ra, theo đúng điều kiện lược đồ.
  const CHU_CLOUD = "Ảnh, chữ bài chỉ có ở máy thu";
  const loiBao = async (thay?: Thay) => tim((await veTrang({}, "ops", thay)).ra, (e) => e.type === LocalOnlyAlert)?.props.title;
  const kiemCloud = async (thay?: Thay) => {
    assert.equal(await loiBao(thay), undefined, "CG3-AC-8 máy thu không được báo thiếu ảnh, chữ bài");
    await trenCloud(async () => assert.equal(await loiBao(thay), CHU_CLOUD, "CG3-AC-8 lược đồ cloud phải báo ảnh, chữ bài chỉ có ở máy thu"));
  };
  await kiemCloud();
  await assert.rejects(() => kiemCloud({ sau: "async function DealsTrangContent", tu: "{!mayThu && (", thanh: "{mayThu && (" }), /CG3-AC-8 (máy thu không được báo|lược đồ cloud phải báo)/);
});

test("CG3-AC-9 bảng và đầu trang không còn chữ cũ, phần trăm dùng dấu phẩy, nguồn chỉ hiện mã", async () => {
  const CU = "Tin nội bộ S03, S05 rẻ hơn thước S06 cùng phường";
  const kiemDau = async (thay?: Thay) => {
    for (const sp of [{}, { project: String(d1) }] as Record<string, string>[]) {
      const dau = tim((await veTrang(sp, "ops", thay)).cay, (e) => e.type === PageHeader);
      assert.ok(dau, "CG3-AC-9 trang thiếu đầu trang");
      const h = renderToStaticMarkup(dau);
      assert.ok(h.includes("Căn giá tốt"), "CG3-AC-9 đối chứng: đầu trang phải dựng ra tiêu đề");
      assert.ok(!h.includes("thước phường"), "CG3-AC-9 đầu trang còn chữ «thước phường»");
      assert.ok(!h.includes(CU), "CG3-AC-9 đầu trang còn câu mô tả cũ");
    }
  };
  await kiemDau();
  const MO_TA = "Căn rẻ hơn trung vị của nhóm so sánh, căn cấp dự án đứng đầu.";
  await assert.rejects(() => kiemDau({ tu: MO_TA, thanh: "Căn rẻ hơn thước phường." }), /CG3-AC-9 đầu trang còn chữ «thước phường»/);
  await assert.rejects(() => kiemDau({ tu: MO_TA, thanh: CU }), /CG3-AC-9 đầu trang còn câu mô tả cũ/);

  // Bảng dựng từ đúng dữ liệu trang gửi xuống: cả dòng cấp dự án, cấp phường và tin thuê.
  const BANG: Record<string, string>[] = [{}, { location: P("a4") }, { kind: "rent" }];
  const tang = await Promise.all(BANG.map(async (sp) => (await veTrang(sp, "ops")).props));
  assert.deepEqual([...new Set(tang.flatMap((p) => p.rows.map((d) => d.rank?.level)))].sort(), ["du_an", "phuong"], "đối chứng: bảng đo phải có dòng cả hai cấp");
  const kiemBang = async () => {
    for (const p of tang) {
      const h = veTuTrang(p);
      assert.ok(!h.includes("thước phường"), "CG3-AC-9 bảng còn chữ «thước phường»");
      for (const o of oCot(h, "Giảm so thước")) assert.match(o.textContent ?? "", /^−\d+(,\d+)?%/, "CG3-AC-9 phần trăm phải dùng dấu phẩy");
      const nguon = oCot(h, "Thấy").map((o) => o.lastElementChild?.lastElementChild?.textContent ?? "");
      assert.equal(nguon.length, p.rows.length, "CG3-AC-9 đối chứng: mỗi dòng một ô nguồn");
      for (const chu of nguon) assert.match(chu, /^S0\d · [\d.]+ lần$/, "CG3-AC-9 cột nguồn chỉ được hiện mã S0x");
    }
  };
  await kiemBang();
  await phaiDoGiaoDien("deals-cells.tsx", { tu: "Độ tin: {", thanh: "Độ tin thước phường: {" }, kiemBang, /CG3-AC-9 bảng còn chữ «thước phường»/);
  await phaiDoGiaoDien("deals-cells.tsx", { tu: "−{soPctVi(pct)}%", thanh: "−{pct.toFixed(1)}%" }, kiemBang, /CG3-AC-9 phần trăm phải dùng dấu phẩy/);
  await phaiDoGiaoDien("deals-grid.tsx", { tu: "{d.source} · {fmtInt(d.nReposts)} lần", thanh: "{d.source} ten-nguon-that.example · {fmtInt(d.nReposts)} lần" }, kiemBang, /CG3-AC-9 cột nguồn chỉ được hiện mã S0x/);
  const mau = veLuoi(trangMau({ dem: { all: 1, du: 1, "xac-minh": 0, thieu: 0 }, tong: 1 }), [dongMau({ rank: hang({}) as never })]);
  assert.ok(mau.includes("33,7") && !mau.includes("33.7%"), "CG3-AC-9 33.7 phải hiện thành 33,7");
});
