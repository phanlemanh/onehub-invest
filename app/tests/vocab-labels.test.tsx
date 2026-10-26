// vocab-labels.test.tsx — PL6 (VB-AC-6): nhãn Ops đọc từ sổ từ vựng mà giữ ĐÚNG byte nhãn trước vòng.
// Bảng ghim nguyên văn ops-labels.ts trước khi chuyển sang LABELS_VI (14 dòng).
import { test } from "node:test";
import assert from "node:assert/strict";

import { confidenceLabel, offerKindLabel, priceTierLabel, propertyTypeLabel } from "../src/lib/ops-labels";

const GHIM: [typeof propertyTypeLabel, string, string][] = [
  [propertyTypeLabel, "apartment", "Căn hộ"],
  [propertyTypeLabel, "house", "Nhà riêng"],
  [propertyTypeLabel, "land", "Đất"],
  [propertyTypeLabel, "room", "Phòng"],
  [propertyTypeLabel, "commercial", "Mặt bằng"],
  [propertyTypeLabel, "unknown", "Chưa rõ"],
  [offerKindLabel, "sale", "Bán"],
  [offerKindLabel, "rent_lt", "Cho thuê"],
  [confidenceLabel, "high", "cao"],
  [confidenceLabel, "medium", "trung bình"],
  [confidenceLabel, "low", "thấp"],
  [priceTierLabel, "P0", "giá giao dịch (P0)"],
  [priceTierLabel, "P1", "giá nội bộ (P1)"],
  [priceTierLabel, "P2", "giá công khai (P2)"],
];

test("VB-AC-6 nhãn giữ byte: 14 nhãn cũ đọc từ sổ ra y nguyên", () => {
  assert.equal(GHIM.length, 14);
  for (const [fn, code, nhan] of GHIM) {
    const r = fn(code);
    assert.equal(r.label, nhan, `${code}`);
    assert.equal(r.known, true, `${code} phải known`);
  }
});

test("VB-AC-6 đối chứng: code ngoài sổ → «Giá trị khác», known false", () => {
  for (const fn of [propertyTypeLabel, offerKindLabel, confidenceLabel, priceTierLabel]) {
    assert.deepEqual(fn("khong_co"), { label: "Giá trị khác", known: false });
  }
});
