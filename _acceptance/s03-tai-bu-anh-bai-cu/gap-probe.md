---
slug: s03-tai-bu-anh-bai-cu
at: 2026-11-26T11:00:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals (E2, probe mục 4) | AC-2 đo chuỗi có mặt trên cả tệp, không giới hạn điều 7, không kiểm cặp ngày–số | Chuỗi rải chỗ khác của tệp thì mục 4 vẫn PASS dù điều 7 trống hay sai số | Cắt riêng điều 7, kiểm cặp ngày–số, đột biến đổi số | fixed: probe cắt đoạn điều 7, đòi chuỗi cặp «21/11 177 · 22/11 318 · 23/11 35 · 24/11 165»; đối chứng đổi 318→319 → ĐỎ |
| P1 | design / evals (E2) | Sổ d-7 nói điều 7 cảnh báo finalize mà AC-2 không đòi | Chạy finalize-hanoi.sh sau gộp trước PL40 → ảnh bù bị đè, hồ sơ vẫn ký đạt | Đòi điều 7 nêu finalize | fixed: AC-2 và probe đòi điều 7 nêu zalo-import-daily.sh và finalize-hanoi.sh; sổ thay d-7 bằng dòng nói đúng (điều 7 nêu chỗ, không có câu cảnh báo) và giá nếu chạy finalize trước PL40 |
| P1 | evals (E3, probe 5a) | Chiều «lượt thường không đi replay» không có đột biến | Điều kiện luôn đúng mà dữ liệu ca trùng thứ tự → mọi lượt thường bị xếp lại mà ca vẫn xanh | Đột biến bỏ điều kiện LAST = 0 | fixed: (5c) luôn đi replay → ĐỎ «lượt thường (LAST có mốc)…» (đo 26/11) |
| P1 | evals (E4, E5, probe 1) | Chỉ kiểm tổng tests ≥ 10, không kiểm tên ca; AC-4, AC-5 không có đột biến | Xoá ca raw bất biến hay ca 403, thêm ca tầm thường → mục 1 vẫn PASS | Grep tên ca; đột biến 403 | fixed: probe đòi dòng ✔ cho 7 ca nêu tên; (5e) bỏ nhận 403 → ĐỎ «ghiSnapshotBuu: gặp http-403 dừng HẲN» |
| P2 | evals (E6) | Chiều đỏ của AC-6 chỉ là số đo ghi tay | Lệch khối liệt kê mà probe không chứng | Đột biến lệch khối → nap-argmax đỏ | fixed: (5d) đổi một dòng trong khối liệt kê của bản chép → ĐỎ «nap-argmax: khối liệt kê hai bản GIỐNG HỆT nhau» |
