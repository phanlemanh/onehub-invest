## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích đầu tệp vẫn nói CI chạy tệp, nhưng rào mới bỏ qua cả tệp khi CI không đặt DATABASE_URL**
  Người dùng thấy gì: Một dòng chú thích trong mã nói bài kiểm tra này chạy cả trên hệ thống kiểm tự động, nhưng thực tế nó chỉ chạy ở lượt chấm. Người đọc có thể tưởng có thêm một lớp bảo vệ mà thật ra không có. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ: chỉ gây hiểu nhầm cho người đọc mã, không mất hay lộ dữ liệu, và sửa lại một dòng chú thích sau này rất rẻ.
  file: `pipeline/scripts/assert-rut-thay.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: AC-2 hứa quét theo từng nguồn (ba S03, một S06, một S05) nhưng cổng của probe chỉ đếm tổng số lần gọi**
  Người dùng thấy gì: Phép kiểm so sánh kết quả cũ và mới có thể báo đạt dù một nguồn dữ liệu (ví dụ tin từ Facebook) không được đo lần nào, chỉ cần các nguồn khác gọi đủ số lần. Người đọc kết quả in ra vẫn có thể phát hiện, nên rủi ro thấp.
  Căn cứ: Hậu quả nhẹ vì không ảnh hưởng dữ liệu người dùng, chỉ làm lưới kiểm hơi lỏng cho một nguồn có rất ít dữ liệu, và người chấm đọc kết quả in ra vẫn bắt được.
  file: `_acceptance/slt-dc-cham-va-giu-khoa-33033/probes/tuong-duong-ba-luot.mjs`
  severity: low
  Đề xuất: known-limits

- **Khai E4, E5, E6 (thước giờ, không gọi model) vào feature_loop.model_evals là dùng sai nghĩa khoá của kit, mà hồ sơ không ghi giới hạn này (r2 · tệp đã đổi)**
  Người dùng thấy gì: Lượt chấm sẽ báo thừa ba lần chạy dùng mô hình thật, trong khi các thước đo thời gian này không gọi mô hình nào. Thước giờ cũng không được chạy lại tự động khi đỏ vì máy đang tải.
  Căn cứ: Hậu quả nhẹ: chỉ lệch con số tổng kết và mất một lần thử lại, không mất hay lộ dữ liệu; chạy lại lượt chấm là xử lý được, còn sửa gốc cần kit ra khoá mới nên ghi giới hạn là rẻ nhất.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **E4–E6 (thước giờ, không gọi model) được khai vào feature_loop.model_evals: lượt chấm sẽ đếm sai «eval model thật: gọi n» và tắt lần chạy lại cho thước giờ (r2 · tệp đã đổi)**
  Người dùng thấy gì: Thước giờ đỏ vì máy tải sẽ không được chạy lại tự động, và tổng kết đếm thừa ba lần gọi mô hình thật. Người chấm cần chạy lại bằng tay khi gặp đỏ do tải.
  Căn cứ: Hậu quả nhẹ và tự gỡ được bằng cách chạy lại lượt chấm; không ảnh hưởng dữ liệu người dùng, và chỉ sửa triệt để khi kit có khoá mới nên ghi giới hạn đã biết là hợp lý.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **assert-rut-thay.test.mjs không chặn DB máy thu mà vẫn chạy ANALYZE field_assertions, và ROLLBACK không lùi được thay đổi do ANALYZE gây ra (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu có người chạy riêng bài kiểm này ngoài đường chạy chuẩn, nó có thể làm lệch số liệu thống kê trên cơ sở dữ liệu thật của máy thu. Hệ quả là các truy vấn sau đó có thể chọn cách chạy chậm hơn, nhưng dữ liệu không bị mất.
  Căn cứ: Chỉ xảy ra khi chạy sai cách ngoài đường chuẩn, không mất dữ liệu và số liệu thống kê tự được làm mới lại sau đó, nên hậu quả nhẹ và sửa sau cũng rẻ.
  file: `pipeline/scripts/assert-rut-thay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: `guard === 0` không có đối chứng dương, bộ soát hỏng (luôn trả []) vẫn xanh (r1)**
  Người dùng thấy gì: Bài kiểm này có thể vẫn báo xanh dù bộ kiểm tra chống lộ tên người bán bị hỏng và không còn bắt được gì. Người dùng chưa gặp lỗi gì, nhưng một lỗi lộ thông tin sau này có thể không bị phát hiện sớm.
  Căn cứ: Không ảnh hưởng người dùng ngay và không mất dữ liệu, chỉ làm lưới an toàn của bài kiểm yếu đi, thuộc nhánh khác và có thể bổ sung sau với chi phí thấp.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
