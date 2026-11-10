---
schema_version: 1
slug: noi-du-an-s06
feature: Người vận hành duyệt xong cặp nối cho 282 dự án S06 có từ 10 tin trở lên, mỗi dự án nối vào một nút có xã/phường hoặc bị từ chối có lý do
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

Raw S06 có mã dự án cho 39% tin căn hộ nhưng tin chưa có dự án; 282 dự án có từ 10 tin phủ 7.847 tin căn hộ (31%), đo 08/11.

Hàng DA7 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Máy đề xuất theo tên chuẩn hoá + tỉnh; đội ops duyệt trên thẻ DA3, Mạnh xem mẫu (mục 39). Kế hoạch: DA2.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] 282/282 mã có trạng thái; 0 cặp nối lệch tỉnh; mọi nút mới có ít nhất một area_ids?
- Kết quả nào là SỐNG: [đề xuất] 282/282 mã có trạng thái; 0 cặp nối lệch tỉnh; mọi nút mới có ít nhất một area_ids
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
