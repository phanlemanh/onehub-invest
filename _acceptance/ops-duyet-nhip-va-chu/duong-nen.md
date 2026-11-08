---
slug: ops-duyet-nhip-va-chu
at: 2026-11-08T00:45:20.833Z
sha: 9a22a0bbe9c2110a7894bb1448ff6a556b582621
nen: do
cong_cu: xanh
suite: do
luoi: xanh
engine: xanh
---

## Dòng đỏ

- nen suite: DO SAN executors.test.app_ui ma 1

## Dòng vàng

- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [ops-duyet-nhip-va-chu]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=draft; PR đổi code chịu cổng (app/src/app/api/v1/ops/review/[id]/decide/route.ts…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
