# Review findings: anh-goc-qua-may-chu (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Proxy ảnh gốc nhận mọi image/* (kể cả image/svg+xml) và trả lại content-type của nguồn trên cùng origin, lệch khỏi danh sách MIME cho phép sẵn có**
  Người dùng thấy gì: Nếu một nguồn tin rao trả về ảnh dạng vector có chứa mã độc, người vận hành mở thẳng ảnh ở tab mới có thể bị chạy mã trong phiên đăng nhập của họ. Ảnh hiển thị bình thường trên thẻ duyệt thì không bị ảnh hưởng.
  Căn cứ: Hậu quả có thể nặng vì liên quan phiên đăng nhập vận hành, nhưng chỉ xảy ra khi nguồn độc hại và người dùng mở ảnh trực tiếp; sửa sau rẻ và không làm mất dữ liệu, nên đáng làm thành việc riêng.
  file: `app/src/lib/ops/lay-anh-goc.ts`
  severity: medium
  Đề xuất: new-contract

- **Bộ chặn SSRF bỏ sót các dải IPv6 nhúng IPv4 và vài dải IPv4 dành riêng**
  Người dùng thấy gì: Máy chủ có thể bị lừa lấy ảnh từ một số địa chỉ mạng nội bộ ít gặp, nhưng chỉ khi mạng của máy thu có cấu hình đặc biệt. Người dùng bình thường không thấy gì khác.
  Căn cứ: Rủi ro thấp vì phụ thuộc cấu hình mạng hiếm và chỉ vai vận hành mới gọi được; không mất dữ liệu, có thể ghi lại làm hạn chế đã biết rồi vá sau.
  file: `app/src/lib/ops/lay-anh-goc.ts`
  severity: low
  Đề xuất: known-limits

- **Proxy ?media= trả nguyên mọi content-type image/* (kể cả image/svg+xml) trên cùng origin app, không có nosniff hay CSP**
  Người dùng thấy gì: Một ảnh độc hại từ nguồn bên ngoài có thể chạy mã khi người vận hành mở ảnh trực tiếp, ngay trong phiên đăng nhập của họ. Xem ảnh trên thẻ duyệt thì an toàn.
  Căn cứ: Hậu quả tiềm tàng nặng với phiên vận hành nhưng cần nguồn độc hại cộng với thao tác mở ảnh trực tiếp; sửa rẻ, không mất dữ liệu, nên mở việc riêng.
  file: `app/src/lib/ops/lay-anh-goc.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (đối chứng dương rỗng): đối chứng của AGM-DC không thể đỏ**
  Người dùng thấy gì: Bài kiểm xác nhận tên máy nguồn không lọt ra trang có thể vẫn xanh dù bộ quét của nó không bắt được lỗi. Người dùng không thấy ảnh hưởng ngay, nhưng sau này nếu tên máy nguồn lộ ra thì bài kiểm có thể không báo.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ giảm độ tin của bài kiểm; các bài kiểm khác trong vòng vẫn phủ lộ tên máy nên ghi lại và cải thiện sau là đủ.
  file: `app/tests/anh-goc-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận không viết trước): ô kỳ vọng AGM-AC-2 sinh từ chính luật cần kiểm, phép đếm 15 luôn đúng**
  Người dùng thấy gì: Bài kiểm phân quyền xem ảnh tự suy kết quả mong đợi từ chính quy tắc đang chạy, nên nếu quy tắc sai thì bài kiểm có thể không phát hiện. Hiện chưa có dấu hiệu người dùng bị cấp quyền sai.
  Căn cứ: Mức nhẹ, chỉ làm bài kiểm kém chặt; quyền truy cập thực tế đang đúng theo hợp đồng và có thể viết lại ma trận tay sau mà không ảnh hưởng ai.
  file: `app/tests/anh-goc-qua-may-chu.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
