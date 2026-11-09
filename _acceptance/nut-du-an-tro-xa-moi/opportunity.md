---
schema_version: 1
slug: nut-du-an-tro-xa-moi
feature: Mọi nút dự án trong danh bạ trỏ mã xã/phường hiện hành
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

Đo 09/11 (phiên Định vị S03): 15/19 mã xã của nút dự án trỏ xã cũ không còn trong areas sau PX1. PX2, DA7 tạo nút mới có area_ids và DA9 kế thừa phường từ dự án, nên mã phải đúng trước.

Hàng DV1 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dãy B (danh bạ vật thể), hàng đầu. asset_nodes lên cloud ở lượt đồng bộ kế. Cùng mã DV1 với đề xuất của phiên Định vị S03.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] 20/20 mã trong asset_nodes.area_ids có trong areas sau PX1; nút Grand Park kiểm lại hai xã theo nguồn có tên; dựng lại danh bạ ra cùng số toà, 0 UPI đổi?
- Kết quả nào là SỐNG: [đề xuất] 20/20 mã trong asset_nodes.area_ids có trong areas sau PX1; nút Grand Park kiểm lại hai xã theo nguồn có tên; dựng lại danh bạ ra cùng số toà, 0 UPI đổi
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
