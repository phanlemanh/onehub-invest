## Screen: Dự án — không có trong danh bạ (404)
Pattern: none — trang báo mã sai một khối, khuôn sẵn của `(app)/listing/[id]/not-found.tsx`

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khối trống | 5 | ui/empty + ui/button | ghép như not-found của tin rao |
| nút về danh bạ | 4 | ui/button (variant=default) | một hành động chính |

## Screen: Dự án — ô số
Pattern: none — màn đã có, vòng này chỉ đổi chữ chân ô Toà

| Slot | Rung | Use | Reason |
|---|---|---|---|
| ô Toà | 3 | StatTiles | đổi chữ chân ô, không đổi khối |

## Screen: Danh bạ — danh sách
Pattern: none — màn đã có, vòng này đổi dòng phụ và breakpoint một cột

| Slot | Rung | Use | Reason |
|---|---|---|---|
| bảng cây | 3 | reui/data-grid | ẩn cột qua `meta.headerClassName`/`cellClassName` như cột Tỉnh/thành |
| nút mở hàng | 3 | reui/data-grid | nhãn qua `DATA_GRID_VI` (i18n của vendor), không sửa vendor |
