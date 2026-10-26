---
slug: ops-dong-chay-df0
at: 2026-10-26T11:12:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E7 chép cứng «Kẹt · đọc» và «0,0%» lấy từ DB thật mà không ghim thời điểm | Sau lượt nạp đêm S03 đọc được 35% → trang đúng luật «Kẹt · trường lõi» mà E7 FAIL; ngược lại trang sai mà trùng chuỗi vẫn PASS | So nhãn với luật AC-5 áp lên chính số trên trang | fixed: E7 đổi expected sang quan hệ — nhãn Nút thắt và chú thích Gắn căn đọc từ chính số trên ảnh, không chuỗi viết tay |
| P1 | evals | E3 so SQL complete với levelOf chỉ trên fixture nhỏ, chiều đỏ một vế | SQL dùng IS NOT NULL mà levelOf coi «unknown»/0 là thiếu → dữ liệu thật đếm dư mà E3 xanh | Ma trận 5 trường × dạng thiếu + so trên DB thật | fixed: E3 thêm ma trận 12 ô (NULL, 'unknown', 0), ca DB thật chỉ SELECT, 5 đột biến từng vế |
| P1 | design | Dòng sổ d-…-5 để kho_dao false dù số prod đổi; câu trích test-posts.mjs không quyết việc loại S05 | Mạnh ký không có dòng xác nhận riêng cho việc đổi số prod | Dòng sổ mới kho_dao true + Hỏi trên thẻ | human-gate1: Hỏi-1 trên thẻ Cổng Phạm vi (dòng sổ mới supersedes d-…-5) |
| P2 | evals | Fixture S06 chỉ có tin < quảng cáo, không phân biệt min với «luôn lấy số tin» | readable = offers vẫn xanh; khoảng 7 ngày có thể vượt bài nhận | Bộ S06 tin > quảng cáo | fixed: E2 thêm ca 'DF-AC-2 S06 min' + đột biến readable = offers |
| P2 | design | Bỏ design-pass viện lời khen có trước DF0; ảnh E7 sinh sau Gate 1 | Phần UI DF0 (sheet B0) duyệt bằng chữ | Chụp sheet B0 sáng/tối trước cổng | fixed: dòng sổ mới supersedes d-…-9; ảnh sheet S03 B0 sáng/tối đính kèm thẻ Cổng Phạm vi |
