---
slug: do-lech-s03-s06-canh-hang
at: 2026-11-15T23:30:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ S1 về khoá nhóm gộp cả việc chọn đếm theo phiếu thay vì theo tin; câu trích chỉ quyết khoá nhóm, còn câu giao hứa «số tin mỗi bên» — nghĩa người dùng thấy mà sổ ghi máy quyết | Căn S06 ba tin cùng nhóm: màn ghi 92 trong khi nhóm có 110 tin; Cổng 1 duyệt «số tin» mà không biết số đếm căn; mọi eval vẫn xanh | Dòng Hỏi đếm phiếu hay tin; AC-6/E6 có DealRow 9 căn 10 tin, đột biến đổi đơn vị đỏ | human-gate1: thêm Hỏi-3 (khuyến nghị đếm căn, ghi «căn»), dòng khoá nhóm thay bằng dòng mới supersedes; AC-6, E6 thêm ca 9 căn 10 tin, thiết kế đổi đơn vị sang «căn» |
| P1 | design | Một câu chung cho mọi trạng thái thiếu bên; thieu-s03 không ghim chữ | Tin S03 ở nhóm S03 4 · S06 50 hiện «S06: chưa đủ để so (50 tin)» — đổ lỗi cho S06 | Ba câu riêng thieu-s03, thieu-s06, thieu-hai ở danh sách lẫn trang một căn; đột biến dùng câu thieu-s06 cho thieu-s03 đỏ | fixed: thiết kế §2.3 ghim bốn câu theo trạng thái; AC-6, E6 ghim cả bốn và thêm đột biến |
| P2 | evals | E8 bước 1 không chọn dòng bằng SQL, không đòi số khớp bảng; không khung danh sách nào chụp thiếu bên | Dòng phụ lấy nhầm nhóm vẫn được chấm đạt | Bước 1 chọn tin bằng SQL, ghi khoá nhóm và dòng bảng vào observed; thêm khung danh sách thiếu bên | fixed: E8 bước 1 chọn bằng SQL và so dòng bảng; thêm bước 4 danh sách nhóm thiếu bên |
| P2 | contract | Timebox của ô cơ hội để trống nên «Kết quả CHẾT khi hết timebox» không đo được | Ở Cổng Giá trị không có mốc để kết luận CHẾT | Điền Timebox bằng ngày hay số vòng | deferred: timebox là lời Mạnh (Cổng Đáng ký «ngưỡng như đề xuất» khi ô để trống) — nêu trên thẻ Cổng Phạm vi để Mạnh điền nếu muốn; ngưỡng đo được của mốc đọc theo AC-7 |
