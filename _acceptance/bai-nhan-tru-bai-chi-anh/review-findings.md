## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(Không có muc moi ở round 2. 10 muc ngoai hop dong round truoc duoc may tu chen, mang nhan (r1).)

- **Rào DB thử của do-nhanh-bai-s03 chỉ chặn đúng một tên, khác mẫu chỉ-cho-phép sẵn có của repo (r1)**
  Người dùng thấy gì: Công cụ đo nội bộ có thể ghi vào một kho dữ liệu không phải kho thử nếu chạy nhầm. Người dùng cổng không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ vì chỉ người vận hành chạy tay mới gặp, trên cloud lệnh sẽ lỗi trước khi ghi, và sửa sau rất rẻ.
  file: `pipeline/scripts/do-nhanh-bai-s03.mjs`
  severity: low
  Đề xuất: known-limits

- **Màu chặng «Yêu cầu» dùng màu palette thô, không có cặp dark và dưới 3:1 trên nền card sáng (r1)**
  Người dùng thấy gì: Màu của chặng «Yêu cầu» trên biểu đồ hơi nhạt ở giao diện sáng và lệch tông giữa chú giải với thanh ở giao diện tối. Số liệu vẫn đúng.
  Căn cứ: Chỉ là độ dễ nhìn trên trang vận hành, không mất hay sai dữ liệu, và đổi màu sau rất rẻ.
  file: `app/src/components/ops/data-flow/stage-face.tsx`
  severity: low
  Đề xuất: known-limits

- **Thước E10 gạt bài thử khác bộ nhánh: thiếu dấu «noi-dung», nên có thể báo đỏ giả ANH LECH DEM SQL (r1)**
  Người dùng thấy gì: Công cụ đối chiếu số có thể báo lệch giả khi có bài thử chỉ chứa đường link thử nghiệm. Số hiển thị cho người dùng không sai.
  Căn cứ: Chỉ gây báo động giả cho người vận hành, không làm sai số trên cổng, và người đọc kết quả tự nhận ra được.
  file: `pipeline/scripts/do-nhanh-bai-s03.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — chỉ assert «chuỗi có mặt» trong khi lời hứa là quan hệ (ô «Đọc được» của Chặng theo ngày) (r1)**
  Người dùng thấy gì: Bài thử tự động kiểm ô «Đọc được» theo ngày hơi lỏng, nên nếu sau này ô ghi sai số thì có thể không bị bắt. Hiện số trên màn hình chưa thấy sai.
  Căn cứ: Rủi ro nằm ở việc sai sót tương lai lọt qua, không phải lỗi hiện tại, và siết bài thử sau không tốn nhiều.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — đo hàm phụ với cờ do test tự chọn, không đo đầu ra của biểu đồ (đường ngày «Đọc được») (r1)**
  Người dùng thấy gì: Bài thử không đọc trực tiếp đường «Đọc được» theo ngày mà biểu đồ vẽ, nên một lỗi vẽ sai sau này có thể không bị phát hiện.
  Căn cứ: Chưa có sai số thật với người dùng, chỉ là lưới an toàn mỏng, và bổ sung sau rẻ.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng dương rỗng: `S05.received >= 2` đã đúng sẵn từ fixture chung (r1)**
  Người dùng thấy gì: Bài thử khẳng định nguồn S05 không bị đổi số nhưng phần đối chứng chưa thật sự chứng minh bài mới đã được đếm. Người dùng chưa thấy số sai.
  Căn cứ: Chỉ làm bài thử kém sắc, không ảnh hưởng dữ liệu hiển thị, và sửa bài thử sau rất rẻ.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — lời hứa nêu S05, S06, S01 nhưng phép đo chỉ có S05, S06 (r1)**
  Người dùng thấy gì: Hàng nguồn S01 trong lưới chất lượng chưa được bài thử tự động kiểm, nên nếu bị đổi số nhầm thì có thể không ai thấy ngay.
  Căn cứ: Chưa thấy lỗi thật, chỉ thiếu một lớp kiểm, và thêm ca thử sau không tốn kém.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — «mọi khoá khác bằng lượt qua bộ chạy» nhưng chỉ so sources (r1)**
  Người dùng thấy gì: Khi làm tươi ở chế độ trần, bài thử chỉ so số theo nguồn chứ chưa so số theo ngày, nhóm; chênh lệch ở đó có thể lọt. Chưa thấy chênh lệch thật.
  Căn cứ: Rủi ro thấp vì hai đường chạy dùng cùng phần tính, và bổ sung phép so sau rất rẻ.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — khối null nhánh: chỉ kiểm có thuộc tính title, không kiểm giá trị % (r1)**
  Người dùng thấy gì: Với dữ liệu đời trước chưa có nhánh, bài thử chỉ kiểm nhãn của ô tỉ lệ chứ không kiểm con số, nên tỉ lệ ghi sai dưới nhãn đúng có thể lọt.
  Căn cứ: Chỉ là lưới kiểm lỏng cho trường hợp dữ liệu cũ hiếm gặp, không mất dữ liệu, và siết lại sau rẻ.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — so cloud với máy thu bằng đẳng thức, không neo giá trị là số (r1)**
  Người dùng thấy gì: Bài thử xác nhận bản cloud giống máy thu nhưng nếu cả hai cùng mất số thì vẫn báo xanh. Chưa thấy bản cloud thiếu số thật.
  Căn cứ: Rủi ro chỉ khi cả hai phía cùng hỏng, hiếm gặp, và thêm phép neo giá trị sau rất rẻ.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
