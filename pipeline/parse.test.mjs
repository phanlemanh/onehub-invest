import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parsePost } from "./transform-zalo.mjs";

// C2 bench phát hiện: "2.9 tỷ" từng parse thành 29 tỷ (strip mọi dấu chấm
// như ngăn cách nghìn). Quy tắc đúng: chấm theo sau 1-2 chữ số cuối = thập
// phân; chấm theo sau đúng 3 chữ số (đến hết nhóm) = ngăn cách nghìn.

test("giá tỷ thập phân: '2.9 tỷ' → 2.9e9, không nhân 10", () => {
  const p = parsePost("Bán CHCC 2PN 65m² Tây Hồ, 2.9 tỷ. LH 09");
  assert.equal(p.priceVnd, 2_900_000_000);
});

test("giá tỷ 2 chữ số thập phân: '2.93 tỷ' → 2.93e9", () => {
  const p = parsePost("Bán gấp 2.93tỷ");
  assert.equal(p.priceVnd, 2_930_000_000);
});

test("giá tỷ chẵn: '3 tỷ' → 3e9", () => {
  const p = parsePost("Cần tiền bán gấp 3 tỷ");
  assert.equal(p.priceVnd, 3_000_000_000);
});

test("perm2 thập phân: '45.5tr/m²' → 45.5e6", () => {
  const p = parsePost("Bán 45.5tr/m² Tây Hồ");
  assert.equal(p.pricePerm2Vnd, 45_500_000);
});

test("triệu/tháng thập phân: '8.5tr/tháng' → 8.5e6", () => {
  const p = parsePost("Cho thuê 8.5tr/tháng, 1PN");
  assert.equal(p.priceVnd, 8_500_000);
});

test("giữ nguyên hành vi khác: kind/area/bedrooms", () => {
  const p = parsePost("Bán CHCC 2PN 65m² Tây Hồ, 45tr/m², 2.93 tỷ");
  assert.equal(p.kind, "sale");
  assert.equal(p.areaM2, 65);
  assert.equal(p.bedrooms, 2);
  assert.equal(p.pricePerm2Vnd, 45_000_000);
  assert.equal(p.priceVnd, 2_930_000_000);
});

test("'t' của chữ 'tổng' không bị nhận là đơn vị tỷ (\\b ASCII)", () => {
  const p = parsePost("Bán gấp Hoàn Kiếm — 62m², 1 phòng ngủ, 82tr/m2, tổng 5.1t. Tư vấn 0963466005");
  assert.equal(p.priceVnd, 5_100_000_000);
});

// Đổi nghĩa có chủ ý (hồ sơ s03-cam-mau-so-lieu, sổ quyết định): môi giới viết triệu kèm chữ tỷ — 579 bài bán từng ra
// trên 100 tỷ. "2.900 tỷ" nay là 2,9 tỷ, không còn 2.900 tỷ.
test("tỷ ba chữ số sau dấu: '2.900 tỷ' → 2.9e9; không trộn với 'triệu'", () => {
  assert.equal(parsePost("Bán 2.900 tỷ nhà phố").priceVnd, 2_900_000_000);
  assert.equal(parsePost("Thuê dài hạn: 12 triệu/th").priceVnd, 12_000_000);
});

test("phẩy thập phân kiểu VN: '2,9 tỷ' → 2.9e9, '8,5tr/tháng' → 8.5e6", () => {
  assert.equal(parsePost("Bán gấp Tây Hồ 2,9 tỷ").priceVnd, 2_900_000_000);
  assert.equal(parsePost("Cho thuê 8,5tr/tháng 1PN").priceVnd, 8_500_000);
  assert.equal(parsePost("Bán 2,93 tỷ").priceVnd, 2_930_000_000);
});

// ---- extractPhones: SĐT VN từ text tin rao (P1b — contact người bán) ----
import { extractPhones } from "./transform-zalo.mjs";

test("SĐT dạng thường: '0963466005'", () => {
  assert.deepEqual(extractPhones("Bán gấp 62m². LH 0963466005"), ["+84963466005"]);
});

test("SĐT phân tách space: '0973 034 567'", () => {
  assert.deepEqual(extractPhones("Chính chủ bán. Call 0973 034 567"), ["+84973034567"]);
});

test("SĐT phân tách chấm: '0973.034.567'", () => {
  assert.deepEqual(extractPhones("LH: 0973.034.567 (A. Minh)"), ["+84973034567"]);
});

test("SĐT +84: '+84973034567' giữ dạng E.164", () => {
  assert.deepEqual(extractPhones("Liên hệ +84973034567"), ["+84973034567"]);
});

test("SĐT 11 số không nhận (di động VN chỉ còn 10 số — SD2): '03745678901'", () => {
  assert.deepEqual(extractPhones("Zalo 03745678901"), []);
});

test("parsePost gắn phone + phones; test cũ có sẵn SĐT trong text", () => {
  const p = parsePost("Bán gấp Hoàn Kiếm — 62m², 82tr/m2, tổng 5.1t. Tư vấn 0963466005");
  assert.equal(p.phone, "+84963466005");
  assert.deepEqual(p.phones, ["+84963466005"]);
});

test("bỏ số cố định đầu 024 và dãy số ngắn (diện tích/giá)", () => {
  assert.deepEqual(extractPhones("Nhà 65m2, giá 4650000000. QLDT 02438266551"), []);
});

test("không cắt giữa dãy số dài (?<!\\d guard) — mã 12 số không vớ ra", () => {
  assert.deepEqual(extractPhones("Số TK 0123456789012 — không phải SĐT"), []);
});

// GC1 doc-so-m2-bi-sot: diện tích không đơn vị sau nhãn, và chữ kiểu Unicode. Đo 05/11: 15 tin thiếu m² có số trong chữ.
const DAM = (s) => [...s].map((k) => {
  const c = k.codePointAt(0);
  if (c >= 48 && c <= 57) return String.fromCodePoint(0x1d7ce + c - 48);
  if (c >= 97 && c <= 122) return String.fromCodePoint(0x1d41a + c - 97);
  if (c >= 65 && c <= 90) return String.fromCodePoint(0x1d400 + c - 65);
  return k;
}).join("");

for (const [chu, so] of [
  ["Loại: 1N+\nDiện tích: 45.7\nHướng: TN", 45.7],
  ["Loại căn : Studio\nDiện tích : 27.2\nHướng : TN", 27.2],
  ["Diện tích 64", 64],
  ["Diện tích: 86,5\nGiá bán: 4 tỷ", 86.5],
  ["✅️Diện tích: 30.6 ✅️Hướng: Đông nam", 30.6],
  ["DIỆN TÍCH: 60", 60],
  ["dien tich: 72", 72],
]) {
  test(`GC1-AC-1 nhan khong don vi: ${JSON.stringify(chu)}`, () => {
    assert.equal(parsePost(chu).areaM2, so);
  });
}

for (const [chu, so] of [
  [`💰 ${DAM("59m2")}| 2PN2WC`, 59],
  [`Căn 2PN ( ${DAM("59")} ${DAM("m2")} ) Full NT`, 59],
  [`${DAM("34")}${DAM("m")}² Studio`, 34],
  ["Căn 70㎡ view hồ", 70],
  [`✅${DAM("Diện tích")}: ${DAM("67m2")}`, 67],
  [`${DAM("Diện tích")}: ${DAM("45")}`, 45],
]) {
  test(`GC1-AC-2 chu kieu unicode: ${JSON.stringify(chu)}`, () => {
    assert.equal(parsePost(chu).areaM2, so);
  });
}

test("GC1-AC-2 chi dien tich di qua chuan hoa: gia viet dam van rong, gia thuong giu nguyen", () => {
  const dam = parsePost(`Bán căn 2PN, ${DAM("2,15")} tỷ, ${DAM("52m2")}`);
  assert.equal(dam.areaM2, 52);
  assert.equal(dam.priceVnd, null);
  const thuong = parsePost(`Bán căn 2PN, 2,15 tỷ, ${DAM("52m2")}, LH 0912345678`);
  assert.equal(thuong.areaM2, 52);
  assert.equal(thuong.priceVnd, 2_150_000_000);
  assert.equal(thuong.bedrooms, 2);
  assert.equal(thuong.kind, "sale");
  assert.equal(thuong.phone, parsePost("Bán căn 2PN, 2,15 tỷ, 52m2, LH 0912345678").phone);
});

test("GC1-AC-2 SDT viet dam khong thanh dien tich", () => {
  assert.equal(parsePost(`Cho thuê căn hộ LH ${DAM("0912345678")} m`).areaM2, null);
});

for (const chu of [
  "Hợp đồng hdt 21 triệu",
  "DT 21 triệu",
  "DT 65",
  "Diện tích: 3pn2wc",
  "Diện tích: 5x20",
  "Diện tích: 20 x 30",
  "Diện tích: 5×20",
  "Diện tích: 25×30",
  "Diện tích: 60-70",
  "Diện tích: 60 - 70",
  "Diện tích: 60/70",
  "Diện tích: 65 triệu",
  "Diện tích: 65 pn",
  "Diện tích: 14.9",
  "Diện tích: 501",
  "Diện tích: 1200",
  "Diện tích: 1.200",
  "Ảnh https://cdn.example/1WUpuksCc5M2FMS93qGF9.jpg",
]) {
  test(`GC1-AC-3 khong doc nham: ${JSON.stringify(chu)}`, () => {
    assert.equal(parsePost(chu).areaM2, null);
  });
}

for (const [chu, so] of [
  ["Diện tích: 21", 21],
  ["Diện tích: 65", 65],
  ["Diện tích: 15", 15],
  ["Diện tích: 500", 500],
  ["Diện tích: 64, 2pn", 64],
]) {
  test(`GC1-AC-3 doi chung cung khuon doc ra so: ${JSON.stringify(chu)}`, () => {
    assert.equal(parsePost(chu).areaM2, so);
  });
}

test("GC1-AC-4 khong doi so da doc: bai co so dam va so thuong giu so thuong", () => {
  const chu = `${DAM("200M2")} view sông\nDiện tích thật 173 m²`;
  assert.equal(parsePost(chu).areaM2, 173);
});
