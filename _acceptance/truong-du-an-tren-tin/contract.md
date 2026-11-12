---
schema_version: 1
feature: DA2 — tin rao mọi nguồn ghi được phát biểu dự án, phân khu và phường (project_node_id, subzone_node_id, area_id ở resource Property), migration 096
slug: truong-du-an-tren-tin
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [db, pipeline]
status: verified
approved_by: Mạnh
approved_at: 2026-11-12
design_doc: docs/superpowers/specs/2026-11-12-truong-du-an-tren-tin-design.md
---

# Acceptance Contract: truong-du-an-tren-tin

## Context

GCQ2 cần nơi chứa dự án, phân khu trên tin; trigger 082 chỉ cho `area_id` ở Building nên kế thừa phường bị chặn (lộ trình DA2,
mã kế hoạch DF1). Hàng mở `field_assertions` cho ba trường ở resource Property bằng migration 096 (chạy sau 095 của DV4) và khai
sổ từ vựng. Hạng T3 vì chạm `db/migrations/**`.

## Criteria

- AC-1: Given DB thử dựng từ chuỗi migration của nhánh (gồm 095, 096), When chèn phát biểu Property (khoá `S0x:…`) cho
  `project_node_id` (id nút `project`), `subzone_node_id` (id nút `subzone`, và id một nút `building` cũ — phân khu Grand Park)
  và `area_id` (id khu vực `submarket`), mỗi trường với đủ chín cặp lớp/phương pháp hợp lệ (fact·hitl, fact·source_field,
  observed·parser, observed·e1_rule, observed·e2_llm, observed·legacy, inferred·e1_rule, inferred·e2_llm,
  inferred·registry_inherit), Then cả 36 dòng ghi được và đọc lại đúng giá trị.
- AC-2: Given cùng DB, When chèn ma trận ca sai viết trước, Then mỗi ca bị từ chối với thông điệp gọi tên trường: trường lạ
  (`project_name`) → CHECK `field_assertions_field_chk`; `project_node_id` là id nút `subzone`, id nút `building`, id không tồn
  tại, chữ `abc`, số đệm `012` → «project_node_id»; `subzone_node_id` là id nút `project`, id không tồn tại, chữ `abc`, `0` →
  «subzone_node_id»; `area_id` Property là khu vực cấp `market` hay mã không tồn tại → «area_id phải là phường/xã»;
  `project_node_id`, `subzone_node_id` ở resource Building và `builder_name` ở Property → «không thuộc resource»; sau ma trận số
  dòng của các trường ấy không tăng.
- AC-3: Given cùng DB, When chèn các ca đã đúng trước hàng này, Then vẫn ghi được: `area_id` và `builder_name` ở Building,
  `floor_raw` và `floor_band` (095) ở Property; luật khoá ↔ resource và `registry_inherit` ↔ `inferred` vẫn từ chối như 082.
- AC-4: Given DB đã có 096, When áp 096 lần hai, Then không lỗi và dấu lược đồ (định nghĩa CHECK, thân hàm trigger, tập dòng
  `ref_lookup` của trục `assertion_field`) không đổi.
- AC-5: Given `pipeline/mappings.yaml`, When đọc trục `assertion_field` và `canonical.fields`, Then trục có `project_node_id`
  (`dd_lookup: SubdivisionName`), `subzone_node_id`, `area_id` nhãn «Phường»; `canonical.fields.subzone_node_id` có `dd: null`,
  `rationale` nêu đủ sáu điều kiện ADR-0011 Qđ 3 và `checked_on` — điều kiện 6 (DQ) trỏ `pipeline/dq-enum-vocab.mjs` (tệp có thật)
  cho miền giá trị và hàng DA9 cho độ phủ (chưa có: điều kiện 6 thoả một phần tới khi DA9 gộp); `canonical.fields.project_node_id.dd`
  = `SubdivisionName` và `canonical.fields.area_id` có mặt; `node pipeline/vocab.mjs --check` thoát 0; trên DB thử,
  `vocab.mjs --check-db` thoát 0 (ref_lookup và CHECK khớp sổ).
- AC-6: Given cây làm việc, When chạy `cd pipeline && npm test`, `cd app && npm test`, `cd app && npx tsc --noEmit && npm run lint` (sau `npx next typegen`
  ở worktree mới)
  và `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs`, Then tất cả thoát 0 (DBV-AC-1 của 082 xanh
  không sửa ca).

## Coverage

Bỏ quét không gian AC — xem dòng sổ `descope` «bỏ coverage-scan» (bản thay): ba trục viết trước trong AC-1…AC-3 — ba trường × chín
cặp lớp/phương pháp (ca đúng); ba trường × {sai loại nút, không tồn tại, không phải số, số đệm} và ba trường × resource sai (ca
sai); luật cũ của 082, 095 (ca giữ nguyên); đổi lại không có bằng chứng độ phủ ngoài ba trục ấy.

## Out of scope

- Dựng cột trên `sale_offers` hay bộ phân xử cho ba trường; bộ ghi phát biểu dự án/phân khu (GCQ2, DF7, DA9).
- Kế thừa phường từ dự án và đổi loại ba nút Grand Park (DA1).
- Áp 096 lên DB máy thu hay cloud — lời riêng của Mạnh.
- DQ độ phủ ba trường trên tin — DA9 (chỉ số mức gắn mỗi đêm).
- Dòng đỏ đường nền `executors.test.app` (tsc thiếu `LayoutProps`/`PageProps` ở worktree mới chưa sinh `.next/types`) — môi
  trường, gỡ bằng `next typegen`, không do hàng này.

## Notes
