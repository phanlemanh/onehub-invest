---
slug: danh-ba-s16-thang-cau-truc
at: 2026-11-17T15:42:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | AC-10, E10 không ghi trước giá trị kỳ vọng từng ô (chỉ ghim toà treo = 0 và dựng lần hai = 0) | Nhánh gộp căn S08 không chạy hay khớp tên nút sẵn hỏng mà E10 vẫn xanh; ký trên bảng không ô nào đỏ được | E10 so từng ô với bảng kỳ vọng viết trước, ca đỏ khi lệch ±1 | fixed: AC-10 có bảng kỳ vọng tám ô (khu 61, nút = 61, toà S16 treo 109 → 0, merged 2, rejected 2, 38/20 pending, 0 region_node_id, 0 khoá mới); E10 so từng ô |
| P1 | design | Đường lùi không trả thẻ can-lech-toa về pending; không nêu bảng nào trong dấu vân tay và phần dư nào được phép | E9 đỏ với mọi bản cài đúng, hoặc xanh trong khi thẻ lệch vẫn ghi «S16 thắng» sau lùi | Hợp đồng liệt kê bảng của dấu vân tay và phần dư; E9 thêm vế thẻ về pending, ca đỏ khi bỏ bước trả thẻ | fixed: AC-9 liệt kê bảng (lược đồ, buildings, stacks, units, registry_aliases, review_queue, field_assertions trừ cột rút, v_toa_nut_vung), phần dư được phép (nút nghi, dòng luật có dao_at), thẻ về pending với ghi chú cũ; E9 có chiều đỏ |
| P1 | contract | Ngưỡng ô cơ hội gồm cả toà không S16 còn treo ở OP1, GP; AC-4, AC-10 thu hẹp về toà S16 mà không có dòng descope | E10 báo 0 trong khi ô trên màn còn khác 0 | E10 đo đúng ô của ô cơ hội, hoặc descope có tên | fixed: dòng descope trỏ lời chia của GS — toà không S16 thuộc DA36 (N1), hai hàng không đếm trùng |
| P1 | evals | E5, E6, E7 chỉ đo âm tính «0 thẻ mới»; thiếu ca lệch tên toà; thiếu đối chứng dương lệch vẫn ra thẻ | Bản cài chặn mọi thẻ ở dự án có S16 mà ba ca vẫn xanh | Đối chứng dương cùng fixture; ca lệch tên toà; ca đỏ khi lọc theo mọi dự án | fixed: AC-6, E6 thêm ca lệch tên toà và đối chứng dương — cùng lệch ở dự án không có S16 ra đúng một thẻ; ca đỏ «mất thẻ ngoài dự án S16». Lệch giá: bước dựng không có đường sinh thẻ giá S08 ↔ S16 — ngoài phạm vi (Out of scope đã ghi) |
| P2 | contract | Dòng sổ job đêm năm khu do máy quyết với lối chết không thật chết; E8 chỉ đo dòng mốc | Lượt đêm gộp căn, đổi thẻ mà tệp khoá theo mốc không bắt | Đổi dòng sổ thành câu hỏi người; thêm eval lùi lượt đêm | fixed: dòng mới Hỏi-3 (chi-nguoi, supersedes dòng 7) lên Cổng Phạm vi; eval lùi lượt đêm deferred: theo lời Mạnh ở Hỏi-3 |
