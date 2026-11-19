#!/usr/bin/env node
// Phép đo AC-4 (hồ sơ s02-luot-loi-sach-va-kiem-han-token): ma trận năm ô của kiemAppToken
// chạy trên bản dist THẬT (phải xanh cả năm) và trên BẢN ĐỘT BIẾN — điều kiện hết hạn
// `conLaiMs <= 0` đổi thành `conLaiMs < -1e15` (không bao giờ đúng với token thật) —
// bản đột biến PHẢI làm đỏ ô «hết hạn» (thông điệp ghim tên ô). Cùng ma trận, cùng mốc now.
// Thoát 0 chỉ khi: bản thật 5/5 đạt VÀ bản đột biến bị bắt. Không ghi tệp nào ngoài một bản
// chép tạm cạnh dist (xoá trong finally).
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DIST = join(ROOT, "collector/dist/collectors");
if (!existsSync(DIST)) { console.error(`ĐỎ: thiếu ${DIST} — build collector trước`); process.exit(2); }
// bộ thu S02 = tệp dist duy nhất xuất kiemAppToken (không ghi tên tệp vào phép đo)
const coHam = readdirSync(DIST).filter((f) => f.endsWith(".js") && !f.startsWith("."))
  .filter((f) => readFileSync(join(DIST, f), "utf8").includes("export function kiemAppToken"));
if (coHam.length !== 1) { console.error(`ĐỎ: cần đúng một tệp dist xuất kiemAppToken, thấy ${coHam.length}`); process.exit(2); }
const SRC = join(DIST, coHam[0]);
const NOW = Date.UTC(2026, 10, 20, 0, 0, 0);
const jwt = (p) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(p)).toString("base64url")}.chuky`;
const S = Math.floor(NOW / 1000);

// [tên ô, token, kỳ vọng: {nem: RegExp} | {tra: RegExp}]
const MA_TRAN = [
  ["rỗng", "", { nem: /không đọc được appToken/ }],
  ["hết hạn 1 giờ", jwt({ uid: "1", exp: S - 3600 }), { nem: /ĐÃ HẾT HẠN 2026-11-19T23:00:00\.000Z/ }],
  ["hết hạn đúng lúc now (biên 0)", jwt({ uid: "1", exp: S }), { nem: /ĐÃ HẾT HẠN/ }],
  ["thiếu exp", jwt({ uid: "1" }), { nem: /ĐÃ HẾT HẠN \(không giải mã được exp\)/ }],
  ["còn hạn 30 phút", jwt({ uid: "1", exp: S + 1800 }), { tra: /^token OK \(\d+ chars, hết hạn sau 30 phút\)$/ }],
];

function cham(kiem) {
  const hong = [];
  for (const [ten, tok, kv] of MA_TRAN) {
    let nem = null, tra = null;
    try { tra = kiem(tok, NOW); } catch (e) { nem = e.message; }
    const dat = kv.nem ? nem !== null && kv.nem.test(nem) : tra !== null && kv.tra.test(tra);
    if (!dat) hong.push(`${ten} (ném: ${nem ?? "-"} · trả: ${tra ?? "-"})`);
  }
  return hong;
}

const that = await import(pathToFileURL(SRC).href);
const hongThat = cham(that.kiemAppToken);
for (const [ten] of MA_TRAN) console.log(`${hongThat.some((h) => h.startsWith(ten)) ? "ĐỎ" : "đạt"}: bản thật · ô ${ten}`);

const goc = readFileSync(SRC, "utf8");
if (!goc.includes("conLaiMs <= 0")) { console.error("ĐỎ: không tìm thấy điều kiện `conLaiMs <= 0` để đột biến — thước lệch mã"); process.exit(2); }
const MUT = join(dirname(SRC), `.dot-bien-han-${process.pid}.js`);
let hongMut = [];
try {
  writeFileSync(MUT, goc.replace("conLaiMs <= 0", "conLaiMs < -1e15"));
  const mut = await import(pathToFileURL(MUT).href);
  hongMut = cham(mut.kiemAppToken);
} finally {
  rmSync(MUT, { force: true });
}
const batDuoc = hongMut.some((h) => h.startsWith("hết hạn 1 giờ"));
console.log(`${batDuoc ? "đạt" : "ĐỎ"}: bản đột biến (bỏ chặn hết hạn) bị bắt ở ô: ${hongMut.join(" | ") || "(không ô nào — thước mù)"}`);
const xanh = hongThat.length === 0 && batDuoc;
console.log(xanh ? "XANH: 5/5 ô bản thật đạt, đột biến bị bắt" : `ĐỎ: bản thật hỏng ${hongThat.length} ô · đột biến ${batDuoc ? "bị bắt" : "lọt"}`);
process.exit(xanh ? 0 : 1);
