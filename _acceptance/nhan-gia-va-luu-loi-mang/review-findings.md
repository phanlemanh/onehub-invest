# Review findings: nhan-gia-va-luu-loi-mang (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **«Lưu lại» sau khi mất kết nối có thể bỏ mất chỗ người gắn vừa sửa mà vẫn báo «Đã lưu nhãn»**
  Người dùng thấy gì: Nếu mạng đứt ngay sau khi máy thu đã ghi, người gắn sửa lại một ô rồi bấm «Lưu lại», màn vẫn báo «Đã lưu nhãn» và sang tin kế. Nhưng máy thu giữ giá trị của lượt đầu, còn chỗ vừa sửa bị bỏ mà không ai hay.
  Căn cứ: Chỉ xảy ra khi mạng đứt đúng lúc đã ghi rồi người gắn lại sửa tiếp, nên hiếm; hậu quả là một nhãn lệch so với ý người gắn mà họ không biết, nhưng có thể gắn lại ở lượt rà sau.
  file: `app/src/components/ops/labels/luu-nhan.tsx`
  severity: medium
  Đề xuất: known-limits

- **409 «Anh đã gắn tin này» luôn được coi là đã lưu: nhãn vừa sửa bị bỏ mà vẫn báo «Đã lưu nhãn»**
  Người dùng thấy gì: Khi người gắn đã gắn tin này rồi (do lượt trước mất phản hồi hoặc mở hai tab), lượt gắn mới với giá trị khác vẫn được báo «Đã lưu nhãn» dù không ghi gì. Người gắn tưởng nhãn mới đã vào trong khi máy thu vẫn giữ nhãn cũ.
  Căn cứ: Hiếm gặp và chỉ lệch một nhãn mỗi lần, nhưng người gắn không có dấu hiệu nào để phát hiện; trước đây họ được báo là lượt không vào.
  file: `app/src/components/ops/labels/luu-nhan.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — assert «chuỗi có mặt» /Lưu lại/ trong khi lời hứa là có NÚT «Lưu lại»**
  Người dùng thấy gì: Phép kiểm tự động chỉ xác nhận chữ «Lưu lại» xuất hiện trong thông báo mất mạng, chưa chứng minh có nút bấm. Nếu sau này nút bị gỡ mà chữ hướng dẫn còn, kiểm thử vẫn xanh và người gắn sẽ không còn cách bấm lưu lại.
  Căn cứ: Hiện nút vẫn có mặt nên người dùng chưa bị ảnh hưởng; rủi ro chỉ là lần sửa sau có thể làm mất nút mà không bị báo, và bổ sung kiểm thử sau này rẻ.
  file: `app/tests/labels-gia.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận dấu ngăn nghìn thiếu phần tử đã khai viết trước (diện tích «4.350»)**
  Người dùng thấy gì: Bộ kiểm tự động thiếu một ca thử cho ô diện tích với dạng «4.350». Hành vi chặn dấu ngăn nghìn ở diện tích vẫn được thử qua dạng «1.200» nên người dùng không bị ảnh hưởng.
  Căn cứ: Cùng một luật chặn đã được kiểm bằng các ca khác ở ô diện tích, nên khả năng sót lỗi thật rất thấp và không đáng mở thêm việc.
  file: `app/tests/labels-gia.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3 — ca 400 chỉ kiểm nhãn kind, không kiểm lỗi được chuyển đúng ô giá**
  Người dùng thấy gì: Phép kiểm tự động chưa xác nhận lỗi giá được chuyển đúng vào ô giá, chỉ xác nhận có loại lỗi theo trường. Nếu sau này lỗi bị gắn sai ô hoặc rỗng, người gắn sẽ không thấy chỗ sai dưới ô mà test vẫn xanh.
  Căn cứ: Hiện hành vi đúng và đã được kiểm ở màn thật theo AC-4; rủi ro chỉ là lần sửa sau có thể hỏng mà không bị phát hiện, người dùng tải lại được và sửa sau rẻ.
  file: `app/tests/labels-gia.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng đỏ «LOI MANG BI NUOT» chỉ là assert.rejects trơn, không ghim thông điệp, không chạy lại phép đo chính**
  Người dùng thấy gì: Phép đối chứng cho thấy kiểm thử biết đỏ khi lỗi mạng bị nuốt, nhưng chưa ghim đúng lý do. Người dùng không bị ảnh hưởng gì.
  Căn cứ: Chỉ là độ chặt của phép tự kiểm, không ảnh hưởng người dùng hay dữ liệu, và chi phí sửa vượt xa lợi ích.
  file: `app/tests/labels-gia.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
