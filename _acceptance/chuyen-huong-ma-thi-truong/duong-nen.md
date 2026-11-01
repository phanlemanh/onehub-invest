---
slug: chuyen-huong-ma-thi-truong
at: 2026-11-01T01:29:46.864Z
sha: 376fa5b72e0a14dac2cadc5561980ee548ee8388
nen: do
cong_cu: xanh
suite: do
luoi: do
engine: xanh
---

## Dòng đỏ

- nen suite: DO SAN executors.test.agent ma 1
- nen suite: DO SAN executors.test.app_ui ma 1
- nen luoi: 1 vi pham co san
- VIOLATION [s06-vung-moi-len-canonical]: evidence is stale — code changed after verify (verified_commit c470eb64ba776900fb1b2cf08e36cf85766bcbf3); re-run verify before merge. Changed:

## Dòng vàng

- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [chuyen-huong-ma-thi-truong]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=draft; PR đổi code chịu cổng (db/migrations/064_ma_thi_truong_ngan.sql…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
