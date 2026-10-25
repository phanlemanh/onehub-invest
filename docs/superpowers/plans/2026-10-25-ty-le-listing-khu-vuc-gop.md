# ty-le-listing-khu-vuc-gop Implementation Plan

**Goal:** dòng «Listing» của thẻ hiệu chuẩn dùng mẫu số của bảng Độ phủ (tổng listing S02 mọi market thành phần).

**Spec:** `docs/superpowers/specs/2026-10-25-ty-le-listing-khu-vuc-gop-design.md` · hợp đồng
`_acceptance/ty-le-listing-khu-vuc-gop/contract.md` (Cổng Phạm vi: lối (A)).

## Global Constraints

- Chữ chú thích nguyên văn: «Dòng Listing: ${s02} cộng cả ${k} thị trường; ADR, công suất và điểm lấy thị trường đại diện.»
  (k = `representative.ofMarkets`), chỉ khi k > 1.
- ReUI: không đổi component, chỉ chuỗi footnote có sẵn.
- Test DB trong BEGIN…ROLLBACK, khoá 33033.

## Review Focus

- Market S02 có `listing_count` = 0 → cộng 0 (Độ phủ cũng cộng); tỉ lệ null khi tổng 0 (giữ luật `av > 0`).

### Task 1: Mẫu số chung + thẻ + chú thích + phép đo dữ liệu thật (tuần tự, independent: false)

**Files:** `app/src/lib/calibration.ts` (thêm `tongListingS02(counts: (number | null)[]): number | null`) ·
`app/src/lib/queries.ts` (`getAirdnaComparison` dòng Listing; `getTruthfulCoverage` dùng hàm chung) ·
`app/src/components/ops/quality-tables.tsx` (footnote) · `scripts/hieu-chuan-do.mjs` (phép so tỉ lệ) ·
`app/tests/ty-le-listing-gop.test.tsx` · `CONTEXT.md` (mục «Thị trường hiệu chuẩn» thêm câu về dòng Listing).
**Evals:** E1–E8.

- [ ] Chạy test mới trên bản cũ → đỏ (import thiếu `tongListingS02`); ghi sổ `fix` kèm sha.
- [ ] Cài hàm, sửa hai truy vấn, footnote; chạy `cd app && node --import tsx --test tests/ty-le-listing-gop.test.tsx tests/hieu-chuan.test.tsx` → xanh.
- [ ] Thêm phép so vào `scripts/hieu-chuan-do.mjs`; chạy `cd app && node --import tsx ../scripts/hieu-chuan-do.mjs` → exit 0; phá thử (tạm chia cho market đại diện trong bản sao) → dòng FAIL.
- [ ] `cd app && npm test && npx tsc --noEmit && npm run lint`.
- [ ] Commit.
