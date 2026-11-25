#!/usr/bin/env node
// khuon-media-files.mjs — ZC15 E9 (AC-7): khuôn một entry meta.mediaFiles (type MediaFileEntry trong media-fetch.ts) giữ
// đúng năm khoá url, file, sha256, bytes, error — thêm khoá là đổi DATA-CONTRACT (luật 4), vòng này không được làm.
//   node khuon-media-files.mjs <gốc kho>            soát tệp của cây
//   node khuon-media-files.mjs --tu-thu <gốc kho>   thêm khoá finalHost vào bản chép → phải FAIL đúng thông điệp
import { readFileSync } from "node:fs";
import { join } from "node:path";

const KHUON = ["bytes", "error", "file", "sha256", "url"];

export function khoa(src) {
  const m = src.match(/export type MediaFileEntry = \{([\s\S]*?)\};/);
  if (!m) return null;
  return [...m[1].matchAll(/^\s*([A-Za-z_]\w*)\??\s*:/gm)].map((x) => x[1]).sort();
}

function cham(src) {
  const k = khoa(src);
  if (!k) return "không thấy type MediaFileEntry";
  return JSON.stringify(k) === JSON.stringify(KHUON) ? null : `khuôn meta.mediaFiles đổi: [${k.join(", ")}] ≠ [${KHUON.join(", ")}]`;
}

const tuThu = process.argv[2] === "--tu-thu";
const goc = process.argv[tuThu ? 3 : 2];
if (!goc) { console.error("dùng: khuon-media-files.mjs [--tu-thu] <gốc kho>"); process.exit(2); }
const src = readFileSync(join(goc, "collector/src/core/media-fetch.ts"), "utf8");
if (tuThu) {
  const pha = src.replace("export type MediaFileEntry = {", "export type MediaFileEntry = {\n  finalHost?: string;");
  const loi = cham(pha);
  if (loi && loi.startsWith("khuôn meta.mediaFiles đổi")) { console.log(`TU-THU PASS — thêm finalHost → FAIL '${loi}'`); process.exit(0); }
  console.log("TU-THU FAIL — thêm khoá mà chốt không đỏ"); process.exit(1);
}
const loi = cham(src);
if (loi) { console.log(`KHUON-MEDIA-FILES FAIL — ${loi}`); process.exit(1); }
console.log(`KHUON-MEDIA-FILES PASS — MediaFileEntry giữ đúng ${KHUON.length} khoá (${KHUON.join(", ")})`);
