---
schema_version: 1
slug: nhom-s03-tren-cloud
feature: Người vận hành thấy bảng nhóm S03 trên cloud ghi đúng số nhóm allowlist đang bật và «Vào raw» theo nhóm từ số máy local đẩy lên (ADR-0014); thiếu facts thì «—», không 0
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ ở phiên P2 25/10: «Cổng Đáng ON4 nhom-s03-tren-cloud: build»
decided_by: Mạnh
decided_at: 2026-10-25T03:24:22Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON4
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON4 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành thấy bảng nhóm S03 trên cloud ghi đúng số nhóm allowlist đang bật và «Vào raw» theo nhóm từ số máy local đẩy lên (ADR-0014); thiếu facts thì «—», không 0

Vì sao: OPS-9: readZaloAllowlist đọc tệp cấu hình ngay trên Vercel, facts không có allowlist, accepted theo nhóm trong parseLog luôn 0 — «allowlist 0 nhóm», «Vào raw = 0» là số giả. Gốc G1.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Máy thu có N nhóm bật và M tin vào raw của một nhóm: cloud hiện N và M; facts thiếu trường: ô ghi «—»» chưa?
- Kết quả nào là SỐNG: [đề xuất] Máy thu có N nhóm bật và M tin vào raw của một nhóm: cloud hiện N và M; facts thiếu trường: ô ghi «—»
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Máy thu có N nhóm bật và M tin vào raw của một nhóm: cloud hiện N và M; facts thiếu trường: ô ghi «—»» khi hết timebox
- Timebox: …
