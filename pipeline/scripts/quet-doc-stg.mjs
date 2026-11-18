#!/usr/bin/env node
// quet-doc-stg.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2) E8 · AC-6: mọi đường đọc stg_zalo_posts của hàng đi qua
// loadStgPosts (gạt bài thử). Quét tĩnh tệp của hàng: một câu SQL đọc thẳng bảng (FROM / JOIN stg_zalo_posts) là vi phạm —
// đúng lớp lỗi đã làm TG1 mất hai vòng chấm. Chú thích nhắc tên bảng không tính.
//   node pipeline/scripts/quet-doc-stg.mjs [tệp…]     vắng đối số thì quét tập tệp của hàng; thoát 1 kèm tệp:dòng khi có vi phạm
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const TEP_CUA_HANG = [
  "pipeline/transform-zalo.mjs",
  "pipeline/lib/dia-chi-the-nhom.mjs",
  "pipeline/scripts/dong-dau-dia-chi-that.mjs",
  "pipeline/scripts/mau-bai-lac-du-an.mjs",
];
const DOC_THANG = /\b(?:FROM|JOIN)\s+(?:public\.)?stg_zalo_posts\b/i;

/** Vi phạm trong một chuỗi mã: mỗi dòng không phải chú thích có câu đọc thẳng bảng. */
export function quet(ma) {
  const ra = [];
  ma.split("\n").forEach((l, i) => {
    const t = l.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    if (DOC_THANG.test(l)) ra.push({ dong: i + 1, chu: t.slice(0, 120) });
  });
  return ra;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tep = process.argv.slice(2).length ? process.argv.slice(2) : TEP_CUA_HANG.map((t) => join(GOC, t));
  let n = 0;
  for (const t of tep) {
    for (const v of quet(readFileSync(t, "utf8"))) { n++; console.log(`${relative(GOC, t)}:${v.dong}  ${v.chu}`); }
  }
  console.log(`quét ${tep.length} tệp: ${n} câu đọc thẳng stg_zalo_posts ngoài loadStgPosts`);
  process.exit(n ? 1 : 0);
}
