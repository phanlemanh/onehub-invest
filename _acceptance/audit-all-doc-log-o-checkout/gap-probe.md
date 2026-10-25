---
slug: audit-all-doc-log-o-checkout
at: 2026-10-25T05:17:56Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-2, d-3) | Hai dòng sổ ghi nguồn `mot-loi` trong khi lối khác vẫn sống: gọi `git rev-parse --git-common-dir` không chết ở cây không git (chỉ thoát khác 0 → rơi đúng nhánh dự phòng); d-3 bỏ sót lối «đi tiếp + in cảnh báo» | Worktree dùng đường tương đối (`worktree.useRelativePaths`) hay `.git` hỏng → audit lặng lẽ rơi về cây đang chạy, báo LIMITED «trống» giả như trước, không dòng nào nói vì sao | Viết lại d-2, d-3: đổi nguồn hoặc đưa lên câu Hỏi; AC-3 nói rõ có hay không cảnh báo | fixed: đổi cơ chế sang `git rev-parse --path-format=absolute --git-common-dir` (dòng sổ mới thay d-1, d-2 — tự đọc tệp `.git` chết ở đường tương đối); cách hiện ca rơi về cây đang chạy thành Hỏi-1 (dòng thay d-3, nguồn chỉ-người); AC-3 theo Hỏi-1 |
| P1 | contract AC-6 / evals E6 | AC-6 đòi dòng A1 hai lượt thật cùng nội dung trong khi thiết kế bắt lượt worktree in thêm «(log ở checkout chính)»; không vế nào chứng phép so có sức phân biệt | E6 đỏ oan ở S4, hoặc smoke tự cắt chú thích rồi xanh cả khi worktree đọc một `airdna-daily.log` nằm sẵn trong worktree | (a) so sau khi bỏ chú thích (b) chú thích có/vắng đúng chỗ (c) tiền điều kiện worktree không có log riêng | fixed: bỏ hẳn chú thích (dòng PASS không đổi chữ, đầu ra trùng nguyên văn); AC-6 ghi tiền điều kiện worktree không có `airdna-daily.log` riêng |
| P1 | contract AC-6 / Đường đo | Ngưỡng «kết quả trùng lần chạy từ checkout chính» chỉ đo dòng A1 trên lệnh thật; không có ma trận viết trước các đường đọc tương đối với ROOT | Một mục audit khác đọc trạng thái chạy chỉ có ở checkout chính → từ worktree vẫn LIMITED, E2 và E6 vẫn xanh | E6 diff toàn bộ đầu ra hai lượt thật; ma trận mọi đường đọc theo ROOT trong design §1 | fixed: AC-6/E6 so TOÀN BỘ đầu ra hai lượt chạy đồng thời, in từng dòng khác; design §1 thêm ma trận viết trước (audit-all chỉ đọc một đường theo ROOT, dòng 43) |
| P1 | evals E5 / contract AC-5 | `readSchedulerStatus` đọc bốn loại log nhưng AC-5/AC-7 chỉ đo S02 | Glob `weekly-*` hay `launchd-*` còn dựng đường từ hằng cũ → job tuần/smoke/collector-api không giờ từ worktree, E5/E7 vẫn xanh | AC-5 tham số hoá theo từng loại log + luật tĩnh không chuỗi `pipeline/logs` ngoài `log-root.ts` | fixed: AC-5/E5 đo từng loại (airdna-daily, launchd-smoke, launchd-collector-api, weekly-*), chiều đỏ trên bản main cho từng loại, thêm luật tĩnh kèm chiều đỏ |
| P2 | contract AC-7 | AC-7 chỉ so hai chuỗi giờ, không vế nào đòi nhãn lớp 1–4 khớp trạng thái suy từ log watchdog; luật quy đổi giờ chưa ghim | Smoke xanh dù múi/định dạng lệch, hoặc lớp 1–4 vẫn «Hỏng» do một chỗ gọi truyền `root` riêng | AC-7 thêm vế nhãn lớp 1–4 (quan hệ) + ghim công thức quy đổi giờ và dung sai | fixed: AC-7 thêm vế nhãn lớp 1–4 bằng trạng thái suy từ dòng cuối log watchdog; ghim múi Asia/Ho_Chi_Minh, dạng `YYYY-MM-DD HH:mm (GMT+7)`, dung sai hai dòng cuối |
