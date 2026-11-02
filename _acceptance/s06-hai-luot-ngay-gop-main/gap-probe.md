---
slug: s06-hai-luot-ngay-gop-main
at: 2026-10-31T13:20:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Tên tính năng hứa S06 thu 2 lượt/ngày nhưng mọi AC chỉ đo cấu hình | launchd gọi 14:00 nhưng chotot-daily bỏ lượt hai (khoá ngày, snapshot trùng tên, nguồn chặn) mà bốn AC vẫn xanh | AC đo log lượt 14:00 thoát 0 và snapshot S06 mới sau 14:00 | fixed: thu hẹp lời hứa — feature đổi thành «kho khớp lịch đã cài», Context nói rõ vòng này chứng cấu hình; bằng chứng lượt 14:00 chạy thật đưa vào Out of scope làm bước triển khai làn ZCode (chưa đo được: plist cài 19:56, sau mốc 14:00 của ngày 31/10) |
| P1 | contract | AC-2 chỉ quét pipeline/cron, không có ma trận job đã cài, không nói cách xử lý StartInterval | Job đã cài ngoài pipeline/cron mốc 13:30 hoặc StartInterval làm máy thu va lịch mà E2 xanh | Ma trận mọi com.oneinvest.* đang cài, loại trừ StartInterval có tên, job giả 13:30 ngoài kho phải đỏ | fixed: răng so với plist kho HỢP mọi com.oneinvest.*.plist ở ~/Library/LaunchAgents, in danh sách loại trừ StartInterval theo nguồn kho/cài, thêm job giả 13:30 ngoài kho va 14:00 |
| P1 | contract | AC-2 đo khoảng giờ bắt đầu, lời hứa thật là không chạy chồng theo thời lượng | Lượt 14:00 kéo dài chồng airdna 19:05 hoặc job ghi DB khác | p95 thời lượng từ log, khoảng chạy không giao | deferred: chưa có số p95 ở nhịp 2 lượt; dòng revisit trong sổ, Out of scope ghi rõ |
| P1 | design | Sổ không ghi thay đổi đã chạy thật trước Cổng và tác động ngoài kho (tần suất S06 gấp đôi) | Cổng 1 duyệt như chỉ gộp tệp trong khi hậu quả ngoài kho đã diễn ra | Dòng sổ ghi đã cài trước Cổng, nguồn duyệt, tác động, bước đảo và dấu hiệu kích hoạt | fixed: dòng sổ approach mới ghi đủ bốn vế |
| P2 | evals | Đối chứng E1 không có phần tử lịch mang khoá thừa Weekday/Day/Month | Mốc 14:00 kèm Weekday 2 chỉ chạy một ngày mà răng vẫn xanh | So nguyên phần tử, đột biến Weekday phải đỏ, ghim thông điệp | fixed: răng so nguyên phần tử StartCalendarInterval; đột biến «14:00 kèm Weekday 2» đỏ với thông điệp AC-1 chứa "Weekday":2, ghim trong expected của E1 |
