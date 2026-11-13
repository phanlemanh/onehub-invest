## Screen: Hàng duyệt — hạng mục Nối dự án
Pattern: none — dùng khung hàng duyệt /ops/review đang có (hộp hạng mục → thẻ), không có block ReUI phủ trọn thẻ nối dự án

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung thẻ | 3 | ReviewCard | thẻ duyệt có sẵn của app |
| hai cột nguồn ↔ nút | 5 | ReviewCard + review-compare | ghép thành phần so sánh có sẵn |
| dòng căn cứ | 3 | reui/badge | nhãn K-mã ở biến thể mặc định |
| nút Nối / Không phải / Để sau | 3 | NutDapAn | nút đáp án của thẻ duyệt |
| hoàn tác 5 giây | 3 | HangGuiProvider | toast có nút Hoàn tác có sẵn |
| trạng thái trống | 3 | ui/empty | — |
| tải | 3 | ui/skeleton | — |
| lỗi | 5 | reui/alert + ui/button | Alert kèm Thử lại |

## Screen: Thẻ luật
Pattern: none — mở rộng thẻ duyệt thành thẻ nhóm, chưa có khuôn trong registry

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung thẻ | 3 | ReviewCard | — |
| danh sách 5 cặp mẫu | 3 | ui/table | bảng ngắn, không cần data-grid |
| tổng số cặp | 3 | reui/badge | — |
| nút Duyệt cả loạt (admin) | 4 | ui/button (variant=default) | — |
| nhật ký luật + Đảo luật | 5 | ui/table + ui/button (variant=outline) | — |
| xác nhận đảo | 3 | ui/alert-dialog | thao tác cả loạt cần xác nhận |
