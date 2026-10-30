// judge-chung.ts — dựng cặp tin và hàm soi ngưỡng dùng chung cho judge-nguong.test.ts và judge-run.test.ts (PL25).
import assert from "node:assert/strict";
import type { PairData } from "../src/tools/native.js";

export type Tin = { perm2: number | null; area: number | null; phuong: string | null; loai: string | null };
export const TR = 1e6;

/** Cặp tin từ hai bộ số đo; giá = giá/m² × diện tích như bộ chuẩn hoá ghi. */
export function cap(a: Tin, b: Tin): PairData {
  const tin = (t: Tin, id: string) => ({
    offerId: id,
    source: "S03",
    kind: "sale",
    priceVnd: t.perm2 !== null && t.area !== null ? t.perm2 * t.area : null,
    areaM2: t.area,
    pricePerm2: t.perm2,
    bedrooms: null,
    phuong: t.phuong,
    propertyType: t.loai,
    sellerName: null,
  });
  return {
    a: { ...tin(a, "offer_a"), text: "Bán nhà hẻm xe hơi, sổ hồng riêng" },
    b: { ...tin(b, "offer_b"), subject: "Nhà phố hẻm xe hơi" },
    score: 0.92,
    signals: {},
  };
}
/** Soi chữ tìm số ngưỡng — dùng chung với judge-run.test.ts. Trả danh sách chỗ trúng. */
export function soiNguong(text: string): string[] {
  const mau = [/(?<![\d.,])(?:15|10|30)(?:[.,]0+)?\s*%/g, /(?<![\d.,])0\.(?:15|1|3)(?![\d])/g, /[<>≤≥]\s*\d/g];
  return mau.flatMap((m) => [...text.matchAll(m)].map((x) => x[0]));
}
export const kiemKhongNguong = (text: string) => {
  const trung = soiNguong(text);
  assert.equal(trung.length, 0, `AC-2 prompt chứa ngưỡng: ${trung.join(", ")}`);
};

