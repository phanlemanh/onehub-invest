## Trong hợp đồng

- **Đo CHỈ DẪN thay vì ĐẦU RA: «lưới máy chủ» chỉ SHOW giá trị trên giao dịch test tự mở, không đo giao dịch của ca 7/9 và ca 10**
  AC: AC-4
  file: `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs:197`
  severity: medium
  source: measurement
  detail: AC-4 (contract slt-dc, dòng cuối) hứa «`SHOW transaction_timeout` trong giao dịch của ca 7/9 và ca 10 bằng đúng trần + 30 s». Ca ở dòng 197-206 tự gọi `moGiaoDichGiuKhoa(pg, DB_URL, { tranGiay: tran })` với `tran` lấy từ hằng TRAN_79/TRAN_10, rồi `assert.equal(v, `${tran + 30}s`)`. Nó không đọc giao dịch mà ca 7/9 (dòng 343) và ca 10 (dòng 359) thật sự mở. Bỏ `tranGiay: TRAN_79 / 1000` khỏi lời gọi withTx của ca 7/9 thì ca này vẫn xanh. Ngoài ra nó chỉ đo giá trị cấu hình (chỉ dẫn gửi máy chủ), không đo đầu ra mà lưới hứa: máy chủ cắt giao dịch và nhả 33033 khi tiến trình test chết hẳn. Không có ca nào cho tiến trình chết rồi chờ quá trần + 30 s để xem khoá có rảnh không.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **assert-rut-thay.test.mjs không chặn DB máy thu mà vẫn chạy ANALYZE field_assertions, và ROLLBACK không lùi được thay đổi do ANALYZE gây ra**
  Người dùng thấy gì: Nếu có người chạy riêng bài kiểm này ngoài đường chạy chuẩn, nó có thể làm lệch số liệu thống kê trên cơ sở dữ liệu thật của máy thu. Hệ quả là các truy vấn sau đó có thể chọn cách chạy chậm hơn, nhưng dữ liệu không bị mất.
  Căn cứ: Chỉ xảy ra khi chạy sai cách ngoài đường chuẩn, không mất dữ liệu và số liệu thống kê tự được làm mới lại sau đó, nên hậu quả nhẹ và sửa sau cũng rẻ.
  file: `pipeline/scripts/assert-rut-thay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: `guard === 0` không có đối chứng dương, bộ soát hỏng (luôn trả []) vẫn xanh**
  Người dùng thấy gì: Bài kiểm này có thể vẫn báo xanh dù bộ kiểm tra chống lộ tên người bán bị hỏng và không còn bắt được gì. Người dùng chưa gặp lỗi gì, nhưng một lỗi lộ thông tin sau này có thể không bị phát hiện sớm.
  Căn cứ: Không ảnh hưởng người dùng ngay và không mất dữ liệu, chỉ làm lưới an toàn của bài kiểm yếu đi, thuộc nhánh khác và có thể bổ sung sau với chi phí thấp.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
