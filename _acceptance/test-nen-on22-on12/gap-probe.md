---
slug: test-nen-on22-on12
at: 2026-10-27T05:10:00Z
verdict: findings
p0: 0
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract AC-3 + E3 + ops-nhan-theo-context.test.tsx | canDb() mở kết nối ngoài thuLaiDbTam — 53300 xảy ra đúng lúc connect; E3 chỉ đo chuỗi có mặt | DB đầy suất: ON12-AC-7 đỏ ở canDb() không thử lại, E3 vẫn «CAU TRUC OK» | Tiêm 53300 vào pg.Client.connect k lần, chạy chính tệp test; đối chứng ca không bọc | fixed: canDb() bọc thuLaiDbTam (client mới mỗi lần thử); E3 viết lại — tiêm lỗi qua NODE_OPTIONS: k=1 xanh có dòng thử lại, k=∞ đỏ nêu 53300, ca không bọc ON7-AC-6 (a) đỏ; ON22 bên ghi (tiến trình con) giữ đo cấu trúc |
| P1 | E1 | Đầu dò đẩy DB dùng chung tới ~90/100 kết nối (gây 53300 cho phiên khác); không trừ nền nên đỏ oan | Phiên khác chạy cùng lúc → E1 đỏ oan hoặc mẻ nạp của ZCode lỗi | Đo nền, đỉnh riêng = đỉnh − nền; suy thay vì chạy song song thật; nền cao → không kết luận | fixed: bỏ vòng song song thật; đỉnh riêng đếm theo application_name đặt cho chính lượt (PGAPPNAME) nên không phụ thuộc phiên khác; suy 2×app + pipeline + 10 ≤ 100 |
| P2 | E1 + E5 | Thử lại có thể nuốt lỗi tạm mà không ai đếm | Concurrency chưa đủ nhưng thử lại che, E1/E5 vẫn xanh | Đếm dòng thử lại trong đầu ra, đòi 0 | fixed: E1 lượt đơn và E5 cả 6 lượt đòi «thu lai 0»; bài kiểm đơn vị của thuLaiDbTam tắt in dòng thử lại (tham số bao) để không lẫn |
