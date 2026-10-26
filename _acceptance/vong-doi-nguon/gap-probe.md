---
slug: vong-doi-nguon
at: 2026-10-26T06:35:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Backfill dồn mọi nguồn và nhóm không chạy vào paused; ai đã gỡ hẳn hay chưa bật lần nào là điều chỉ Mạnh biết, sổ không ghi | Nhóm hay nguồn đã gỡ nằm ở paused nên công tắc bật lại được nó | Dòng sổ chỉ-người Hỏi-3 | human-gate1: thêm Hỏi-3 (khuyên giữ nguyên trạng thái hôm nay); design ghi đo 26/10: 0 nhóm enabled=false; AC-3 nêu Hỏi-3 |
| P1 | design | Trigger không nói hành vi khi chỉ đổi enabled trên dòng retired, draft, completed; E12 không có ma trận toàn phần | Nhánh chưa gộp hay SQL tay đặt enabled=true trên nhóm retired làm nó active, vòng qua 409 | Ma trận 5 × 2 viết trước, ghim thông điệp | fixed: design có bảng luật 5 × 2 (retired/completed + true bị từ chối), E12 thành ma trận 10 lệnh có đếm trước, AC-10 sửa theo |
| P1 | evals | Chỉ E11 soi public; E6 không nói route trỏ lược đồ nào, ops_audit ở đâu | 047 có tiền tố public. hay đặt search_path thì áp một phần lên public trước gộp mà eval vẫn xanh; E6 ghi vào public.ops_audit thật | Chụp public trước/sau mọi ca; grep public. và search_path trong 047 | fixed: đầu evals.yaml khai luật chụp public cho mọi ca itest và VD-AC-6; E10 grep 'public.'/'search_path'; E6 nêu search_path chỉ lược đồ tạm có ops_audit chép LIKE |
| P1 | evals | AC-7 hứa bốn suite nhưng chỉ có E8, E9; bên đọc của trang và route delete/set-mode không được đo trên lược đồ đã migration | Trang /ops/sources hay route delete/set-mode gãy khi áp sau gộp mà mọi eval xanh | Eval cho app_ui, pipeline; ca chạy câu đọc của trang và route trên lược đồ đã migration | fixed: thêm E13 (câu đọc docNhomThu + GET route rút nguyên văn), E14 app_ui, E15 pipeline; E6 thêm delete và set-mode |
| P2 | evals | Đột biến VD-AC-4b đòi đúng một ô lệch, trong khi đột biến tự nhiên lệch 7 ô | E4 đỏ dù hàm đúng, hoặc người cài viết đột biến lách | Ghim phép đột biến và danh sách ô lệch | fixed: ghim đột biến (completed qua cổng nguồn như active), tập ô lệch deepEqual đúng 7 ô nguồn completed |
