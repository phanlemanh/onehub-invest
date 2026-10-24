---
slug: cloud-sync-bao-loi-that
at: 2026-10-24T05:40:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

# Gap-probe — cloud-sync-bao-loi-that

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals E6 | Câu hỏi đòi đối chiếu dòng ghim và luật chạy tiếp nằm trong job-step.sh nhưng tệp không ở inputs | Hội đồng không đối chiếu được, duyệt sai hai chiều | Thêm job-step.sh vào inputs/paths | fixed: E6 inputs + paths thêm scripts/lib/job-step.sh, câu hỏi trỏ job_run |
| P1 | contract Đường đo | Ngưỡng hứa «leak gate đỏ» mà phép đo dùng node giả; không ca nào chứng sync-cloud.mjs thật thoát ≠0 khi gate đỏ | sync-cloud nuốt lỗi gate, tệp bọc vẫn 0 mà E1–E5 xanh | Ca sync-cloud thật gate đỏ, hoặc ghi PROXY + trỏ bằng chứng | fixed: Đường đo ghi PROXY hai mắt xích, mắt (b) trỏ leak-gate-kiem-anon E19 (runMain mã 1 khi gate đỏ) |
| P1 | contract AC-1 | Không ca nào chạy tệp bọc như launchd (symlink, cwd khác) — bước nạp job-step.sh phụ thuộc đường | source tương đối hỏng dưới launchd, cả hai bước không chạy mà E1 xanh | Ca gọi qua symlink với cwd khác | fixed: AC-1 thêm vế gọi kiểu launchd; E1 thêm ca |
| P2 | contract AC-2 | Mọi node giả thoát 1 — không đo được «mã hỏng đầu tiên» | Tệp bọc exit 1 cứng vẫn xanh | Ca hai bước hỏng mã 3 và 5 | fixed: AC-2 + E2 thêm ca hai mã 3/5, thoát 3, hai dòng ghim đúng thứ tự |
| P2 | contract AC-3 ↔ E3 | Tên ca đột biến lệch; không khẳng định bản đột biến khác bản gốc | Đột biến trùng bản gốc, ca bắt xanh rỗng | Đổi tên ca; khẳng định văn bản khác | fixed: E3 đổi tên ca, AC-3 đòi bản đột biến khác bản gốc đúng ở bước đó (mutateDropGuard của AU3 đã assert có needle) |
