#!/usr/bin/env node
// thuoc-lech-ma-nguon-va-lich-s05 AC-5: mã báo cáo ngày không giả định mã nguồn một chữ số (bộ đăng ký nay có S10 trở lên).
// Ma trận năm hình thái viết trước; quét ba tệp; tự kiểm cùng lượt — mỗi hình thái chèn vào bản chép chuỗi phải bị gọi tên.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TEP = ["scripts/bao-cao-ngay.mjs", "scripts/lib/bao-cao-ngay.mjs", "scripts/lib/freshness.mjs"];

/** Năm hình thái giả định mã một chữ số: tên · khuôn dò · một dòng mẫu dùng cho tự kiểm. */
export const HINH_THAI = [
  ["regex-S0-mot-chu-so", /S0(?:\\d|\[0-9\]|\[1-9\])/, "const ok = /^S0\\d\\//.test(x);"],
  ["startsWith-S0", /startsWith\(\s*["'`]S0["'`]\s*\)/, 'if (code.startsWith("S0")) return code;'],
  ["noi-chuoi-S0", /["'`]S0["'`]\s*\+/, 'const code = "S0" + n;'],
  ["regex-S-mot-chu-so", /\^S\\d\$/, "const la = /^S\\d$/.test(code);"],
  ["cat-co-dinh-3", /\.slice\(\s*0\s*,\s*3\s*\)/, "const ma = nhan.slice(0, 3);"],
];

/** Mọi lần chạm hình thái trong chữ `noiDung` của tệp `tep`: [{hinh, tep, dong}]. */
export function quet(tep, noiDung) {
  const ra = [];
  noiDung.split("\n").forEach((dong, i) => {
    for (const [hinh, re] of HINH_THAI) if (re.test(dong)) ra.push({ hinh, tep, dong: i + 1 });
  });
  return ra;
}

let sai = 0;
const cham = TEP.flatMap((t) => quet(t, readFileSync(path.join(ROOT, t), "utf8")));
for (const c of cham) console.log(`FAIL ${c.hinh} ${c.tep}:${c.dong}`);
if (cham.length) sai++;

// Tự kiểm: mỗi hình thái chèn vào bản chép tệp đầu phải bị gọi tên đúng hình thái + tệp + dòng.
const goc = readFileSync(path.join(ROOT, TEP[0]), "utf8");
for (const [hinh, , mau] of HINH_THAI) {
  const banChep = `${goc}\n${mau}\n`;
  const dong = banChep.split("\n").length - 1;
  const bat = quet(TEP[0], banChep).filter((c) => c.hinh === hinh && c.dong === dong);
  const ok = bat.length === 1;
  console.log(`${ok ? "ok  " : "SAI "} tự kiểm ${hinh}: ${ok ? `gọi tên ${TEP[0]}:${dong}` : "không bắt được"}`);
  if (!ok) sai++;
}

console.log(sai ? `TL-MA-BAO-CAO FAIL (${sai})` : `TL-MA-BAO-CAO PASS (${TEP.length} tệp, ${HINH_THAI.length} hình thái)`);
process.exitCode = sai ? 1 : 0;
