## Screen: Lưới Sức khoẻ nguồn (cột Thao tác)
Pattern: none — mở rộng lưới block solution-dev-ops-6 đã chuyển thể (`FeedsGrid`), không có khuôn riêng cho một cột hành động

| Slot | Rung | Use | Reason |
|---|---|---|---|
| nút Tạm dừng | 4 | ui/button (variant=outline) | hành động phụ trên một hàng bảng |
| nút Bật lại | 4 | ui/button (variant=outline) | cùng trục với Tạm dừng |
| chữ «Đang có lệnh chờ» | 3 | reui/badge | trạng thái theo luật ReUI 2 |

## Screen: Hộp thoại xác nhận lệnh
Pattern: none — hộp thoại xác nhận một trường, ghép từ thành phần đã cài

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung hộp thoại | 3 | ui/dialog | Dialog cho thao tác có nhập liệu (luật ReUI 1) |
| dòng trước → sau | 3 | reui/badge | hai trạng thái nguồn |
| ô Lý do | 5 | ui/label + ui/textarea | ô nhập nhiều dòng có nhãn |
| lỗi từ route | 3 | reui/alert | lỗi tại chỗ, giữ chữ đã gõ |
| nút Gửi lệnh / Huỷ | 3 | ui/button | — |
| thông báo đã gửi | 1 | skip | dùng sonner đã gắn ở layout Ops, không phải ô của màn |

## Screen: Vùng Lệnh gần đây
Pattern: none — trang Ops không có block khớp, dùng bảng chung của kho

| Slot | Rung | Use | Reason |
|---|---|---|---|
| bảng lệnh | 3 | InsightGrid | bảng Ops không có block (catalog «Một loại UI, một cách làm») |
| nhãn tiến trình | 3 | reui/badge | badge -light theo trạng thái |
| tải | 3 | ui/skeleton | luật ReUI 5 |
| trống | 2 | @reui/c-empty-11 | trạng thái trống có hành động |
| lỗi + Thử lại | 5 | reui/alert + ui/button | luật ReUI 5 |
| nút Duyệt/Từ chối S03 | 4 | ui/button (variant=outline) | hành động phụ trên hàng |
