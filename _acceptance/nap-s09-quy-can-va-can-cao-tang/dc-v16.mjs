#!/usr/bin/env node
// dc-v16.mjs — DA56 E10b (AC-10, «DATA-CONTRACT đúng bản làn thu»), thước sửa sau chữ ký Cổng Bằng chứng (GS phán 28/11):
// so ĐÚNG phần hồ sơ này chịu trách nhiệm — mục «### Mở rộng v16 …» (tới tiêu đề kế) và gạch «schemaVersion 16» của
// «## Lịch sử phiên bản» (tới gạch phiên bản kế) — giữa bản làn thu @767c70c13 và cây đang kiểm. Phần khác của DATA-CONTRACT
// do làn thu sửa (vd ZC20 #561 thêm mục 7) không làm E10b đỏ. Bản cũ so TRỌN tệp nên đỏ oan sau ZC20.
//   node _acceptance/nap-s09-quy-can-va-can-cao-tang/dc-v16.mjs              so 767c70c13 ↔ cây; thoát 0 = khớp, 1 = lệch
//   node _acceptance/nap-s09-quy-can-va-can-cao-tang/dc-v16.mjs --doi-chung  hai ca: đổi 1 ký tự trong khối → phải lệch;
//                                                                              thêm dòng ngoài khối → phải khớp
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const GOC = execFileSync("git", ["-C", import.meta.dirname, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const TEP = "collector/docs/DATA-CONTRACT.md";
const MOC = "767c70c13";

/** Cắt hai khối của v16; thiếu khối nào thì ném gọi tên (thước không được xanh khi không thấy gì để so). */
export function khoiV16(s) {
  const dong = s.split("\n");
  const dau = dong.findIndex((l) => /^### Mở rộng v16\b/.test(l));
  if (dau < 0) throw new Error("không thấy tiêu đề «### Mở rộng v16»");
  let cuoi = dong.findIndex((l, i) => i > dau && /^#{1,3} /.test(l));
  if (cuoi < 0) cuoi = dong.length;
  const ls = dong.findIndex((l) => /^- \*\*schemaVersion 16\b/.test(l));
  if (ls < 0) throw new Error("không thấy gạch lịch sử «- **schemaVersion 16»");
  let lsCuoi = dong.findIndex((l, i) => i > ls && (/^- \*\*schemaVersion /.test(l) || /^#{1,3} /.test(l)));
  if (lsCuoi < 0) lsCuoi = dong.length;
  return { muc: dong.slice(dau, cuoi).join("\n"), lich_su: dong.slice(ls, lsCuoi).join("\n") };
}

function so(a, b) {
  const x = khoiV16(a), y = khoiV16(b);
  return ["muc", "lich_su"].filter((k) => x[k] !== y[k]);
}

const goc = execFileSync("git", ["-C", GOC, "show", `${MOC}:${TEP}`], { encoding: "utf8", maxBuffer: 1 << 26 });
if (process.argv.includes("--doi-chung")) {
  let loi = 0;
  const k = khoiV16(goc);
  const i = goc.indexOf(k.muc) + Math.floor(k.muc.length / 2);
  const dotBien = goc.slice(0, i) + (goc[i] === "x" ? "y" : "x") + goc.slice(i + 1);
  const lech1 = so(goc, dotBien);
  if (lech1.join() === "muc") console.log("PASS đối chứng đỏ: đổi 1 ký tự trong khối v16 → lệch «muc»");
  else { console.log(`FAIL đối chứng đỏ: đổi 1 ký tự trong khối v16 mà thước ra ${JSON.stringify(lech1)}`); loi = 1; }
  const ngoai = goc.replace("## Quy tắc tiêu thụ", "7. Dòng thêm ngoài khối v16 (mô phỏng ZC20 #561).\n\n## Quy tắc tiêu thụ");
  if (ngoai === goc) { console.log("FAIL đối chứng xanh: không chèn được dòng ngoài khối"); loi = 1; }
  else {
    const lech2 = so(goc, ngoai);
    if (!lech2.length) console.log("PASS đối chứng xanh: thêm dòng ngoài khối v16 → vẫn khớp");
    else { console.log(`FAIL đối chứng xanh: dòng ngoài khối làm lệch ${JSON.stringify(lech2)}`); loi = 1; }
  }
  process.exit(loi);
}
const lech = so(goc, readFileSync(join(GOC, TEP), "utf8"));
if (lech.length) { console.log(`FAIL DATA-CONTRACT lệch bản làn thu @${MOC} ở khối v16: ${lech.join(", ")}`); process.exit(1); }
console.log(`PASS khối «Mở rộng v16» và gạch lịch sử schemaVersion 16 khớp bản làn thu @${MOC}`);
