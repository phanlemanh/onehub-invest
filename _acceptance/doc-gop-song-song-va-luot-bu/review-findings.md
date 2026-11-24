## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đầu tệp doc-gop-hang-ngay.sh chưa ghi mã thoát 6 (dang-co-luot-khac), và tệp cũng không xử lý mã này**
  Người dùng thấy gì: Khi hai lượt đọc tin chạy chồng nhau, lượt sau dừng đúng như thiết kế. Nhưng tài liệu trong tệp chưa ghi mã dừng này, và bước hôm kia vẫn thử chạy rồi cũng dừng. Người vận hành có thể thấy một dòng báo lỗi thừa.
  Căn cứ: Hậu quả nhẹ: chỉ thêm một lần thử thừa và thiếu một dòng chú thích, không mất hay lộ dữ liệu, lượt sau tự chạy bình thường và sửa sau rẻ.
  file: `pipeline/doc-gop-hang-ngay.sh`
  severity: low
  Đề xuất: known-limits

- **Phần giữ chỗ trần tiền dùng giá ước, nên chạy song song có thể vượt trần nhiều hơn bản tuần tự**
  Người dùng thấy gì: Khi bài tốn nhiều tiền hơn dự tính, chạy song song có thể chi vượt trần của lượt thêm vài lời gọi so với chạy tuần tự. Số vượt bị giới hạn bởi số lời chạy cùng lúc nên chỉ vài xu.
  Căn cứ: Số tiền vượt nhỏ và có giới hạn, vẫn bị trần ngày chặn cứng phía sau, và tiền đã chi không lấy lại nhưng không gây mất dữ liệu.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: low
  Đề xuất: known-limits

- **Lỗi khi nhả khoá một lượt bị nuốt lặng**
  Người dùng thấy gì: Nếu việc mở khoá lượt đọc tin bị hỏng, hệ thống không để lại dấu vết nào. Lượt đêm có thể bị từ chối trong lúc lượt bù còn chạy mà không có dòng nào giải thích.
  Căn cứ: Khoá tự nhả khi kết nối đóng nên hậu quả nhỏ và tự hết, không mất dữ liệu; thêm log đổi lại ít giá trị.
  file: `agent/src/enrich/doc-gop-s03/hang-ngay.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: dòng «--thu» của node giả chép tay khuôn mà sed của doc-gop-hang-ngay.sh bóc**
  Người dùng thấy gì: Nếu sau này ai đó đổi chữ trong dòng báo số bài còn lại, cảnh báo thật sẽ hiện dấu hỏi thay vì con số, mà bài kiểm tra vẫn xanh. Người vận hành sẽ thấy cảnh báo thiếu số.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một dòng cảnh báo khi có người sửa khuôn log sau này, không mất dữ liệu; hiện chưa có lỗi thật và thêm một bài kiểm tra đầu-cuối thì rẻ.
  file: `agent/tests/doc-gop-song-song.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính đứng một mình: ca «khoảng sai thoát 2» chỉ đòi mã 2 và «không ECONNREFUSED», không ghim thông điệp của tiến trình**
  Người dùng thấy gì: Bài kiểm tra có thể xanh dù lệnh bù dừng vì lý do khác chứ không phải vì khoảng ngày sai. Nếu khâu kiểm khoảng ngày hỏng thật, có thể không ai biết ngay.
  Căn cứ: Chỉ làm lỏng bằng chứng kiểm thử, không ảnh hưởng người dùng hay dữ liệu; lệnh bù còn có chạy thử và sửa bằng một dòng kiểm thêm là rẻ.
  file: `agent/tests/doc-gop-song-song.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính có thể đúng rỗng: «không lời nào phát sau mốc» thiếu đối chứng có lời đã phát**
  Người dùng thấy gì: Bài kiểm tra hết giờ có thể xanh dù lượt dừng ngay mà chưa đọc bài nào. Nếu hỏng kiểu đó, lượt đêm sẽ đọc ít hơn mong đợi mà bài kiểm tra không báo.
  Căn cứ: Chỉ làm bằng chứng kiểm thử yếu hơn, chưa có lỗi thật; số trên màn sau lượt đêm đầu sẽ lộ ra nếu hỏng, và sửa thêm một dòng kiểm là rẻ.
  file: `agent/tests/doc-gop-song-song.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
