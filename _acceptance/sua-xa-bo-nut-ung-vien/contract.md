---
schema_version: 1
feature: Lệnh sửa mã xã của danh bạ vật thể (danh-ba-vat-the --sua-xa) bỏ qua nút dự án ứng viên do thẻ luật S06 đúc, để lệnh vẫn chạy được sau khi áp thẻ luật S06 lên máy thu
slug: sua-xa-bo-nut-ung-vien
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-14T11:11:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-14-sua-xa-bo-nut-ung-vien-design.md
---

# Acceptance Contract: sua-xa-bo-nut-ung-vien

## Context

Việc Ngoài-1 của DA32 `ma-du-an-s06-thanh-nut` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 14/11). `suaXaNut` đọc mọi nút
`project` và `kiemTepXa` đòi mỗi nút có mục trong `pipeline/data/xa-nut-du-an.json`; nút ứng viên `mot_loi_khai` do thẻ luật
S06 đúc không có mục, nên áp thẻ xong thì `--sua-xa` hỏng hẳn. Sửa: câu đọc nút bỏ nút `mot_loi_khai` (qua `to_jsonb`, chạy
được trên DB chưa áp 100). Phải gộp trước lời «Áp thẻ luật S06 <băm>».

## Acceptance Criteria

- **AC-1** (cross-layer) Given DB của riêng lượt chép máy thu, đã áp migration 100, có thêm một nút `project` `mot_loi_khai`
  không có mục trong tệp xã, và một nút xác minh bị ghi lệch `area_ids` trước, When `suaXaNut` chạy thật, Then không ném lỗi;
  nút ứng viên giữ nguyên `area_ids`; nút bị ghi lệch được sửa về đúng mục của nó; mọi nút xác minh có `area_ids` đúng mục
  của nó trong tệp xã. Và bản sao lệnh bỏ điều kiện lọc thì ném lỗi gọi tên slug nút ứng viên,
  `area_ids` mọi nút không đổi.
- **AC-2** (cross-layer) Given cùng DB, có thêm một nút `project` `xac_minh` không có mục trong tệp xã, When `suaXaNut` chạy, Then vẫn ném
  lỗi `thiếu nút <slug>` gọi tên nút đó và không ghi gì (luật DV1 không nới cho nút xác minh).
- **AC-3** (cross-layer) Given DB của riêng lượt chép máy thu (ở trạng thái lược đồ hiện có của máy thu, in ra có hay không
  cột `catalog_tier`), When các ca DV1 hiện có của `--sua-xa` chạy không sửa, Then đều xanh; và câu đọc nút của `suaXaNut` chạy trên một bảng chép `asset_nodes` KHÔNG có cột `catalog_tier` thì không lỗi
  và trả đủ mọi nút `project` của bảng ấy (máy thu chưa áp 100 vẫn chạy được lệnh); trên bảng có cột, nút `catalog_tier` NULL
  và nút `xac_minh` vẫn có mặt, chỉ nút `mot_loi_khai` vắng.

## Coverage

Quét theo preset test-matrix (design doc §4):
- Trục A — hạng nút × có mục tệp: xác minh có mục (AC-1) · xác minh thiếu mục (AC-2) · ứng viên không mục (AC-1).
  [CE: luật DV1 `nut-du-an-tro-xa-moi` + DA32 Hỏi-3 — đủ]
- Trục B — lược đồ: chưa có cột catalog_tier (AC-3) · đã áp 100 (AC-1, AC-2, AC-3). [CE: thứ tự gộp trước, áp sau — đủ]

## Out of scope

- Sinh mục tệp xã cho nút ứng viên; nâng hạng nút ứng viên.
- Các bên đọc `asset_nodes` khác trong `danh-ba-vat-the.mjs` (dựng toà theo khu S08 đã lọc theo slug khu cụ thể).
- Áp migration 100 và thẻ luật S06 lên DB máy thu — lời riêng của Mạnh.

## Notes

- Diff hẹp có chủ ý: DA33 (P3) đang sửa cùng `pipeline/danh-ba-vat-the.mjs` và `pipeline/lib/danh-ba-vat-the.mjs`.
