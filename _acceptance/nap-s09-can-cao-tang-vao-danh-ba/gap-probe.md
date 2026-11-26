---
slug: nap-s09-can-cao-tang-vao-danh-ba
at: 2026-11-26T02:00:00Z
verdict: findings
p0: 2
p1: 3
p2: 3
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract/evals | Phép đo độ đúng 200 cặp tự đúng: cặp khớp theo khoá (toà, tầng, số căn) nên tầng đã bằng nhau; mẫu không chia theo khuôn mã; «tầng mã ≠ tầng item» chỉ đếm, không ngưỡng | Luật tách đọc sai tầng, căn khớp nhầm mà phép đo vẫn 0% sai; toà chỉ có S09 đúc sai tầng không ai bắt | Mẫu chia khuôn, đối chiếu bằng nguồn độc lập với khoá, ngưỡng tầng mã ≠ tầng item khai trước | fixed: AC-10, E10 — mẫu chia năm khuôn ≤40 cặp, so mã gốc S16 chuẩn hoá và tầng item S09 với tầng gốc S16, sai ≤1% mỗi khuôn; ngưỡng tầng mã ≠ tầng item ≤8% (đo 5,3%) làm phép kiểm độc lập của luật tách |
| P0 | contract | AC-10 không có sàn số căn vào, không trần cho «toà chưa nối» + «toà chưa trọn»; khuôn bí danh DA42 chỉ ở thiết kế | DA42 ghi bí danh khác khuôn, gần hết căn rơi vào «toà chưa nối», bảy phần vẫn cộng đủ, cổng xanh | Sàn khai trước, trần % hai phần, khuôn bí danh vào Given | fixed: AC-10 dải 250.000–349.493 khai trước diễn tập, toà chưa nối + chưa trọn ≤5%; AC-4 Given ghi `danh-ba-toa/<uuid toà gói 1>` = `meta.toaId` |
| P1 | evals | E5 không có ca trùng khoá Hỏi-5, không có ca hai mã S09 cùng khoá khớp một căn S16 | Cài đặt gắn hai bí danh S09 vào một căn, E5 vẫn xanh | Ô trùng khoá + chiều đỏ | fixed: AC-5, E5 thêm hai ô trùng khoá, chiều đỏ «chọn theo thứ tự đọc» |
| P1 | contract | Bảy phần không có thứ tự khi chồng nhau; mẫu số ngưỡng 1,5% không rõ | Phần chồng làm tổng lệch hoặc bù nhau | Thứ tự xếp phần, mẫu số | fixed: AC-10 thứ tự mã hỏng → toà chưa nối → toà chưa trọn → trùng khoá → bí danh · đúc · thẻ; mỗi căn đúng một phần; mẫu số toàn bản thu |
| P1 | contract | Đích chốt sau diễn tập; hai ngưỡng 1,5% nới sau khi đo | Diễn tập in số nào thành đích; cổng mất chiều đỏ độ phủ | Đích khai trước; ghi rõ ngưỡng đặt sau đo | fixed: dải đích khai trước; AC-10 ghi nguyên văn «hai ngưỡng này đặt sau khi đo» kèm lý do chừa, người quyết ở Hỏi-4, Hỏi-5 |
| P2 | contract/design | 23.543 và 23.541 lẫn nhau; tiêu đề AC-1 trái thân | Lệch 2 khi so bộ đếm; tầng rỗng coi là chưa trọn | Thống nhất số và câu | fixed: 23.541 có căn + 2 rỗng = 23.543 đã gọi; tiêu đề AC-1 và thiết kế §5.3 «bản tốt hoặc rỗng hợp lệ» |
| P2 | contract | Nguồn danh sách tầng gói 1 không khai | Đếm tầng chưa gọi sai | Nguồn + khoá nối vào Given | fixed: AC-1 Given — kind `tang` gói 1 trong `stg_s09_danh_ba` (view 115/125), nối uuid tầng = `sourceId` của item `can-cao-tang` |
| P2 | contract | Tập 110 toà trùng là trước DA42; tầng có chữ không có ca | Ngưỡng ≥90% trên tập cũ; lệch quy ước tầng chữ không rõ | Tập sau DA42; dòng phủ ca tầng chữ | fixed: AC-10 tập toà có S16/S08 đo lại sau DA42; thiết kế §4 dòng 14a, 15a |
