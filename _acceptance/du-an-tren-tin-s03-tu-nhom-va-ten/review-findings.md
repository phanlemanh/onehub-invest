## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E1 trong evals.yaml lệch với ca DAT-AC-1 đang chạy: nhom_lech = 1 so với 2, thiếu nhóm M**
  Người dùng thấy gì: Chữ mô tả phép đo trong hồ sơ nghiệm thu ghi số nhóm lệch khác với số thật mà phép thử đang kiểm. Tính năng chạy đúng, nhưng người ký có thể đọc tiêu chí lệch với bằng chứng.
  Căn cứ: Chỉ là lệch chữ trong tài liệu, không làm sai dữ liệu người dùng và sửa lại sau rất rẻ.
  file: `_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **--bang-mau-thuan nuốt cờ kế tiếp làm đường tệp, kể cả --ghi**
  Người dùng thấy gì: Nếu người vận hành gõ thiếu đường tệp cho lệnh xuất bảng tin mâu thuẫn mà thêm cờ ghi, lệnh có thể ghi thật vào dữ liệu thay vì chỉ xuất bảng.
  Căn cứ: Hậu quả có thể ghi dữ liệu ngoài ý muốn nhưng chỉ khi gõ sai lệnh, và ghi thật vốn đã chờ lời riêng của người quyết; phát biểu ghi sai có thể được rút lại ở lượt sau.
  file: `pipeline/scripts/du-an-tren-tin-s03.mjs`
  severity: low
  Đề xuất: known-limits

- **ROLLBACK lỗi sẽ che mất lỗi gốc của giao dịch**
  Người dùng thấy gì: Hiếm khi kết nối hỏng giữa lúc ghi, thông báo lỗi có thể chỉ cho biết lỗi hoàn tác chứ không nói bước ghi nào hỏng. Dữ liệu vẫn không bị ghi dở.
  Căn cứ: Chỉ làm khó tìm nguyên nhân trong tình huống hiếm, không mất hay lộ dữ liệu, chạy lại là được.
  file: `pipeline/scripts/du-an-tren-tin-s03.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 — tuyên quét LỚP «mọi import» nhưng bộ quét chỉ bắt một dạng cú pháp (DAT-AC-8)**
  Người dùng thấy gì: Phép kiểm tự động chỉ phát hiện một cách viết khai báo phụ thuộc, nên sau này ai thêm lệnh gọi mạng bằng cách viết khác có thể không bị bắt. Hiện mã vẫn sạch.
  Căn cứ: Không ảnh hưởng người dùng hiện tại; rủi ro chỉ xuất hiện nếu sau này có người thêm gọi mạng, và vá bộ kiểm khi đó không đắt.
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính đứng một mình, không thể đỏ (ca DAT-thuần)**
  Người dùng thấy gì: Một phép kiểm tự động không bao giờ có thể báo đỏ nên không bảo vệ được gì. Người dùng không thấy ảnh hưởng.
  Căn cứ: Không tác động đến dữ liệu hay người dùng, chỉ là phép thử thừa.
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — «bảng không chứa chữ bài» chỉ kiểm vắng mặt, không đối chứng dương (DAT-AC-3)**
  Người dùng thấy gì: Phép kiểm rằng bảng tin mâu thuẫn không chứa nội dung bài có thể vẫn xanh dù sau này nội dung bài lọt vào bảng. Hiện bảng không chứa chữ bài.
  Căn cứ: Nếu sau này lọt chữ bài vào bảng thì chỉ là bảng nội bộ cho người duyệt, tự phát hiện và sửa được, chi phí vá thấp.
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — mã thoát 2 cho thiếu đường tệp không ghim thông điệp (DAT-AC-6 lệnh thật)**
  Người dùng thấy gì: Phép kiểm cho lệnh gõ thiếu đường tệp chỉ xác nhận lệnh dừng chứ chưa xác nhận thông báo lỗi nói đúng nguyên nhân. Người dùng thật chỉ thấy khác biệt nhỏ về lời báo lỗi.
  Căn cứ: Hậu quả rất nhẹ, không liên quan dữ liệu, chi phí sửa vượt lợi ích.
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Lệnh ghi field_assertions không mang run_id/changed_by, lệch khuôn ghi phát biểu đã có (r1 · tệp đã đổi)**
  Người dùng thấy gì: Các dự án gắn lên tin vẫn đúng, nhưng sau này khó truy ra một dòng gắn dự án hay rút dự án thuộc lượt chạy nào.
  Căn cứ: Không làm sai dữ liệu hay lộ gì, chỉ làm việc truy vết khó hơn; thêm nhãn lượt chạy về sau rẻ và không ảnh hưởng dữ liệu đã ghi.
  file: `pipeline/scripts/du-an-tren-tin-s03.mjs`
  severity: low
  Đề xuất: known-limits

- **Phát biểu lớp observed từ chữ bài lấy observed_at = lúc chạy thay vì thời điểm đăng bài (r1 · tệp đã đổi)**
  Người dùng thấy gì: Thời điểm ghi nhận dự án của một bài tính theo lúc chạy lệnh chứ không theo lúc bài được đăng, nên mốc thời gian có thể lệch.
  Căn cứ: Dự án gắn vào tin vẫn đúng và người dùng không thấy khác biệt; chỉ ảnh hưởng phân tích theo trục thời gian sau này, sửa được ở lần chạy xét lại.
  file: `pipeline/scripts/du-an-tren-tin-s03.mjs`
  severity: low
  Đề xuất: known-limits

- **Fixture viết tay đúng khuôn bên đọc (hình dạng 2): nhãn bạc chỉ dựng theo khuôn {o:{project}} mà docDuLieu đọc, không round-trip từ các writer silver_labels thật (r1 · tệp đã đổi)**
  Người dùng thấy gì: Chưa kiểm được trường hợp bài có nhãn ảnh hay nhãn ý định mới hơn che mất tên dự án trong nhãn cũ, nên một số bài có thể không được gắn dự án.
  Căn cứ: Hậu quả chỉ là bỏ sót một số tin chứ không gắn sai; lệnh chạy thử đếm trước khi ghi thật nên người duyệt thấy tỉ lệ phủ và xử lý được.
  file: `pipeline/scripts/du-an-tren-tin-s03.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
