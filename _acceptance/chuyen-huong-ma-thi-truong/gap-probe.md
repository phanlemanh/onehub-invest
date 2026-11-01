---
slug: chuyen-huong-ma-thi-truong
at: 2026-11-01T01:10:30Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

# Gap probe — chuyen-huong-ma-thi-truong

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-3 ghi 308 là lối duy nhất (mot-loi, kho_dao false) trong khi 307 tạm qua redirect() vẫn sống; chuyển hướng vĩnh viễn được trình duyệt và máy tìm kiếm lưu nên khó rút | Áp 064 rồi phải lùi: khách đã lưu 308 tới /vn/da-nang đang 404, không quay lại mã dài được | Dòng sổ mới supersedes d-3, kho_dao true, nêu lối 307 và giá, hoặc thành Hỏi-n | human-gate1: dòng d-8 thay d-3 thành Hỏi-1 (308 hay 307, máy khuyên 308, kho_dao true); design và AC-2 ghi điều kiện theo Hỏi-1 |
| P0 | design | Dòng sổ d-4 trích /api/v1/markets (không thuộc 4 route được bí danh) làm căn cứ mục tiêu cho cam kết mã cũ còn chạy với client ngoài; kho_dao false | Client ngoài dựa vào bí danh, về sau gỡ bí danh là phá hợp đồng công khai không ai duyệt | Trích câu tự khai public của chính route, kho_dao true kèm thời hạn giữ, hoặc hỏi Mạnh | human-gate1: dòng d-9 thay d-4 thành Hỏi-2 (giữ bí danh không hạn hay đặt hạn, máy khuyên không hạn, kho_dao true); /api/v1/listings và /api/v1/asset-stats tự khai public, deals/offers đang đóng chỉ token ops |
| P1 | evals | AC-8 ở trạng thái trước 064 không có dữ liệu nên rỗng bằng rỗng; ca đếm truy vấn âm không có đối chứng dương, đo chuỗi 'id = ANY' thay vì quan hệ | giaiMaKhuVuc luôn trả mã ngắn: trước 064 mọi route trả rỗng cho 32 tỉnh mà E8 vẫn xanh | DB trước chèn cùng bộ dữ liệu dưới mã dài, ≥ 1 phần tử + mã dài trong kết quả; đếm tổng truy vấn so mốc + đối chứng dương + đột biến luôn-tra | fixed: AC-8 sửa chữ; design §Đo dựng DB trước có dữ liệu dưới mã dài; E4, E8 đếm mọi truy vấn so mốc gốc hàng, đối chứng dương mã dài ở DB sau, đột biến luôn-tra |
| P1 | evals | AC-6/AC-7 hứa không rỗng nhưng E6/E7 chỉ ép một hai ô; E7 thiếu ?area= | Quên bí danh ở deals: rỗng bằng rỗng, E6/E7 xanh | Ma trận route × tham số viết trước, mỗi ô ≥ 1 phần tử với mã ngắn rồi so byte, đột biến từng route | fixed: E6 ma trận 5 ô, E7 ma trận 9 ô (thêm ?area= của listings, asset-stats, deals), mỗi ô ≥ 1 phần tử, số ô in ra, đột biến bỏ giaiMaKhuVuc từng tệp route |
| P1 | evals | AC-9 đòi npm test, tsc, lint của app xanh nhưng không eval nào chạy chúng; không khoanh đỏ sẵn | Vỡ lint hay một test app có sẵn mà E1–E10 vẫn xanh; hoặc suite đỏ sẵn khiến AC-9 không bao giờ xanh | Eval chạy tsc + lint + npm test, so tập đỏ với gốc hàng | fixed: AC-9 sửa thành «không thêm ca đỏ so với gốc»; thêm E11 (app tsc + lint) và E12 (npm test, so tập ca đỏ với gốc hàng khi có đỏ) |
