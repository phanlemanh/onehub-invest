// refresh-data-flow.mjs — DF1 `dong-chay-len-cloud`: chạy một tệp pipeline/sql/*.sql (ở cloud-sync: 600_data_flow.sql)
// trên DB local bằng pg — không cần psql/docker trong PATH của launchd. Bước `refresh-data-flow` của scripts/cloud-sync.sh:
// tệp tự mở/đóng giao dịch, chạy một lượt simple-query. In một dòng thời gian; lỗi → mã 1 (job_run ghi `JOB FAIL`).
// DF6 (`bai-nhan-tru-bai-chi-anh`): trước khi chạy tệp, nạp nhánh từng bài S03 (ảnh đã ghép, Yêu cầu, ảnh chưa ghép —
// lib/nhanh-bai-s03.mjs) vào bảng tạm của CÙNG phiên; 600 đọc bảng ấy. Chạy 600 trần (không qua đây) thì khối không có ba khoá nhánh.
import { readFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { napNhanhBai } from "./lib/nhanh-bai-s03.mjs";

const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/**
 * Nạp nhánh bài S03 rồi chạy `sql` trên client `c` (đã nối). Đường duy nhất của bước làm tươi — CLI và phép đo cùng gọi.
 * @param {import("pg").Client} c
 * @param {string} sql
 * @returns {Promise<Record<string, number>>} số bài theo nhánh
 */
export async function chayLamTuoi(c, sql) {
  const dem = await napNhanhBai(c);
  await c.query(sql);
  return dem;
}

async function main() {
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
    const dem = await chayLamTuoi(client, sql);
    console.log(
      `refresh-data-flow: ${path.basename(file)} xong trong ${((performance.now() - t0) / 1000).toFixed(2)} giây — nhánh bài S03 ${JSON.stringify(dem)}`,
    );
  } catch (e) {
    console.error(`refresh-data-flow: ${path.basename(file)} lỗi: ${String(e?.message ?? e).split("\n")[0]}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
