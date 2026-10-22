import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// AC-10: bảng đề xuất enrichment và hàng duyệt chứa trích đoạn tin gốc (có
// thể có SĐT/tên người đăng) — không bao giờ được vào FILL của sync-cloud.
// Đọc tĩnh mã nguồn, không import sync-cloud.mjs (import sẽ chạy sync thật).

const SYNC_PATH = new URL("../sync-cloud.mjs", import.meta.url);
const PII_TABLES = ["enrichment_proposals", "review_queue"];

/** Rút mảng `const FILL = [ ... ]` từ nội dung sync-cloud.mjs. */
export function readFillList(source) {
  const m = source.match(/const\s+FILL\s*=\s*\[([\s\S]*?)\]/);
  if (!m) throw new Error("không tìm thấy FILL");
  return [...m[1].matchAll(/["'`]([A-Za-z0-9_]+)["'`]/g)].map((x) => x[1]);
}

/** Trả về thông điệp vi phạm đầu tiên, hoặc null nếu FILL sạch. */
function piiViolation(fill) {
  for (const t of PII_TABLES) {
    if (fill.includes(t)) return `PII: ${t} trong FILL`;
  }
  return null;
}

const real = readFileSync(SYNC_PATH, "utf8");

test("AC-10 PII không lên cloud: FILL thật không có bảng đề xuất/hàng duyệt", () => {
  const fill = readFillList(real);
  // đối chứng dương: bộ đọc thật sự đọc ra danh sách bảng của sync-cloud
  assert.ok(fill.includes("sale_offers"), "bộ đọc không thấy sale_offers trong FILL");
  assert.ok(!fill.includes("enrichment_proposals"), "PII: enrichment_proposals trong FILL");
  assert.ok(!fill.includes("review_queue"), "PII: review_queue trong FILL");
  assert.equal(piiViolation(fill), null);
});

test("AC-10 chiều đỏ: chèn enrichment_proposals vào FILL → bộ đọc phát hiện", () => {
  const tampered = real.replace(
    /const\s+FILL\s*=\s*\[/,
    (head) => `${head}\n  "enrichment_proposals",`,
  );
  assert.notEqual(tampered, real, "không chèn được vào FILL");
  const fill = readFillList(tampered);
  assert.ok(fill.includes("sale_offers"));
  assert.equal(piiViolation(fill), "PII: enrichment_proposals trong FILL");
});

test("readFillList ném lỗi ghim khi không có FILL", () => {
  assert.throws(() => readFillList("const OTHER = [\"a\"];"), /không tìm thấy FILL/);
});
