// can-gia-tot-ba-vai-ten-nguon.test.mjs — hàng can-gia-tot-ba-vai-ten-nguon-trong. Tên ca bắt đầu bằng mã AC để probe lọc.
// CG20_SRC / CG20_SCRIPT trỏ bản đột biến (probe _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/dot-bien.mjs).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.env.CG20_SRC ?? path.join(DIR, "can-gia-tot-ba-vai-ten-nguon.mjs");
const SCRIPT = process.env.CG20_SCRIPT ?? path.join(DIR, "can-gia-tot-ba-vai.mjs");
const { danhSachTenNguon, coTenNguonTrong, batBuocCoTen } = await import(pathToFileURL(SRC).href);

// Tên giả, không phải tên nguồn thật (tầng A không vào test).
const DONG = [
  ["tên thường", { real_name: "NguonGiaA" }, "nguongiaa"],
  ["NULL", { real_name: null }, null],
  ["rỗng", { real_name: "" }, null],
  ["chỉ khoảng trắng", { real_name: "   " }, null],
  ["thiếu cột", {}, null],
  ["dòng null", null, null],
  ["không phải chuỗi", { real_name: 42 }, null],
  ["có khoảng trắng hai đầu", { real_name: "  NguonGiaB " }, "nguongiab"],
];

test("AC-1 ma trận 8 dòng sổ nguồn: NULL, rỗng, khoảng trắng, thiếu cột, null, số bị bỏ; tên thật cắt khoảng trắng, chữ thường", () => {
  for (const [ten, dong, mong] of DONG) {
    let ra;
    assert.doesNotThrow(() => { ra = danhSachTenNguon([dong]); }, `dòng ${ten}: ném lỗi`);
    assert.deepEqual(ra, mong === null ? [] : [mong], `dòng ${ten}: ra ${JSON.stringify(ra)}, mong ${JSON.stringify(mong === null ? [] : [mong])}`);
  }
  const tatCa = danhSachTenNguon(DONG.map((d) => d[1]));
  assert.deepEqual(tatCa, ["nguongiaa", "nguongiab"], `cả 8 dòng: ra ${JSON.stringify(tatCa)}`);
});

test("AC-2 tên rỗng không khớp mọi chuỗi; tên thật vẫn bắt được, không phân biệt hoa thường", () => {
  const ten = danhSachTenNguon(DONG.map((d) => d[1]));
  for (const s of ["Bán căn hộ 2PN toà S1.03", "", "trang không có tên nguồn"]) {
    assert.equal(coTenNguonTrong(ten, s), false, `chuỗi «${s}» bị báo lộ tên nguồn giả`);
  }
  // Đối chứng dương: tên có trong chuỗi, khác hoa thường, vẫn bắt.
  assert.equal(coTenNguonTrong(ten, "tin từ NGUONGIAA đăng lại"), true, "tên NguonGiaA viết hoa không bị bắt");
  assert.equal(coTenNguonTrong(ten, "…nguongiab…"), true, "tên NguonGiaB không bị bắt");
});

test("AC-3 script đo ba vai nạp tên qua napTenNguon, chặn danh sách rỗng, soát trang qua coTenNguonTrong; không còn real_name.toLowerCase()", () => {
  const s = readFileSync(SCRIPT, "utf8");
  assert.match(s, /import \{[^}]*napTenNguon[^}]*\} from "\.\/can-gia-tot-ba-vai-ten-nguon\.mjs"/, "script không nạp napTenNguon");
  assert.match(s, /napTenNguon\(c\)/, "script không đọc sổ nguồn qua napTenNguon");
  assert.match(s, /batBuocCoTen\(nap\)/, "script không chặn danh sách tên rỗng");
  assert.match(s, /coTenNguonTrong\(tenNguon, s\)/, "script không soát trang qua coTenNguonTrong");
  assert.doesNotMatch(s, /real_name\.toLowerCase\(\)/, "script còn gọi real_name.toLowerCase() trực tiếp");
});

test("AC-4 không còn tên nguồn nào thì dừng với thông điệp ghim; một tên là đủ để chạy tiếp", () => {
  assert.throws(() => batBuocCoTen({ ten: [], bo: 15 }), /0 tên nguồn để soát \(bỏ 15 dòng sổ nguồn không có tên\)/, "danh sách rỗng không bị chặn");
  assert.deepEqual(batBuocCoTen({ ten: ["nguongiaa"], bo: 14 }), ["nguongiaa"], "một tên vẫn bị chặn");
});
