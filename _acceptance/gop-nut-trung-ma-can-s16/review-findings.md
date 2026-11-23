# Review findings: gop-nut-trung-ma-can-s16 (round 2)

## Trong hợp đồng

Findings: []

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Findings: []

- **docMaCan đọc mã căn và tên toà S16 thô, không chuẩn hoá như các chỗ khác trong repo (r1)**
  Người dùng thấy gì: Nếu mã căn hay tên toà có khoảng trắng thừa hoặc khác chữ hoa thường, hệ thống có thể bỏ sót một cặp phân khu đáng lẽ được gộp, và để nguyên hai nút trùng.
  Căn cứ: Lỗi chỉ làm bỏ sót việc gộp, không làm mất hay gộp sai dữ liệu, và người dùng có thể xử lý tay hoặc chạy lại sau khi sửa.
  file: `pipeline/phan-khu-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **docMaCan nhận cả mã căn giữ chỗ («K dung», «do not use») và không chuẩn hoá chữ hoa, nên một khu có mã rác không bao giờ đạt mức đủ tiền tố (r1)**
  Người dùng thấy gì: Khu có mã căn giữ chỗ sẽ không được gộp tự động và chỉ hiện là chưa đủ bằng chứng, mà không nói rõ lý do.
  Căn cứ: Hệ quả chỉ là bỏ sót việc gộp một số khu, không mất dữ liệu, và có thể gộp sau khi người xem xét.
  file: `pipeline/phan-khu-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe quet-ma-can nối stg_s16_can với stg_s16_toa chỉ bằng toa_id, thiếu du_an, nên số đo lệch với code thật (r1)**
  Người dùng thấy gì: Bảng số khảo sát ban đầu có thể lệch đôi chút so với thực tế, nhưng không ảnh hưởng đến dữ liệu hay màn hình của người dùng.
  Căn cứ: Chỉ là công cụ đo tạm của đợt làm, số cuối cùng dùng để ký được đo lại bằng đường khác.
  file: `_acceptance/gop-nut-trung-ma-can-s16/probes/quet-ma-can.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): chiều đỏ của GNT-3 không làm đỏ assert «ca cần người không đổi một byte» (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tự động chưa chứng minh được rằng nó sẽ báo lỗi nếu ca cần người bị nối nhầm, nên một lỗi như vậy sau này có thể lọt qua.
  Căn cứ: Không có sai dữ liệu hiện tại; rủi ro nằm ở việc phát hiện lỗi về sau, và bổ sung phép kiểm sau này không tốn nhiều.
  file: `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng thiếu phần tử): GNT-1 tuyên «ứng viên duy nhất là nút do luật đúc hay đã nghỉ» nhưng fixture không có ca nút đã nghỉ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Chưa có phép thử riêng cho trường hợp nút phân khu đã nghỉ, nên nếu hệ thống nối nhầm vào nút đã nghỉ thì chưa chắc được phát hiện.
  Căn cứ: Là khoảng trống kiểm thử, không phải lỗi đã xảy ra, và nút nghỉ còn có kiểm tra khác ở bước đảo và soát.
  file: `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode ROOT): probe do-p4.mjs mặc định đọc worktree tuyệt đối của checkout tác giả (r1)**
  Người dùng thấy gì: Công cụ đo chỉ chạy đúng trên máy của người làm, người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là tập lệnh đo nội bộ, số ký đã đi qua bản có ghim phiên bản, sửa không đem lại lợi ích.
  file: `_acceptance/gop-nut-trung-ma-can-s16/probes/do-p4.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip writer→reader): probe do-ben-doc.mjs và do-p4.mjs tự dựng trạng thái «sau nối» bằng UPDATE tay (r1)**
  Người dùng thấy gì: Số ước tính ban đầu về kết quả sau gộp dựng bằng cách giả lập, nhưng số dùng để ký đã lấy từ lượt gộp thật nên người dùng không bị ảnh hưởng.
  Căn cứ: Là số ước lượng sớm, không đi vào dữ liệu hay màn hình, và đã có số thật thay thế.
  file: `_acceptance/gop-nut-trung-ma-can-s16/probes/do-ben-doc.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
