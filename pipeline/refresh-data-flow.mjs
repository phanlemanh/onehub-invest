// refresh-data-flow.mjs — DF1 `dong-chay-len-cloud`: chạy một tệp pipeline/sql/*.sql (ở cloud-sync: 600_data_flow.sql)
// trên DB local bằng pg — không cần psql/docker trong PATH của launchd. Bước `refresh-data-flow` của scripts/cloud-sync.sh:
// tệp tự mở/đóng giao dịch, chạy một lượt simple-query. In một dòng thời gian; lỗi → mã 1 (job_run ghi `JOB FAIL`).
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const file = process.argv[2];
if (!file) {
  console.error("cách dùng: node refresh-data-flow.mjs <tệp .sql>");
  process.exit(2);
}
const sql = await readFile(file, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? LOCAL_URL });
const t0 = performance.now();
try {
  await client.connect();
  await client.query(sql);
  console.log(`refresh-data-flow: ${path.basename(file)} xong trong ${((performance.now() - t0) / 1000).toFixed(2)} giây`);
} catch (e) {
  console.error(`refresh-data-flow: ${path.basename(file)} lỗi: ${String(e?.message ?? e).split("\n")[0]}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
