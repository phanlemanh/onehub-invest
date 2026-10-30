// cam-mau-s03.test.mjs — hồ sơ _acceptance/s03-cam-mau-so-lieu (N1): ma trận đọc số, chốt khoảng giá, khoá gom có mã toà/căn.
// Chuỗi lấy từ bài S03 thật (cắt đoạn); SĐT trong ca là dãy giả 0901234567. Mỗi AC có một ca đỏ: bản sao đột biến của
// transform-zalo.mjs (chép cạnh tệp thật để ./lib còn giải được, xoá ngay sau khi nạp) phải làm dòng ghim ra SAI.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import * as tz from "../transform-zalo.mjs";

const TZ = join(import.meta.dirname, "../transform-zalo.mjs");
let nMut = 0;

/** Nạp bản sao transform-zalo.mjs sau khi thay từng cặp [chuỗi cũ, chuỗi mới]; cặp nào không khớp là lỗi ca thử. */
async function banSaoDotBien(thay) {
  let src = readFileSync(TZ, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(import.meta.dirname, `../.cm-mut-${process.pid}-${++nMut}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

/** Dòng nào của bảng sai trên module m — rỗng nghĩa là cả bảng đúng. */
function dongSai(m, bang, doc) {
  return bang.filter(([chu, dapAn]) => doc(m.parsePost(chu)) !== dapAn).map(([chu]) => chu);
}

// ---- AC-1: không đọc số từ URL/SĐT ----
const AC1 = [
  ["Giá thuê: 7.000.000 https://f65-zpg-r.zdn.vn/jpg/lj6tY7fvm82/abc.jpg", (p) => p.priceVnd, 7e6],
  ["Bán căn 2PN Giá 3 tỷ https://photo.zdn.vn/gr/2650/2650ty.jpg", (p) => p.priceVnd, 3e9],
  ["Cho thuê 65m2 lh 0901.234.567", (p) => p.areaM2, 65],
  ["Cho thuê 2PN full đồ 9tr https://f64-zpg-r.zdn.vn/12PN/x.jpg", (p) => p.bedrooms, 2],
  ["Bán 3PN 80m2 3,2 tỷ www.zdn.vn/150m2/a.jpg", (p) => p.areaM2, 80],
];

test("CM-AC-1: giá/DT/PN không lấy từ URL hay SĐT; phones đọc từ chữ gốc", () => {
  for (const [chu, doc, dapAn] of AC1) assert.equal(doc(tz.parsePost(chu)), dapAn, `CM-AC-1 «${chu}»`);
  assert.deepEqual(tz.parsePost("Cho thuê 65m2 lh 0901.234.567").phones, ["0901234567"], "CM-AC-1 phones");
  assert.equal(AC1.length, 5);
});

test("CM-AC-1 đột biến: bỏ bước gạt URL/SĐT → dòng URL «6tY» ra sai", async () => {
  const m = await banSaoDotBien([["const so = gatSo(text);", "const so = text;"]]);
  assert.notEqual(m.parsePost(AC1[0][0]).priceVnd, 7e6, "CM-AC-1 đột biến «6tY» vẫn đúng — thước không đo bước gạt");
});

// ---- AC-2: giá tỷ ----
const AC2 = [
  ["Bán căn 2PN giá 2.650 tỷ", 2.65e9],
  ["Bán 3PN 6,950 tỷ bao phí", 6.95e9],
  ["Bán gấp 3,349 tỷ", 3.349e9],
  ["Giá bán 2400 tỷ thu về", 2.4e9],
  ["Bán 2PN 1950 Tỷ thu về", 1.95e9],
  ["Bán căn 2ty450 có sổ", 2.45e9],
  ["Bán 1ty650 full đồ", 1.65e9],
  ["Bán 3PN 3ty2 bếp rèm", 3.2e9],
  ["Bán 2 tỷ 450 thương lượng", 2.45e9],
  ["Bán căn 2.9 tỷ", 2.9e9],
  ["Bán căn 2,93 tỷ", 2.93e9],
  ["Bán căn 3 tỷ", 3e9],
];
const AC2_RF = [
  ["Bán studio 1.5 tỷ", 1.5e9],
  ["Bán studio 1,5 tỷ", 1.5e9],
];

test("CM-AC-2: 12 dạng giá tỷ ra đúng số đồng", () => {
  assert.equal(AC2.length, 12);
  for (const [chu, dapAn] of [...AC2, ...AC2_RF]) assert.equal(tz.parsePost(chu).priceVnd, dapAn, `CM-AC-2 «${chu}»`);
});

test("CM-AC-2 đột biến: parseVnNumber cũ → «2.650 tỷ» ra sai", async () => {
  const m = await banSaoDotBien([["if (GIA_TY_NHOM_NGHIN.test(raw))", "if (false)"]]);
  assert.ok(dongSai(m, AC2, (p) => p.priceVnd).includes("Bán căn 2PN giá 2.650 tỷ"), "CM-AC-2 đột biến «2.650 tỷ» vẫn đúng");
});

// ---- AC-3: giá triệu và giá không đơn vị ----
const AC3 = [
  ["Cho thuê 2PN 5tr5", (p) => p.priceVnd, 5.5e6],
  ["Cho thuê studio 8tr5 bao phí", (p) => p.priceVnd, 8.5e6],
  ["Cho thuê 1PN 4tr8", (p) => p.priceVnd, 4.8e6],
  ["Cho thuê 2PN 8,5tr/tháng", (p) => p.priceVnd, 8.5e6],
  ["Cho thuê 3PN 12 triệu/th", (p) => p.priceVnd, 12e6],
  ["Bán đất 45.5tr/m²", (p) => p.pricePerm2Vnd, 45.5e6],
  ["Bán căn 2PN Giá: 4,000 (thu về)", (p) => p.priceVnd, 4e9],
  ["Cho thuê 2PN Giá thuê: 7.000.000", (p) => p.priceVnd, 7e6],
  ["Cho thuê studio Giá 7.500.000/tháng", (p) => p.priceVnd, 7.5e6],
];

test("CM-AC-3: 9 dạng giá triệu / không đơn vị ra đúng", () => {
  assert.equal(AC3.length, 9);
  for (const [chu, doc, dapAn] of AC3) assert.equal(doc(tz.parsePost(chu)), dapAn, `CM-AC-3 «${chu}»`);
  assert.equal(tz.parsePost("Cho thuê 2PN Giá: 4,000").priceVnd, null, "CM-AC-3 «Giá: 4,000» tin thuê giữ null");
});

test("CM-AC-3 đột biến: bỏ luật «tr chen phần lẻ» → «5tr5» ra sai", async () => {
  const m = await banSaoDotBien([["const trLe = so.match(GIA_TR_LE);", "const trLe = null;"]]);
  assert.notEqual(m.parsePost("Cho thuê 2PN 5tr5").priceVnd, 5.5e6, "CM-AC-3 đột biến «5tr5» vẫn đúng");
});

// ---- AC-4: diện tích «Nm» ----
const AC4_CO = [["Bán căn 64m 2PN", 64], ["Cho thuê 43.2m full", 43.2], ["Cho thuê DT:43.2m", 43.2], ["Bán 65m2", 65],
  ["Bán DT 70m²", 70]];
const AC4_KHONG = ["Bán nhà mặt tiền 5m", "Bán nhà ngang 4m", "Nhà hẻm 3m xe hơi", "Đất đường 12m"];
// Bề ngang từ 15 m trở lên: chỉ danh sách chặn giữ chúng khỏi thành diện tích (khoảng 15–500 không đủ).
const AC4_KHONG_TREN_15 = ["Bán nhà mặt tiền 20m", "Đất đường 30m", "Nhà cách 200m ra chợ"];
const AC4_BIEN = [["Cho thuê 15m", 15], ["Cho thuê 14m", null], ["Bán 501m", null]];

test("CM-AC-4: 5 dạng diện tích ra đúng, 4 dạng bề ngang ra null, biên 15–500", () => {
  for (const [chu, dapAn] of AC4_CO) assert.equal(tz.parsePost(chu).areaM2, dapAn, `CM-AC-4 «${chu}»`);
  for (const chu of [...AC4_KHONG, ...AC4_KHONG_TREN_15]) assert.equal(tz.parsePost(chu).areaM2, null, `CM-AC-4 bề ngang «${chu}»`);
  for (const [chu, dapAn] of AC4_BIEN) assert.equal(tz.parsePost(chu).areaM2, dapAn, `CM-AC-4 biên «${chu}»`);
  assert.equal(tz.parsePost("Bán nhà 64m2 ngang 5m").areaM2, 64, "CM-AC-4 «64m2 ngang 5m»");
  assert.equal(AC4_CO.length + AC4_KHONG.length, 9);
});

test("CM-AC-4 đột biến: bỏ danh sách chặn bề ngang → «mặt tiền 20m» ra số", async () => {
  const m = await banSaoDotBien([["if (BE_NGANG.test(truoc)) continue;", ""]]);
  assert.notEqual(m.parsePost("Bán nhà mặt tiền 20m").areaM2, null, "CM-AC-4 đột biến «mặt tiền 20m» vẫn null");
});

// ---- AC-5: chốt khoảng giá (Hỏi-2 = a: bài phi lý không thành offer) ----
const AC5 = [
  [{ kind: "rent_lt", priceVnd: 999e6 }, null],
  [{ kind: "rent_lt", priceVnd: 1e9 }, "thue-tu-1-ty"],
  [{ kind: "sale", priceVnd: 100e9 }, null],
  [{ kind: "sale", priceVnd: 100.001e9 }, "ban-tren-100-ty"],
];

test("CM-AC-5: bốn biên chốt khoảng giá", () => {
  for (const [pr, dapAn] of AC5) assert.equal(tz.lyDoGiaPhiLy(pr), dapAn, `CM-AC-5 ${pr.kind} ${pr.priceVnd}`);
  assert.equal(tz.lyDoGiaPhiLy({ kind: "sale", priceVnd: null }), null, "CM-AC-5 không giá");
});

test("CM-AC-5 đột biến: biên «>=» thành «>» → thuê 1 tỷ lọt", async () => {
  const m = await banSaoDotBien([["pr.priceVnd >= GIA_THUE_TRAN", "pr.priceVnd > GIA_THUE_TRAN"]]);
  assert.equal(m.lyDoGiaPhiLy(AC5[1][0]), null, "CM-AC-5 đột biến «thuê 1 tỷ» vẫn bị loại — thước không đo biên");
});

// ---- AC-6: khoá gom có mã toà/căn ----
const NGUOI = { sender_id: "u1", text: "x" };
const thieu = (chu) => ({ ...tz.parsePost(chu), phuong: null });

test("CM-AC-6: bảng bốn ô khoá gom", () => {
  const a = thieu("Cho thuê 2PN S10.03 7tr");
  const b = thieu("Cho thuê 2PN S5.12 7tr");
  const a2 = thieu("Cho thuê căn 2PN S10.03 giá 7tr full đồ");
  assert.notEqual(tz.repostKey(a, NGUOI), tz.repostKey(b, NGUOI), "CM-AC-6 khác mã → hai khoá");
  assert.equal(tz.repostKey(a, NGUOI), tz.repostKey(a2, NGUOI), "CM-AC-6 cùng mã → một khoá");
  const khong = thieu("Cho thuê 2PN 7tr");
  assert.equal(tz.repostKey(khong, NGUOI), `rent_lt|?|7000000|?|2|?|sender:u1`, "CM-AC-6 không mã → khuôn cũ có «|?|»");
  const du = { kind: "sale", phuong: "nghia-do", priceVnd: 5e9, pricePerm2Vnd: null, areaM2: 66.7, bedrooms: 2 };
  assert.equal(tz.repostKey(du, NGUOI), "sale|nghia-do|5000000000|66.7|2", "CM-AC-6 đủ phường + DT → khoá nội dung cũ");
});

test("CM-AC-6: maToaCan bỏ mốc «T4/2027» và mã trong URL", () => {
  assert.deepEqual(tz.maToaCan("Bán BS8 nhận nhà T4/2027 xem https://zdn.vn/PR2/x.jpg"), ["BS8"]);
  assert.deepEqual(tz.maToaCan("Căn S10.03 và LD2xx13"), ["LD2xx13", "S10.03"]);
});

test("CM-AC-6 đột biến: bỏ mã khỏi khoá → khác mã chung một khoá", async () => {
  const m = await banSaoDotBien([["|${ma.join(\",\") || \"?\"}|${nguoi}", "|?|${nguoi}"]]);
  const a = { ...m.parsePost("Cho thuê 2PN S10.03 7tr"), phuong: null };
  const b = { ...m.parsePost("Cho thuê 2PN S5.12 7tr"), phuong: null };
  assert.equal(m.repostKey(a, NGUOI), m.repostKey(b, NGUOI), "CM-AC-6 đột biến «khác mã» vẫn tách — thước không đo mã");
});
