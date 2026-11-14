---
slug: phuong-tu-du-an
at: 2026-11-13T00:40:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Nhánh 099 giữ mọi cột phường, không phân biệt phường nguồn với phường chính nhánh đã kế thừa; không luật xét lại khi phát biểu kế thừa bị rút. | Gỡ dự án rồi phân xử lại (không chạy transform) thì cột vẫn W1, trái AC-4; S06 hay lượt phân xử lẻ gặp thật. | Cột mang nhãn du-an được xét lại; E4 không chạy transform ở lượt 2; chiều đỏ bản 099 coi mọi cột phường là giữ. | fixed: design §2 lưu giá trị gốc trong field_provenance.area_id.goc, xét lại cột mang nhãn du-an, hết kế thừa thì về gốc và bỏ khoá; AC-4, E4 ghim lượt 2 không chạy transform, thêm chiều đỏ |
| P1 | contract | Lời hứa «reassign-areas không bị đè» không có AC hay eval đo thứ tự. | Chuỗi transform → phân xử → reassign-areas làm mất W1 hay ghi đè giá trị reassign-areas mà ca vẫn xanh. | AC chạy chuỗi thật với hai tin W1 và khu lạc. | fixed: AC-5 và E5 chạy chuỗi thật transform → phân xử → reassign-areas → phân xử |
| P1 | evals | Fixture phát biểu kế thừa của E3, E6 chèn tay theo khuôn bên đọc. | Bộ ghi đặt khoá chủ thể khác khuôn 099 nối, ngoài đời 0 tin lên phường mà E1, E3 xanh. | Sinh phát biểu bằng bộ ghi thật; ca đầu-cuối; chiều đỏ đổi khoá chủ thể. | fixed: E3, E6 sinh phát biểu bằng --ghi; thêm ca đầu-cuối và chiều đỏ «PTD-AC-3 phát biểu không tới cột» |
| P2 | contract | Coverage tự nhận đủ khi nhiều ô chưa chạm (nguồn S06, bài không dự án). | Tin S06 có dự án không bao giờ vào cột mà không ca nào đỏ. | Ma trận toàn phần hay khai ô loại có lý do. | fixed: bỏ nhãn chưa kiểm chứng, khai ô loại có lý do; đường vào cột của S06 vào Out of scope trong design |
| P2 | contract | Ngưỡng trên máy thu không có lệnh, nơi lưu, điều kiện chặn. | Số máy thu mâu thuẫn ngưỡng mà không bước nào bắt ghi lại trước lời ghi thật. | Khai lệnh, trường, tệp evidence, điều kiện chặn. | fixed: Đường đo khai do-may-thu.md (T0, K, số tin có phường nguồn bị đổi) và điều kiện không xin ghi thật khi khác 0 |
