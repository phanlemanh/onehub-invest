---
schema_version: 1
slug: cloud-sync-bao-loi-that
feature: Job cloud-sync thoát khác 0 khi bất kỳ bước nào hỏng, và push-ops-facts kết nối theo DATABASE_URL
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 24/10 ở phiên giám sát dot0: «Duyệt, mở» — mở dãy chạy chuỗi AU13 → ON7 → NT2 → ON22 (ADR-0014)
decided_by: Mạnh
decided_at: 2026-10-24T04:43:02Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU13
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU13 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Job cloud-sync thoát khác 0 khi bất kỳ bước nào hỏng, và push-ops-facts kết nối theo DATABASE_URL

Vì sao: AU3 Hỏi-1 A (Mạnh 23/10): cloud-sync.sh không set -e — sync-cloud hỏng mà push-ops-facts lành thì launchd thấy 0; push-ops-facts.mjs dòng 13 LOCAL_URL viết cứng localhost:5433 nên không đo được bằng cổng chết.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Làm sync-cloud hỏng (leak gate đỏ) khi push-ops-facts lành: cloud-sync.sh thoát khác 0; trỏ DATABASE_URL vào cổng chết: push-ops-facts thoát khác 0» chưa?
- Kết quả nào là SỐNG: [đề xuất] Làm sync-cloud hỏng (leak gate đỏ) khi push-ops-facts lành: cloud-sync.sh thoát khác 0; trỏ DATABASE_URL vào cổng chết: push-ops-facts thoát khác 0
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Làm sync-cloud hỏng (leak gate đỏ) khi push-ops-facts lành: cloud-sync.sh thoát khác 0; trỏ DATABASE_URL vào cổng chết: push-ops-facts thoát khác 0» khi hết timebox
- Timebox: …
