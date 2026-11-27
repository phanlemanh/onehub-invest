# Review findings: nap-s09-toa-tang-vao-danh-ba (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hàm thư viện docSnapshot đọc cờ --cho-phep-loi thẳng từ process.argv toàn cục**
  Người dùng thấy gì: Một tiến trình khác gọi bộ nạp có thể vô tình mở đường nạp lượt thu hỏng nếu dòng lệnh của nó chứa cờ đó. Người dùng thường không gặp.
  Căn cứ: Chỉ xảy ra khi chạy sai cách ở máy nội bộ, không mất dữ liệu và dễ phát hiện, nên ghi lại là đủ.
  file: `pipeline/import-s09-danh-ba.mjs`
  severity: low
  Đề xuất: known-limits

- **snapshotId lấy từ manifest không được kiểm ở ranh giới nạp**
  Người dùng thấy gì: Nếu tệp mô tả của bản thu ghi sai mã, dữ liệu nạp vào có thể không gỡ được bằng đường lùi hoặc bị gắn nhầm vào bản thu khác.
  Căn cứ: Chỉ xảy ra khi bản thu từ làn thu bị ghi sai, hiện chưa có ca nào; nếu xảy ra thì dữ liệu nạp nhầm khó dọn tay.
  file: `pipeline/import-s09-danh-ba.mjs`
  severity: low
  Đề xuất: known-limits

- **Đường dẫn tuyệt đối của máy chứa tên người dùng, viết cứng vào kho công khai**
  Người dùng thấy gì: Tên tài khoản máy của chủ dự án lộ trong mã công khai, và lệnh đo mặc định chỉ chạy đúng trên máy này.
  Căn cứ: Tên người dùng máy không phải bí mật nặng, dễ đổi bằng biến môi trường, và sửa sau không tốn kém nhưng cũng ít lợi.
  file: `pipeline/scripts/danh-ba-s09-toa-that.mjs`
  severity: low
  Đề xuất: wont-fix

- **Một thẻ luật S09 bất kỳ còn hiệu lực bật tự nối cho mọi dự án trùng tên về sau, kể cả dự án ngoài mẫu băm đã duyệt**
  Người dùng thấy gì: Sau khi một luật nối được duyệt, các dự án mới cùng tên xuất hiện về sau có thể được nối thẳng vào danh bạ mà không ai duyệt lại.
  Căn cứ: Có thể nối nhầm dự án vào danh bạ mà không qua người duyệt, nên đáng làm thành một việc riêng với hợp đồng rõ về phạm vi luật.
  file: `pipeline/lib/s09-dung.mjs`
  severity: medium
  Đề xuất: new-contract

- **Tệp items là object không có khoá `items` bị nuốt thành 1 item «phi_object», mất trọn tệp mà không báo lỗi**
  Người dùng thấy gì: Nếu một tệp dữ liệu có khuôn lạ, cả tệp bị bỏ qua mà chỉ báo bỏ một mục, nên danh bạ có thể thiếu dự án mà không ai hay.
  Căn cứ: Chỉ xảy ra với bản thu sai khuôn, và phép đối chiếu số với bản thu sẽ lộ sự thiếu hụt; thu lại hoặc nạp lại được.
  file: `pipeline/import-s09-danh-ba.mjs`
  severity: low
  Đề xuất: known-limits

- **`.catch(() => ({rows: []}))` trên truy vấn iso_regions không cứu được lỗi vì đang ở trong giao dịch của dung()**
  Người dùng thấy gì: Trên DB chưa cập nhật đủ, lượt dựng danh bạ báo một lỗi khó hiểu và dừng, không ghi gì dở.
  Căn cứ: Chỉ gặp trên DB chưa cập nhật, kết quả là lượt dựng bị lùi sạch và chạy lại được sau khi cập nhật, chỉ thông báo lỗi gây nhầm.
  file: `pipeline/lib/s09-dung.mjs`
  severity: low
  Đề xuất: wont-fix

- **datLink không cập nhật can_cu khi chỉ căn cứ đổi, nên bộ đếm theo can_cu bị lệch**
  Người dùng thấy gì: Trong ca hiếm, bảng đếm dự án theo cách nối có thể ghi sai nhóm, dù dự án vẫn nối đúng nút.
  Căn cứ: Chỉ sai một con số thống kê phụ trong ca hiếm, không mất dữ liệu và không đổi kết quả nối.
  file: `pipeline/lib/s09-dung.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode ROOT): đầu vào phép đo E2/E10/E12 mặc định trỏ vào checkout chính của tác giả**
  Người dùng thấy gì: Lệnh đo mặc định đọc bản thu ở thư mục chính của máy này, nên chạy từ máy hay bản làm việc khác phải tự chỉ đường dẫn.
  Căn cứ: Trên máy thu đường mặc định đúng và có cách ghi đè; sai chỉ khiến lượt đo báo thiếu dữ liệu chứ không làm hỏng gì.
  file: `pipeline/scripts/danh-ba-s09-toa-that.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
