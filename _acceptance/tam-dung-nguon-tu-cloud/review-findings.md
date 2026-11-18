## Trong hợp đồng

(không có finding nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bấm Duyệt/Từ chối thất bại mà không báo gì — trái luật ReUI 5 về lỗi tại chỗ**
  Người dùng thấy gì: Khi bấm Duyệt hoặc Từ chối mà bị từ chối (ví dụ admin khác vừa duyệt rồi), màn không báo gì, chỉ tải lại và dòng lệnh đứng nguyên nên trông như nút không ăn.
  Căn cứ: Không mất dữ liệu và người dùng tự tải lại sẽ thấy trạng thái thật, nhưng dễ gây bối rối; sửa nhỏ và rẻ, có thể làm ở đợt sau.
  file: `app/src/components/ops/collections/lenh-gan-day.tsx`
  severity: medium
  Đề xuất: known-limits

- **Duyệt/Từ chối nuốt mọi lỗi: fetch lỗi bị .catch(() => null), phản hồi không ok (403/409 can-nguoi-thu-hai, 409 đã quyết) bị bỏ qua**
  Người dùng thấy gì: Nếu mạng lỗi hoặc không đủ quyền khi duyệt lệnh Tạm dừng S03, người bấm không biết lần bấm đã thất bại và vì sao.
  Căn cứ: Lệnh không bị áp sai, chỉ thiếu lời giải thích; người dùng thử lại hoặc tải lại là thấy, nên mức ảnh hưởng nhẹ đến vừa.
  file: `app/src/components/ops/collections/lenh-gan-day.tsx`
  severity: medium
  Đề xuất: known-limits

- **Duyệt lệnh S03 Bật lại xoá mất lý do: route decide ghi đè cột note bằng NULL**
  Người dùng thấy gì: Sau khi admin thứ hai duyệt lệnh Bật lại nguồn S03, cột Lý do ở Lệnh gần đây hiện dấu gạch thay vì lý do người gửi đã nhập.
  Căn cứ: Mất lý do vĩnh viễn nhưng chỉ với lệnh Bật lại S03 và chỉ là thông tin ghi chú, không ảnh hưởng việc áp lệnh; lý do còn ở nhật ký gửi nên sửa sau vẫn rẻ.
  file: `app/src/app/api/v1/ops/change-requests/route.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — chỉ kiểm chuỗi có mặt trong khi lời hứa là quan hệ: actor phải bằng mã phiên của chính người xem**
  Người dùng thấy gì: Bài kiểm tra có thể không bắt được trường hợp màn lấy nhầm người dùng để ẩn nút Duyệt, nên một lỗi sau này có thể lọt qua mà vẫn xanh.
  Căn cứ: Người dùng cuối không thấy gì hiện nay; chỉ làm yếu lưới an toàn về sau, siết lại là sửa một dòng bất cứ lúc nào.
  file: `app/tests/dinh-danh-thu.test.tsx`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 4 — assertion âm tính một mình, không ghim thông điệp: lỗi nào cũng bị catch biến thành 500 rồi chỉ kiểm 'đếm không đổi'**
  Người dùng thấy gì: Bài kiểm tra việc hoàn tác khi ghi nhật ký hỏng có thể xanh dù lỗi xảy ra sai chỗ, nên chưa chắc chứng minh được lệnh không bị lưu dở.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm bằng chứng kiểm thử yếu hơn mức mong muốn; chi phí siết lại thấp nếu sau này cần.
  file: `app/tests/tam-dung-nguon.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
