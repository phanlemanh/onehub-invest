## Screen: Biểu mẫu theo nhóm — sáu ô mới và căn cứ Danh mục CĐT
Pattern: none — thêm hàng và một khối khai báo vào biểu mẫu có sẵn, không màn mới

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khối Mô tả căn | 5 | reui/frame + ui/toggle-group | cùng cách dựng năm khối có sẵn (KHOI trong nhom-fields.ts) |
| hàng chọn một (nội thất, hướng, cơ sở giá) | 4 | ui/toggle-group (variant=outline) | — |
| hàng View, Phí đã gồm chọn nhiều | 4 | ui/toggle-group (variant=outline) | thêm prop multiple của ToggleGroup đã cài |
| hàng chữ (mã căn, ngày vào ở) | 3 | ui/input | — |
| nút căn cứ CĐT | 4 | ui/toggle-group (variant=outline) | thêm một mục vào BASIS_NGAN |
| ô Không suy ra được | 3 | ui/checkbox | — |
| lỗi dưới ô | 3 | ui/field | — |
