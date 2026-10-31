# Review findings: do-the-duyet-du-du-lieu (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E3 quét định danh tin đổi từ khớp chuỗi con sang khớp nguyên token nên cột entity (không có regex chặn) bị nới**
  Người dùng thấy gì: Phép kiểm tự động chống lộ mã tin lên cloud hơi lỏng hơn trước ở một cột phụ, nên nếu sau này mã tin lọt vào cột đó kèm dấu câu thì phép kiểm có thể không báo. Hiện chưa có dữ liệu nào bị lộ và người dùng không thấy khác biệt gì.
  Căn cứ: Hậu quả hiện tại là không có: chưa có mã tin nào lọt ra ngoài, chỉ là lưới kiểm tra lỏng hơn ở một chỗ, nên ghi nhận là hạn chế đã biết và siết lại khi có dịp là đủ.
  file: `_acceptance/do-the-duyet-du-du-lieu/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — chỉ assert «có nhãn» (known: true) và regex `.*` trong khi nhãn độ đầy là QUAN HỆ thứ tự giữa khoá và nhãn (r1)**
  Người dùng thấy gì: Nếu ai đó vô tình đổi chỗ hai nhãn trong dòng độ đầy dữ liệu, trang chất lượng của vận hành sẽ ghi sai tên cho một con số mà không có cảnh báo nào. Số liệu vẫn đúng, chỉ chú thích bị lệch.
  Căn cứ: Hậu quả nhẹ, chỉ ảnh hưởng chú thích trên trang nội bộ, không mất hay lộ dữ liệu, và chỉ xảy ra khi có người sửa nhãn sau này; có thể sửa sau với chi phí thấp.
  file: `app/tests/dq-the-duyet-label.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — «luật ảnh khớp khuôn của bộ đọc app» được kiểm bằng ca viết tay, không round-trip qua bộ đọc app (r1)**
  Người dùng thấy gì: Nếu app sau này đổi cách nhận biết ảnh của thẻ duyệt, số thẻ thiếu ảnh mà bản đo đêm báo có thể lệch khỏi cái người duyệt thực sự nhìn thấy mà test không kêu.
  Căn cứ: Bản đối chiếu với app thật vẫn chạy trên dữ liệu hằng ngày nên sai lệch sẽ lộ ra khi đo; không mất dữ liệu và người dùng không bị ảnh hưởng trực tiếp.
  file: `pipeline/do-the-duyet.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
