---
slug: nap-s09-can-cao-tang-vao-danh-ba
at: 2026-11-18T12:20:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Bậc của căn dựa trên tiền lệ của toà; khoá khử trùng khai một lối trong khi còn lối so mã chuẩn hoá | Khoảng 309 nghìn căn nhận bậc không có căn cứ, hoặc khoá khớp sai | Đổi dòng sổ, câu bậc căn thành câu hỏi cho người | fixed: bậc căn thành Hỏi-3; khoá khử trùng ghi rõ hai bước |
| P0 | contract | AC-10 chỉ đo bảo toàn, không có sàn, trần và độ đúng của phép khớp | Gần hết căn rơi vào mã hỏng mà sáu phần vẫn cộng đủ, cổng vẫn xanh | Ngưỡng khai trước, mẫu cặp đã khớp đối chiếu độc lập | fixed: AC-10 và E10 thêm bốn ngưỡng và 200 cặp đối chiếu cột tầng gốc S16 |
| P1 | contract | AC-8 bỏ ngoài ca căn lệch khi S16 đến sau | Một căn vật lý thành hai dòng mà E8 vẫn xanh | Fixture có căn lệch, khai luật | fixed: AC-8 khai luật S16 đến sau và đo theo luật đó |
| P1 | design | Khuôn bản thu chưa đủ để biết toà đã trọn qua nhiều đêm | Tầng lỗi rồi thu lại làm toà kẹt hoặc đếm trùng | Danh sách tầng kèm trạng thái, ma trận nhiều bản thu | fixed: thiết kế §3, AC-1, E1 |
| P1 | evals | Không eval nào mở thẻ căn lệch ở màn duyệt | Người duyệt không thấy lệch gì, căn kẹt | ui-check trên thẻ | fixed: thêm E12; hợp đồng ghi duyệt thẻ không đổi dữ liệu ở hàng này |
