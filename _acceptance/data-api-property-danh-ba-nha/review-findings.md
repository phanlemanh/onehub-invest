# Review findings: data-api-property-danh-ba-nha (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Route Property công khai đọc source_registry, bảng tầng A mà leak gate buộc phải vắng hoặc rỗng ở cloud**
  Người dùng thấy gì: Khi danh bạ nhà được đưa lên mạng sau này, tra cứu theo dự án và tra theo mã căn có thể báo lỗi chung chung thay vì báo danh bạ chưa sẵn sàng. Hiện tại API chỉ chạy trên máy thu nên khách chưa gặp.
  Căn cứ: Chưa ai bị ảnh hưởng vì danh bạ chưa lên mạng, và việc này gắn liền với hàng đưa danh bạ lên mạng nên sửa ở đó sẽ rẻ hơn.
  file: `data-api/src/routes/properties.ts`
  severity: medium
  Đề xuất: known-limits

- **Đường Property phụ thuộc source_registry (tầng A, không bao giờ sync lên cloud), nên khi danh bạ lên cloud mọi request ra 500 thay vì 503**
  Người dùng thấy gì: Sau khi danh bạ lên mạng, khách có thể nhận lỗi chung chung ở tra cứu theo dự án và theo mã căn, không có thông báo rõ danh bạ chưa sẵn sàng. Hiện chỉ chạy trên máy thu nên chưa gặp.
  Căn cứ: Lỗi chỉ xuất hiện ở môi trường chưa có khách, khách tự thử lại cũng không hết, nhưng sửa cùng lúc với hàng đồng bộ lên mạng thì rẻ và đúng chỗ.
  file: `data-api/src/routes/properties.ts`
  severity: medium
  Đề xuất: known-limits

- **Danh sách mã nguồn được cache vĩnh viễn, kể cả khi rỗng, nên chặn SOURCE_CODE_NOT_ACCEPTED âm thầm mất tác dụng**
  Người dùng thấy gì: Nếu có nguồn mới được thêm khi máy chủ đang chạy, việc chặn khách nhập mã nguồn có thể không áp dụng cho nguồn đó cho tới khi khởi động lại. Khách có thể nhận kết quả rỗng thay vì báo lỗi rõ ràng.
  Căn cứ: Hậu quả nhẹ, không làm lộ dữ liệu, và khởi động lại máy chủ là hết.
  file: `data-api/src/routes/properties.ts`
  severity: low
  Đề xuất: known-limits

- **propertySubType kiểm bằng toán tử `in`, nên đi theo cả chuỗi prototype**
  Người dùng thấy gì: Về lý thuyết, nếu dữ liệu loại căn có một chữ đặc biệt của ngôn ngữ lập trình, phần loại căn sẽ biến mất khỏi kết quả trả về của căn đó. Dữ liệu thật không có giá trị như vậy.
  Căn cứ: Gần như không thể xảy ra với dữ liệu thật và chỉ làm mất một trường của một căn, không lộ gì.
  file: `data-api/src/routes/properties.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình 5 — tuyên ma trận thứ tự tên toà đủ mọi cặp liền kề nhưng thiếu cặp S09 > S08**
  Người dùng thấy gì: Bài kiểm tra chưa chứng minh được thứ tự ưu tiên giữa hai nguồn tên toà đứng đầu. Nếu sau này ai đó đổi thứ tự này nhầm, tên toà hiển thị cho khách có thể đổi mà không bị bắt.
  Căn cứ: Hiện tên toà đang hiển thị đúng, rủi ro chỉ xuất hiện khi có thay đổi sau này và việc bổ sung ca kiểm thử rẻ.
  file: `data-api/test/properties.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 4 — ca «không tham số tầng nào được nhận» chỉ khẳng định âm tính, không có căn đối chứng ở tầng 8 hay 10**
  Người dùng thấy gì: Bài kiểm tra việc không dò được căn khác bằng cách đổi tầng có thể vẫn xanh dù route có lộ. Hiện chưa có bằng chứng route thực sự lộ căn nào.
  Căn cứ: Rủi ro là bỏ sót một lỗi lộ căn nếu có, nhưng hiện chưa có dấu hiệu lộ và bổ sung căn đối chứng sau này rẻ.
  file: `data-api/test/properties.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
