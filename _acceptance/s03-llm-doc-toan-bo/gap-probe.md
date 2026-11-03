---
slug: s03-llm-doc-toan-bo
at: 2026-11-02T16:17:14Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract, evals, design | Đường tự ghi không có phép đo độ đúng trên chữ thật; mẫu 30 tin không có AC; số thẻ không có trần; kho_dao của Hỏi-3 ghi false | Bài «nhà riêng gần chung cư» được áp apartment, mọi eval xanh, ghi sai trên tối đa 2.671 tin; giá lệch sinh nghìn thẻ | AC đo độ đúng trên nhãn, ma trận bẫy từ khoá, cờ mẫu, trần thẻ | fixed: thêm AC-10, E13, ma trận bẫy ở AC-3, E4, trần thẻ AC-8, Hỏi-3 kho_dao true; ngưỡng là human-gate1 |
| P0 | design, contract | Căn cứ máy của d-5, d-6, d-10 không đứng được | Trả tiền xong muốn PN, WC phải đọc lại; báo 05/11 tụt vì tin mới, tiền hằng ngày chưa ai hỏi | Hỏi-4, Hỏi-5, đổi căn cứ d-5 | fixed + human-gate1: Hỏi-4, Hỏi-5 mới, d-5 đổi căn cứ một lối |
| P0 | contract, evals | «Quyết được» của AC-7 không có nghĩa cho thẻ không đề xuất; một tin có thể hai thẻ; thẻ có mặt người mà không ui-check | Duyệt 110–140 thẻ không có gì đổi; câu trích không hiện | Bảng tác động từng nút, fixture ba bất đồng, ui-check | fixed: thẻ gộp enrich:, bảng tác động trong design, AC-7, E7, E12, surfaces thêm ui |
| P1 | contract, design | Việc đổi lời hàng nêu chưa đủ | Mạnh duyệt không nhận ra tin Yêu cầu vẫn trong dữ liệu | Câu nêu trong Context, nhánh thêm cột | fixed: Context, design, opportunity, Hỏi-1 |
| P1 | contract, evals | Ngưỡng và mệnh đề thiếu đường đo: tử mẫu, 5 USD/ngày, trần mặc định, tên nguồn trong thân bài | Skipped làm đạt 90% giả; tên nguồn rời máy mà E2 xanh | Công thức, cờ đỏ, ca đọc cờ, ca tên nguồn | fixed: AC-2, AC-8, AC-9, E2, E8, E9 |
