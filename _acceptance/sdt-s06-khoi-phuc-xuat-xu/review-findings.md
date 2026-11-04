# Review findings: sdt-s06-khoi-phuc-xuat-xu

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): log CHUA-AP-068 của KP-AC-7 không gắn với lượt đang đo**
  Người dùng thấy gì: Dòng cảnh báo báo rằng chưa áp lại bản sửa số điện thoại có thể mất đi mà bài kiểm tra vẫn báo xanh. Người dùng không thấy khác biệt ngay, chỉ là tín hiệu cảnh báo kém được bảo vệ hơn.
  Căn cứ: Hậu quả nhẹ: không làm mất hay lộ dữ liệu, chỉ làm một lưới an toàn kiểm thử lỏng hơn, và hai lượt đi cùng một nhánh nên khả năng sai thật thấp; sửa sau cũng rẻ.
  file: `pipeline/scripts/gan-sdt-s06.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
