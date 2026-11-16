---
slug: s03-len-nhanh-nac-1
at: 2026-11-10T09:31:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-4) | Sổ d-4 coi việc đụng khoá rồi bỏ lượt mà không báo gì là lựa chọn «một lối». Thật ra còn hai lối sống: báo JOB FAIL mỗi lần, hoặc báo JOB FAIL sau K lượt bỏ liền. Đây là khẩu vị rủi ro, thuộc về người quyết. | Khoá kẹt cả ngày: mọi lượt 15′ đều bỏ lượt và thoát 0, S03 không lên mà không ai được báo. | Một câu Hỏi thay d-4, nêu đủ ba lối. AC-4 và E4 thêm ô theo lối anh chọn. | fixed: Hỏi-2 (sổ d-8, supersedes d-4), khuyến nghị bỏ lượt và báo JOB FAIL ở lượt thứ 8 liền (thoát 75). AC-2 (đánh số sau khi dựng lại trên s03-nap-nhanh) và E2 thêm ma trận đếm liền 0→1, 6→7, 7→8, cùng hai ca đặt lại số đếm. |
| P0 | design (sổ d-5) | Sổ d-5 loại phương án hai PR mà không chỉ ra ràng buộc nào làm nó chết. Dấu lại ghi ở đầu lượt, nên cờ đổi trạng thái trước khi job giờ chạy thật. | Job giờ chết ngay bước 1 mà dấu vẫn tươi, nên cloud-sync bỏ cả bảy bước đo suốt 2 giờ. | Dẫn lời người hoặc chuyển thành một câu Hỏi. | fixed: Hỏi-3 (sổ d-9, supersedes d-5). Dấu chuyển sang ghi ở CUỐI lượt, và chỉ khi mã 0. Cloud-sync chạy bảy bước dưới cùng khoá với job giờ. AC-4, AC-5, E4, E5 (đánh số mới) thêm các ô tương ứng. |
| P0 | design (sổ d-3) | Câu trích về đọc gộp không quyết được việc bỏ enrich ban ngày. | Cổng Phạm vi duyệt bỏ enrich dựa trên một câu không nói về enrich. | Tách thành hai dòng. Dòng enrich phải trích lời của Mạnh, hoặc chuyển thành câu Hỏi. | fixed: d-6 giữ phần đọc gộp với câu trích cũ (supersedes d-3). Phần enrich thành Hỏi-1 (sổ d-7); sau đó cả hai dòng rút (sổ d-11, d-12) vì hàng s03-nap-nhanh gộp trước đã cho lượt nhanh dừng trước đọc gộp và enrich. |
| P1 | contract | Hợp đồng không ghim thứ tự giữa lúc đọc sổ, lúc ghi sổ và lúc nhả khoá nạp, và không có tiêu chí cho hai lượt chồng nhau. | Đọc gộp và enrich chạy hai lần trong cùng một ngày. | Thêm AC và eval cho hai lượt chồng nhau, kèm đối chứng chạy tuần tự. | fixed: thay bởi hàng s03-nap-nhanh — lượt nhanh không chờ khoá nạp mà bỏ lượt khi khoá bận, và không bao giờ chạy đọc gộp hay enrich (AC-3, AC-5 của hàng ấy); sổ ngày bỏ (sổ d-10), nên không còn hai lượt đủ trong ngày. E6e chạy lại test của hàng ấy. |
| P1 | evals (E1) | Ô ba của E1 không có kỳ vọng, và kết quả phụ thuộc đồng hồ thật. | Chạy vào ngày khác 10/11 thì hai ô đầu đỏ giả. | Đặt ngày giả cho mọi ô, và thêm một ca dùng ngày khác. | fixed: sổ ngày bỏ; E1 nay là ma trận bốn ô theo cờ --luot-nhanh, không đọc đồng hồ. |

Ghi chú ngoài bảng: AC-8 từng ghi «hai bộ» trong khi liệt kê ba tệp. Đã sửa thành «ba bộ».
