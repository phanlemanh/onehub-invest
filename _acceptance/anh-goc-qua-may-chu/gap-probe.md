---
slug: anh-goc-qua-may-chu
at: 2026-10-31T00:25:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Lời hứa không lộ tên miền mâu thuẫn với việc giữ evidence.image_url cho Quản trị; E10 lấy tập tên máy từ chính src nên tự quy chiếu | Thẻ có ảnh mẫu làm E10 đỏ oan, hoặc tên miền lọt qua dữ liệu nhúng của trang mà E10 vẫn xanh | Bỏ ngoại lệ hoặc ghi rõ; tập tên máy lấy từ DB, đếm trên toàn mã trang và phản hồi mạng, có đối chứng dương | fixed: evidence.image_url thôi xuống trình duyệt ở mọi vai (sổ d-20261030T175747Z-8 trỏ audit); AC-5, AC-9, E5, E10 đo theo tập tên máy lấy từ DB trên toàn mã trang và phản hồi mạng, kèm đối chứng dương |
| P1 | contract | Ô cơ hội hứa vai ops trên cloud; lối khuyến nghị chỉ máy thu; dòng bỏ đường-đo nói tiêu chí bật đã phủ | Mạnh chọn khuyến nghị tưởng xong lời hứa cloud | Nói thẳng giá ở Hỏi-1 và Notes | fixed: Hỏi-1 viết lại nêu thẳng lời hứa cloud chưa thành (d-20261030T175747Z-7 supersedes d-20261030T175438Z-4); Notes của hợp đồng ghi rõ chờ TV9 |
| P1 | evals | Ma trận E4 hụt so với bảng chặn: thiếu mã không 2xx, hai chế độ quá cỡ, IPv6 riêng và ::ffff: | Stream 50 MB hay fd00::1 lọt mà E4 xanh | Ma trận một-một từ bảng chặn, chiều đỏ ô stream | fixed: AC-4 và E4 thành 15 ô một-một với bảng chặn (đã thêm hai dòng quá cỡ và IPv6 vào bảng), thêm chiều đỏ «stream quá cỡ» |
| P1 | evals | ui-check duy nhất đăng nhập admin trong khi lời hứa cho vai Vận hành | Trang truyền cờ chỉ admin vào loader, ops thật thấy 0 ảnh mà E5, E10 xanh | E10 chạy bằng phiên vai ops | fixed: thêm vai ops cho dev-ops-account.mjs; E10 đăng nhập tài khoản thử vai Vận hành |
| P2 | evals | Fixture khoá và URL viết tay, chưa round-trip với dữ liệu thật về khuôn khoá và scheme | Khoá thật ngoài khuôn hay URL http làm mọi ảnh 404/403 | Quét toàn bảng media thật | fixed: đã đo 31/10 — 186.809/186.809 khoá đúng 32 hex, 100% https; E7 thêm hai số đếm này (ngưỡng 0) trên DB máy thu |
