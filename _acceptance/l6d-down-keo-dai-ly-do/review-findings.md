# Review findings: l6d-down-keo-dai-ly-do (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **song_d_hoi_xoa chưa được gọi ở đâu, nhưng chú thích lại ghi heartbeat gọi nó khi UP**
  Người dùng thấy gì: Một dòng chú thích trong mã nói sai về cách cảnh báo tự đóng khi kênh Zalo sống lại. Người dùng không thấy khác biệt nào, cảnh báo vẫn tự đóng đúng.
  Căn cứ: Chỉ ảnh hưởng người đọc mã sau này, không làm sai cảnh báo hay mất dữ liệu, và sửa lúc nào cũng rẻ.
  file: `scripts/lib/s03-song.sh`
  severity: low
  Đề xuất: wont-fix

- **Mốc 1 lần/giờ của lệnh nhóm không bị xoá khi kênh UP lại, nên sự cố mới trong vòng một giờ không có lý do**
  Người dùng thấy gì: Nếu kênh Zalo rớt, sống lại rồi rớt lần nữa trong vòng một giờ, cảnh báo của lần rớt sau vẫn bắn nhưng chưa kèm lý do (phiên hết hạn hay kênh dừng) cho tới khi đủ một giờ. Người trực phải tự đoán nguyên nhân trong thời gian đó.
  Căn cứ: Cảnh báo vẫn đến đúng lúc và không mất dữ liệu, chỉ thiếu gợi ý nguyên nhân trong tình huống hiếm là rớt lặp lại trong một giờ, và lý do tự có mặt sau đó.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn/mã nguồn thay vì đầu ra): ca «CA-ĐỎ tĩnh» grep chữ trong nguồn heartbeat**
  Người dùng thấy gì: Một bài kiểm tra tự động chỉ dò chữ trong mã chứ không chạy thật, nên có thể báo xanh dù lời gọi bị vô hiệu hoá. Các bài kiểm tra khác chạy thật vẫn bắt được lỗi này nên người dùng không bị ảnh hưởng.
  Căn cứ: Hành vi đã có bài kiểm tra chạy thật canh giữ, nên rủi ro thật cho người dùng gần như không có và việc sửa không đáng chi phí.
  file: `pipeline/scripts/zalo-heartbeat-chan.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Gọi lệnh nhóm xong mà không có output (rc<128) thì vẫn giữ reason cũ thay vì ghi unknown (r1)**
  Người dùng thấy gì: Hiếm khi lệnh kiểm tra nhóm chạy xong mà không in gì, lúc đó hệ thống có thể báo lý do mất kết nối cũ thêm tới một giờ dù chưa xác nhận lại.
  Căn cứ: Ca hiếm, hậu quả nhẹ (chỉ lý do hiển thị chậm cập nhật tối đa một giờ, không mất dữ liệu), tự hết sau giờ kế và sửa sau không đắt.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: low
  Đề xuất: known-limits

- **song_d_hoi_xoa được ghi chú là đường tự đóng khi UP nhưng heartbeat không gọi hàm này (r1)**
  Người dùng thấy gì: Một dòng ghi chú trong mã mô tả sai cách cờ cảnh báo được gỡ; người dùng không thấy khác biệt nào khi dùng.
  Căn cứ: Không ảnh hưởng hành vi, chỉ có thể gây hiểu nhầm cho người sửa sau; sửa ghi chú lúc nào cũng được.
  file: `scripts/lib/s03-song.sh`
  severity: low
  Đề xuất: wont-fix

- **Lệnh source s03-song.sh bỏ qua ZALO_HEARTBEAT_ROOT, không nhất quán với đường alerts (r1)**
  Người dùng thấy gì: Không có hậu quả nhìn thấy khi chạy thật; chỉ là hai cách xác định thư mục gốc không đồng nhất trong mã.
  Căn cứ: Trên máy thật không sai lệch, chỉ là chuyện gọn mã, chi phí sửa vượt hậu quả.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: low
  Đề xuất: wont-fix

- **Một lần channels status quá giờ xoá lý do session đã biết thành unknown, và giữ unknown tới gần 1 giờ (r1)**
  Người dùng thấy gì: Nếu hệ thống kiểm tra bị treo thoáng qua trong lúc phiên Zalo đã hỏng, lý do cần quét lại QR có thể bị ẩn tới gần một giờ; cảnh báo mất kết nối vẫn bắn.
  Căn cứ: Hợp đồng đã chủ ý chấp nhận hành vi này; hậu quả chỉ là lý do hiển thị chậm tối đa một giờ, không mất dữ liệu, tự hồi lại.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: medium
  Đề xuất: known-limits

- **Lệnh nhóm thoát lỗi mà không in gì vẫn tốn lượt 1/giờ và giữ reason cũ, không báo gì (r1)**
  Người dùng thấy gì: Khi lệnh kiểm tra nhóm lỗi âm thầm, nhật ký vẫn in lý do cũ như vừa đo xong, nên người xem có thể tin một lý do chưa được xác nhận.
  Căn cứ: Ca hiếm, hậu quả nhẹ (lý do chỉ mang tính chỉ dẫn, không mất dữ liệu), tự hết sau giờ kế.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture «Đăng nhập thất bại» viết tay đúng khuôn mà bộ đọc grep (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép thử dùng chuỗi lỗi do người viết soạn sẵn, chưa phải đầu ra thật của máy; nếu chữ thật khác đi, lý do phiên hỏng có thể không được nhận ra.
  Căn cứ: Không thể gọi lệnh thật mà không phạm luật an toàn Zalo; giới hạn đã ghi nhận và sẽ lộ ra ngay khi có sự cố thật, không mất dữ liệu.
  file: `scripts/l6d-down-keo-dai-ly-do/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: ca «CA-ĐỎ tĩnh» grep mã nguồn thay vì đo đầu ra (r1)**
  Người dùng thấy gì: Một ca kiểm chỉ đọc chữ trong mã nên có thể báo xanh dù tính năng bị tắt, nhưng một ca khác đã đo tác dụng thật.
  Căn cứ: Đã có ca đo thật bù, hậu quả nhỏ, sửa không đáng chi phí.
  file: `pipeline/scripts/zalo-heartbeat-chan.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3: assert cờ d bằng regex /d/ không neo (r1)**
  Người dùng thấy gì: Một phép kiểm cờ cảnh báo quá lỏng nên có thể không phát hiện nếu cờ này vắng ở vài lý do mất kết nối nhất định.
  Căn cứ: Chỉ làm bài kiểm yếu đi, không ảnh hưởng người dùng hiện tại; siết lại rất rẻ nhưng không cấp bách.
  file: `pipeline/scripts/zalo-heartbeat-chan.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
