---
slug: so-so-tren-man-theo-ngay
at: 2026-11-18T09:40:00Z
verdict: findings
p0: 0
p1: 5
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Hồ sơ không nói dòng `s03-moc-ngay` cũng lên `dq_check_results` trên cloud | Người ký tưởng hàng không ghi gì mới lên cloud; nếu đồng bộ nối theo `id` thì cloud tích tới 96 dòng mỗi ngày | Đọc cách đồng bộ của bảng và ghi đường lên cloud vào hồ sơ | fixed: `sync-cloud` tráo trọn bảng trong `FILL` nên không tích dòng; đã ghi ở thiết kế §4; việc cho lên cloud thành câu Hỏi-4 riêng cho Mạnh, không có DDL cloud |
| P1 | contract | Định nghĩa «hạng cấp dự án» hứa chốt ở cổng mà không có câu hỏi; ma trận không có ô bán, thuê | Mạnh hiểu số khác với số trên màn; đột biến chỉ đếm tin bán vẫn xanh | Thêm Hỏi-3, ô bán, ô thuê và đột biến chỉ đếm tin bán | fixed: Hỏi-3 kèm số 18/11; AC-2 và E2 thêm ô và đột biến. Số 5.553 không dựng lại được, đã ghi rõ |
| P1 | evals | `building_linked` không có đối chứng dương | Bên ghi đặt cứng 0 mà mọi eval vẫn xanh, mốc không bao giờ nhích | Nối `toa_link` thử cho ba tin, kỳ vọng 1; đột biến đặt cứng 0 đỏ | fixed: AC-2 và E2 |
| P1 | evals | Mức đổi và cờ chỉ đo bằng dữ liệu viết tay; trạng thái tải, lỗi không có eval | Màn thật luôn ghi «Chưa có số hôm trước» trong khi eval xanh | Ca đầu-cuối bốn ngày qua 600 thật; ca tải và ca lỗi | fixed: AC-7, AC-8, E7, E8 |
| P1 | contract | Timebox ba đêm không có đường đo; chưa đo ranh nửa đêm giờ VN | Lấy ngày theo UTC ghi đè dòng đã chốt của hôm trước | Ghim 16:59Z và 17:01Z, đột biến UTC đỏ; đếm ba ngày sau gộp | fixed: AC-3, E3 và mục Đường đo |
