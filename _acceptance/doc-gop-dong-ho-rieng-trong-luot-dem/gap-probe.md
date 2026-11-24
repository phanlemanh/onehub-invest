---
slug: doc-gop-dong-ho-rieng-trong-luot-dem
at: 2026-11-24T07:05:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | decisions | Dòng sổ bỏ Cổng Đáng (d-…-6) ghi lối chết «chờ Cổng Đáng thì đêm nay lượt 00:00 lại cắt cả lượt», trong khi Out of scope ghi plist đêm 24→25 đã đặt trần 32400; bỏ một cổng của Mạnh lại do máy quyết trên căn cứ một-lối | Gate 1 duyệt lối tắt bỏ Cổng Đáng vì tin không còn đường nào khác, người ký không thấy mâu thuẫn | Dòng sổ mới trích lời người có quyền quyết bỏ cổng, hoặc sửa lối chết cho khớp | fixed: gửi yêu cầu hang-moi cho giám sát (U1-144); GS phán không mở ô cơ hội, không qua Cổng Đáng (hàng nền gỡ sự cố, quyền cắt hàng của giám sát); dòng sổ mới trích AGENTS.md, supersedes dòng cũ, dẫn nguyên văn lời phán |
| P1 | contract | AC-9 và Đường đo chấm lượt 00:00 đầu sau áp (đêm 32400) nhưng không nói `--tran` nào cho đêm ấy, không có log mẫu trần 32400 | Chạy `--tran 21600` trên lượt 32400 ra KHÔNG ĐẠT giả, hoặc bỏ cờ thì không kiểm trần | AC-9 ghi `--tran` theo đêm; E9 thêm log mẫu 32400: `--tran 32400` ĐẠT, `--tran 21600` KHÔNG ĐẠT | fixed: log mẫu luot-32400-75-dat rút từ đầu ra thật (TRAN_TONG=32400), ba ca mới trong kiem.sh (không cờ ĐẠT, `--tran 32400` ĐẠT, `--tran 21600` KHÔNG ĐẠT); README bước 5 ghi `--tran 32400` sáng 25/11 và `--tran 21600` sau đêm gỡ biến; AC-9, E9 sửa lời |
| P1 | evals | AC-1 hứa chiều đỏ ghim «enrich phải VẪN chạy» nhưng E1 ghim `(1) dòng TIMEOUT…` hoặc `(1) CA LÕI` — bản sao bỏ đồng hồ vấp dòng TIMEOUT trước | Gate 1 đọc AC-1 tưởng thông điệp enrich đã ghim | Contract và evals cùng một chuỗi | fixed: AC-1 sửa lời đối chứng cho đúng chuỗi test ghim (`(1) dòng TIMEOUT…` hoặc `(1) CA LÕI`); vế «enrich vẫn chạy» là assert chiều xanh trên cùng lượt (dòng enrich-run mã 0) và được E9/AC-9 đo lại trên log máy thu; không thêm đột biến vào test ZCode (không viết lại mã làn thu, d-…-2) |
| P2 | contract | Vế «lượt sau đọc tiếp 3..6, không mất không lặp» đo trên bước giả theo hợp đồng HT6 — tính chất của fixture | HT6 giữ sổ khác fixture, đêm đó mất hay lặp bài dù AC-2 đã ký | Chuyển vế sang ghi chú HT6 tự đo | fixed: AC-2 chỉ hứa B gọi lại bước và không xoá phần dở; Out of scope thêm dòng «bước THẬT giữ sổ: hồ sơ HT6 tự đo»; E2 ghi rõ bước giả |
| P2 | evals | Coverage ghi ô launchd (trưởng nhóm) cho AC-4 mà E4 không nói ca (5) chạy ở vai trưởng nhóm | Ô launchd chỉ trên giấy | E4 ghi cách spawn | fixed: E4 ghi lượt khởi `spawn(..., { detached: true })` (helper `chay` của tệp test) — script là trưởng nhóm như dưới launchd; ca (6) đo vai không trưởng nhóm (`bash -c`) |
