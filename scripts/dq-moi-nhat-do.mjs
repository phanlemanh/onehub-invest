#!/usr/bin/env node
// Đo bảng «Kiểm chất lượng» của /ops/quality trên dữ liệu thật của DB local (hồ sơ dq-moi-nhat-moi-kiem, ON9 — đường đo
// của ngưỡng hàng). Chỉ đọc. Dùng ĐÚNG hàm của app (loadDqChecks, dqResult) — không chép câu SQL hay bảng nhãn.
// Dùng (cần tsx của app để nạp dq-checks.ts): cd app && node --import tsx ../scripts/dq-moi-nhat-do.mjs
import { createRequire } from "node:module";

import { dqResult, loadDqChecks } from "../app/src/lib/dq-checks.ts";

const require = createRequire(new URL("../app/package.json", import.meta.url));
const pg = require("pg");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const CU = `SELECT check_name, entity, status, detail, checked_at::text FROM dq_check_results
     WHERE checked_at > now() - interval '7 days' ORDER BY checked_at DESC LIMIT 20`;

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  const { rows, stats } = await loadDqChecks(c);
  console.log(stats.labels.join(" · "));
  const loai = new Set(rows.map((r) => r.check_name));
  check(loai.size >= 2, `từ hai loại kiểm trở lên (${loai.size})`);
  const cap = rows.map((r) => `${r.check_name}|${r.entity}`);
  check(new Set(cap).size === cap.length, "mỗi (kiểm, đối tượng) một dòng");
  check(stats.checks === loai.size, `số kiểm = số loại kiểm (${stats.checks})`);
  const thamChieu = rows.filter((r) => r.check_name === "truthful-coverage");
  check(thamChieu.length > 0, `có ${thamChieu.length} dòng kiểm độ phủ tham chiếu`);
  const xanh = thamChieu.filter((r) => {
    const k = dqResult(r.check_name, r.status);
    return k.label === "Đạt" || k.variant === "success-light";
  });
  check(xanh.length === 0, `không dòng kiểm độ phủ tham chiếu nào mang «Đạt» hay success-light (${xanh.length})`);
  // Đối chứng: câu cũ LIMIT 20 trên cùng DB cho ít loại kiểm hơn.
  const cu = new Set((await c.query(CU)).rows.map((r) => r.check_name));
  check(cu.size < loai.size, `đối chứng: câu cũ chỉ ${cu.size} loại kiểm`);
} finally {
  await c.end();
}

console.log(fails.length === 0 ? "\ndq-moi-nhat-do: ĐẠT" : `\ndq-moi-nhat-do: ${fails.length} lỗi`);
process.exit(fails.length === 0 ? 0 : 1);
