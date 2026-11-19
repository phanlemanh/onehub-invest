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

// ---- 1911-10: duyetAppToken — hết hạn/rác ghi «AUTH FAIL [S02] <ISO>» rồi ném; còn hạn trả dòng OK, không AUTH FAIL ----
const MA_TRAN_DUYET = [
  ["duyệt: hết hạn", jwt({ uid: "1", exp: S - 3600 }), true],
  ["duyệt: rỗng", "", true],
  ["duyệt: còn hạn", jwt({ uid: "1", exp: S + 1800 }), false],
];
function chamDuyet(duyet) {
  const hong = [];
  for (const [ten, tok, phaiNem] of MA_TRAN_DUYET) {
    const log = []; let nem = false;
    try { duyet((...x) => log.push(x.join(" ")), tok, NOW); } catch { nem = true; }
    const coAuth = log.includes("AUTH FAIL [S02] 2026-11-20T00:00:00.000Z");
    const dat = phaiNem ? nem && coAuth : !nem && !coAuth && log.some((l) => l.startsWith("token OK"));
    if (!dat) hong.push(`${ten} (ném: ${nem} · log: ${log.join(" | ") || "-"})`);
  }
  return hong;
}
const hongDuyet = chamDuyet(that.duyetAppToken);
for (const [ten] of MA_TRAN_DUYET) console.log(`${hongDuyet.some((h) => h.startsWith(ten)) ? "ĐỎ" : "đạt"}: bản thật · ô ${ten}`);
if (!goc.includes("nemAuthFail(log, e, now);")) { console.error("ĐỎ: không tìm thấy bước nemAuthFail để đột biến — thước lệch mã"); process.exit(2); }
const MUT2 = join(dirname(SRC), `.dot-bien-auth-${process.pid}.js`);
let hongMut2 = [];
try {
  writeFileSync(MUT2, goc.replace("nemAuthFail(log, e, now);", "throw e;"));
  hongMut2 = chamDuyet((await import(pathToFileURL(MUT2).href)).duyetAppToken);
} finally { rmSync(MUT2, { force: true }); }
const batDuoc2 = hongMut2.some((h) => h.startsWith("duyệt: hết hạn"));
console.log(`${batDuoc2 ? "đạt" : "ĐỎ"}: bản đột biến (bỏ AUTH FAIL khi ném) bị bắt ở ô: ${hongMut2.join(" | ") || "(không ô nào — thước mù)"}`);
console.log(`${batDuoc ? "đạt" : "ĐỎ"}: bản đột biến (bỏ chặn hết hạn) bị bắt ở ô: ${hongMut.join(" | ") || "(không ô nào — thước mù)"}`);
const xanh = hongThat.length === 0 && batDuoc && hongDuyet.length === 0 && batDuoc2;
console.log(xanh ? "XANH: 8/8 ô bản thật đạt, hai đột biến bị bắt" : `ĐỎ: bản thật hỏng ${hongThat.length + hongDuyet.length} ô · đột biến hạn ${batDuoc ? "bị bắt" : "lọt"} · đột biến AUTH FAIL ${batDuoc2 ? "bị bắt" : "lọt"}`);
process.exit(xanh ? 0 : 1);
