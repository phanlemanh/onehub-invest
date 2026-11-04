// luat-trich-so-phong.test.ts — hồ sơ s03-noi-luat-trich-dan AC-1, AC-2: ma trận viết trước, không suy từ mã.
import { test } from "node:test";
import assert from "node:assert/strict";

import { DANH_SACH_LOAI_KHAC_THAN, kiemTrichLoai } from "../src/enrich/luat-trich-dan.js";

const THAN = "Cho thuê full nội thất, tầng cao, ở ngay";
const baiCo = (q: string, them = "") => `${q} ${THAN} ${them}`.trim();

const DUONG = ["2PN", "5pn", "3 pn", "1n+", "2n2wc", "2N2VS", "2n2w", "1PN+1", "1 phòng ngủ", "studio", "stu", "căn 2PN", "Loại căn: 1N"];
for (const q of DUONG) {
  test(`LBT-AC-1 dạng nhận: ${q}`, () => {
    assert.deepEqual(kiemTrichLoai("apartment", q, baiCo(q)), { ok: true, ma: "trich-dan:so-phong" }, `LBT-AC-1 ca ${q}`);
  });
}
for (const q of ["căn hộ 2PN", "chung cư", "CC 2PN"]) {
  test(`LBT-AC-1 từ khoá cũ giữ mã cũ: ${q}`, () => {
    assert.deepEqual(kiemTrichLoai("apartment", q, baiCo(q)), { ok: true, ma: "trich-dan:can-ho" }, `LBT-AC-1 ca ${q}`);
  });
}

const KHONG_DANG = ["1+", "căn", "10n", "6pn", "0pn", "2 năm", "3 người", "3N2Đ", "stunning", "toà be1"];
for (const q of KHONG_DANG) {
  test(`LBT-AC-2 không có dạng nhận: ${q}`, () => {
    assert.deepEqual(kiemTrichLoai("apartment", q, baiCo(q)), { ok: false, lyDo: "khong-tu-khoa" }, `LBT-AC-2 ca ${q}`);
  });
}
for (const [q, duongDoiChung] of [["nhà 3pn", "3pn"], ["cần mua 2pn", "mua 2pn"], ["cần tìm studio", "tìm studio"]] as const) {
  test(`LBT-AC-2 chốt câu trích: ${q}, đối chứng ${duongDoiChung}`, () => {
    assert.deepEqual(kiemTrichLoai("apartment", q, baiCo(q)), { ok: false, lyDo: "ngu-canh-loai-tru" }, `LBT-AC-2 ca ${q}`);
    assert.equal(kiemTrichLoai("apartment", duongDoiChung, baiCo(duongDoiChung)).ok, true, `LBT-AC-2 đối chứng ${duongDoiChung}`);
  });
}
test("LBT-AC-2 ngữ cảnh đứng trước câu trích: «cần mua 2pn» trích mỗi «2pn»", () => {
  assert.deepEqual(kiemTrichLoai("apartment", "2pn", "Khách cần mua 2pn gần hồ"), { ok: false, lyDo: "ngu-canh-loai-tru" }, "LBT-AC-2 cửa sổ trước");
});
const DANH_SACH_VIET_TAY = [
  "nhà phố", "nhà riêng", "nhà mặt phố", "nhà mặt tiền", "nhà ngõ", "nhà trong ngõ", "nhà 4 tầng", "biệt thự", "liền kề", "shophouse", "đất nền", "lô đất",
  "mảnh đất", "đất thổ cư", "phòng trọ", "nhà trọ", "mặt bằng", "văn phòng", "ki ốt", "kiot",
  "nha pho", "nha rieng", "biet thu", "lien ke", "dat nen", "phong tro", "mat bang", "van phong",
];
test("LBT-AC-2 danh sách đóng trong mã khớp đúng bảng viết tay", () => {
  assert.equal(DANH_SACH_LOAI_KHAC_THAN.length, DANH_SACH_VIET_TAY.length, "LBT-AC-2 số từ của chốt thân bài lệch hợp đồng");
});
for (const tu of DANH_SACH_VIET_TAY) {
  test(`LBT-AC-2 chốt thân bài: ${tu}`, () => {
    assert.deepEqual(kiemTrichLoai("apartment", "3PN", baiCo("3PN", `view ${tu}`)), { ok: false, lyDo: "ngu-canh-loai-tru" }, `LBT-AC-2 ca view ${tu}`);
    // Câu chứa từ khoá căn hộ không qua nhánh mới, chốt thân bài không áp: giữ nguyên hành vi đã ký.
    assert.equal(kiemTrichLoai("apartment", "căn hộ 3PN", baiCo("căn hộ 3PN", `view ${tu}`)).ok, true, `LBT-AC-2 nhánh cũ không đổi: ${tu}`);
  });
}
test("LBT-AC-2 câu trích có từ loại khác, trích giả, model nói loại khác", () => {
  assert.deepEqual(kiemTrichLoai("apartment", "nhà phố 3pn", baiCo("nhà phố 3pn")), { ok: false, lyDo: "tu-khoa-loai-khac" }, "LBT-AC-2 nhà phố trong câu");
  assert.deepEqual(kiemTrichLoai("apartment", "4PN", baiCo("3PN")), { ok: false, lyDo: "trich-gia" }, "LBT-AC-2 trích giả");
  assert.equal(kiemTrichLoai("townhouse", "3PN", baiCo("3PN")).ok, false, "LBT-AC-2 model nói nhà phố");
});
