---
schema_version: 1
slug: so-be-mat-api
feature: Mọi route API của app nằm trong một sổ bề mặt và chỉ trả đúng thứ sổ cho phép
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: NT4
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng NT4 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Mọi route API của app nằm trong một sổ bề mặt và chỉ trả đúng thứ sổ cho phép

Vì sao: /api/v1/offers công khai, cùng lỗ mock như /deals mà AU2 không phủ; beacon user-events 401 với khách; /api/zalo-media cho admin xem ảnh QR đăng nhập Zalo.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Thêm một route đọc sale_offers công khai chưa khai: test đỏ; gọi /api/v1/offers không token theo đúng chế độ AU2; khách không gây 401 ở beacon; ảnh QR không tải được qua /api/zalo-media» chưa?
- Kết quả nào là SỐNG: [đề xuất] Thêm một route đọc sale_offers công khai chưa khai: test đỏ; gọi /api/v1/offers không token theo đúng chế độ AU2; khách không gây 401 ở beacon; ảnh QR không tải được qua /api/zalo-media
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Thêm một route đọc sale_offers công khai chưa khai: test đỏ; gọi /api/v1/offers không token theo đúng chế độ AU2; khách không gây 401 ở beacon; ảnh QR không tải được qua /api/zalo-media» khi hết timebox
- Timebox: …
