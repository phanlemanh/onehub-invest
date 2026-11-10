---
schema_version: 1
slug: do-du-ho-so-du-an
feature: Người vận hành mở trang Danh bạ và thấy độ đủ hồ sơ của từng dự án theo bảy nhóm thông tin — trống, một nguồn, nhiều nguồn khớp, mâu thuẫn — cùng thẻ mâu thuẫn và tỉ lệ dự án đủ năm nhóm đầu mỗi ngày
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

Mạnh 09/11 Q5: độ đủ hồ sơ là thước «toàn diện» của danh bạ, khác DA14 (mức gắn của tin). Bảy nhóm: danh tính, vị trí, phân loại và quy mô, pháp lý, tiến độ, sản phẩm sơ cấp và giá, mô tả và media.

Hàng DA20 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dãy C. DA13 đọc tiêu chí hiển thị (mục 39) từ bảng này.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Bảng có đủ dự án × bảy nhóm, tính mỗi đêm; cấy một mâu thuẫn chủ đầu tư thì có thẻ; số «đủ N1–N5» có lát vùng × quy mô; mốc M2 (≥ 80% dự án S08 và 100% dự án S03 nói tới đủ N1–N5) chỉ báo, không chặn?
- Kết quả nào là SỐNG: [đề xuất] Bảng có đủ dự án × bảy nhóm, tính mỗi đêm; cấy một mâu thuẫn chủ đầu tư thì có thẻ; số «đủ N1–N5» có lát vùng × quy mô; mốc M2 (≥ 80% dự án S08 và 100% dự án S03 nói tới đủ N1–N5) chỉ báo, không chặn
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
