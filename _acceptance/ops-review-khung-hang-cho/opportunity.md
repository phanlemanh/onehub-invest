---
schema_version: 1
slug: ops-review-khung-hang-cho
feature: Người duyệt mở /ops/review và thấy hàng chờ dạng bảng theo solution-agents-5, lọc theo loại thẻ, bấm một hàng mở sheet chi tiết có dải ảnh tin xem được cả ở màn 390px
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 23/10 ở phiên giám sát dot0: «Mở mới cho dãy giao diện vì phiên điều phối có cơ chế đổi tài khoản nên hạn mức là cảnh báo chứ không phải giới hạn.» — theo kế hoạch dot1-giao-dien đã duyệt (nhóm A: UI1–UI7)
decided_by: Mạnh
decided_at: 2026-10-23T15:17:32Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: UI1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng UI1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Người duyệt mở /ops/review và thấy hàng chờ dạng bảng theo solution-agents-5, lọc theo loại thẻ, bấm một hàng mở sheet chi tiết có dải ảnh tin xem được cả ở màn 390px

Vì sao: Tệp nhiều vi phạm lint nhất (review-card.tsx: 20). Chạy TRƯỚC PL3 vì cùng tệp: UI1 dựng khung, PL3 đổ căn cứ vào sheet. Sửa routes.md: lọc theo loại thẻ/bậc thay «theo độ tin» (trái PL3).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
