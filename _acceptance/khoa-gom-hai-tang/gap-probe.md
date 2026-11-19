---
slug: khoa-gom-hai-tang
at: 2026-11-19T15:40:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng chọn công tắc khai một-lối nhưng lối giữ PR tới sau PL20, lùi bằng hoàn mã vẫn sống | Cổng Phạm vi đọc như ràng buộc cứng, không xét lối giữ PR | Viết lại thành câu chỉ người có lối khác | human-gate1: thành Hỏi-5 (dòng sổ mới supersedes d-20261119T152243Z-11) |
| P1 | contract+evals AC-5/E5 | Lệnh kiểm 0 tin khác phân khu dùng chính bộ đọc của khoá làm thước | Viết tắt chưa có trong danh bạ: khoá và lệnh kiểm cùng thấy tập rỗng, xanh rỗng | Danh sách 172 offer_id đóng băng, assert từng tin, đỏ khi bộ đọc trả rỗng | fixed: AC-5 và E5 ghim danh sách đóng băng có băm, một assert mỗi tin, đỏ khi tập rỗng |
| P1 | contract+evals AC-1/E1 | «Giống hệt khoá cũ» không nói đường chuẩn | Thay đổi dùng chung lọt nhánh tắt, hai vế cùng đổi, E1 xanh | Đường chuẩn chạy từ sha main trên cùng bản chép | fixed: đường chuẩn từ sha main, thêm đột biến bộ tìm mã chạy khi tắt |
| P1 | contract AC-9 | Ngưỡng 5% không nói điểm hay cận, cỡ mẫu, đơn vị, ca bị loại | Mẫu nhỏ đạt điểm khi cận trên 13%; ca khó bị loại | Khai đơn vị, n tối thiểu, đếm ca loại | fixed: đơn vị tin nhiều bản chữ có nhãn, n từ 60, ước lượng điểm theo ô cơ hội, in cận Wilson, ca loại không quá 20% |
| P1 | contract+evals AC-4/AC-10 | Luật đúng một ứng viên không đo khi bài tới dần | Tin lật thành phần giữa các lượt nạp | Phát lại theo lát ngày so lượt toàn bộ | fixed: AC-10, E10 thêm phát lại theo lát ngày, thành phần cuối bằng nhau, mỗi lần lật có đường nối |
