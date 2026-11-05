---
slug: anh-tren-the-gan-nhan
at: 2026-11-05T05:00:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng bỏ design-pass trích một mã danh mục, không quyết được; contract không nói đã bỏ bước này | Mạnh tưởng duyệt mẫu đã chạy, không biết duyệt UI bằng chữ cho dải ảnh mới trong đầu thẻ dính | Sửa căn cứ, thẻ có câu nói rõ và phần mới | human-gate1: thành Hỏi-3, contract và design ghi phần mới |
| P0 | decisions | Dòng đảo lời giao về URL gốc ghi máy quyết, giá chưa đo | Mạnh tưởng đúng lời mình giao; nếu lấy hộ hỏng các bài này bị gắn sai | Thành Hỏi có khuyến nghị, thay giá bằng số đo | human-gate1: thành Hỏi-2. Fixed: đo được 48 lấy được, 36 không, cả 36 URL gốc cũng trả 400 |
| P1 | evals | Không đo không ghi snapshot, nhánh URL chỉ dùng hàm giả, không chạy trên bài thật | Lọc từ chối host ảnh hay khuôn JSON thật khác seed mà máy vẫn xanh | Probe chỉ đọc trên 367 bài, băm cây snapshot | fixed: thêm AC-9, E9, băm cây ở E3 |
| P1 | evals | E6 chỉ mồi một bảng, không đo trang, không chiều đỏ http, tập tên miền có thể rỗng, URL không scheme lọt | Tên miền hay giá trị máy đọc lộ mà máy xanh | Mồi đủ bảng, quét HTML, đối chứng, buộc tập khác rỗng | fixed: E4, E6, E7, E1 cập nhật; đo thật có 2 bài `www.` và 3 bài dạng tên miền nên AC-1 mở rộng |
| P1 | evals | AC-5, AC-8 không có ui-check, không có thứ tự gộp và áp 075, bài chỉ có link lạ hiện câu trống sai, băm chữ không đo | Gộp trước khi áp thì bấm «Ảnh» bị CHECK từ chối | ui-check có ảnh chứng, ghi thứ tự | fixed: thêm E10, E11, Notes ghi áp 075 trước khi gộp, AC-1 đo băm trên chữ gốc, AC-5 có câu liên kết khác |
