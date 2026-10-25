---
schema_version: 1
slug: soat-tang-a-moi-duong-len-cloud
feature: Mọi đường dữ liệu rời máy (sync và ops-facts) qua cùng một bộ soát tầng A chặn khi lỗi
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 24/10 ở phiên giám sát dot0: «Duyệt, mở» — mở dãy chạy chuỗi AU13 → ON7 → NT2 → ON22 (ADR-0014)
decided_by: Mạnh
decided_at: 2026-10-24T04:43:02Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: NT2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng NT2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mọi đường dữ liệu rời máy (sync và ops-facts) qua cùng một bộ soát tầng A chặn khi lỗi

Vì sao: push-ops-facts đẩy nhãn job và log thô chứa tên nguồn thật lên ops_heartbeat, leak gate không kiểm đường này; leak gate cũng chưa soát cột PII.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Cấy tên nguồn thật vào payload ops-facts hoặc một cột: lệnh đẩy dừng trước khi gửi; leak gate đỏ khi cloud có cột PII ngoài danh sách cho phép» chưa?
- Kết quả nào là SỐNG: [đề xuất] Cấy tên nguồn thật vào payload ops-facts hoặc một cột: lệnh đẩy dừng trước khi gửi; leak gate đỏ khi cloud có cột PII ngoài danh sách cho phép
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Cấy tên nguồn thật vào payload ops-facts hoặc một cột: lệnh đẩy dừng trước khi gửi; leak gate đỏ khi cloud có cột PII ngoài danh sách cho phép» khi hết timebox
- Timebox: …
