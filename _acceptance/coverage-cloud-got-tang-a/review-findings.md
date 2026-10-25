# Review findings: coverage-cloud-got-tang-a (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kiểm khuôn khối freshness chỉ xét `code`; hàng sai khuôn vẫn ra phản hồi, còn try/catch quanh toCoverageRows là mã chết**
  Người dùng thấy gì: Nếu máy thu đẩy lên một khối độ tươi có hàng sai dạng (trạng thái lạ, thiếu số ngưỡng) thì trang API vẫn trả hàng đó như thể đã đo, thay vì báo «Chỉ đo ở máy thu». Hiện chỉ máy thu của chính ta ghi khối này nên khả năng gặp thấp.
  Căn cứ: Chỉ xảy ra khi bên ghi nội bộ gửi dữ liệu hỏng, người dùng không thấy tên nguồn thật nào bị lộ, và khi bên ghi được sửa thì số liệu tự đúng lại ở lần đẩy sau.
  file: `app/src/app/api/v1/ops/coverage/route.ts`
  severity: medium
  Đề xuất: known-limits

- **Kiểm khuôn khối freshness chỉ xét `code`: hàng sai khuôn vẫn trả state fresh/stale với trường rỗng, trong khi hợp đồng đòi state none**
  Người dùng thấy gì: Một hàng độ tươi chỉ có mã nguồn mà thiếu các số còn lại vẫn được trả ra kèm nhãn «tươi» hoặc «cũ», với các ô trống hoặc rỗng, nên người đọc có thể tưởng là đã đo.
  Căn cứ: Chỉ phát sinh khi dữ liệu máy thu đẩy lên bị hỏng bất thường, hậu quả là vài ô trống trên một API nội bộ cho vận hành, không lộ dữ liệu và tự hết khi lần đẩy sau đúng.
  file: `app/src/app/api/v1/ops/coverage/route.ts`
  severity: medium
  Đề xuất: known-limits

- **try/catch quanh toCoverageRows là nhánh chết và nuốt lỗi thành «Chỉ đo ở máy thu»**
  Người dùng thấy gì: Nếu sau này có lỗi lập trình ở khâu xử lý độ tươi, trang API sẽ lặng lẽ báo «Chỉ đo ở máy thu» thay vì báo lỗi thật, khiến khó phát hiện sự cố.
  Căn cứ: Hôm nay không gây sai kết quả nào cho người dùng, chỉ làm khó chẩn đoán trong tương lai, và việc dọn gọn này rẻ có thể làm kèm lần sửa khác.
  file: `app/src/app/api/v1/ops/coverage/route.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính đứng một mình, không ghim thông điệp): chiều đỏ AU12-AC-4 «bản sao không kiểm khuôn» chấp nhận mọi lỗi ném ra là 500**
  Người dùng thấy gì: Một bài kiểm tra tự thử xem việc bỏ kiểm khuôn có bị phát hiện không, nhưng nó có thể báo xanh nhầm nếu bản thử hỏng vì lý do khác. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ tin cậy của bộ kiểm.
  Căn cứ: Không ảnh hưởng người dùng và hiện bài kiểm vẫn chạy đúng; rủi ro chỉ là bỏ sót hồi quy về sau, có thể siết lại bất cứ lúc nào.
  file: `app/tests/coverage-cloud-got-tang-a.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
