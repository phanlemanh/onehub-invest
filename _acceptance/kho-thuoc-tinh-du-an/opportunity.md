---
schema_version: 1
slug: kho-thuoc-tinh-du-an
feature: Thuộc tính của dự án và phân khu ghi được thành phát biểu có nguồn: field_assertions nhận resource Subdivision, Complex với các field đã kiểm RESO DD 2.1, bộ phân xử dựng cột cấp dự án, chủ đầu tư kế thừa xuống toà
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

Mạnh 09/11 Q1: tách phần mở chỗ ghi khỏi DA11, để thuộc tính từ S08, S09 không phải chờ thu S07 (điều khoản cấm dùng thương mại). Hôm nay 0 phát biểu cấp dự án.

Hàng DA15 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dãy A (nền phát biểu), sau DA2 vì cùng sửa trigger field_assertions. Danh sách field: báo cáo 09/11 mục (f), gồm BuildingId, ShortTermRentalAllowedYN, LeaseRestrictionsYN, CertificateOfOccupancyYN, ParcelNumber, Zoning, CommonInterest, AssociationName cùng các field ưu tiên 1–2 của docs/research/danh-ba-du-an-0811.md §9.4; bỏ BalconyDirection (dùng direction_faces của GN1), dùng FoundationArea thay BuildingFootprintArea. Số migration giám sát cấp.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Mỗi field khai ghi được ở đúng resource, field lạ bị từ chối; 0 giá trị ghi thẳng vào asset_nodes.meta (legal_note cũ thành phát biểu hoặc rút); mappings.yaml khai đủ 6 điều kiện ADR-0011 cho mỗi extension; SourceSystemName, OriginatingSystemName không được khai?
- Kết quả nào là SỐNG: [đề xuất] Mỗi field khai ghi được ở đúng resource, field lạ bị từ chối; 0 giá trị ghi thẳng vào asset_nodes.meta (legal_note cũ thành phát biểu hoặc rút); mappings.yaml khai đủ 6 điều kiện ADR-0011 cho mỗi extension; SourceSystemName, OriginatingSystemName không được khai
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
