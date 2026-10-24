---
schema_version: 1
slug: ops-facts-so-tong-hop
feature: Sau mỗi lượt cloud-sync, máy local đẩy lên cloud số tổng hợp Ops — độ tươi/SLO từng nguồn S0x theo định nghĩa chung, trạng thái job đêm, lockdown/watchdog từng lớp, bản ghi 24h, số thẻ chờ duyệt — mỗi khối có mốc đo, qua bộ soát tầng A, và cloud có một hàm đọc chung báo số cũ quá 45′
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 24/10 ở phiên giám sát dot0: «Duyệt, mở» — mở dãy chạy chuỗi AU13 → ON7 → NT2 → ON22 (ADR-0014)
decided_by: Mạnh
decided_at: 2026-10-24T04:43:02Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON22
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON22 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Sau mỗi lượt cloud-sync, máy local đẩy lên cloud số tổng hợp Ops — độ tươi/SLO từng nguồn S0x theo định nghĩa chung, trạng thái job đêm, lockdown/watchdog từng lớp, bản ghi 24h, số thẻ chờ duyệt — mỗi khối có mốc đo, qua bộ soát tầng A, và cloud có một hàm đọc chung báo số cũ quá 45′

Vì sao: ADR-0014 (Mạnh chốt 24/10, «Chọn A»): dashboard Ops trên prod không có số vì dữ liệu để tính chỉ ở local (audit G1/G2). push-ops-facts.mjs đã là đường đẩy duy nhất (ops_heartbeat, /ops/collections đọc qua getLocalFacts) nhưng chưa phủ độ tươi, lockdown, số đếm 24h, hàng chờ, chưa có mốc đo theo khối, chưa phân biệt «chưa có số» với «số cũ». Đã loại B (sync bản registry gọt) và C (tunnel tới local).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Một lượt cloud-sync ở local: ops_heartbeat có đủ năm khối, mỗi khối có measured_at; độ tươi từng nguồn trên cloud trùng check-freshness chạy cùng lúc ở local; cấy tên nguồn thật vào payload: lệnh dừng trước khi gửi, cloud không đổi; ngừng đẩy 46′: hàm đọc trả stale kèm mốc đo cuối» chưa?
- Kết quả nào là SỐNG: [đề xuất] Một lượt cloud-sync ở local: ops_heartbeat có đủ năm khối, mỗi khối có measured_at; độ tươi từng nguồn trên cloud trùng check-freshness chạy cùng lúc ở local; cấy tên nguồn thật vào payload: lệnh dừng trước khi gửi, cloud không đổi; ngừng đẩy 46′: hàm đọc trả stale kèm mốc đo cuối
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Một lượt cloud-sync ở local: ops_heartbeat có đủ năm khối, mỗi khối có measured_at; độ tươi từng nguồn trên cloud trùng check-freshness chạy cùng lúc ở local; cấy tên nguồn thật vào payload: lệnh dừng trước khi gửi, cloud không đổi; ngừng đẩy 46′: hàm đọc trả stale kèm mốc đo cuối» khi hết timebox
- Timebox: …
