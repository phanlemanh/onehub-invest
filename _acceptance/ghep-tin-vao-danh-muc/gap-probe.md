---
slug: ghep-tin-vao-danh-muc
at: 2026-11-18T05:12:00Z
verdict: findings
p0: 4
p1: 1
p2: 0
---

# Phản biện context sạch — PL20 (18/11)

Thay bản số đo S1 ngày 12/11 của phạm vi cũ; số đo mới nằm ở design doc §2.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | AC-9 chỉ có eval judgment, không tính lại Wilson từ nhãn thô, không chứng luật khoá trước nhãn, không tách mức toà với phân khu cụm | Báo cáo tự viết số đạt trong khi luật đã sửa sau khi xem nhãn | Eval script tính lại từ nhãn thô, so thời điểm commit với nhãn đầu | fixed: thêm E9 script và E10 có contract trong inputs; AC-9 đòi tách mức và chốt cỡ mẫu trước buổi gắn. Giới hạn nháp dẫn dắt người gắn ghi ở Notes |
| P0 | contract | Ngưỡng 45% buộc dựa vào đọc chữ bài vì trần theo cột chỉ 43,8%; không có lối ra khi hụt; ngưỡng UAT cũ còn ghi gắn trục | Mạnh duyệt 45% tưởng còn dư, nguồn chữ bài sai mà không đo riêng | Trần theo từng nguồn, câu hỏi về lối ra | human-gate1: Hỏi-1 (chỉ cột toà, ngưỡng 40%) và Hỏi-3 (ngưỡng UAT, timebox, lối ra khi hụt) |
| P0 | design | Lựa chọn nối vào lượt nạp chưa loại lối bước riêng; AC-7 không đo bước gắn lỗi hay chạy lâu | Trigger từ chối một dòng làm S03 ngừng nạp qua nhiều lượt | Cấy lỗi ghi, trần thời lượng | fixed: giao dịch riêng, lỗi chỉ cảnh báo, trần 60 giây trong AC-7 và E7; dòng sổ mới nêu lối bước riêng chết vì tệp job thuộc làn thu |
| P0 | design | Xung đột giữa toà và phân khu chưa phủ; dòng của luật khác có thể làm tăng tử số; căn cứ chọn trường subzone yếu | Bài A gắn toà, bài B gắn phân khu khác mà tin vẫn tính đã gắn | Ma trận bốn ô, trần xung đột, cấy rule_id khác | fixed: AC-5 và E5 bốn ô, trần 1%, view chỉ đọc đúng rule_id; AC-8 cấy rule_id khác; đo nhiều bài ở design §2; dòng sổ mới trích migration 096 |
| P1 | evals | Fixture viết tay; E6 thiếu ca danh bạ đổi; E7 có thể băm thư mục rỗng; E8 không nói cách đếm độc lập | Xanh giả khi thư mục rỗng hoặc khi đếm lại chính phát biểu đã ghi | Mẫu thật theo ô, năm ca đổi dữ liệu, số tệp lớn hơn 0, dung sai khai trước | fixed: E1 rút từ dữ liệu thật, E6 năm ca, E7 đòi số tệp lớn hơn 0, E8 đếm từ block_raw với dung sai 0,5%. Ca ngữ cảnh chữ bài hết hiệu lực vì lát này không đọc chữ bài |
