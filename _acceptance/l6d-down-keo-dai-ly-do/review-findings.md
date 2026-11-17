# Review findings: l6d-down-keo-dai-ly-do (round 1)

## Trong hợp đồng

- **Hình dạng 4/5: MA-CHI-DOC-DO gộp hai lỗi vào một bản phá, và lớp «lời gọi CLI qua biến khác» chỉ thử một điểm**
  AC: AC-5
  file: `scripts/l6d-down-keo-dai-ly-do/acceptance.mjs:415`
  severity: medium
  source: measurement
  detail: Dòng 415 chèn cùng lúc hai vi phạm: `echo "{}" > "$HOME/.openclaw/openclaw.json"` và `GW="$HOME/.openclaw/bin/openclaw"; "$GW" config set a b`. Chốt chotMaChiDoc trả cùng một thông điệp ghim cho cả hai nhánh (dòng 228), nên ca -DO xanh dù chỉ một bộ dò còn chạy. Nếu bộ dò ghi cấu hình (dòng 220) hỏng, ca vẫn đỏ đúng nhờ dòng GW, nên không ca nào chứng được nhánh ghi. Nhánh «gọi CLI qua biến khác» chỉ bắt được nhờ phép gán chứa đường `.openclaw/bin/openclaw` nằm cùng dòng với lời gọi. Chạy thử regex dòng 221: `"$GW" config set a b` đứng một mình cho false; `GW="$HOME/.openclaw/bin/openclaw"` cho true. Chốt bắt đường dẫn, không bắt lời gọi. Ví dụ `"$ZALO_OPENCLAW_CLI" message send` không khớp mẫu nào nên lọt qua. AC-5/E7 nói đây là lớp «lời gọi CLI nào ngoài hai dạng» nhưng chỉ có một điểm thử, không có ma trận gồm gán khác dòng, biến env trực tiếp và ghi cấu hình riêng lẻ.
  rationale: AC-5 đòi bản chép chèn lời gọi CLI qua biến khác thì chốt đỏ; finding chỉ ra chốt chỉ bắt theo đường dẫn nên lời gọi qua biến không chứa đường dẫn lọt qua.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Gọi lệnh nhóm xong mà không có output (rc<128) thì vẫn giữ reason cũ thay vì ghi unknown**
  Người dùng thấy gì: Hiếm khi lệnh kiểm tra nhóm chạy xong mà không in gì, lúc đó hệ thống có thể báo lý do mất kết nối cũ thêm tới một giờ dù chưa xác nhận lại.
  Căn cứ: Ca hiếm, hậu quả nhẹ (chỉ lý do hiển thị chậm cập nhật tối đa một giờ, không mất dữ liệu), tự hết sau giờ kế và sửa sau không đắt.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: low
  Đề xuất: known-limits

- **song_d_hoi_xoa được ghi chú là đường tự đóng khi UP nhưng heartbeat không gọi hàm này**
  Người dùng thấy gì: Một dòng ghi chú trong mã mô tả sai cách cờ cảnh báo được gỡ; người dùng không thấy khác biệt nào khi dùng.
  Căn cứ: Không ảnh hưởng hành vi, chỉ có thể gây hiểu nhầm cho người sửa sau; sửa ghi chú lúc nào cũng được.
  file: `scripts/lib/s03-song.sh`
  severity: low
  Đề xuất: wont-fix

- **Lệnh source s03-song.sh bỏ qua ZALO_HEARTBEAT_ROOT, không nhất quán với đường alerts**
  Người dùng thấy gì: Không có hậu quả nhìn thấy khi chạy thật; chỉ là hai cách xác định thư mục gốc không đồng nhất trong mã.
  Căn cứ: Trên máy thật không sai lệch, chỉ là chuyện gọn mã, chi phí sửa vượt hậu quả.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: low
  Đề xuất: wont-fix

- **Một lần channels status quá giờ xoá lý do session đã biết thành unknown, và giữ unknown tới gần 1 giờ**
  Người dùng thấy gì: Nếu hệ thống kiểm tra bị treo thoáng qua trong lúc phiên Zalo đã hỏng, lý do cần quét lại QR có thể bị ẩn tới gần một giờ; cảnh báo mất kết nối vẫn bắn.
  Căn cứ: Hợp đồng đã chủ ý chấp nhận hành vi này; hậu quả chỉ là lý do hiển thị chậm tối đa một giờ, không mất dữ liệu, tự hồi lại.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: medium
  Đề xuất: known-limits

- **Lệnh nhóm thoát lỗi mà không in gì vẫn tốn lượt 1/giờ và giữ reason cũ, không báo gì**
  Người dùng thấy gì: Khi lệnh kiểm tra nhóm lỗi âm thầm, nhật ký vẫn in lý do cũ như vừa đo xong, nên người xem có thể tin một lý do chưa được xác nhận.
  Căn cứ: Ca hiếm, hậu quả nhẹ (lý do chỉ mang tính chỉ dẫn, không mất dữ liệu), tự hết sau giờ kế.
  file: `collector/scripts/zalo-heartbeat.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture «Đăng nhập thất bại» viết tay đúng khuôn mà bộ đọc grep**
  Người dùng thấy gì: Phép thử dùng chuỗi lỗi do người viết soạn sẵn, chưa phải đầu ra thật của máy; nếu chữ thật khác đi, lý do phiên hỏng có thể không được nhận ra.
  Căn cứ: Không thể gọi lệnh thật mà không phạm luật an toàn Zalo; giới hạn đã ghi nhận và sẽ lộ ra ngay khi có sự cố thật, không mất dữ liệu.
  file: `scripts/l6d-down-keo-dai-ly-do/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: ca «CA-ĐỎ tĩnh» grep mã nguồn thay vì đo đầu ra**
  Người dùng thấy gì: Một ca kiểm chỉ đọc chữ trong mã nên có thể báo xanh dù tính năng bị tắt, nhưng một ca khác đã đo tác dụng thật.
  Căn cứ: Đã có ca đo thật bù, hậu quả nhỏ, sửa không đáng chi phí.
  file: `pipeline/scripts/zalo-heartbeat-chan.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3: assert cờ d bằng regex /d/ không neo**
  Người dùng thấy gì: Một phép kiểm cờ cảnh báo quá lỏng nên có thể không phát hiện nếu cờ này vắng ở vài lý do mất kết nối nhất định.
  Căn cứ: Chỉ làm bài kiểm yếu đi, không ảnh hưởng người dùng hiện tại; siết lại rất rẻ nhưng không cấp bách.
  file: `pipeline/scripts/zalo-heartbeat-chan.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
