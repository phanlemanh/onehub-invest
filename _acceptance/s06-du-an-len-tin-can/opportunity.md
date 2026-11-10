---
schema_version: 1
slug: s06-du-an-len-tin-can
feature: Dự án của tin S06 (SubdivisionName, project_node) đi tới tin và căn
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

Dự án 22% ở thô còn 0 ở tin và căn. Tách từ DS1 vì cần migration và sửa sync-cloud.

Hàng DS2 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Mạnh chọn tách ở Hỏi-1 của DS1 (03/11). Hạng T3: migration thêm trường phát biểu và cột tin, sửa sync-cloud. Không cản ra mắt 05/11. Mở rộng 08/11 (kế hoạch danh bạ dự án): trường ở DA2, mã đã nối ở DA7; tên dự án đã nối trong tiêu đề nhận phát biểu parser. DDL cloud xin Mạnh duyệt.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Dự án có mặt ở tin và căn; các trường khác không giảm quá 1 điểm %; tin căn hộ S06 đang sống có dự án ≥ 30% (mốc 282 dự án)?
- Kết quả nào là SỐNG: [đề xuất] Dự án có mặt ở tin và căn; các trường khác không giảm quá 1 điểm %; tin căn hộ S06 đang sống có dự án ≥ 30% (mốc 282 dự án)
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
