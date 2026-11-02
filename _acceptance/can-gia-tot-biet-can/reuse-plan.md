## Screen: Căn giá tốt
Pattern: none — giữ lưới thẻ đang chạy; bảng và lọc là việc của CG3

| Slot | Rung | Use | Reason |
|---|---|---|---|
| thẻ căn | 3 | ui/card | — |
| ảnh đầu | 5 | ui/card + ui/empty | ảnh đặt đầu thẻ; ô không ảnh dùng cùng cỡ |
| mức giảm, cần xác minh | 3 | reui/badge | — |
| danh sách trống | 3 | ui/empty | — |
| đang tải | 3 | ui/skeleton | — |
| lỗi | 3 | RegionError | — |

## Screen: Một căn
Pattern: none — theo trang chi tiết đang chạy của /ops/people/[partyKey]

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| khung từng khối | 3 | reui/frame | — |
| lưới ảnh và phóng to | 5 | ui/attachment + ui/dialog | ghép sẵn trong ReviewPhotos; thêm biến thể lon, thẻ duyệt không đổi |
| vì sao giá tốt, ở đâu | 3 | ui/table | — |
| còn thiếu | 3 | reui/alert | — |
| liên kết gọi | 4 | ui/button (variant=outline) | — |
| không tìm thấy | 3 | ui/empty | NotFoundState dẫn về Invest, không về danh sách |
| đang tải | 3 | ui/skeleton | — |
| lỗi | 3 | RegionError | — |
