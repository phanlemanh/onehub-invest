---
schema_version: 1
feature: Lược đồ mẫu của data-api (db/schema.sql + seed.sql) đủ bảng cho tài nguyên Property (danh bạ nhà), và một probe gọi mọi đường khai trong /openapi.json trên DB mẫu để route nào trả 500 thì đỏ (PB8)
slug: data-api-schema-mau-du-bang-property
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-28T02:45:09Z
approved_by:
approved_at:
---

# Acceptance Contract: data-api-schema-mau-du-bang-property

## Context

`data-api/db/schema.sql` tự nhận là lược đồ mẫu DUY NHẤT (PB2 AC-9) cho người dùng kho công khai, nhưng thiếu các quan hệ mà
bốn đường `/v1/properties*` của PB6 đọc (`asset_nodes`, `buildings`, `units`, `registry_aliases`, `field_assertions`, view
`offer_building`, cột `sale_offers.offer_status`). Đo S1 (28/11, probe `moi-route.mjs --chi-dem` trên main 5013d45c0): 12 đường
trong `/openapi.json`, 19 lời gọi, **4 đường trả 500** — cả bốn đường Property. Probe lược đồ mẫu của PB2 (E9) không gọi
`/v1/properties` nên lỗ không đỏ. GS cắt PB8 (28/11), điều kiện trước khi mở API / sync-public. Con số của hàng: số đường
openapi trả 500 trên DB mẫu **4 → 0**.

## Criteria

- AC-1: Given PostGIS rỗng, When áp `data-api/db/schema.sql` rồi `data-api/seed.sql`, Then không lỗi; và bốn đường Property trả
  đúng hợp đồng PB6 trên DB mẫu: `?project=<dự án mẫu>` 200 với ≥ 1 toà và toà đầu có `activeListingCount` ≥ 1 (qua view
  `offer_building`); dự án không có 200 rỗng; `/lookup` theo tên dự án mẫu, tên toà, mã căn 200 với đúng 1 căn; toà 200, toà
  không có 404; căn 200.
- AC-2: Given DB mẫu của AC-1, When gọi MỌI đường trong `/openapi.json` theo bảng mẫu gọi viết trước trong probe, Then số
  đường trả 500 = 0 (S1: 4), mọi lời gọi đúng mã mong; đường trong openapi không có mẫu gọi → «PB8 đường openapi chưa có mẫu
  gọi: <đường>»; chiều đỏ cùng lượt: schema.sql + seed.sql bỏ khúc «PB8» → đường Property trả 500 với «PB8 route trả 500 trên
  DB mẫu: /v1/properties»; thêm một đường giả vào openapi → thông điệp «chưa có mẫu gọi» gọi đúng đường đó.
- AC-3: Given lược đồ mẫu sau hàng, When so `information_schema.columns` của sáu quan hệ và cột `sale_offers.offer_status` trên
  DB mẫu với DB thật của máy (chỉ đọc lược đồ, không đọc dòng), Then cùng tập cột, cùng kiểu; chiều đỏ cùng lượt: đổi kiểu
  `units.floor` trong bản chép → đúng một lệch «PB8 lệch hình cột: units.floor»; và bộ quét tên nguồn thật của PB5
  (`scripts/data-api-ten-nguon.test.mjs`) xanh trên cây — lược đồ, dữ liệu mẫu không mang tên nguồn thật, dữ liệu mẫu là bịa.
- AC-4: Given nhánh sau hàng, When soát diff so origin/main, Then mọi tệp đổi nằm trong `data-api/db/schema.sql`,
  `data-api/seed.sql`, `_acceptance/data-api-schema-mau-du-bang-property/**`, khoá `executors.*.dapi_smp*` của
  `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`; không tệp nào dưới `data-api/src/**` đổi; test data-api xanh.

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- OOS-1: Không đổi route nào (`data-api/src/**`); không đổi hành vi PB6.
- OOS-2: Thân view `offer_building` của lược đồ mẫu rút gọn (chỉ nhánh «toà» từ phát biểu ghép toà trên bài S03); nhánh «phân
  khu» của view thật đọc bảng nguồn kho không có trong lược đồ mẫu — cùng cột, khác thân.
- OOS-3: Trigger chỉ-thêm, kiểm gộp và khoá ngoại tới `iso_regions`, `stacks` của DB thật không chép — lược đồ mẫu chỉ để đọc thử.
- OOS-4: Ô «bản cũ» của probe E9 PB2 (`luoc-do-mau.mjs`) đỏ sẵn trên main vì lấy nền bằng merge-base (đã chứa PB2) — không sửa
  ở hàng này.

## Notes

- Nhánh `fix/data-api-schema-mau-du-bang-property` do U2 tạo từ main 5013d45c0.
