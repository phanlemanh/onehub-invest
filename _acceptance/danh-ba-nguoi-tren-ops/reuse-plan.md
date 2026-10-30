## Screen: Danh bạ người
Pattern: none — trang quản trị bảng, khung giống /ops/review (data-grid trong Frame), không có block nguyên trang hợp

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang (breadcrumb + ba số) | 3 | PageHeader | — |
| thanh lọc nguồn | 3 | ui/select | form GET, đổi nguồn gửi ngay |
| ô tìm bí danh | 5 | ui/input-group + ui/button | ô nhập + nút Tìm trong một form GET |
| khung bảng | 3 | reui/frame | — |
| bảng người | 3 | reui/data-grid | khuôn review-queue: một trang 100 người, sắp trong trang |
| chân bảng: Trang k/n + Trang trước / Trang sau | 4 | ui/button (variant=outline) | đường dẫn ?page= giữ lọc (Hỏi-2) |
| nhãn suy luận | 4 | reui/badge (variant=info-light) | kèm chữ «suy luận» |
| ô bí danh bị che | 6 | color.muted-foreground | chữ «Ẩn với vai Người xem» |
| trống / lọc không khớp | 3 | ui/empty | lệnh dựng danh bạ; nút Xoá lọc |
| chờ | 3 | ui/skeleton | khung bảng giả |
| lỗi | 3 | RegionError | Thử lại |
| cloud | 3 | LocalOnlyAlert | «Chỉ ở máy thu» |

## Screen: Một người
Pattern: none — hai bảng đọc thuần dưới đầu trang

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang (mã, nguồn, số tin, nhãn suy luận) | 3 | PageHeader | — |
| khung bí danh | 5 | reui/frame + ui/table | ít hàng, không cần sắp |
| khung tin đã đăng | 5 | reui/frame + ui/table | tối đa 200 hàng mới nhất |
| dấu đã nghỉ | 4 | reui/badge (variant=outline) | — |
| không bí danh / không tin | 3 | ui/empty | một câu |
