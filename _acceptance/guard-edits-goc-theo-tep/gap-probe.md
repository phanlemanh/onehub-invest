---
slug: guard-edits-goc-theo-tep
at: 2026-11-02T22:07:29Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-2 gói ba lựa chọn dưới một căn cứ một-lối; đường cũ khi thư mục chưa có còn hai lối sống chưa xét; ô snapshot × thư mục mới × worktree khác không có AC | Mạnh ký vì tin chỉ có một lối, trong khi một lối vá ít dòng chưa từng lên thẻ | Tách dòng sổ; Hỏi về đường cũ; thêm ca selftest | fixed + human-gate1: tách d-2, Hỏi-2 lên thẻ, thêm ca «snapshot, thư mục chưa tồn tại, worktree anh em» (đo được: exit 2, không lọt) |
| P0 | contract | d-3 ghi một-lối nhưng lối kia chỉ tốn giờ máy, không chết; bỏ bảo đảm evals viết trước là lựa chọn chỉ người có | Mạnh duyệt mà không được hỏi có đổi bảo đảm này lấy E6 hay không | Đổi sang chi-nguoi, thêm Hỏi | fixed + human-gate1: dòng mới supersedes d-3, Hỏi-3 lên thẻ |
| P1 | design | Hỏi-4 chỉ đếm db/migrations, không nêu hai luật còn lại, không kèm lệnh và số | Mạnh chọn với căn cứ thiếu | Đo cả ba mẫu, thêm ca kho khác | fixed: đo git ls-files ba mẫu trên ~/dev, ghi vào sổ; luật snapshot đã áp ngoài kho từ bản cũ nên không đổi; thêm AC-9 + E10 |
| P1 | evals | E6 không nêu tên ca; nhiều dòng OK không có biến thể làm đỏ; exit 2 cũng là mã lỗi cú pháp bash | Hook lỗi cú pháp ở nhánh snapshot vẫn được tính là chặn đúng | Bảng tên ca; đột biến thêm; ghim câu luật | fixed: kiem ghim câu của đúng luật; thêm năm đột biến; E6 nêu tên từng ca; dòng chỉ giữ hồi quy được ghi rõ |
| P2 | contract | AC-8 chỉ đo đường xanh | Selftest đỏ để lại worktree tạm trong kho dùng chung | So worktree và ref trước, sau lượt đột biến | fixed: dot-bien.sh in ba dòng «duong do», AC-8 nêu cả khi đỏ |
