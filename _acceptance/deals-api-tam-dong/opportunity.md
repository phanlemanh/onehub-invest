---
schema_version: 1
slug: deals-api-tam-dong
feature: /api/v1/deals chỉ trả dữ liệu cho token ops cho tới khi tin mock được rút khỏi canonical
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

/api/v1/deals chỉ trả dữ liệu cho token ops cho tới khi tin mock được rút khỏi canonical

Vì sao: Audit P7: 29/30 deal công khai là tin mock.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Gọi không token: 401; gọi bằng token ops: 200» chưa?
- Kết quả nào là SỐNG: [đề xuất] Gọi không token: 401; gọi bằng token ops: 200
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Gọi không token: 401; gọi bằng token ops: 200» khi hết timebox
- Timebox: …
