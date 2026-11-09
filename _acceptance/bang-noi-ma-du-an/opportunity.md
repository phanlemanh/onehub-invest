---
schema_version: 1
slug: bang-noi-ma-du-an
feature: Người vận hành mở thẻ nối dự án trên Ops, thấy cặp mã nguồn ↔ dự án máy đề xuất kèm căn cứ, duyệt từng cặp hoặc cả loạt cùng căn cứ, và mỗi cặp đã duyệt thành một bí danh
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

Ba cơ chế bí danh dự án cùng tồn tại và registry_aliases chưa nhận nút vùng; S06, S08, S09, S07 cần một chỗ nối có người duyệt. Mạnh 08/11: máy đề xuất, đội ops duyệt, cặp cùng căn cứ duyệt bằng thẻ luật.

Hàng DA3 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Hạng T3: quyền duyệt và dữ liệu nối. Khái quát migration 074, bảng cũ thành view. Khuôn giao diện ReUI theo mục 35. Kế hoạch: DA3. Sửa 09/11 (mục 40): mở kind ma_nha_nuoc ngay ở migration này để DA24 không cần migration riêng.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] 8 cặp S08 đã nối hiện trong bảng mới và view thay s08_project_links trả đúng 8 dòng; duyệt một cặp sinh đúng một bí danh node:<id>; hoàn tác 5 giây khôi phục; thẻ luật duyệt loạt có nhật ký và đảo được; registry_aliases.kind nhận thêm ma_nha_nuoc?
- Kết quả nào là SỐNG: [đề xuất] 8 cặp S08 đã nối hiện trong bảng mới và view thay s08_project_links trả đúng 8 dòng; duyệt một cặp sinh đúng một bí danh node:<id>; hoàn tác 5 giây khôi phục; thẻ luật duyệt loạt có nhật ký và đảo được; registry_aliases.kind nhận thêm ma_nha_nuoc
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
