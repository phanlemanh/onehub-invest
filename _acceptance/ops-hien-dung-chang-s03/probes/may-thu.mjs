// may-thu.mjs — hồ sơ ops-hien-dung-chang-s03, E3 (AC-3): số «Khớp toà» và «chờ khớp» của S03 trên BẢN CHÉP dữ liệu thật của riêng
// lượt (db/db-thu.sh oneinvest_suite_on25_that --chay). Chạy lượt làm tươi thật (chayLamTuoi) với 600 của nhánh rồi với 600 của
// merge-base trên cùng bản chép, in số cạnh nhau. Từ chối chạy trên DB chung `oneinvest`. Gốc kho suy từ vị trí tệp.
// Đợt B: bảy dòng «ngày · tin rao mới · tin có bài hôm đó» của luong7() thật trên cùng bản chép; ngày nào tin rao mới vượt tin có
// bài thì thoát khác 0, nêu ngày.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const GOC = join(import.meta.dirname, "..", "..", "..");
const url = process.env.DATABASE_URL ?? "";
const db = url ? new URL(url).pathname.slice(1) : "";
if (!/^oneinvest_suite_[a-z0-9_]+$/.test(db)) {
  console.error(`may-thu: DATABASE_URL phải trỏ DB của riêng lượt oneinvest_suite_*, thấy «${db || "trống"}» — không chạy trên DB chung`);
  process.exit(2);
}
const pg = (await import(pathToFileURL(join(GOC, "pipeline/node_modules/pg/lib/index.js")).href)).default;
const { chayLamTuoi } = await import(pathToFileURL(join(GOC, "pipeline/refresh-data-flow.mjs")).href);
const { luong7 } = await import(pathToFileURL(join(GOC, "pipeline/lib/ops-flow.mjs")).href);

const base = process.env.ON25_BASE || execFileSync("git", ["-C", GOC, "merge-base", "HEAD", "origin/main"], { encoding: "utf8" }).trim();
const sqlNhanh = readFileSync(join(GOC, "pipeline/sql/600_data_flow.sql"), "utf8");
const sqlGoc = execFileSync("git", ["-C", GOC, "show", `${base}:pipeline/sql/600_data_flow.sql`], { encoding: "utf8" });

const c = new pg.Client({ connectionString: url });
await c.connect();
const doc = async () => {
  const { rows: [m] } = await c.query(`SELECT (facts->'milestones'->-1->>'building_linked')::int AS bl,
      (SELECT (s->>'locatedPending')::int FROM jsonb_array_elements(facts->'sources') s WHERE s->>'source' = 'S03') AS lp
    FROM data_flow_snapshot WHERE time_window = 'all'`);
  return m;
};
let loi = 0;
try {
  const { rows: [y] } = await c.query(`SELECT count(*)::int AS n FROM offer_building ob JOIN sale_offers o USING (offer_id)
    WHERE o.source = 'S03' AND ob.status = 'gan' AND ob.muc = 'toa'`);
  await chayLamTuoi(c, sqlGoc);
  const truoc = await doc();
  await chayLamTuoi(c, process.env.ON25_SQL_DO ? sqlGoc : sqlNhanh);
  const sau = await doc();
  console.log(`building_linked hôm nay = ${sau.bl} · offer_building gan/toa S03 sống = ${y.n} (trước sửa ${truoc.bl})`);
  console.log(`locatedPending S03 all = ${sau.lp} (trước sửa ${truoc.lp})`);
  if (!(y.n > 0 && sau.bl === y.n)) { console.error(`may-thu: building_linked ${sau.bl} ≠ ${y.n}`); loi++; }
  if (!(sau.lp < truoc.lp)) { console.error(`may-thu: locatedPending ${sau.lp} không nhỏ hơn ${truoc.lp}`); loi++; }
  const days = await luong7(c);
  let lon = 0;
  for (const d of days) {
    console.log(`${d.day} · tin rao mới ${d.s03Offers} · tin có bài hôm đó ${d.s03ActiveOffers}`);
    if (d.s03Offers > d.s03ActiveOffers) { console.error(`may-thu: ngày ${d.day} tin rao mới ${d.s03Offers} > tin có bài ${d.s03ActiveOffers}`); loi++; }
    if (d.s03ActiveOffers > d.s03Offers) lon++;
  }
  if (lon === 0) { console.error("may-thu: không ngày nào tin có bài lớn hơn tin rao mới — chuỗi mới không thêm gì"); loi++; }
} finally {
  await c.end();
}
process.exit(loi ? 1 : 0);
