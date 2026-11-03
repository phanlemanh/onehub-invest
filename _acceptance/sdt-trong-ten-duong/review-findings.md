# Review findings: sdt-trong-ten-duong (round 4)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Băm mã của thước bỏ sót gan-sdt-s06.mjs dù transform chạy tệp này, và tính cả bản sao đột biến trong lib/**
  Người dùng thấy gì: Nếu ai đó sửa một tệp phụ của bước nhập tin mà không đổi gì khác, lượt chấm vẫn nhận bản chạy cũ là hợp lệ. Việc này chỉ làm lượt kiểm kém chặt, không ảnh hưởng dữ liệu người dùng.
  Căn cứ: Chỉ ảnh hưởng độ chặt của khâu nghiệm thu nội bộ, không làm lộ hay mất dữ liệu, và có thể vá sau với giá rẻ.
  file: `pipeline/scripts/do-sdt-trong-duong.mjs`
  severity: low
  Đề xuất: known-limits

- **Chạy lại --chay trên cùng bản chép chạy trọn gần 2 giờ rồi mới chết ở CREATE TABLE**
  Người dùng thấy gì: Nếu chạy lại phép đo trên cùng bản chép dữ liệu, máy sẽ tốn gần 2 giờ rồi báo lỗi vào phút chót. Người vận hành phải dựng lại bản chép rồi chạy lại.
  Căn cứ: Chỉ tốn thời gian của người vận hành, không làm sai hay lộ dữ liệu thật, và tự gỡ được bằng cách dựng lại bản chép.
  file: `pipeline/scripts/do-sdt-trong-duong.mjs`
  severity: low
  Đề xuất: known-limits

- **Thước đỏ giả «dòng in chứa dãy số» khi 12 ký tự đầu của băm mã có 9 chữ số thập phân liền**
  Người dùng thấy gì: Thỉnh thoảng phép đo có thể báo lỗi nhầm dù dữ liệu sạch, và phải chạy lại gần 2 giờ sau khi đổi mã. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Xác suất thấp, chỉ gây đỏ giả cho khâu nghiệm thu và không để lọt số điện thoại nào, nên chấp nhận được.
  file: `pipeline/scripts/do-sdt-trong-duong.mjs`
  severity: low
  Đề xuất: known-limits

- **Đứt giữa rút phát biểu và phân xử thì tin ngoài lô giữ số điện thoại, lượt sau không tự sửa**
  Người dùng thấy gì: Nếu máy sập đúng giữa hai bước và có tin đã rời nguồn, số điện thoại trong tên đường của tin đó có thể còn lại và lên cloud. Hiện chưa có tin nào rơi vào trường hợp này.
  Căn cứ: Cần trùng hợp hiếm (sập đúng lúc và tin đã rời nguồn), hiện 0 dòng bị dính; nhưng nếu xảy ra thì số có thể lên cloud mà không báo, nên cần ghi rõ là hạn chế đã biết.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: đối chứng dương của hoanTacDuong đếm toàn DB, không gắn với ô fixture**
  Người dùng thấy gì: Phép thử chứng minh việc hoàn tác có thể xanh dù không chạm đúng ô đang đo. Chức năng hoàn tác cho người dùng không bị đổi.
  Căn cứ: Chỉ làm bài thử yếu hơn dự định, không ảnh hưởng dữ liệu người dùng, và có thể bổ sung phép kiểm sau.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «hoàn tác không trả số» ở ô log cũ không có đối chứng hoàn tác đã chạm ô**
  Người dùng thấy gì: Một ca thử về nhật ký cũ sẽ xanh dù bước hoàn tác không làm gì với ô đó. Dữ liệu người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là chỗ yếu của bài thử nội bộ, không lộ hay mất dữ liệu, sửa sau rẻ.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: tin «vừa về NULL» của AC-5 chưa từng có giá trị**
  Người dùng thấy gì: Bài thử đồng bộ không chứng minh được trường hợp tin từng có số rồi mới được xoá, chỉ chứng minh tin đang trống. Người dùng không thấy khác biệt.
  Căn cứ: Chỉ làm bài thử bao phủ hẹp hơn mô tả, không ảnh hưởng dữ liệu thật, và có thể bổ sung sau.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: plan và columns của buildSwapSql không rút từ bên sinh thật**
  Người dùng thấy gì: Nếu sau này đường đồng bộ thật đổi cách chọn cột, bài thử vẫn xanh và không báo trước. Hiện không ảnh hưởng người dùng.
  Căn cứ: Rủi ro chỉ xuất hiện khi mã đồng bộ đổi về sau, hiện dữ liệu vẫn đúng, và có thể bắt bằng bài thử khác.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — Assert «chuỗi có mặt» trong khi lời hứa là quan hệ: «upsert ghi đè hai cột» chỉ là includes trên SQL dựng từ danh sách cột vừa viết tay**
  Người dùng thấy gì: Bài thử chưa chứng minh giá trị trống thật sự đè lên số cũ trên cloud, chỉ chứng minh câu lệnh có nhắc hai cột. Chưa có dấu hiệu lỗi thực tế.
  Căn cứ: Chỉ làm bài thử yếu hơn lời hứa, chưa có dữ liệu sai, và có thể kiểm bằng lượt đếm trên cloud sau job đêm mà hợp đồng đã ghi.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
