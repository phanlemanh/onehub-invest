---
slug: s08-test-cach-ly-token
at: 2026-11-26T08:30:00Z
verdict: findings
p0: 0
p1: 1
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals (E5) / contract AC-5 | Lệnh zc19_cach_ly chạy npm test toàn bộ collector với HOME thật của máy chấm; chiều đỏ của E5 chỉ là chữ | Trên Mac mini có tệp token thật, một ca khác còn đọc token vẫn xanh ở đây rồi đỏ oan trên M5/CI — AC-5 không chứng được mục tiêu | Chạy npm test với HOME + TMPDIR tạm; ghim fail 0 và không ENOENT s08-token | fixed: zc19_cach_ly chạy npm test với HOME=$(mktemp -d) TMPDIR=$(mktemp -d); đo 26/11 89/89, kỳ vọng E5 ghim không ENOENT |
| P2 | evals (E2, probe b) | Probe (b) chỉ âm tính; không đối chứng dương dưới HOME 000; quyền 000 không chặn root | Máy chấm chạy root: tệp 000 đọc được, bản không cô lập vẫn xanh — AC-2 xanh rỗng | Kiểm cat tệp 000 thất bại; thêm (b') bản phá dưới HOME 000 ghim EACCES; hoặc nội dung JSON hỏng | fixed: (b) dùng tệp 000 + JSON hỏng, FAIL khi cat đọc được (root); thêm (b') bản phá (c) dưới cùng HOME → ĐỎ (EACCES hoặc lỗi JSON) |
| P2 | evals (E5, config zc19_cach_ly) | git diff so với đầu origin/main, không so merge-base | Main nhận thay đổi collector/src khác → AC-5 đỏ oan, hoặc origin/main cũ → xanh sai | git diff với $(git merge-base origin/main HEAD) | fixed: lệnh so với $(git merge-base origin/main HEAD) |
