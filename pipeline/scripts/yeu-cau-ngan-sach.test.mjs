// yeu-cau-ngan-sach.test.mjs — YC1 sua-doc-ngan-sach-yeu-cau (YCNS-AC-n ↔ _acceptance/sua-doc-ngan-sach-yeu-cau/evals.yaml):
// ma trận ca viết trước của bộ đọc ngân sách Yêu cầu, không DB. Chiều đỏ chạy trên bản sao đột biến của yeu-cau.mjs chép
// cạnh tệp thật (để import tương đối vẫn đúng) rồi xoá.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LIB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib");
const TEP = path.join(LIB, "yeu-cau.mjs");
const NGUON = readFileSync(TEP, "utf8");
const { docNganSach } = await import(pathToFileURL(TEP).href);

const T = 1e9, TR = 1e6;
const r = (x) => Math.round(x);
// Sáu dấu nối mà mẫu «khoang» nhận (NOI của yeu-cau.mjs) — trục A của yc1-khoang-le-va-doi-chung-do.
const NOI_KLR = ["-", "–", "—", "~", "đến", "tới"];
// [chữ, dịch vụ, min, max, mã] — bảng ca của hợp đồng, viết trước.
const CA = [
  ["cần mua 2pn 2ty6", "sale", null, 2.6 * T, "Ngoài-10"],
  ["cần mua 2ty65", "sale", null, 2.65 * T, "Ngoài-10"],
  ["thuê studio 6tr5", "rent_lt", null, 6.5 * TR, "Ngoài-10"],
  ["thuê 1pn 3tr5", "rent_lt", null, 3.5 * TR, "Ngoài-10"],
  ["mua căn 2 tỷ 5", "sale", null, 2.5 * T, "Ngoài-10"],
  ["mua căn 2 tỷ 500", "sale", null, 2.5 * T, "Ngoài-10"],
  ["mua căn 1 tỷ 250", "sale", null, 1.25 * T, "Ngoài-10"],
  ["mua căn 2 tỷ rưỡi", "sale", null, 2.5 * T, "Ngoài-10"],
  ["thuê 2pn 6 triệu rưỡi", "rent_lt", null, 6.5 * TR, "Ngoài-10"],
  ["mua 800 - 1,2 tỷ", "sale", 0.8 * T, 1.2 * T, "Ngoài-5"],
  ["mua 2 - 2,5 tỷ", "sale", 2 * T, 2.5 * T, "Ngoài-5"],
  ["mua 1,5-2 tỷ", "sale", 1.5 * T, 2 * T, "Ngoài-11"],
  ["thuê tài chính 5- 6tr", "rent_lt", 5 * TR, 6 * TR, "Ngoài-11"],
  ["mua tối đa 2 tỷ, từ 3 tỷ", "sale", null, 2 * T, "Ngoài-4"],
  ["mua dưới 2 tỷ trên 3 tỷ", "sale", null, 2 * T, "Ngoài-7"],
  ["mua từ 3 tỷ, tối đa 2 tỷ", "sale", 3 * T, null, "Ngoài-9"],
  ["mua 3-2 tỷ", "sale", 2 * T, 3 * T, "Ngoài-4"],
  ["tìm thuê 2pn tc 8tr", "rent_lt", null, 8 * TR, "tc"],
  ["cần thuê tc8tr", "rent_lt", null, 8 * TR, "tc"],
  ["cần thuê tài chính 8", "rent_lt", null, 8 * TR, "tc"],
  ["cần mua tc 2,5", "sale", null, 2.5 * T, "tc"],
  ["tc 8", null, null, null, "tc"],
  ["cần mua 2ty6 quay đầu", "sale", null, 2.6 * T, "2ty6"],
  ["thuê 1pn 6tr5 quay đầu", "rent_lt", null, 6.5 * TR, "6tr5"],
  ["thuê 2pn 12tr quay đầu", "rent_lt", null, 12 * TR, "quay đầu"],
  ["thuê tài chính 6tr quay đầu", "rent_lt", null, 6 * TR, "quay đầu"],
  ["mua 2 pn 2.3 tỷ quay đầu", "sale", null, 2.3 * T, "quay đầu"],
  ["thuê 3pn 5-6tr quay đầu", "rent_lt", 5 * TR, 6 * TR, "quay đầu"],
  ["mua 2 tỷ 2pn", "sale", null, 2 * T, "chặn phần lẻ"],
  ["mua 2 tỷ 3 phòng", "sale", null, 2 * T, "chặn phần lẻ"],
  ["mua 2 tỷ 70m2", "sale", null, 2 * T, "chặn phần lẻ"],
  ["mua 2 tỷ 70m²", "sale", null, 2 * T, "chặn phần lẻ"],
  ["mua 2 tỷ 5 tầng", "sale", null, 2 * T, "chặn phần lẻ"],
  ["mua 2 tỷ 2 căn", "sale", null, 2 * T, "chặn phần lẻ"],
  // yc1-khoang-le-va-doi-chung-do AC-1: khoảng có phần lẻ viết rời ở đầu dưới — sáu dấu nối của NOI × hai đơn vị (ma trận
  // sinh từ danh sách, không chép tay từng ca), một ca hai đầu cùng lẻ, một đối chứng ngày không thành phần lẻ.
  ...NOI_KLR.map((n) => [`cần mua 2 tỷ 5 ${n} 3 tỷ`, "sale", 2.5 * T, 3 * T, "khoảng lẻ rời"]),
  ...NOI_KLR.map((n) => [`cần thuê 8tr 5 ${n} 9tr`, "rent_lt", 8.5 * TR, 9 * TR, "khoảng lẻ rời"]),
  ["cần mua 2 tỷ 2 - 2 tỷ 5", "sale", 2.2 * T, 2.5 * T, "khoảng lẻ rời"],
  ["tìm thuê tc 8tr 7-8/11", "rent_lt", null, 8 * TR, "khoảng lẻ rời"],
];
const TONG_CA = 48;
// 34 ca đầu là bảng của YC1 (sua-doc-ngan-sach-yeu-cau), không được đổi lặng lẽ: băm JSON của chúng ghim bằng hằng tính ở main
// 7e7b7073 (`node -e` in cạnh hằng trong ca «YCNS bảng ca»). 14 ca sau là của yc1-khoang-le-va-doi-chung-do.
const SO_CA_CU = 34;
const BAM_CA_CU = "8aa6d1a294a921384ce37ff455d32b81440be46ddf7ff8eea118157a9b47d0e2";
const bamCaCu = (ca) => createHash("sha256").update(JSON.stringify(ca.slice(0, SO_CA_CU))).digest("hex");
const MA_PHAI_CO = ["Ngoài-4", "Ngoài-5", "Ngoài-7", "Ngoài-9", "Ngoài-10", "Ngoài-11", "tc", "2ty6", "6tr5", "quay đầu", "khoảng lẻ rời"];
// Ngoài-4/7/9 cùng lớp «min lớn hơn max», Ngoài-5/11 cùng lớp «khoảng thiếu đơn vị»: mỗi lớp đếm gộp; 2ty6, 6tr5 đếm cả
// ca viết liền của Ngoài-10.
const LOP = { "Ngoài-4": ["Ngoài-4", "Ngoài-7", "Ngoài-9"], "Ngoài-7": ["Ngoài-4", "Ngoài-7", "Ngoài-9"],
  "Ngoài-9": ["Ngoài-4", "Ngoài-7", "Ngoài-9"], "Ngoài-5": ["Ngoài-5", "Ngoài-11"], "Ngoài-11": ["Ngoài-5", "Ngoài-11"] };
const VIET_LIEN = { "2ty6": /\d\s*ty\d/, "6tr5": /\d\s*tr\d/ };

/** Đếm ca của mỗi mã; ném «THIEU CA <mã>» khi mã nào dưới hai ca, «TONG CA LECH» khi tổng khác hằng ghim. */
function kiemBangCa(ca) {
  if (ca.length !== TONG_CA) throw new Error(`TONG CA LECH: ${ca.length} ≠ ${TONG_CA}`);
  if (bamCaCu(ca) !== BAM_CA_CU) throw new Error(`BANG CA CU DOI: băm ${bamCaCu(ca)} ≠ ${BAM_CA_CU}`);
  for (const ma of MA_PHAI_CO) {
    const n = ca.filter(([t, , , , m]) => (LOP[ma] ?? [ma]).includes(m) || (VIET_LIEN[ma] && VIET_LIEN[ma].test(t))).length;
    if (n < 2) throw new Error(`THIEU CA ${ma}`);
  }
}

/** So từng ca; ném thông điệp ghim theo lớp lỗi của ca sai đầu tiên. */
function kiemCa(doc, ca, nhan) {
  let n = 0;
  for (const [t, kind, min, max, ma] of ca) {
    const kq = doc(t, kind);
    if (kq.min != null && kq.max != null && kq.min > kq.max) throw new Error(`MIN LON HON MAX ${t}`);
    const dung = kq.min === (min == null ? null : r(min)) && kq.max === (max == null ? null : r(max));
    if (!dung) throw new Error(`${nhan(ma, t)}: ra ${kq.min}..${kq.max}, mong ${min}..${max}`);
    n++;
  }
  return n;
}

let nBan = 0;
/** Nhập bản sao của yeu-cau.mjs sau khi thay `cu` → `moi` (mỗi chỗ phải khớp đúng một lần; nhiều cặp thì truyền mảng
 *  [[cu, moi], …]); xoá tệp sau khi nạp. */
async function banSao(cu, moi) {
  const cap = Array.isArray(cu) ? cu : [[cu, moi]];
  let src = NGUON;
  for (const [a, b] of cap) {
    assert.equal(src.split(a).length, 2, `đột biến phải khớp đúng một chỗ: ${a}`);
    src = src.replace(a, b);
  }
  const tep = path.join(LIB, `.yeu-cau-dot-bien-${process.pid}-${nBan++}.mjs`);
  writeFileSync(tep, src);
  try { return await import(pathToFileURL(tep).href); } finally { rmSync(tep, { force: true }); }
}
const theoMa = (maCan) => CA.filter(([, , , , m]) => maCan.includes(m));

test("YCNS bảng ca: tổng ghim và mỗi mã có ít nhất hai ca; xoá một ca Ngoài-7 thì đỏ", () => {
  kiemBangCa(CA);
  const bot = CA.filter(([, , , , m]) => !["Ngoài-4", "Ngoài-7", "Ngoài-9"].includes(m)).concat([CA.find(([, , , , m]) => m === "Ngoài-7")]);
  assert.throws(() => kiemBangCa(bot), /TONG CA LECH|THIEU CA Ngoài-4/);
  const botMot = CA.slice(1);
  assert.throws(() => kiemBangCa(botMot), /TONG CA LECH/);
});

test("YCNS-KLR khoảng có phần lẻ viết rời (yc1-khoang-le-va-doi-chung-do AC-1)", async () => {
  const ca = theoMa(["khoảng lẻ rời"]);
  assert.equal(ca.length, NOI_KLR.length * 2 + 2, "số ô của mã «khoảng lẻ rời» phải bằng 6 dấu nối × 2 đơn vị + 2");
  assert.equal(kiemCa(docNganSach, ca, (m, t) => `KHOANG LE ROI ${t}`), 14);
  // Chiều đỏ: bản sao giữ chặn dấu nối ở nhánh phần lẻ viết rời của đầu dưới khoảng.
  const bo = await banSao("|\\s(?<alec>\\d{1,3})${CHAN_LE})?(?<aruoi>", "|\\s(?<alec>\\d{1,3})${CHAN_LE}${CACH_LE})?(?<aruoi>");
  assert.throws(() => kiemCa(bo.docNganSach, ca, (m, t) => `KHOANG LE ROI ${t}`), /KHOANG LE ROI cần mua 2 tỷ 5 - 3 tỷ/);
});

test("YCNS bảng ca cũ của YC1 giữ nguyên; đổi đích một ca cũ thì đỏ", () => {
  kiemBangCa(CA);
  const doi = CA.map((c, i) => (i === 0 ? [c[0], c[1], c[2], 2.7 * T, c[4]] : c));
  assert.throws(() => kiemBangCa(doi), /BANG CA CU DOI/);
});

test("YCNS-AC-1 phần lẻ viết liền", async () => {
  const ca = CA.filter(([t]) => /\d\s*(?:ty|tr)\d/.test(t));
  assert.ok(kiemCa(docNganSach, ca, (m, t) => `PHAN LE BI CAT ${t}`) >= 4);
  const bo = await banSao("if (le && /^\\d+$/.test", "if (false && le && /^\\d+$/.test");
  assert.throws(() => kiemCa(bo.docNganSach, ca, (m, t) => `PHAN LE BI CAT ${t}`), /PHAN LE BI CAT cần mua 2pn 2ty6/);
});

test("YCNS-AC-2 phần lẻ viết rời và sáu chữ chặn", async () => {
  const duong = CA.filter(([t, , , , m]) => m === "Ngoài-10" && !/\d\s*(?:ty|tr)\d/.test(t));
  const chan = theoMa(["chặn phần lẻ"]);
  assert.equal(chan.length, 6);
  kiemCa(docNganSach, duong, (m, t) => `PHAN LE VIET ROI ${t}`);
  kiemCa(docNganSach, chan, (m, t) => `PHAN LE AN SO ${t}`);
  // Chiều đỏ theo từng chữ chặn: ca dò viết CÁCH chữ («2 tỷ 2 pn») vì dạng dính chữ («2pn») còn bị chốt «không dính
  // chữ cái» của SAU giữ — bỏ chặn một chữ chỉ lộ ra ở dạng cách.
  for (const [chu, caChu] of [["pn", "mua 2 tỷ 2 pn"], ["phòng", "mua 2 tỷ 3 phòng"], ["m2", "mua 2 tỷ 70 m2"], ["m²", "mua 2 tỷ 70 m²"],
    ["tầng", "mua 2 tỷ 5 tầng"], ["căn", "mua 2 tỷ 2 căn"]]) {
    const caDo = [[caChu, "sale", null, 2 * T, "chặn phần lẻ"]];
    kiemCa(docNganSach, caDo, () => `PHAN LE AN SO ${chu}`);
    // «m2», «m²» cùng bị chặn bởi một luật «m không dính chữ cái»; bỏ luật đó thì cả hai dạng đỏ.
    const nhom = String.raw`(?:pn|phòng|m(?!\p{L})|tầng|căn)`;
    const goc = chu.startsWith("m") ? String.raw`m(?!\p{L})` : chu;
    const bo = await banSao(nhom, nhom.replace(goc, `XX${goc}`));
    assert.throws(() => kiemCa(bo.docNganSach, caDo, () => `PHAN LE AN SO ${chu}`), new RegExp(`PHAN LE AN SO ${chu}`),
      `bỏ chặn «${chu}» phải đỏ`);
  }
});

test("YCNS-AC-3 khoảng đầu dưới thiếu đơn vị", async () => {
  const ca = theoMa(["Ngoài-5", "Ngoài-11"]);
  assert.equal(kiemCa(docNganSach, ca, (m, t) => `KHOANG DAO ${t}`), 4);
  const bo = await banSao("parseVnNumber(g.aso) >= 100", "parseVnNumber(g.aso) >= 1e12");
  assert.throws(() => kiemCa(bo.docNganSach, ca, (m, t) => `KHOANG DAO ${t}`), /KHOANG DAO mua 800 - 1,2 tỷ/);
});

test("YCNS-AC-4 không bao giờ min lớn hơn max (mọi ca của ma trận)", async () => {
  assert.equal(kiemCa(docNganSach, theoMa(["Ngoài-4", "Ngoài-7", "Ngoài-9"]), (m, t) => `MIN LON HON MAX ${t}`), 4);
  let n = 0;
  for (const [t, kind] of CA) {
    const { min, max } = docNganSach(t, kind);
    assert.ok(!(min != null && max != null && min > max), `MIN LON HON MAX ${t}`);
    n++;
  }
  assert.equal(n, TONG_CA);
  // Đột biến: bỏ luật giữ biểu thức đầu ở cả hai nhánh và bỏ lưới cuối hàm → sàn/trần rời ngược ra min > max.
  const bo = await banSao([
    ["if (max != null && max < min) max = null;", ""],
    ["if (min != null && min > max) min = null;", ""],
    ["if (min != null && max != null && min > max) return { min: null, max: null };", ""],
  ]);
  assert.throws(() => kiemCa(bo.docNganSach, theoMa(["Ngoài-4", "Ngoài-7", "Ngoài-9"]), (m, t) => `x ${t}`),
    /MIN LON HON MAX mua tối đa 2 tỷ, từ 3 tỷ/);
});

test("YCNS-AC-5 tc và tài chính theo dịch vụ", async () => {
  const ca = theoMa(["tc"]);
  assert.equal(kiemCa(docNganSach, ca, (m, t) => `DON VI SAI THEO DICH VU ${t}`), 5);
  const bo = await banSao("if (kind === KIND.rent_lt) max = Math.round(parseVnNumber(g.aso) * 1e6);",
    "if (kind === KIND.rent_lt) max = Math.round(soTy(g.aso) * 1e9);");
  assert.throws(() => kiemCa(bo.docNganSach, ca, (m, t) => `DON VI SAI THEO DICH VU ${t}`), /DON VI SAI THEO DICH VU cần thuê tài chính 8/);
});

test("YCNS-AC-6 quay đầu", async () => {
  const ca = CA.filter(([t]) => t.includes("quay đầu"));
  assert.equal(kiemCa(docNganSach, ca, (m, t) => `QUAY DAU KHONG PHAI TRAN ${t}`), 6);
  // Đột biến: số đơn (gồm «X quay đầu») đọc thành sàn thay vì trần.
  const bo = await banSao('  } else max = tien(g, "a");', '  } else min = tien(g, "a");');
  assert.throws(() => kiemCa(bo.docNganSach, ca, (m, t) => `QUAY DAU KHONG PHAI TRAN ${t}`),
    /QUAY DAU KHONG PHAI TRAN cần mua 2ty6 quay đầu/);
});

// Băm phần ngoài khối «Ngân sách» của bản chép nguyên từ nhánh feat/bang-yeu-cau. Tính lại:
// git show 6c4ee41d:pipeline/lib/yeu-cau.mjs | node -e '<bỏ từ «// ---- Ngân sách» tới trước «// ---- Loại hình», sha256>'
const BAM_NGOAI_KHOI = "87a7c9e18ead696b1ac3d27f67ae758f34ad1dec88bbd0d8f8c7fd91fd3e8c5b";
const bamNgoaiKhoi = (s) => {
  const a = s.indexOf("// ---- Ngân sách"), b = s.indexOf("// ---- Loại hình");
  if (a < 0 || b < a) throw new Error("không thấy khối Ngân sách");
  return createHash("sha256").update(s.slice(0, a) + s.slice(b)).digest("hex");
};
const kiemNgoaiKhoi = (s) => { if (bamNgoaiKhoi(s) !== BAM_NGOAI_KHOI) throw new Error("NGOAI KHOI DOI"); };

test("YCNS-AC-8 ngoài khối ngân sách giữ nguyên", () => {
  kiemNgoaiKhoi(NGUON);
  const doi = NGUON.replace("export const docLoaiHinh", "export const  docLoaiHinh");
  assert.notEqual(doi, NGUON);
  assert.throws(() => kiemNgoaiKhoi(doi), /NGOAI KHOI DOI/);
});

// Hồi quy rút từ lượt đo trên DB máy thu 11/11 (S3): ngày sau phần lẻ viết cách, số trơn khi chưa rõ dịch vụ.
test("YCNS hồi quy lượt đo: ngày không thành phần lẻ, số trơn nhường số kế bên", async () => {
  const ca = [["khách 2 nam cần 2pn full nt tc 8tr 7-8/11 in", "rent_lt", null, 8 * TR, "hồi quy"],
    ["Khách tìm 2PN Full GH BS tài chính 10 11tr", null, null, 11 * TR, "hồi quy"],
    ["Khách tìm 2PN tài chính 10 hoặc 11tr", null, null, 11 * TR, "hồi quy"]];
  kiemCa(docNganSach, ca, (m, t) => `HOI QUY ${t}`);
  const bo = await banSao("if (loai === \"tron\" && kind !== KIND.rent_lt && kind !== KIND.sale) return;", "");
  assert.throws(() => kiemCa(bo.docNganSach, [ca[2]], (m, t) => `HOI QUY ${t}`), /HOI QUY Khách tìm 2PN tài chính 10 hoặc 11tr/);
  const bo2 = await banSao("const CACH_LE = String.raw`(?!\\s*[-–—~/])`;", "const CACH_LE = String.raw``;");
  assert.throws(() => kiemCa(bo2.docNganSach, [ca[0]], (m, t) => `HOI QUY ${t}`), /HOI QUY khách 2 nam/);
});
