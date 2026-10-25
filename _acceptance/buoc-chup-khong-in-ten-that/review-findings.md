# Review findings: buoc-chup-khong-in-ten-that (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E2 hứa ca «chỉ trong script → 0» nhưng không test nào đo, và nhánh bỏ <script>/<style> của PAGE_TEXT_FN chưa được kiểm**
  Người dùng thấy gì: Bản kê bằng chứng nói đã thử ca tên thật chỉ nằm trong phần mã ẩn của trang, nhưng thực tế chưa có phép thử nào cho ca này. Nếu sau này có người sửa nhầm phần đó, sẽ không ai được báo.
  Căn cứ: Không làm lộ tên thật hay mất dữ liệu, chỉ là một ca chưa có người canh; bổ sung phép thử sau này rẻ và không ảnh hưởng người dùng hiện tại.
  file: `_acceptance/buoc-chup-khong-in-ten-that/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Lệnh `scripts` (scripts/*.test.mjs) giờ gom luôn test trình duyệt thật: thiếu playwright-cli là đỏ**
  Người dùng thấy gì: Trên máy không cài công cụ điều khiển trình duyệt, bộ kiểm tra chung của thư mục scripts sẽ báo đỏ dù việc đang làm không liên quan. Người làm việc khác có thể bị vướng và chạy chậm hơn.
  Căn cứ: Chỉ gây đỏ giả trên máy thiếu công cụ, không làm mất hay lộ dữ liệu; người làm tự nhận ra ngay và cài công cụ hoặc bỏ qua, sửa sau không đắt.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Phép kiểm lộ bỏ qua mọi thuộc tính trong cây [data-tier-a], kể cả những thuộc tính hiện lên ảnh**
  Người dùng thấy gì: Nếu một trang tương lai đặt tên thật vào ô nhập hoặc chú thích ảnh bên trong vùng đánh dấu nhạy cảm, ảnh chụp vẫn được ghi kèm tên thật mà không bị báo. Hiện app chưa có trang nào làm vậy.
  Căn cứ: Chưa xảy ra với app hiện tại nên chưa có tên nào lộ; nhưng nếu xảy ra thì ảnh đã ghi có thể bị dán lên kho công khai, nên cần ghi rõ giới hạn để người viết trang mới biết.
  file: `scripts/ui-capture-login.mjs`
  severity: low
  Đề xuất: known-limits

- **E2 ghi ca «chỉ trong script → 0» nhưng test không có ca này; việc PAGE_TEXT_FN bỏ <script>/<style> chưa được kiểm ở đâu**
  Người dùng thấy gì: Một ca thử được ghi trong bản kê bằng chứng thực ra chưa được thử. Việc bỏ qua phần mã ẩn của trang khi dò tên có thể bị sửa hỏng mà không ai hay.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp và không làm lộ dữ liệu; chỉ là thiếu một lưới an toàn, thêm sau với chi phí thấp.
  file: `_acceptance/buoc-chup-khong-in-ten-that/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **UC-TA-5 đếm thư mục ui-capture-* trong tmpdir chung, dễ đỏ ngẫu nhiên khi chạy song song với test trình duyệt thật**
  Người dùng thấy gì: Bộ kiểm tra đôi khi báo đỏ ngẫu nhiên khi có hai lần chụp chạy cùng lúc trên máy, dù bước chụp đã dọn sạch. Người chạy chỉ cần chạy lại.
  Căn cứ: Chỉ là báo động giả, chạy lại là hết, không lộ hay mất dữ liệu; sửa tốn công hơn nhiều so với phiền toái.
  file: `scripts/ui-capture-login.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **ensureAccount (lệnh con) không đi qua step(): lỗi ra mã 1 kèm stack thô, không phải mã 7**
  Người dùng thấy gì: Khi bước chuẩn bị tài khoản thử hỏng, bước chụp báo lỗi kiểu thô với mã khác thông lệ thay vì lời chung. Người chạy có thể hiểu nhầm nguyên nhân nhưng không lộ thông tin nhạy cảm.
  Căn cứ: Không thấy lộ tên hay mật khẩu, chỉ là thông báo xấu và mã thoát lệch; người chạy tự thấy lỗi và thử lại được, sửa sau rẻ.
  file: `scripts/ui-capture-login.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận tierALeaks tuyên 6 dòng viết trước nhưng thiếu dòng «chỉ trong script → 0»**
  Người dùng thấy gì: Bản kê bằng chứng khai sáu ca thử nhưng thực tế chỉ có năm ca khớp, thiếu ca tên chỉ nằm trong phần mã ẩn của trang. Người ký có thể tưởng ca này đã được kiểm.
  Căn cứ: Không gây lộ hay mất dữ liệu; chỉ cần sửa lại bản kê hoặc thêm ca thử, tốn ít công và có thể làm bất cứ lúc nào.
  file: `scripts/ui-capture-login.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1 — UC-BR-3 đo số tự báo «đã che 1» thay vì đo đầu ra sau khi che**
  Người dùng thấy gì: Phép thử chỉ xác nhận bước che tự báo là đã che, chưa kiểm tận nơi rằng chữ nhạy cảm trong ảnh đã thành khối đen. Nếu bước che hỏng âm thầm, ảnh vẫn có thể ghi ra kèm tên thật mà bộ kiểm tra không phát hiện.
  Căn cứ: Việc kiểm ảnh đã ghi đã được chủ động hoãn sang vòng sau; hiện chưa có bằng chứng bước che hỏng, nên ghi rõ giới hạn là đủ.
  file: `scripts/ui-capture-browser.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — UC-TA-5 dùng nguồn tên viết tay ghi names.json vào đúng thư mục capture dọn, không chạy writer thật**
  Người dùng thấy gì: Phép thử dọn tệp tạm dùng một nguồn danh sách tên giả, chưa chạy nguồn thật. Nếu nguồn thật ghi tệp ra chỗ khác, tệp chứa danh sách tên có thể còn sót lại trên máy mà phép thử vẫn xanh.
  Căn cứ: Tệp sót chỉ nằm trên máy local của Mạnh, không rời máy; nếu có sót thì tự xoá được, nhưng nên ghi rõ giới hạn để lần sau thêm phép thử với nguồn thật.
  file: `scripts/ui-capture-login.test.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/buoc-chup-khong-in-ten-that/evals.yaml, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
