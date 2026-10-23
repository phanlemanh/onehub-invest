#!/usr/bin/env node
// Kiểm rào DB-local của scripts/smoke-deals-api.mjs (so-be-mat-api AC-7, vá Ngoài-1 của deals-api-tam-dong), hai chiều
// trên cùng một env: DATABASE_URL trỏ máy không phải local + BASE_URL trỏ cổng chết.
//   - không --chi-doc → phải thoát ≠ 0 với thông điệp rào, và KHÔNG có dòng HTTP nào (rào chạy trước mọi lời gọi);
//   - --chi-doc        → KHÔNG có thông điệp rào và có đi tới HTTP (lỗi kết nối tới BASE_URL chết — đúng ý, chỉ-đọc không cần DB).
// Không cần app hay DB đang chạy. Dùng: node scripts/check-smoke-guard.mjs
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smoke = path.join(root, "scripts/smoke-deals-api.mjs");
const env = { ...process.env, DATABASE_URL: "postgres://db.example.com:5432/x", BASE_URL: "http://127.0.0.1:9", OPS_API_TOKEN: "khong-dung" };
const GUARD = "FAIL rào DB local:";

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
const run = (args) => {
  const r = spawnSync(process.execPath, [smoke, ...args], { env, encoding: "utf8", timeout: 60_000 });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

const guarded = run([]);
check(
  guarded.code !== 0 && guarded.out.includes(GUARD) && guarded.out.includes("db.example.com") && !/khách:|fetch failed|ECONNREFUSED/.test(guarded.out),
  `DATABASE_URL ngoài local bị từ chối trước khi chạm DB/HTTP (mã ${guarded.code})`,
);
const chiDoc = run(["--chi-doc"]);
const wentHttp = /fetch failed|ECONNREFUSED|khách:/.test(chiDoc.out);
check(!chiDoc.out.includes(GUARD) && wentHttp, `--chi-doc không bị rào chặn (mã ${chiDoc.code}, ${wentHttp ? "có đi tới HTTP" : "không thấy dấu HTTP"})`);

console.log(fails.length === 0 ? "\nsmoke-guard: ĐẠT" : `\nsmoke-guard: ${fails.length} lỗi`);
process.exit(fails.length === 0 ? 0 : 1);
