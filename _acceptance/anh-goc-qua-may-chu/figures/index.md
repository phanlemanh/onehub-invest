# Hình tại điểm quyết định — anh-goc-qua-may-chu

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 phạm vi máy (chỉ máy thu hay cả cloud) | 2 nhánh rẽ | pham-vi-may.html |
| Đường ảnh ?media= (máy quyết, đặc tả audit) | 3 bước nối tiếp | (gộp vào pham-vi-may: nhánh máy thu vẽ đủ ba bước) |

## Đề bài pham-vi-may

- Loại hình: luồng hai nhánh (flowchart ngang).
- Nút chung: «Người duyệt vai Vận hành mở thẻ có tin S06» → «Trình duyệt xin /api/zalo-media?media=<khoá>».
- Nhánh A «Chỉ máy thu (khuyến nghị)»: «Máy chủ máy thu tra dòng media theo khoá» → «Máy chủ tự lấy ảnh từ nguồn (https, chặn địa chỉ riêng, ≤ 8 MB, ≤ 8 giây)» → «Trả byte ảnh — trình duyệt không thấy URL gốc». Ghi chú dưới nhánh: «Cloud: chưa có ảnh S06 tới khi TV9».
- Nhánh B «Cả cloud ngay»: «Đưa bảng media lên cloud (sync + leak gate)» → «Máy chủ cloud lấy ảnh như nhánh A» → «Vòng lớn gấp đôi».
- AC liên quan: AC-1, AC-3, AC-7.
