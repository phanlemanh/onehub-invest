# Review findings: go-tai-khoan-kiem-id (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **evals.yaml E1 mô tả sai số ca so với test thật (5 thân / 5×3 assert so với 7 thân / tới 4 assert)**
  Người dùng thấy gì: Chỉ là một dòng mô tả bằng chứng ghi sai số ca kiểm; việc gỡ tài khoản thu vẫn từ chối đúng các id sai và người dùng không thấy khác biệt nào.
  Căn cứ: Không ảnh hưởng người dùng, không mất dữ liệu, sai lệch chỉ nằm ở lời mô tả nên chấp nhận và ghi vết là đủ.
  file: `_acceptance/go-tai-khoan-kiem-id/evals.yaml`
  severity: low
  Đề xuất: wont-fix

- **evals E1 ghi «5 thân viết trước = 5×3 assert» nhưng ca test chạy 7 thân và kiểm thêm thông điệp lỗi**
  Người dùng thấy gì: Chỉ là lời mô tả bằng chứng đếm sai số ca kiểm; người dùng vẫn bị chặn đúng khi gỡ tài khoản thu với id rỗng hoặc sai.
  Căn cứ: Không có hậu quả nào với người dùng, không mất dữ liệu, và sửa chỉ là chữ nên không đáng mở việc riêng.
  file: `_acceptance/go-tai-khoan-kiem-id/evals.yaml`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3 (assert «có mặt» thay cho quan hệ), kèm thiếu đối chứng của hình dạng 4: assert .bak trong GT-AC-4 luôn đúng vì tệp sao lưu đã có từ ca trước**
  Người dùng thấy gì: Bài kiểm có thể vẫn báo xanh dù lần gỡ tài khoản thu không tự tạo bản sao lưu cấu hình, vì đã có sẵn bản sao lưu từ các ca trước. Nếu sau này mất bước sao lưu, bài kiểm này sẽ không báo.
  Căn cứ: Hậu quả nhẹ vì chỉ làm bài kiểm kém nhạy chứ không làm hỏng việc gỡ tài khoản, và bước sao lưu hiện vẫn chạy đúng.
  file: `app/tests/go-tai-khoan-kiem-id.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho quan hệ): thước tĩnh AC-5 coi bất kỳ chuỗi «requireDeletableAccount(» nào là bước kiểm**
  Người dùng thấy gì: Thước quét tĩnh có thể bị qua mặt nếu ai đó chú thích hoá dòng kiểm id nhưng vẫn để nguyên chữ của nó. Khi đó lệnh gỡ tài khoản có thể lại chạy với id chưa kiểm mà bài kiểm không báo.
  Căn cứ: Rủi ro thấp vì phải có thay đổi code cố ý hoặc cẩu thả mới xảy ra, các bài kiểm chạy thật ở các ca khác vẫn bắt lỗi id rỗng và id lạ.
  file: `app/tests/go-tai-khoan-kiem-id.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận viết trước không khớp số assert, mẫu P105): E1 khai «5 thân = 5×3 assert» trong khi ca test có 7 thân và tới 4 assert mỗi thân**
  Người dùng thấy gì: Chỉ là lời mô tả bằng chứng ghi sai số ca kiểm; việc gỡ tài khoản thu vẫn chặn đúng id rỗng và id sai, người dùng không bị ảnh hưởng.
  Căn cứ: Không ảnh hưởng người dùng, không mất dữ liệu, và là bản trùng của hai phát hiện trước nên ghi vết một lần là đủ.
  file: `_acceptance/go-tai-khoan-kiem-id/evals.yaml`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 3/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/go-tai-khoan-kiem-id/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

