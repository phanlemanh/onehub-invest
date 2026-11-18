# Kế hoạch dùng lại — trang-danh-ba-chi-doc

## Screen: Danh bạ
Pattern: none — Ops không có block Solutions khớp danh bạ; catalog.md cho trang Ops không khớp block dùng StatTiles + lưới (khuôn /ops/people, /ops/deals)

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| bốn ô số | 3 | StatTiles | — |
| khung bảng dự án | 3 | reui/frame | — |
| bảng cây dự án → phân khu | 4 | reui/data-grid (getSubRows) | cây là tính năng sẵn của data-grid |
| nút mở hàng | 3 | reui/data-grid | DataGridTableRowExpand của data-grid-table |
| ô tìm | 5 | ui/input-group + ui/button | khuôn tìm của /ops/people |
| thanh lọc tỉnh · nguồn · bậc · chỗ thiếu | 3 | reui/filters | khuôn /ops/deals |
| bậc, nguồn | 4 | reui/badge (variant=success-light) | bậc xác minh/suy ra/một lời khai, nguồn outline |
| phân trang | 3 | reui/data-grid | DataGridPagination |
| mã dự án nguồn chưa nối | 5 | reui/frame + ui/tabs + reui/data-grid | tab đếm theo nguồn như /ops/deals |
| trống | 3 | ui/empty | — |
| tải | 3 | ui/skeleton | — |
| lỗi | 3 | RegionError | — |
| chỉ ở máy thu | 3 | LocalOnlyAlert | — |

## Screen: Một dự án
Pattern: none — trang chi tiết Ops theo khuôn /ops/people/[partyKey]

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| bốn ô số | 3 | StatTiles | — |
| bảng toà → căn | 4 | reui/data-grid (getSubRows) | toà mở ra căn |
| tab Mọi toà / Chưa có căn | 3 | ui/tabs | — |
| badge Chưa có căn | 4 | reui/badge (variant=warning-light) | — |
| trống, tải, lỗi | 5 | ui/empty + ui/skeleton + RegionError | — |
