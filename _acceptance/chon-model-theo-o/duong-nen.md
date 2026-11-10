---
slug: chon-model-theo-o
at: 2026-11-06T20:38:49.017Z
sha: d967378e1d3e94a6e8fcff11d574762be7b0e793
nen: do
cong_cu: xanh
suite: do
luoi: xanh
engine: do
---

## Dòng đỏ

- nen suite: DO SAN executors.test.app_ui ma 1
- nen engine: LECH scripts/pre-merge-check.sh (vendored ≠ dang-chay)
- nen engine: LECH lib/evidence-core.cjs (vendored ≠ dang-chay)

## Dòng vàng

- nen suite: TEP CUA VONG _acceptance/chon-model-theo-o/card-plain.json (khong tinh)
- nen suite: TEP CUA VONG _acceptance/chon-model-theo-o/card.html (khong tinh)
- nen suite: TEP CUA VONG _acceptance/chon-model-theo-o/design-floor.json (khong tinh)
- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [chon-model-theo-o]: hồ sơ có bằng chứng nhưng status chưa arm cổng — status=draft; PR đổi code chịu cổng (agent/scripts/doc-gop-3-model-s03.ts…) mà hồ sơ trong PR chưa arm. Cổng chỉ chấm hồ sơ ở implemented/verified/signed-off, hồ sơ này đang tàng hình. Đặt status: implemented để cổng chấm, hoặc gỡ evidence-report.md / tách hồ sơ khỏi PR nếu bằng chứng thuộc phạm vi đã bỏ.
