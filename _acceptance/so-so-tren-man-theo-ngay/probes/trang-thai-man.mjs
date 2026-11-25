// trang-thai-man.mjs — đổi vùng số mốc của DB thử sang một trạng thái để xem màn SM1. Chỉ ghi `data_flow_snapshot` của DB oneinvest_u2_sm1.
//   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_sm1 node _acceptance/so-so-tren-man-theo-ngay/probes/trang-thai-man.mjs <du|mot-ngay|trong|thieu-khoa>
// `du` có cờ «Đứng yên 2 ngày» ở ba ô. Số các ngày trước là số chèn tay, không phải số đo.
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(join(import.meta.dirname, "../../../pipeline/package.json"));
const pg = require("pg");

const trangThai = process.argv[2];
const SQL = {
  du: `jsonb_set(facts, '{milestones}', $1::jsonb)`,
  "mot-ngay": `jsonb_set(facts, '{milestones}', jsonb_build_array($1::jsonb -> -1))`,
  trong: `jsonb_set(facts, '{milestones}', '[]'::jsonb)`,
  "thieu-khoa": `facts - 'milestones'`,
};
if (!SQL[trangThai]) {
  console.error(`trạng thái phải là: ${Object.keys(SQL).join(", ")}`);
  process.exit(2);
}
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
  if (db !== "oneinvest_u2_sm1") {
    console.error(`từ chối: DB ${db} không phải DB thử oneinvest_u2_sm1`);
    process.exit(2);
  }
  const { rows } = await c.query(`SELECT detail::jsonb AS j FROM dq_check_results WHERE check_name = 's03-moc-ngay' ORDER BY detail::jsonb ->> 'ngay' DESC LIMIT 30`);
  const chuoi = JSON.stringify(rows.map((r) => r.j).reverse());
  const dungThamSo = SQL[trangThai].includes("$1");
  const r = await c.query(`UPDATE data_flow_snapshot SET facts = ${SQL[trangThai]}, computed_at = now()`, dungThamSo ? [chuoi] : []);
  console.log(`${trangThai}: đã đổi ${r.rowCount} cửa sổ`);
} finally {
  await c.end();
}
