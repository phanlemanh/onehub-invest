---
slug: cong-tac-test-ghim-ban-cu
at: 2026-10-26T16:21:27.903Z
sha: 08a629f48514c852fd5cb48e8f15c3dd406eb185
nen: do
cong_cu: do
suite: do
luoi: xanh
engine: xanh
---

## Dòng đỏ

- nen cong-cu: THIEU /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.34.0/scripts/design-scan.js (khoa executors.design.ui_check)
- nen suite: DO SAN executors.test.app ma 1

## Dòng vàng

- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [cong-tac-test-ghim-ban-cu]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=draft; PR đổi code chịu cổng (app/src/app/api/v1/ops/source-groups/route.ts…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
