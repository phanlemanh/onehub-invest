---
slug: danh-ba-ops-gop-cau-s16-va-nhan
at: 2026-11-27T08:58:00Z
verdict: findings
p0: 0
p1: 1
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | AC-4 chỉ đo tổng thời gian DB, trong khi bản main chạy hai câu song song nên thời gian tường đã ≈3,4 s; không AC nào đo thời gian tường | Tổng giảm 50%, E5 xanh, nhưng thời gian chờ thật gần như không đổi; người duyệt tưởng trang nhanh hơn ≈3 s | Đo thêm thời gian tường gồm Promise.all của main; contract nói thẳng mức hứa | fixed: dòng feature đổi thành «tải DB giảm một nửa, thời gian chờ đo và ghi»; AC-4 thêm vế thời gian tường ≤ 1,1 × main; E5 in bốn trung vị; Notes giải thích |
| P2 | evals | E2 đo «đếm ở SQL» bằng chuỗi vắng mặt (.reduce/.filter/.length) — đo chỉ dẫn, còn mâu thuẫn việc tách dòng | .filter hợp lệ làm đỏ giả; đếm bằng vòng for vẫn xanh | Đo theo quan hệ: hàng câu S16 mang cột gộp và ô phủ bằng đúng các cột; bản sao bỏ cột → đỏ ghim | fixed: E2 viết lại theo quan hệ (a)(b)(c) với hai chiều đỏ ghim |
| P2 | evals | E13 chỉ mở mã abc (ném ở page); hai loại mã ném trong DuAnContent không có bước trên màn | notFound ném trong Suspense rơi vào 404 chung mà E9 vẫn xanh | Thêm hai bước E13 cho số không có và id phân khu | fixed: E13 thêm bước 4b, 4c và expected phủ ba loại mã |
