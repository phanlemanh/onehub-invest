## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Định nghĩa «tên chỉ S08» kiểm độ dài trước khi cắt «The», nên tên có phần riêng ngắn hay chung chung lọt khỏi tập quét**
  Người dùng thấy gì: Phép kiểm chống lộ tên toà chỉ có từ danh mục nội bộ có thể bỏ sót vài tên có phần riêng quá ngắn. Hôm nay chưa thấy tên nào bị lộ trong kho công khai.
  Căn cứ: Chưa có dữ liệu nào bị lộ và chỉ ảnh hưởng độ chặt của phép kiểm nội bộ; người dùng cuối không thấy gì, và có thể siết lại sau với chi phí thấp.
  file: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **DBV-AC-11b: bộ quét kho chỉ tìm tên S08 ở dạng thô, phân biệt hoa thường, trong khi định nghĩa mới so trên dạng đã chuẩn hoá**
  Người dùng thấy gì: Nếu sau này có tệp trong kho ghi tên toà nội bộ theo cách viết khác (chữ thường, khoảng trắng thay gạch dưới), phép kiểm vẫn báo an toàn. Hiện chưa có tệp nào như vậy.
  Căn cứ: Hôm nay không có tên nào lộ, hậu quả chỉ xảy ra nếu ai đó ghi nhầm sau này; phép kiểm thủ công bằng tìm kiếm trong kho bắt được ngay và sửa sau rẻ.
  file: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): nửa «tên phân khu chỉ S08» của DBV-AC-11b không có đối chứng dương trên tập thật, cũng không chặn tập rỗng**
  Người dùng thấy gì: Phép kiểm tên toà nội bộ có thể lặng lẽ thành vô nghĩa nếu danh sách tên cần quét rỗng mà vẫn báo xanh. Hôm nay danh sách có 5 tên nên vẫn hoạt động.
  Căn cứ: Chỉ là rào phụ có thể mất tác dụng khi dữ liệu đổi, chưa có hậu quả với người dùng; phát hiện và sửa sau đều rẻ.
  file: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tám dòng DQ mới của 082 hiện «Kiểm khác (chưa diễn giải)» trên /ops/quality vì dq-labels chưa có nhãn (r2)**
  Người dùng thấy gì: Trên trang chất lượng dữ liệu của Ops, tám dòng kiểm mới về toà, trục, căn sẽ hiện chữ chung «Kiểm khác (chưa diễn giải)» kèm tên bảng và cột tiếng Anh thay vì nhãn tiếng Việt dễ hiểu.
  Căn cứ: Chỉ ảnh hưởng cách đọc của người vận hành Ops, số liệu vẫn đúng, không mất hay lộ dữ liệu; thêm nhãn sau rất rẻ và không cần làm lại gì.
  file: `pipeline/dq-enum-vocab.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lệnh danh-ba-vat-the.mjs chạy qua đường symlink thì không làm gì mà vẫn thoát mã 0 (r2)**
  Người dùng thấy gì: Nếu lệnh dựng danh bạ toà được gọi qua đường dẫn tắt (như cách máy chạy đêm đang gọi code), nó sẽ im lặng không làm gì mà vẫn báo thành công, nên danh bạ có thể không được cập nhật mà không ai hay.
  Căn cứ: Hiện chưa có lịch chạy đêm nào dùng lệnh này, nên chưa gây hại thật; nhưng khi đưa vào chạy tự động thì lỗi sẽ âm thầm, nên cần sửa trước đó, và sửa rất rẻ.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: medium
  Đề xuất: known-limits

- **Slug khu không tìm thấy thì bị bỏ qua, lệnh vẫn báo thành công với số 0; test AC-7 trên dữ liệu thật có thể qua mà không kiểm gì (r2)**
  Người dùng thấy gì: Nếu tên khu bị gõ sai hoặc đổi, lệnh dựng danh bạ vẫn báo xong với toàn số 0, người chạy dễ tưởng là không có toà nào thay vì nhận ra mình nhập sai.
  Căn cứ: Chỉ gây hiểu nhầm khi chạy tay, không làm mất hay hỏng dữ liệu, chạy lại với tên đúng là xong; đã có một kiểm tra khác bắt được trường hợp rỗng hoàn toàn.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

- **Rào DB của lệnh dựng là danh sách cấm một tên, không phải danh sách cho phép DB thử (r1)**
  Người dùng thấy gì: Nếu ai đó trỏ nhầm lệnh dựng danh bạ vào cơ sở dữ liệu đám mây, lệnh vẫn chạy và ghi dữ liệu danh mục nội bộ lên đó.
  Căn cứ: Chỉ xảy ra khi người chạy trỏ nhầm đích, hiện chưa có ai làm vậy và còn bước duyệt trước khi áp lên máy thật; nhưng nếu xảy ra thì dữ liệu nội bộ lên đám mây khó thu hồi.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

- **pipeline/CLAUDE.md không ghi lệnh danh-ba-vat-the.mjs và ba bảng vật thể mới (r1)**
  Người dùng thấy gì: Người hoặc trợ lý làm việc sau sẽ không biết lệnh dựng danh bạ toà và ba bảng mới chỉ nằm ở máy local, nên dễ dùng sai.
  Căn cứ: Chỉ là thiếu ghi chú, không mất dữ liệu và bổ sung tài liệu sau rất rẻ.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

- **Gọi lệnh qua đường symlink (~/dev/one-invest) thì main() không chạy, lệnh thoát 0 mà không làm gì (r1)**
  Người dùng thấy gì: Chạy lệnh dựng danh bạ qua đường dẫn cũ thì lệnh không làm gì mà vẫn báo thành công, nên người chạy tưởng đã dựng xong.
  Căn cứ: Lỗi im lặng dễ gây hiểu lầm nhưng không làm mất hay hỏng dữ liệu, chạy lại bằng đường thật là xong, và sửa rất rẻ.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: medium
  Đề xuất: new-contract

- **Slug khu sai hoặc thiếu trong --khu thì lệnh âm thầm bỏ khu đó, vẫn COMMIT và báo thành công (r1)**
  Người dùng thấy gì: Gõ sai tên khu khi chạy lệnh dựng thì lệnh bỏ qua khu đó và vẫn báo xong, trông như không có gì mới.
  Căn cứ: Không hỏng dữ liệu, gõ lại đúng tên là chạy được, nhưng báo thành công giả có thể khiến người dùng bỏ sót khu cần dựng.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: known-limits

- **Phép kiểm AC-7 suy số mã tách được từ tỉ lệ đã làm tròn 4 chữ số, có thể đỏ oan khi khu có hơn 10.000 mã (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi một khu có hơn mười nghìn mã căn, phép kiểm có thể báo đỏ dù danh bạ dựng đúng.
  Căn cứ: Chỉ gây báo động nhầm ở phép kiểm nội bộ, không ảnh hưởng dữ liệu người dùng và hiện chưa có khu nào lớn đến mức đó.
  file: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (thông điệp đỏ không ghim tên khuôn): ca âm báo «khuôn khong-tach» thay vì «khuôn <id>» (r1)**
  Người dùng thấy gì: Khi phép kiểm tách mã báo đỏ, thông báo không nói khuôn nào bị hỏng, nên người sửa phải tự dò.
  Căn cứ: Chỉ làm chậm việc tìm lỗi khi có lỗi, không ảnh hưởng dữ liệu và sửa rất rẻ.
  file: `pipeline/lib/ma-can-s08.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 và 3: ca DBV-AC-8 của lệnh E8 không có assert theo từng phần tử ma trận, không kiểm so_nguoi_dang/so_nhom của ca (d) (r1)**
  Người dùng thấy gì: Phép kiểm tích hợp không tự soi số người đăng và số nhóm của ứng viên toà, nên lỗi ở đó chỉ lộ qua bộ test khác.
  Căn cứ: Hành vi vẫn có kiểm ở chỗ khác nên rủi ro thấp, không mất dữ liệu và bổ sung assert rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: ma trận DBV-AC-12 tuyên sáu ca nhưng lệnh E13 (itest) thiếu ca (f) «vung-khong-ro» (r1)**
  Người dùng thấy gì: Ca khu không xác định được phường chưa được thử trên cơ sở dữ liệu thật của phép kiểm tích hợp, và việc tin không bị đổi cũng chưa được đo đầy đủ.
  Căn cứ: Ca này đã có kiểm ở mức đơn vị nên rủi ro thấp, không mất dữ liệu và bổ sung sau rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: DBV-AC-7 thay quan hệ tập (dự án, mã toà) ↔ toà có bld_ bằng kiểm «mỗi dự án có một bí danh»; tỉ lệ tách đối chiếu chính số của bộ dựng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm trên dữ liệu thật chưa chứng minh được mọi toà của dự án đều có khoá, chỉ chứng minh mỗi dự án có ít nhất một toà.
  Căn cứ: Thiếu toà sẽ lộ khi gắn tin sau này và sửa được bằng dựng lại, không mất dữ liệu.
  file: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: DBV-AC-6 hứa «tổng số dòng ba bảng và bí danh không giảm» nhưng assert một tổng gộp units + bí danh (r1)**
  Người dùng thấy gì: Phép kiểm chưa tự phát hiện nếu toà hoặc trục bị mất dòng khi chụp lại danh mục.
  Căn cứ: Ba bảng đã có rào chặn xoá ở tầng dữ liệu nên khả năng mất dòng thấp, và siết phép kiểm rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: DBV-AC-9 chiều «sửa từ điển → phát biểu mới với băm mới» chỉ đếm dòng, không kiểm băm (r1)**
  Người dùng thấy gì: Khi sửa từ điển chủ đầu tư, phép kiểm chưa xác nhận dấu vết tệp mới được ghi lại đúng.
  Căn cứ: Chỉ là thiếu một dòng kiểm, dữ liệu vẫn sửa được bằng dựng lại và bổ sung rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: nhánh «bộ chọn dòng thật của sync-cloud» của DBV-AC-11a chạy trên mẫu viết tay trong chính hàm kiểm và bộ lọc viết tay trong test (r1)**
  Người dùng thấy gì: Phép kiểm chống đồng bộ lên đám mây chưa chạy qua bộ chọn dòng thật, nên chưa chứng minh được thật sự không có dữ liệu toà lên đám mây nếu sau này đổi cấu hình.
  Căn cứ: Hiện ba bảng chưa nằm trong danh sách đồng bộ nên chưa có rò rỉ, nhưng nếu về sau thêm bảng thì phải siết kiểm vì dữ liệu lên đám mây khó thu hồi.
  file: `pipeline/lib/danh-ba-vat-the.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: «bảng kỳ vọng viết trước theo khu» của DBV-AC-3 chỉ có một khu, lấy từ số tự báo của bộ dựng (r1)**
  Người dùng thấy gì: Số toà, trục, căn của khu thứ hai chưa được đếm độc lập, chỉ dựa vào số bộ dựng tự báo.
  Căn cứ: Khu thứ hai vẫn được dựng cùng đường code nên rủi ro thấp, không mất dữ liệu và bổ sung bảng kỳ vọng rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
