---
schema_version: 1
slug: nut-ung-vien-tu-tin
feature: Người vận hành thấy thẻ các dự án, toà mà tin nói tới nhưng danh bạ chưa có, gom theo tần suất kèm tin mẫu, rồi tạo nút ứng viên hoặc trỏ vào nút có sẵn
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

Mạnh 09/11 Q2. S03 là nguồn quan trọng nhất mà mã toà chỉ phân giải 51% qua S08 và S09; S09 gần như không phủ TP.HCM; 974 dự án S06 dưới 10 tin không thuộc hàng nào.

Hàng DA18 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dãy C (nối và duyệt). Toà ứng viên chưa cấp UPI tới khi người duyệt, để danh mục tới sau (DA10) khớp vào thay vì sinh UPI thứ hai. Luật 7: máy chỉ gom và đề xuất.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Tỉ lệ phân giải mã toà S03 ở Ocean Park 1 và Grand Park tăng từ 51%, báo số trước và sau; mã dự án S06 dưới 10 tin có trạng thái hoặc đang chờ thẻ; 0 UPI đúc từ nút ứng viên chưa duyệt; nút ứng viên mang catalog_tier thấp nhất?
- Kết quả nào là SỐNG: [đề xuất] Tỉ lệ phân giải mã toà S03 ở Ocean Park 1 và Grand Park tăng từ 51%, báo số trước và sau; mã dự án S06 dưới 10 tin có trạng thái hoặc đang chờ thẻ; 0 UPI đúc từ nút ứng viên chưa duyệt; nút ứng viên mang catalog_tier thấp nhất
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
