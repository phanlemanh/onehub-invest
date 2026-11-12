---
slug: khoa-gop-can-khong-gia
at: 2026-11-12T10:30:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ bỏ giá khỏi khoá ghi nguồn mục tiêu với câu trích ADR-0013 không quyết lựa chọn; khoá mới vẫn suy từ nội dung đổi được và gom mọi căn cùng toà, cùng loại, cùng diện tích về một căn — không AC nào đo gộp nhầm. | Toà có 30 căn 70 m² giá khác nhau: trước là 30 cụm, sau đổi mọi tin 70 m² chưa gắn vào căn tạo sớm nhất; cả 8 AC vẫn xanh. | Đo số khoá không giá ứng với từ 2 căn trên DB máy thu; đưa thành câu hỏi kèm số hoặc đổi thiết kế. | fixed: đo 12/11 — bỏ giá thì 26.793 căn rơi vào 10.521 khoá chung (tối đa 39); đổi thiết kế: giữ khoá có giá, tin đã gắn giữ căn, cụm chỉ sinh căn khi có tin chưa gắn; dòng sổ mới thay dòng cũ, AC-6 và AC-7 viết lại |
| P1 | design | UNIQUE(offer_id) đổi hợp đồng với mọi bên ghi property_offers, thiết kế chỉ kê bên đọc. | Một job đêm khác chèn link cho tin đã có căn bằng ON CONFLICT (property_id, offer_id), bị 23505, chuỗi đêm gãy. | Kê mọi INSERT INTO property_offers, mỗi câu phải chịu được UNIQUE. | fixed: design thêm mục «Bên ghi property_offers» — kê toàn kho: resolver (sửa), hàm nạp lại đổi khoá của 044 dùng ON CONFLICT DO NOTHING không chỉ khoá (bắt được UNIQUE), hai hàm dựng dữ liệu thử gắn một link cho tin mới tạo |
| P1 | design | Câu «cloud nhận dữ liệu đã dọn ở lượt sync kế» không có đường đo. | FILL chỉ upsert thì 2.935 link đã gỡ còn trên cloud, DDL UNIQUE cloud gãy. | Đo trên cloud GROUP BY offer_id HAVING count(*) > 1 = 0 sau sync. | fixed: đọc sync-cloud — bảng không thuộc nhóm giữ bị DELETE FROM rồi chèn lại; design ghi rõ, contract «Đường đo» thêm bước đo cloud bằng 0 trước khi thêm UNIQUE ở đó; dòng sổ thứ tự hai lượt áp nêu điều kiện này |
| P2 | evals | Chiều đỏ E4, E5 chạy resolver bản gốc trên DB đã có UNIQUE nên ném 23505 thay vì cho trạng thái hai link. | Ca đỏ ném lỗi khác, thông điệp ghim không phát hoặc phát vì lý do khác. | Chiều đỏ chạy trên lược đồ chưa có ràng buộc, assert cả số link lẫn thông điệp; thêm assert phụ bản gốc ném 23505. | fixed: E4, E5, E7 chạy chiều đỏ trong SAVEPOINT đã DROP ràng buộc rồi ROLLBACK; E4 thêm assert phụ 23505 với tên ràng buộc |
| P2 | evals | Fixture AC-7 viết tay stable_key đúng khuôn bên đọc; không đo mọi stable_key thật đúng khuôn. | Nhóm căn thật có khuôn khoá khác, tin mới của nhóm ấy sinh căn mới mà AC-7 vẫn xanh. | Dựng căn mồi bằng chính resolver; đếm căn stage-ab theo số đoạn stable_key trên dữ liệu thật. | fixed: AC-7 dựng căn bằng chính chayResolve trên tin mồi; E1 thêm vế mọi căn stage-ab có stable_key sáu đoạn (đo 12/11: 76.423/76.423) |
