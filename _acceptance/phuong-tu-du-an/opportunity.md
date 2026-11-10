---
schema_version: 1
slug: phuong-tu-du-an
feature: Tin gắn dự án nằm trọn một xã nhận phường suy ra từ dự án, không đè phường đã có
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

Tin S03 hầu hết chỉ tới tỉnh (56/4.885 có phường, đo 08/11); nhóm S03 lập theo dự án nên dự án là lối rẻ nhất xuống phường.

Hàng DA9 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). registry_inherit lớp suy luận; chỉ khi area_id hiện tại là cấp tỉnh hoặc trống; reassign-areas không bị đè. Tin S06 có dự án từ DS2 cũng dùng được. Kế hoạch: DA4. Sửa 09/11 (mục 40): đứng thêm trên DV1 (mã xã hiện hành của nút dự án); phường suy ra mang nhãn «suy ra từ dự án» và được DF7 tính là phường thật (Q9).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] 0 tin đang có phường bị đổi; số tin S03 có phường trước và sau khớp đếm độc lập; gỡ liên kết dự án thì phát biểu kế thừa bị rút?
- Kết quả nào là SỐNG: [đề xuất] 0 tin đang có phường bị đổi; số tin S03 có phường trước và sau khớp đếm độc lập; gỡ liên kết dự án thì phát biểu kế thừa bị rút
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
