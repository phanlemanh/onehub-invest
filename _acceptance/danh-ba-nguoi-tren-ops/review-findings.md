# Review findings: danh-ba-nguoi-tren-ops (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(Round này không có mục mới. Sáu mục carried từ round trước sẽ được máy chèn vào đây kèm nhãn round.)

- **Vai Người xem vẫn dò được giá trị bí danh qua ô tìm ?q= (r1)**
  Người dùng thấy gì: Người dùng vai Người xem không đọc được tên hay tài khoản, nhưng gõ dần vào ô tìm kiếm thì đoán ra được người nào có tên hay tài khoản chứa chuỗi đó. Lớp che dữ liệu vì vậy có thể bị vượt qua.
  Căn cứ: Hậu quả vừa: lộ gián tiếp thông tin đã che cho vai thấp nhất, không tự gỡ được từ phía người dùng, nhưng sửa nhỏ và rẻ nếu làm thành việc riêng.
  file: `app/src/components/ops/people/people-content.tsx`
  severity: medium
  Đề xuất: new-contract

- **Vùng dữ liệu ở trang một người có trạng thái trống không kèm hành động (trái luật ReUI 5) (r1)**
  Người dùng thấy gì: Ở trang một người, khi chưa có bí danh hoặc chưa có tin, màn hình chỉ báo trống mà không có nút đi tiếp. Câu «Chưa có bí danh còn dùng» còn có thể gây hiểu nhầm.
  Căn cứ: Hậu quả nhẹ: chỉ là chữ và lối đi tiếp chưa tiện, không mất hay lộ dữ liệu, người dùng tự quay lại danh sách được.
  file: `app/src/components/ops/people/person-view.tsx`
  severity: low
  Đề xuất: known-limits

- **Vai Người xem dò được giá trị bí danh bị che qua ?q= (lọc chạy trên giá trị thô, không xét quyền) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Người dùng vai Người xem có thể gõ từng ký tự vào ô tìm để biết ai có tên hay tài khoản chứa chuỗi đó, kể cả tên nguồn thật nằm trong tên người bán. Dữ liệu đã che có thể bị dựng lại dần.
  Căn cứ: Hậu quả vừa tới nặng hơn vì có thể lộ tên nguồn thật, người dùng không tự gỡ được, nhưng cách chặn đơn giản nên đáng làm thành việc riêng ngay.
  file: `app/src/lib/ops/people.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3: chỉ ĐẾM dấu «Đã nghỉ», không gắn nó với bí danh đã nghỉ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm chưa chắc bắt được trường hợp dấu «Đã nghỉ» gắn nhầm sang bí danh còn dùng. Nếu có lỗi như vậy, người vận hành sẽ thấy sai trạng thái bí danh mà bài kiểm vẫn báo đạt.
  Căn cứ: Hậu quả nhẹ: chưa có lỗi thật, chỉ là lưới an toàn thưa, không ảnh hưởng dữ liệu và bổ sung sau rất rẻ.
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: chỉ đếm nhãn «Có thể là môi giới» trong danh sách, không gắn nhãn với hàng của P1 (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm chưa chắc phát hiện nhãn «Có thể là môi giới» bị gắn nhầm sang người khác trong danh sách. Nếu lệch, người vận hành có thể hiểu sai về một người.
  Căn cứ: Hậu quả nhẹ: chưa có lỗi thật, nhãn chỉ là suy luận hiển thị, và gia cố bài kiểm sau rất rẻ.
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: «0 chỗ lọt tên nguồn» có thể đứng một mình, vì đối chứng dương bị bỏ qua khi khop rỗng (r1)**
  Người dùng thấy gì: Khi dữ liệu máy thu không có bí danh nào chứa tên nguồn, bài kiểm báo không lọt tên nguồn nhưng không chứng minh được bộ quét có bắt được nếu có lọt. Có thể tạo cảm giác an toàn giả.
  Căn cứ: Hậu quả vừa về độ tin cậy của kiểm tra tên nguồn thật, nhưng chưa có lỗi lộ thật và việc thêm đối chứng sau là rẻ.
  file: `app/tests/danh-ba-nguoi-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
