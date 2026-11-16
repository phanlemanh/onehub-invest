# Review findings: ma-can-s06-sach (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lệnh dọn S06 vẫn viết cứng tên trường assertion_field, bản vá VL-AC-5 chưa xong (r1)**
  Người dùng thấy gì: Lệnh dọn vẫn chạy đúng như hiện nay. Chỉ khi sau này tên trường bị đổi thì lệnh dọn có thể lặng lẽ bỏ sót vài giá trị rác hoặc đếm sai số tin có toà.
  Căn cứ: Hiện chưa có sai lệch nào đến tay người dùng, chỉ là rủi ro khi đổi tên về sau; sửa sau rẻ và không mất dữ liệu.
  file: `pipeline/scripts/ma-can-s06-sach.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — kiểm «chuỗi có mặt» trong khi lời hứa là quan hệ giữa các giá trị (bảng pty thật) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bảng nghĩa loại dự án đã đăng hiện đúng số, nhưng nếu ai đó sửa tay và làm sai số thì bài kiểm tra vẫn báo xanh. Người đọc bảng có thể tin vào số sai mà không được cảnh báo.
  Căn cứ: Hậu quả chỉ xảy ra nếu bảng bị sửa tay về sau, và người đọc tự đối chiếu lại được bằng cách chạy lệnh sinh bảng; sửa phép kiểm sau không tốn kém.
  file: `pipeline/scripts/ma-can-s06-sach.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 — mặc định kết nối hardcode vào DB lượt của tác giả (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu chạy bài kiểm tra mà không chỉ rõ cơ sở dữ liệu, nó có thể chạy trên dữ liệu thử còn sót của người viết thay vì dữ liệu đang cần kiểm, nên kết quả có thể xanh hoặc đỏ nhầm. Người dùng cuối không thấy ảnh hưởng gì.
  Căn cứ: Chỉ ảnh hưởng người chạy kiểm thử trên máy dev, không đụng dữ liệu hay giao diện người dùng, và tự khỏi khi chạy theo đường chuẩn của dự án.
  file: `pipeline/scripts/ma-can-s06-sach.test.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

