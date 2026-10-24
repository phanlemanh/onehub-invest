---
slug: o-kpi-chi-do-local
at: 2026-10-24T13:08:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ ghi máy quyết ô Lockdown trên cloud hiện «—» tới ON23 (một-lối) trong khi còn lối khác — đánh đổi trên tín hiệu an toàn Zalo, chỉ người quyết | Mạnh duyệt mà không thấy cloud mất tín hiệu lockdown tới ON23 | Thành câu Hỏi cho Mạnh, design và AC-3 theo lựa chọn | human-gate1: Hỏi-1 (máy khuyên A «—» + badge warning «Chưa kiểm được trên cloud»), dòng sổ mới supersedes d-6; design và AC-3 ghi theo Hỏi-1 |
| P1 | contract | AC-1 đếm đúng một chuỗi, bỏ sót biến thể «chỉ đo ở local» của ô và PageHeader; chữ /ops/review mâu thuẫn design | Biến thể còn trong PageHeader mà E1 vẫn xanh; hoặc /ops/review đỏ oan | Ghim nguyên văn từng trang + regex bắt mọi biến thể + chiều đỏ PageHeader | fixed: AC-1 ghim chữ theo trang, đếm mọi biến thể hoa thường; E1 thêm chiều đỏ PageHeader; design bỏ câu chỉ-local ở stats |
| P1 | evals | E4, E5, E6 không nói nguồn bản tin — fixture tay đúng khuôn bên đọc; E5 không so với review_queue thật | Bên ghi đổi khuôn byType hay đánh dấu lỗi khác, E5/E6 vẫn xanh trên fixture tay | Bản tin thật qua handler ingest thật; E5 so đếm SQL; E6 làm hỏng ở bên ghi | fixed: AC-4/5/6 và E4/5/6 dùng push-ops-facts thật qua handler ingest thật; E5 seed review_queue và so đếm SQL, chiều đỏ đổi khuôn byType; E6 làm hỏng lược đồ ở bên ghi |
| P1 | evals | E8 hỏi chữ ba trang nhưng inputs thiếu các tệp chữ | Câu trấn an còn trong ô KPI mà hội đồng không thấy | Thêm tệp ô KPI, LocalOnlyAlert, review-content vào inputs | fixed: E8 inputs thêm local-only-alert, overview-tiles, collections-tiles, review-content; câu hỏi chỉ đối chiếu design (đã chép bat_khi) và ADR |
| P2 | evals | E10 chụp 5/8 trạng thái, khung tối/hẹp không ghi trang | Alert 45′ trên Thu thập tràn ngang mà E10 vẫn đạt | Mỗi ST một khung đúng tên; khung tối/hẹp ghi trang + trạng thái | fixed: E10 chụp đủ 8 ST, khung tối và 390px mang tên ST, kiểm scrollWidth cả ba trang |
