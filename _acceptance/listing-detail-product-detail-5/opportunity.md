---
schema_version: 1
slug: listing-detail-product-detail-5
feature: Nhà đầu tư mở /listing/[id] thấy đầu trang product-detail-5, ảnh tự thu khi có (không có thì ẩn gallery), lịch form-5 không còn điều khiển thô, vùng dữ liệu có Skeleton và Empty
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 23/10 ở phiên giám sát dot0: «Mở mới cho dãy giao diện vì phiên điều phối có cơ chế đổi tài khoản nên hạn mức là cảnh báo chứ không phải giới hạn.» — theo kế hoạch dot1-giao-dien đã duyệt (nhóm A: UI1–UI7)
decided_by: Mạnh
decided_at: 2026-10-23T15:17:32Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: UI5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng UI5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Nhà đầu tư mở /listing/[id] thấy đầu trang product-detail-5, ảnh tự thu khi có (không có thì ẩn gallery), lịch form-5 không còn điều khiển thô, vùng dữ liệu có Skeleton và Empty

Vì sao: 3 vi phạm lint. Ảnh AirDNA đã gỡ (listing-airdna-photos đã ký).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
