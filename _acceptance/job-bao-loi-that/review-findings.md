# Review findings — job-bao-loi-that (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **JOB_RC lấy giá trị từ môi trường thay vì luôn bắt đầu bằng 0**
  Người dùng thấy gì: Nếu có tiến trình cha đặt sẵn một mã lỗi trong môi trường, job đêm có thể báo hỏng dù mọi bước đều lành. Hiện lịch chạy tự động không đặt biến này nên chưa ai gặp.
  Căn cứ: Hậu quả nhẹ và hiện chưa xảy ra với cách chạy thật; không mất dữ liệu, chỉ có thể báo hỏng giả khi ai đó chạy tay trong môi trường lạ, và gặp thì thử lại là hết.
  file: `scripts/lib/job-step.sh`
  severity: low
  Đề xuất: known-limits

- **Phép đo không dọn cây tạm sau mỗi lượt chạy**
  Người dùng thấy gì: Mỗi lần chạy bộ kiểm tra, máy để lại một đống thư mục tạm không ai dọn, chiếm dần chỗ trên đĩa. Không ảnh hưởng tới kết quả hay dữ liệu của người dùng.
  Căn cứ: Chỉ tốn chút dung lượng ở thư mục tạm của máy và hệ điều hành tự dọn theo thời gian; không mất dữ liệu, không ảnh hưởng người dùng, sửa hay không cũng không đổi sản phẩm.
  file: `scripts/job-exit.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính một mình, không ghim thông điệp): hàng «DB tắt hẳn» của ma trận AC-3 vẫn xanh trên code trước thay đổi**
  Người dùng thấy gì: Phép kiểm khi cơ sở dữ liệu tắt hẳn vẫn báo xanh kể cả khi bản vá lần này bị gỡ ra. Vì vậy nó chưa chứng minh được bản vá làm job báo lỗi tốt hơn trước trong tình huống này.
  Căn cứ: Job vẫn báo hỏng đúng khi cơ sở dữ liệu tắt hẳn, nên người dùng không bị thiệt; chỗ yếu chỉ là phép kiểm chưa bắt được nếu sau này ai đó vô tình làm mất bản vá, và có thể bổ sung sau với chi phí thấp.
  file: `scripts/job-exit.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn/mã nguồn thay vì đầu ra): ca todo AC-5 push-ops-facts dùng regex trên mã nguồn thay cho việc chạy bước**
  Người dùng thấy gì: Bước đẩy số liệu lên hệ thống vận hành vẫn nối cứng vào một địa chỉ cơ sở dữ liệu, và phép kiểm hiện chỉ đọc chữ trong mã nên có thể báo xanh khi chưa thật sự sửa. Khi sửa xong, cần một phép kiểm chạy thật để chắc là bước đó báo lỗi đúng.
  Căn cứ: Việc này đã được ghi nhận là hàng riêng cho vòng sau nên không cản bản giao này; chưa gây hại cho người dùng, nhưng phải được đo chạy thật khi sửa để khỏi báo xanh giả.
  file: `scripts/job-exit.test.mjs`
  severity: low
  Đề xuất: new-contract

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
