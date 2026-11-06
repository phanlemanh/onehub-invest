# Review findings: dau-luoc-do-ban-mau (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kết nối qt không đóng khi DROP/CREATE DATABASE lỗi: lệnh DL- treo vô hạn thay vì báo đỏ**
  Người dùng thấy gì: Khi bước dựng DB riêng cho bộ kiểm thử gặp lỗi hiếm (thiếu quyền, DB trùng tên bỏ dở), lệnh kiểm thử có thể đứng im mãi thay vì báo đỏ ngay. Người chạy phải tự tắt tiến trình rồi chạy lại.
  Căn cứ: Chỉ xảy ra khi môi trường thử đã hỏng sẵn, không mất hay lộ dữ liệu, người chạy tự dừng và thử lại được; chỉ tốn thời gian chờ.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture lỗi viết tay theo đúng khuôn của laLoiKhongNoi, còn nhánh gọi nó trong chayMaTran thì không ca nào đo**
  Người dùng thấy gì: Nếu sau này ai đó vô tình sửa phần xử lý lỗi kết nối, máy sai mật khẩu có thể bị coi như không có server và bộ kiểm thử im lặng bỏ qua rồi báo xanh. Hiện hành vi đang đúng, chỉ chưa có ca canh giữ.
  Căn cứ: Hiện chưa có lỗi thật nào xảy ra với người dùng, chỉ là thiếu một lớp canh giữ cho lần sửa sau; thêm ca này sau cũng rẻ và không mất dữ liệu.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: tập lỗi được bỏ qua có 5 mã nhưng ca chỉ kiểm 3 mã dương và không ghim cả tập**
  Người dùng thấy gì: Bộ kiểm thử chỉ thử ba trong năm loại lỗi không-nối-được được phép bỏ qua. Nếu ai thêm loại lỗi khác vào danh sách, việc bỏ qua lặng lẽ có thể rộng hơn dự định mà không ai hay.
  Căn cứ: Hậu quả nhẹ và chỉ xuất hiện khi có người sửa danh sách sau này, không ảnh hưởng người dùng cuối; chi phí sửa thấp nhưng lợi ích cũng nhỏ nên chỉ cần ghi nhận.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Ca DL- dùng biến DL_PG_ADMIN tự đặt, không theo quy ước TEST_DATABASE_URL_ADMIN của các test tự CREATE DATABASE (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trên máy dùng Postgres ở địa chỉ khác, bộ kiểm lược đồ thử nối nhầm chỗ nên không chạy được. Trên máy thường và trên CI thì không ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng cách cấu hình test ở máy lạ, không mất dữ liệu và CI vẫn xanh, nên ghi lại là đủ.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: docker giả trả một dòng nên DL-AC-8 ghim định dạng `--dau` trái với đầu ra thật (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó vô tình bỏ dòng báo chế độ chỉ đọc khỏi lệnh in dấu, bài kiểm nhanh vẫn xanh. Chỉ phép đo trên DB thật mới phát hiện.
  Căn cứ: Phép đo trên DB thật vẫn bắt được lỗi này nên rủi ro thấp, và sửa sau không tốn kém.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — đếm đủ ma trận là phép đếm rỗng: `dem` luôn bằng độ dài mảng nó vừa lặp, không ghim số phần tử viết trước (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó xoá bớt một tình huống khỏi danh sách kiểm, bộ kiểm vẫn xanh và không báo thiếu độ phủ.
  Căn cứ: Chỉ làm yếu khả năng phát hiện việc xoá ca về sau, người dùng không bị ảnh hưởng, và dễ bổ sung khi cần.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: «test chỉ nối DB của nó» kiểm danh sách tự ghi của hàm noi(), không kiểm kết nối thật trên máy chủ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bộ kiểm khẳng định chỉ chạm DB riêng của nó dựa trên chính lời khai, nên khó phát hiện nếu có kết nối lạc sang DB khác.
  Căn cứ: Hiện chưa có dấu hiệu nối nhầm DB thật, nên rủi ro thấp và đo kỹ hơn sau cũng không đắt.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
