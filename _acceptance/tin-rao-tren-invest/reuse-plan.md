## Screen: Duyệt Listing
Pattern: none — lưới thẻ có sẵn của trang listings, ghép thêm dữ liệu máy chủ từ thành phần đã cài

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | khung chung mọi trang |
| chọn dịch vụ | 3 | shell/top-bar + ui/button | gốc @reui/app-shell-30, thêm cờ ghim cho màn hẹp |
| thời hạn thuê | 3 | ui/toggle-group | cùng kiểu Danh sách, Bản đồ; khuôn c-toggle-group-5 |
| chỉ tin có số | 5 | ui/switch + ui/label | một công tắc, size sm |
| sắp xếp | 3 | ui/select | như thuê ngắn hạn |
| lọc màn rộng | 3 | reui/filters | như thuê ngắn hạn |
| lọc màn hẹp | 2 | listing/offers-filter-sheet | chuyển thể @reui/filter-sidebar-5 theo ngăn đã có của thuê ngắn hạn |
| khung thẻ | 3 | reui/frame | gốc @reui/product-grid-2; thông số là một dòng chữ như các sàn đối chiếu |
| ô chưa có số | 6 | color.muted-foreground | lặp trên gần mọi thẻ nên badge gây nhiễu |
| nút xem số | 3 | ui/button | không có khối riêng |
| phân trang | 3 | ui/pagination | cài mới; khuôn c-pagination-15 bỏ ô số tin mỗi trang |
| trống | 3 | ui/empty | trạng thái chuẩn |
| tải | 3 | ui/skeleton | trạng thái chuẩn |
