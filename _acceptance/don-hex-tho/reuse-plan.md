## Screen: Finder — bản đồ choropleth
Pattern: none — vòng không thêm hay đổi ô giao diện nào; chỉ dời hằng màu lớp vẽ MapLibre sang lib/map-colors.ts

| Slot | Rung | Use | Reason |
|---|---|---|---|
| bản đồ khu vực | 3 | ChoroplethMap | giữ nguyên component, chỉ đổi chỗ đặt màu viền và màu bậc |

## Screen: Duyệt listing — bản đồ nhãn giá
Pattern: @mapcn/store-locator

| Slot | Rung | Use | Reason |
|---|---|---|---|
| bản đồ nhãn giá | 2 | @mapcn/store-locator | giữ nguyên bản chuyển thể, chỉ đổi chỗ đặt ba màu nhãn |

## Screen: Insight phường — mini-map
Pattern: none — vòng không thêm hay đổi ô giao diện nào

| Slot | Rung | Use | Reason |
|---|---|---|---|
| mini-map phường | 3 | MiniMap | giữ nguyên component, chỉ đổi chỗ đặt ba màu |

## Screen: Ops — Dòng chảy
Pattern: @reui/chart-49

| Slot | Rung | Use | Reason |
|---|---|---|---|
| Sankey đường ống | 2 | @reui/chart-49 | giữ nguyên bản chuyển thể, mặt nạ quét #000 thành black (cùng alpha) |
