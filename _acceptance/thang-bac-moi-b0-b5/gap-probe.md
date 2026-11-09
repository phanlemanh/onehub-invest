---
slug: thang-bac-moi-b0-b5
at: 2026-11-09T07:30:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

# Gap probe: thang-bac-moi-b0-b5

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ B4 (d-6) ghi máy quyết mà câu FRAMING nêu cả số đo đạt ngưỡng lẫn người có quyền xác nhận; dòng giữ 600 (d-8) trích câu không quyết việc giữ | Cổng Phạm vi duyệt định nghĩa B4 mà Mạnh không được hỏi; khi GC mở bảng nối căn lên B4 theo ý máy | Dòng Hỏi chỉ-người supersedes d-6; d-8 đổi nguồn | human-gate1: Hỏi-2 d-20261109T071552Z-11 supersedes d-20261109T071147Z-6; d-20261109T071147Z-8 thay bằng d-20261109T071552Z-12 nguồn một-lối (600 thuộc vùng DF7) |
| P1 | evals | AC-7, AC-8 đi qua backend mà E7, E8 chỉ chạy jsdom trên bản ghi viết tay | Truy vấn app vẫn truyền cờ cụm, hoặc bên ghi đặt detail.thang mà bên đọc đọc chỗ khác — E7, E8 vẫn xanh | Eval cross-layer trên DB thử có 087 | fixed: AC-7, AC-8 gắn (cross-layer); thêm E7b (DO1 --write thật → hàm đọc app thật → render) và E8b (hàm đọc bản ghi thật của data-flow-queries.ts) |
| P1 | contract | Không AC cho khoảng app đã gộp mà cloud chưa áp 087 | Trang /ops trên cloud gọi hàm hay cột mới của 087 và lỗi tới khi Mạnh áp | AC trên lược đồ chưa có 087 | fixed: thêm AC-11 + E12 chạy truy vấn app thật trên bản chép DB chung trước khi nạp 087; design §3.4b |
| P1 | contract | 610 và DO1 hứa cùng tập đơn vị mà không thước nào so; tin đã nghỉ không có fixture | Phân bố bậc và số đơn vị DO1 lệch nhau mỗi ngày | Một fixture, hai bộ đếm, so tập khoá | fixed: 087 có một hàm data_level_units() hai bên cùng đọc; AC-4 + E4 thêm ca so tập khoá với tin đã rút mỗi nguồn; design §3.4 ghi luật tin đã rút |
| P2 | evals | E5 chỉ đòi tu_ngay khác rỗng; E6 không đo NS1, NS1b | DO1 ghi ngày chạy làm ngày áp; NS1 cộng dòng thang cũ — E5, E6 vẫn xanh | So quan hệ, không so có mặt | fixed: E5 đòi tu_ngay bằng ngày nhỏ nhất có ảnh chụp thang mới (fixture D−2); E6 thêm ca NS1, NS1b so trọn số viết trước; AC-5 ghi rõ ngày áp |
