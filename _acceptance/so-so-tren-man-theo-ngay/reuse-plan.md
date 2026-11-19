## Screen: Dòng chảy dữ liệu, vùng Số mốc S03 theo ngày
Pattern: none — một dải ô số có đường nhỏ trong trang Dashboard grid đã có, không block nào phủ trọn bốn đường riêng trục

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung vùng | 3 | reui/frame | — |
| ô số mốc | 5 | reui/frame + ui/chart | — |
| trạng thái đứng yên | 4 | reui/badge (variant=warning-light) | — |
| trạng thái trống | 5 | ui/empty + ui/button | — |
| màu đường | 5 | ui/chart + components/charts/palette | khoá flowOffers có sẵn, một sắc cho cả bốn ô |
| bộ lọc riêng | 1 | skip | dùng lại nút khoảng thời gian đầu trang |
