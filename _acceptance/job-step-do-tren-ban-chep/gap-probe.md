---
slug: job-step-do-tren-ban-chep
at: 2026-11-17T01:44:34Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Căn cứ máy của hai dòng sổ S1: dòng bỏ coverage-scan trích «Ngoài-1: mở hợp đồng mới», câu ấy quyết việc mở hợp đồng chứ không quyết việc bỏ quét; dòng không sửa các Known limits khác chỉ trích dòng Ngoài-6 mà phủ cả mười hai mục. | Cổng Phạm vi đọc «muc-tieu» kèm câu của Mạnh, tưởng Mạnh đã chốt bỏ quét và chốt cả danh sách, rồi duyệt trên căn cứ sai. | Mỗi dòng muc-tieu trích đúng câu quyết lựa chọn ấy; không có thì đổi nguồn. | fixed: dòng bỏ quét bị thay bằng dòng quét thật (d-…-8, supersedes d-…-5), mục Coverage nay có ba trục + Core/Never; dòng Known limits bị thay (d-…-9, supersedes d-…-7) trỏ đúng dòng mở khối Known limits trong hợp đồng cũ, dòng phủ cả mười hai mục |
| P1 | evals | E1 không ghim rằng gốc kho trong kho tạm là kho tạm, và không chụp tệp bọc của cây THẬT. | Tệp test suy gốc kho sai thì kho tạm luôn sạch kể cả với mã cũ (chiều xanh rỗng), và bản đột biến chiều đỏ ghi thẳng vào tệp bọc thật — đúng lớp lỗi hàng này gỡ. | Chụp tệp bọc thật trước và sau cả hai chiều. | fixed: E1 thêm lưới đỡ chụp (sha256, mtimeMs, ctimeMs) của tệp bọc THẬT trước và sau cả chiều xanh lẫn đỏ, thông điệp ghim «JST-AC-1-bc phép đo đã chạm tệp bọc thật». KHÔNG thêm đột biến «gốc kho cố định về kho thật» như đề xuất: chính đột biến ấy sẽ ghi vào tệp bọc thật lúc chạy — gốc kho đã suy từ import.meta.url (design §3) |
| P1 | evals | «Cả ba ô đi qua cùng một hàm tách khối» là quan hệ, E2 chỉ đo một nửa: đột biến «hàm luôn trả rỗng» chỉ chứng ô (iii). | Ô (i) tự tách khối bằng đường mã riêng mà E2 vẫn xanh; chiều đỏ của ô (iii) không còn bảo vệ ô (i). | Đột biến ngược chiều: hàm luôn trả một khối giả → ô (i) phải đỏ. | fixed: E2 thêm đột biến «khoiTrenMoc luôn trả MỘT khối giả» → ô (i) đỏ với thông điệp ghim cũ; design §3 ghi hai đột biến ngược chiều |
| P2 | evals | Dựa trên [d-20261117T011913Z-35]: cho rằng jst_regress đã sáu bộ nên «năm bộ» của AC-3 và E4 sai. | Lời AC-3 sai so với executor. | Đếm số bộ thật của executor. | rejected: dòng d-20261117T011913Z-35 đã bị thay bởi d-20261117T012059Z-36 (Mạnh «Để nguyên»), và jst_regress trong _acceptance/config.yaml đã hoàn lại về đúng năm bộ |
| P2 | evals | «Hai tệp bọc và job-step.sh không đổi một byte» nằm ở Out of scope mà không eval nào đo. | Vòng lỡ sửa job-step.sh hay phần dưới mốc mà vẫn tương thích; cổng duyệt một lời khẳng định không có thước. | git diff --exit-code origin/main trên hai tệp. | fixed khác đề xuất: bỏ lời «không đổi một byte» khỏi Out of scope và design, thay bằng «đọc ở diff của PR, không có eval riêng» kèm lý do. Không thêm eval: một ca test khẳng định hai tệp bằng origin/main nằm trong jst_unit và sẽ đỏ ở mọi nhánh sau này sửa chúng hợp lệ |
