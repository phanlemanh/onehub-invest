## Trong hợp đồng

- **Hình dạng 5 — tên ca tuyên quét LỚP «chín hàng khác không chuẩn hoá» nhưng chỉ có 2 điểm-case, còn đối chứng E5 thì không phân biệt được rò rỉ**
  file: `app/tests/the-duyet-phuong-lech-gia.test.tsx:141`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Tên ca TPL-AC-4 (dòng 145) và E4/E5 trong evals.yaml hứa phép chuẩn hoá phường không lan sang chín hàng còn lại. Trong ca chỉ có hai assert: street 'Đường Phan Văn Trị'↔'Phan Văn Trị' và block 'P. A1'↔'A1' (dòng 141-143). Không có ma trận viết trước theo từng hàng (9 phần tử, số assert = 9). Đối chứng E5 dựa vào ma trận TD-AC-2 của the-duyet-du-can-cu.test.tsx (GIA_TRI, dòng 160-163), nhưng mọi cặp trong đó cho cùng kết quả dù so bằng khoá cũ hay khoaPhuong: số chỉ gồm chữ số nên rơi về soGiaTri; 'Lạc Long Quân'/'Âu Cơ', 'A1'/'B2', '12'/'8', 'apartment'/'house' không có tiền tố hay chỗ chỉ khác dấu. Vì vậy E5 không bắt được rò rỉ. Ví dụ, một đột biến áp soPhuong cho floor và property_type nhưng chừa street/block (floor 'Tầng 12'↔'tang-12' thành Khớp) sẽ qua cả TPL-AC-4 lẫn E5. Lời hứa về cả lớp chỉ được đo ở 2/9 hàng.
  rationale: AC-4 hứa rõ «chín hàng còn lại so như trước vòng», mà phép đo chỉ chạm 2/9 hàng và đối chứng không bắt được rò rỉ, nên lời hứa này của AC-4 chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 — assert «chuỗi có mặt» t.includes("Phường") để chứng minh có nhãn hàng luôn đúng nhờ chính giá trị, nên không đo gì**
  Người dùng thấy gì: Nếu nhãn «Phường» bị mất hoặc hai giá trị bị đảo cột trên thẻ duyệt, bài kiểm tra vẫn báo đạt. Người duyệt vẫn thấy badge Khớp/Lệch đúng, chỉ là cách bố trí hàng không được kiểm chặt.
  Căn cứ: Hậu quả nhẹ: kết quả Khớp/Lệch người dùng nhìn thấy vẫn đúng, không mất hay lộ dữ liệu, và siết lại bài kiểm tra sau này rẻ, không cần đụng tới tính năng.
  file: `app/tests/the-duyet-phuong-lech-gia.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture evidence của TPL-AC-5 viết tay theo khuôn bên đọc (ReviewEvidence) thay vì rút từ bên ghi**
  Người dùng thấy gì: Hiện thẻ duyệt hiển thị đúng. Nhưng nếu sau này phần sinh thẻ đổi tên trường phường, một bài kiểm tra sẽ không báo, và hàng Phường có thể trống hoặc báo Thiếu mà không ai hay.
  Căn cứ: Chưa gây lỗi nào đang xảy ra, nếu có sự cố thì người duyệt thấy ngay trên màn hình và dữ liệu không bị mất; ghi lại làm hạn chế đã biết là đủ cho tới khi bên sinh thẻ được sửa.
  file: `app/tests/the-duyet-phuong-lech-gia.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
