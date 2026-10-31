---
slug: chuan-hoa-o-duong
at: 2026-10-31T09:20:00Z
verdict: findings
p0: 0
p1: 4
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Vế 2 của AC-8 đụng Out of scope (tên dự án) và «approved» chưa ghi nghĩa «Cùng căn» | Thẻ cùng căn ghi tên dự án ra khac_duong đúng descope mà E8 đỏ; hoặc vế xanh rỗng | Lọc thẻ có cụm vị trí/số nhà/dấu phẩy, ghi nghĩa approved, in số đếm | fixed: AC-8 + E8 lọc thẻ approved (người nhận cùng căn, như LT-AC-6) có ô đường mang cụm vị trí, số nhà hay dấu phẩy; in số thẻ |
| P1 | design | Cắt dấu phẩy trước khi bỏ cụm vị trí làm «Ngõ 5, Kim Mã» mất tên đường | «Ngõ 5, Kim Mã» ↔ «Kim Mã» ra Thiếu, probe AC-8 đỏ trên dữ liệu thật | Thêm hai cặp có phẩy sau cụm vị trí + đột biến «cắt phẩy trước» | fixed: design đổi thứ tự (bỏ cụm vị trí trước, cắt phẩy sau); AC-1/E1 thêm «Ngõ 5, Kim Mã», «Số 10, Ngõ 9, La Dương» + đột biến cắt phẩy trước |
| P1 | design | Căn cứ dòng sổ giữ hai cách đọc số nhà trần chưa đứng; «30 Tháng 4» ↔ «2 Tháng 4» khớp nhầm không AC nào đo | Luật không loại hai đường đánh số khác, mọi E xanh | Đưa thành câu hỏi hoặc đo cặp số trần khác nhau | fixed: dòng sổ mới (supersedes) thêm ngoại lệ «tháng <số>»; AC-3/E3 đo «30 Tháng 4» ↔ «2 Tháng 4» ra khác căn + đột biến bỏ ngoại lệ; số nhà trước tên khác ghi Out of scope |
| P1 | evals | Không eval nào chạy lại ca cũ của khoá đường HD2 và test bảng so the-duyet-*; chưa định chỗ bỏ dấu | Bỏ dấu từ đầu làm «Dương Lâm» sinh cách đọc thừa, E1–E8 vẫn xanh | Thêm eval chạy judge-luat + test the-duyet-*, cặp HD2 vào AC-7, kê hồ sơ phải ghim lại | fixed: AC-9 + E9–E12 chạy judge-luat, the-duyet-du-can-cu, the-duyet-phuong-lech-gia, the-so-gia-tri-song; AC-7 thêm 3 cặp HD2 (58 ô); design ghi dấu giữ tới bước cuối, cụm vị trí liệt kê dạng không dấu; Notes kê 8 hồ sơ phải ghim lại |
