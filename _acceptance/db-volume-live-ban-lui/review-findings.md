## Trong hợp đồng

(không có finding nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(không có finding mới ở round này; 13 mục carried từ round trước do máy tự chèn)

- **DB_VOLUME_GIO_GIA lets the real live check fake the current time, no test uses it, and E1 describes it wrongly (r1 · tệp đã đổi)**
  Người dùng thấy gì: Ai đó cố tình đặt biến ép giờ thì phép kiểm máy thật có thể báo xanh dù bản lùi đã mất sớm hơn hạn giữ, mà kết quả không cho biết giờ đã bị ép. Chạy bình thường thì không bị ảnh hưởng.
  Căn cứ: Chỉ xảy ra khi người vận hành tự đặt biến này, không tự phát sinh, và gỡ bỏ rất dễ về sau; hậu quả nhẹ, không mất dữ liệu.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **BAN_LUI_MAU hardcodes the container name instead of building it from $DB_THAT (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này tên container DB đổi, phép kiểm có thể tìm bản lùi theo tên cũ và báo xanh nhầm. Hiện tên chưa đổi nên chưa có ảnh hưởng gì.
  Căn cứ: Hiện chưa gây hậu quả nào cho người dùng, chỉ phát sinh nếu tên container được đổi, và khi đó sửa một dòng là xong.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: wont-fix

- **Lỗi docker inspect khi gom bản lùi bị nuốt thành «không có bản lùi», và sau hạn giữ thì báo xanh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu docker gặp lỗi đúng lúc phép kiểm đang gom bản lùi, kết quả có thể bị hiểu là không còn bản lùi nào và báo xanh sau hạn giữ, dù có bản lùi đang chạy. Trường hợp này hiếm và người vận hành chạy lại là thấy kết quả đúng.
  Căn cứ: Chỉ xảy ra khi docker lỗi thoáng qua đúng lúc kiểm, chạy lại là tự hết, không mất dữ liệu; sửa không gấp vì phép kiểm chỉ đọc.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Biến ép giờ DB_VOLUME_GIO_GIA của run_live chưa có kiểm nào; mô tả E1 không khớp cách selftest thật sự chạy (r1)**
  Người dùng thấy gì: Hồ sơ nghiệm thu mô tả sai cách kiểm giờ nên người đọc có thể tưởng một đường kiểm đã được thử trong khi thực tế chưa. Phép kiểm cho người dùng vẫn chạy đúng.
  Căn cứ: Chỉ là lệch mô tả trong hồ sơ, không ảnh hưởng hành vi hay dữ liệu; sửa lại câu chữ rất rẻ khi có dịp.
  file: `_acceptance/db-volume-live-ban-lui/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: assert chuỗi có mặt trong khi lời hứa là quan hệ giờ chạy so với hạn 05/11 16:20 +07, và hạn không được ghim (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó sau này sửa nhầm giờ hạn giữ bản lùi, bộ tự kiểm vẫn xanh và phép kiểm có thể đổi từ đỏ sang xanh lệch vài giờ so với ngày 05/11. Hiện giờ hạn đang đúng.
  Căn cứ: Hạn hiện đang đúng nên người dùng chưa gặp gì; nếu lệch thì chỉ lệch vài giờ quanh hạn, không mất dữ liệu, và thêm một ô kiểm sát mốc là việc nhỏ.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: E3 hứa mỗi bản một dòng PASS, nhưng ô hai-ban-deu-dung chỉ ghim chuỗi PASS của một bản (r1 · tệp đã đổi)**
  Người dùng thấy gì: Ô kiểm hai bản lùi đều dừng đúng chỉ xác nhận dòng PASS của một bản, nên nếu sau này phép kiểm chỉ báo cho bản đầu thì tự kiểm vẫn không phát hiện. Hiện cả hai bản được báo đúng.
  Căn cứ: Hiện phép kiểm đang hoạt động đúng, chỉ là lưới an toàn cho thay đổi tương lai còn lỏng ở một chiều; không ảnh hưởng người dùng và bổ sung sau rất rẻ.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **Biến ép giờ DB_VOLUME_GIO_GIA nằm ở đường live thật nhưng không được ghi ở đầu tệp như một móc chỉ để thử, khác cách db-chuyen-volume.sh làm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trên máy thật, ai đặt biến ép giờ có thể làm phép kiểm báo xanh dù bản lùi mất sớm, và kết quả không nói giờ đã bị ép. Chỉ xảy ra khi có người cố tình đặt biến đó.
  Căn cứ: Hậu quả nhẹ: không mất dữ liệu, chỉ xảy ra khi người vận hành tự đặt biến, và sửa sau rất rẻ (thêm một dòng ghi chú).
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **Lần dựng lại cụm đối chứng (--force-recreate) trong ca_tao_lai vẫn nuốt lỗi docker, lệch với td_compose_up vừa thêm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi bước dựng lại cụm đối chứng gặp lỗi, người vận hành không thấy dòng lỗi docker nào để biết nguyên nhân. Phép thử vẫn chạy được, chỉ khó tìm lỗi hơn.
  Căn cứ: Chỉ làm khó chẩn đoán trên bộ thử nội bộ, không ảnh hưởng dữ liệu hay người dùng cuối, và chạy lại là thấy.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **Đối chứng kiểu cũ báo PASS «bảng x mất» cả khi cụm đối chứng tạo lại không lên hoặc lệnh tạo bảng x lỗi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép thử chứng minh cách làm cũ gây mất dữ liệu có thể báo đạt giả khi máy chậm hoặc cụm thử không lên. Kết quả xanh ở ca này khi đó không đáng tin hoàn toàn.
  Căn cứ: Chỉ làm bằng chứng thử nghiệm kém chắc ở một ca đối chứng, không đụng dữ liệu thật; sửa sau không đắt nhưng không chặn việc ship.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Selftest live bỏ ô đỏ «mount volume khác tên», nên nhánh `check_du_lieu` từ chối volume sai tên không còn phép thử nào (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này ai đó sửa nhầm để phép kiểm chấp nhận dữ liệu nằm trong một volume sai tên, bộ tự kiểm vẫn báo đạt. Khi đó dữ liệu có thể nằm sai chỗ mà không ai được cảnh báo.
  Căn cứ: Mất một chiều bắt lỗi của bất biến chính nhưng chỉ lộ khi có sửa sai về sau; thêm lại một ô thử là rẻ, nên làm ở một việc riêng.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận thiếu phần tử): trục dữ liệu bỏ mất nhánh «volume khác tên» của check_du_lieu (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bảng tự kiểm tuyên bố đủ 16 ô nhưng thiếu trường hợp dữ liệu nằm trong volume sai tên, nên một lỗi ở nhánh đó không bị bắt.
  Căn cứ: Cùng gốc với việc mất ô thử volume sai tên: không mất dữ liệu ngay, chỉ giảm độ bắt lỗi về sau, và thêm lại là việc nhỏ gộp chung.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là «mỗi bản một dòng PASS»): ô hai-ban-deu-dung chỉ ghim một bản (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi có hai bản lùi đều dừng đúng, phép thử chỉ xác nhận dòng báo cho một bản. Nếu dòng của bản kia thiếu thì không ai biết.
  Căn cứ: Kết luận xanh/đỏ vẫn đúng, chỉ thiếu độ chi tiết trong báo cáo; không mất dữ liệu và bổ sung sau rẻ.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo đường thay thế thay vì đầu ra thật): E1 nói hai ô «chỉ khác giờ ép DB_VOLUME_GIO_GIA», nhưng selftest không đi qua biến đó cũng như run_live (r1)**
  Người dùng thấy gì: Bộ tự kiểm không chạy qua đúng đường nhận giờ của lệnh kiểm thật, nên nếu đường đó đọc sai biến thì tự kiểm vẫn báo đạt.
  Căn cứ: Rủi ro thấp: đường này chỉ là một dòng nối đơn giản, lỗi sẽ lộ ngay khi chạy máy thật, và không gây mất dữ liệu.
  file: `_acceptance/db-volume-live-ban-lui/evals.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
