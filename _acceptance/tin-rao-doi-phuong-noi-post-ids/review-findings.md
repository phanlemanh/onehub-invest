# Review findings: tin-rao-doi-phuong-noi-post-ids (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test mới đặt ở scripts/lib/ nên nằm ngoài glob test của scripts/ (CI và executors.test.scripts không chạy) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tra «không tin rao nào mất hay đổi phường» chạy được khi có người nghiệm thu, nhưng không tự chạy mỗi lần có thay đổi mới. Nếu sau này thước đo này hỏng thì sẽ không có gì chặn lại trước khi nhập vào bản chính.
  Căn cứ: Không làm mất dữ liệu hay sai số cho người dùng ngay lúc này, chỉ làm mất một lớp chặn tự động về sau; sửa lại sau cũng rẻ và không để lại hậu quả.
  file: `scripts/lib/doi-phuong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml E2/E3 khai `paths` thiếu các transform mà lệnh đo thật sự chạy, lệch mẫu của hàng trước (r1)**
  Người dùng thấy gì: Sau này nếu có người sửa các bước xử lý tin rao, kết quả đo cũ vẫn có thể bị coi là còn hiệu lực dù đã lỗi thời. Người dùng không thấy ngay, nhưng có thể tin vào một kết quả nghiệm thu đã cũ.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của bằng chứng nghiệm thu về sau, không đụng dữ liệu của người dùng; đọc lại hay chạy lại bằng chứng là xử lý được, và sửa danh sách rất rẻ.
  file: `_acceptance/tin-rao-doi-phuong-noi-post-ids/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Chú thích executor và evals ghi AC-2 chỉ «mồi qua runTransformFb», trong khi test chạy cả S03 qua runTransformZalo (r1)**
  Người dùng thấy gì: Một dòng ghi chú trong cấu hình nghiệm thu mô tả thiếu: nói chỉ kiểm một nguồn trong khi thực tế kiểm hai nguồn. Người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là chữ ghi chú nội bộ, không ảnh hưởng dữ liệu hay kết quả đo nào; chấp nhận để nguyên, không đáng mở việc.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Chặn «nối hỏng» dựa trên giả định sai: chụp 0 không được tính từ stg hiện tại, nên có thể báo FAIL sai (r1)**
  Người dùng thấy gì: Phép đo có thể báo đỏ nhầm là «nối hỏng» khi dữ liệu thu về mới được nạp mà chưa xử lý lại. Người nghiệm thu sẽ thấy một cảnh báo sai và phải chạy lại hoặc điều tra, nhưng không có tin rao nào bị mất hay sai.
  Căn cứ: Lỗi ồn ào chứ không im lặng, không làm mất hay sai dữ liệu người dùng, và chạy lại sau khi xử lý xong là hết; chỉ gây tốn công kiểm tra.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
