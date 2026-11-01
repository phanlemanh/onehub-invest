---
slug: vlm-anh-tin-s03
at: 2026-11-01T22:24:39Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | «Đọc đúng» của ngưỡng 90% do máy tự chọn, tính cả bài cùng rỗng | Đa số ảnh không có giá, model trả rỗng hết vẫn đạt 93% | Tính trên bài có giá, ô trống loại khỏi mẫu số, E7 đọc phiếu từ bộ rút mẫu thật | fixed: sửa AC-7, E7, thiết kế; định nghĩa đưa thành Hỏi-3, ngân sách phiếu vào Hỏi-2 (human-gate1) |
| P0 | design | Sổ ghi máy quyết đơn vị đọc gồm ảnh ghép với câu trích không quyết; căn cứ không sửa tệp agent cũ cũng yếu | Ghép sai làm giá căn khác vào nhãn, cổng duyệt tưởng mục tiêu đã quyết | Dòng chỉ-người kèm số từng lối, phiếu có ô ảnh không thuộc bài, --gold tách hai loại | fixed + human-gate1: Hỏi-4 thay dòng cũ; đổi căn cứ sang U1-87; AC-7 và phiếu có ô ấy |
| P1 | contract | Đường đo tăng gần như luôn đạt, dòng lỗi có thể được đếm, mẫu số chưa gồm thiếu loại hình | 401 cả lô mà --dem báo tăng 100 | Chỉ đếm nhãn tốt, E8 ghi bằng hàm lô thật, in từng lý do | fixed: AC-8, E8; đo lại tập đọc còn 2.392 bài theo ba lý do |
| P1 | evals | Mệnh đề mức CLI không có trong expected: hết ảnh không gọi model, --thu, mã thoát, --gold không ghi DB | --gold ghi 60 dòng làm nhiễm số đếm mà E7 vẫn xanh | E3, E6, E7 chạy thật và soát số dòng | fixed: E3, E6, E7, E8; thêm --model vào thiết kế. Thay «không gọi mạng» bằng soát tĩnh không có mã gọi model |
| P1 | design | Luật thử lại khi có dòng lỗi; bài cùng chữ khác ảnh | Lỗi 500 tạm khoá bài vĩnh viễn | E4 thêm ca lỗi rồi tốt, ca hai bài cùng chữ | fixed: dòng lỗi đọc lại và thay thế; khoá 065 có post_id nên bài đăng lại có dòng riêng (phản biện chưa đọc 065) |

Ghi chú ngoài trần: số 13.371 + 5.219 lệch được sửa bằng đo lại; câu hỏi E9 đổi sang điều đọc được trong tệp; lô thật không chứng minh được từ báo cáo là deferred, báo cáo ghi lệnh tái lập và `run_id`; `Timebox` của ô cơ hội còn trống, deferred: nêu ở Hỏi-1.
