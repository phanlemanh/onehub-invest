## Screen: Gắn nhãn
Pattern: none — ReUI không có block gắn nhãn; bố cục biểu mẫu lấy khuôn của @reui/form-2 nhưng không cài block

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| bộ chọn nhóm, tiến độ | 5 | ui/select + ui/progress | đặt ở `actions` của PageHeader, không bọc Frame: đo trên bài thật, Frame riêng làm biểu mẫu tràn 1440×900 |
| khung biểu mẫu | 3 | reui/frame | — |
| bài gốc | 3 | reui/frame | — |
| nhãn và lỗi ô | 3 | ui/field | — |
| lựa chọn ngắn | 3 | ui/toggle-group | — |
| căn cứ | 3 | ui/toggle-group | — |
| ô chữ và số | 3 | ui/input | — |
| không suy ra được | 3 | ui/checkbox | — |
| giải thích ô | 3 | ui/tooltip | — |
| lý do, ghi chú | 3 | ui/textarea | — |
| đã điền bao nhiêu | 3 | reui/badge | — |
| lưu, xem hết bài | 3 | ui/button | — |
| bảng so với máy | 3 | ui/table | dưới ngưỡng cần reui/data-grid: 17 dòng cố định, không lọc, không phân trang |
| bảng trường hợp | 3 | ui/table | dưới ngưỡng cần reui/data-grid: tối đa 30 dòng, chỉ đọc |
| khác máy | 3 | reui/badge | — |
| loại trường hợp, thẻ đúng sai | 3 | ui/select | — |
| trống | 3 | ui/empty | — |
| lỗi | 3 | reui/alert | — |
| đang tải | 3 | ui/skeleton | — |
| trên cloud | 3 | reui/alert | khối LocalOnlyAlert sẵn có của Ops bọc thành phần này, chưa có tên trong registry |
| trạng thái đã chọn | 6 | color.primary, color.primary-foreground | nền đã chọn mặc định quá nhạt, Mạnh chọn bản có nền đặc |
