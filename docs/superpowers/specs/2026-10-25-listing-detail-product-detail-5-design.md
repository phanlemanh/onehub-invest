# Design — /listing/[id] theo product-detail-5 (UI5, hồ sơ `listing-detail-product-detail-5`)

Ngày: 2026-10-25 · Dãy U1 đợt dot0 · Hạng T2 · Câu giao (lộ trình UI5, phủ GD3): «Nhà đầu tư mở /listing/[id] thấy đầu
trang product-detail-5, ảnh tự thu khi có (không có thì ẩn gallery), lịch form-5 không còn điều khiển thô, vùng dữ
liệu có Skeleton và Empty». Ô Cổng Đáng: Mạnh quyết build 23/10.

## Hiện trạng (main 08afadf)

- Đầu trang = PageHeader (badge loại phòng, đánh giá, PN, khách, tối thiểu đêm; nút Mở trên Airbnb) + lưới ảnh
  4–5 cột vẽ tay trong `page.tsx` (ảnh chính `col-span-2 row-span-2`), không chọn ảnh, ảnh chết thành ô vỡ.
- `booking-heatmap.tsx` (chuyển thể form-5) đóng băng 3 vi phạm lint: 2 `<button>` tay làm trigger tooltip
  (`no-raw-controls`), nhãn thứ `text-[9px]` (`no-arbitrary-text-size`).
- Lịch trống là một `<p>`; comps trống thì vùng biến mất; KPI và comps chờ chung với cả trang (không Suspense,
  không lỗi tại vùng).

## Thiết kế

1. **Đầu trang product-detail-5** (`listing/listing-hero.tsx`): lưới hai cột ở `lg` (3fr gallery dính khi cuộn ·
   2fr hộp Đặc điểm), xếp dọc dưới `lg`. PageHeader giữ breadcrumb, tiêu đề, mô tả (mã Airbnb · quét gần nhất) và
   một badge loại phòng; các badge còn lại dời vào hộp Đặc điểm (không lặp hai chỗ — Hỏi-3).
2. **Gallery** (`listing/listing-gallery.tsx`, chuyển thể `product-gallery` của block): ảnh chính khung 3:2 + dải thumbnail MỘT hàng trượt ngang (≤ 10 ảnh; thấy 5 ảnh vừa
   khung, còn lại cuộn trong khung ScrollArea có snap — Mạnh sửa ở Cổng Phạm vi 25/10 để listing nhiều ảnh không đẩy cao
   bố cục; trước đó là lưới 5 cột xuống hai hàng). Thumbnail là `Radio` của Base
   UI bọc `Item` — nhóm radio có sẵn phím mũi tên/Home/End và roving focus, thay cho nút role=radio dựng tay của block
   (luật `no-raw-controls`). Một ảnh thì không có dải thumbnail.
3. **Ảnh chết**: `onError` (và ảnh đã lỗi trước khi hydrate: `complete` mà `naturalWidth = 0`) đưa ảnh khỏi gallery,
   ảnh chính lùi về ảnh sống đầu tiên; hết ảnh thì gallery báo `onEmpty` và đầu trang về bố cục không ảnh. Ảnh vẫn
   render từ server (smoke luật 5 `smoke-listing-no-airdna.mjs` đọc `<img src>` trong HTML server — không đổi sang
   gắn-sau-hydrate như `AreaThumbnail`).
4. **Không ảnh tự thu** (`photo_urls` null/rỗng): không gallery, không khung trống, không ảnh giả; hộp Đặc điểm chiếm
   cả bề ngang, bảng hai cột từ `sm`.
5. **Hộp Đặc điểm**: bảng khoá–giá (khuôn «Specs» của block): Loại phòng · Phòng ngủ · Phòng tắm · Sức chứa · Đặt
   tối thiểu · Đánh giá · Phường (link Insight) · Thị trường (link) — trường null thì không có dòng. Một nút outline
   «Mở trên Airbnb» (chỉ khi id dạng `abnb_<số>`). Bỏ giá/biến thể/giỏ/số lượng/yêu thích của block: giá đã ở ô KPI
   ngay dưới (Hỏi-1). Khung ảnh theo quy định chung Mạnh chốt ở Cổng Phạm vi (thay Hỏi-2): ảnh chính 3:2 — ảnh ngang phủ kín, ảnh dọc/vuông hiện trọn trên nền; thumbnail 1:1. Căn cứ đo 25/10 trên 469 ảnh tự thu (150 listing): ngang 65% (3:2 là 42%), dọc 33%, vuông 2%; khung 3:2 cắt TB 4% ảnh ngang (4:3 cắt 10%), ảnh dọc phủ kín khung ngang mất ~52%; ô 1:1 cắt ~30% cả hai loại, hợp dải ảnh trộn ngang/dọc (64/135 listing trộn). 19% ảnh mẫu chết trên CDN (mọi cỡ đều 404), 15/150 listing chết hết ảnh.

   Luồng ảnh chết: `_acceptance/listing-detail-product-detail-5/figures/anh-chet.png`.
6. **Lịch form-5**: trigger tooltip là nút của `TooltipTrigger` (Base UI tự vẽ `<button>`), nhãn thứ `text-xs`. Lịch
   0 đêm → `listing/listing-calendar-empty.tsx` (Empty: «Chưa có lịch cho listing này» + một nút «Xem lịch trên
   Airbnb»).
7. **Vùng tải riêng** (`listing/listing-sections.tsx`, thân trang `listing/listing-body.tsx`): KPI (truy vấn peers)
   và Listing tương tự (truy vấn comps) mỗi vùng `RegionError > Suspense` với skeleton đúng bố cục
   (`ListingKpisSkeleton` 4 ô, `ListingCompsSkeleton` khung bảng). PageHeader, đầu trang và lịch đứng ngoài vì dùng
   chính bản ghi listing (đã tải trước khi render; lỗi bản ghi → `(app)/error.tsx` như cũ). Comps 0 dòng → Empty
   «Chưa có listing tương tự» + «Duyệt listing ở <thị trường>» (thiếu thị trường → «Tìm thị trường» `/vn`).
8. **Số không đổi**: `listingTiles()` giữ nguyên công thức bốn ô (bậc giá p30/p60/p90, công suất null khi chưa báo
   giá, footer trung vị theo phạm vi peers).
9. **Bản gốc block không giữ trong `blocks/`**: `npx shadcn add @reui/product-detail-5` kéo theo `ui/carousel.tsx`
   (đỏ luật react-hooks «setState trong effect», mà `ui/` không sửa tay) và hai gói embla chỉ dùng cho carousel đánh
   giá/sản phẩm liên quan — trang chỉ cần gallery + cột thông tin. Catalog ghi previewUrl làm tham chiếu.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: Finder/Insight/Duyệt listing/comps → `/listing/[id]` → xem ảnh (bấm thumbnail hoặc phím mũi tên), đọc Đặc
  điểm, KPI so với phường, lịch 365 đêm → ra: link Phường/Thị trường, «Mở trên Airbnb», một listing tương tự.
- Biên: listing không ảnh tự thu · ảnh chết trên CDN (một / tất cả) · lịch 0 đêm · không có comps (thiếu toạ độ hay
  thị trường) · trường đặc điểm null.
- Lỗi & quay lại: truy vấn peers hay comps hỏng → vùng đó hiện Alert «Không tải được …» + «Thử lại», phần còn lại
  đứng; bản ghi listing hỏng → `(app)/error.tsx`; id không có → 404.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Chi tiết listing | Cho nhà đầu tư thấy căn này là gì và chạy tốt cỡ nào so với khu vực | Finder, Insight, Duyệt listing, comps / Insight phường-thị trường, Airbnb, listing khác |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-listing-co-anh | Chi tiết listing | Gallery (ảnh chính 3:2, ảnh dọc hiện trọn trên nền + một hàng thumbnail 1:1 trượt ngang) trái, Đặc điểm phải | Chọn ảnh, đọc đặc điểm, mở Airbnb |
| ST-listing-khong-anh | Chi tiết listing | Không gallery; Đặc điểm trải ngang hai cột | Đọc đặc điểm, mở Airbnb |
| ST-listing-anh-chet | Chi tiết listing | Ảnh chết rời gallery; hết ảnh → như khong-anh | Như trên |
| ST-listing-kpi-tai | Chi tiết listing | 4 ô skeleton đúng khung StatTiles | Chờ |
| ST-listing-kpi-loi | Chi tiết listing | Alert «Không tải được chỉ số của listing» + Thử lại | Thử lại |
| ST-listing-lich-trong | Chi tiết listing | Empty «Chưa có lịch cho listing này» | Xem lịch trên Airbnb |
| ST-listing-comps-tai | Chi tiết listing | Khung «Listing tương tự» với hàng skeleton | Chờ |
| ST-listing-comps-trong | Chi tiết listing | Empty «Chưa có listing tương tự» | Duyệt listing ở <thị trường> |
| ST-listing-comps-loi | Chi tiết listing | Alert «Không tải được listing tương tự» + Thử lại | Thử lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Thumbnail: bấm chọn; Tab vào nhóm, ←/→/↑/↓ đổi ảnh (radio group Base UI); thumbnail đang chọn viền `ring-foreground`.
- Dải thumbnail một hàng: rộng mỗi ô = (khung − 4 khe) / 5; quá 5 ảnh thì cuộn ngang (thanh cuộn mảnh, snap đầu ô); đổi ảnh
  thì dải chỉ cuộn NGANG để ô đang chọn vào khung (không `scrollIntoView` — nó kéo cả trang dọc).
- Ảnh chính đổi bằng mờ dần 200 ms `ease-[cubic-bezier(0.22,1,0.36,1)]`, tắt khi `prefers-reduced-motion`.
- `lg` trở lên hai cột, gallery `sticky top-8`; dưới `lg` một cột; 375 px không cuộn ngang trang (lịch, bảng cuộn trong khung).

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `@reui/product-detail-5` (gallery + cột phải) | ghép | Block đích của `routes.md`; bỏ buy box thương mại |
| `@base-ui/react` Radio/RadioGroup + `ui/item` | dùng | Nhóm radio có phím mũi tên; thay nút tay của block |
| `@reui/form-5` (BookingHeatmap) | mở rộng | Đã chuyển thể; chỉ gỡ điều khiển thô |
| `ui/empty`, `ui/skeleton`, `states/region-error` | dùng | Khuôn trạng thái của app |
| `StatTiles`, `CompsTable`, `PageHeader` | dùng | Có sẵn |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: trang là màn chi tiết của danh sách listing (Finder/Duyệt listing → một listing); block đích đã chốt trong
`routes.md` (product-detail-5) — một khuôn hiển nhiên, không tra mẫu ngoài.
<!-- UX-SPEC-TEMPLATE>>> -->

## Ngoài phạm vi

- Trang Duyệt listing (`/[country]/[market]/listings`, UI6) và thẻ listing.
- Nút Chia sẻ trên Listing (GD14), lưu listing vào Đã lưu (GD15).
- Giá theo đêm trong hộp Đặc điểm (Hỏi-1) — giữ ở ô KPI.
- Hiển thị `propertyType` (chuỗi tiếng Anh của Airbnb, chưa có bảng dịch).
