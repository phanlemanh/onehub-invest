---
slug: api-markets-khong-tra-so-s02
at: 2026-11-25T02:39:48Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

# Phản biện context sạch

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ «một lối» về việc trừ cả tệp db.ts bỏ sót lối sống: chỉ bỏ qua đúng biểu thức đổi tên bảng | db.ts sau này thêm truy vấn bảng S02, mọi route public import db.ts, rào vẫn xanh và số S02 lên lại API | Trừ đúng biểu thức, thêm đột biến M-d cấy FROM airdna_scores vào db.ts phải đỏ | fixed: rào chỉ bỏ qua hằng CLOUD_TABLE_MAP; thêm M-d vào AC-4/E4; dòng sổ mới supersedes dòng cũ |
| P0 | design | Bỏ khoá marketScore ghi «một lối» trong khi giữ khoá null cũng thoả luật 5 | Cổng duyệt một thay đổi khuôn API công khai mà không thấy lối giữ khuôn | Ghi thành câu hỏi cho người | human-gate1: Hỏi-1 ở Cổng Phạm vi, khuyến nghị bỏ khoá; dòng sổ chi-nguoi supersedes dòng cũ |
| P1 | evals | Đối chứng AC-5 đọc route markets ở origin/main | Sau gộp hoặc trên clone nông, đối chứng hết đỏ hoặc vỡ | Văn bản đối chứng ghim trong test | fixed: đối chứng là cấy lại câu JOIN cũ ghim trong test, không đọc git |
| P1 | contract | Lệnh đo trên prod chỉ đếm dòng có marketScore | Prod 500 hoặc data rỗng vẫn ra 0 | Ghim mã 200, độ dài 5, bốn khoá | fixed: mục Đường đo đòi đủ ba điều kiện rồi mới đếm |
| P2 | evals | AC-7 hứa bộ app mà E7 chỉ chạy portal_static | Test app hồi quy đỏ mà AC-7 ghi đã đo | Eval riêng cho bộ app | fixed: thêm E8 config:executors.test.app_ui |
