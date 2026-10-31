# Review findings: khu-vuc-vung-moi-s06 (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 — assertion âm tính một mình: E2 chỉ kiểm trang /ops KHÔNG còn dấu dự phòng, không có đối chứng dương trên đầu ra là hàng da-nang hiện ra tên Việt**
  Người dùng thấy gì: Phép kiểm hiện chỉ xác nhận trang tổng quan không còn chữ «(chưa có tên Việt)». Nó chưa xác nhận hàng Đà Nẵng thật sự hiện ra với tên tiếng Việt, nên nếu hàng này biến mất khỏi trang thì kiểm tra vẫn báo xanh.
  Căn cứ: Hậu quả nhẹ: tên thị trường vẫn được tra đúng ở phần kiểm riêng và không mất dữ liệu. Chỉ là lưới an toàn của trang tổng quan lỏng hơn, và có thể siết sau với chi phí thấp.
  file: `_acceptance/khu-vuc-vung-moi-s06/rang/on12-tien-de.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
