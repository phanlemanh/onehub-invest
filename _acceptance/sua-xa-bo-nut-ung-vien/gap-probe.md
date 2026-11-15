---
slug: sua-xa-bo-nut-ung-vien
at: 2026-11-14T10:20:00Z
verdict: findings
p0: 0
p1: 1
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Chiều dương AC-1 chỉ kiểm trạng thái cuối, không làm lệch trước khi chạy | Câu lọc viết bằng toán tử khác loại bỏ cả nút xác minh; DB đúng sẵn nên E1 vẫn xanh trong khi lệnh ngừng sửa xã | Ghi lệch area_ids một nút xác minh trước khi chạy, kiểm lệnh sửa lại; E4 kiểm nút NULL và xac_minh có mặt | fixed: AC-1 và E1 thêm bước ghi lệch vinhomes-grand-park; AC-3 và E4 thêm đối chứng nút NULL, xac_minh có mặt, đếm dòng |
| P2 | evals | E3 hứa chạy cả hai lược đồ nhưng dv1_db chỉ chạy trên lược đồ hiện có | Người duyệt tin hồi quy DV1 đã kiểm trên DB đã áp 100 | Thu hẹp lời hứa hoặc chạy thêm | fixed: AC-3, E3 nói chạy trên lược đồ hiện có của máy thu và ghi trạng thái lược đồ; phần đã áp 100 do E1 chứng |
| P2 | contract | AC-2, AC-3 có hiệu ứng DB nhưng thiếu tag cross-layer | Chấp nhận AC-2 chỉ dựa trên thông điệp lỗi | Gắn tag, layer backend-effect | fixed: AC-2, AC-3 gắn (cross-layer); E2, E3, E4 thêm layer backend-effect |
