---
schema_version: 1
slug: leak-gate-kiem-anon
feature: Leak gate của sync cloud đỏ khi role anon còn SELECT được bất kỳ bảng hay view nào
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Leak gate của sync cloud đỏ khi role anon còn SELECT được bất kỳ bảng hay view nào

Vì sao: Audit P12: RLS 0/37 bảng, anon đọc được sessions (token thô). Chặn tái phát sau khi áp 037.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Cấp lại quyền SELECT cho anon trên một bảng: lượt sync kế dừng và báo đỏ» chưa?
- Kết quả nào là SỐNG: [đề xuất] Cấp lại quyền SELECT cho anon trên một bảng: lượt sync kế dừng và báo đỏ
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Cấp lại quyền SELECT cho anon trên một bảng: lượt sync kế dừng và báo đỏ» khi hết timebox
- Timebox: …
