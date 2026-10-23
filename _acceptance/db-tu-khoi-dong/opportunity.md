---
schema_version: 1
slug: db-tu-khoi-dong
feature: DB local tự khởi động lại sau khi Docker hoặc máy khởi động lại
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU7
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU7 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

DB local tự khởi động lại sau khi Docker hoặc máy khởi động lại

Vì sao: Audit L7: compose không khai restart; restart policy đang đặt tay.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Khởi động lại Docker: container DB lên lại không cần tay» chưa?
- Kết quả nào là SỐNG: [đề xuất] Khởi động lại Docker: container DB lên lại không cần tay
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Khởi động lại Docker: container DB lên lại không cần tay» khi hết timebox
- Timebox: …
