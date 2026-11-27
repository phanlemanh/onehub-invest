---
slug: nap-s09-toa-tang-vao-danh-ba
at: 2026-11-18T13:20:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Việc tạo gần 300 nút ứng viên và bậc của toà mới ghi là máy quyết mà căn cứ chưa đủ | Danh bạ gần gấp đôi số dự án mà người không được hỏi | Chuyển thành câu hỏi, trích đúng căn cứ | fixed: thành Hỏi-2; dòng bậc toà trích lại căn cứ |
| P0 | contract | Ngưỡng 95% toà không có công thức, đụng luật chờ thẻ | Code đúng mà lượt đo đỏ, hoặc tính chờ thẻ là đã vào | Khai công thức và trần từng phần | fixed: AC-10 khai công thức, trần chờ thẻ 10% |
| P0 | evals | Độ đúng của bí danh toà chỉ đo bằng tên | Hai toà thật cùng tên bị gộp, căn đổ sai toà | Tín hiệu không phải tên | fixed: AC-5, E5, E10 so số tầng với S16 |
| P1 | contract | Thiếu vòng đời dự án chờ thẻ và phép cộng phần dự án | Thẻ duyệt xong mà toà không chạy tiếp | Ba trạng thái thẻ, phép cộng dự án | fixed: AC-3, E3, AC-10, E10 |
| P1 | evals | AC-7 chưa đo cấu trúc khu và ca mã khớp hai căn | Máy chọn căn đầu, bí danh sai mà vẫn xanh | Ca khớp hai, đột biến chọn căn đầu | fixed: AC-7, E7 |
