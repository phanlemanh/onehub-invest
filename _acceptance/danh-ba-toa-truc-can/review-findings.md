# Review findings: danh-ba-toa-truc-can (round 1)

Không có finder nào chết (review đầy đủ).

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận thiếu phần tử): ca âm của bộ tách mã không bắt được khuôn bị nới thành khớp tiền tố ở 7 trên 8 khuôn**
  AC: AC-2
  file: `pipeline/lib/ma-can-s08.test.mjs:8`
  severity: high
  source: measurement
  detail: E2 hứa «bản chép bộ tách nới một khuôn thành khớp tiền tố thì ca âm của khuôn đó đỏ». MA_TRAN (dòng 8–52) chỉ có một ca âm dạng «tiền tố đúng khuôn + phần thừa» là «Q1.18.123» của khuôn cham. Các ca âm khác như «Q12-7-03», «QQQQQ_Q1-24.04», «QX12.01», «Q6.017.05», «Q2.17», «QX1807», «QX1.01S02» đều sai ngay từ phần đầu, nên bỏ neo `$` cũng không làm chúng khớp. Thử trên bản chép trong scratchpad: lần lượt bỏ `$` ở regex từng khuôn rồi chạy test thì gach, tien-to-x, dinh-cham, toa-cham-bon, toa-cham-dinh, dinh-lien, chan-de vẫn pass 2/0; chỉ cham đỏ. Vòng kiểm độ phủ ở dòng 63–65 chỉ đòi mỗi khuôn có ca DƯƠNG, không đòi ca âm gần đúng khuôn vì hàng âm không gắn khuon_id. Lời hứa «mỗi khuôn một ca âm» không được đo; chiều đỏ của E2 chỉ đúng cho 1/8 khuôn.
  rationale: AC-2 đòi mỗi khuôn đã khai có cả ca dương và ca âm; chỉ 1 trong 8 khuôn có ca âm sát khuôn.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rào DB của lệnh dựng là danh sách cấm một tên, không phải danh sách cho phép DB thử**
  Người dùng thấy gì: Nếu ai đó trỏ nhầm lệnh dựng danh bạ vào cơ sở dữ liệu đám mây, lệnh vẫn chạy và ghi dữ liệu danh mục nội bộ lên đó.
  Căn cứ: Chỉ xảy ra khi người chạy trỏ nhầm đích, hiện chưa có ai làm vậy và còn bước duyệt trước khi áp lên máy thật; nhưng nếu xảy ra thì dữ liệu nội bộ lên đám mây khó thu hồi.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

- **pipeline/CLAUDE.md không ghi lệnh danh-ba-vat-the.mjs và ba bảng vật thể mới**
  Người dùng thấy gì: Người hoặc trợ lý làm việc sau sẽ không biết lệnh dựng danh bạ toà và ba bảng mới chỉ nằm ở máy local, nên dễ dùng sai.
  Căn cứ: Chỉ là thiếu ghi chú, không mất dữ liệu và bổ sung tài liệu sau rất rẻ.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

- **Gọi lệnh qua đường symlink (~/dev/one-invest) thì main() không chạy, lệnh thoát 0 mà không làm gì**
  Người dùng thấy gì: Chạy lệnh dựng danh bạ qua đường dẫn cũ thì lệnh không làm gì mà vẫn báo thành công, nên người chạy tưởng đã dựng xong.
  Căn cứ: Lỗi im lặng dễ gây hiểu lầm nhưng không làm mất hay hỏng dữ liệu, chạy lại bằng đường thật là xong, và sửa rất rẻ.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: medium
  Đề xuất: new-contract

- **Slug khu sai hoặc thiếu trong --khu thì lệnh âm thầm bỏ khu đó, vẫn COMMIT và báo thành công**
  Người dùng thấy gì: Gõ sai tên khu khi chạy lệnh dựng thì lệnh bỏ qua khu đó và vẫn báo xong, trông như không có gì mới.
  Căn cứ: Không hỏng dữ liệu, gõ lại đúng tên là chạy được, nhưng báo thành công giả có thể khiến người dùng bỏ sót khu cần dựng.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

- **Phép kiểm AC-7 suy số mã tách được từ tỉ lệ đã làm tròn 4 chữ số, có thể đỏ oan khi khu có hơn 10.000 mã**
  Người dùng thấy gì: Khi một khu có hơn mười nghìn mã căn, phép kiểm có thể báo đỏ dù danh bạ dựng đúng.
  Căn cứ: Chỉ gây báo động nhầm ở phép kiểm nội bộ, không ảnh hưởng dữ liệu người dùng và hiện chưa có khu nào lớn đến mức đó.
  file: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (thông điệp đỏ không ghim tên khuôn): ca âm báo «khuôn khong-tach» thay vì «khuôn <id>»**
  Người dùng thấy gì: Khi phép kiểm tách mã báo đỏ, thông báo không nói khuôn nào bị hỏng, nên người sửa phải tự dò.
  Căn cứ: Chỉ làm chậm việc tìm lỗi khi có lỗi, không ảnh hưởng dữ liệu và sửa rất rẻ.
  file: `pipeline/lib/ma-can-s08.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 và 3: ca DBV-AC-8 của lệnh E8 không có assert theo từng phần tử ma trận, không kiểm so_nguoi_dang/so_nhom của ca (d)**
  Người dùng thấy gì: Phép kiểm tích hợp không tự soi số người đăng và số nhóm của ứng viên toà, nên lỗi ở đó chỉ lộ qua bộ test khác.
  Căn cứ: Hành vi vẫn có kiểm ở chỗ khác nên rủi ro thấp, không mất dữ liệu và bổ sung assert rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: ma trận DBV-AC-12 tuyên sáu ca nhưng lệnh E13 (itest) thiếu ca (f) «vung-khong-ro»**
  Người dùng thấy gì: Ca khu không xác định được phường chưa được thử trên cơ sở dữ liệu thật của phép kiểm tích hợp, và việc tin không bị đổi cũng chưa được đo đầy đủ.
  Căn cứ: Ca này đã có kiểm ở mức đơn vị nên rủi ro thấp, không mất dữ liệu và bổ sung sau rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: DBV-AC-7 thay quan hệ tập (dự án, mã toà) ↔ toà có bld_ bằng kiểm «mỗi dự án có một bí danh»; tỉ lệ tách đối chiếu chính số của bộ dựng**
  Người dùng thấy gì: Phép kiểm trên dữ liệu thật chưa chứng minh được mọi toà của dự án đều có khoá, chỉ chứng minh mỗi dự án có ít nhất một toà.
  Căn cứ: Thiếu toà sẽ lộ khi gắn tin sau này và sửa được bằng dựng lại, không mất dữ liệu.
  file: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: DBV-AC-6 hứa «tổng số dòng ba bảng và bí danh không giảm» nhưng assert một tổng gộp units + bí danh**
  Người dùng thấy gì: Phép kiểm chưa tự phát hiện nếu toà hoặc trục bị mất dòng khi chụp lại danh mục.
  Căn cứ: Ba bảng đã có rào chặn xoá ở tầng dữ liệu nên khả năng mất dòng thấp, và siết phép kiểm rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: DBV-AC-9 chiều «sửa từ điển → phát biểu mới với băm mới» chỉ đếm dòng, không kiểm băm**
  Người dùng thấy gì: Khi sửa từ điển chủ đầu tư, phép kiểm chưa xác nhận dấu vết tệp mới được ghi lại đúng.
  Căn cứ: Chỉ là thiếu một dòng kiểm, dữ liệu vẫn sửa được bằng dựng lại và bổ sung rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: nhánh «bộ chọn dòng thật của sync-cloud» của DBV-AC-11a chạy trên mẫu viết tay trong chính hàm kiểm và bộ lọc viết tay trong test**
  Người dùng thấy gì: Phép kiểm chống đồng bộ lên đám mây chưa chạy qua bộ chọn dòng thật, nên chưa chứng minh được thật sự không có dữ liệu toà lên đám mây nếu sau này đổi cấu hình.
  Căn cứ: Hiện ba bảng chưa nằm trong danh sách đồng bộ nên chưa có rò rỉ, nhưng nếu về sau thêm bảng thì phải siết kiểm vì dữ liệu lên đám mây khó thu hồi.
  file: `pipeline/lib/danh-ba-vat-the.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: «bảng kỳ vọng viết trước theo khu» của DBV-AC-3 chỉ có một khu, lấy từ số tự báo của bộ dựng**
  Người dùng thấy gì: Số toà, trục, căn của khu thứ hai chưa được đếm độc lập, chỉ dựa vào số bộ dựng tự báo.
  Căn cứ: Khu thứ hai vẫn được dựng cùng đường code nên rủi ro thấp, không mất dữ liệu và bổ sung bảng kỳ vọng rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
