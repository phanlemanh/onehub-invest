import test from "node:test"; import assert from "node:assert/strict";
import { parseWorklist, isGone } from "../collectors/airbnb-listing.js";

test("parseWorklist: lấy ids hợp lệ, bỏ input rác", () => {
  assert.deepEqual(parseWorklist({ ids: ["abnb_1", "abnb_2"] }), ["abnb_1", "abnb_2"]);
  assert.deepEqual(parseWorklist(null), []);
  assert.deepEqual(parseWorklist({ ids: "not-array" }), []);
});

test("isGone: title báo không tồn tại hoặc redirect khỏi /rooms/<id>", () => {
  assert.equal(isGone("Rất tiếc, trang này không tồn tại", "https://www.airbnb.com.vn/rooms/123", "123"), true);
  assert.equal(isGone("Choose your room", "https://www.airbnb.com.vn/", "123"), true);
  assert.equal(isGone("Căn hộ đẹp – Hoàn Kiếm", "https://www.airbnb.com.vn/rooms/123?x=1", "123"), false);
});
