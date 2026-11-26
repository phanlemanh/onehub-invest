# Điểm quyết định — Cổng Phạm vi

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 gỡ trường hay gỡ đường (d-20261124T112808Z-2) | 2 nhánh rẽ ở coverage, 3 đường | cần hình → `ba-duong.html` |
| Hỏi-2 bỏ hay giữ tên người bán ở deals (d-20261124T113143Z-9) | 2 nhánh rẽ | gộp vào `ba-duong.html` (cùng đường deals) |
| Đo trên lược đồ thật thay lược đồ mẫu (d-20261124T112808Z-4) | dưới ngưỡng: 1 lối sống | — |
| markets.ts ngoài lời giao (d-20261124T112808Z-5) | dưới ngưỡng: 1 lối | — |

## Đề bài `ba-duong`

- Loại: sơ đồ so sánh trước/sau, ba hàng (một hàng một đường), cột trái «trên main hôm nay», cột phải «sau hàng (khuyến nghị)».
- Hàng deals: trái — đọc sale_offers + bảng hạng + stg_zalo_posts (bài S03 thô) → trả giá, hạng, contact{senderName, groupName, mediaPath}, postText. Phải — bỏ stg_zalo_posts → trả giá, hạng. Nhánh rẽ Hỏi-2: lối khác «giữ tên người bán từ sale_offers đã làm sạch».
- Hàng coverage: trái — đọc listings + 3 bảng S02 → ourListings + calibration*, historyMonths, coverageRatio, chỉ thị trường có S02. Phải — chỉ listings → areaId, name, ourListings cho mọi thị trường VN. Nhánh rẽ Hỏi-1: lối khác «410 Gone».
- Hàng listings/:id: trái — listings + bảng S02 → ảnh dự phòng «calibration», listingUrl. Phải — chỉ listings → ảnh tự thu hoặc null, không listingUrl.
- Nhãn bằng tiếng Việt; bảng cấm tô màu cảnh báo; KHÔNG ghi tên nguồn thật, chỉ «S02», «S03» và tên bảng dạng định danh nếu cần (tốt nhất chỉ ghi «bảng S02»). AC liên quan: AC-1..AC-4.
