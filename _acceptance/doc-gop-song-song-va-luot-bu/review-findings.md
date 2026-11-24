# Review findings: doc-gop-song-song-va-luot-bu (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mã 75 «dừng sạch» vẫn sinh dòng JOB FAIL qua job_run, trái với hợp đồng «75 = đi tiếp, không phải lỗi»**
  Người dùng thấy gì: Đêm nào bước đọc tin dừng đúng hẹn vì hết giờ, nhật ký vẫn có thêm một dòng báo lỗi giả. Người xem nhật ký có thể tưởng đêm đó hỏng dù việc vẫn chạy tiếp bình thường.
  Căn cứ: Chỉ là dòng báo nhầm trong nhật ký, không mất hay sai dữ liệu, và lượt sau vẫn đọc tiếp đúng phần còn lại; sửa sau rẻ.
  file: `pipeline/doc-gop-hang-ngay.sh`
  severity: medium
  Đề xuất: known-limits

- **Khoá một lượt (AC-9) lấy SAU khi đã đọc tiền đã chi và danh sách bài cần gọi**
  Người dùng thấy gì: Hiếm khi, hai lượt đọc tin nối đuôi sát nhau có thể đọc lại vài bài vừa đọc xong và chi hơi quá trần ngày. Tiền dư ra chỉ là phần nhỏ của một lượt.
  Căn cứ: Chỉ xảy ra khi hai lượt chạm nhau đúng khoảnh khắc nhả khoá, hậu quả là tốn thêm ít tiền chứ không mất dữ liệu, và trần chặn cứng hai lớp vẫn còn.
  file: `agent/src/enrich/doc-gop-s03/hang-ngay.ts`
  severity: low
  Đề xuất: known-limits

- **Khoá lượt lấy SAU khi đã tính canDoc và chiTruoc: lượt thứ hai có thể chạy trên số cũ**
  Người dùng thấy gì: Hiếm khi, lượt bù chạy ngay sau lượt đêm có thể gọi model lại cho vài bài đã đọc và vượt trần ngày một chút. Người dùng thấy tốn thêm một ít tiền.
  Căn cứ: Khe thời gian rất hẹp, chỉ tốn thêm ít tiền, không mất dữ liệu, và lượt bù chỉ chạy tay ngoài giờ lượt đêm nên khó va nhau.
  file: `agent/src/enrich/doc-gop-s03/hang-ngay.ts`
  severity: medium
  Đề xuất: known-limits

- **Bước hôm qua hết giờ (mã 75) vẫn in dòng JOB FAIL trong doc-gop-hang-ngay.sh**
  Người dùng thấy gì: Khi bước hôm qua hết giờ, nhật ký đêm vẫn in một dòng báo lỗi dù việc dừng đúng hẹn. Ai tìm chữ báo lỗi trong nhật ký sẽ thấy cảnh báo giả mỗi đêm hết giờ.
  Căn cứ: Chỉ làm nhật ký gây nhầm, không ảnh hưởng dữ liệu hay tiền, người đọc phân biệt được nhờ dòng cảnh báo hết giờ đi liền sau.
  file: `pipeline/doc-gop-hang-ngay.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: node giả in sẵn dòng «7 can goi» cho sed của doc-gop-hang-ngay.sh, không lấy từ writer thật**
  Người dùng thấy gì: Nếu sau này ai đổi chữ trong dòng báo số bài còn lại, bài kiểm tra vẫn xanh nhưng máy thu có thể in số còn lại sai. Hiện chưa có lỗi nào xảy ra.
  Căn cứ: Chưa gây hại cho người dùng, chỉ là lưới an toàn của bài kiểm tra còn hở; có thể bổ sung khi có người sửa dòng báo đó.
  file: `agent/tests/doc-gop-song-song.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
