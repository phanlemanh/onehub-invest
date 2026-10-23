#!/usr/bin/env node
// Kiểm TĨNH /listing/[id] (Invest, công khai) theo AGENTS.md luật 5: AirDNA chỉ để
// hiệu chuẩn, chỉ ở /ops/quality. Đo TRẠNG THÁI cây mã, không đo diff:
//   - getListingDetail không đọc bảng airdna_* (ảnh/URL chỉ từ tự thu);
//   - route listing + components/listing không render chữ AirDNA, không còn photoSource.
// Cùng kiểu với scripts/check-portal-compliance.mjs (nhánh fix/portal-deals-airdna) —
// gộp vào đó khi cả hai đã vào main.
// Dùng: node scripts/check-listing-no-airdna.mjs  (exit 0 = đạt, 1 = vi phạm)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = (p) => path.join(root, "app", p);
// Thiếu file → chuỗi rỗng: kiểm báo FAIL có tên thay vì văng lỗi.
const read = (p) => (existsSync(app(p)) ? readFileSync(app(p), "utf8") : "");
// Bỏ comment để chỉ đo mã/chữ thật sự render (chú thích được nhắc AirDNA để giải thích luật).
const code = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
const walk = (dir) =>
  readdirSync(app(dir)).flatMap((f) => {
    const rel = path.join(dir, f);
    return statSync(app(rel)).isDirectory() ? walk(rel) : /\.tsx?$/.test(f) ? [rel] : [];
  });

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

// 1. Truy vấn: thân getListingDetail không chạm bảng AirDNA.
const queries = code(read("src/lib/queries.ts"));
const fnAt = queries.indexOf("export async function getListingDetail(");
const fnEnd = queries.indexOf("\nexport ", fnAt + 1);
const fnBody = fnAt >= 0 ? queries.slice(fnAt, fnEnd < 0 ? undefined : fnEnd) : "";
check(fnBody.length > 0, "tìm thấy getListingDetail trong lib/queries.ts");
check(!/airdna_/i.test(fnBody), "getListingDetail không đọc bảng airdna_*");
check(!/photoSource|listingUrl/.test(queries), "ListingDetail không còn photoSource/listingUrl (nguồn AirDNA)");

// 2. Render: route listing + components/listing không có chữ/nhánh AirDNA.
const files = [...walk("src/app/(app)/listing"), ...walk("src/components/listing")];
check(files.length > 0, `quét ${files.length} file route/components listing`);
for (const f of files) {
  const leaks = code(read(f))
    .split("\n")
    .filter((l) => /airdna|photoSource/i.test(l));
  check(leaks.length === 0, `${f}: không AirDNA/photoSource trong mã render (${leaks.length} dòng)`);
}

console.log(fails.length === 0 ? "\nlisting-no-airdna: ĐẠT" : `\nlisting-no-airdna: ${fails.length} vi phạm`);
process.exit(fails.length === 0 ? 0 : 1);
