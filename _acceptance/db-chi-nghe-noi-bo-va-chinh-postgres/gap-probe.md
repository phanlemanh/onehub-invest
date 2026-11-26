---
slug: db-chi-nghe-noi-bo-va-chinh-postgres
at: 2026-11-23T23:45:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract AC-3, AC-6 + evals E3, E6 | Câu «bên nối localhost giữ nguyên» không có số đo; chỉ nối 127.0.0.1 và IP LAN, không nối bằng tên localhost hay ::1 | localhost phân giải ::1 trước, client không thử IPv4 thì job đêm gãy sau áp dù E1–E8 xanh | Nối localhost bằng psql và client pg của pipeline với Node của launchd trên container tạm; ghi ::1 | fixed: AC-3 và E3 thêm ba ca localhost (psql, pg của pipeline) và dòng ghi ::1 ở cả hai bản; E8 bản cây thêm client pg nối localhost |
| P1 | contract AC-4 + evals E4 | Container tạm chỉ đi đường initdb volume rỗng; chưa mô phỏng tạo lại trên volume có dữ liệu, chưa chạy thử cách lùi | Trên volume đã khởi tạo, entrypoint đi nhánh khác, áp xong SHOW vẫn 256MB; cách lùi chưa ai chạy | main→cây trên cùng volume, docker restart, cây→main, dòng mốc còn nguyên | fixed: AC-4 và E4 thêm đường áp bốn bước trên cùng volume, có dòng mốc |
| P1 | contract AC-5 + evals E5 | Dữ liệu đo không có cỡ và nguồn cố định; không bắt truy vấn song song thật; shm_size không có đối chứng | DB thử nhỏ, không Parallel Hash, bảng đo trống nghĩa mà Hỏi-2 duyệt trên nó | Ghim hai bảng nguồn ≥ 90% số dòng, Workers Launched > 0, đối chứng shm 64MB | fixed: AC-5 và E5 ghim field_assertions + sale_offer_records ≥ 90%, EXPLAIN ANALYZE Workers Launched, đối chứng shm đỏ hoặc in «đối chứng shm chết» |
| P2 | evals E8 | Nhánh xanh của live chưa chạy trước áp; thông điệp FAIL có thể mã cứng | Bộ đọc lsof hay so đơn vị sai, sau áp lệnh kiểm đỏ oan | Tham số hoá live, chạy trên container tạm từ compose cây (xanh) và main (đỏ) | fixed: AC-8 và E8 chạy bộ đọc live ba lần — one-invest-db, container cây, container main |
| P2 | contract AC-6 + evals E6 | Vế «§3 liệt đủ bên nối» không eval nào chấm; grep thiếu 172.16–31.x và --network host | Script nối qua IP bridge hay network host lọt, AC-6 tính đạt | Mở rộng grep, cấy đối chứng từng dạng, eval judgment đối chiếu §3 | fixed: E6 thêm 172.16–31.x, --network host, plist launchd, ba đối chứng cấy; thêm E6b judgment đối chiếu danh sách soát với §3 |
