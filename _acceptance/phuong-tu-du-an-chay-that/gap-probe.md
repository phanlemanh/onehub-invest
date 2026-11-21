---
slug: phuong-tu-du-an-chay-that
at: 2026-11-19T00:42:41Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

# Phản biện context sạch

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Không có chốt ngăn chuỗi nạp tự chạy lượt ghi đầu; dòng sổ ghi kho_dao false | PR gộp xong, lượt 15 phút kế tiếp tự ghi khoảng 75.000 phát biểu trước khi sao lưu | Chưa có dấu đã áp thì 0 chèn và in lý do | fixed: thêm cờ --noi-tiep, AC-2 và E2; dòng sổ mới kho_dao true, gộp vào Câu 2 |
| P0 | contract | Cách lùi không được chứng minh qua chuỗi nạp và không kê bên đọc phía sau | Lùi xong, lượt nhanh kế tiếp ghi lại toàn bộ phường | Chạy lại chuỗi sau khi lùi, băm phải bằng trước khi áp | fixed: AC-6 và E6 chạy lại transform-zalo cùng bước phường; hồ sơ lùi kê hạng giá và bản cloud |
| P1 | contract | Ô lệch thẻ và ô nhiều dự án không có AC; SQL đếm độc lập chưa viết trước | Mạnh chọn bỏ qua 20 tin thì công thức cũ đỏ sai lý do | Ma trận từng ô viết trước trong hồ sơ | fixed: AC-5, E5 và ma-tran-o.json |
| P1 | evals | E1, E2, E3 đo bước đứng riêng, fixture tự dựng khuôn bên đọc | transform-zalo ghi lại cột mỗi lượt mà eval vẫn xanh | Chạy thật transform-zalo xen giữa; giữ khoá thật ở phiên thứ hai | fixed: AC-1, AC-3, AC-4 và E1, E3, E4 |
| P1 | contract | Số xong việc không có dung sai, cửa sổ 7 ngày trôi, so-chay-thu.md không được đọc | Số thật lệch vì có tin mới nên lượt áp dừng oan | Ghi mốc, khai dung sai, eval đọc tệp | fixed: AC-7, E7; cửa sổ ghim 13–19/11 |
