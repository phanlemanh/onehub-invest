---
slug: s03-noi-luat-trich-dan
at: 2026-11-04T00:13:17.301Z
sha: 7bc6da8964df71bfbb45988d8941252c67ac9fb9
nen: do
cong_cu: xanh
suite: do
luoi: do
engine: xanh
---

## Dòng đỏ

- nen suite: DO SAN executors.test.agent ma 1
- nen luoi: 1 vi pham co san
- VIOLATION [s03-llm-doc-toan-bo]: evidence is stale — code changed after verify (verified_commit 3bb3b50eaabd0864ffcf11149dc2934d0bfb2305); re-run verify before merge. Changed:

## Dòng vàng

- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [s03-noi-luat-trich-dan]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=draft; PR đổi code chịu cổng (agent/scripts/doc-toan-bo-s03.ts…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
