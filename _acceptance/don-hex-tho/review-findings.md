# Review findings: don-hex-tho (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rút MAP_FILES còn 2 tệp làm đỏ test cũ LB-AC-1 (app/tests/listings-browse.test.tsx), test này vẫn ghim đúng 5 tệp**
  Người dùng thấy gì: Giao diện người dùng không đổi, nhưng một bước kiểm tra tự động cũ của trang danh sách tin sẽ báo lỗi sau thay đổi này. Lỗi đó có thể chặn việc đưa bản cập nhật lên.
  Căn cứ: Người dùng không thấy gì khác, nhưng bước kiểm tra đỏ chặn việc đưa bản lên và phải sửa trước khi nhập; sửa nhỏ, rẻ, làm riêng thành một việc ngoài hợp đồng này.
  file: `app/eslint.config.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 (assertion âm-tính-một-mình): DHT-AC-8 trên commit thật chỉ assert danh sách vendor rỗng, không ghim rằng đã tìm thấy commit nào của vòng**
  Người dùng thấy gì: Một phép kiểm nội bộ xác nhận vòng dọn màu không chạm mã cài sẵn có thể báo xanh dù không tìm thấy thay đổi nào để kiểm. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ tin cậy của lưới an toàn.
  Căn cứ: Không ảnh hưởng người dùng cuối và không làm mất dữ liệu; rủi ro chỉ xảy ra trong tình huống hiếm về lịch sử thay đổi, và có thể bổ sung sau với giá rẻ.
  file: `scripts/don-hex-tho.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode): DHT-AC-1 (d) đọc kit ở đường cache plugin cố định theo máy tác giả và phiên bản 2.35.0, không có thì skip**
  Người dùng thấy gì: Phép đối chiếu cách quét màu với công cụ kiểm của bộ nghiệm thu chỉ chạy được trên máy có đúng phiên bản công cụ đó, ở máy khác nó bị bỏ qua. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hợp đồng đã chấp nhận điều kiện này và không ảnh hưởng người dùng cuối; chỉ làm yếu một phép đối chiếu phụ, có thể nâng cấp sau khi kit đổi phiên bản.
  file: `scripts/don-hex-tho.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

