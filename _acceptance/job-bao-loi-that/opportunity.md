---
schema_version: 1
slug: job-bao-loi-that
feature: Mọi job đêm thoát khác 0 khi không tới được DB, và watchdog cảnh báo khi DB sập
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Mọi job đêm thoát khác 0 khi không tới được DB, và watchdog cảnh báo khi DB sập

Vì sao: Audit L7, L10: DB sập 8 giờ mà mọi job exit 0. Bước thu/nạp trong *-daily.sh là làn ZCode — báo ZCode phần đó.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Tắt DB rồi chạy từng job: tất cả thoát khác 0, có một cảnh báo» chưa?
- Kết quả nào là SỐNG: [đề xuất] Tắt DB rồi chạy từng job: tất cả thoát khác 0, có một cảnh báo
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Tắt DB rồi chạy từng job: tất cả thoát khác 0, có một cảnh báo» khi hết timebox
- Timebox: …
