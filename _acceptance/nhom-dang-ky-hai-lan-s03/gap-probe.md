---
slug: nhom-dang-ky-hai-lan-s03
at: 2026-11-04T15:25:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Câu trích nguồn mục tiêu của dòng chọn đại diện chỉ liên quan, không quyết dòng nào làm đại diện [can-gia-tot-sua-ba-loi#F2] | Người ký tưởng mục tiêu đã quyết, trong khi lối chỉ lấy mã nhỏ nhất vẫn sống và lát đã lấy thì không đổi | Câu trích phải trả lời được «dòng nào làm đại diện» | fixed: thay bằng dòng chỉ-người Hỏi-1 kèm khuyến nghị và lối khác |
| P0 | contract, evals | Bảng của AC-4 chưa có trong artifact; câu «y hệt» mâu thuẫn ô chỉ có tiền tố; lý do bỏ quét độ phủ sai; thiếu ô gộp quá tay | Kỳ vọng viết sau mã nên xanh theo mã; `conv:x` gộp nhầm mà không đột biến nào bắt | Bảng trong contract, đột biến gộp quá tay đỏ có thông điệp ghim | fixed: bảng 13 ô, thu hẹp «y hệt», chạy quét độ phủ, thêm M4 |
| P1 | contract, evals | «Cách xử lý» của AC-5 không có nội dung và không đo; lát mồi có thể INSERT tay | Lệnh khuyên xoá lát đã mang công gắn nhãn mà E5 vẫn xanh | Ghim nguyên văn câu báo, không lời khuyên xoá, lát do bản nguyên văn ghi ra | fixed: AC-5, E5 và dòng sổ giữ nguyên lát cũ |
| P1 | evals | Chiều đỏ của E2 dùng «hoặc» nên xếp theo số gộp có thể chưa từng đỏ; fixture chưa đủ nhiều nhóm | Mọi nhóm đều là nhóm lớn, xếp sai vẫn xanh | Ghim riêng từng lời hứa, thêm đột biến xếp theo dòng và đếm tổng | fixed: M5, M6, fixture nhiều nhóm hơn số nhóm lớn |
| P1 | design, evals | Design ghi một khoá đọc từ sổ thật; không eval nào quét tệp kho | Khoá thật lên kho công khai trong khi mọi eval xanh | Quét tệp đổi và đầu ra bằng khoá đọc từ sổ lúc chạy, có đối chứng khoá mồi | fixed: bỏ khoá khỏi design, thêm AC-8, E8 |
