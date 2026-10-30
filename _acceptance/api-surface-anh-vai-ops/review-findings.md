# Review findings: api-surface-anh-vai-ops (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính đứng một mình): ô 404 của ASO-AC-3b vẫn xanh khi bỏ cổng canAccessOps của route**
  Người dùng thấy gì: Ảnh snapshot vẫn bị chặn đúng với khách, người dùng thường và người xem; người dùng không thấy khác biệt nào. Điểm yếu chỉ nằm ở bộ kiểm: nếu sau này ai đó lỡ gỡ lớp chặn ngoài cùng của đường dẫn ảnh, bài kiểm chạy thử vẫn báo xanh, và chỉ bài kiểm đọc mã mới bắt được.
  Căn cứ: Hậu quả nhẹ vì lớp chặn bên trong vẫn giữ 404 cho ba vai này và bài kiểm đọc mã đã canh lớp ngoài; không lộ hay mất dữ liệu, và bổ sung kiểm sau này không tốn nhiều.
  file: `app/tests/api-surface-anh-vai-ops.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): hàng «bearer» trong ma trận ASO-AC-2 thực chất là hàng «khách», tiêu đề Authorization không bao giờ được đọc**
  Người dùng thấy gì: Người gọi chỉ mang khoá API mà không đăng nhập vẫn không xem được ảnh snapshot, đúng như thiết kế. Nhưng bộ kiểm chưa thật sự thử trường hợp có khoá này, nên nếu sau này ai thêm đường cho khoá xem ảnh, bài kiểm ma trận sẽ không báo.
  Căn cứ: Hiện không có lỗ hổng nào đang mở và hành vi đúng; rủi ro chỉ xảy ra khi có thay đổi tương lai, và một bài kiểm bổ sung nhỏ có thể làm sau mà không ảnh hưởng người dùng.
  file: `app/tests/api-surface-anh-vai-ops.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
