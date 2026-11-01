---
slug: nguoi-noi-theo-sdt
at: 2026-10-31T12:58:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Bỏ thẻ duyệt cho ca nhiều–nhiều (OOS-2, dòng descope d-5) là lựa chọn phạm vi chỉ người quyết; ghi chú hàng HD13 đặt thẻ duyệt vào hàng, căn cứ một-lối chỉ làm chết lối thẻ entity_match. | Mạnh ký tưởng phần nhiều–nhiều đã có người giữ; lộ trình suy HD13 xong, ≈9 SĐT dùng chung và 5 người nhiều số tách mãi. | Dòng Hỏi-n kiểu chỉ-người, kho_dao true, supersedes d-5. | human-gate1: d-20261031T123412Z-8 (Hỏi-1, chi-nguoi, kho_dao true, supersedes d-5); yêu cầu can-nguoi P3-137 gửi giám sát. |
| P1 | evals | E8 lấy N1 của do-danh-ba-sdt làm thước độc lập mà không nói N1 nhận cặp đã gộp thế nào; N1 về 0 không bắt gộp nhầm đích. | Gộp sai người tài khoản mà N1 vẫn 0, E8 xanh. | Ghim tinhSo bản base; kiểm đích gộp bằng người gửi thước tự rút; đối chứng gộp sai. | fixed: AC-8 + E8 nêu tinhSo bản base (tệp không đổi, in hash), nhận merged qua parties.status; thêm kiểm related_keys[0] = người tài khoản của người gửi thước tự rút và đối chứng đổi merged_into trong SAVEPOINT; bỏ do-danh-ba-sdt khỏi paths. |
| P1 | evals | AC-9 hứa mã thoát cho khoá không có và người active, E9 chỉ chạy tiến trình con cho ca thiếu --ly-do. | CLI nuốt lỗi và thoát 0, E9 vẫn xanh. | Tiến trình con cho cả hai ca, assert thoát 1 + stderr + đếm bảng. | fixed: E9 chạy tiến trình con cho ba ca (thiếu --ly-do → 2; khoá không có → 1; người active → 1) trên DB thử, đếm bốn bảng bằng kết nối riêng. |
| P2 | evals | «Không dòng nào bị xoá» đo bằng số dòng không giảm; E10 không quét dung-nguoi.mjs. | DELETE rồi INSERT lại giữ số dòng, E6 xanh; câu DELETE ở dung-nguoi.mjs lọt E10. | Tập khoá chính là tập cha; E10 quét cả CLI. | fixed: E6 so tập id từng bảng (tập cha) và cột được phép đổi; E10 quét thêm dung-nguoi.mjs. |
| P2 | evals | E10 khẳng định âm tính không có đối chứng dương, không ghim số câu quét. | Bộ quét không khớp dạng chuỗi nên trả rỗng mọi thứ. | Đối chứng dương + đếm câu độc lập. | fixed: E10 thêm câu cài sẵn JOIN users và DELETE FROM parties phải bị bắt; số câu quét = số khoá đếm độc lập. |
