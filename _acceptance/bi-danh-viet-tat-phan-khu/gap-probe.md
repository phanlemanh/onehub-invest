---
slug: bi-danh-viet-tat-phan-khu
at: 2026-11-20T01:36:00Z
verdict: findings
p0: 4
p1: 1
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ thẻ luật trích câu của DA46 nói chuyện nối nút, không quyết cách ghi bí danh hay việc không migration | Người duyệt tưởng khuôn thẻ luật đã có lời chốt trong khi máy quyết trên một câu chỉ liên quan | Đổi căn cứ sang câu quyết hoặc một-lối có lối chết | fixed: dòng d-20261120T013453Z-8 thay d-3, nguồn một-lối (migration không có đường lùi, sửa tay trái luật) |
| P0 | design | Chọn rb→48 không có lời quyết vì DA46 không nối 48 với 389 | Hai nút cùng tên sống song song, tin «rainbow» và «rb» về hai khoá khác nhau | Thêm câu hỏi hoặc ca «rb» và «rainbow» cùng khoá | fixed: dòng d-9 thay d-4 — GT5 khoá theo tên đã gập nên 48 và 389 cùng một khoá; AC-6, E6 thêm ca «rb» và «rainbow» ra cùng khoá khi còn cả hai nút |
| P0 | contract | Chưa có dòng sổ cho việc tên tắt lên cloud qua đồng bộ đêm và hiện trên Danh bạ Ops | Bốn tên lên cloud mà chữ ký chỉ phủ DB máy thu | Dòng sổ + bước kiểm cloud trong hồ sơ áp | fixed: dòng d-11 (căn cứ AGENTS.md: thông tin dự án là công khai), design §4 bước 5 và hợp đồng mục Đường đo thêm đếm tên tắt trên cloud sau đêm đầu |
| P0 | contract | Ngưỡng tổng 800 để lọt việc mất trọn một tên | Lỗi làm rb khớp 0 tin mà tổng vẫn vượt 800 | Sàn từng tên, lệnh đo in theo tên | fixed: dòng d-10 thay d-5; AC-9 và E9 thêm sàn ori 333 · rb 108 · bs 282 · gh 190, chiều đỏ bỏ một tên thì thông điệp nêu đúng tên |
| P1 | evals | Thước chỉ đếm số lần khớp, không đo khớp đúng; lời «không bên đọc khác khớp chữ tự do» không có eval | Token hai chữ mang nghĩa khác, số vẫn tăng | Mẫu người gắn nhãn, ca liệt bên đọc aliases | deferred: độ đúng khớp đo ở thước GT5 (mẫu giữ riêng AC-9 của khoa-gom-hai-tang, đã gắn nhãn); design §4 ghi rõ ranh giới; bên đọc aliases khác đã soát ở S1 (thẻ địa chỉ nhóm khớp nhãn model với tên, danh bạ vật thể chỉ đọc bí danh toà) |
