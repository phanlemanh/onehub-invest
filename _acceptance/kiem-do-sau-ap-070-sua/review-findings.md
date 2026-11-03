# Review findings — kiem-do-sau-ap-070-sua (round 5)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **paths của evals thiếu tệp mà E1–E3 chạy thật, nên sửa các tệp ấy không làm bằng chứng hoá cũ**
  Người dùng thấy gì: Sau khi ký, nếu ai sửa tiếp hai tệp phụ của bộ kiểm, bằng chứng đã ký vẫn được coi là còn mới dù kết quả đo có thể đã đổi. Người dùng cuối không thấy gì, chỉ rủi ro là tin nhầm một bằng chứng đã cũ.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, chỉ làm cổng nghiệm thu bỏ sót một lần cần đo lại; sửa sau rẻ và không mất gì.
  file: `_acceptance/kiem-do-sau-ap-070-sua/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Thước của hồ sơ do-danh-ba-sdt còn công thức N3 cũ, không theo SQL_N3 và TIN_VAO_DANH_BA**
  Người dùng thấy gì: Thước kiểm của hồ sơ danh bạ cũ có thể báo sai khi có số ghép từ S06 chưa có bí danh, nên người vận hành có thể thấy cảnh báo đỏ hoặc xanh không đúng thực tế ở phép đo cũ.
  Căn cứ: Chỉ làm một thước đo cũ nói sai, không làm mất hay lộ dữ liệu; nên mở việc riêng để sửa đúng chỗ thay vì chen vào hồ sơ này.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: new-contract

- **Nhãn Ops «SĐT trên tin» không còn đúng nghĩa với số N3 mới**
  Người dùng thấy gì: Trang Ops hiện con số «SĐT trên tin» nhỏ hơn số điện thoại thật có trên tin mà không giải thích, nên người vận hành có thể hiểu nhầm là thiếu số.
  Căn cứ: Chỉ là chữ hiển thị cho người vận hành nội bộ, không mất dữ liệu; đổi nhãn sau rất rẻ và không cần thu hồi gì.
  file: `app/src/lib/dq-labels.ts`
  severity: low
  Đề xuất: known-limits

- **Phép đo khoá giữa chừng không thấy gì trong thân ma trận KD-AC-1, vì khoá đã nhả khi ROLLBACK TO SAVEPOINT**
  Người dùng thấy gì: Bộ kiểm có thể không phát hiện nếu sau này có đoạn mã xin khoá thêm một bảng giữa chừng, nên lỗi kẹt khoá có thể quay lại mà test vẫn xanh. Hiện chưa có bảng nào bị sót.
  Căn cứ: Hiện chưa gây sai kết quả nào; chỉ là rào phòng ngừa còn hở ở một đường, các đường khác vẫn được đo, và sửa sau rẻ.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): phép đo «xin khoá giữa giao dịch» bị mù sau ROLLBACK TO SAVEPOINT, đối chứng dương lại nằm trên đường không có savepoint**
  Người dùng thấy gì: Thông điệp của phép kiểm hứa phủ mọi ca nhưng thực tế có một đường không được phủ, nên người đọc có thể tin rằng việc kẹt khoá đã được kiểm kỹ hơn thực tế.
  Căn cứ: Không làm sai dữ liệu hay hành vi hiện tại, chỉ làm lời hứa của test rộng hơn phạm vi thật; sửa sau rẻ và tự gỡ được.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): «ma trận bốn migration × hai trạng thái view» chỉ so văn bản, vế chạy thật là câu chú thích, ô 059 không được thực thi qua sqlNapLai ở đâu cả**
  Người dùng thấy gì: Với một trong bốn tệp nạp lại cũ, việc nạp thật trên cơ sở dữ liệu chưa được chạy thử, chỉ so văn bản; nếu có lỗi lúc nạp thật thì bộ kiểm chưa bắt được.
  Căn cứ: Rủi ro thấp vì văn bản đã đúng và ba tệp kia được chạy thật; nếu lỗi thì chỉ hiện ở môi trường thử, không chạm dữ liệu thật, thử lại được.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): bí danh chèn tay khớp vế EXISTS của SQL_N3, vế này chưa từng quyết định trên dòng do dungNguoi ghi**
  Người dùng thấy gì: Nếu cách hệ thống ghi bí danh đổi dạng trong tương lai, một số ô kiểm vẫn xanh vì dùng bí danh viết tay, nên danh bạ có thể đếm sai mà test không báo.
  Căn cứ: Hiện đếm đúng và đường ghi thật đã được kiểm ở chỗ khác; chỉ là khoảng hở cho thay đổi sau này, sửa sau rẻ.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp, không đối chứng dương): đối chứng cột của E5 và các nhánh tự kiểm chỉ đếm số vi phạm, trong khi evals khai «thông điệp ghim»**
  Người dùng thấy gì: Phép tự kiểm của thước đo chỉ đếm số lỗi chứ không đọc lỗi gì, nên thước có thể báo đỏ vì lý do khác mà vẫn được coi là đạt.
  Căn cứ: Chỉ làm giảm độ tin cậy của công cụ đo nội bộ, không ảnh hưởng người dùng hay dữ liệu; sửa sau rẻ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): vế «không đổi migration có từ trước» của E5 không có đối chứng dương**
  Người dùng thấy gì: Thước kiểm việc không đổi các tệp thay đổi cơ sở dữ liệu cũ có thể im lặng báo «không đổi» ngay cả khi lệnh so sánh chạy sai, nên một lần sửa nhầm có thể lọt.
  Căn cứ: Rủi ro thấp vì hiện không có tệp cũ nào bị sửa và hook của kho cũng chặn sửa; sửa thước sau rẻ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): kiểm «bộ chạy trên DB thử» bằng grep mã nguồn, không đo lúc chạy**
  Người dùng thấy gì: Ba bộ kiểm có thể đang chạy nhầm trên cơ sở dữ liệu chính của máy thay vì bản chép thử mà bằng chứng vẫn xanh; chưa có dấu hiệu việc này xảy ra.
  Căn cứ: Các bộ này chủ yếu đọc và chạy trong giao dịch hoàn tác nên hậu quả nhẹ, và đường chạy vẫn được ghi rõ; bổ sung bằng chứng sau không tốn nhiều.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): tự kiểm bơm thẳng số loiView, boQua vào xetBo, nên đường đọc số bỏ qua fail-open từ nhật ký không được thử**
  Người dùng thấy gì: Nếu nhật ký chạy test đổi định dạng, thước có thể coi như không ca nào bị bỏ qua và báo đạt dù thật ra có ca bị bỏ, làm người ký tin nhầm kết quả.
  Căn cứ: Hiện chưa có ca nào bị bỏ qua và nhật ký còn đúng định dạng; chỉ là điểm yếu tiềm ẩn của công cụ đo, sửa sau rẻ.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/11 lỗi rơi vào file không bộ đo nào phủ (_acceptance/kiem-do-sau-ap-070-sua/evals.yaml, _acceptance/do-danh-ba-sdt/probes/db.mjs, app/src/lib/dq-labels.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
