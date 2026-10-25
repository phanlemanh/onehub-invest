# Review findings: hook-zalo-spool (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Lỗi 401/403/404 từ collector đẩy tin vào rejected/ vĩnh viễn**
  Người dùng thấy gì: Nếu khoá của hook lệch khoá của collector (xoay khoá, collector chạy với danh sách khoá rỗng), mọi tin trong lúc đó rơi vào thư mục bị loại. Sửa khoá xong tin cũng không tự gửi lại; Ops thấy một khoảng trống dữ liệu tới khi có người chép tay.
  Căn cứ: Mất tin thật cho người dùng Ops và không tự hồi phục, trong khi lỗi khoá là lỗi cấu hình tạm thời sửa được; nên sửa trước khi triển khai hook lên máy thật.
  file: `collector/openclaw/handler.js`
  severity: medium
  Đề xuất: new-contract

- **Collector chậm mà vẫn trả lời làm một lượt hook kéo dài tới vài phút**
  Người dùng thấy gì: Gateway Zalo phải chờ hook. Nếu collector trả lời mỗi yêu cầu sau gần 8 giây, lượt xả không dừng và một lượt hook có thể kéo tới khoảng 7 phút, trong lúc đó tin mới của nhóm phải đợi.
  Căn cứ: Ảnh hưởng thẳng tới gateway của ống thu Zalo (an toàn và độ trễ), dù chỉ xảy ra khi collector quá tải; cần một trần thời gian cho cả lượt trước khi triển khai.
  file: `collector/openclaw/handler.js`
  severity: medium
  Đề xuất: new-contract

- **Tệp hàng đợi chứa chữ tin và người gửi nhưng quyền đọc theo mặc định của máy**
  Người dùng thấy gì: Không thấy gì trên giao diện. Trên máy, tệp hàng đợi (chữ tin, tên và mã người gửi) có quyền đọc như tệp thường.
  Căn cứ: Dữ liệu tầng A nằm trong thư mục home của Mạnh, vốn đã chặn tài khoản khác trên macOS, nên rủi ro lộ thấp; sửa sau rẻ.
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits

- **Một tệp hàng đợi hỏng đúng kiểu (JSON null) làm ống ngừng giao tin**
  Người dùng thấy gì: Collector không nhận tin mới nào cho tới khi có người xoá tệp đó; tin không mất (nằm trong hàng đợi) nhưng ống đứng im lặng.
  Căn cứ: Chỉ xảy ra khi đĩa hỏng hoặc có người sửa tay tệp, không mất dữ liệu, và bộ canh Ops sẽ thấy phễu về 0; ghi lại là đủ.
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits

- **Sự kiện dị dạng vẫn làm hook ném lỗi và mất đúng tin đó (có từ trước ZC6)**
  Người dùng thấy gì: Khi gateway gửi một sự kiện có nội dung không phải chữ, ảnh không phải danh sách hoặc giờ hỏng, tin đó mất, không vào hàng đợi.
  Căn cứ: Lỗi có sẵn trên main, chưa từng gặp với sự kiện thật của gateway, và chỉ mất đúng một tin dị dạng; ghi lại, gom vào vòng sửa sau.
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits
