---
slug: vocab-db-itest-xanh-tren-main
at: 2026-10-31T07:30:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Cam kết không đổi assertion và tên ca mà không eval nào đo | Nới một assert để xanh, E1/E3 vẫn đạt | So tên ca và số assert hai bản | fixed: E3 so tên ca + số lời gọi assert giữa 82a53e0a và HEAD (30 → 30) |
| P1 | contract | Lý do «migration mới tự vào» không được đo; câu nạp ref_* trong DO $$ bị bỏ sót lặng im | HD5 gộp 061 có câu trong DO $$ thì test đỏ lại không ai biết vì sao | Rào báo lỗi có tên | fixed: bộ rút đếm mọi câu INSERT INTO ref_* trong tệp, lệch số câu rút được thì ném lỗi nêu tên tệp |
| P1 | evals | DB thật không đổi chỉ do ca nội bộ tự đo | DDL ngoài giao dịch thay CHECK trên :5433 mà ca nội bộ vẫn xanh | Băm pg_get_constraintdef ngoài test | fixed: E3 băm định nghĩa mọi *_chk + số dòng ref_* trước và sau lượt đo |
| P1 | decisions | Máy tự ghi nhận chập chờn với căn cứ không tái hiện | E3 đỏ xanh tuỳ lần, hoặc bản cũ để lại trạng thái | Chạy lặp + băm DB | fixed: E3 chạy bản hiện tại 3 lượt đòi 3/3 sau bản cũ, kèm băm DB trước = sau |
| P2 | evals | E3 so đúng bốn ca theo chuỗi | DB trôi thêm migration làm bản cũ đỏ 5 ca, E3 đỏ oan | Đo quan hệ chứa | fixed: bản cũ phải chứa đủ bốn ca đã biết, không đòi đúng bằng bốn |
