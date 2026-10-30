---
slug: don-clone-tam-design-floor
at: 2026-10-29T08:15:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ nới phạm vi từ bản clone sau-gộp lên bốn nguồn ghi nguồn mot-loi, nhưng ràng buộc «không để rác» do chính hàng tự đặt; Ngoài-1 và tên hàng chỉ nói bản clone [dung-m2-song-song#F2]. | Cổng Phạm vi duyệt việc nới từ một nguồn lên bốn mà người ký không biết đó là máy tự đề xuất. | Thay dòng bằng dòng mới mang supersedes: có câu trích thì mục-tiêu, không có thì đưa người quyết. | human-gate1: dòng mới nguồn chi-nguoi (Hỏi-1) — khuyên dọn cả bốn, lối khác chỉ clone; hợp đồng soạn theo khuyến nghị |
| P1 | evals | AC-1/E1 loại chính tmp-sach.test.mjs khỏi phép đo, trong khi tệp đo tạo nhiều thư mục nhất (clone bản cũ, TMPDIR con, đối chứng mkdtemp trần). | tmp-sach dựng clone hay TMPDIR đối chứng không qua tempDir → mỗi lượt để nhiều rác hơn trước mà E1–E5 vẫn xanh. | Chạy đủ mọi tệp kể cả tmp-sach dưới TMPDIR rỗng (biến lồng chống đệ quy), đòi rỗng sau khi thoát. | fixed: AC-1/E1 chạy TẤT CẢ tệp kể cả tmp-sach, lượt lồng chỉ bỏ đúng ca AC-1; Coverage ghi năm nguồn; dòng sổ coverage-scan thay bằng dòng mới |
| P1 | evals | E4 quét mkdtempSync( mà không có danh sách miễn viết trước, trong khi tệp đo buộc phải có một mkdtemp trần cho đối chứng AC-3. | E4 đỏ trên chính tệp đo, hoặc người cài miễn trừ ngầm cả tệp tmp-sach để một mkdtemp trần thật lọt qua. | Ma trận miễn đóng khoanh dấu mốc; chèn ngoài vùng miễn trong tmp-sach thì thước gọi tên. | fixed: AC-4/E4 khai đúng hai vùng miễn khoanh dấu mốc, đếm số vùng = 2, cặp đỏ chèn ngoài vùng ở tmp-sach.test.mjs |
| P2 | evals | Chống xanh vô nghĩa của E1 chỉ ghim hai dòng ok, khớp cả ok # SKIP; không chứng minh các nguồn thật sự tạo thư mục trong lượt lồng. | Một ca nhánh skip hay không gọi hàm trợ giúp → TMPDIR rỗng vì không có gì được tạo, E1 vẫn xanh. | Đòi dòng ok không mang # SKIP/# TODO; nhật ký tempDir ngoài TMPDIR phải có đủ bốn tiền tố. | fixed: AC-1/E1 đòi ok không SKIP/TODO và nhật ký tempDir có đủ bốn tiền tố |
