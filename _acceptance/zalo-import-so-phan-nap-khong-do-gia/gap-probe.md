---
slug: zalo-import-so-phan-nap-khong-do-gia
at: 2026-10-25T07:46:46Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ máy quyết so cặp ec71694^ → ec71694 (một commit) trong khi lời hứa nói về cả vòng; còn lối «khoảng cả vòng» sống | Một commit sửa khác trong vòng đổi phần nạp mà ZJ-AC-5 vẫn xanh | So khoảng cả vòng, kèm liệt commit của vòng chạm tệp bọc | fixed: dòng sổ mới thay d-1 — so e962e78^1 → e962e78 (merge commit PR #96, tác động ròng cả vòng); đã kiểm chỉ ec71694 chạm tệp bọc trong vòng |
| P1 | contract | Mất rào cho vòng làn Claude tương lai mà không có dòng bỏ có tên; ngưỡng ô cơ hội viết khác contract | Ký Gate 1 tưởng rào làn còn | Dòng descope hoặc câu hỏi; sửa câu thước | fixed: dòng descope «bỏ rào làn tương lai» + mục Out of scope; câu hỏi phép đo ở ô cơ hội và Đường đo viết lại khớp |
| P1 | design | Khẳng định «không bao giờ đỏ oan» nhưng bản sao nông/squash thiếu commit thì đỏ; E4 tiêm rev thay vì đi đường thật | Clone nông chạy scripts tests → đỏ oan | Ca clone --depth 1 thật; kiểm commit với tới được từ main | fixed: AC-4 (c) clone nông thật → «thiếu lịch sử git» (fail-closed, cùng nếp ZJ-AC-4); đã kiểm e962e78 nằm trên main; CI không chạy scripts tests và dùng fetch-depth 0 |
| P1 | evals | E1 đo mã nguồn (grep) thay vì hành vi | Ca đọc tệp bọc bằng cách khác, grep không thấy | Xoá tệp bọc ở cây tạm rồi chạy ZJ-AC-5 | fixed: ZL-AC-1 chạy ZJ-AC-5 trong cây tạm đã xoá tệp bọc → xanh, pass 1, skipped 0 |
| P2 | evals | Chưa ghim mốc có mặt, phần cắt khác rỗng, thông điệp lệch | Mốc đổi chữ → phần cắt rỗng, phép bằng xanh mà không chứng gì | Assert mốc + nội dung + thông điệp | fixed: ZJ-AC-5 assert mốc ở cả hai bản, phần cắt chứa 'for try in 1 2 3 4 5'; thông điệp lệch nêu ZJ-AC-5, tệp bọc, rev |
