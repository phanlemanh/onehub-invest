# Kế hoạch dùng lại — can-gia-tot-loc-xep-hang (CG3)

Màn `/ops/deals` đã dựng theo khuôn records-grid ở CG8–CG10. Vòng này đổi bảng sang phân trang máy chủ, thêm bộ chọn vị trí và dòng nhãn hạng.
Không component mới.

## Screen: Căn giá tốt
Pattern: none — khuôn records-grid của kho, chưa có block ReUI phủ trọn (routes.md dòng /ops/deals)

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | đang có |
| khung bảng | 3 | reui/frame | đang có |
| bảng căn, phân trang | 3 | reui/data-grid | đang có, thêm phân trang máy chủ |
| bộ chọn vị trí | 3 | reui/cascader | chọn một nút trên cây nhiều cấp |
| tab trạng thái | 3 | ui/tabs | đang có |
| Bán, Cho thuê | 3 | ui/tabs | hai lựa chọn loại trừ, cùng kiểu với tab trạng thái |
| lọc loại hình | 3 | reui/filters | đang có |
| nhãn hạng trên dòng | 3 | reui/badge | trạng thái dùng Badge |
| trạng thái trống | 3 | ui/empty | đang có |
| trạng thái lỗi | 3 | RegionError | đang có |
| trạng thái tải | 5 | ui/skeleton + reui/frame | DealsSkeleton đang có |
