// gop-trung-s03.test.mjs — khoá gom repost S03 (transform-zalo bước 4) không gộp bài của nhiều người khi nội dung thiếu
// phường hoặc diện tích (26/10: 95 bài «cho thuê 12 triệu» thành một tin). Hồ sơ: _acceptance/s03-gop-trung-dung.
// Thuần — không DB; ca chạy cả lượt transform ở gop-trung-s03.itest.mjs.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { normText, parsePost, repostKey } from "../transform-zalo.mjs";

/** Bài đã đọc như bước 2 của transform: parsePost + phường do matchPhuong gắn (ở đây truyền thẳng). */
const doc = (text, phuong = null) => ({ ...parsePost(text), phuong });
const THIEU = "Cho thuê căn hộ 2PN full đồ, giá 12 triệu/tháng";
const DU = "Bán căn hộ 2PN 66.7m2 Nghĩa Đô, giá 3.17 tỷ";

test("GT-AC-1 thiếu phường và diện tích: hai người đăng cùng nội dung → hai khoá; một người đăng lại → một khoá", () => {
  const pr = doc(THIEU);
  assert.equal(pr.areaM2, null);
  const a1 = repostKey(pr, { sender_id: "A", text: THIEU });
  const a2 = repostKey(pr, { sender_id: "A", text: `${THIEU} !!` });
  const b = repostKey(pr, { sender_id: "B", text: THIEU });
  assert.equal(a1, a2, "cùng người đăng lại phải gộp");
  assert.notEqual(a1, b, "hai người đăng khác nhau bị gộp");
});

test("GT-AC-1 thiếu phường, có diện tích vẫn phân biệt người đăng", () => {
  const pr = doc(DU);
  assert.equal(pr.areaM2, 66.7);
  assert.notEqual(repostKey(pr, { sender_id: "A" }), repostKey(pr, { sender_id: "B" }));
});

test("GT-AC-2 đủ phường và diện tích: khoá như cũ, bài người khác đăng lại cùng căn vẫn gộp", () => {
  const pr = doc(DU, "nghia-do");
  const a = repostKey(pr, { sender_id: "A" });
  assert.equal(a, repostKey(pr, { sender_id: "B" }));
  // Khoá nội dung giữ nguyên công thức trước vòng — nhóm đủ trường không đổi offer_id/không tách.
  assert.equal(a, `sale|nghia-do|${pr.priceVnd}|66.7|2`);
});

test("GT-AC-3 không có sender_id: SĐT trong bài phân biệt; không SĐT: chữ bài đã chuẩn hoá", () => {
  const pr1 = doc(`${THIEU}. LH 0912 345 678`);
  const pr2 = doc(`${THIEU}. LH 0987 654 321`);
  assert.notEqual(repostKey(pr1, {}), repostKey(pr2, {}), "hai SĐT khác nhau bị gộp");
  const pr = doc(THIEU);
  assert.equal(repostKey(pr, { text: THIEU }), repostKey(pr, { text: `  ${THIEU.toUpperCase()}…` }), "chỉ khác hoa/thường, dấu câu");
  assert.notEqual(repostKey(pr, { text: THIEU }), repostKey(pr, { text: `${THIEU}, tầng 12` }));
});

test("GT-AC-3 normText: NFC, chữ thường, gộp dấu cách và dấu câu", () => {
  assert.equal(normText("  Cho THUÊ,\n2PN…  "), "cho thuê 2pn");
  assert.equal(normText("Thuê".normalize("NFD")), "thuê");
  assert.equal(normText(null), "");
});
