# Review findings: ops-duyet-nhip-va-chu (round 2)

## Trong hợp đồng

- **Alert «Không tìm thấy thẻ» không hiện khi hàng duyệt rỗng**
  AC: AC-10
  file: `app/src/components/ops/review/review-queue.tsx:971`
  severity: low
  source: bugs
  detail: Lệnh `if (items.length === 0) return <ReviewQueueEmpty />` chạy trước khối thieuThe. Khi hàng duyệt chưa có thẻ nào mà người dùng mở /ops/review?card=123 (hoặc ?card=abc), trang chỉ hiện trạng thái rỗng, không có Alert. Như vậy là trái hợp đồng ghi ở prop moBanDau («không có → Alert») và ở docCard («danh sách báo Không tìm thấy thẻ»): liên kết sâu hỏng mà không có thông báo nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Comment mới ghi review_queue là tầng A, trái luật 6 đã sửa ngày 26/10**
  Người dùng thấy gì: Một chú thích nội bộ cho lập trình viên còn ghi sai mức bí mật của thẻ duyệt. Người dùng không thấy gì trên màn hình.
  Căn cứ: Không ảnh hưởng người dùng và không làm lộ dữ liệu nào, chỉ có thể gây hiểu nhầm cho người đọc mã về sau, sửa lúc nào cũng rẻ.
  file: `app/src/lib/ops/review-nap.ts`
  severity: low
  Đề xuất: wont-fix

- **Bản đồ route chưa cập nhật nhãn «Đang chờ ghép» và liên kết sang /ops/review trên /ops/deals**
  Người dùng thấy gì: Tài liệu mô tả các trang Ops chưa nhắc nhãn «Đang chờ ghép» và liên kết sang thẻ ghép. Màn hình chạy đúng, chỉ có tài liệu nội bộ lệch.
  Căn cứ: Không đụng tới dữ liệu hay thao tác của người dùng, chỉ làm trợ lý và người làm sau đọc tài liệu cũ, cập nhật sau rất rẻ.
  file: `.claude/skills/onehub-ui/routes.md`
  severity: low
  Đề xuất: known-limits

- **Trạng thái trống của Frame «Nhịp duyệt 7 ngày» có thể không có hành động nào**
  Người dùng thấy gì: Khi hàng duyệt đã hết thẻ chờ và 7 ngày qua không có lượt đo, khung Nhịp duyệt chỉ hiện chữ trống, không có nút nào để bấm.
  Căn cứ: Trường hợp hiếm và vô hại, vì hết thẻ chờ thì người duyệt chẳng còn việc gì để làm tiếp.
  file: `app/src/components/ops/review/review-nhip.tsx`
  severity: low
  Đề xuất: known-limits

- **fmtGiay có thể in «1 phút 60 giây»**
  Người dùng thấy gì: Ở bảng Nhịp duyệt, một số thời gian gần tròn phút có thể hiện «1 phút 60 giây» thay vì «2 phút». Số liệu vẫn đúng nhưng cách viết trông sai.
  Căn cứ: Chỉ là lỗi trình bày nhỏ trên số đo, không mất hay sai dữ liệu, người dùng vẫn hiểu được và sửa sau rất rẻ.
  file: `app/src/components/ops/review/review-nhip.tsx`
  severity: low
  Đề xuất: new-contract

- **Bấm lại liên kết ?card= trùng URL hiện tại không mở lại sheet**
  Người dùng thấy gì: Sau khi đóng thẻ, bấm lại «Mở thẻ chờ cũ nhất» hay «Mở thẻ ghép» cho cùng thẻ có thể không làm gì. Người dùng phải tải lại trang hoặc bấm thẻ trong danh sách.
  Căn cứ: Không mất dữ liệu và người dùng tự mở lại được bằng cách tải lại hoặc bấm thẻ trong danh sách, nhưng dễ gây khó chịu và nên sửa ở một việc riêng.
  file: `app/src/components/ops/review/review-queue.tsx`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 3 (và 2): nút «Mở thẻ chờ cũ nhất» chỉ đo việc component lặp lại prop viết tay, không đo quan hệ với thẻ chờ tạo sớm nhất**
  Người dùng thấy gì: Bài kiểm tự động cho nút «Mở thẻ chờ cũ nhất» chưa chặn được việc sau này nút trỏ nhầm sang thẻ khác. Hiện tại nút vẫn hoạt động đúng.
  Căn cứ: Chưa có lỗi nào xảy ra với người dùng, chỉ là lưới an toàn còn lỏng, có thể bổ sung kiểm thử sau mà không ảnh hưởng ai.
  file: `app/tests/ops-duyet-nhip.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: OD1-AC-1-UI đọc `sent.at(-1)` mà không ràng lời gọi đó với thẻ vừa bấm**
  Người dùng thấy gì: Bài kiểm tự động chưa chắc bắt được trường hợp một nút quyết định không gửi gì đi, vì nó có thể đọc nhầm lần gửi của thẻ trước. Chức năng hiện tại vẫn chạy.
  Căn cứ: Chưa có hỏng hóc thực tế với người dùng, chỉ là kiểm thử bỏ sót một kiểu lỗi có thể xảy ra về sau và bổ sung lúc nào cũng rẻ.
  file: `app/tests/ops-duyet-nhip.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: probe OD1-AC-5-DB tự chép lại đường nạp của trang thay vì gọi bộ nạp thật loadReviewQueue**
  Người dùng thấy gì: Bài kiểm việc ẩn điểm Stage B chạy trên bản chép tay của cách nạp thẻ, nên nếu cách nạp thật đổi, bài kiểm có thể không báo. Trang hiện tại vẫn ẩn điểm đúng.
  Căn cứ: Chưa có điểm nào lộ ra trên trang, chỉ là kiểm thử có thể bỏ sót về sau, và bổ sung kiểm thử không động tới người dùng.
  file: `app/tests/ops-duyet-nhip.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: kiểm âm «không còn ô Ảnh hỏng» chưa từng được cho chạy đỏ, dù eval hứa chiều đỏ 'CON O ANH HONG'**
  Người dùng thấy gì: Bài kiểm xác nhận không còn ô «Ảnh hỏng» chưa từng được thử cho chạy đỏ. Màn hình hiện tại vẫn đúng.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm bằng chứng kiểm thử yếu hơn lời hứa, chi phí thêm ca đột biến nhỏ nhưng lợi ích thấp.
  file: `app/tests/ops-duyet-nhip.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4: chiều đỏ 'SAI DINH DANG SO' không ghim thông điệp, regex nhận mọi lỗi OD1-AC-6**
  Người dùng thấy gì: Bài kiểm tra cột So («Khớp», «Lệch», «Thiếu») chấp nhận nhiều kiểu hỏng khác nhau mà không chỉ rõ lỗi nào. Cột So trên màn hình vẫn đúng.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm thông báo lỗi của kiểm thử kém rõ khi có sự cố, sửa không đáng công.
  file: `app/tests/ops-duyet-nhip.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
