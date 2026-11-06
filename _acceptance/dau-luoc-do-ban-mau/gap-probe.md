---
slug: dau-luoc-do-ban-mau
at: 2026-11-06T02:49:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ phạm vi ghi nguồn mục tiêu nhưng câu trích Ngoài-5 không quyết việc bỏ sequence, domain, quyền; CHECK của domain nằm trong pg_constraint | Migration thêm CHECK cho domain thì dấu không đổi, test chạy trên cấu trúc cũ tới 24 giờ | Đếm loại đối tượng trong db/migrations ghi vào sổ; domain có CHECK vào nhóm constraint | fixed: phủ thêm domain, composite, sequence, collation, quyền (đếm REVOKE 12, COLLATE 3, COMMENT 6, DOMAIN 0); chỉ bỏ comment, owner; dòng sổ mới d-20261106T025058Z-9 supersedes -2, nguồn một-lối |
| P0 | design | Dòng loại schema đuôi số chưa bác lối dọn rác rồi phủ mọi schema và lối danh sách cứng | Schema hợp lệ đuôi số lọt khỏi dấu mà người ký không biết lối khác còn sống | Sổ phải bác cả hai lối bằng ràng buộc nêu được | fixed: dòng sổ d-20261106T025058Z-10 supersedes -4, bác dọn rác (86 executor đơn tệp còn sinh rác) và danh sách cứng (sót im lặng schema mới); Out of scope nêu lý do |
| P1 | evals | Ca mới và ca cũ chia sai: integer→bigint, cột generated, extension có thể bị câu cũ bắt | E9 đỏ tất định hoặc người viết test nới assert | Ma trận có cột «câu cũ: bắt|sót» từng ca, assert từng ô | fixed: AC-9, E5, E6, E9 đòi cột kỳ vọng từng ca, khớp từng ô |
| P1 | evals | AC-4–AC-6 không đo dấu về gốc sau ROLLBACK, ca VALIDATE không cô lập convalidated | Ca lỡ commit làm lệch nền, ca sau xanh oan; bỏ convalidated mà E1 vẫn xanh | Ba điểm mỗi ca; lược đồ mẫu có CHECK NOT VALID; đột biến bỏ convalidated | fixed: Criteria đòi ba điểm mọi ca AC-1–AC-6; AC-1 VALIDATE constraint NOT VALID có sẵn; AC-9 thêm hai đột biến (convalidated, tgenabled) |
| P1 | evals | Chỉ đọc chỉ đo bằng env trên docker giả; E8b không assert | Thiếu -e thì docker exec thật không chuyển PGOPTIONS, câu dấu không chạy chỉ đọc mà AC-8 vẫn xanh | Đọc cờ từ argv docker; trên DB chung đọc SHOW qua chính lời gọi; đối chứng bỏ -e ra off | fixed: AC-8, E8 đọc argv; E8b đọc chi_doc qua --dau, đối chứng bản chép bỏ cờ phải ra off |

Ghi chú của người phản biện (không phải finding): trục schema của extension và kiểu PostGIS kèm SRID chưa có ca. Đã xử: lược đồ mẫu có PostGIS, AC-5 thêm ca đổi SRID.
