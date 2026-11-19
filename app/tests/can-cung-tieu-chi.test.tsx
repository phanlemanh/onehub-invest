// can-cung-tieu-chi.test.tsx — hồ sơ can-cung-tieu-chi-toan-tap (CG17). DB thử trắng dựng từ db/migrations của nhánh; bước chấm xepHangGia
// chạy thật rồi bảng hạng được đặt lại đúng giá trị viết tay của từng căn (nhãn, mức giảm, hạng), để tập và thứ tự là của ca này.
// Kỳ vọng viết tay trong tệp, không gọi hàm của màn. Số là số bịa; không tên nguồn thật.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Suspense, isValidElement, type ReactElement, type ReactNode } from "react";
import type pg from "pg";

import { PageHeader } from "../src/components/page/page-header";
import { DealsGridTrang } from "../src/components/ops/deals-grid";
import type { ThamSoDeal } from "../src/lib/deals-chi-tiet";

const ngoai = (rel: string) => import(pathToFileURL(join(import.meta.dirname, rel)).href);
process.env.DATABASE_URL ??= "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg17_khong_dung";

const nap = async () => ({
  fx: await ngoai("../../pipeline/scripts/gia-tot-du-an-fixture.itest.mjs"),
  xep: (await ngoai("../../pipeline/xep-hang-gia.mjs")).xepHangGia as (c: pg.Client, o?: object) => Promise<unknown>,
  cotCloud: (await ngoai("../../pipeline/sync-cloud.mjs")).CLOUD_ALLOW.sale_offers as string[],
  deals: await import("../src/lib/deals"),
  pool: (await import("../src/lib/db")).pool,
});
let m: Awaited<ReturnType<typeof nap>>;
let c: pg.Client;
let d1: number;
const M = 1_000_000;
const SDT = "+84912345678", TEN = "Người Bán Cấy", DUONG = "Đường Cấy Thử", BAI = "Chữ bài cấy thử", TOA = "Toà Cấy Thử";
const T = "vn-cg17-t", P = (w: string) => `vn-cg17-${w}`;
const TS = (p: Partial<ThamSoDeal> = {}): ThamSoDeal => ({ location: null, project: null, type: null, kind: "sale", tab: "all", page: 1, size: 15, ...p });
const coSoCay = (x: unknown): boolean => typeof x === "string" ? x.replace(/\D/g, "").includes("912345678")
  : Array.isArray(x) ? x.some(coSoCay) : x !== null && typeof x === "object" ? Object.values(x).some(coSoCay) : false;

/**
 * Tập viết tay. Mỗi căn: [mã tin, phường, loại, m², mức giảm %, cần xác minh, dự án D1?, bán/thuê]. Hạng phần trăm đặt theo thứ tự xen kẽ
 * nhóm (cột cuối), để căn cùng tiêu chí của một căn trải nhiều trang.
 * - P1: «x-0» và 27 căn khác cùng phường; cùng tiêu chí với x-0 cũng là 27 (mọi căn là căn hộ 45–75 m²); c-05 là căn hai tin (c-05, c-05b);
 *   c-20, c-21 bằng mức giảm (đứng 20, 21); v-1 cần xác minh. x-0 và c-01…c-10 thuộc dự án D1.
 * - P4: a-0 nhà riêng + 6 căn hộ → 0 cùng tiêu chí, 6 cùng phường.  P5: b-0 + 4 căn hộ 60 m² + 5 đất → 4 và 9.  P6: z-0 một mình → 0 và 0.
 * - P7: biên diện tích của m-0 (60 m²): 45 và 75 m² được tính; 44,4 và 75,6 không; căn không diện tích, căn chưa rõ loại, căn nhà riêng không;
 *   m-2 là căn hai tin (m-2, m-2b).
 * - P2, P3 cùng tên «Phường Trùng», khác mã: s-0, s-1 không cùng phường với nhau.
 * - Thuê: r-0, r-1, r-2 căn hộ 60 m² ở P1.
 */
type Can = { id: string; ph: string; loai: string | null; m2: number | null; duoi: number; xm?: boolean; duAn?: boolean; thue?: boolean };
const TAP: Can[] = [
  { id: "x-0", ph: "p1", loai: "apartment", m2: 60, duoi: 10, duAn: true },
  ...Array.from({ length: 24 }, (_, i): Can => ({ id: `c-${String(i + 1).padStart(2, "0")}`, ph: "p1", loai: "apartment", m2: 60, duoi: 49 - i, duAn: i < 10 })),
  { id: "c-25", ph: "p1", loai: "apartment", m2: 60, duoi: 25 },
  { id: "c-26", ph: "p1", loai: "apartment", m2: 60, duoi: 24 },
  { id: "v-1", ph: "p1", loai: "apartment", m2: 60, duoi: 40, xm: true },
  { id: "a-0", ph: "p4", loai: "house", m2: 100, duoi: 20 },
  ...Array.from({ length: 6 }, (_, i): Can => ({ id: `a-${i + 1}`, ph: "p4", loai: "apartment", m2: 60, duoi: 15 + i })),
  { id: "b-0", ph: "p5", loai: "apartment", m2: 60, duoi: 20 },
  ...Array.from({ length: 4 }, (_, i): Can => ({ id: `b-${i + 1}`, ph: "p5", loai: "apartment", m2: 60, duoi: 15 + i })),
  ...Array.from({ length: 5 }, (_, i): Can => ({ id: `b-l${i + 1}`, ph: "p5", loai: "land", m2: 60, duoi: 10 + i })),
  { id: "z-0", ph: "p6", loai: "apartment", m2: 60, duoi: 20 },
  { id: "m-0", ph: "p7", loai: "apartment", m2: 60, duoi: 20 },
  { id: "m-75", ph: "p7", loai: "apartment", m2: 45, duoi: 19 },
  { id: "m-125", ph: "p7", loai: "apartment", m2: 75, duoi: 18 },
  { id: "m-74", ph: "p7", loai: "apartment", m2: 44.4, duoi: 17 },
  { id: "m-126", ph: "p7", loai: "apartment", m2: 75.6, duoi: 16 },
  { id: "m-null", ph: "p7", loai: "apartment", m2: null, duoi: 15 },
  { id: "m-unk", ph: "p7", loai: "unknown", m2: 60, duoi: 14 },
  { id: "m-house", ph: "p7", loai: "house", m2: 60, duoi: 13 },
  { id: "m-2", ph: "p7", loai: "apartment", m2: 60, duoi: 12 },
  { id: "s-0", ph: "p2", loai: "apartment", m2: 60, duoi: 20 },
  { id: "s-1", ph: "p3", loai: "apartment", m2: 60, duoi: 20 },
  ...Array.from({ length: 3 }, (_, i): Can => ({ id: `r-${i}`, ph: "p1", loai: "apartment", m2: 60, duoi: 20 - i, thue: true })),
];
/** Tin thứ hai của hai căn hai tin; tin này thấy sau nên là dòng đại diện của căn. */
const HAI_TIN: [string, string, number][] = [["c-05", "c-05b", 45], ["m-2", "m-2b", 12]];

/** Số viết tay: [cùng tiêu chí, cùng phường] của từng căn bán (đại diện căn), trên toàn tập không lọc. */
const KY: Record<string, [number, number]> = {
  "x-0": [27, 27], "v-1": [27, 27], "c-25": [27, 27], "c-26": [27, 27], "c-05b": [27, 27],
  ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => `c-${String(i + 1).padStart(2, "0")}`).filter((x) => x !== "c-05").map((x) => [x, [27, 27]])),
  "a-0": [0, 6], ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`a-${i + 1}`, [5, 6]])),
  "b-0": [4, 9], ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`b-${i + 1}`, [4, 9]])), ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`b-l${i + 1}`, [4, 9]])),
  "z-0": [0, 0], "s-0": [0, 0], "s-1": [0, 0],
  // P7 có 9 căn (m-2 hai tin tính một). m-0 (60 m², 45–75): m-75, m-125, m-2b. m-75 (45 m², 33,75–56,25): m-74. m-125 (75 m², 56,25–93,75): m-0, m-126, m-2b.
  // m-74 (44,4 m², 33,3–55,5): m-75. m-126 (75,6 m², 56,7–94,5): m-0, m-125, m-2b. m-null bỏ diện tích: mọi căn hộ có loại = m-0, m-75, m-125, m-74, m-126, m-2b.
  // m-unk bỏ loại, 45–75 m²: m-0, m-75, m-125, m-house, m-2b. m-house: không nhà riêng nào khác. m-2b như m-0: m-0, m-75, m-125.
  "m-0": [3, 8], "m-75": [1, 8], "m-125": [3, 8], "m-74": [1, 8], "m-126": [3, 8], "m-null": [6, 8], "m-unk": [5, 8], "m-house": [0, 8], "m-2b": [3, 8],
};
/** 20 căn đầu của x-0 theo thứ tự viết tay: không xác minh trước, giảm nhiều trước, mã căn tăng dần (c-20 trước c-21 vì cùng 30%). */
const DAU_20_X = ["c-01", "c-02", "c-03", "c-04", "c-05b", "c-06", "c-07", "c-08", "c-09", "c-10", "c-11", "c-12", "c-13", "c-14", "c-15", "c-16", "c-17", "c-18", "c-19", "c-20"];

async function qua<T>(fn: () => Promise<T>): Promise<T> {
  const goc = m.pool.query;
  m.pool.query = ((...a: unknown[]) => (c.query as (...x: unknown[]) => unknown)(...a)) as typeof m.pool.query;
  try { return await fn(); } finally { m.pool.query = goc; }
}
let dotBien: typeof m.deals | null = null;
let dotBienUrl: string | null = null;
const dl = () => dotBien ?? m.deals;
const docTrang = (t: ThamSoDeal) => qua(() => dl().getDealsTrang(t)).then((r) => r!);
const docCung = (id: string, t: ThamSoDeal = TS(), chiPhuong = false) => qua(() => dl().getCanCungTieuChi(id, t, chiPhuong)).then((r) => r!);

/** Chép lib/deals.ts, thay đúng một đoạn, chạy `fn` trên bản chép: ca phải đỏ đúng thông điệp. */
async function phaiDo(tu: string, thanh: string, fn: () => Promise<void>, thongDiep: RegExp, tepDo: "deals.ts" | "deals-chi-tiet.ts" = "deals.ts") {
  const lib = join(import.meta.dirname, "../src/lib");
  const goc = readFileSync(join(lib, tepDo), "utf8");
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`);
  const nha = mkdtempSync(join(tmpdir(), "cg17-dot-bien-"));
  const tuyetDoi = (ma: string, giu: string[] = []) => ma.replace(/from "\.\/([\w./-]+)"/g, (x, ten: string) => giu.includes(ten) ? x : `from "${pathToFileURL(join(lib, `${ten}.ts`)).href}"`);
  const tep = join(nha, "deals.ts");
  if (tepDo === "deals.ts") writeFileSync(tep, tuyetDoi(goc.replace(tu, thanh)));
  else {
    writeFileSync(join(nha, "deals-chi-tiet.ts"), tuyetDoi(goc.replace(tu, thanh)));
    writeFileSync(tep, tuyetDoi(readFileSync(join(lib, "deals.ts"), "utf8"), ["deals-chi-tiet"]));
  }
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

// Bản chép tạm nằm trong .next/cache: lint và tsc không quét chỗ này (cam kết AC-10 cũ của CG3).
const APP = join(import.meta.dirname, "..");
const CHEP = join(APP, ".next", "cache", `cg17-ban-chep-${process.pid}`);
let nChep = 0;
type Thay = { tu: string; thanh: string };
type Vai = "user" | "viewer" | "ops" | null;
const DONG_PHIEN = `import { getSessionUser } from "@/lib/auth";`;
/** Chép một tệp của app, thay bước đọc phiên bằng vai của ca, trỏ lib/deals sang bản đột biến khi có. */
async function napChep(rel: string, thay?: Thay) {
  let ma = readFileSync(join(APP, rel), "utf8");
  assert.ok(ma.includes(DONG_PHIEN), `bản chép ${rel} không áp được bước đọc phiên`);
  if (thay) { assert.ok(ma.includes(thay.tu), `đột biến không áp được: ${thay.tu}`); ma = ma.replace(thay.tu, thay.thanh); }
  ma = ma.replace(DONG_PHIEN, `const getSessionUser = async () => { const v = (globalThis as { __cg17Vai?: string | null }).__cg17Vai; return v ? ({ id: 1, email: v + "@cg17.test", role: v }) as never : null; };`)
    .replace(`"use server";`, "").replace(`from "./actions"`, `from "${pathToFileURL(join(APP, "src/app/ops/deals/actions.ts")).href}"`);
  if (dotBienUrl) ma = ma.replaceAll(`from "@/lib/deals"`, `from "${dotBienUrl}"`);
  mkdirSync(CHEP, { recursive: true });
  const f = join(CHEP, `tep-${++nChep}.tsx`);
  writeFileSync(f, `import React from "react";\n${ma}`);
  return import(pathToFileURL(f).href);
}
const datVai = (v: Vai) => { (globalThis as { __cg17Vai?: string | null }).__cg17Vai = v; };
type PhanTu = ReactElement<Record<string, unknown>>;
function tim(n: ReactNode, khop: (e: PhanTu) => boolean): PhanTu | null {
  if (Array.isArray(n)) { for (const x of n) { const r = tim(x, khop); if (r) return r; } return null; }
  if (!isValidElement(n)) return null;
  const e = n as PhanTu;
  return khop(e) ? e : tim(e.props.children as ReactNode, khop);
}
/** Dựng /ops/deals theo vai và tham số; trả props lưới, hay lỗi chuyển hướng nếu trang chuyển. */
async function veDanhSach(sp: Record<string, string>) {
  const t = await napChep("src/app/ops/deals/page.tsx");
  datVai("ops");
  return qua(async () => {
    const cay = await t.default({ searchParams: Promise.resolve(sp) }) as ReactNode;
    const nd = tim(cay, (e) => e.type === Suspense)!.props.children as PhanTu;
    const ra = await (nd.type as (p: unknown) => Promise<ReactNode>)(nd.props);
    const luoi = tim(ra, (e) => e.type === DealsGridTrang);
    assert.ok(luoi, "trang không dựng lưới theo trang");
    return luoi.props as { rows: { offerId: string }[]; moBanDau: string | null; taiCung?: unknown };
  });
}
/** Đường dẫn crumb «Căn giá tốt» của trang một căn. */
async function crumbCua(id: string, thay?: Thay) {
  const t = await napChep("src/app/ops/deals/[offerId]/page.tsx", thay);
  datVai("ops");
  return qua(async () => {
    const cay = await t.default({ params: Promise.resolve({ offerId: id }) }) as ReactNode;
    const nd = tim(cay, (e) => e.type === Suspense)!.props.children as PhanTu;
    const dau = tim(await (nd.type as (p: unknown) => Promise<ReactNode>)(nd.props), (e) => e.type === PageHeader);
    assert.ok(dau, "trang một căn không có đầu trang");
    const crumbs = dau.props.crumbs as { label: string; href?: string }[];
    return crumbs.find((x) => x.label === "Căn giá tốt")!.href!;
  });
}
/** Gọi server action thật (bản chép chỉ thay bước đọc phiên) theo vai. */
async function goiAction(vai: Vai, id: string, t: Partial<ThamSoDeal> = {}, chiPhuong = false) {
  const a = await napChep("src/app/ops/deals/actions.ts");
  datVai(vai);
  return qua(() => a.layCanCungTieuChi(id, t, chiPhuong) as Promise<{ moTa: string[]; bo: string[]; tong: number; can: Record<string, unknown>[] } | null>);
}
async function trenCloud<T>(fn: () => Promise<T>): Promise<T> {
  const { rows } = await c.query(`SELECT column_name AS cot FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_offers'`);
  const bo = rows.map((r) => r.cot as string).filter((x) => !m.cotCloud.includes(x));
  await c.query("ALTER TABLE stg_zalo_posts RENAME TO stg_zalo_posts_tam");
  await c.query("ALTER TABLE media RENAME TO media_tam");
  for (const x of bo) await c.query(`ALTER VIEW sale_offers RENAME COLUMN "${x}" TO "${x}_tam"`);
  try { return await fn(); } finally {
    for (const x of bo) await c.query(`ALTER VIEW sale_offers RENAME COLUMN "${x}_tam" TO "${x}"`);
    await c.query("ALTER TABLE media_tam RENAME TO media");
    await c.query("ALTER TABLE stg_zalo_posts_tam RENAME TO stg_zalo_posts");
  }
}
/** Mọi trang của danh sách theo điều kiện. */
async function hetTrang(t: ThamSoDeal) {
  const dau = await docTrang({ ...t, page: 1 });
  const trang = [dau];
  for (let p = 2; p <= Math.ceil(dau.trang.tong / t.size); p++) trang.push(await docTrang({ ...t, page: p }));
  return trang;
}

before(async () => {
  m = await nap();
  await m.fx.dungMau();
  c = await m.fx.dbCa();
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, NULL, 'market', 'Tỉnh Mười Bảy', 'vn')`, [T]);
  for (const [w, ten] of [["p1", "Phường Một"], ["p2", "Phường Trùng"], ["p3", "Phường Trùng"], ["p4", "Phường Bốn"], ["p5", "Phường Năm"], ["p6", "Phường Sáu"], ["p7", "Phường Bảy"]]) {
    await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, $2, 'submarket', $3, 'vn')`, [P(w), T, ten]);
  }
  d1 = await m.fx.duAn(c, { ten: "Khu Mười Bảy" });
  // Hạng phần trăm xen kẽ theo nhóm: căn cùng tiêu chí của x-0 rơi vào nhiều trang.
  const nhom = new Map<string, Can[]>();
  for (const x of TAP) nhom.set(x.ph + (x.thue ? "t" : ""), [...(nhom.get(x.ph + (x.thue ? "t" : "")) ?? []), x]);
  const xen: Can[] = [];
  for (let i = 0; xen.length < TAP.length; i++) for (const g of nhom.values()) if (g[i]) xen.push(g[i]);
  const hangCua = new Map(xen.map((x, i) => [x.id, i + 1]));
  for (const x of TAP) {
    await m.fx.tin(c, { id: x.id, kind: x.thue ? "rent_lt" : "sale", loai: x.loai, phuong: P(x.ph), m2: x.m2, perm2: 40 * M, gia: x.m2 ? undefined : 2400 * M, duAn: x.duAn ? d1 : undefined });
  }
  for (const [a, b] of HAI_TIN) {
    const goc = TAP.find((x) => x.id === a)!;
    await m.fx.tin(c, { id: b, loai: goc.loai, phuong: P(goc.ph), m2: goc.m2, perm2: 40 * M });
    await m.fx.can(c, [a, b]);
  }
  await c.query(`UPDATE sale_offer_records SET seller_phone = $1, seller_name = $2, street_raw = $3, block_raw = $4`, [SDT, TEN, DUONG, TOA]);
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('cg17-snap', 'vn', 'cg17-thu', '{}'::jsonb) ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) SELECT p, 'cg17-snap', $1, 'Nhóm Cấy' FROM sale_offer_records r CROSS JOIN LATERAL unnest(r.post_ids) p`, [BAI]);
  await c.query(`INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_url, media_order)
    SELECT md5(offer_id), offer_id, 'S03', offer_id, 'https://anh.thu/' || offer_id, 1 FROM sale_offer_records`);
  await m.xep(c, { log: () => {} });
  // Bảng hạng do bước chấm ghi, rồi đặt lại đúng giá trị viết tay của ca.
  const dat = async (id: string, x: Can, hang: number) => c.query(
    `INSERT INTO offer_price_rank (offer_id, kind, property_type, thuoc, cap, nut, n, trung_vi, p20, hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, run_id)
     VALUES ($1, $2, $3, 'gia-m2', $4, $5, 20, 50000000, 40000000, $6, $7, $8, $9, 'cg17-thu')
     ON CONFLICT (offer_id) DO UPDATE SET kind = EXCLUDED.kind, property_type = EXCLUDED.property_type, thuoc = EXCLUDED.thuoc, cap = EXCLUDED.cap, nut = EXCLUDED.nut,
       n = EXCLUDED.n, trung_vi = EXCLUDED.trung_vi, p20 = EXCLUDED.p20, hang_pct = EXCLUDED.hang_pct, duoi_trung_vi_pct = EXCLUDED.duoi_trung_vi_pct, nhan = EXCLUDED.nhan,
       can_xac_minh = EXCLUDED.can_xac_minh, run_id = EXCLUDED.run_id`,
    [id, x.thue ? "rent_lt" : "sale", x.loai, x.duAn ? "du_an" : "phuong", x.duAn ? String(d1) : P(x.ph), hang, x.duoi, x.duAn ? "gia-tot" : "re-trong-phuong", x.xm === true]);
  for (const x of TAP) await dat(x.id, x, hangCua.get(x.id)!);
  for (const [a, b, duoi] of HAI_TIN) await dat(b, { ...TAP.find((x) => x.id === a)!, duoi }, hangCua.get(a)!);
  // c-20 và c-21 cùng 30%: thứ tự phải phá hoà bằng mã căn.
  await c.query(`UPDATE offer_price_rank SET duoi_trung_vi_pct = 30 WHERE offer_id IN ('c-20', 'c-21')`);
});
after(async () => { rmSync(CHEP, { recursive: true, force: true }); await m.fx.donHet(); await m.pool.end().catch(() => {}); });

test("CG17-AC-1 số «Căn cùng tiêu chí» của mọi dòng trang 1 ở cỡ 15 và 50 bằng số viết tay trên toàn tập", async () => {
  const tap = await hetTrang(TS({ size: 50 }));
  const tatCa = tap.flatMap((x) => x.rows.map((d) => d.offerId));
  assert.deepEqual([...tatCa].sort(), Object.keys(KY).sort(), "đối chứng: tập bán phải đúng các căn viết tay, mỗi căn một dòng");
  const kiem = async () => {
    for (const size of [15, 50]) {
      const { rows, trang } = await docTrang(TS({ size }));
      assert.equal(rows.length, Math.min(size, Object.keys(KY).length), `đối chứng: trang 1 cỡ ${size} đủ dòng`);
      for (const d of rows) {
        const [tieuChi, phuong] = KY[d.offerId];
        assert.deepEqual(trang.cungTieuChi?.[d.offerId], { tieuChi, phuong }, `CG17-AC-1 căn ${d.offerId} cỡ ${size}: mong ${tieuChi} cùng tiêu chí, ${phuong} cùng phường`);
      }
    }
    // Trang sau của cỡ 50: mọi căn của tập đều được đếm đúng, kể cả hai căn ở hai phường trùng tên.
    for (const { rows, trang } of (await hetTrang(TS({ size: 50 }))).slice(1)) {
      for (const d of rows) {
        const [tieuChi, phuong] = KY[d.offerId];
        assert.deepEqual(trang.cungTieuChi?.[d.offerId], { tieuChi, phuong }, `CG17-AC-1 căn ${d.offerId} trang sau: mong ${tieuChi} cùng tiêu chí, ${phuong} cùng phường`);
      }
    }
  };
  await kiem();
  // Đối chứng dương: căn ở đúng 125% (m-125) và 75% (m-75) có mặt trong danh sách của m-0; 74% và 126% không.
  const m0 = (await docCung("m-0")).rows.map((d) => d.offerId);
  assert.deepEqual(new Set(m0), new Set(["m-75", "m-125", "m-2b"]), "CG17-AC-1 m-0: biên ±25%, ứng viên thiếu diện tích hay loại hình không được tính");
  // Căn cùng tiêu chí của x-0 nằm ở trang khác trang 1 cỡ 15.
  const t1 = new Set((await docTrang(TS())).rows.map((d) => d.offerId));
  assert.ok((await docCung("x-0")).rows.some((d) => !t1.has(d.offerId)), "đối chứng: phải có căn cùng tiêu chí ngoài trang 1");
  await phaiDo("const tapSo = nhe.map(dongSo);", "const tapSo = cua.map(dongSo);", kiem, /CG17-AC-1 căn/);
  await phaiDo("areaId: (r.area_id as string | null) ?? null,", "areaId: (r.phuong as string | null) ?? null,", kiem, /CG17-AC-1 căn s-[01]/);
});

test("CG17-AC-2 danh sách 20 căn đầu lấy từ toàn tập, đúng thứ tự, mỗi căn một dòng", async () => {
  const kiem = async () => {
    const kq = await docCung("x-0");
    const ma = kq.rows.map((d) => d.offerId);
    const can = ma.map((id) => HAI_TIN.find(([a]) => a === id)?.[1] ?? id);
    assert.equal(new Set(can).size, can.length, `CG17-AC-2 có căn lặp: ${can.filter((x, i) => can.indexOf(x) !== i).join(", ")}`);
    assert.equal(kq.tong, 27, "CG17-AC-2 tổng của x-0 phải là 27");
    DAU_20_X.forEach((id, i) => assert.equal(ma[i], id, `CG17-AC-2 vị trí ${i + 1}: mong ${id}, có ${ma[i]}`));
    assert.equal(ma.length, 20, "CG17-AC-2 phải đúng 20 căn");
    for (const d of kq.rows) assert.ok(d.phuong === "Phường Một" && d.propertyType === "apartment" && d.areaM2! >= 45 && d.areaM2! <= 75, `CG17-AC-2 căn ${d.offerId} không thoả tiêu chí`);
  };
  await kiem();
  // Đối chứng: căn có 3 căn cùng tiêu chí thì không cắt.
  assert.equal((await docCung("m-0")).rows.length, 3, "đối chứng: m-0 có đủ 3 căn");
  await phaiDo("SELECT DISTINCT ON (l.can_key) l.*\n       FROM loc l", "SELECT l.*\n       FROM loc l", kiem, /CG17-AC-2 có căn lặp: c-05b/);
  await phaiDo(".sort((a, b) => Number(a.suspect) - Number(b.suspect) || (b.discountPct ?? 0) - (a.discountPct ?? 0) || (a.canKey",
    ".sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0) || (a.canKey", kiem, /CG17-AC-2 vị trí \d+: mong c-\d+, có v-1/, "deals-chi-tiet.ts");
  await phaiDo("(a.canKey < b.canKey ? -1 : a.canKey > b.canKey ? 1 : 0)", "(a.canKey < b.canKey ? 1 : a.canKey > b.canKey ? -1 : 0)", kiem, /CG17-AC-2 vị trí 20: mong c-20, có c-21/, "deals-chi-tiet.ts");
});

test("CG17-AC-3 «Xem mọi căn trong phường»: số và danh sách theo phường, có trần 20", async () => {
  for (const [id, phuong, ma] of [["a-0", 6, ["a-1", "a-2", "a-3", "a-4", "a-5", "a-6"]], ["b-0", 9, null], ["z-0", 0, []]] as const) {
    const kq = await docCung(id, TS(), true);
    assert.equal(kq.tong, phuong, `CG17-AC-3 ${id}: mong ${phuong} căn cùng phường`);
    if (ma) assert.deepEqual(new Set(kq.rows.map((d) => d.offerId)), new Set(ma), `CG17-AC-3 ${id}: sai danh sách theo phường`);
  }
  const x = await docCung("x-0", TS(), true);
  assert.equal(x.tong, 27, "CG17-AC-3 x-0: 27 căn cùng phường");
  assert.deepEqual(x.rows.map((d) => d.offerId), DAU_20_X, "CG17-AC-3 x-0: đúng 20 căn đầu theo phường");
  await phaiDo("const cua = can.slice(0, SO_CUNG_TOI_DA);", "const cua = can;", async () => {
    const y = await docCung("x-0", TS(), true);
    assert.equal(y.rows.length, 20, `CG17-AC-3 danh sách theo phường trả ${y.rows.length} dòng`);
  }, /CG17-AC-3 danh sách theo phường trả 27 dòng/);
});

test("CG17-AC-4 căn thiếu diện tích hay loại hình: bỏ tiêu chí ấy và nói rõ", async () => {
  const khong = await docCung("m-null");
  assert.deepEqual(khong.bo, ["Chưa có diện tích nên không so diện tích"], "CG17-AC-4 m-null phải báo bỏ diện tích");
  assert.deepEqual(new Set(khong.rows.map((d) => d.offerId)), new Set(["m-0", "m-75", "m-125", "m-74", "m-126", "m-2b"]), "CG17-AC-4 m-null sai tập");
  const loai = await docCung("m-unk");
  assert.deepEqual(loai.bo, ["Chưa rõ loại hình nên không so loại hình"], "CG17-AC-4 m-unk phải báo bỏ loại hình");
  assert.deepEqual(new Set(loai.rows.map((d) => d.offerId)), new Set(["m-0", "m-75", "m-125", "m-house", "m-2b"]), "CG17-AC-4 m-unk sai tập");
  assert.deepEqual((await docCung("m-0")).bo, [], "đối chứng: căn đủ trường không có câu bỏ tiêu chí");
});

test("CG17-AC-5 số và danh sách theo bộ lọc bán hay thuê, loại hình, vị trí; đổi tab không đổi số", async () => {
  const o: [Partial<ThamSoDeal>, number, number][] = [
    [{}, 27, 27],
    [{ tab: "xac-minh" }, 27, 27],
    [{ tab: "du" }, 27, 27],
    [{ location: T }, 27, 27],
    [{ location: P("p1") }, 27, 27],
    [{ type: "apartment" }, 27, 27],
    [{ project: String(d1) }, 10, 10],
    [{ location: P("p4") }, 0, 0],
    [{ type: "house" }, 0, 0],
    [{ kind: "rent" }, 0, 0],
  ];
  const kiem = async () => {
    for (const [t, tieuChi, phuong] of o) {
      const nhan = JSON.stringify(t);
      assert.equal((await docCung("x-0", TS(t))).tong, tieuChi, `CG17-AC-5 ô ${nhan}: mong ${tieuChi} cùng tiêu chí`);
      assert.equal((await docCung("x-0", TS(t), true)).tong, phuong, `CG17-AC-5 ô ${nhan}: mong ${phuong} cùng phường`);
    }
    assert.equal((await docCung("r-0", TS({ kind: "rent" }))).tong, 2, "CG17-AC-5 căn thuê r-0 so với hai căn thuê");
  };
  await kiem();
  await phaiDo("const { rows: nhe, mayThu } = await truyVan(dealsNheSql, [...dieuKienTap(thamSo, minPct), thamSo.location, thamSo.project]);\n  const goc",
    "const { rows: nhe, mayThu } = await truyVan(dealsNheSql, [...dieuKienTap(thamSo, minPct), thamSo.location, null]);\n  const goc", kiem, /CG17-AC-5 ô \{"project"/);
});

test("CG17-AC-7 đường lấy danh sách kiểm phiên, bỏ liên hệ và nội dung theo vai, chạy trên cloud", async () => {
  await assert.rejects(() => goiAction(null, "x-0"), /Cần đăng nhập ops/, "CG17-AC-7 người chưa đăng nhập phải bị từ chối");
  await assert.rejects(() => goiAction("user", "x-0"), /Cần đăng nhập ops/, "CG17-AC-7 vai không có quyền Ops phải bị từ chối");
  const kiem = async () => {
    const xem = await goiAction("viewer", "x-0");
    assert.equal(xem!.can.length, 20, "đối chứng: vai Người xem có danh sách");
    const lo = (d: Record<string, unknown>) => [coSoCay(d) && "SĐT", JSON.stringify(d).includes(TEN) && "tên", JSON.stringify(d).includes(BAI) && "chữ bài",
      JSON.stringify(d).includes(DUONG) && "đường", JSON.stringify(d).includes(TOA) && "toà", JSON.stringify(d).includes("anh.thu") && "ảnh"].filter(Boolean);
    for (const d of xem!.can) assert.deepEqual(lo(d), [], `CG17-AC-7 vai Người xem lộ trường ở căn ${d.offerId}`);
    const ops = await goiAction("ops", "x-0");
    assert.ok(ops!.can.some((d) => coSoCay(d)) && ops!.can.some((d) => JSON.stringify(d).includes(TEN)), "đối chứng dương: vai Vận hành nhận SĐT, tên");
  };
  await kiem();
  // Đột biến: bản chép của action bỏ bước lọc theo vai → vai Người xem phải lộ SĐT.
  const goc = readFileSync(join(APP, "src/app/ops/deals/actions.ts"), "utf8");
  const tu = "dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung })";
  assert.ok(goc.includes(tu), "đột biến không áp được: bước lọc theo vai");
  mkdirSync(CHEP, { recursive: true });
  const f = join(CHEP, `action-dot-bien-${++nChep}.ts`);
  writeFileSync(f, goc.replace(tu, "d").replace(`"use server";`, "")
    .replace(DONG_PHIEN, `const getSessionUser = async () => ({ id: 1, email: "viewer@cg17.test", role: "viewer" }) as never;`));
  const dotBienAction = await import(pathToFileURL(f).href);
  const loRa = await qua(() => dotBienAction.layCanCungTieuChi("x-0", {}, false) as Promise<{ can: Record<string, unknown>[] }>);
  await assert.rejects(async () => {
    for (const d of loRa.can) assert.ok(!coSoCay(d), `CG17-AC-7 vai Người xem lộ trường ở căn ${d.offerId}`);
  }, /CG17-AC-7 vai Người xem lộ trường/, "đột biến bỏ bước lọc theo vai phải bị bắt");
  const cloud = await trenCloud(async () => {
    const kq = await goiAction("ops", "x-0");
    const trang = (await docTrang(TS())).trang;
    return { tong: kq!.tong, n: kq!.can.length, so: trang.cungTieuChi?.["x-0"] };
  });
  assert.deepEqual(cloud, { tong: 27, n: 20, so: { tieuChi: 27, phuong: 27 } }, "CG17-AC-7 trên lược đồ cloud số và danh sách vẫn chạy");
});

test("CG17-AC-10 crumb «Căn giá tốt» ở trang một căn về đúng trang chứa căn", async () => {
  const tap = (await hetTrang(TS())).map((x) => x.rows.map((d) => d.offerId));
  const trangCua = (id: string) => tap.findIndex((x) => x.includes(id)) + 1;
  const { rows: cu } = await c.query(`SELECT offer_id FROM (${m.deals.dealsSql({ cloud: true, coBang: true })}) ds`, [5, 30]);
  const ngoaiCu = tap.slice(2).flat().find((id) => !cu.some((r) => r.offer_id === id));
  assert.ok(ngoaiCu, "đối chứng: phải có căn ở trang 3 trở đi nằm ngoài 30 căn đầu của danh sách cũ");
  const dau = tap[0][0];
  const kiem = async () => {
    for (const [id, ky] of [[dau, `/ops/deals?can=${dau}`], [ngoaiCu, `/ops/deals?page=${trangCua(ngoaiCu)}&can=${ngoaiCu}`], ["r-1", "/ops/deals?kind=rent&can=r-1"]] as const) {
      const href = await crumbCua(id);
      assert.equal(href, ky, `CG17-AC-10 căn ${id}: crumb mong ${ky}, có ${href}`);
      const sp = Object.fromEntries(new URL(href, "http://x").searchParams);
      const luoi = await veDanhSach(sp).catch((e: Error) => { throw new Error(`CG17-AC-10 căn ${id}: danh sách chuyển hướng (${e.message})`); });
      assert.ok(luoi.rows.some((d) => d.offerId === id) && luoi.moBanDau === id, `CG17-AC-10 căn ${id}: danh sách phải mở sheet ở căn đó`);
    }
  };
  await kiem();
  await c.query("BEGIN");
  try {
    await c.query("UPDATE offer_price_rank SET duoi_trung_vi_pct = 4 WHERE offer_id = 'z-0'");
    assert.equal(await crumbCua("z-0"), "/ops/deals", "CG17-AC-10 căn rời tập về /ops/deals");
  } finally { await c.query("ROLLBACK"); }
  const thayCu = { tu: "const veDanhSach = await duongVeDanhSach(d.offerId, d.roiDanhSach);", thanh: "const veDanhSach = !d.roiDanhSach && (await dealTrongDanhSach(d.offerId)) ? `/ops/deals?can=${encodeURIComponent(d.offerId)}` : \"/ops/deals\";" };
  const href = await crumbCua(ngoaiCu, thayCu);
  assert.notEqual(href, `/ops/deals?page=${trangCua(ngoaiCu)}&can=${ngoaiCu}`, `CG17-AC-10 đột biến giữ dealTrongDanhSach cũ phải lệch ở căn ${ngoaiCu} (href ${href})`);
});
