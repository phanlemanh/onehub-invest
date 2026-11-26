---
slug: data-api-dong-khi-thieu-khoa
at: 2026-11-25T08:19:10Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E1 liệt kê tay năm đường /v1 trong khi lời hứa là mọi đường dữ liệu; không ma trận toàn phần, sót đường chi tiết như listings/:id [d-20261124T151548Z-16] | Lớp chặn gắn sai thứ tự hay sai tiền tố, một đường chi tiết vẫn trả dữ liệu khi thiếu khoá, năm đường liệt kê đều 503 nên E1 xanh | Đọc app.routes, lọc mọi /v1, thay tham số; số assert = số đường đăng ký; đối chứng số đường > 5 | fixed: AC-1 và E1 đọc đường từ bảng route của app, in số đường, assert N > 5, số assert = 15 × (2N + 2) |
| P1 | contract | Trục A gộp giá trị lạ với vắng bằng phán đoán về code chưa viết; ô test kèm VERCEL không có ca | Cài đặt viết điều kiện mở hẹp sai (vd không phải production là mở), NODE_ENV=staging hay Vercel đặt NODE_ENV=test vẫn mở mà ma trận vẫn xanh | Thêm staging và test+VERCEL vào ma trận đóng | fixed: AC-1 thêm hai môi trường đóng (năm môi trường), Trục A bỏ chữ gộp, mỗi giá trị một ca |
| P1 | evals | Không eval nào chạy toàn bộ test data-api sau hàng; lời hứa một dòng NODE_ENV đủ cho test HT19 chưa được đo | Test HT19 hay tệp test khác dựa vào không khoá là mở, sau PB3 nhận 503 và đỏ trên main trong khi hồ sơ PB3 xanh | Eval chạy mọi tệp test data-api một lượt trên DB thử | fixed: AC-8 vế (b) + E11 (executors.test.dapi_khoa_toan) chạy test/*.test.ts chung một lượt, đầu ra phải có tên ca của cả hai tệp |
| P2 | contract | AC-5 chỉ đo khởi động ở production, thiếu ca NODE_ENV vắng (ca Docker, căn cứ của Hỏi-1); thông điệp chỉ đo bằng tên biến [d-20261124T151548Z-16] | index.ts chỉ kiểm production, bản Docker vắng NODE_ENV vẫn khởi động; tiến trình chết vì lỗi khác có nhắc DATA_API_KEYS vẫn làm E5 xanh | Thêm ca vắng NODE_ENV; assert nguyên câu hằng thông điệp xuất từ auth.ts | fixed: AC-5 và E5 thêm ca vắng NODE_ENV, so nguyên câu hằng đọc bằng import động (module cũ không có hằng → ca đỏ có tên, tệp test vẫn nạp) |
| P2 | contract | AC-7 nói đúng tập ca ghim trong khi E7 đo gồm; tệp test nhập tên mới thì bản cũ hỏng lúc nạp, không còn tên ca | Bản cũ đỏ thêm AC-3 làm AC-7 hiểu theo chữ là không đạt; hoặc bản sao không nạp được tệp test nên probe xanh hay đỏ không xác định | AC-7 đổi thành gồm ít nhất; assert bản sao nạp được tệp test trước khi so tập đỏ | fixed: AC-7 và E7 đổi thành gồm ít nhất AC-1, AC-4, AC-5, thêm điều kiện có ≥ 1 tên ca PB3-AC- trong đầu ra trước khi so; test chỉ nạp auth.ts bằng import động |
