---
slug: eval-classify-theo-chu-ref
at: 2026-11-05T15:29:26.032Z
sha: 467d34774524c9d8ee5a1e047dca389a780e4011
nen: do
cong_cu: xanh
suite: xanh
luoi: xanh
engine: do
---

## Dòng đỏ

- nen engine: LECH scripts/pre-merge-check.sh (vendored ≠ dang-chay)
- nen engine: LECH lib/evidence-core.cjs (vendored ≠ dang-chay)

## Dòng vàng

- nen suite: TEP CUA VONG _acceptance/eval-classify-theo-chu-ref/card.html (khong tinh)
- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [eval-classify-theo-chu-ref]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=draft; PR đổi code chịu cổng (pipeline/eval-classify.mjs…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
