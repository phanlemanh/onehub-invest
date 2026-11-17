## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 1/3: đo chữ nguồn của agent thay vì đầu ra, nên quan hệ «tuyChonGui của pipeline khớp agent» không được kiểm**
  Người dùng thấy gì: Nếu bên đọc tin đổi cách gửi bài tới model mà bên chọn mẫu quên đổi theo, bài kiểm vẫn báo xanh. Người dùng không thấy hậu quả ngay, chỉ có thể lệch cấu hình gửi model về sau.
  Căn cứ: Hậu quả nhẹ, không mất hay lộ dữ liệu, chỉ là rào kiểm chưa đủ chặt; người vận hành tự phát hiện và chỉnh lại được, sửa sau cũng rẻ.
  file: `pipeline/scripts/tap-nhan-hai-khu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Danh sách ba model đã duyệt bị chép tay sang pipeline, không có test giữ hai bản khớp nhau (r2)**
  Người dùng thấy gì: Nếu sau này đổi danh sách model đọc tin ở một nơi mà quên nơi kia, bước điền nháp nhãn có thể vẫn gửi bài tới model cũ mà không ai biết. Hiện hai danh sách đang giống nhau nên người duyệt nhãn chưa thấy gì sai.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi có người đổi cấu hình sau này; không mất hay lộ dữ liệu; thêm một phép so khớp sau này rẻ.
  file: `pipeline/label-nhap-ghep.mjs`
  severity: low
  Đề xuất: known-limits

- **label-nhap-ghep tự gọi Gateway, bỏ qua cờ định tuyến bắt buộc của tuyChonGui (deepseek chỉ đi baseten) và không kiểm cấu hình (r1)**
  Người dùng thấy gì: Nếu sau này đổi model mặc định sang DeepSeek, chữ bài gốc có thể đi tới nhà cung cấp không bị ghim như lệnh đọc gộp. Cấu hình sai còn cho thông báo lỗi khó hiểu.
  Căn cứ: Mặc định hiện là Haiku nên chưa gửi sai chỗ nào, và chỉ phát sinh khi có người đổi cấu hình; sửa sau rẻ, không mất dữ liệu.
  file: `pipeline/label-nhap-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **launch.json: định dạng lại cả tệp và thêm cấu hình riêng của một tính năng, trùng cổng 3460 (r1)**
  Người dùng thấy gì: Tệp cấu hình chạy thử dùng chung bị dàn lại toàn bộ, dễ gây xung đột khi gộp với nhánh khác. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ ảnh hưởng người làm việc trong kho, xung đột gộp giải được bằng tay trong vài phút, không mất dữ liệu.
  file: `.claude/launch.json`
  severity: low
  Đề xuất: wont-fix

- **Model trả lời không parse được vẫn bị ghi thành nháp rỗng, đếm vào «ghi» chứ không vào «loi», và các lần chạy sau bỏ qua bài đó (r1)**
  Người dùng thấy gì: Khi model trả lời hỏng, bài vẫn được ghi là đã có nháp nhưng nháp trống, không ai được báo. Người duyệt thấy bài như thể tác tử không tìm thấy gì.
  Căn cứ: Bài bị bỏ lỡ nháp âm thầm và các lần chạy sau không thử lại, nhưng người duyệt vẫn tự gắn được và có thể chạy làm lại, nên không mất nhãn.
  file: `pipeline/label-nhap-ghep.mjs`
  severity: high
  Đề xuất: new-contract

- **mucGan: mã căn của một toà có trong danh bạ nhưng trục chưa có trong danh bạ bị xếp «khong» thay vì «toa» (r1)**
  Người dùng thấy gì: Bài nêu rõ mã căn của một toà đã biết có thể bị xếp vào nhóm không gắn, làm lệch số bài ở các nhóm dùng để đo độ chính xác gắn toà.
  Căn cứ: Làm lệch cơ cấu mẫu nhãn ở khu có ít trục, nhưng chỉ ảnh hưởng cách chọn mẫu, không mất dữ liệu, chọn lại mẫu được.
  file: `pipeline/lib/tang-ghep.mjs`
  severity: medium
  Đề xuất: new-contract

- **mucGan: toà không có bí danh 'ten' biến regex trục thành alternation rỗng, khớp mọi số (r1)**
  Người dùng thấy gì: Một bài chỉ có con số như giá có thể bị xếp nhầm là đã nêu trục của toà, và bài nêu rõ toà có thể bị xếp sai nhóm.
  Căn cứ: Xảy ra chỉ với toà thiếu tên trong danh bạ, hậu quả là xếp sai nhóm mẫu chứ không mất dữ liệu, chọn lại mẫu được.
  file: `pipeline/lib/tang-ghep.mjs`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
