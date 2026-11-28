---
slug: data-api-nguon-an-dong-khi-so-rong
at: 2026-11-28T09:20:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Lựa chọn 503 mã riêng hay 200 rỗng ghi nguồn mục-tiêu nhưng câu trích auth.ts chỉ là tiền lệ, không quyết; đây là lời hứa ra ngoài với khách API | Cổng Phạm vi duyệt như thủ tục, mã mới thành giao kèo công khai mà không ai có quyền chọn | Dòng S1 mới thay dòng cũ, nguồn chỉ-người, Hỏi-1 hai lối + bảng lối khác → AC đổi | fixed: dòng S1 mới (supersedes) thành Hỏi-1; contract thêm «Lối khác của Hỏi-1 → AC đổi»; design §2 ghi rõ |
| P0 | contract | Lựa chọn hàm dựng ghi một-lối nhưng lối chép cây chỉ đắt hơn, lối mock.module không được xét | Người duyệt không thấy giá đổi cấu trúc listings.ts so với lối khác | Liệt đủ ba lối với lý do chết đã chứng | fixed: dòng S1 mới (supersedes) — sửa tệp sinh trong cây cấm; chép cây đưa hành vi ra khỏi bộ test hồi quy; mock.module không có trên node 24.21 thiếu cờ mà chín executor đã ký không mang; design §2 mục 3 |
| P1 | contract | Ma trận trạng thái sổ thiếu ô không đọc được: undefined, null, không phải mảng | Tệp sinh mất export làm bộ kiểm ném lỗi lúc dựng module, cả app sập, trái AC-5 | AC-1 thêm ba ô (9), AC-2 tám trạng thái (216 ô), AC-5 chạy thêm undefined | fixed: AC-1 9 ô, AC-2 8 × 27 = 216 ô, AC-5 (a) thêm undefined và «app dựng không ném lỗi»; chiều đỏ bo-kiem đúng 8 lần |
| P1 | contract | AC-4 không ghim số ô tuyệt đối; ô rent_st không có tin S06; thứ tự trang ô bảng hạng chưa chắc | Thợ bỏ đối chứng dương ở ô rent_st, assert âm xanh rỗng ở đúng ô PB7 phải đo tay | Liệt N × 6 = M ô và đối chứng dương từng ô | fixed: AC-4 ghim 4 × 6 = 24 ô; đối chứng S06 bán/thuê dài trên trang đầu, ngắn hạn tìm bằng phân trang hết listings (989), không kind không đòi đối chứng ngắn hạn (ghi rõ); bo-loc liệt ba ô phải đỏ. Ma trận PB7 AC-3 không có nhánh bảng hạng (nằm ở AC-4 của PB7) |
| P2 | evals | Assert «0 câu SQL đọc bảng tin» không có đối chứng dương cho chính bộ ghi | Bộ ghi gắn nhầm nên luôn đếm 0, lời hứa «503 trước khi chạm DB» xanh giả | Ô đối chứng: sổ hợp lệ, cùng đường, bộ ghi ≥ 1 câu | fixed: AC-2 và E2 thêm đối chứng cùng tệp trên đúng 27 đường; bo-chot định nghĩa rõ (dựng điều kiện từ Array.isArray(ds) ? ds : []) để ô sổ rỗng lọt tin thay vì 500 |
