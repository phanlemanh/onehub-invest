---
slug: truong-nhan-s03-081
at: 2026-11-06T18:00:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Ánh xạ direction_faces sang RESO DirectionFaces ghi là máy quyết, trong khi nghĩa ô Hướng là Hỏi-2 (chỉ người có) | Mạnh chọn Hỏi-2 theo hướng ban công mà sổ vẫn khai DirectionFaces (hướng cửa), trái ADR-0011 | AC-8 hai nhánh theo Hỏi-2; E8 đỏ 'HUONG LECH NGHIA RESO' | fixed: dòng sổ mới thay d-…-2, AC-8 và E8 theo nhánh Mạnh chọn ở Hỏi-2 |
| P1 | evals | AC-6 đi qua truy vấn DB nhưng E6 chỉ là unit, thiếu tag cross-layer [eval-classify-theo-chu-ref#F1] | Câu SELECT không lấy cột basis, ô CĐT vẫn bị chấm mà E6 xanh | Ca DB thử gọi docNhanNguoi thật; đỏ 'BASIS KHONG DUOC DOC' | fixed: AC-6 gắn (cross-layer), E6 chạy trên DB thử qua truy vấn thật |
| P1 | evals | E1, E4 có thể dùng danh sách trường, CHECK chép tay đúng khuôn bên đọc | 081 viết sai tên một trường, probe dùng danh sách của chính nó nên xanh; DB thật từ chối khi lưu | E1 nạp hằng LABEL_FIELDS_NHOM, BASIS của app; E4 dựng lược đồ bằng chính db/migrations; đỏ 'TRUONG APP KHONG QUA CHECK 081' | fixed: E1 và E4 sửa theo thước đề xuất |
| P1 | contract | AC-10 thiếu labels-queries.ts mà E4, E5 khai trong paths | Sửa tiến độ hay đồng thuận ở labels-queries.ts thì đầu dò phạm vi đỏ | Thêm tệp vào AC-10; E14 so paths mọi eval với danh sách | fixed: AC-10 thêm labels-queries.ts và labels-s08.ts; E14 kiểm 'PATHS EVAL NGOAI PHAM VI' |
| P2 | evals | E7 đo chuỗi có mặt trên danh sách tệp cứng, không có ma trận đường rời máy | Script sync duyệt bảng theo mẫu hay information_schema thì chở eval_labels mà E7 vẫn xanh | Ma trận đường rời máy viết trước, rút bảng đích thật của từng đường | fixed: AC-7 và E7 theo ma trận viết trước, chạy mẫu duyệt bảng trên lược đồ tạm |
