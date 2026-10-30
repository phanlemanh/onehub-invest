// dung-nguoi.mjs — DB2b: dựng danh bạ Người + vai người đăng một lượt (vận hành tay; chạy đêm đi qua refresh-bait-gap.mjs).
// Mặc định COMMIT; `--thu` chạy trong giao dịch rồi ROLLBACK (xem số, không ghi).
import pg from "pg";

import { dungNguoi } from "./lib/danh-ba-nguoi.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const thu = process.argv.includes("--thu");

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  await c.query("BEGIN");
  const kq = await dungNguoi(c);
  console.log(JSON.stringify(kq));
  await c.query(thu ? "ROLLBACK" : "COMMIT");
  console.log(thu ? "--thu: ROLLBACK, không ghi" : "COMMIT");
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error(e);
  process.exitCode = 1;
} finally {
  await c.end();
}
