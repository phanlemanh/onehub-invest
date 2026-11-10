# Hình tại điểm quyết định — danh-ba-toa-truc-can (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 ba dòng `asset_nodes building` (phân khu hay toà) | 2 nhánh rẽ | `luong-dung-danh-ba` |
| Hỏi-2 nguồn chủ đầu tư (từ điển duyệt hay suy từ khu) | 2 nhánh rẽ | `luong-dung-danh-ba` |
| Hỏi-3 khu của tin (sổ nhóm hay suy từ tên toà) | 2 nhánh rẽ | `luong-dung-danh-ba` |
| Hỏi-4 bậc S08 và toà chỉ từ tin (ứng viên hay đúc) | 2 nhánh rẽ | `luong-dung-danh-ba` |
| Hỏi-5 phường cấp toà (khu một phường hay tách hàng) | 2 nhánh rẽ | `luong-dung-danh-ba` |
| Không đúc căn cho ô chưa có mã | dưới ngưỡng: 1 bước | — |
| Vật thể không lên cloud | dưới ngưỡng: 1 bước | — |

## Đề bài hình `luong-dung-danh-ba`

- Loại hình: sơ đồ luồng (flowchart) trái → phải, một trang.
- Nút: Danh mục S08 đã nối khu → Bộ tách mã (khuôn có tên; mã không tách → Sổ lý do) → Tra bí danh (có → khoá cũ;
  chưa → đúc khoá mới) → Toà `bld_` + UPI · Trục `stk_` · Căn `unt_` (chỉ khi có mã). Nhánh phụ: Phát biểu toà trên
  tin → [Hỏi-3: tin có khu?] → khớp đúng một toà → Bí danh tên; khớp 0/≥2 → [Hỏi-4] Ứng viên (không đúc toà từ tin; lối khác:
  đúc toà tạm). Nhánh phụ: Toà → [Hỏi-5] nút vùng có đúng một phường? → Phát biểu phường suy ra; nhiều phường → Sổ lý do. Nhánh phụ: Từ điển chủ đầu tư [Hỏi-2] → Phát biểu `builder_name`. Nhánh phụ: Ba dòng
  `asset_nodes` phân khu [Hỏi-1] → cha vùng của toà.
- Nhãn bằng chữ tiếng Việt, năm ô Hỏi tô màu nhấn khác các nút thường.
- AC liên quan: AC-2, AC-3, AC-4, AC-5, AC-8, AC-9, AC-10, AC-12.
