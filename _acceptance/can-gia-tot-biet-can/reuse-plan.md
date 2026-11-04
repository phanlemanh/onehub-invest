## Screen: Căn giá tốt
Pattern: @reui/solution-analytics-3

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| khung bảng, phân trang, sắp xếp | 5 | reui/frame + reui/data-grid | theo records-grid, bản chuyển thể của block này trong kho |
| tab việc kế có đếm | 4 | ui/tabs (variant=line) | cách làm của lưới mục tiêu ở /ops |
| chip lọc | 3 | reui/filters | cách làm của Tin mới nhất, nhãn tiếng Việt dùng lại |
| ô tên căn | 4 | ui/button (variant=link) | — |
| ảnh đầu, rê xem lớn | 3 | ui/hover-card | — |
| mức giảm, thước | 5 | ui/progress + reui/badge | mẫu ô thanh của finder, cộng vạch ngưỡng |
| tình trạng | 3 | reui/badge | — |
| nút gọi trong hàng | 4 | ui/button (variant=outline) | — |
| danh sách trống | 3 | ui/empty | — |
| đang tải | 3 | ui/skeleton | — |
| lỗi | 3 | RegionError | — |
| ô KPI | 1 | skip | số trên tab đã đếm; thêm dải KPI đẩy bảng xuống dưới |

## Screen: Sheet một căn
Pattern: @reui/solution-agents-5

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung sheet, chân ghim | 5 | ui/sheet + ui/scroll-area | theo sheet của hàng duyệt, record-sheet |
| chuyển căn trước, sau | 4 | ui/button (variant=ghost) | — |
| hai tab | 4 | ui/tabs (variant=line) | — |
| lưới ảnh và phóng to | 5 | ui/attachment + ui/dialog | ghép sẵn trong ReviewPhotos; thêm biến thể lon, thẻ duyệt không đổi |
| còn thiếu | 3 | reui/alert | — |
| căn cùng tiêu chí | 3 | ui/table | dưới 21 hàng, không sắp không lọc, như bảng trong /ops/people/[partyKey] |
| không có căn cùng tiêu chí | 3 | ui/empty | — |
| nút gọi ở chân | 3 | ui/button | — |

## Screen: Một căn
Pattern: none — theo trang chi tiết đang chạy của /ops/people/[partyKey]

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| khung từng khối | 3 | reui/frame | — |
| thân chung với sheet | 5 | reui/frame + ui/table | một nguồn cho cả hai bề mặt, S3 gộp |
| không tìm thấy | 3 | ui/empty | NotFoundState dẫn về Invest, không về danh sách |
| đang tải | 3 | ui/skeleton | — |
| lỗi | 3 | RegionError | — |
