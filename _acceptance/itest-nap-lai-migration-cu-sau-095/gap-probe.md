---
slug: itest-nap-lai-migration-cu-sau-095
at: 2026-11-12T11:30:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Không eval chạy kiem-do-sau-070 (KD-AC-3); E1 thiếu ô giao một phần và ô ranh giới. | Nhánh (B) thay câu ADD bằng định nghĩa sống làm mất trường của chính tệp đang nạp; so tập ⊆ sai làm đổi byte, KD-AC-3 đỏ không ai bắt. | Ma trận bốn ô, assert tập sau ⊇ hợp; eval chạy kiem-do-sau-070. | fixed: AC-1 thành ma trận bốn ô với vế ⊇ hợp sống ∪ tệp; thiết kế đổi sang thay bằng HỢP; thêm E10 chạy kiem-do-sau-070.test.mjs |
| P1 | contract | «Bền với 096» chỉ đo bằng trường giả; không AC chạy lại trên nền có 096 thật. | 096 thật thêm trigger hay khuôn DDL khác, s06-duong đỏ lại sau gộp dù bằng chứng xanh. | AC chạy lại E1–E9 trên cây đã nhận main có 096, bằng chứng ghi sha. | fixed: AC-7 + E11 (probe đòi db/migrations/096_*.sql có mặt, thiếu thì CHUA CO 096); lượt chấm cuối sau khi nhận main có DA2 và DA5 |
| P1 | contract | Cam kết sửa dac-trung-s06 sau DA5 không có thước đo. | Hàng máy-thông trong khi dac-trung-s06 vẫn đỏ 8/8. | AC + eval 8/8 trên DB riêng sau DA5. | fixed: AC-7 + E12 (dac-trung-s06 8/8 ok), tệp vào danh sách AC-6 |
| P1 | evals | Vế «đo trên DB dừng ở đúng mức» của AC-3 không có phép đo. | Vá kiểu napLai095 cho từng ca vẫn qua E4–E6 rồi đỏ lại với 096. | Mỗi ca assert mức migration lớn nhất = X và in ra; probe tĩnh đòi taoDbThu hetSo khớp. | fixed: AC-3 đòi assert và in mức migration; E11 soi tĩnh taoDbThu hetSo khớp mức ca |
| P2 | evals | E7 chỉ đo âm tính; E8 không ghim số tệp. | Một ca của -that bị bỏ hay câu chép thiếu admin_code mà không sinh chuỗi cấm, E7 vẫn PASS; probe chỉ chạy một tệp, E8 vẫn PASS. | Ghim pass 4 + assert dương cha/admin_code; ghim 6/6 kèm tên. | fixed: AC-4 + E7 ghim pass 4, fail 0 và ca assert dương; E8 ghim DOI CHUNG TEP DO 6/6 kèm tên sáu tệp |
