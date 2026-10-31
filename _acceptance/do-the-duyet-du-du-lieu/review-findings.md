# Review findings: do-the-duyet-du-du-lieu (round 3)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **on12.sh: regex «ít nhất 3 dòng» loại nhầm mọi số từ 10 đến 29**
  Người dùng thấy gì: Khi có nhiều nguồn chờ duyệt hơn hiện nay, phép thử tự động có thể báo lỗi dù số liệu trên trang chất lượng ghi đúng. Người dùng không thấy số sai, chỉ có thể gặp một cảnh báo đỏ nhầm lúc nghiệm thu.
  Căn cứ: Hậu quả nhẹ: chỉ gây báo đỏ nhầm ở khâu kiểm, không làm mất hay sai dữ liệu, và chạy lại hay chỉnh phép thử là hết.
  file: `_acceptance/do-the-duyet-du-du-lieu/probes/on12.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc. Đầu vào của test nhãn AC-5 không lấy từ bên ghi tinhSo**
  Người dùng thấy gì: Nếu sau này cách ghi số độ đầy đổi thứ tự, trang chất lượng có thể hiện chi tiết thô thay vì nhãn tiếng Việt mà kiểm tự động vẫn xanh. Hiện nay trang vẫn hiện đúng.
  Căn cứ: Chưa gây sai lệch nào hôm nay; nếu xảy ra thì chỉ làm trang nội bộ hiện chữ thô, không mất dữ liệu, và sẽ lộ ra khi xem trang.
  file: `app/tests/dq-the-duyet-label.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng đỏ 'FAIL DOI MA THOAT' chỉ khớp thông điệp do probe tự đặt, không ghim nguyên nhân**
  Người dùng thấy gì: Phép thử kiểm rằng lượt ghi có dòng không đạt vẫn thoát êm có thể xanh vì một lỗi khác. Người dùng cuối không bị ảnh hưởng, chỉ độ tin cậy của khâu nghiệm thu giảm nhẹ.
  Căn cứ: Không ảnh hưởng dữ liệu hay trang người dùng; lệnh thật vẫn được thử ở các phép đo khác, và củng cố phép thử sau này rẻ.
  file: `_acceptance/do-the-duyet-du-du-lieu/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **E3 quét định danh tin đổi từ khớp chuỗi con sang khớp nguyên token nên cột entity (không có regex chặn) bị nới (r2 · tệp đã đổi)**
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

- **Hình dạng 2 — «luật ảnh khớp khuôn của bộ đọc app» được kiểm bằng ca viết tay, không round-trip qua bộ đọc app (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu app sau này đổi cách nhận biết ảnh của thẻ duyệt, số thẻ thiếu ảnh mà bản đo đêm báo có thể lệch khỏi cái người duyệt thực sự nhìn thấy mà test không kêu.
  Căn cứ: Bản đối chiếu với app thật vẫn chạy trên dữ liệu hằng ngày nên sai lệch sẽ lộ ra khi đo; không mất dữ liệu và người dùng không bị ảnh hưởng trực tiếp.
  file: `pipeline/do-the-duyet.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
