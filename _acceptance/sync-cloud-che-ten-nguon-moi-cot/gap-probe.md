---
slug: sync-cloud-che-ten-nguon-moi-cot
at: 2026-11-25T11:25:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Không ghim ngoại lệ cho tên cột airdna_* khi che và chặn mở ra mọi bảng | Khoá cấp dòng bị đổi hoặc bộ chặn trúng tên cột, mọi lượt dừng như 24/11 | AC và ca: khoá cấp dòng giữ, giá trị vẫn che, khoá lồng vẫn che | fixed: thêm AC-8, E8; E6 miễn định danh lược đồ có trong catalog và in danh sách miễn |
| P1 | evals | Lượt khô E5 chỉ dựa lời exec giả, không chứng không chạm cloud | Lượt chấm ghi hoặc khoá cloud thật khi chưa có lời | Đường cloud trỏ cổng chết, kiểm không socket, chiều đỏ bỏ cờ khô | fixed: E5 thêm cổng chết, lsof, chiều đỏ |
| P1 | contract | Che, chặn, đo, kiểm sau áp cùng một lõi — đo vòng tròn | Dạng tên nguồn lõi không nhận ra lọt mà mọi thước ra 0 | Đếm thô độc lập khớp thẳng chuỗi gốc | fixed: AC-5, AC-7, E5, E6, E7 thêm đếm thô độc lập |
| P2 | evals | Tỉ số thời gian so lượt khô với lượt đầy đủ | Che chậm vẫn qua trần, lượt thật vượt nhịp 15 phút | So cùng pha, trần tuyệt đối | fixed: AC-5, E5 so pha đọc + soát của mã cũ cùng giờ, trần < 15 phút |
| P2 | contract | Không AC kiểm bên đọc sau che | markets đọc khoá đã đổi ra null, thẻ Invest vỡ ảnh | Ca markets trước/sau, ca photo_urls toàn trúng | fixed: thêm AC-9, E9 |
