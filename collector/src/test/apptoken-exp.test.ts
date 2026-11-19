// apptoken-exp.test.ts — 1911-5: docExpAppToken đọc exp JWT appToken, hết hạn → conLaiMs <= 0.
// (bối cảnh sự cố 19/11: 'token OK (327 chars)' là token cũ hết hạn 26/10 — báo xanh giả, 401 cả run.)
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { docExpAppToken, kiemAppToken } from "../collectors/airdna-research.js";

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
test("1911-5 kiemAppToken: token HẾT HẠN → NÉM 'ĐÃ HẾT HẠN' kèm ngày", () => {
  const exp = Math.floor(Date.now() / 1000) - 3_600;
  assert.throws(() => kiemAppToken(jwt({ uid: "1", exp })), /ĐÃ HẾT HẠN 2026-/, "hết hạn phải ném kèm mốc");
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
