---
slug: so-lenh-sua-sau-tv4
at: 2026-11-11T05:30:00Z
verdict: findings
p0: 0
p1: 1
p2: 3
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E8, E9 chỉ chạy với exec giả do người viết test đặt; không ca nào đi qua mgmtExec thật, đường đọc SUPABASE_MGMT_TOKEN từ cloud.env, dạng phản hồi thật, hay việc nạp sync-cloud.mjs có tự chạy sync không | mgmtExec thật nhận khoá rỗng (401) hay dạng phản hồi khác mảng dòng mà E8, E9 vẫn xanh; trên máy thu ghi token khi cloud không nhận hoặc thoát 2 oan | ca SS-AC-8b: mgmtExec thật với fetchImpl giả, HOME tạm, assert header Bearer, body có băm không có token, phản hồi thật thoát 0, rỗng thoát 2, nạp module không gọi mạng; đối chứng đỏ không đọc khoá | fixed: thêm E10 (SS-AC-8b) và vế tương ứng vào AC-8; thiết kế thêm hàm chay() nhận fetchImpl, main chỉ chạy khi gọi trực tiếp |
| P2 | evals | E7 không ghim phép thay ~/Library/LaunchAgents có trúng không, và dòng cài có chứa launchctl không | dòng cài viết đường khác hoặc có launchctl bootstrap thì phép đo ghi đè plist thật và nạp job vào launchd thật — làm trước bước cần lời Mạnh | assert dòng có đúng một ~/Library/LaunchAgents, không launchctl; HOME tạm; so tên + mtime thư mục thật trước và sau; đối chứng đỏ thêm launchctl | fixed: siết E7 và AC-7 đúng như đề xuất |
| P2 | design | dòng sổ d-2 gộp hai lựa chọn dưới một câu trích chỉ mô tả triệu chứng; câu đó không quyết việc để ngỏ cả loại lỗi kẹt hàng | cổng đọc d-2 như đã chốt từ mục tiêu; một TypeError khác trong apLenh lại kẹt hàng sau gộp | tách d-2: (a) chặn ở kiemLenh giữ câu trích; (b) không thêm lưới thành câu hỏi hoặc nguồn một-lối có lối chết | fixed: dòng mới thay d-2 cho (a); (b) thành câu hỏi Hỏi-1 cho Mạnh ở Cổng Phạm vi, khuyến nghị tách lưới chung thành hàng riêng |
| P2 | design | d-3 chỉ loại lối PATH viết cứng; bỏ qua thay __PATH__ lúc cài và chạy qua zsh -lc | cổng duyệt cách neo node như chỉ có một lối; đổi bản node thì plist trỏ đường cũ | nêu vì sao từng lối chết hoặc cân nhắc; thêm dòng runtime-map đổi node thì cài lại | fixed: dòng mới thay d-3, căn cứ collector/scripts/api-launchd.sh, nêu hai lối kia; neo đường command -v không giải symlink để nâng bản qua ~/.local/bin/node vẫn chạy; runtime-map ghi đổi chỗ node thì cài lại |
