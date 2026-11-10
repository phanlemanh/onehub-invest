# Review findings: do1-giu-dau-doi-thang (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--sua-ngay-doi-thang ghi dấu ngày D với checked_at = giờ chạy: lượt DO1 15 phút sau xoá mất dấu, trong lúc chờ khối DO1 coi dòng ngày cũ là trạng thái hiện hành**
  Người dùng thấy gì: Sau khi sửa ngày đổi thang đã qua, chừng 15 phút sau hệ thống có thể xoá mất dấu vừa ghi. Khi đó trang chất lượng hiện sai ngày đổi thang hoặc thiếu câu «lần hạ một lần» cho tới lượt đo kế.
  Căn cứ: Lệnh sửa chỉ chạy tay một lần trên máy thu theo lời riêng của Mạnh, nên ảnh hưởng hẹp, và chạy lại lệnh sẽ khôi phục dấu; nhưng sửa sớm rẻ hơn vì cùng chỗ code.
  file: `pipeline/do-hang-ngay.mjs`
  severity: high
  Đề xuất: new-contract

- **Ngày áp thang lấy theo ngày UTC (current_date của DB), so thẳng với ngày VN của DO1: luật 4 và --sua-ngay-doi-thang nhắm sai ngày**
  Người dùng thấy gì: Nếu thang mới được chụp lần đầu trong khoảng 0 đến 7 giờ sáng giờ Việt Nam, hệ thống nhận nhầm ngày đổi thang là hôm trước. Lệnh sửa có thể xoá nhầm dòng chuyển bậc thật của ngày thường và gắn dấu sai ngày.
  Căn cứ: Hậu quả nặng vì có thể mất dữ liệu chuyển bậc ở sai ngày và đã xảy ra đúng ca đổi thang 10/11; tuy nhiên lệnh sửa chưa chạy trên máy thu nên chưa mất gì, và nên sửa trước khi chạy lệnh đó.
  file: `pipeline/do-hang-ngay.mjs`
  severity: high
  Đề xuất: new-contract

- **Dòng dấu do --sua-ngay-doi-thang ghi cho ngày đã qua bị lượt DO1 kế tiếp trong ngày xoá mất**
  Người dùng thấy gì: Dấu đổi thang vừa sửa cho một ngày đã qua có thể bị lượt đo tự động kế tiếp xoá, làm việc sửa mất tác dụng và ngày đó lại không có dòng đo nào.
  Căn cứ: Không mất dữ liệu gốc và chạy lại lệnh được, nhưng người vận hành khó nhận ra vì dấu biến mất âm thầm; nên gộp xử lý cùng lỗi trước đó.
  file: `pipeline/do-hang-ngay.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lệnh sửa bị từ chối thì thoát mã 1, không phải mã 2 như thiết kế**
  Người dùng thấy gì: Khi lệnh sửa từ chối chạy, công cụ báo lỗi chung thay vì báo kiểu từ chối có chủ đích. Người dùng vẫn thấy thông báo hai ngày xung đột và không có dữ liệu nào bị đổi.
  Căn cứ: Hậu quả rất nhẹ vì lệnh từ chối vẫn không ghi gì và chỉ người vận hành đọc kết quả bằng tay, nên chi phí sửa không đáng.
  file: `pipeline/do-hang-ngay.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5: tuyên quét trọn ma trận bảng 1 nhưng mỗi hàng chỉ kiểm một điểm, phép đếm là vòng lặp tự đếm chính nó**
  Người dùng thấy gì: Bộ kiểm tự động chưa phủ hết mọi tổ hợp ngày áp và dấu, nên một lỗi nhỏ ở nhánh dấu đổi thang có thể lọt mà bộ kiểm vẫn xanh. Người dùng không thấy lỗi ngay, chỉ rủi ro lỗi tương lai khó bị phát hiện.
  Căn cứ: Không ảnh hưởng người dùng hiện tại và không mất dữ liệu; chỉ làm yếu lưới an toàn cho lần sửa sau, nên ghi hạn chế đã biết và bổ sung khi chạm vào vùng này.
  file: `pipeline/scripts/do-hang-ngay-doi-thang.itest.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
