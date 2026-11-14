---
slug: ma-du-an-s06-thanh-nut
at: 2026-11-14T03:25:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Phân lớp không nói gì về nút ứng viên do lần áp trước đúc; ma trận AC-2 thiếu ô tên chạm bí danh nút ứng viên | Mã «Sunrise Riverside Tower» chạm bí danh nút ứng viên của «Sunrise Riverside» khi dựng lại thẻ → nhieu-ung-vien, băm đổi, «chạy lại không đổi bí danh» hỏng | Luật phân lớp bỏ nút mot_loi_khai; ô thứ 10 ở E2; E6 fixture có cặp tên lồng nhau, băm lần hai bằng lần một | fixed: design §2 «Phân lớp chỉ so với nút KHÔNG do luật S06 đúc», AC-2 thêm ô, E2 ô thứ 10, E6 fixture cặp lồng nhau + băm bằng nhau + đối chứng đỏ 'nut-ung-vien-cham' |
| P1 | design | Migration 100 không có rule_id trên bí danh mà AC-4, AC-7 lọc bí danh theo rule_id | --dao không lọc được bí danh theo luật; E4, E7 đỏ hoặc người code tự thêm cột ngoài thiết kế | Khai đường nối luật–bí danh; E4, E7 viết theo đường ấy | fixed: design §2 đọc luật qua project_links.rule_id ⨝ value, không thêm cột vào registry_aliases; AC-4, AC-7, E4, E7 viết lại theo đường này |
| P1 | contract | Lời hứa «không lên Invest», «mã không rời máy thu» không có AC; asset_nodes sync nguyên bảng, slug và meta mang mã | 322 nút cùng mã nguồn trong slug lên cloud; bộ khớp tên S03 tự gán tin S03 vào nút S06 | AC đo bên đọc khớp tên bỏ nút ứng viên; assert slug/meta không mang mã | fixed: đo 6 bên đọc asset_nodes; slug và meta bỏ mã (AC-4, E4); thêm AC-10 + E10, E11 (bộ dự án trên tin S03 và context-resolver bỏ mot_loi_khai, có đối chứng dương); phạm vi bên đọc còn lại thành Hỏi-3 human-gate1 |
| P2 | evals | E2 ca 2b dùng đối tượng giả lập kết quả SQL, không rút từ writer thật | SQL thật trả kiểu khác mock, docMa xanh trên mock, sai trên DB, chỉ lộ ở E9 | Ca 2b chạy câu SQL thật trên DB thử | fixed: ca MS6-AC-2b chuyển sang E3 (ms6_db), chạy docMa thật trên DB thử fixture |
| P2 | contract | Chênh 344 với 268 mã và nút đúc không xoá được chưa lên trước mắt người ký; opportunity vẫn in 268 | Mạnh ký phạm vi theo 268 trong khi lệnh đúc thêm 76 mã, đảo luật không gỡ nút | Ghi chênh lệch và hệ quả lên thẻ Cổng Phạm vi; sửa ghi chú opportunity | fixed: contract Context ghi chênh lệch + «nút không xoá được»; opportunity thêm dòng đo lại; human-gate1: lời mời cổng nêu rõ 344 / 268 |
