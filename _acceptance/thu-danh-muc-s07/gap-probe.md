---
slug: thu-danh-muc-s07
at: 2026-11-11T02:45:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Lựa chọn «chỉ bỏ tên miền, để nguyên tên nguồn viết bằng chữ» không có dòng sổ; câu trích của dòng d-…-4 không quyết được | Tên nguồn bằng chữ hoặc link tới máy chủ thứ hai mang nhãn nguồn nằm trong stg; người duyệt hiểu «không tên miền» là «không tên nguồn»; tệp trong kho công khai mang nhãn nguồn mà phép soát theo tên miền không bắt | E10 soát thêm nhãn nguồn: 0 trong tệp của vòng, 0 máy chủ còn lại mang nhãn; in số dòng stg còn nhãn trong văn bản tự do | fixed: dòng sổ d-…-9 thay d-…-4 (căn cứ AGENTS.md «Bốn thứ này KHÔNG rời máy local.»); AC-6, AC-9, E10 thêm vế máy chủ mang nhãn và tệp trong kho; Notes của hợp đồng nói rõ tên nguồn bằng chữ còn ở stg local và đường lên cloud phải che |
| P0 | design | Dòng d-…-6 gộp hai lựa chọn; «thiếu cờ thì bỏ» không chết vì ràng buộc nào [bait-gap-mot-giao-dich#F2] | Item thiếu cờ bị loại vĩnh viễn (raw bất biến), phải thu lại trên nguồn thu chậm; Cổng Phạm vi duyệt mà không biết số item bị bỏ | Đếm trên 12 snapshot theo kind × cờ; thành một dòng Hỏi | human-gate1: đếm ra 38 trang danh sách + 7 trang dự án cờ false, 2 sitemap thiếu cờ, 0 cờ true; dòng d-…-10 giữ vế «cờ true không nạp», dòng d-…-11 là Hỏi-1 «thiếu cờ thì không nạp?» (khuyên: không nạp) |
| P1 | evals | Số đếm độc lập của E10 không trừ phần bỏ hợp lệ; «0 không bóc được» coi mọi lần bỏ đúng là đỏ | Raw tăng trong lúc thu song song: một trang dự án rỗng, một thẻ quảng cáo hay một dự án lặp làm E10 đỏ dù bộ nạp đúng | Đẳng thức có phân loại theo lý do bỏ; thêm «0 dòng stg thuộc item cờ true» | fixed: AC-9 và E10 viết lại theo đẳng thức; dòng tổng kết của bộ nạp tách con số theo lý do; chỉ kind lạ và item lành bóc rỗng buộc bằng 0 |
| P1 | evals | AC-2..4 hứa từng cột ở stg nhưng chỉ đo hàm thuần; thứ tự nạp và captured_at không có phép đo | Đổi chỗ hai cột trong hằng ánh xạ, attributes mất thứ tự khi lưu đối tượng jsonb, captured_at lấy giờ nạp — số dòng vẫn đúng | Đọc lại từng cột từ DB so với hàm bóc; nạp hai thứ tự so băm; đột biến đổi cột phải đỏ đúng tên | fixed: AC-2 thêm captured_at; AC-5 thêm hai gạch (so từng cột, hai thứ tự); E5 thêm bộ so cột có chiều đỏ và ca hai thứ tự (tám ca); attributes đổi thành mảng cặp {label, value} |
| P2 | evals | Vế «từ chối DB chung / không có snapshot» của E10 không được đo; gốc snapshot ghim cứng [thuoc-song-song-dem-theo-ten-ca#F1] | So chuỗi localhost trong khi lượt chấm dùng 127.0.0.1 → lệnh áp 093 lên DB chung; chạy từ worktree khác đo nhầm tập snapshot | E11 thêm hai đối chứng; gốc qua tham số, mặc định suy từ git | fixed: E11 thêm đối chứng (4) DB chung hai dạng máy chủ, nhận DB theo tên; (5) gốc rỗng; E10 nhận --goc, in realpath và số snapshot |
