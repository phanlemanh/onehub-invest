# Review findings: db-volume-live-ban-lui (round 1)

## Trong hợp đồng

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ giờ so với hạn giữ): mốc BAN_LUI_GIU_DEN không bị ghim**
  file: `scripts/db-volume-check.sh:512`
  severity: medium
  AC: AC-1
  source: measurement
  detail: AC-1 hứa một QUAN HỆ: vắng bản lùi trước 2026-11-05T09:20Z thì đỏ, từ mốc đó trở đi thì xanh. Hai ô vang-truoc-han và vang-sau-han lại dùng `truoc="2026-11-01T00:00:00Z"; sau="2026-11-06T00:00:00Z"`, cách mốc nhiều ngày, và chỉ grep chuỗi «FAIL bản lùi mất trước hạn giữ» / «PASS không còn bản lùi …»; chuỗi ghim không kèm giá trị hạn. Đổi BAN_LUI_GIU_DEN (dòng 454) sang bất kỳ giờ nào trong khoảng 01/11–06/11, hoặc đổi `-ge` thành `-gt`, thì cả ma trận vẫn xanh. Không có ô nào sát mốc (ví dụ 09:19:59Z / 09:20:00Z), nên quan hệ với đúng mốc đã chốt không được đo.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Biến ép giờ DB_VOLUME_GIO_GIA nằm ở đường live thật nhưng không được ghi ở đầu tệp như một móc chỉ để thử, khác cách db-chuyen-volume.sh làm**
  Người dùng thấy gì: Trên máy thật, ai đặt biến ép giờ có thể làm phép kiểm báo xanh dù bản lùi mất sớm, và kết quả không nói giờ đã bị ép. Chỉ xảy ra khi có người cố tình đặt biến đó.
  Căn cứ: Hậu quả nhẹ: không mất dữ liệu, chỉ xảy ra khi người vận hành tự đặt biến, và sửa sau rất rẻ (thêm một dòng ghi chú).
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **Lần dựng lại cụm đối chứng (--force-recreate) trong ca_tao_lai vẫn nuốt lỗi docker, lệch với td_compose_up vừa thêm**
  Người dùng thấy gì: Khi bước dựng lại cụm đối chứng gặp lỗi, người vận hành không thấy dòng lỗi docker nào để biết nguyên nhân. Phép thử vẫn chạy được, chỉ khó tìm lỗi hơn.
  Căn cứ: Chỉ làm khó chẩn đoán trên bộ thử nội bộ, không ảnh hưởng dữ liệu hay người dùng cuối, và chạy lại là thấy.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **Đối chứng kiểu cũ báo PASS «bảng x mất» cả khi cụm đối chứng tạo lại không lên hoặc lệnh tạo bảng x lỗi**
  Người dùng thấy gì: Phép thử chứng minh cách làm cũ gây mất dữ liệu có thể báo đạt giả khi máy chậm hoặc cụm thử không lên. Kết quả xanh ở ca này khi đó không đáng tin hoàn toàn.
  Căn cứ: Chỉ làm bằng chứng thử nghiệm kém chắc ở một ca đối chứng, không đụng dữ liệu thật; sửa sau không đắt nhưng không chặn việc ship.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Selftest live bỏ ô đỏ «mount volume khác tên», nên nhánh `check_du_lieu` từ chối volume sai tên không còn phép thử nào**
  Người dùng thấy gì: Nếu sau này ai đó sửa nhầm để phép kiểm chấp nhận dữ liệu nằm trong một volume sai tên, bộ tự kiểm vẫn báo đạt. Khi đó dữ liệu có thể nằm sai chỗ mà không ai được cảnh báo.
  Căn cứ: Mất một chiều bắt lỗi của bất biến chính nhưng chỉ lộ khi có sửa sai về sau; thêm lại một ô thử là rẻ, nên làm ở một việc riêng.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận thiếu phần tử): trục dữ liệu bỏ mất nhánh «volume khác tên» của check_du_lieu**
  Người dùng thấy gì: Bảng tự kiểm tuyên bố đủ 16 ô nhưng thiếu trường hợp dữ liệu nằm trong volume sai tên, nên một lỗi ở nhánh đó không bị bắt.
  Căn cứ: Cùng gốc với việc mất ô thử volume sai tên: không mất dữ liệu ngay, chỉ giảm độ bắt lỗi về sau, và thêm lại là việc nhỏ gộp chung.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là «mỗi bản một dòng PASS»): ô hai-ban-deu-dung chỉ ghim một bản**
  Người dùng thấy gì: Khi có hai bản lùi đều dừng đúng, phép thử chỉ xác nhận dòng báo cho một bản. Nếu dòng của bản kia thiếu thì không ai biết.
  Căn cứ: Kết luận xanh/đỏ vẫn đúng, chỉ thiếu độ chi tiết trong báo cáo; không mất dữ liệu và bổ sung sau rẻ.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo đường thay thế thay vì đầu ra thật): E1 nói hai ô «chỉ khác giờ ép DB_VOLUME_GIO_GIA», nhưng selftest không đi qua biến đó cũng như run_live**
  Người dùng thấy gì: Bộ tự kiểm không chạy qua đúng đường nhận giờ của lệnh kiểm thật, nên nếu đường đó đọc sai biến thì tự kiểm vẫn báo đạt.
  Căn cứ: Rủi ro thấp: đường này chỉ là một dòng nối đơn giản, lỗi sẽ lộ ngay khi chạy máy thật, và không gây mất dữ liệu.
  file: `_acceptance/db-volume-live-ban-lui/evals.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
