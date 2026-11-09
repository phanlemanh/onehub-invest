---
schema_version: 1
slug: toa-s09-vao-danh-ba
feature: Phân khu và toà S09 vào danh bạ không sinh toà trùng, và có ba số quyết định thu S09: phủ trên dự án của S03, phủ trên 282 dự án S06, phân giải mã toà S03
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh chốt gói danh bạ dự án toàn diện 09/11 «Theo khuyến nghị» (Q1–Q9) và bảo «Gửi cho Giám Sát mở phiên thực hiện»; giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-09T15:25:52Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Mạnh duyệt mốc mở thu S09 ngày 08/11 (mục 39); cùng ngày Mạnh chọn đo cả hai thước, S03 là nguồn quan trọng nhất.

Hàng DA10 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Toà chỉ có từ S09 nhận catalog_tier thấp nhất. Số đo sơ bộ 08/11: phủ thước S03 ≈ 99% bài ở nhóm một dự án; phủ thước S06 ≈ 4,6% (S09 là danh mục Hà Nội, 252/282 dự án S06 ở HCM). Không đạt nấc 2: Claude báo liên làn để ZCode tìm đường khác cho HCM, Đà Nẵng. Kế hoạch: DA5 + DO-S09. Sửa 09/11 (mục 40): khớp nút ứng viên từ tin.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] 0 toà có hai UPI; toà khớp S08 thành bí danh, không khớp thì lên thẻ; có hai số phủ (thước S03: tỉ lệ bài S03 ở nhóm riêng một dự án thuộc dự án có trong S09; thước S06: tỉ lệ 282 dự án S06) và số phân giải (mẫu số: mã toà S03 khác nhau đã chuẩn hoá, bỏ mã cụm). Nấc 1 DAZ2 mở khi phủ thước S03 ≥ 50% và phân giải ≥ 70%; nấc 2 khi thêm phủ thước S06 ≥ 50%; toà S09 khớp nút ứng viên của DA18 thì nút ấy lên tier S09 và mới đúc UPI?
- Kết quả nào là SỐNG: [đề xuất] 0 toà có hai UPI; toà khớp S08 thành bí danh, không khớp thì lên thẻ; có hai số phủ (thước S03: tỉ lệ bài S03 ở nhóm riêng một dự án thuộc dự án có trong S09; thước S06: tỉ lệ 282 dự án S06) và số phân giải (mẫu số: mã toà S03 khác nhau đã chuẩn hoá, bỏ mã cụm). Nấc 1 DAZ2 mở khi phủ thước S03 ≥ 50% và phân giải ≥ 70%; nấc 2 khi thêm phủ thước S06 ≥ 50%; toà S09 khớp nút ứng viên của DA18 thì nút ấy lên tier S09 và mới đúc UPI
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
