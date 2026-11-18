---
slug: lat-khai-o-can-gan
at: 2026-11-18T10:29:25Z
verdict: findings
p0: 0
p1: 5
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | AC-9 hứa nhiều trạng thái nhưng E10 chỉ đi qua lỗi ô, không có eval gửi trùng | Mất mạng rồi thử lại sinh dòng trùng, màn hết bài trắng | Thêm bước màn và eval gửi cùng lượt hai lần | fixed: thêm ba bước vào E10, thêm E14, gắn cross-layer cho AC-9 |
| P1 | evals | Ca lát không khai gửi hằng tạm thiếu ma trận, đối chứng, đột biến; lời hứa không sửa test đã ký không có lệnh đo | Bước chặn hằng mất mà E4 vẫn xanh; test đã ký bị sửa cho xanh | Ma trận bốn lát, đột biến gỡ bước chặn, lệnh so tệp test | fixed: viết lại E4, thêm E15, ghi rõ số ô từng lát |
| P1 | evals | E5 chưa đo đích chuyển của đường dẫn xem và chưa quét giá trị máy trên toàn trang | Lát gắn mù lộ đáp án ở vùng khác của trang | Ma trận ba ca, cấy chuỗi đánh dấu | fixed: viết lại AC-5, E5 |
| P1 | contract | Phép đo thời gian chưa quy định cách rút bài và cách bấm giờ | Năm bài ngắn cho số đẹp, thực tế gấp nhiều lần | Rút ngẫu nhiên có hạt giống từ bài thật, ghi đủ trường | fixed: viết lại AC-10, E11, Đường đo |
| P1 | design | Gắn mù và hằng tạm bị ghi là máy quyết trong khi còn lối khác có giá | Khoảng 330 bài gắn theo cách trái lựa chọn trước của Mạnh | Chuyển thành câu hỏi ở Cổng Phạm vi | fixed: hai câu hỏi cho Mạnh trên thẻ, thay dòng sổ cũ |
