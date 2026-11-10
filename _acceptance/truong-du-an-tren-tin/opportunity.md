---
schema_version: 1
slug: truong-du-an-tren-tin
feature: Tin rao mọi nguồn ghi được phát biểu dự án, phân khu và phường: field_assertions nhận project_node_id, subzone_node_id và area_id ở resource Property
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

GCQ2 cần nơi chứa dự án, phân khu trên tin («chốt nơi chứa ở Cổng Phạm vi»); trigger 082 chỉ cho area_id ở Building nên kế thừa phường bị chặn.

Hàng DA2 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Phải gộp trước Cổng Phạm vi của GCQ2. project_node_id ánh RESO SubdivisionName; subzone_node_id là extension ComplexName trên Property; giá trị là asset_nodes.id dạng chữ. Kế hoạch: DF1.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Ba trường ghi được ở Property với mọi phương pháp hợp lệ; trường lạ vẫn bị từ chối; test trigger xanh; mappings.yaml khai đủ 6 điều kiện ADR-0011 cho extension?
- Kết quả nào là SỐNG: [đề xuất] Ba trường ghi được ở Property với mọi phương pháp hợp lệ; trường lạ vẫn bị từ chối; test trigger xanh; mappings.yaml khai đủ 6 điều kiện ADR-0011 cho extension
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
