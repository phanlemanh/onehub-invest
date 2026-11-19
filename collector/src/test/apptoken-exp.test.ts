// apptoken-exp.test.ts — 1911-5: docExpAppToken đọc exp JWT appToken, hết hạn → conLaiMs <= 0.
// (bối cảnh sự cố 19/11: 'token OK (327 chars)' là token cũ hết hạn 26/10 — báo xanh giả, 401 cả run.)
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { docExpAppToken, kiemAppToken, nemAuthFail, duyetAppToken } from "../collectors/airdna-research.js";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.chuky`;

test("1911-5: token CÒN HẠN → exp đúng và conLaiMs dương", () => {
  const exp = Math.floor(Date.now() / 1000) + 300;
  const { exp: doc, conLaiMs } = docExpAppToken(jwt({ uid: "1", exp }));
  assert.equal(doc, exp);
  assert.ok(conLaiMs > 0, `conLaiMs phải dương — thực tế ${conLaiMs}`);
});

test("1911-5: token HẾT HẠN → conLaiMs âm (không được báo token OK)", () => {
  const exp = Math.floor(Date.now() / 1000) - 86_400; // hết hạn 1 ngày trước
  const { conLaiMs } = docExpAppToken(jwt({ uid: "1", exp }));
  assert.ok(conLaiMs <= 0, `hết hạn phải conLaiMs <= 0 — thực tế ${conLaiMs}`);
});

test("1911-5: token rác/không payload → conLaiMs -Infinity, không ném", () => {
  assert.equal(docExpAppToken("").conLaiMs, Number.NEGATIVE_INFINITY);
  assert.equal(docExpAppToken("khong-phai-jwt").conLaiMs, Number.NEGATIVE_INFINITY);
  assert.equal(docExpAppToken("eyJ9.eyJbbG9pXQ.chuky").conLaiMs, Number.NEGATIVE_INFINITY);
});

// ---- 1911-5 (MỞ LẠI): chặn trong appToken tách hàm thuần kiemAppToken — đột biến
// đổi điều kiện hết hạn thành không-bao-giờ-đúng phải làm ĐỎ ĐÚNG CA dưới đây.
test("1911-5 kiemAppToken: token HẾT HẠN → NÉM 'ĐÃ HẾT HẠN' kèm ngày — GIẢ ĐỒNG HỒ NĂM 2027 vẫn xanh (không ghim năm)", () => {
  const now = Date.parse("2027-06-15T00:00:00Z"); // mốc cố định — hết hạn tính theo now truyền vào
  const exp = Math.floor(now / 1000) - 3_600;
  assert.throws(() => kiemAppToken(jwt({ uid: "1", exp }), now), /ĐÃ HẾT HẠN 2027-06-1[45]T/, "hết hạn phải ném kèm mốc đúng giờ giả");
});

test("1911-5 kiemAppToken: token RÁC / exp thiếu → NÉM", () => {
  assert.throws(() => kiemAppToken(""), /không đọc được appToken/);
  assert.throws(() => kiemAppToken("khong-phai-jwt"), /ĐÃ HẾT HẠN/);
  assert.throws(() => kiemAppToken(jwt({ uid: "1" })), /ĐÃ HẾT HẠN \(không giải mã được exp\)/, "thiếu exp cũng bị chặn, không báo xanh");
});

test("1911-5 kiemAppToken: token CÒN HẠN → qua, trả dòng 'token OK' kèm số phút", () => {
  const exp = Math.floor(Date.now() / 1000) + 1_800;
  const dong = kiemAppToken(jwt({ uid: "1", exp }));
  assert.match(dong, /token OK \(\d+ chars, hết hạn sau 30 phút\)/, "dòng OK phải khai hạn còn lại");
});

// ---- 1911-10: dừng vì kiemAppToken ném phải in «AUTH FAIL [S02] <ISO>» (bộ đo
// độ tươi đọc dòng này — ca hết hạn trước đây lọt sót). Đột biến bỏ dòng log → đỏ.
test("1911-10 nemAuthFail: ném lại lỗi gốc + in dòng AUTH FAIL [S02] kèm mốc ISO", () => {
  const dong: unknown[] = [];
  const loi = new Error("appToken ĐÃ HẾT HẠN 2027-06-14T23:00:00Z");
  assert.throws(() => nemAuthFail((...a: unknown[]) => dong.push(...a), loi), (e: unknown) => e === loi, "ném lại ĐÚNG lỗi gốc");
  assert.equal(dong.length, 1, "đúng một dòng log");
  assert.match(String(dong[0]), /AUTH FAIL \[S02\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, "dòng AUTH FAIL [S02] kèm mốc ISO");
});
// ---- 1911-10 (MỞ LẠI): appToken chỉ gọi duyetAppToken — ca THẬT «token hết hạn
// → in AUTH FAIL» giờ đo được: ném + fake-log đúng MỘT dòng. Đột biến bỏ bước
// nemAuthFail trong duyetAppToken (catch → throw e) → ca này ĐỎ.
test("1911-10 (MỞ LẠI) duyetAppToken: token hết hạn → NÉM + fake-log đúng MỘT dòng AUTH FAIL [S02]", () => {
  const now = Date.parse("2027-06-15T00:00:00Z");
  const exp = Math.floor(now / 1000) - 3_600;
  const dong: unknown[] = [];
  assert.throws(
    () => duyetAppToken((...a: unknown[]) => dong.push(...a), jwt({ uid: "1", exp }), now),
    /ĐÃ HẾT HẠN 2027-06-1[45]T/,
    "ném lại đúng chẩn đoán hết hạn",
  );
  assert.equal(dong.length, 1, "đúng một dòng log — Ca thật 29/10-19/11: bộ đo độ tươi đọc dòng này");
  assert.match(String(dong[0]), /AUTH FAIL \[S02\] 2027-06-1[45]T\d{2}:\d{2}:\d{2}/, "dòng AUTH FAIL [S02] kèm mốc ISO");
});

test("1911-10 (MỞ LẠI) duyetAppToken: token còn hạn → log dòng OK, không AUTH FAIL", () => {
  const now = Date.parse("2027-06-15T00:00:00Z");
  const exp = Math.floor(now / 1000) + 1_800;
  const dong: unknown[] = [];
  const kq = duyetAppToken((...a: unknown[]) => dong.push(...a), jwt({ uid: "1", exp }), now);
  assert.match(kq, /token OK \(\d+ chars, hết hạn sau 30 phút\)/);
  assert.equal(dong.length, 1);
  assert.doesNotMatch(String(dong[0]), /AUTH FAIL/);
});
