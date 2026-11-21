# Review findings: lat-khai-o-can-gan (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (assertion âm tính một mình): lát có khai không điền nháp, không hiện badge nháp, nhưng không có đối chứng dương trên biểu mẫu**
  Người dùng thấy gì: Phép kiểm hiện chỉ xác nhận lát có khai ô không hiện nháp máy. Nó chưa chứng minh tính năng nháp vẫn chạy ở các lát không khai, nên nếu nháp hỏng ở mọi lát thì phép kiểm này không báo.
  Căn cứ: Người gắn nhãn hiện không bị ảnh hưởng gì, vì màn đang chạy đúng. Đây chỉ là chỗ phép kiểm chưa bắt được một lỗi có thể xảy ra về sau, và bổ sung phép kiểm sau này cũng rẻ.
  file: `app/tests/labels-lat-khai-o-can-gan.test.tsx`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
