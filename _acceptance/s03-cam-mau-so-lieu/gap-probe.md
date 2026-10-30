---
slug: s03-cam-mau-so-lieu
at: 2026-10-30T00:00:21Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chốt khoảng giá ghi máy đã quyết, nhưng câu trích «ý định bán/thuê không vá bằng regex mà đi PL5» chỉ cấm đoán lại loại tin, không chọn giữa bỏ hẳn offer và giữ offer bỏ giá — đánh đổi người dùng thấy (khoảng 200 tin bán vắng khỏi /ops). | Người duyệt tưởng chốt khoảng chỉ chặn số rác; sau gộp khoảng 200 tin bán thật vắng khỏi /ops tới khi PL5 giao, AC-5 và AC-9 xanh xác nhận đúng hành vi không ai chọn. | Thay bằng câu hỏi nguồn chỉ-người nêu hai lối, AC-5 viết theo lối người chọn. | human-gate1: thành Hỏi-2 (dòng sổ thay thế mang supersedes); AC-5 ghi Then theo khuyến nghị (a) kèm Then của lối (b). |
| P0 | design | Dòng sổ khoá gom ghi máy đã quyết cả vế «thiếu cả mã lẫn DT thì khoá thêm chữ bài» mà câu trích chỉ quyết vế thêm mã. | Bài đăng lại có sửa vài chữ, không mã, không DT thành nhiều offer cho một căn, đếm cung bị thổi lên; người duyệt không biết có lựa chọn này. | Tách vế khoá bằng chữ thành câu hỏi hoặc trích căn cứ quyết nó. | fixed: bỏ vế khoá bằng chữ, chỉ thêm mã theo đúng câu giao (dòng sổ thay thế); đo lại trên chữ đã gạt URL, SĐT: thêm mã còn 2 offer gom quá 10 nội dung trước khi sửa luật giá; AC-6 sửa ô «không mã». |
| P1 | contract | AC-9 không định nghĩa «nhóm TP.HCM» khi 11 nhóm chưa khai thị trường, và thước không gắn với đáp án Hỏi-1 (tên phường trùng giữa hai thị trường). | Thước HCM đỏ dù code đúng thiết kế khi gặp tên trùng, hoặc luôn xanh nếu script suy nhóm từ chính phường đọc được. | Khai nguồn «nhóm TP.HCM» tách khỏi kết quả transform, loại tên trùng; E8 thêm ô tên trùng và tên chỉ thuộc một thị trường. | fixed: AC-9 đo offer có bài mang tên phường chỉ thuộc TP.HCM ở nhóm không khai thị trường loại trừ TP.HCM (tên trùng loại khỏi thước); AC-8, E8 thêm hai ô nhóm chưa khai (chỉ thuộc HCM → vn-hcmc, trùng → null), mỗi ô có cặp đỏ. |
| P1 | evals | Nhánh «nhóm đã khai» của AC-8 chỉ đo bằng nhóm mồi viết tay, không đi qua writer thật; dữ liệu thật hôm nay không có nhóm nào khai. | Writer lưu khuôn market_codes khác fixture hoặc khoá nối lệch, mọi nhóm rơi về nhánh chưa khai mà không eval nào bắt. | Tạo nhóm mồi qua đường ghi thật; E9 thêm thước tỉ lệ bài nối được tới sổ nhóm. | fixed: nhóm mồi chèn qua trigger kiểm tham chiếu market_codes của 048 (cùng ràng buộc mà màn /ops/sources ghi qua), nối bằng conversation_id = group_key; E9 thêm thước noi_nhom_pct ≥ 95 kèm đối chứng nối sai khoá. Gọi thẳng route ghi của app từ test pipeline: deferred — route ở làn app, ngoài vùng tệp của hàng. |
| P1 | evals | E9 chỉ có một đối chứng gộp «--dot-bien ra exit 1», thước nào cũng không có đối chứng riêng; gia_tu_url chưa có định nghĩa quan hệ. | Một bộ đếm viết sai luôn ra 0 mà E9 vẫn xanh nhờ thước khác trượt ở bản đột biến. | Lượt đối chứng tái lập mốc gốc từng thước, mỗi thước một dòng TRƯỢT; định nghĩa gia_tu_url bằng quan hệ. | fixed: E9 lượt đối chứng chạy transform của commit nền ghim c333a342, mỗi thước một dòng TRƯỢT ghim tên với mốc gốc; design doc định nghĩa bốn thước (gia_tu_url bằng quan hệ chữ gốc ra X, chữ đã gạt không ra X). |
