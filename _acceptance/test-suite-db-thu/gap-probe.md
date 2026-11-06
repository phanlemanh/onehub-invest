---
slug: test-suite-db-thu
at: 2026-11-05T12:10:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

# Gap probe: test-suite-db-thu

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract.md, decisions.jsonl | Căn cứ d-2, d-3, d-8 và ca gốc: executor `sellers_chip` vẫn chạy trên DB chung, tên feature hứa nhiều hơn phép đo | Lượt chấm gọi `sellers_chip` thẳng, `SD-AC-6` vẫn deadlock với job dù hồ sơ báo xong | Ca DT-AC-5 đọc chuỗi executor; E9 | fixed: `sellers_chip` qua `--chay`, sửa tên feature, Context nói rõ không chứng hết deadlock, Đường đo đặt ngưỡng ≥ 20 ca/ngày, sổ có dòng thay |
| P1 | evals E3, E4 | Đối chứng không đỏ được: đếm chung một số, không có deadlock đối chứng | E4 xanh ngay cả khi lượt vẫn nối DB chung | E3 tự gây deadlock trên bản chép; E4 đếm kết nối theo từng DB, vào bằng URL `oneinvest` | fixed |
| P1 | evals E5, E6, E7, E8 | Thiếu số ca, thiếu sàn tệp quét; giới hạn của bộ lấy mẫu chưa khai | Glob sai, bộ quét đọc 0 tệp vẫn xanh | JSON có `ca`; ≥ 20 tệp mỗi bộ; Notes khai giới hạn 100 ms và env bị bỏ | fixed |
| P1 | AC-3 | Không có ca đồng thời trên bản mẫu | Ba lượt cùng thấy mẫu cũ, dựng ba lần, DROP chéo | `probes/that.sh`: ba lượt, đúng một lần dựng | fixed |
| P1 | AC-1, AC-2 | Ba ô thiếu: URL kèm `?options=`, tên chỉ bắt đầu bằng `oneinvest`, chế độ cũ; không có đột biến, lệnh đỏ và SIGTERM chưa đo thật | Nhánh đổi URL bị bỏ mà test vẫn xanh | Các ca DT-AC-1, DT-AC-2 và đột biến trong ca; `probes/that.sh` đo lệnh đỏ, SIGTERM | fixed |
