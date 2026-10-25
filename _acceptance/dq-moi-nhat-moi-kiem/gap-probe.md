---
slug: dq-moi-nhat-moi-kiem
at: 2026-10-24T14:40:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ để máy tự chọn chữ và màu nhãn kiểm độ phủ tham chiếu (nghĩa sản phẩm), căn cứ một-lối không giết lối gắn nhãn theo số độ phủ | Mạnh ký một nghĩa máy tự chọn; người vận hành vẫn đọc nhãn xanh dương là ổn | Dòng Hỏi cho người, AC-4 ghim nhãn đã ký | human-gate1: dòng Hỏi-1 (chi-nguoi) thay d-…-1, khuyến nghị info-light/warning-light, lối khác gắn theo số độ phủ |
| P0 | design | Chữ đếm đầu trang và mô tả bảng là nhãn mới mà sổ không ghi; «đối tượng» vs «thực thể» lệch | Hai chữ cho cùng khái niệm; nhãn đếm lọt từ điển | Dòng sổ chốt chữ đếm; E3 ghim nguyên văn | fixed: dòng sổ (muc-tieu) chốt «đối tượng» = chữ cột «Đối tượng» có sẵn trong dq-checks-table.tsx; E3 ghim ['2 kiểm', '26 đối tượng']; AC-3 viết lại |
| P1 | evals | Không eval đo trang thật nối đúng hàm mới; E3 dò chuỗi page.tsx | page.tsx vẫn dùng câu LIMIT 20 mà E1–E4 xanh | Ca đi qua nguồn dữ liệu thật của trang, chiều đỏ LIMIT 20 | fixed: trang lấy bảng+số qua một hàm loadDqChecks(db); E3 chạy hàm ấy trên fixture, chiều đỏ câu cũ thiếu E; quét page.tsx không còn chuỗi dq_check_results nào |
| P1 | evals | Ca bảng vẽ chỉ kiểm chữ, không kiểm màu; ma trận thiếu truthful-coverage warn/skip/lạ | Chữ mới trên badge xanh lá mà mọi eval xanh | So class badge với success-light; thêm 3 dòng ma trận | fixed: E4 ma trận 10 dòng (đủ trạng thái hai nhóm), bảng vẽ so class badge với Badge success-light vẽ đối chiếu, đối chứng dương hàng freshness |
| P1 | evals | E5 có thể đúng rỗng (0 dòng truthful-coverage) và đo bản chép SQL/nhãn | E5 ok trong khi hàm thật sai | Đòi ≥1 dòng; dùng chính hàm của app | fixed: E5 chạy bằng tsx, import loadDqChecks + dqResult; 0 dòng truthful-coverage → FAIL exit 1; kiểm cả variant |
