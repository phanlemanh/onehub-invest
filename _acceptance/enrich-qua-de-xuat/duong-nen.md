---
slug: enrich-qua-de-xuat
at: 2026-10-22T13:21:25.390Z
sha: 4f18e5ef096c3396cd40fc57a3defb6c50714301
nen: do
cong_cu: do
suite: do
luoi: xanh
engine: xanh
---

## Dòng đỏ

- nen cong-cu: THIEU /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-scan.js (khoa executors.design.ui_check)
- nen suite: DO SAN executors.test.app_ui ma 1

## Dòng vàng

- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [enrich-qua-de-xuat]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=approved; PR đổi code chịu cổng (lib/do-san-tren-nen.cjs…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
