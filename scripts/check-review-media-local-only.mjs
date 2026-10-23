#!/usr/bin/env node
// Ảnh tin (PII tầng A, ADR-0007) không rời máy local — AC-9 của _acceptance/review-media-backend.
// Đo TRẠNG THÁI cây mã:
//   - data-api/ (API công khai, subtree ra repo public) không nhắc media_files / zalo-media
//     (stg_zalo_posts đã có sẵn ở data-api trước việc này — routes/deals.ts, migration chép — nên không đo ở đây);
//   - FILL của pipeline/sync-cloud.mjs (bảng đẩy lên cloud) không có stg_zalo_posts;
//   - tự kiểm: chuỗi cấy giả phải bị bắt (bộ dò không câm).
// Dùng: node scripts/check-review-media-local-only.mjs  (exit 0 = đạt, 1 = vi phạm)
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TERMS = /media_files|zalo-media/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", ".vercel"]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** Các dòng nhắc thuật ngữ cấm trong một đoạn văn bản. */
const hits = (text) => text.split("\n").filter((l) => TERMS.test(l));

/** Tên bảng trong `export const FILL = [...]`. */
function fillTables(src) {
  const start = src.indexOf("export const FILL = [");
  if (start < 0) return null;
  const body = src.slice(start, src.indexOf("];", start));
  return [...body.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
}

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

// Tự kiểm trước: bộ dò phải bắt được chuỗi cấy, và đọc được FILL mẫu có bảng cấm.
check(hits("const x = 'media_files';\nconst y = 1;").length === 1, "tự kiểm: chuỗi media_files cấy giả bị bắt");
check(hits("fetch('/api/zalo-media?path=x')").length === 1, "tự kiểm: chuỗi zalo-media cấy giả bị bắt");
check(
  (fillTables('export const FILL = [\n  "areas",\n  "stg_zalo_posts",\n];') ?? []).includes("stg_zalo_posts"),
  "tự kiểm: FILL cấy stg_zalo_posts bị đọc ra",
);

let scanned = 0;
const leaks = [];
for (const f of walk(path.join(root, "data-api"))) {
  scanned += 1;
  for (const l of hits(readFileSync(f, "utf8"))) leaks.push(`${path.relative(root, f)}: ${l.trim()}`);
}
for (const l of leaks) console.log(`     ${l}`);
check(scanned > 0 && leaks.length === 0, `data-api/ không nhắc media_files|zalo-media (${scanned} file, ${leaks.length} dòng)`);

const fill = fillTables(readFileSync(path.join(root, "pipeline", "sync-cloud.mjs"), "utf8"));
check(Array.isArray(fill) && fill.length > 0, `đọc được FILL của sync-cloud (${fill?.length ?? 0} bảng)`);
check(Array.isArray(fill) && !fill.includes("stg_zalo_posts"), "FILL của sync-cloud không có stg_zalo_posts");

if (fails.length) {
  console.log(`\nreview-media local-only: ${fails.length} vi phạm`);
  process.exit(1);
}
console.log("\nLOCAL-ONLY PASS");
