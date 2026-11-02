# Trang Cho thuê trong ma trận chuyển hướng mã thị trường dài

Nguồn: Ngoài-24 của hồ sơ `tin-rao-tren-invest`. Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 02/11
(`_acceptance/tin-rao-tren-invest/decisions.jsonl`, dòng `d-20261102T094427Z-71`).

## Vấn đề

Hồ sơ `tin-rao-tren-invest` tách `/listings` thành `/listings/sale` và `/listings/rent`. Ma trận của hồ sơ
`chuyen-huong-ma-thi-truong` khi đó chỉ đổi đường sang `sale`, nên link cũ chứa mã dài mở sang Cho thuê không có ca nào đo.

Hai trang dùng chung `ListingsRoute`. Hai loại hỏng mà ô `sale` không bắt được:
- `rent/page.tsx` truyền nhầm `segment`: link cũ Cho thuê sang trang Bán.
- Chuyển hướng làm rơi query: `?term=short` mất, người xem sang nhầm thuê dài hạn. Query này chỉ có nghĩa ở trang Cho thuê.

## Cách làm

Chỉ thêm phép đo. Không đổi mã sản phẩm: chuyển hướng đã có sẵn trong `ListingsRoute`.

Thêm ô vào `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`, chạy qua `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app`
trên DB thử `oneinvest_n1_chm_*`, cả hai trạng thái trước và sau 064:
- 32 mã dài × trang rent.
- Ma trận trang × query có thêm hàng rent; ma trận riêng rent × `{}`, `tab`, `term`, `term + tab`.
- Đường cũ `/listings?kind=rent_lt|rent_st` đi hai nhịp tới trang rent.
- Mã không đích 404, mã thường không đụng, đếm truy vấn bằng mốc gốc.
- Ba đột biến trên bản chép: nhầm segment, bỏ nhánh chuyển hướng, rơi query.

`acceptance.mjs` đòi thấy dòng của từng nhóm ô trong đầu ra: `node --test` chạy 0 ca vẫn thoát 0.

## Đã loại

- Tệp test riêng: phải chép bộ đồ nghề DB thử và đột biến, và lời giao nêu đích danh ma trận này.
- Test thuần `ListingsRoute`: không bắt được lỗi `segment` ở `rent/page.tsx`.

## Đặc tả UX

Không chạm giao diện: chỉ thêm phép đo trên hàm trang, không đổi trang nào.
