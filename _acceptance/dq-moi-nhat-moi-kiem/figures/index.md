# Hình tại điểm quyết định — dq-moi-nhat-moi-kiem (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 nhãn kiểm độ phủ tham chiếu (d-…-7) | 2 nhánh rẽ (nhãn theo nghĩa kiểm · nhãn theo số độ phủ) | `nhan-do-phu.html` |
| Chữ đếm «đối tượng» (d-…-8) | dưới ngưỡng: 1 lối có căn cứ | — |
| Bản mới nhất theo cặp, bỏ LIMIT (d-…-2) | dưới ngưỡng: 1 lối có căn cứ | — |

## Đề bài `nhan-do-phu`
- Loại hình: bảng so hai nhánh, mỗi hàng một dòng kiểm độ phủ tham chiếu mẫu.
- Hàng mẫu: (a) đạt, chi tiết «coverage=0.00%» · (b) đạt, chi tiết «coverage=62%» · (c) không đạt (thiếu số tham chiếu).
- Cột nhánh A (máy khuyên): nhãn theo nghĩa kiểm — (a) «Có số tham chiếu» xanh dương · (b) «Có số tham chiếu» xanh dương · (c) «Thiếu số tham chiếu» vàng.
- Cột nhánh B: nhãn theo số độ phủ trong cột Chi tiết — (a) «Không đạt» đỏ · (b) «Đạt» xanh lá · (c) «Không đạt» đỏ.
- Dòng giá dưới mỗi cột: A «người vận hành phải đọc cột Chi tiết để biết độ phủ» · B «app đọc chữ tự do pipeline viết; đổi khuôn chữ là nhãn sai».
- AC liên quan: AC-4.
