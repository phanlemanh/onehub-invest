# Hình tại điểm quyết định — listings-filters-store-locator

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 ngoại lệ lint cho `ui/map.tsx` | dưới ngưỡng: 0 bước, chọn một trong hai cấu hình | — |
| Hỏi-2 bấm nhãn giá → popup | 3 bước nối tiếp (bấm nhãn → popup → «Xem listing») | luong-loc.html |
| Hỏi-3 canh khung khi đổi bộ lọc | 2 nhánh (đang lọc vùng → giữ khung · không → canh khung) | luong-loc.html |
| Hỏi-4 số listing rời PageHeader | dưới ngưỡng: 0 bước, chỗ đặt một dòng chữ | — |
| Hỏi-5 bộ bốn trường lọc | dưới ngưỡng: danh sách, không luồng | — |
| Điều kiện ngoài ngăn giữ nguyên (thay d-1) | 2 nhánh (biểu diễn được → facet · không → giữ nguyên + dòng báo) | luong-loc.html |
| Gap-probe P0 Hỏi-5 (human-gate1) | trùng Hỏi-5 | — |

## Đề bài luong-loc

- Loại hình: luồng (flowchart) trái → phải, một trang.
- Nút: «Thanh chip (≥ lg)» và «Ngăn Bộ lọc (< lg)» cùng ghi vào «Một cây lọc» → «Lưới thẻ» và «Bản đồ (mọi listing khớp)»; nhánh ngăn: «điều kiện biểu diễn được → facet» / «không → giữ nguyên + dòng báo»; bản đồ: «người kéo/zoom/bấm cụm/nút ± → lọc lưới theo khung» và «máy canh khung (tải, bộ lọc mới khi KHÔNG lọc vùng, Bỏ lọc) → không lọc»; nhánh «đang lọc vùng → giữ khung»; «bấm nhãn giá → popup → Xem listing».
- Nhãn bằng chữ tiếng Việt, ghi Hỏi-2 / Hỏi-3 cạnh nút tương ứng.
- AC liên quan: AC-4, AC-5, AC-6.
