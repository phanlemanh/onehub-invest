# Script đo ba vai không gãy vì tên nguồn trống — thiết kế

Hàng CG20 `can-gia-tot-ba-vai-ten-nguon-trong` (dãy N1; từ Ngoài-4 của NK1, Mạnh «mở hợp đồng mới»). Hồ sơ
`_acceptance/can-gia-tot-ba-vai-ten-nguon-trong/`.

## Vấn đề

`scripts/can-gia-tot-ba-vai.mjs` (thước E10 của hồ sơ `can-gia-tot-biet-can`) đọc `source_registry.real_name` rồi gọi
`.toLowerCase()` trên từng dòng để soát trang có lộ tên nguồn không. Dòng có `real_name` NULL làm script ném lỗi giữa chừng.
Dòng rỗng còn tệ hơn: `"…".includes("")` luôn đúng, nên mọi trang bị báo «lộ tên nguồn» giả. DB máy thu hôm nay 15/15 dòng có tên;
lỗi lộ ở DB khác (DB thử, bản chép).

## Lựa chọn

Tách việc dựng danh sách tên ra `scripts/can-gia-tot-ba-vai-ten-nguon.mjs`:
- `danhSachTenNguon(rows)`: bỏ dòng `real_name` NULL, rỗng, chỉ khoảng trắng, không phải chuỗi, dòng null; tên còn lại cắt khoảng trắng,
  chữ thường.
- `coTenNguonTrong(ten, s)`: so không phân biệt hoa thường.
Script đo ba vai gọi hai hàm này thay cho dòng cũ. Test `scripts/can-gia-tot-ba-vai-ten-nguon.test.mjs` (không DB, tên giả).

## Ngoài phạm vi

- Chạy trọn script đo ba vai (cần bản app đang chạy và tài khoản thử; thước E10 của hồ sơ CG1 vẫn là chỗ chạy trọn).
- Làm sạch dữ liệu `source_registry` (không có dòng NULL ở máy thu).
- Các chỗ khác đọc `real_name` (bộ che, bộ soát tầng A) — hàng riêng nếu cần.

## Đặc tả UX

Không chạm UI.
