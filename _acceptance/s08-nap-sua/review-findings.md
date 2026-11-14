# Review findings: s08-nap-sua (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chặn DB máy thu chỉ so khớp nguyên chuỗi URL, nên test vẫn có thể DROP stg_s08_project trên DB dùng chung**
  Người dùng thấy gì: Nếu ai đó chạy test với địa chỉ DB viết khác đi một chút nhưng vẫn trỏ về DB dùng chung của máy thu, test có thể xoá bảng staging dự án S08 thật. Dữ liệu đó nạp lại được từ snapshot nên không mất hẳn.
  Căn cứ: Chỉ xảy ra khi cấu hình sai lệch hiếm gặp, và bảng staging dựng lại được từ snapshot gốc nên hậu quả vừa phải, người dùng cuối không thấy gì.
  file: `pipeline/tests/s08-danh-muc-nap.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Test S08 vào npm test nhưng trên CI lặng lẽ không chạy ca nào (process.exit(0) khi thiếu DATABASE_URL)**
  Người dùng thấy gì: Trên CI, ba ca kiểm hồi quy nạp S08 không chạy mà vẫn báo xanh, nên lỗi nạp S08 quay lại có thể lọt qua CI. Chỉ lượt chấm trên máy mới bắt được.
  Căn cứ: Hợp đồng đã ghi nhận giới hạn này và giao việc sửa cho làn thu. Hậu quả là mất một lớp bảo vệ tự động, không mất dữ liệu, và chạy lại test trên máy là bắt được.
  file: `pipeline/tests/s08-danh-muc-nap.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Chặn DB máy thu đổi từ danh sách cho phép sang khớp nguyên văn một chuỗi; tenDb tính ra nhưng không dùng**
  Người dùng thấy gì: Chốt bảo vệ DB máy thu của test lỏng hơn bản cũ, một số cách viết địa chỉ DB vẫn lọt qua và test có thể xoá bảng staging dự án S08 thật. Dữ liệu này nạp lại được từ snapshot.
  Căn cứ: Trùng với phát hiện trước, xác suất thấp và dữ liệu staging dựng lại được, nên có thể ghi nhận rồi sửa sau với chi phí rẻ.
  file: `pipeline/tests/s08-danh-muc-nap.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture VIẾT TAY đúng khuôn bên đọc. Item căn S08-3 không rút từ writer của collector**
  Người dùng thấy gì: Test dùng dữ liệu căn viết tay, nên nếu phần thu và phần nạp lệch khuôn nhau thì test vẫn xanh trong khi snapshot thật không nạp được căn nào.
  Căn cứ: Rủi ro thấp vì bản sửa này chỉ đổi cách rẽ nhánh theo loại item, không đổi khuôn dữ liệu. Nếu lệch xảy ra thì thấy ngay ở lượt thu thật 22/11 và nạp lại được.
  file: `pipeline/tests/s08-danh-muc-nap.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
