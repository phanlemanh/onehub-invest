import test from "node:test"; import assert from "node:assert/strict";
import { parseWorklist, isGone } from "../collectors/airbnb-listing.js";

test("parseWorklist: strip prefix abnb_ (URL /rooms/ cần id số), bỏ input rác", () => {
  // id từ universe AirDNS/airdna_listings có dạng abnb_<số> (review #1)
  assert.deepEqual(parseWorklist({ ids: ["abnb_123", "abnb_456"] }), ["123", "456"]);
  // id không có prefix giữ nguyên (discovery mode cũ không prefix)
  assert.deepEqual(parseWorklist({ ids: ["789"] }), ["789"]);
  assert.deepEqual(parseWorklist(null), []);
  assert.deepEqual(parseWorklist({ ids: "not-array" }), []);
});

test("isGone: title báo không tồn tại hoặc redirect khỏi /rooms/<id>", () => {
  assert.equal(isGone("Rất tiếc, trang này không tồn tại", "https://www.airbnb.com.vn/rooms/123", "123"), true);
  assert.equal(isGone("Choose your room", "https://www.airbnb.com.vn/", "123"), true);
  assert.equal(isGone("Căn hộ đẹp – Hoàn Kiếm", "https://www.airbnb.com.vn/rooms/123?x=1", "123"), false);
});

test("isGone: biến thể trang đã rút + trang có dữ liệu nguồn thì không GONE (review #7)", () => {
  // các biến thể lỗi thực tế Airbnb vi/EN
  assert.equal(isGone("Nơi ở này không còn tồn tại", "https://www.airbnb.com.vn/rooms/123", "123"), true);
  assert.equal(isGone("This listing is no longer available", "https://www.airbnb.com.vn/rooms/123", "123"), true);
  // host đặt tên chứa từ khóa lỗi nhưng trang CÓ nguồn dữ liệu → không GONE
  assert.equal(
    isGone("Not Found Resort — căn hộ view hồ", "https://www.airbnb.com.vn/rooms/123", "123", true),
    false,
  );
  // redirect khỏi /rooms luôn GONE bất kể dữ liệu
  assert.equal(isGone("Choose your room", "https://www.airbnb.com.vn/", "123", true), true);
});
