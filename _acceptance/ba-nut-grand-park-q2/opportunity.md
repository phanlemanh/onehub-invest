---
schema_version: 1
slug: ba-nut-grand-park-q2
feature: Ba nút Grand Park mang loại theo luật dự án con hay phân khu, Ocean Park 1, 2, 3 có dự án cha Ocean Park, không còn nút asset_nodes loại building, và lệnh dựng danh bạ vẫn ra cùng toà
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

Mục 39 Hỏi-2: khác chủ đầu tư hoặc mở bán riêng → dự án con có cha; cùng chủ đầu tư → phân khu. danh-ba-vat-the.mjs:39-47 đang tìm phân khu bằng node_type = building.

Hàng DA8 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Cùng tệp và cùng đứng sau DB1b với DA1; Cổng Phạm vi có thể gộp hai hàng (tổng 12 tiêu chí). Kế hoạch: DA1b. Sửa 09/11 (mục 40): thêm dự án cha Ocean Park vì nhóm S03 chỉ nói tới mức đại đô thị (phiên Định vị S03).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] 0 nút node_type = building; mỗi nút đổi loại có bằng chứng chủ đầu tư; dựng lại danh bạ ra cùng số toà và cùng UPI; Ocean Park 1, 2, 3 có parent_id trỏ nút Ocean Park?
- Kết quả nào là SỐNG: [đề xuất] 0 nút node_type = building; mỗi nút đổi loại có bằng chứng chủ đầu tư; dựng lại danh bạ ra cùng số toà và cùng UPI; Ocean Park 1, 2, 3 có parent_id trỏ nút Ocean Park
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
