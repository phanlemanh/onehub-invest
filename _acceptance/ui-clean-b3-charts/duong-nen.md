---
slug: ui-clean-b3-charts
at: 2026-10-22T23:15:47.967Z
sha: 010b7bf8e742a4ade8d99e60e40cb4a693c31553
nen: do
cong_cu: do
suite: xanh
luoi: do
engine: do
---

## Dòng đỏ

- nen cong-cu: THIEU /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-scan.js (khoa executors.design.ui_check)
- nen luoi: 1 vi pham co san
- VIOLATION [ui-standards-reui]: evidence is stale — code changed after verify (verified_commit 50ea40b573faebf006ee099f7b4f511de74214b8); re-run verify before merge. Changed:
- nen engine: LECH lib/evidence-core.cjs (vendored ≠ dang-chay)
- nen engine: LECH lib/nhan-canh-gay.cjs (vendored ≠ dang-chay)
- nen engine: LECH lib/do-san-tren-nen.cjs (vendored ≠ dang-chay)
- nen engine: LECH scripts/product-map.mjs (vendored ≠ dang-chay)

## Dòng vàng

- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [ui-clean-b3-charts]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=approved; PR đổi code chịu cổng (.claude/hooks/tests/typecheck-changed.selftest.sh…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
