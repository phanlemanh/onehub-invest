---
slug: buoc-chup-khong-in-ten-that
at: 2026-10-25T01:45:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Biến UI_CAPTURE_NAMES_FILE ghi máy quyết dù là lối vòng qua rào tầng A [trang-chu-methodology#F1] | Biến còn đặt hoặc trỏ tệp rỗng → bước chụp thật không so tên, ghi ảnh có tên nguồn thật, ảnh vào kho công khai | Bỏ biến, tiêm nguồn tên qua tham số; hoặc hỏi người | fixed: bỏ biến; phép đo trình duyệt gọi capture() với nguồn tên tiêm (dòng S1 thay d-…-3, AC-6, design mục 4) |
| P1 | design | Trích chữ không nói bỏ cây con [data-tier-a]; mask-tier-a.js giữ thuộc tính phần tử bị che | Tên trong title của phần tử đã che → mã 5 thường trực, AC-3 đỏ | Ghi quy ước trích; E3 đặt tên cả trong chữ lẫn title | fixed: design mục 1 bỏ trọn cây con [data-tier-a]; AC-3/E3 thêm title |
| P1 | evals | Runner giả trả đúng khuôn bên đọc; E6 tên ASCII; không đóng cửa khi đầu ra không đọc được | Đầu ra thật thoát chuỗi hay cắt → 0 tên lộ → ảnh có tên | E6 dùng bộ 3 tên khó; eval đọc chữ không đọc được → mã 7 | fixed: AC-4 + E4 thêm dòng «không có khối kết quả»; E6 dùng bộ 3 tên của UC-TA-1 |
| P1 | evals | E7 chỉ đếm ca ON10, không phân biệt sửa runner với nới assert | Nới assert đăng nhập/bề rộng vẫn đủ 10 ca xanh | Diff dòng assert so merge-base rỗng | fixed: E7 đòi dòng assert.* giống merge-base, in dòng đổi |
| P2 | evals | E1 âm tính thiếu đối chứng dương cùng lần; «bản cũ» không còn ở S4 | Capture thoát sớm → «không tên trong argv» xanh rỗng | Assert có eval che, eval đọc chữ, screenshot, mã 0; chiều đỏ là lần chạy đỏ có sha ở S3 | fixed: E1/E4 sửa expected |
