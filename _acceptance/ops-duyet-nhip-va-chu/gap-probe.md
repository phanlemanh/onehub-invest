---
slug: ops-duyet-nhip-va-chu
at: 2026-11-07T23:40:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Định nghĩa thước giây/thẻ (tính từ lúc thẻ dựng, tab ẩn vẫn chạy) do máy quyết với căn cứ một-lối yếu; sổ lại xếp định nghĩa thước OD2 so sánh vào loại chỉ-người. Cùng mẫu lỗi với [chon-model-theo-o#F1]. | OD2 giảm thời gian giữa hai thẻ (rail, tự sang thẻ kế) mà thước OD1 bỏ quãng chọn thẻ → OD2 trượt bat_khi dù người nhanh hơn; Mạnh ký mà tưởng giây/thẻ là toàn bộ thời gian một thẻ. | Hỏi-3 chỉ-người: (a) từ lúc thẻ dựng; (b) thêm khoảng từ lượt quyết trước của cùng người, máy chủ suy từ ops_audit; nêu cách tính khi tab ẩn; AC-1 ghim lối Mạnh chọn. | human-gate1: thêm Hỏi-3 (dòng sổ supersedes d-20261107T231809Z-4), nháp theo khuyến nghị ghi cả hai số — thời gian ở thẻ (seconds) và giữa hai lượt quyết của cùng người (since_prev_seconds) — AC-1, AC-4, E1, E4 sửa theo |
| P1 | evals | E1-UI chỉ dựng thẻ Ghép căn; thẻ Người không ca nào đo gửi elapsed_ms. | Thẻ Người đi lối gửi khác thì mọi quyết Gộp Người ra timing khong-do, party_merge không có số trước cho OD2, eval vẫn xanh. | Ma trận mỗi component có nút quyết, body có elapsed_ms; ca route nguoi: ra party_merge có seconds; chiều đỏ NGUOI KHONG GUI ELAPSED. | fixed: E1 thêm ma trận bốn component (Ghép căn, Bổ sung tin, chỉ đối chiếu, Người) và ca route thẻ nguoi:, chiều đỏ 'NGUOI KHONG GUI ELAPSED'; E11 thêm bước quyết một thẻ Người |
| P1 | evals | AC-10 cross-layer nhưng E10 chỉ tiêm danh sách vào ReviewQueue; bộ nạp thẻ của trang chưa đo trên DB; câu chữ AC-10 và design lệch («hàng duyệt» và «danh sách»). | Bộ nạp có LIMIT hay chỉ lấy pending → liên kết từ /ops/deals hay ?card= của thẻ đã quyết báo «Không tìm thấy thẻ» dù thẻ có thật. | Ca OD1-AC-10-DB chạy bộ nạp thật trên lược đồ tạm với thẻ đích đã quyết và cũ nhất; chiều đỏ CARD NGOAI VUNG NAP. | fixed: thêm ca 'OD1-AC-10-DB' qua bộ nạp thật của trang (loadReviewQueue tách ra lib, chạy trên lược đồ tạm), chiều đỏ 'CARD NGOAI VUNG NAP'; design và AC-10 cùng nói «thẻ có trong hàng duyệt (bộ nạp của trang)» |
| P1 | contract | Hỏi-1 chỉ trình ba bộ nhãn, bảng thiết kế và E8 ghim thêm hai hàng (chỉ đối chiếu, Loại khác). | Mạnh duyệt Hỏi-1 theo chữ trong sổ mà không thấy «Đã ghi» của thẻ đối chiếu; Cổng Phạm vi duyệt bảng nhãn khác bảng người ký đã thấy. | Dòng Hỏi-1 liệt đủ năm hàng, ghi chữ nút gốc từng hàng làm căn cứ. | fixed: dòng sổ mới supersedes Hỏi-1, liệt đủ năm hàng kèm chữ nút gốc |
| P2 | evals | Nhánh cloud và vai Người xem không có ca dựng màn thật; phép đo cloud của AC-8 quét chuỗi mã nguồn. | loadReviewPace gọi trước nhánh vai/môi trường → viewer thấy Frame nhịp, hay truy vấn hỏng ở cloud kéo RegionError cả vùng; chữ TV13 có trong tệp mà không hiện. | Ca dựng hai nhánh: viewer 0 Frame nhịp; lược đồ không có review_queue hiện câu TV13, không gọi loadReviewPace; chiều đỏ VIEWER THAY NHIP, CLOUD GOI NHIP; E8 assert trên HTML đã dựng. | fixed: E8 thêm ca 'OD1-AC-8-NHANH' dựng ReviewContent thật cho vai viewer và lược đồ không có review_queue, chiều đỏ 'VIEWER THAY NHIP', 'CLOUD GOI NHIP'; quét chữ TV13 chuyển sang HTML đã dựng; Coverage sửa dòng Môi trường |
