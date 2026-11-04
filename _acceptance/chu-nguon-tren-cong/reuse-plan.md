## Screen: Thẻ tin rao
Pattern: none — giữ thẻ có sẵn, chỉ thêm một nút trong thẻ

| Slot | Rung | Use | Reason |
|---|---|---|---|
| nhãn Chưa xác minh | 3 | reui/badge | giữ nguyên dòng cũ |
| nút giải thích | 4 | ui/button (variant=ghost) | cách của nút ⓘ trên slice-legend |
| lời giải thích | 5 | ui/popover + ui/button | tooltip không mở được trên điện thoại |

## Screen: Trang chủ, Phương pháp, Insight thị trường, Tin bán, Tin thuê
Pattern: none — chỉ đổi chữ, không đổi khối

| Slot | Rung | Use | Reason |
|---|---|---|---|
| chữ về nguồn và giá rao | 1 | skip | không thêm thành phần nào |
