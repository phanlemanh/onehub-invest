## Screen: Hàng duyệt
Pattern: @reui/solution-agents-5

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung nhịp duyệt | 5 | reui/frame + ui/table | bảng ≤ 8 hàng, cùng họ Frame với «Danh sách thẻ»; rail solution-agents-9 là OD2 |
| nhịp trống | 5 | ui/empty + ui/button (variant=outline) | trống có một hành động: mở thẻ chờ cũ nhất |
| nhịp đang tải | 3 | ui/skeleton | đúng bố cục tiêu đề + 4 hàng |
| thẻ không tìm thấy | 4 | reui/alert (variant=warning) | lỗi tại chỗ như các trang Ops |
| badge loại Người | 4 | reui/badge (variant=warning-light) | khuôn ĐC1 |
| badge trạng thái theo đáp án | 4 | reui/badge (variant=success-light) | giữ màu theo trạng thái, đổi chữ |
| dòng ảnh hỏng | 3 | ui/attachment | dải ảnh giữ c-attachment-3, ảnh lỗi rời dải thành một dòng chữ |

## Screen: Căn giá tốt
Pattern: none — lưới, sheet, trang một căn đã có; chỉ thêm một badge và một liên kết

| Slot | Rung | Use | Reason |
|---|---|---|---|
| badge đang chờ ghép | 4 | reui/badge (variant=warning-light) | khuôn ĐC7 |
| liên kết mở thẻ ghép | 4 | ui/button (variant=link) | khuôn ĐC7 |
