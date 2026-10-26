# Design — Duyệt listing theo filters + filter-sidebar-5 + @mapcn/store-locator (UI6, hồ sơ `listings-filters-store-locator`)

Ngày: 2026-10-26 · Dãy U1 đợt dot0 · Hạng T2 · Câu giao (lộ trình UI6, phủ GD4): «Nhà đầu tư duyệt listing lọc bằng
filters (màn hẹp filter-sidebar-5) và bản đồ @mapcn/store-locator gom cụm, vẫn lọc theo khung nhìn khi kéo hoặc zoom».
Ô Cổng Đáng: Mạnh quyết build 23/10. Block đích (routes.md dòng `/[country]/[market]/listings`): `product-grid-2`
(giữ, bật panel ảnh tự thu) + component `filters` · `filter-sidebar-5` (màn hẹp) + `@mapcn/store-locator` + clusters
(thay `ListingsMap`). Hàng bản đồ chạy đầu tiên → khai registry `@mapcn` (BOI-CANH §4).

## Hiện trạng (main 106cbd3)

- Bộ lọc = hai `Select` (Phường, Sắp xếp); không lọc loại phòng, phòng ngủ, giá.
- Bản đồ `listings/listings-map.tsx` dựng MapLibre tay (nền OpenFreeMap, cụm tới zoom 11, nhãn giá viên thuốc, lọc
  danh sách theo khung nhìn chỉ khi có cử chỉ thật); bấm nhãn nhảy thẳng sang `/listing/<id>`.
- Thẻ `listing-card.tsx` không có ảnh (comment cũ «collector chưa thu ảnh») — nay 380/393 listing Hà Nội có ảnh.
- Trang chờ cả truy vấn 300 listing rồi mới vẽ (không Suspense, không lỗi tại vùng).

## Thiết kế

1. **Một trạng thái lọc**: cây `FilterQuery` của `@reui/filters` (đã cài trong kho). Phần thuần
   `listing/listing-filter-query.ts` (không `"use client"`): `compileListingFilter(query)` → hàm lọc; điều kiện soạn dở
   bị bỏ qua (không lọc mất listing); số so với listing không có số → không khớp. Lọc chạy trên ≤ 300 listing đã tải.
2. **Màn rộng (≥ lg)**: thanh chip `Filters variant="basic"` (`listings-filter-bar.tsx`) — bốn trường (Hỏi-5) Phường · Loại
   phòng (là / không phải; lựa chọn lấy từ chính dữ liệu, kèm số listing) · Phòng ngủ (từ / bằng / tới) · Giá/đêm (trong
   khoảng / từ / tới; chip đọc số rút gọn «1,5 tr ₫»). Nhãn khung dịch tiếng Việt (`FILTER_LABELS_VI`).
3. **Màn hẹp (< lg)**: nút «Bộ lọc» mang số bộ lọc đang áp, mở Sheet chuyển thể `filter-sidebar-5`
   (`listings-filter-sheet.tsx`): Loại phòng (checkbox + số), Phòng ngủ tối thiểu (radio Bất kỳ / Từ 1–4), Giá/đêm (thanh
   trượt hai đầu từ giá thấp nhất tới p95, kéo tới cùng = không chặn trên), Phường (checkbox + số, xếp cuối vì dài).
   Số cạnh lựa chọn đếm sống (bản gốc số cố định). Chọn trong ngăn là nháp; «Xem N listing» ghi cây qua
   `queryFromFacets`; mở ngăn đọc cây bằng `facetsFromQuery` — điều kiện thanh chip mà ngăn không biểu diễn được (vd «không
   phải», «bằng») giữ NGUYÊN khi áp, ngăn hiện dòng «Còn N điều kiện từ thanh lọc màn rộng…»; «Xoá hết»/«Đặt lại» mới bỏ chúng.
4. **Bản đồ**: `@mapcn/map` cài nguyên văn vào `components/ui/map.tsx`; `listings-map.tsx` viết lại trên `Map` của
   mapcn theo khuôn LocatorMap của `@mapcn/store-locator` — nền OpenFreeMap qua prop `styles` (không dùng Carto mặc
   định), `MapControls` phóng to/thu nhỏ, bấm listing mở `MapPopup` (tên, badge, giá/đêm, công suất, «Xem listing»).
   Lớp cụm + nhãn giá chép logic cũ vào `ListingLayers` dùng `useMap()`; không dùng `MapClusterLayer` của mapcn vì lớp đó
   vẽ chữ bằng font «Open Sans» mà máy chủ glyph OpenFreeMap không có (số cụm không hiện) và không có nhãn giá. Không
   dùng Sidebar + `MapMarker` DOM của block (tới 300 listing; danh sách là lưới thẻ của trang).
5. **Lọc theo khung nhìn**: bản đồ báo khung `[tây, nam, đông, bắc]`; lưới lọc thêm `inView` (AND với bộ lọc thuộc
   tính); bản đồ hiện mọi listing khớp bộ lọc thuộc tính. «Người dùng di chuyển» = di chuyển bắt đầu trong 1 giây sau một
   thao tác (pointerdown / wheel / keydown / touchstart) trong khung bản đồ, hoặc có `originalEvent`, hoặc bấm cụm — gồm
   cả nút ± của mapcn (zoomTo không mang originalEvent). Canh khung đầu, canh theo bộ lọc mới, resize, đổi sáng/tối,
   «Bỏ lọc» không lọc. Đổi bộ lọc thuộc tính khi KHÔNG lọc vùng → bản đồ canh khung theo tập mới (Hỏi-3); khi đang lọc
   vùng → giữ khung.
6. **Thẻ có ảnh** (`listing-card.tsx`): panel ảnh khung 3:2 `object-cover` (quy định khung ảnh catalog — thẻ nhỏ phủ kín
   cho lưới đều), ảnh `?im_w=480` (`photoSrc` của gallery), ≤ 3 ảnh tự thu từ `getMarketListings` (`photoUrls`); ảnh chết
   (cả trước hydrate) lùi ảnh kế; hết ảnh → không panel, không ô vỡ. Không ảnh AirDNA (luật 5).
7. **Vùng dữ liệu**: trang = PageHeader + `RegionError > Suspense(ListingsRegionSkeleton) > ListingsRegion`; bản đồ
   bọc `RegionError` riêng (WebGL hỏng không kéo sập lưới). Số listing rời PageHeader xuống dòng tổng kết của vùng
   (Hỏi-4). Thị trường 0 listing → Empty «Đang thu thập listing ở …» + «Xem Insight …».
8. **Vendor + lint**: `components.json` khai `@mapcn` (`https://mapcn.dev/r/{name}.json`). `ui/map.tsx` đỏ 14 chỗ hai
   luật React Compiler (`react-hooks/refs`, `set-state-in-effect`) — tắt đúng hai luật cho đúng tệp trong
   `eslint.config.mjs` (Hỏi-1). Lệnh cài mapcn nâng `maplibre-gl` 6.14→6.16 và chèn CSS popup vào `@layer base` toàn cục —
   hoàn lại cả hai (worker trong `public/` theo bản cũ; CSS thu vào `[data-mapcn]` để các bản đồ MapLibre cũ giữ popup).
9. **Bấm nhãn giá → popup** thay vì nhảy trang ngay (Hỏi-2).

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: Insight thị trường / ⌘K → `/vn/hanoi/listings` → thêm chip «Loại phòng là Nguyên căn» → lưới + bản đồ còn
  listing khớp → kéo bản đồ tới phường quan tâm → lưới chỉ còn listing trong khung → bấm nhãn giá → popup → «Xem
  listing» (điểm ra: `/listing/<id>`).
- Biên: bộ lọc ra 0 listing; kéo bản đồ tới vùng không có listing; listing không có giá (không nhãn, chỉ chấm); listing
  mọi ảnh chết; thị trường chưa có listing tự thu; màn hẹp chỉ thấy danh sách hoặc bản đồ (nút chuyển).
- Lỗi & quay lại: truy vấn listing lỗi → Alert tại vùng + Thử lại (PageHeader đứng); WebGL không có → Alert thay khung
  bản đồ, lưới vẫn dùng được; điều kiện soạn dở → chip viền đứt, không lọc.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Duyệt listing | Thu hẹp listing một thị trường theo thuộc tính và vùng | Insight thị trường, nav «Listing», ⌘K / chi tiết listing |
| Ngăn Bộ lọc (< lg) | Chọn bộ lọc bằng ngón tay rồi áp một lần | nút «Bộ lọc» / «Xem N listing» hoặc đóng |
| Popup listing (bản đồ) | Xem nhanh một listing trên bản đồ | bấm nhãn/chấm / «Xem listing» hoặc đóng |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-listings-loading | Duyệt listing | PageHeader + skeleton (hàng công cụ, 4 thẻ có khối ảnh 3:2, khung bản đồ) | chờ |
| ST-listings-ready | Duyệt listing | «300 listing · Hiện 300/393 listing doanh thu cao nhất…», lưới thẻ, bản đồ cụm/nhãn | lọc, kéo bản đồ, mở listing |
| ST-listings-filtered-empty | Duyệt listing | Empty «Không có listing khớp bộ lọc» | «Xoá bộ lọc» |
| ST-listings-viewport-empty | Duyệt listing | Empty «Không có listing trong vùng này» | «Bỏ lọc vùng» |
| ST-listings-viewport | Duyệt listing | «N listing trong vùng bản đồ» + badge «Đang lọc theo vùng bản đồ ×» | bỏ lọc vùng, kéo tiếp |
| ST-listings-market-empty | Duyệt listing | Empty «Đang thu thập listing ở <thị trường>» | «Xem Insight <thị trường>» |
| ST-listings-error | Duyệt listing | Alert «Không tải được listing của thị trường» + Thử lại | Thử lại |
| ST-map-error | Duyệt listing | Alert «Không tải được bản đồ» trong khung bản đồ | Thử lại / dùng lưới |
| ST-sheet-draft | Ngăn Bộ lọc | chip nháp, số cạnh lựa chọn, nút «Xem N listing» | áp / Đặt lại / đóng |
| ST-card-no-photo | Duyệt listing | thẻ không panel ảnh (chết hết hoặc không có) | như thẻ thường |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Breakpoint `lg`: ≥ lg thanh chip + lưới 3fr | bản đồ 2fr dính; < lg nút «Bộ lọc» + ToggleGroup Danh sách/Bản đồ.
- Bản đồ `cooperativeGestures` (lăn trang không bị bản đồ nuốt; Ctrl/⌘ + lăn để zoom). Phím trên canvas (±, mũi tên)
  tính là thao tác người dùng.
- Thanh chip: Escape giữ chip soạn dở (viền đứt), Delete/⌫ xoá chip (hành vi của `@reui/filters`).
- Rê thẻ ↔ nhãn giá trên bản đồ sáng (đen viền trắng, nổi trên cùng).

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `@reui/filters` | dùng | Chủ sở hữu việc lọc theo luật ReUI; nhãn VI qua prop `labels`/`operatorLabels` |
| `@reui/filter-sidebar-5` | ghép (chuyển thể) | Block đích màn hẹp; đổi mục thời trang → listing, đếm sống, chip Badge |
| `@mapcn/map` | dùng (nguyên văn `ui/map.tsx`) | Bản đồ đích chốt 23/10; `Map`, `MapControls`, `MapPopup`, `useMap` |
| `@mapcn/store-locator` | ghép (khuôn LocatorMap) | Khuôn danh sách ↔ bản đồ + popup; bỏ Sidebar/MapMarker DOM |
| `product-grid-2` (`listing-card.tsx`) | mở rộng | Bật panel ảnh tự thu như block đích ghi |
| `ListingLayers` (cụm + nhãn giá) | tạo (chép từ ListingsMap cũ) | `MapClusterLayer` của mapcn thiếu font OpenFreeMap và nhãn giá |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: block đích đã chốt ở routes.md (product-grid-2 + store-locator: danh sách đồng bộ bản đồ, mở chi tiết) và IA §3.2
«Duyệt listing» — một khuôn khả dĩ, không tra Mobbin.
<!-- UX-SPEC-TEMPLATE>>> -->

## Ngoài phạm vi

Đồng bộ bộ lọc lên URL (chia sẻ link đã lọc); lọc công suất/doanh thu; lưu bộ lọc; ảo hoá lưới; chuyển bản đồ Finder
(`@mapcn/choropleth`, I1) và Insight (`@mapcn/map`, I2) sang mapcn; khung ảnh Đã lưu / So sánh / thẻ deal Ops.
