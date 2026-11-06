# Review findings: don-vi-gia-theo-loai-tin (round 1)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn UI mới «mã thẻ» chưa có thuật ngữ trong CONTEXT.md, và cùng chữ đó đã mang nghĩa khác trong code**
  Người dùng thấy gì: Chữ «mã thẻ» hiện trên màn nhưng chưa có định nghĩa trong từ vựng chung, trong khi nơi khác chữ này chỉ một loại mã khác. Người đọc tài liệu có thể hiểu nhầm, còn màn hình vẫn dùng bình thường.
  Căn cứ: Chỉ ảnh hưởng cách gọi tên trong tài liệu, không làm mất hay sai dữ liệu, và bổ sung định nghĩa sau rất rẻ.
  file: `app/src/components/ops/labels/ma-the.tsx`
  severity: low
  Đề xuất: known-limits

- **docThe nay trả giờ đăng của tin chữ, nhưng lượt hai vẫn lấy giờ của dòng mẫu: cùng một thẻ ghép hiện hai giờ đăng khác nhau**
  Người dùng thấy gì: Với thẻ ghép nhiều bài, lượt một và lượt hai có thể hiện hai giờ đăng khác nhau. Có trường hợp thẻ không hiện giờ đăng.
  Căn cứ: Chỉ là chữ thông tin hiển thị lệch, không mất hay ghi sai dữ liệu nhãn, và người gắn nhãn vẫn làm việc được.
  file: `app/src/lib/labels-cum.ts`
  severity: low
  Đề xuất: known-limits

- **Lượt một và lượt hai hiện giờ đăng khác nhau cho cùng một thẻ ghép**
  Người dùng thấy gì: Cùng một thẻ ghép có thể hiện giờ đăng khác nhau ở lượt một và lượt hai, và đôi khi mất dòng giờ đăng mà không báo.
  Căn cứ: Nhẹ: chỉ sai lệch hiển thị, không mất dữ liệu, mở lại thẻ là thấy, sửa sau không đắt.
  file: `app/src/lib/labels-cum.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm âm tính đứng một mình: HTML khi bảng nguồn rỗng/vắng chỉ có doesNotMatch /Cô Mai/, không có đối chứng dương trên cùng HTML**
  Người dùng thấy gì: Một bài kiểm tự động của tính năng người đăng chưa đủ chặt, nên có thể bỏ sót khi phần hiện người đăng bị hỏng. Người dùng không thấy gì khác đi.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, dữ liệu đã được kiểm bằng đường khác, chi phí sửa vượt lợi ích.
  file: `app/tests/labels-nguoi-dang.test.tsx`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 3/4 lỗi rơi vào file không bộ đo nào phủ (app/src/lib/labels-cum.ts, app/tests/labels-nguoi-dang.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
