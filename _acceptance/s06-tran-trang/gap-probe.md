---
slug: s06-tran-trang
at: 2026-11-14T09:05:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ d-5 dựa trên «merge ≠ đang chạy», sai với tệp .mjs launchd gọi thẳng từ checkout chính; lượt đêm không ghim trần | Gộp xong, đêm đó trần 210 chạy thật trước khi có số đo, có thể lấn cửa S03 | Ghi rõ lượt đêm lấy trần từ đâu; dòng sổ thay d-5 kho_dao true hoặc Hỏi Mạnh | human-gate1: đã kiểm (chotot-daily.sh gọi collect-chotot.mjs không cờ, plist không đặt CHOTOT_MAX_PAGES); dòng sổ mới thay d-5 thành Hỏi-1 kho_dao true có khuyến nghị; Context hợp đồng thêm đoạn «Gộp là bật thật»; đã báo giám sát |
| P1 | contract | AC-4 không đo bước thu và không có giờ bắt đầu chuỗi | Kết luận «không lấn» không kiểm được từ tệp số đo | Thêm thời gian bước thu và giờ bắt đầu, giờ kết thúc dự kiến cạnh 16:55Z | fixed: AC-4 và câu hỏi, expected E4 đòi thời gian bước thu từ manifest, giờ bắt đầu theo lịch và giờ kết thúc dự kiến |
| P2 | evals | 403 và 5xx không có phép đo mà Coverage vẫn khẳng định hành vi | 403 vẫn thử lại hoặc 5xx dừng cả lượt mà E2 xanh | Thêm ca hoặc sửa Coverage ghi không đo | fixed: Coverage ghi rõ 403 và 5xx không đo ở hồ sơ này |
| P2 | evals | Expected E2 không ghim mã thoát, thông điệp, số tin từng snapshot | Snapshot rỗng hay sai thông điệp vẫn PASS | Liệt kê cả hai ca và các assert | fixed: expected E2 gọi tên hai ca và các assert (10 lời, mã 3, «DỪNG CẢ LƯỢT», 200 và 50 tin) — đã đọc tệp test, các assert này có trong ca |
