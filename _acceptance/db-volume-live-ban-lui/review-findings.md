# Review findings: db-volume-live-ban-lui (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **DB_VOLUME_GIO_GIA lets the real live check fake the current time, no test uses it, and E1 describes it wrongly**
  Người dùng thấy gì: Ai đó cố tình đặt biến ép giờ thì phép kiểm máy thật có thể báo xanh dù bản lùi đã mất sớm hơn hạn giữ, mà kết quả không cho biết giờ đã bị ép. Chạy bình thường thì không bị ảnh hưởng.
  Căn cứ: Chỉ xảy ra khi người vận hành tự đặt biến này, không tự phát sinh, và gỡ bỏ rất dễ về sau; hậu quả nhẹ, không mất dữ liệu.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **BAN_LUI_MAU hardcodes the container name instead of building it from $DB_THAT**
  Người dùng thấy gì: Nếu sau này tên container DB đổi, phép kiểm có thể tìm bản lùi theo tên cũ và báo xanh nhầm. Hiện tên chưa đổi nên chưa có ảnh hưởng gì.
  Căn cứ: Hiện chưa gây hậu quả nào cho người dùng, chỉ phát sinh nếu tên container được đổi, và khi đó sửa một dòng là xong.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: wont-fix

- **Lỗi docker inspect khi gom bản lùi bị nuốt thành «không có bản lùi», và sau hạn giữ thì báo xanh**
  Người dùng thấy gì: Nếu docker gặp lỗi đúng lúc phép kiểm đang gom bản lùi, kết quả có thể bị hiểu là không còn bản lùi nào và báo xanh sau hạn giữ, dù có bản lùi đang chạy. Trường hợp này hiếm và người vận hành chạy lại là thấy kết quả đúng.
  Căn cứ: Chỉ xảy ra khi docker lỗi thoáng qua đúng lúc kiểm, chạy lại là tự hết, không mất dữ liệu; sửa không gấp vì phép kiểm chỉ đọc.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Biến ép giờ DB_VOLUME_GIO_GIA của run_live chưa có kiểm nào; mô tả E1 không khớp cách selftest thật sự chạy**
  Người dùng thấy gì: Hồ sơ nghiệm thu mô tả sai cách kiểm giờ nên người đọc có thể tưởng một đường kiểm đã được thử trong khi thực tế chưa. Phép kiểm cho người dùng vẫn chạy đúng.
  Căn cứ: Chỉ là lệch mô tả trong hồ sơ, không ảnh hưởng hành vi hay dữ liệu; sửa lại câu chữ rất rẻ khi có dịp.
  file: `_acceptance/db-volume-live-ban-lui/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: assert chuỗi có mặt trong khi lời hứa là quan hệ giờ chạy so với hạn 05/11 16:20 +07, và hạn không được ghim**
  Người dùng thấy gì: Nếu ai đó sau này sửa nhầm giờ hạn giữ bản lùi, bộ tự kiểm vẫn xanh và phép kiểm có thể đổi từ đỏ sang xanh lệch vài giờ so với ngày 05/11. Hiện giờ hạn đang đúng.
  Căn cứ: Hạn hiện đang đúng nên người dùng chưa gặp gì; nếu lệch thì chỉ lệch vài giờ quanh hạn, không mất dữ liệu, và thêm một ô kiểm sát mốc là việc nhỏ.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: E3 hứa mỗi bản một dòng PASS, nhưng ô hai-ban-deu-dung chỉ ghim chuỗi PASS của một bản**
  Người dùng thấy gì: Ô kiểm hai bản lùi đều dừng đúng chỉ xác nhận dòng PASS của một bản, nên nếu sau này phép kiểm chỉ báo cho bản đầu thì tự kiểm vẫn không phát hiện. Hiện cả hai bản được báo đúng.
  Căn cứ: Hiện phép kiểm đang hoạt động đúng, chỉ là lưới an toàn cho thay đổi tương lai còn lỏng ở một chiều; không ảnh hưởng người dùng và bổ sung sau rất rẻ.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
