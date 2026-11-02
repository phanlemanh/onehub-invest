// doc-toan-bo.test.ts — hồ sơ _acceptance/s03-llm-doc-toan-bo, phần không cần DB: luật trích dẫn, gạt chữ, đọc trả lời, quyết một tin.
// Model giả của AI SDK — không gọi mạng, không cần khoá. Chữ bài viết tay; số điện thoại, tên nhóm, tên miền đều giả.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kiemTrichLoai, trichCoThat } from "../src/enrich/luat-trich-dan.js";

// ---------- luật trích dẫn (AC-3, AC-4) — ma trận viết trước ----------
const CHU = "Chính chủ bán căn hộ 2PN tầng cao, sổ đỏ, giá 3 tỷ";
const DAT: [string, string, string][] = [
  ["căn hộ", CHU, "bán căn hộ 2PN"],
  ["chung cư", "Cho thuê chung cư Times City 2PN 14tr", "chung cư Times City"],
  ["viết tắt cc", "Bán cc 2PN giá tốt", "Bán cc 2PN"],
];
const KHONG_DAT: [string, string, string | null, string, string][] = [
  ["không có trích", CHU, null, "apartment", "khong-co-trich"],
  ["trích giả", CHU, "bán căn hộ 3PN view hồ", "apartment", "trich-gia"],
  ["không từ khoá", "S9.03 2PN 14tr full đồ", "2PN 14tr", "apartment", "khong-tu-khoa"],
  ["từ khoá loại khác", "Chính chủ bán nhà phố 4 tầng", "bán nhà phố", "apartment", "tu-khoa-loai-khac"],
  ["gần X", "Cho thuê phòng gần chung cư Times City", "gần chung cư Times City", "apartment", "ngu-canh-loai-tru"],
  ["cạnh X", "Bán đất cạnh căn hộ mẫu dự án", "cạnh căn hộ mẫu", "apartment", "ngu-canh-loai-tru"],
  ["cần mua X", "Khách cần mua căn hộ 2PN tầm 3 tỷ", "cần mua căn hộ 2PN", "apartment", "ngu-canh-loai-tru"],
  ["hai loại một câu", "Bán căn hộ và nhà phố cùng khu", "Bán căn hộ và nhà phố", "apartment", "ngu-canh-loai-tru"],
  ["trích né ngữ cảnh gần", "Cho thuê phòng gần chung cư Times City", "chung cư Times City", "apartment", "ngu-canh-loai-tru"],
  ["trích né ngữ cảnh cần mua", "Khách cần mua căn hộ 2PN tầm 3 tỷ", "căn hộ 2PN", "apartment", "ngu-canh-loai-tru"],
  ["loại khác không tự điền", "Chính chủ bán nhà phố 4 tầng", "bán nhà phố", "house", "tu-khoa-loai-khac"],
];

for (const [ten, chu, quote] of DAT) {
  test(`LS1-AC-3 luật đạt: ${ten}`, () => {
    assert.deepEqual(kiemTrichLoai("apartment", quote, chu), { ok: true, ma: "trich-dan:can-ho" }, `LS1-AC-3 ${ten}: phải đạt`);
  });
}
for (const [ten, chu, quote, value, lyDo] of KHONG_DAT) {
  test(`LS1-AC-4 luật không đạt: ${ten}`, () => {
    assert.deepEqual(kiemTrichLoai(value, quote, chu), { ok: false, lyDo }, `LS1-AC-4 ${ten}: phải ra ${lyDo}`);
  });
}

test("LS1 Focus 5: chữ NFD nhiều khoảng trắng, trích NFC vẫn là có thật", () => {
  const nfd = "Chính chủ   bán căn hộ\n2PN".normalize("NFD");
  assert.equal(trichCoThat("bán căn hộ 2PN", nfd), true, "Focus 5: NFD/khoảng trắng làm trích thật thành giả");
  assert.deepEqual(kiemTrichLoai("apartment", "bán căn hộ 2PN", nfd), { ok: true, ma: "trich-dan:can-ho" });
  assert.equal(trichCoThat("bán căn hộ 3PN", nfd), false, "Focus 5 đối chứng: trích giả phải vẫn là giả");
});
