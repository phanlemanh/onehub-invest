---
slug: boc-sdt-du-va-chon-ro
at: 2026-10-30T17:20:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ bỏ coverage-scan (d-…-8) trích tiêu đề audit — câu trích không quyết việc bỏ quét; audit đo trên tập cũ. | Người ký tưởng bốn dạng là toàn bộ hình thái; biểu thức mới cho hai ký tự tách sinh hình thái audit chưa đo (hai số kề); ma trận chỉ liệt dạng thấy hôm nay nên vẫn xanh. | Ma trận hình thái toàn phần (tiền tố × ký tự tách × một/hai ký tự tách × hai số kề), số assert bằng số ô. | fixed: AC-1 thành ma trận toàn phần 60 ô, AC-2 thêm hai số kề; dòng sổ mới thay d-…-8 (nguồn một-lối). |
| P0 | contract | Dòng sổ «viết sẵn sdtE164» (d-…-7) ghi một-lối trong khi lối «không viết» vẫn sống. | Cổng Phạm vi duyệt AC-7 như bắt buộc; SD3 đổi chữ ký khi nối nên ca test và răng quét phải sửa lại. | Ghi lại nguồn đúng hoặc descope có tên. | fixed: bỏ sdtE164 khỏi SD2 (descope có tên, thay d-…-7), AC-7/E7 cũ gỡ, đánh số lại AC-1…AC-9. |
| P1 | contract | Ma trận thiếu ca hai SĐT kề nhau cách bởi ký tự tách hoặc xuống dòng — va với luật bỏ khớp 11 chữ số. | «0912 345 678 0987 654 321» nối thành 11+ chữ số và mất cả hai số; E1/E2 vẫn xanh. | Dòng viết trước hai số kề với mỗi ký tự tách; ca đỏ bản sao cho khớp vượt 10 chữ số ghim «hai số kề»; định nghĩa xuống dòng. | fixed: AC-2/E2 thêm hai số kề + ca đỏ; thiết kế §2: xuống dòng không là ký tự tách, đúng 9 chữ số sau tiền tố, luật đuôi. |
| P1 | evals | Định nghĩa n lệch giữa AC-5 (hợp số các bài) và E5 (một bài hai số); thước dùng chung nguồn với log. | Tin hai bài mỗi bài một số: AC-5 tính, E5 không; log sai định nghĩa vẫn bằng thước nên xanh. | Một định nghĩa; thước đếm bằng bộ dò rộng độc lập; in cạnh số audit; ca dương tin hai bài. | fixed: AC-5 và E5 cùng định nghĩa hợp số, thước đếm bằng bộ dò rộng, in cạnh S03 11 / S05 1, ca dương tin hai bài. |
| P2 | evals | Răng quét E7 (sdtE164) chỉ quét hai tệp theo chuỗi, không đối chứng dương. | Gọi qua bí danh hay tệp transform thứ ba lọt răng. | Quét theo glob + import, ca đỏ bí danh. | rejected: sdtE164 đã bỏ khỏi SD2 (P0 thứ hai), không còn răng quét. |
