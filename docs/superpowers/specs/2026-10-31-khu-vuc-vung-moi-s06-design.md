# Mã thị trường vùng mới S06 — bản tạm ở app — thiết kế

Hàng `khu-vuc-vung-moi-s06` (đợt dot0-cam-mau, dãy P2, T2). Ca `ON12-AC-7 mọi giá trị đang có trên DB local có nhãn` đỏ trên
main a404af39: /ops in «S06 · da-nang (chưa có tên Việt)». Ca này làm suite app đỏ ở mọi dãy, mọi lượt chấm S4 bị REJECT.

## Nguyên nhân (đo 31/10)

Nhóm thu S06 dùng khoá `da-nang` (cityCode `vn-da-nang`) theo quy ước `vn-<khoá>` của `reassign-areas` (MARKETS) và
`pipeline/import-provinces.mjs` hiện tại. Bảng `areas` trên :5433 lại có 32 thị trường mã dài `vn-thanh-pho-*`/`vn-tinh-*` do
một lần nạp tỉnh cũ để lại — 0 va chạm với mã ngắn, 0 phường con, 0 tham chiếu ở sáu bảng có khoá ngoại.
`marketNameOf` thử `code` rồi `vn-<code>` nên không thấy.

## Thiết kế (TẠM — giám sát quyết 31/10)

`marketNameOf` (app/src/lib/market-names.ts) thử thêm `vn-thanh-pho-<mã>` rồi `vn-tinh-<mã>` khi mã ngắn không có; mã vào có
tiền tố `vn-` (cityCode) thì bỏ tiền tố trước khi thử. Mã ngắn có sẵn vẫn thắng; mã lạ vẫn báo «(chưa có tên Việt)».

**Bản sửa đúng về dữ liệu** là hàng riêng `ma-thi-truong-ngan` (P2, T3, migration 064 giữ chỗ): đổi id 32 thị trường mã dài
về `vn-<tên>`. Khi hàng ấy xong, gỡ phép tra mã dài khỏi `marketNameOf`.

## Ngoài phạm vi

- Đổi mã `areas` (hàng `ma-thi-truong-ngan`).
- Nạp phường Đà Nẵng, Hải Phòng, Bình Dương, Khánh Hoà để `reassign-areas` gán ra phường (hàng sau).
