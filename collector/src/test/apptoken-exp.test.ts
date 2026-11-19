// apptoken-exp.test.ts — 1911-5: docExpAppToken đọc exp JWT appToken, hết hạn → conLaiMs <= 0.
// (bối cảnh sự cố 19/11: 'token OK (327 chars)' là token cũ hết hạn 26/10 — báo xanh giả, 401 cả run.)
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { docExpAppToken } from "../collectors/airdna-research.js";

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
