#!/usr/bin/env node
// Ca test cần dữ liệu thật của DB local hoặc công cụ chỉ có trên máy (AU11 `ci-test-module` AC-4, Hỏi-2). Danh sách viết
// sẵn ở scripts/ci-bo-qua.json: { "<module>": [{ "tep", "ca", "ly_do" }] }. Chỉ khi CI=true, CLI in giá trị NODE_OPTIONS
// gồm một `--test-skip-pattern` cho mỗi ca (tên khớp nguyên văn) — test runner của node lọc bỏ ca đó; ở máy local (không
// CI) in chuỗi rỗng nên mọi ca vẫn chạy như cũ. Mục không còn tên ca trong tệp của nó, hay mục trỏ ca đỏ sẵn của main
// (CAM) → thoát 1 gọi tên: danh sách không được phình hay mục.
// Chạy: NODE_OPTIONS="$(node scripts/lib/ci-can-du-lieu.mjs <module>)" npm test
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const DANH_SACH = path.join(ROOT, "scripts/ci-bo-qua.json");
/** Ca đỏ sẵn trên main mà bản sửa liên làn đã chữa — không được bỏ qua trên CI (bài học 25/10). */
export const CAM = [/^GT-AC-1/, /apify-facebook-daily/, /ma trận năm job/];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Lỗi của danh sách một module: mục trỏ tệp vắng, tên ca không còn trong tệp, hay ca bị cấm. */
export function loiDanhSach(list, root = ROOT) {
  const out = [];
  for (const m of list) {
    const f = path.join(root, m.tep);
    if (!existsSync(f)) out.push(`${m.tep}: tệp không còn`);
    else if (!readFileSync(f, "utf8").includes(m.ca)) out.push(`${m.tep}: không còn ca «${m.ca}»`);
    if (CAM.some((re) => re.test(m.ca))) out.push(`${m.tep}: «${m.ca}» là ca đỏ sẵn của main — không được bỏ qua`);
    if (!m.ly_do) out.push(`${m.tep}: «${m.ca}» thiếu lý do`);
  }
  return out;
}

/** Giá trị NODE_OPTIONS lọc các ca của module (chuỗi rỗng khi không CI). */
export function nodeOptions(list, ci = process.env.CI === "true") {
  if (!ci) return "";
  // NODE_OPTIONS đọc `\\` và `"` trong nháy kép là ký tự thoát — thoát thêm một lớp cho regex.
  return list.map((m) => `"--test-skip-pattern=^${escape(m.ca).replace(/[\\"]/g, "\\$&")}$"`).join(" ");
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mod = process.argv[2];
  const all = JSON.parse(readFileSync(DANH_SACH, "utf8"));
  if (!mod || !(mod in all)) {
    console.error(`ci-can-du-lieu: module «${mod}» không có trong ${path.relative(ROOT, DANH_SACH)} (${Object.keys(all).join(", ")})`);
    process.exit(1);
  }
  const loi = loiDanhSach(all[mod]);
  if (loi.length) {
    for (const l of loi) console.error(`ci-can-du-lieu: ${l}`);
    process.exit(1);
  }
  const ci = process.env.CI === "true";
  console.error(`ci-can-du-lieu: ${mod} — ${ci ? `bỏ qua ${all[mod].length} ca cần dữ liệu thật / công cụ máy local` : "không CI: không bỏ qua ca nào"}`);
  for (const m of ci ? all[mod] : []) console.error(`ci-can-du-lieu:   bỏ qua «${m.ca}» (${m.tep}) — ${m.ly_do}`);
  process.stdout.write(nodeOptions(all[mod], ci));
}
