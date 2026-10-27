# Review findings: df0-chang-theo-ngay-diem-0 (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — fixture FlowDay viết tay đúng khuôn bên đọc, không round-trip qua writer getDataFlow**
  Người dùng thấy gì: Các bài kiểm tự động không thử trường hợp dữ liệu ngày từ máy chủ có dạng khác với dạng biểu đồ chờ. Nếu có lệch, biểu đồ «Chặng theo ngày» sẽ hiện toàn số 0 và báo chưa có số, dù nguồn vẫn đang thu.
  Căn cứ: Rủi ro chỉ xảy ra nếu cách ghi ngày ở máy chủ đổi sau này, người vận hành thấy ngay biểu đồ trống và lần kiểm bằng mắt trên trang thật vẫn bắt được, không mất dữ liệu nào và sửa sau rẻ.
  file: `app/tests/df0-chang-theo-ngay.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — chiều đỏ CN-AC-3 chỉ có notEqual, không ghim giá trị mà eval hứa**
  Người dùng thấy gì: Phép kiểm chứng minh «ngày đổi đúng nửa đêm giờ VN» có một chiều đối chứng yếu hơn mô tả. Nếu sau này ai đó đổi nhầm về ngày UTC, các phép kiểm chính vẫn bắt được, chỉ là bằng chứng đối chứng kém chặt hơn.
  Căn cứ: Người dùng không bị ảnh hưởng gì, hành vi đúng đã được các phép kiểm chính khoá lại, và nếu muốn siết thì sửa chỉ là một dòng kiểm thử.
  file: `app/tests/df0-chang-theo-ngay.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
