# Review findings: phuong-tu-du-an-chay-that (round 3)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe ghi dữ liệu nhưng chặn DB bằng danh sách cấm (chỉ cấm đúng tên `oneinvest`), không dùng danh sách cho phép `oneinvest_suite_*`**
  Người dùng thấy gì: Nếu người chạy kiểm thử lỡ để sẵn địa chỉ một kho dữ liệu khác trong máy, bài kiểm thử có thể ghi thử vào đó thay vì kho thử riêng. Lỗi chỉ xảy ra khi người chạy sai môi trường, không ảnh hưởng người dùng cuối.
  Căn cứ: Hậu quả chỉ xảy ra khi có sai sót khi chạy kiểm thử trên máy nội bộ, không chạm người dùng, và sửa sau cũng rẻ nên ghi lại là giới hạn đã biết.
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Chốt `--noi-tiep` dùng «luật còn phát biểu sống» làm cờ «đã áp tay», nên một lượt có tập mong muốn rỗng sẽ tắt luôn chuỗi mà không báo**
  Người dùng thấy gì: Nếu danh bạ dự án tạm trống đúng lúc chạy, hệ thống có thể bỏ hết phường đã gán và từ đó các tin mới không còn được gán phường, trong khi lịch chạy hằng đêm vẫn báo xanh. Không ai biết cho đến khi tự nhìn số liệu.
  Căn cứ: Tin mới mất phường âm thầm làm số liệu trên màn sai đi mà không có cảnh báo, nhưng chỉ xảy ra khi danh bạ bị dựng lại và có thể chạy áp lại để khôi phục.
  file: `pipeline/scripts/phuong-tu-du-an.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 (assert «có mặt» thay cho QUAN HỆ): ca lùi trùng lượt nạp đếm mọi khoá tư vấn đang chờ trên cả server, không buộc vào tiến trình con hay khoá của luật**
  Người dùng thấy gì: Một bài kiểm thử về lùi trong lúc đang nạp có thể báo xanh dù phần cần kiểm không thực sự chạy, nên bằng chứng cho tình huống này yếu hơn vẻ ngoài. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm yếu bằng chứng kiểm thử một tình huống hiếm, không làm mất hay lộ dữ liệu, và các ca khác của AC-6 vẫn đo kết quả lùi.
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): ca «lượt 00:00 báo lỗi khoá» chỉ có mã khác 0 và doesNotMatch BỎ LƯỢT**
  Người dùng thấy gì: Một bài kiểm thử có thể báo xanh vì chuỗi gãy sớm chứ không phải vì lỗi khoá như tên ca nói. Chuỗi nạp chạy thật không bị ảnh hưởng.
  Căn cứ: Chỉ là độ chặt của bài kiểm thử, có ca khác cùng tệp phủ đúng tình huống, nên hậu quả nhẹ và sửa lúc nào cũng được.
  file: `scripts/phuong-tu-du-an-chuoi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên cả lớp, chỉ kê vài điểm): «các bước sau vẫn chạy» chỉ kiểm 3 bước tự chọn, ở lượt 00:00 thiếu doc-gop-hang-ngay và enrich-run**
  Người dùng thấy gì: Bài kiểm thử chưa xác nhận hai bước cuối của lượt 00:00 vẫn chạy khi một bước giữa lỗi. Nếu sau này có người sửa chuỗi làm hai bước ấy bị bỏ thì bài kiểm thử sẽ không phát hiện.
  Căn cứ: Chưa có bằng chứng hành vi sai thật, chỉ là khoảng trống của bài kiểm thử, và bổ sung sau rất rẻ.
  file: `scripts/phuong-tu-du-an-chuoi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ca khoá thật dựng lược đồ 3 cột vừa đủ qua kiemDb, chỉ đo được nhánh «chưa áp»**
  Người dùng thấy gì: Bài kiểm thử về việc lượt nhanh bỏ qua khi có phiên khác giữ khoá chỉ chạy trên một kho dựng tay đơn giản, nên chưa chứng minh cho đường chạy hằng ngày sau lượt áp đầu. Hành vi thật chưa thấy sai.
  Căn cứ: Chỉ làm bằng chứng kiểm thử hẹp hơn lời hứa, không gây mất hay sai dữ liệu, và các ca khác đã đo đường chạy lại trên bản chép thật.
  file: `scripts/phuong-tu-du-an-chuoi.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

