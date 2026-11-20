// Đo trên DB máy thu, CHỈ ĐỌC (hồ sơ can-cung-tieu-chi-toan-tap, AC-9). Mọi câu của màn chạy trong MỘT giao dịch REPEATABLE READ READ ONLY;
// lệnh đếm độc lập chạy ở kết nối thứ hai nhận đúng snapshot ấy (pg_export_snapshot → SET TRANSACTION SNAPSHOT), viết SQL riêng, không
// import hàm của màn. Thời gian đo SAU các phép so, ba lần mỗi số, ghi tải máy. Dùng: node --import tsx <tệp> [--doi-chung-trong-trang]
import { loadavg } from "node:os";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { createElement, Suspense, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import pg from "pg";

const GOC = process.env.CG17_GOC ?? resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = join(GOC, "app");
const URL_DB = process.env.MAY_THU_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DOI_CHUNG = process.argv.includes("--doi-chung-trong-trang");
const DU_AN = "1";

const loi: string[] = [];
const ghi = (k: string, v: unknown) => console.log(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
const kiem = (dung: boolean, cau: string) => { if (!dung) loi.push(cau); ghi(dung ? "ĐẠT" : "LỆCH", cau); };

const c = new pg.Client({ connectionString: URL_DB });
const doc = new pg.Client({ connectionString: URL_DB });
await c.connect();
await doc.connect();
await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
const { rows: [{ snap }] } = await c.query("SELECT pg_export_snapshot() AS snap");
await doc.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
await doc.query(`SET TRANSACTION SNAPSHOT '${snap}'`);
ghi("snapshot", snap);

// Mọi lời gọi pool của màn đi qua giao dịch c.
const { pool } = await import(pathToFileURL(join(APP, "src/lib/db.ts")).href);
pool.query = ((...a: unknown[]) => (c.query as (...x: unknown[]) => unknown)(...a)) as typeof pool.query;
const deals = await import(pathToFileURL(join(APP, "src/lib/deals.ts")).href);
type TS = { location: string | null; project: string | null; type: string | null; kind: "sale" | "rent"; tab: "all"; page: number; size: number };
const TS = (p: Partial<TS> = {}): TS => ({ location: null, project: null, type: null, kind: "sale", tab: "all", page: 1, size: 15, ...p });

/** Tập độc lập: tin có nhãn, 45 ngày, dưới trung vị 5–50%, mỗi căn lấy tin thấy sau cùng. */
const TAP = (loc = "true") => `WITH tin AS (
    SELECT o.offer_id, o.area_id, o.property_type, o.area_m2::float8 AS m2, coalesce(h.can_xac_minh, false) AS xm, h.cap, h.nut, h.nhan, o.last_seen,
           coalesce((SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id), o.offer_id) AS can
      FROM offer_price_rank h JOIN sale_offers o ON o.offer_id = h.offer_id
     WHERE h.kind = $1 AND h.nhan IS NOT NULL AND o.last_seen >= now() - interval '45 days' AND h.duoi_trung_vi_pct BETWEEN 5 AND 50
  ), loc AS (SELECT * FROM tin WHERE ${loc}),
  tap AS (SELECT DISTINCT ON (can) * FROM loc ORDER BY can, last_seen DESC, offer_id)`;
const demDocLap = async (kind: string, duAn: string | null = null) => (await doc.query(`${TAP(duAn ? "cap = 'du_an' AND nut = $2" : "true")}
  SELECT count(*)::int AS tong, count(*) FILTER (WHERE xm)::int AS xm FROM tap`, duAn ? [kind, duAn] : [kind])).rows[0] as { tong: number; xm: number };
/** Số căn cùng tiêu chí và cùng phường của từng mã, đếm độc lập trên toàn tập không lọc. */
async function cungDocLap(kind: string, ids: string[]): Promise<Map<string, [number, number]>> {
  const { rows } = await doc.query(`${TAP()}
    SELECT a.offer_id,
      (SELECT count(*) FROM tap b WHERE b.can <> a.can AND b.area_id = a.area_id
         AND (a.property_type IS NULL OR a.property_type = 'unknown' OR b.property_type = a.property_type)
         AND (a.m2 IS NULL OR (b.m2 IS NOT NULL AND b.m2 BETWEEN a.m2 * 0.75 AND a.m2 * 1.25)))::int AS tieu_chi,
      (SELECT count(*) FROM tap b WHERE b.can <> a.can AND b.area_id = a.area_id)::int AS phuong
    FROM tap a WHERE a.offer_id = ANY($2) AND a.area_id IS NOT NULL`, [kind, ids]);
  return new Map(rows.map((r) => [r.offer_id as string, [r.tieu_chi as number, r.phuong as number]]));
}

try {
  // 1. Màn không lọc: 15/15 dòng đầu là Giá tốt cấp dự án.
  const t1 = await deals.getDealsTrang(TS());
  const dau = t1.rows.map((d: { rank?: { level: string; label: string } | null }) => d.rank);
  const soDau = dau.filter((r: { level: string; label: string } | null) => r?.level === "du_an" && r?.label === "gia-tot").length;
  kiem(soDau === 15, `15/15 dòng đầu là Giá tốt cấp dự án (đo ${soDau}/15)`);
  // 2. Số trên tab khớp lệnh đếm độc lập.
  const dl = await demDocLap("sale");
  kiem(t1.trang.dem.all === dl.tong && t1.trang.dem["xac-minh"] === dl.xm, `tab Tất cả ${t1.trang.dem.all} = ${dl.tong}, Cần xác minh ${t1.trang.dem["xac-minh"]} = ${dl.xm}`);
  // 3. Dự án 1.
  const tDa = await deals.getDealsTrang(TS({ project: DU_AN }));
  const dlDa = await demDocLap("sale", DU_AN);
  kiem(tDa.trang.dem.all === dlDa.tong, `dự án ${DU_AN}: tab Tất cả ${tDa.trang.dem.all} = ${dlDa.tong}`);
  // 4. Đi hết các trang cỡ 50.
  const ma = new Set<string>();
  for (let p = 1; p <= Math.ceil(t1.trang.tong / 50); p++) for (const d of (await deals.getDealsTrang(TS({ page: p, size: 50 }))).rows) ma.add(d.offerId);
  kiem(ma.size === t1.trang.tong, `đi hết các trang cỡ 50: ${ma.size} mã phân biệt = tong ${t1.trang.tong}`);
  // 5. «Căn cùng tiêu chí» của mọi dòng trang 1 cỡ 15 và 50.
  for (const size of [15, 50]) {
    const t = await deals.getDealsTrang(TS({ size }));
    const ids: string[] = t.rows.map((d: { offerId: string }) => d.offerId);
    const ky = await cungDocLap("sale", ids);
    const trongTrang = (id: string) => {
      const d = t.rows.find((x: { offerId: string }) => x.offerId === id);
      return t.rows.filter((x: { offerId: string; phuong: string | null; propertyType: string | null; areaM2: number | null }) => x.offerId !== id && x.phuong === d.phuong
        && (!d.propertyType || d.propertyType === "unknown" || x.propertyType === d.propertyType)
        && (!d.areaM2 || (x.areaM2 !== null && x.areaM2 >= d.areaM2 * 0.75 && x.areaM2 <= d.areaM2 * 1.25))).length;
    };
    const so = (id: string) => DOI_CHUNG ? trongTrang(id) : t.trang.cungTieuChi?.[id]?.tieuChi;
    const lech = ids.filter((id) => so(id) !== ky.get(id)?.[0]);
    const khong = ids.filter((id) => so(id) === 0).length, khongDung = ids.filter((id) => ky.get(id)?.[0] === 0).length;
    ghi(`cỡ ${size}`, { dong_hien_0: khong, lenh_dem_ra_0: khongDung, tong_hien: ids.reduce((s, id) => s + (so(id) ?? 0), 0), tong_dung: ids.reduce((s, id) => s + (ky.get(id)?.[0] ?? 0), 0) });
    kiem(lech.length === 0, `cỡ ${size}: số «Căn cùng tiêu chí» của ${ids.length - lech.length}/${ids.length} dòng bằng lệnh đếm${lech.length ? ` (lệch: ${lech.slice(0, 5).join(", ")})` : ""}`);
  }
  if (DOI_CHUNG) { ghi("đối chứng", "đếm trong trang (cách cũ)"); }
  else {
    // 6. Thời gian, đo riêng sau các phép so: HTML của /ops/deals phía máy chủ, và danh sách cùng tiêu chí của căn thuê nhiều căn nhất.
    const CHEP = join(APP, ".next", "cache", `cg17-do-may-thu-${process.pid}`);
    mkdirSync(CHEP, { recursive: true });
    const dong = `import { getSessionUser } from "@/lib/auth";`;
    const f = join(CHEP, "page.tsx");
    writeFileSync(f, `import React from "react";\n` + readFileSync(join(APP, "src/app/ops/deals/page.tsx"), "utf8")
      .replace(dong, `const getSessionUser = async () => ({ id: 1, email: "admin@do.test", role: "admin" }) as never;`)
      );
    const trang = await import(pathToFileURL(f).href);
    const { AppRouterContext } = await import(pathToFileURL(join(APP, "node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js")).href);
    const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
    type PT = ReactElement<Record<string, unknown>>;
    const tim = (n: ReactNode, k: (e: PT) => boolean): PT | null => {
      if (Array.isArray(n)) { for (const x of n) { const r = tim(x, k); if (r) return r; } return null; }
      if (!isValidElement(n)) return null;
      return k(n as PT) ? n as PT : tim((n as PT).props.children as ReactNode, k);
    };
    const html = async () => {
      const a = performance.now();
      const cay = await trang.default({ searchParams: Promise.resolve({}) }) as ReactNode;
      const nd = tim(cay, (e) => e.type === Suspense)!.props.children as PT;
      const ra = await (nd.type as (p: unknown) => Promise<ReactNode>)(nd.props);
      const chu = renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router as never }, ra));
      return { ms: performance.now() - a, byte: chu.length };
    };
    const { rows: [lon] } = await doc.query(`${TAP()}
      SELECT a.offer_id, (SELECT count(*) FROM tap b WHERE b.can <> a.can AND b.area_id = a.area_id
        AND (a.property_type IS NULL OR a.property_type = 'unknown' OR b.property_type = a.property_type)
        AND (a.m2 IS NULL OR (b.m2 IS NOT NULL AND b.m2 BETWEEN a.m2 * 0.75 AND a.m2 * 1.25)))::int AS n
      FROM tap a ORDER BY n DESC, a.offer_id LIMIT 1`, ["rent_lt"]);
    const tab = async () => { const a = performance.now(); const k = await deals.getCanCungTieuChi(lon.offer_id, TS({ kind: "rent" })); return { ms: performance.now() - a, tong: k.tong }; };
    const tai = loadavg()[0];
    const doHtml = [await html(), await html(), await html()], doTab = [await tab(), await tab(), await tab()];
    const tv = (x: number[]) => [...x].sort((a, b) => a - b)[1];
    const msHtml = tv(doHtml.map((x) => x.ms)), msTab = tv(doTab.map((x) => x.ms));
    ghi("tải máy (1 phút)", tai.toFixed(2));
    ghi("HTML /ops/deals phía máy chủ (ms, ba lần)", doHtml.map((x) => Math.round(x.ms)));
    ghi(`danh sách cùng tiêu chí căn thuê ${lon.offer_id} (${lon.n} căn, ms, ba lần)`, doTab.map((x) => Math.round(x.ms)));
    kiem(doTab[0].tong === lon.n, `tổng danh sách của căn thuê ${lon.offer_id} = lệnh đếm ${lon.n}`);
    kiem(msHtml < 3000, `HTML /ops/deals trung vị ${Math.round(msHtml)} ms < 3000`);
    kiem(msTab < 1500, `danh sách cùng tiêu chí trung vị ${Math.round(msTab)} ms < 1500`);
    rmSync(CHEP, { recursive: true, force: true });
  }
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await doc.query("ROLLBACK").catch(() => {});
  await c.end(); await doc.end(); await pool.end().catch(() => {});
}
ghi("kết quả", loi.length ? `LỆCH ${loi.length}` : "ĐẠT");
process.exit(loi.length ? 1 : 0);
