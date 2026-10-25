# Review findings: lockdown-cloud-theo-facts (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thêm trạng thái mới «Chỉ kiểm ở máy thu» cho Khoá an toàn mà không cập nhật CONTEXT.md (r1)**
  Người dùng thấy gì: Màn hình Khoá an toàn hiện đúng chữ và đúng màu, nhưng bảng thuật ngữ chung vẫn chỉ nêu ba trạng thái, chưa nêu trạng thái «Chỉ kiểm ở máy thu». Người đọc tài liệu có thể thấy chữ trên màn hình mà không tra được nghĩa.
  Căn cứ: Chỉ là chỗ thiếu trong tài liệu thuật ngữ, không làm sai số liệu hay trạng thái an toàn nào trên màn hình, và bổ sung sau rất rẻ.
  file: `app/src/components/ops/collections/lockdown-grid.tsx`
  severity: medium
  Đề xuất: known-limits

- **Danh sách 8 lớp khoá an toàn bị lặp ở bên ghi và bên đọc; ánh xạ cổng dựa vào chuỗi mô tả, không test nào bắt lệch (r1)**
  Người dùng thấy gì: Hiện hai nơi cùng giữ danh sách 8 lớp khoá an toàn và đang khớp nhau. Nếu sau này ai sửa chữ ở một nơi mà quên nơi kia, màn hình có thể hiện chữ khác nhau tuỳ lúc có hay không có số liệu từ máy thu.
  Căn cứ: Hôm nay không sai gì với người dùng, chỉ có nguy cơ lệch chữ khi sửa về sau và nhìn thấy ngay trên màn hình, tự sửa được bằng một lần chỉnh.
  file: `app/src/lib/ops-queries.ts`
  severity: low
  Đề xuất: known-limits

- **Tuyên ma trận viết trước, số hàng ghim nhưng ma trận rút từ chính mã đang kiểm (hình dạng 5, kèm 2) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Việc kiểm tra tự động chưa tự đếm độc lập là có đúng 8 lớp khoá an toàn. Nếu một lớp bị mất, bài kiểm tra vẫn có thể báo xanh dù màn hình thiếu hàng.
  Căn cứ: Màn hình hiện tại đúng 8 hàng, người dùng chưa gặp lỗi nào; chỉ là lưới an toàn của bài kiểm tra lỏng hơn lời hứa, và siết lại rất rẻ khi cần.
  file: `app/tests/lockdown-cloud-theo-facts.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Biến đếm ô ma trận AC-5 luôn đúng, và eval trích một ca 'ca chéo' không có trong file test (hình dạng 5) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra có một phép đếm luôn đúng và tài liệu mô tả sai số ô cũng như tên một ca. Cách đọc kết quả hơi lệch, nhưng không ảnh hưởng gì đến cái người dùng thấy trên màn hình.
  Căn cứ: Hậu quả chỉ là tài liệu và tên kiểm tra không khớp, không mất dữ liệu hay sai trạng thái an toàn, còn công sửa không đáng so với lợi ích.
  file: `app/tests/lockdown-cloud-theo-facts.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

