---
slug: transform-zalo-boc-job-run
at: 2026-10-25T05:45:23Z
verdict: findings
p0: 0
p1: 2
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract + evals | AC-5 so phần nạp với sha cứng 146eca2, AC-3 khoá hành vi state làn ZCode; không chốt thứ tự gộp với nhánh P1.5 | P1.5 vào main trước, E5 đỏ dù job_run đúng; người làm giữ tiền tố cũ khi giải xung đột, lặng lẽ gỡ bản vá ZCode | So với merge-base lúc đo; dòng sổ về thứ tự gộp | fixed: AC-5/E5 so với merge-base HEAD origin/main (bỏ qua có lý do khi đã trên main); dòng sổ thứ tự gộp; AC-3 giữ vế state (hành vi hiện tại, P1.5 không đổi con trỏ state) |
| P1 | evals | E3 kiểm tệp state apify-daily.state mà không đối chứng dương rằng tệp bọc thật ghi tệp ấy | Tệp bọc ghi state chỗ khác, vế «không nhảy» luôn xanh | E1 kiểm state đổi sang mốc mới sau lượt lành | fixed: E1 thêm vế state chuyển sang mốc snapshot mới (tệp STATE của tệp bọc là apify-daily.state, dùng chung với job Facebook) |
| P2 | evals | E7 chỉ kiểm chuỗi grep có mặt, không quan hệ với log thật của plist | Plist ghi stderr chỗ khác, người vận hành grep không thấy JOB FAIL | Đọc StandardErrorPath của plist, so với đường trong lệnh grep | fixed: AC-7/E7 so đường grep với StandardErrorPath, kèm đối chứng |
| P2 | evals | E4/E5 gọi git show không kiểm có lịch sử git | Checkout nông, hai ca đỏ vì hạ tầng | git cat-file -e trước, thông điệp ghim | fixed: kiểm commit trước, đỏ với «thiếu lịch sử git» |
| P2 | contract | Nhánh ECONNREFUSED của bước nạp không có ca | Đêm DB chưa lên, hành vi không ai ghim | Thêm dòng ma trận ECONNREFUSED | fixed: AC-3/E3 thêm ca ECONNREFUSED (sleep giả, 5 lần gọi, mã 1) |
