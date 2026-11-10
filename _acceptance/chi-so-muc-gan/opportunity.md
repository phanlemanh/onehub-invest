---
schema_version: 1
slug: chi-so-muc-gan
feature: Người vận hành mở trang đo hằng ngày và thấy phân bố tin theo sáu mức gắn (căn, trục, toà, phân khu, dự án, phường) theo nguồn × vùng × loại nhà, kèm cảnh báo khi một ô giảm
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

Chỉ số chính của kế hoạch danh bạ dự án là phân bố tin theo mức gắn.

Hàng DA14 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dùng lại do-hang-ngay.mjs của DO1. Ngưỡng cảnh báo: giảm 5 điểm % so với trung bình 7 ngày. Kế hoạch: DA9.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Bảng có đủ sáu mức cho mỗi nguồn và khớp đếm SQL độc lập; cấy một đêm giảm 6 điểm % thì có cảnh báo; lệch cơ cấu không bật đỏ?
- Kết quả nào là SỐNG: [đề xuất] Bảng có đủ sáu mức cho mỗi nguồn và khớp đếm SQL độc lập; cấy một đêm giảm 6 điểm % thì có cảnh báo; lệch cơ cấu không bật đỏ
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
