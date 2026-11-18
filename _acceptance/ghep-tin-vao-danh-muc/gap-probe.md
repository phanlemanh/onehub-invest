---
slug: ghep-tin-vao-danh-muc
at: 2026-11-18T07:30:00Z
verdict: findings
p0: 3
p1: 5
p2: 2
---

# Phản biện context sạch — PL20, bản hai đợt (18/11)

Thay bản phản biện của phạm vi 40%. Ba phát hiện P0 đã được kiểm lại trên mã và dữ liệu thật trước khi sửa.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | Tập đóng băng nhãn không có ô phân khu, lát không có nhóm thì màn không hiện ô này | Nguồn mức vùng không có đáp án để chấm, chỉ lộ ra sau buổi gắn nhãn | Lát mới có nhóm, chấm đọc cả ô phân khu, luật quy nhãn về nút viết trước | fixed: AC-9 và design §4 chốt lát `hai-khu-ghep-b` có nhóm, chấm cả mức vùng, luật quy nhãn viết trước |
| P0 | contract | Mẫu chấm ô tên toà lấy từ lát PL35 không đại diện cho tin máy gắn | Đạt 0,95 chủ yếu nhờ bài Ocean Park 1, không nói được độ đúng ở Grand Park | Đo lại: 13% mục thuộc Grand Park so với 63% số tin máy gắn | fixed: rút ngẫu nhiên theo tin từ chính tin máy gắn; ghi lệch so với lộ trình ở Notes |
| P0 | design | Nguồn model một mình chỉ kiểm đoạn trích có trong bài, không kiểm đoạn trích có nêu tên | Model trích câu có thật rồi tự suy ra tên, luật vẫn gắn, trái luật 7 | Ô đỏ `trich-khong-co-ten`, đột biến bỏ phép kiểm | fixed: AC-3, E3 và design §3 đòi tên nằm trong đoạn trích; đo lại độ phủ |
| P1 | contract | Một nhóm 110 bài gộp cả nguồn yếu và nguồn tốt | Nguồn model một mình hụt kéo tắt cả nguồn chữ bài cùng model, độ phủ lùi về 43,0% | Ba nhóm chấm riêng, dừng sớm ở lỗi thứ hai | fixed: AC-9 chia N1, N2, N3; N3 được bỏ qua mà hàng vẫn xét tiếp; Hỏi-2 trình Mạnh |
| P1 | evals | Kiểm khoá luật bằng ngày commit vừa đỏ oan vừa xanh giả | Sửa tốc độ làm E9 đỏ vĩnh viễn; đổi bí danh trong danh bạ thì đầu ra đổi mà E9 vẫn xanh | So đầu ra của mã cuối với bản đóng băng có băm | fixed: AC-9 và E9 so đầu ra |
| P1 | design | Ô tên toà thắng cả khi bài nêu nhiều toà hay rao nhiều căn | Bài rao nhiều căn gắn vào căn đầu tiên | Hai ô mới trong ma trận AC-1 | fixed: luật nhiều toà, nhiều căn đứng trước mọi nguồn; đợt 1 còn 46,4% |
| P1 | evals | Phép đếm độc lập thiếu luật đọc chữ nên không khớp được, dễ bị chép lại chính luật gắn | Người viết chép hàm gắn để khớp số, phép đếm mất tính độc lập | Bản viết lại từ đặc tả do tác tử khác viết, lệnh kiểm không nhập hàm gắn | fixed: AC-8, E8, dung sai tính trên tử số |
| P1 | evals | Danh sách đọc bù định nghĩa lỏng, kiểm sau khi đọc là rỗng, ghi sai nơi chạy | Tin chỉ có bản đọc đời cũ bị bỏ sót; phép so thành 0 bằng 0 | Ghim phiên bản đọc, đóng băng danh sách có băm, kiểm theo `run_id` | fixed: AC-10, E11, design §3 |
| P2 | contract | Bước gắn lỗi lặp lại mà job vẫn xanh | Toà ngừng cập nhật nhiều ngày không ai biết | Dòng cảnh báo theo nếp `JOB WARN` | fixed: AC-7, E7 in `JOB WARN [ghep-toa]` |
| P2 | contract | Ngưỡng 55% không có nguồn | Đạt 52% thì mốc đạt mà hàng đỏ | Ngưỡng lấy đúng đích MS3 | fixed: AC-8 về 50% |
