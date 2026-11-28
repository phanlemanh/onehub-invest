# s02-map-listings-trang-ke — thiết kế

## Bối cảnh và nguyên nhân (số đo ngày 26/11)

- Vòng phân trang `map_listings` của bộ thu S02 (có từ 20/10, khi một thị trường chạm trần 15 000 căn) gọi trang kế
  bằng `POST /v1/market/{m}/map_listings@{offset}`. Lời gọi này trả 404. Bộ thu đếm một lời lỗi rồi đi tiếp, nên
  mỗi lượt vẫn «xong» với `failed: 1` và chỉ có trang đầu.
- Đo 26/11: `/map_listings@15000` → 404; cùng lời với `offset` nằm trong thân (trường `pagination.offset`), đường
  dẫn không đổi → 200, đủ 15 000 căn, 0 căn trùng trang đầu.
- Hà Nội (thị trường 47): 30 623 căn trong ba trang (15 000 + 15 000 + 623). Mã cũ lấy 15 000 → thiếu 15 623 căn.

## Cách làm

Một dòng trong `call()`: đường dẫn gửi lên nguồn là tên trang bỏ hậu tố `@<số>`. Ba nơi giữ nguyên:

- `sourceId` và `meta.apiPath` vẫn là tên trang (`…/map_listings@15000`) để các trang không trùng danh tính;
- `payload.url` là đường dẫn thật đã gửi — tầng transform lấy mã thị trường bằng biểu thức khớp cả hai dạng;
- thân lời gọi vẫn mang `pagination.offset`.

Vòng lặp phân trang không đổi: xin trang kế cho tới khi một trang trả dưới 15 000 căn.

## Bảng phủ ca

| Chiều \ Giá trị | Kết cục | Đo ở đâu | Ai đọc đầu ra phía sau |
|---|---|---|---|
| Tên trang \ có hậu tố `@15000` | gửi không hậu tố, thân giữ offset | AC-1, E1 | nguồn |
| Tên trang \ không có hậu tố | gửi nguyên tên trang | AC-2, E1 | nguồn |
| Danh tính bản ghi \ `sourceId`, `meta.apiPath` | tên trang | AC-1, E1 | transform (đọc theo kind, không dùng hai trường này để khoá) |
| Danh tính bản ghi \ `payload.url` | đường dẫn thật | AC-1, E1 | transform (lấy mã thị trường) |
| Số trang \ trang đầu · trang giữa đủ · trang cuối thiếu | đủ ba trang rồi dừng | chỉ ở chạy thật 18:44–18:47 | pipeline |

Ô bỏ: chạy thật với nguồn sống không xếp thành eval (lưu lượng thật, cần phiên của Mạnh).

## Đo

- Hai ca kiểm mới trong tệp test bộ thu của hàng S02 (tổng tệp: 37 ca): tên trang có hậu tố; tên trang không có hậu tố.
- Phép đo `chay-test-dot-bien.mjs`: chạy tệp test trên bản dist thật rồi trên bốn bản đột biến (bản chép của dist,
  đúng một điểm đổi) — mỗi bản phải làm đỏ ít nhất một ca ngoài số ca đỏ sẵn của bản đối chứng.
- Phép đo vùng `vung.sh`: so với đỉnh nhánh thử nghiệm, chỉ đổi tệp bộ thu, tệp test bộ thu, hồ sơ này; hai tệp cấy bị
  bộ lọc gọi tên.
- Trọn bộ test collector (`config:executors.test.collector`).

## Giới hạn đã thấy

- Khi hàng này được áp, mỗi lượt đêm tải thêm một tới vài trang 15 000 căn cho mỗi thị trường lớn (mỗi trang khoảng
  0,5 MB nén trong snapshot) và số hàng `airdna_listings` của thị trường đó tăng khoảng gấp đôi. Chưa đo các thị
  trường lớn khác.
- Chỉ số `listing_count` của cùng thị trường (17 422 cho tháng 10/2026) thấp hơn nhiều so với số căn của
  `map_listings` (30 623) — hai số đo hai thứ khác nhau; hàng này không diễn giải.
