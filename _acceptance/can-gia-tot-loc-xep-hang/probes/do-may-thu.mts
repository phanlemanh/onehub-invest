// Đo màn Căn giá tốt trên DB máy thu bằng đúng hàm đọc của màn, đối chiếu lệnh đếm độc lập dem-tap-can.mjs và SQL riêng.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const noi = dirname(fileURLToPath(import.meta.url));
const app = resolve(noi, "../../../app");
const nap = (r: string) => import(pathToFileURL(resolve(app, r)).href);
const { getDealsTrang, dealsNheSql } = await nap("src/lib/deals.ts");
const { docThamSoDeal } = await nap("src/lib/deals-chi-tiet.ts");
const { pool } = await nap("src/lib/db.ts");

const dem = (ma?: string) => JSON.parse(execFileSync("node", [resolve(noi, "dem-tap-can.mjs"), ...(ma ? [ma] : [])], { encoding: "utf8" }));
const hong: string[] = [];
const kiem = (ten: string, dat: boolean, chi: unknown) => { console.log(`${dat ? "đạt" : "HỎNG"} ${ten}: ${JSON.stringify(chi)}`); if (!dat) hong.push(ten); };

if (process.argv.includes("--doi-chung-thu-tu")) {
  const cu = dealsNheSql().replace("(g.cap = 'du_an') DESC, g.hang_pct ASC NULLS LAST, g.discount_pct DESC", "g.discount_pct DESC");
  const { rows } = await pool.query(cu, ["sale", 5, null]);
  const n = rows.slice(0, 15).filter((r: { cap: string }) => r.cap === "du_an").length;
  console.log(`đối chứng thứ tự cũ: ${n}/15 dòng đầu cấp dự án`);
  await pool.end();
  process.exit(n === 0 ? 3 : 0);
}

const t0 = Date.now();
const dau = await getDealsTrang(docThamSoDeal({}), true);
const ms = Date.now() - t0;
const tap = dem();
kiem("15/15 dòng đầu Giá tốt cấp dự án", dau.rows.length === 15 && dau.rows.every((d: any) => d.rank?.level === "du_an" && d.rank?.label === "gia-tot"), dau.rows.length);
kiem("tab Tất cả bằng lệnh đo", dau.trang.dem.all === tap.tong, [dau.trang.dem.all, tap.tong]);
kiem("tab Cần xác minh bằng lệnh đo", dau.trang.dem["xac-minh"] === tap.can_xac_minh, [dau.trang.dem["xac-minh"], tap.can_xac_minh]);
kiem("ba tab cộng lại bằng Tất cả", dau.trang.dem.du + dau.trang.dem["xac-minh"] + dau.trang.dem.thieu === dau.trang.dem.all, dau.trang.dem);
kiem("đọc dưới 3 giây", ms < 3000, ms);
const op = await getDealsTrang(docThamSoDeal({ project: "1" }), true);
const dem1 = dem("1");
kiem("dự án 1 bằng lệnh đo", op.trang.dem.all === dem1.tong, [op.trang.dem.all, dem1.tong]);

const ma = new Set<string>();
for (let page = 1; page <= Math.ceil(dau.trang.tong / 50); page++) {
  const t = await getDealsTrang(docThamSoDeal({ page: String(page), size: "50" }), true);
  t.rows.forEach((d: any) => ma.add(d.offerId));
}
kiem("đi hết các trang đủ mã phân biệt", ma.size === dau.trang.tong, [ma.size, dau.trang.tong]);

const { rows: nhe } = await pool.query(dealsNheSql(), ["sale", 5, null]);
const lech: string[] = [];
for (const t of dau.trang.cay) {
  if (nhe.filter((r: any) => `area:${r.parent_id ?? r.area_id}` === t.value).length !== t.count) lech.push(t.value);
  for (const n of t.children ?? []) for (const m of n.children ?? []) {
    const [loai, k] = m.value.split(":");
    const so = nhe.filter((r: any) => (loai === "area" ? r.area_id === k : r.cap === "du_an" && r.nut === k)).length;
    if (so !== m.count) lech.push(m.value);
  }
}
kiem("mọi mục của cây có số bằng số căn khi chọn", lech.length === 0, lech.slice(0, 5));
kiem("tổng các tỉnh bằng tổng tập", dau.trang.cay.reduce((s: number, t: any) => s + t.count, 0) === tap.tong, dau.trang.cay.length);
await pool.end();
if (hong.length) { console.error(`HỎNG ${hong.length}: ${hong.join("; ")}`); process.exit(1); }
