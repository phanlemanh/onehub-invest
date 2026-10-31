---
slug: phat-bieu-db-do-tren-main
at: 2026-10-31T02:10:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ ghi máy tự quyết phạm vi quét tự dọn (sáu tiền tố, pid chết) trong khi phạm vi xoá 6 hay 20 lược đồ đang chờ Mạnh chốt; không gì ngăn bước quét chạy trên DB chung :5433 | Lượt test app đầu tiên trên :5433 âm thầm xoá cả 20 lược đồ không qua sao lưu — máy làm thay việc vận hành chờ người chốt | Câu hỏi chỉ-người cho phạm vi quét; AC-7 thêm tiền đề việc vận hành đã xong | human-gate1: Hỏi-2 (dòng sổ mới thay dòng 7), AC-7 thêm tiền đề «theo Hỏi-2, sau khi việc vận hành xong» |
| P1 | contract | AC-5 viết sẵn theo lối khuyến nghị của Hỏi-1 mà không ghi «theo Hỏi-1» | Mạnh chọn tách lệnh riêng thì AC-5/E5 đo sai sản phẩm; ký Cổng 1 vô tình duyệt luôn Hỏi-1 | AC-5 ghi theo Hỏi-1 | fixed: AC-5 ghi «sửa dữ liệu trong migration theo Hỏi-1»; chọn lối khác ở Cổng 1 thì sửa AC-5/E5 trước S2 |
| P1 | contract | Thiết kế nói 6 tin sống đổi trên cloud nhưng không AC nào đo phía cloud | Sync lấy theo mốc thời gian thì cloud giữ 6 tin lệch dù E5/E6 xanh | Eval chạy truy vấn đọc của sync-cloud trên bản chép | rejected: pipeline/sync-cloud.mjs chép trọn bảng sale_offers mỗi lượt (không mốc, không updated_at) — tin sống đổi cột đi lên cloud lượt kế theo đúng đường hiện có |
| P2 | evals | E6 không ghim tiền đề còn lược đồ sót và không có chiều đỏ của PD-AC-1 | Bản chép không còn lược đồ sót thì PD-AC-1 xanh kể cả khi bỏ câu lọc | E6 in số lược đồ dc_ và đối chứng câu đếm cũ | fixed: E6 in số lược đồ dc_ (bằng 0 thì gieo một lược đồ thử) và chạy cả câu đếm cũ (> 1 dòng) lẫn mới (đúng 1) |
| P2 | design | Rủi ro hiệu năng ghi «đo ở AC-6» mà AC-6 không đo thời gian | Người duyệt tin rủi ro đã đo; lượt làm giàu đêm chậm hẳn mà không ai báo | Bỏ câu hoặc E5 in thời gian | fixed: E5 in thời gian một lượt apply_enrichment trước và sau 063 (thông tin, không ngưỡng); thiết kế sửa câu |
