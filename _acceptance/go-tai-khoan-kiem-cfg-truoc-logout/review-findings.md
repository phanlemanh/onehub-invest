# Review findings: go-tai-khoan-kiem-cfg-truoc-logout

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 (tuyên quét LỚP nhưng tập toàn phần không viết trước): phép «ma trận toàn phần» của GC-AC-1 tự quy chiếu**
  Người dùng thấy gì: Nếu sau này bộ canh cấu hình Zalo có thêm một loại vi phạm mới, phép đo hiện tại sẽ không tự báo thiếu. Với 5 loại vi phạm đã biết thì tính năng vẫn được bảo vệ đầy đủ.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi có loại vi phạm mới, lúc đó người sửa bộ canh sẽ phải cập nhật phép đo; không mất dữ liệu và ghi vào giới hạn đã biết là đủ.
  file: `app/tests/go-tai-khoan-kiem-cfg.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
