# Review findings: che-do-thu-tren-ops (round 2)

## Trong hợp đồng

Không có finding nào trong hợp đồng ở vòng này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Comment trong cloud-sync.sh nói bước hạ chạy trước để cloud thấy chế độ mới, nhưng source_groups không lên cloud (r1 · tệp đã đổi)**
  Người dùng thấy gì: Người đọc mã sau này có thể hiểu nhầm rằng chế độ thu của từng điểm được đồng bộ lên cloud, trong khi thực tế chỉ nằm ở máy thu. Người dùng không thấy ảnh hưởng gì khi dùng.
  Căn cứ: Chỉ là dòng ghi chú sai, không làm mất hay lộ dữ liệu nào, hành vi chạy vẫn đúng và sửa lúc nào cũng rẻ.
  file: `scripts/cloud-sync.sh`
  severity: low
  Đề xuất: known-limits

- **Máy hạ chỉ kiểm hạn bùng bằng regex, chưa giữ được luật «Bùng có hạn, tối đa 14 đêm» (r1)**
  Người dùng thấy gì: Nếu có đường ghi nào khác ngoài trang Ops đặt một hạn bùng sai (ngày không có thật hoặc quá xa), điểm thu đó có thể bị giữ ở chế độ Bùng lâu hơn 14 đêm mà máy không tự hạ xuống. Hiện chỉ trang Ops được phép bật Bùng nên chưa xảy ra.
  Căn cứ: Hiện không có lối nào ghi được hạn sai nên chưa có hậu quả thật; rủi ro chỉ xuất hiện nếu sau này mở thêm đường ghi khác, và lúc đó mới cần xử lý.
  file: `pipeline/ha-bung-het-han.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận viết trước không đủ): bước thật ha-bung-het-han không vào STEPS của AC-5, assert số đếm vẫn ghim 11 (r1)**
  Người dùng thấy gì: Bước tự hạ chế độ Bùng chưa được thử bằng chính tệp thật khi cơ sở dữ liệu không kết nối được. Nếu bước này lặng lẽ bỏ qua lỗi, có thể không ai biết các điểm bùng quá hạn chưa được hạ.
  Căn cứ: Thứ tự và mã thoát của bước đã được thử bằng bản giả; chỗ hở chỉ lộ khi bước thật nuốt lỗi kết nối, và người vận hành vẫn thấy qua log chạy 15 phút một lần, bổ sung phép thử về sau không tốn nhiều.
  file: `scripts/job-exit.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo văn bản mã nguồn thay vì đầu ra): CD-AC-3 chứng cổng route chặn Bearer cho set-mode bằng regex trên route.ts (r1 · tệp đã đổi)**
  Người dùng thấy gì: Chưa có phép thử gửi yêu cầu bằng token máy thật tới đường đổi chế độ để xác nhận bị từ chối. Nếu sau này ai đó sửa cách route nhận phiên, token máy có thể đổi được chế độ mà phép thử vẫn xanh.
  Căn cứ: Hiện cổng admin đã được kiểm theo cả hai phía (tại hàm xử lý và cách route trao quyền), rủi ro chỉ có khi mã route bị sửa về sau; thêm một phép thử gọi thật rất rẻ nếu cần.
  file: `app/tests/che-do-thu.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
