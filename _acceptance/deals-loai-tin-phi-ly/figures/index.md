# Hình tại điểm quyết định — deals-loai-tin-phi-ly (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 ngưỡng «phòng quá nhỏ» (d-…-3) | 2 nhánh rẽ (20 m²/PN · 15 m²/PN) | `nguong-phong.html` |
| Hỏi-2 tin giảm > 35% (d-…-4) | 2 nhánh rẽ (giữ + đẩy cuối · loại hẳn) | `tin-sat-tran.html` |
| Luật chạy sau bước người bán (d-…-9) | dưới ngưỡng: 1 lối sống | — |
| Luật ở pipeline, trang chỉ đọc (d-…-1) | dưới ngưỡng: 1 lối có căn cứ | — |

## Đề bài `nguong-phong`
- Loại hình: bảng so hai nhánh (decision split), một hàng mỗi ví dụ tin.
- Nút: ví dụ tin 36 m² 3PN · 41 m² 3PN · 37 m² 2PN · 45 m² 2PN · 60 m² 3PN; hai cột nhánh «20 m²/phòng» và «15 m²/phòng» ghi «loại» hay «giữ» cho từng tin.
- Nhãn chữ: dưới mỗi nhánh một dòng giá — 20: «loại 73 tin trên DB local hôm nay, gồm nhà ngõ nhiều tầng nhỏ» · 15: «giữ 37 m² 2PN audit gọi là phi lý».
- AC liên quan: AC-1, AC-7. Nhánh máy khuyên (20 m²) đánh dấu.

## Đề bài `tin-sat-tran`
- Loại hình: hai nhánh từ một nút «tin giảm > 35% so với thước».
- Nhánh A (máy khuyên): «vẫn hiện, đứng cuối, nhãn cần xác minh» → hệ quả «không mất tin nào; đầu danh sách là tin đáng gọi trước».
- Nhánh B: «loại khỏi danh sách, ghi audit giam-qua-sau» → hệ quả «danh sách gọn; căn rẻ thật > 35% biến mất tới khi có thước theo loại hình (PL26)».
- AC liên quan: AC-4, AC-6, AC-7.
