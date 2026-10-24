# Review findings: deals-api-tam-dong (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **smoke-deals-api.mjs ghi user role=ops + phiên vào bất kỳ DATABASE_URL nào, không có rào chỉ-local như mẫu sẵn có**
  Người dùng thấy gì: Nếu máy đang trỏ vào cơ sở dữ liệu thật mà ai đó chạy bài kiểm tra này quên cờ chỉ-đọc, nó sẽ tạo một tài khoản quản trị nội bộ kèm phiên đăng nhập còn hạn trên dữ liệu thật. Người dùng cuối không bị ảnh hưởng ngay, nhưng đó là một tài khoản có quyền cao nằm lại ngoài ý muốn.
  Căn cứ: Chỉ xảy ra khi người vận hành chạy nhầm, không ảnh hưởng người dùng cuối, và tài khoản thừa xoá được; nhưng vì chạm dữ liệu thật nên nên ghi lại làm hạn chế đã biết.
  file: `scripts/smoke-deals-api.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình, không thể đỏ): ca 'AC-3 token máy chủ thiếu' có 3/4 tổ hợp rỗng nghĩa**
  Người dùng thấy gì: Một bài kiểm tra tự động cho trường hợp máy chủ chưa đặt mã truy cập vẫn báo xanh dù ai đó lỡ gỡ bỏ rào chắn đó sau này. API vẫn đóng như thiết kế hiện nay, nhưng một lần sửa sai trong tương lai có thể lọt mà không ai biết.
  Căn cứ: Hiện không ảnh hưởng người dùng vì rào đang hoạt động đúng, chỉ làm giảm khả năng bắt lỗi về sau, và sửa sau vẫn rẻ.
  file: `app/tests/deals-api-guard.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đích đo gắn cứng, không gắn với cây đang kiểm): smoke mặc định gọi localhost:3456 mà không xác minh máy chủ chạy từ worktree**
  Người dùng thấy gì: Bài kiểm tra trực tiếp có thể đang đo nhầm phiên bản chạy của thư mục khác trên cùng máy, nên kết quả xanh chưa chắc phản ánh đúng bản đang được nghiệm thu. Người ký có thể tin vào bằng chứng không đúng với bản sắp phát hành.
  Căn cứ: Rủi ro chỉ xuất hiện khi hai bản cùng chạy trên một máy và người kiểm có thể tự tránh bằng cách đảm bảo đúng bản đang chạy, nên ghi lại hạn chế là đủ.
  file: `scripts/smoke-deals-api.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
