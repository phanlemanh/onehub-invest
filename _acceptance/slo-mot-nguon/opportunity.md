---
schema_version: 1
slug: slo-mot-nguon
feature: Người vận hành thấy cùng một số SLO trên /ops và /ops/collections
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU6
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU6 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Người vận hành thấy cùng một số SLO trên /ops và /ops/collections

Vì sao: Audit L14: hai trang mâu thuẫn (4/14 đạt vs 5/6 nguồn).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
