---
slug: data-api-dong-ba-route-lo
at: 2026-11-24T11:33:58.573Z
sha: be765e6a527738d8afbeaf2e88e9e63210bc49f2
nen: do
cong_cu: xanh
suite: do
luoi: xanh
engine: xanh
---

## Dòng đỏ

- nen suite: DO SAN executors.suite.app ma 2
- nen suite: DO SAN executors.suite.app_ui ma 1
- nen suite: DO SAN executors.suite.pipeline_a ma 1
- nen suite: DO SAN executors.suite.pipeline_b ma 1

## Dòng vàng

- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/contract.md (khong tinh)
- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/decisions.jsonl (khong tinh)
- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/design-floor.json (khong tinh)
- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/design.md (khong tinh)
- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/evals.yaml (khong tinh)
- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/figures/index.md (khong tinh)
- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/gap-probe.md (khong tinh)
- nen suite: TEP CUA VONG _acceptance/data-api-dong-ba-route-lo/usage-report.md (khong tinh)

## Ghi theo lời giám sát (BÁO gs-2411-2, 24/11)

Đỏ nền trên M5 do thiếu dữ liệu thật, không do nhánh: bộ `app` đỏ 21 ca, `app_ui`, `pipeline_a`, `pipeline_b` đỏ ở các ca đọc
dữ liệu thật của máy thu (DB `oneinvest` trên M5 chỉ có lược đồ). Bằng chứng bộ test của hàng này là
`node scripts/ci-test-local.mjs` (năm job theo chuẩn CI) cộng các eval riêng của hàng trên DB dựng từ migration; các bộ chạy
trọn của config không dùng làm bằng chứng trên M5.
