---
slug: s03-noi-luat-trich-dan
at: 2026-11-04T00:07:05Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract, evals | AC-9 đo gộp nhánh cũ và mới | Nhánh mới đúng 59% mà gộp vẫn đạt 0,851, cổng mở cho khoảng 1.900 đề xuất | Đo riêng theo corroborated_by, số ca tối thiểu, Wilson riêng | fixed: AC-9, E9, E6, design doc |
| P1 | contract, evals | Đường xử lại thiếu ca chốt, băm chỉ giá và diện tích | Lệnh không truyền thân bài, chốt 2 mất tác dụng mà test xanh | Ca qua lệnh thật, băm mọi cột trừ loại hình | fixed: AC-3, AC-4, E3, E4 |
| P1 | design, contract | Danh sách từ mở, mã lý do chưa định nghĩa, thiếu ca âm dạng n | «nhà ngõ 3PN» qua luật; «3N2Đ» khớp | Danh sách đóng, bảng ca viết trước | fixed: design doc, AC-1, AC-2 |
| P1 | design, contract | Bỏ 245 đề xuất ghi máy quyết; câu trích của lựa chọn nới không quyết; đích 50% không có số trước chữ ký | Ký với ước 51–52%, lượt thật ra dưới 50% | Câu hỏi cho người, số dự kiến trước chữ ký | fixed: Hỏi-2, Hỏi-3, AC-9 in số dự kiến |
| P1 | evals | Fixture E3, E6 không dựng được như mô tả | Dòng đạt 03/11 không có trường phiên bản mở được luật mới | Điểm tiêm kiemLoai, ba ca cổng mẫu | fixed: E3, E6, AC-6 |
