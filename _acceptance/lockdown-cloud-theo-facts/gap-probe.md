---
slug: lockdown-cloud-theo-facts
at: 2026-10-25T00:09:33Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-3 ghi máy quyết cả chữ lẫn màu (outline) của «Chỉ kiểm ở máy thu»; câu giao chỉ quyết chữ, không quyết màu, và ô Khoá an toàn cùng trạng thái đã là badge vàng theo ON3 [o-kpi-chi-do-local#F1] | Lên máy chủ, cùng trạng thái không có số hiện ô vàng và 8 hàng xám — xám dễ đọc là trung tính; E1/E7 xanh trên lựa chọn chưa ai duyệt | Tách d-3: chữ giữ máy quyết, màu thành câu hỏi người; E1 ghim variant sau khi chọn | human-gate1: Hỏi-3 (máy khuyên warning-light); dòng sổ mới thay d-3 chỉ giữ phần chữ |
| P0 | design | Dòng sổ d-4 trích ADR-0014 chỉ nói thiếu khối, không quyết khối lỗi; lối nhãn riêng còn sống; luật «một lần mỗi trang» của ADR có thể làm hội đồng E7 lật | Khối lỗi bị báo «Chỉ kiểm ở máy thu» trong khi máy thu cũng mù; E7 có thể FAIL vì 8 nhãn lặp | Khối lỗi thành câu hỏi người; design và AC-7/E7 ghi rõ bat_khi 8/8 thắng luật một lần mỗi trang cho riêng lưới | human-gate1: Hỏi-4 (máy khuyên gộp với không có số); fixed: design mục 2, AC-7, câu hỏi E7 ghi ngoại lệ 8/8 |
| P1 | contract | Thiếu ô số cũ của hai hàng Kev gate / collector API ở Máy móc | Khối lùi 46′: lưới Khoá an toàn «Ổn» xám nhưng Máy móc vẫn «Sống» xanh từ cùng số cũ | AC-4/E4 thêm vế hai hàng Máy móc giữ nhãn, 0 success-light + chiều đỏ | fixed: AC-4, E4 (vế + chiều đỏ «Máy móc bỏ qua cờ cũ»), design mục 4, dòng ST-lockdown-stale |
| P1 | evals | ST-lockdown-mixed hứa tab đếm đúng nhưng không eval nào đo; E9 cho phép ảnh mixed thiếu giá trị | Tab bỏ sót null mà E3 vẫn xanh; E9 PASS với ảnh không đủ ba giá trị | E3 đo số trên từng tab theo ma trận 3 giá trị; proto thêm --mode mixed, bỏ lối thoát ở E9 | fixed: AC-3, E3 (đếm tab), E9 (--mode mixed, phải thấy ba nhãn + ba số), design dòng ST-lockdown-mixed |
| P2 | evals | E5 không ghim quan hệ từng cổng — tráo ánh xạ kev ↔ collector vẫn xanh khi hai cổng cùng giá trị | Kev chết thì máy chủ báo collector chết | Thêm ca chéo (Kev true + collector false và đảo lại) + chiều đỏ tráo ánh xạ | fixed: AC-5, E5 (ca chéo + chiều đỏ «tráo ánh xạ kev ↔ collector-api»), design mục 4 |
