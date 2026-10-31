## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bản route đột biến của chiều đỏ được ghi vào cây src/app thay vì thư mục tests/ như mẫu có sẵn**
  Người dùng thấy gì: Nếu phép thử bị ngắt giữa chừng, một tệp tạm có thể nằm lại trong mã nguồn và vô tình lọt vào commit. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ xảy ra khi chạy tay rồi bị ngắt, dễ phát hiện và xoá, không mất hay lộ dữ liệu.
  file: `app/scripts/hd9-roundtrip.ts`
  severity: low
  Đề xuất: known-limits

- **Script GHI không chặn trường hợp thiếu DATABASE_URL như thước cùng loại**
  Người dùng thấy gì: Khi chạy tay mà quên khai báo kết nối, phép thử có thể ghi nhầm vào cơ sở dữ liệu khác với dự định. Đường chạy chuẩn đã có giá trị mặc định an toàn.
  Căn cứ: Rủi ro chỉ có khi chạy tay sai cách, đường chuẩn đã an toàn, và sửa sau rất rẻ.
  file: `app/scripts/hd9-roundtrip.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (thông điệp ghim không phân biệt được): chiều đỏ HD9-AC-4 gắn câu ghim cho mọi lỗi**
  Người dùng thấy gì: Ca thử cho trường hợp ứng viên ngược chiều có thể báo đỏ vì một lỗi khác chứ không đúng lỗi dự kiến. Hành vi người vận hành thấy không đổi.
  Căn cứ: Chỉ làm phép thử kém chính xác chứ không làm hỏng quyết định của người dùng; có thể siết lại sau mà không mất dữ liệu.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
