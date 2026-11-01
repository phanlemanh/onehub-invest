# Review findings: nguoi-noi-theo-sdt (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Gộp theo SĐT tự bật trong job đêm, trái OOS-5 (việc chạy gộp trên dữ liệu thật phải là bước triển khai riêng)**
  Người dùng thấy gì: Ngay sau khi code được đưa vào chạy, lượt xử lý ban đêm có thể tự gộp người trên dữ liệu thật mà chưa ai duyệt. Muốn hoàn lại phải tách từng người bằng tay.
  Căn cứ: Hậu quả vừa phải nhưng chạm dữ liệu thật và không tự đảo được, nên cần một bước triển khai riêng có người duyệt; dữ liệu không mất vì tách lại được.
  file: `pipeline/lib/danh-ba-nguoi.mjs`
  severity: medium
  Đề xuất: new-contract

- **Người đã tách (split) bị N1 đếm là «chưa gộp» mãi, nên kiểm n1 đêm đỏ vĩnh viễn sau lần tách đầu tiên**
  Người dùng thấy gì: Sau khi tách một người, phép kiểm hằng đêm sẽ báo lỗi mãi dù không có gì hỏng. Người vận hành dễ quen với cảnh báo đỏ và bỏ sót lỗi thật.
  Căn cứ: Không mất hay lộ dữ liệu, chỉ gây báo động giả kéo dài; sửa sau không đắt và không ảnh hưởng người dùng cuối.
  file: `pipeline/lib/danh-ba-nguoi.mjs`
  severity: medium
  Đề xuất: new-contract

- **anhXaVai giữ vai đầu tiên theo thứ tự tin, nên vai parser từ bản ghi nghỉ có thể thay vai source_field của bản ghi sống trên người tài khoản**
  Người dùng thấy gì: Trong ca hiếm, nhãn bằng chứng ghi trên một người có thể lấy từ tin đã nghỉ thay vì tin còn đang đăng. Người được gộp vẫn đúng, chỉ phần nguồn gốc bằng chứng hiển thị kém chính xác.
  Căn cứ: Chỉ lệch nhãn bằng chứng ở ca hiếm, không mất dữ liệu và không đổi người được gộp; có thể ghi nhận là hạn chế đã biết.
  file: `pipeline/lib/danh-ba-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

- **`--ly-do` mà thiếu `--tach` bị bỏ qua: dung-nguoi chạy dựng đủ một lượt rồi COMMIT**
  Người dùng thấy gì: Nếu người vận hành gõ nhầm lệnh tách (quên cờ tách), hệ thống không tách ai mà chạy dựng danh bạ đầy đủ và ghi vào dữ liệu. Họ tưởng đã tách nhưng thực tế không.
  Căn cứ: Chỉ xảy ra khi gõ nhầm lệnh nội bộ, kết quả là một lượt dựng bình thường nên không mất dữ liệu; chạy lại lệnh đúng là xong.
  file: `pipeline/dung-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét LỚP nhưng chỉ có điểm-case: mồi E7 không trộn mọi dáng của E1 như evals hứa**
  Người dùng thấy gì: Bằng chứng kiểm thử phủ ít dáng dữ liệu hơn tuyên bố, nên một số tổ hợp hiếm có thể chưa được thử. Người dùng không thấy gì trực tiếp, chỉ là độ tin cậy thấp hơn mô tả.
  Căn cứ: Không gây mất hay lộ dữ liệu, chỉ là độ phủ kiểm thử mỏng hơn lời khai; bổ sung ca thử sau rất rẻ.
  file: `pipeline/scripts/danh-ba-nguoi.itest.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
