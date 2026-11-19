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
  const { rows } = await pool.query(cu, ["sale", 5, null, null, null]);
  const n = rows.slice(0, 15).filter((r: { cap: string }) => r.cap === "du_an").length;
  console.log(`đối chứng thứ tự cũ: ${n}/15 dòng đầu cấp dự án`);
  await pool.end();
  process.exit(n === 0 ? 3 : 0);
}

// Tải máy đi kèm phép đo thời gian, để người đọc biết số giây đo trong điều kiện nào.
const taiTruoc = (await import("node:os")).loadavg().map((x) => x.toFixed(1));
const t0 = Date.now();
const dau = await getDealsTrang(docThamSoDeal({}));
const ms = Date.now() - t0;
console.log(`tải máy lúc đo (1, 5, 15 phút): ${taiTruoc.join(" · ")}`);
const tap = dem();
kiem("15/15 dòng đầu Giá tốt cấp dự án", dau.rows.length === 15 && dau.rows.every((d: any) => d.rank?.level === "du_an" && d.rank?.label === "gia-tot"), dau.rows.length);
kiem("tab Tất cả bằng lệnh đo", dau.trang.dem.all === tap.tong, [dau.trang.dem.all, tap.tong]);
kiem("tab Cần xác minh bằng lệnh đo", dau.trang.dem["xac-minh"] === tap.can_xac_minh, [dau.trang.dem["xac-minh"], tap.can_xac_minh]);
kiem("ba tab cộng lại bằng Tất cả", dau.trang.dem.du + dau.trang.dem["xac-minh"] + dau.trang.dem.thieu === dau.trang.dem.all, dau.trang.dem);
kiem("đọc dưới 3 giây", ms < 3000, ms);
const op = await getDealsTrang(docThamSoDeal({ project: "1" }));
const dem1 = dem("1");
kiem("dự án 1 bằng lệnh đo", op.trang.dem.all === dem1.tong, [op.trang.dem.all, dem1.tong]);

const ma = new Set<string>();
for (let page = 1; page <= Math.ceil(dau.trang.tong / 50); page++) {
  const t = await getDealsTrang(docThamSoDeal({ page: String(page), size: "50" }));
  t.rows.forEach((d: any) => ma.add(d.offerId));
}
kiem("đi hết các trang đủ mã phân biệt", ma.size === dau.trang.tong, [ma.size, dau.trang.tong]);

// Số căn của từng nút tính độc lập bằng SQL riêng: lọc tin theo nút trước, rồi đếm căn phân biệt.
const { rows: tin } = await pool.query(`SELECT coalesce((SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id), o.offer_id) AS can,
    o.area_id, a.parent_id, h.cap, h.nut
  FROM offer_price_rank h JOIN sale_offers o ON o.offer_id = h.offer_id LEFT JOIN areas a ON a.id = o.area_id
  WHERE h.kind = 'sale' AND h.nhan IS NOT NULL AND o.last_seen >= now() - interval '45 days' AND h.duoi_trung_vi_pct >= 5 AND h.duoi_trung_vi_pct <= 50`);
const soCan = (loc: (r: any) => boolean) => new Set(tin.filter(loc).map((r: any) => r.can)).size;
const lech: string[] = [];
const nutChon: [string, Record<string, string>, number][] = [];
for (const t of dau.trang.cay) {
  const maTinh = t.value.split(":")[1];
  const soTinh = soCan((r: any) => r.area_id === maTinh || r.parent_id === maTinh);
  if (soTinh !== t.count) lech.push(t.value);
  nutChon.push([t.value, { location: maTinh }, t.count]);
  for (const n of t.children ?? []) for (const m of n.children ?? []) {
    const [loai, k] = m.value.split(":");
    const so = soCan((r: any) => (loai === "area" ? r.area_id === k : r.cap === "du_an" && r.nut === k));
    if (so !== m.count) lech.push(m.value);
    nutChon.push([m.value, loai === "area" ? { location: k } : { project: k }, m.count]);
  }
}
// Chọn lại từng mục của cây (tỉnh, phường, dự án) bằng đúng hàm đọc của màn: số trên tab phải bằng số in trên mục.
const sai: string[] = [];
const hang = [...nutChon];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let x = hang.shift(); x; x = hang.shift()) {
    const [v, sp, so] = x;
    if ((await getDealsTrang(docThamSoDeal(sp))).trang.dem.all !== so) sai.push(v);
  }
}));
kiem("mọi mục của cây: số khi chọn mục bằng số trên mục", sai.length === 0 && nutChon.length > 0, { doc: nutChon.length, tinh: dau.trang.cay.length, sai: sai.slice(0, 5) });
const dem251 = dem("251");
const op251 = await getDealsTrang(docThamSoDeal({ project: "251" }));
kiem("dự án 251 bằng lệnh đo", op251.trang.dem.all === dem251.tong, [op251.trang.dem.all, dem251.tong]);
kiem("mọi mục của cây có số bằng số đếm độc lập", lech.length === 0, lech.slice(0, 5));
kiem("tổng các tỉnh bằng tổng tập", dau.trang.cay.reduce((s: number, t: any) => s + t.count, 0) === tap.tong, dau.trang.cay.length);
await pool.end();
if (hong.length) { console.error(`HỎNG ${hong.length}: ${hong.join("; ")}`); process.exit(1); }
