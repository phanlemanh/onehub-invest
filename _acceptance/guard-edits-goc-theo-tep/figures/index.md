# Hình tại điểm quyết định — guard-edits-goc-theo-tep

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-4 — kho git khác | 2 nhánh, cùng luồng chọn gốc | luong-chon-goc |
| Hỏi-2 — thư mục chưa tồn tại | 2 nhánh, cùng luồng chọn gốc | luong-chon-goc |
| Hỏi-1 — không sửa hook kiểm kiểu | có/không, không có luồng rẽ trong sản phẩm | dưới ngưỡng: 1 câu có/không |
| Hỏi-3 — thứ tự code trước hồ sơ | có/không, không có luồng rẽ trong sản phẩm | dưới ngưỡng: 1 câu có/không |

## Đề bài: luong-chon-goc

- Loại hình: flowchart một chiều, trên xuống.
- Nút: «Phiên sửa một tệp» → «Thư mục của tệp còn tồn tại và thuộc một kho git?»; nhánh Có → «Lấy gốc theo kho chứa tệp, về đường thật» → «So với ba luật» ; nhánh Không → «Đường cũ: gốc theo phiên» → «So với ba luật»; → «Chặn» hoặc «Cho sửa».
- Nhãn hai điểm hỏi gắn cạnh nút: «Hỏi-2: thư mục đã bị xoá đi nhánh này — lỗ còn lại» cạnh nhánh Không; «Hỏi-4: kho git khác cũng đi nhánh Có» cạnh nhánh Có.
- Liên quan: AC-1, AC-4, AC-5, AC-9.
