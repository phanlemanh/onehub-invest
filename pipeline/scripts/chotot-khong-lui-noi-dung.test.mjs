import test from "node:test"; import assert from "node:assert/strict";
import { UPSERT_SQL } from "../import-chotot.mjs";

// 2510-6 (claudedp, Ngoài-1 của giu-captured-at): nạp lại snapshot CŨ không được
// ghi đè nội dung — WHERE chặn cả lệnh update khi EXCLUDED cũ hơn dòng hiện có.
// Kiểm cấu trúc SQL (ngữ nghĩa thật kiểm trên DB bản chép, ghi trong XONG).
test("upsert có WHERE EXCLUDED.captured_at >= dòng hiện có, đặt SAU mọi SET", () => {
  const iWhere = UPSERT_SQL.indexOf("WHERE EXCLUDED.captured_at >= stg_chotot_ads.captured_at");
  assert.ok(iWhere > 0, "có mệnh đề WHERE của 2510-6");
  const iSet = UPSERT_SQL.indexOf("DO UPDATE SET");
  const iLastSet = UPSERT_SQL.lastIndexOf("= EXCLUDED.");
  assert.ok(iSet > 0 && iLastSet > iSet && iWhere > iLastSet, "WHERE đứng sau mọi phép SET");
});

test("các cột nội dung + snapshot_id + captured_at đặt THẲNG EXCLUDED (hết CASE của 2410-1 v2)", () => {
  assert.ok(UPSERT_SQL.includes("payload = EXCLUDED.payload"), "payload = EXCLUDED");
  assert.ok(UPSERT_SQL.includes("price = EXCLUDED.price"), "price = EXCLUDED");
  assert.ok(UPSERT_SQL.includes("snapshot_id = EXCLUDED.snapshot_id"), "snapshot_id = EXCLUDED");
  assert.ok(UPSERT_SQL.includes("captured_at = EXCLUDED.captured_at"), "captured_at = EXCLUDED");
  assert.ok(!UPSERT_SQL.includes("CASE WHEN"), "không còn CASE — WHERE chặn trọn lệnh update");
});

test("should-NOT-fire: dấu bằng bị đổi thành > sẽ hổng 'nạp lại cùng snapshot'", () => {
  // idempotent yêu cầu >= : nạp lại CÙNG snapshot (bằng mốc) vẫn update —
  // rào cấu trúc: mất dấu >= (đổi thành >) là regression
  assert.match(UPSERT_SQL, />= stg_chotot_ads\.captured_at/);
});
