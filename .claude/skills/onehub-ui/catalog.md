# Danh mục block đã chuyển thể (tra ở đây TRƯỚC MCP `search`)

Có sẵn bản chuyển thể thì dùng lại bản đó, đừng cài block mới cho cùng việc. Không có thì
mới chạy MCP (`compose_page`/`search`). Chọn xong block mới thì thêm một dòng vào bảng dưới
**trong cùng PR**, nói rõ chỗ đã đổi so với bản gốc. Chỉ được đổi dữ liệu, chữ và prop
(`reui/rules/adapting.md`).

Đường dẫn file tính từ `app/src/components/`. `blocks/`, `examples/`: bản gốc để tham chiếu,
không import. `reui/`, `ui/`: import trực tiếp, không sửa.
`previewUrl` là trang xem trước do MCP trả về (`get_block`/`get_example`/`get_component`). Trang
tài liệu (`docsUrl`) có dạng `https://reui.io/blocks/<nhóm>/<loại>/<tên>` (block) hoặc
`https://reui.io/components/<loại>/<tên>` (example). Ô trống là chỗ không có trang ReUI riêng.

## Một loại UI, một cách làm

| Loại UI | Dùng | Không dùng |
|---|---|---|
| Ô KPI | `page/stat-tiles.tsx` (`StatTiles`, bậc qua `page/tiers.ts`) | card KPI tự ghép, `c-card-15` mới |
| Bảng | `insight/insight-grid.tsx` (`InsightGrid`: Frame + data-grid, nhãn `DATA_GRID_VI`) | `<table>`, data-grid dựng lại từ đầu |
| Ô KPI / bảng — cổng Ops, trang theo block Solutions | Ngoại lệ có tên (Mạnh duyệt B1, 2026-10-23): **KPI và lưới theo block** — ô số, lưới, tab trạng thái là của chính block Solutions đã chuyển thể (`ops/overview/`, `ops/collections/`, `ops/sources/`). Trang Ops không có block khớp (`/ops/quality`, registry) vẫn dùng `StatTiles` / `InsightGrid` | thay ô/lưới của block bằng `StatTiles`/`InsightGrid`, lưới tự dựng ngoài bản chuyển thể |
| Xác nhận phá huỷ | `ops/sources/confirm-delete.tsx` (`AlertDialog` theo `c-alert-dialog-5`) | `window.confirm`, Dialog thường |
| Bật/tắt trong hàng | `ui/switch` `size="sm"` + `aria-label` (mẫu `c-switch-4`) | toggle tự vẽ bằng `span`, Button đổi chữ |
| Bảng so sánh thuộc tính (cột = đối tượng) | `compare/comparison.tsx` (comparison-1; `<table>` là của block gốc → ngoại lệ có lý do, không chuyển data-grid) | data-grid cho bảng so sánh, bảng so sánh tự dựng |
| Page header | `page/page-header.tsx` (`PageHeader`, slot `actions`) | `h1` + `p` tự viết |
| Đang tải | `states/page-skeleton.tsx` (hoặc Skeleton theo đúng bố cục vùng) đặt trong `<Suspense>` | `loading.tsx` cấp segment (mất mã 404/307), spinner cả trang |
| Lỗi | `states/page-error.tsx` (c-alert-1 + Thử lại) cho cả trang — trong `error.tsx` của mỗi nhóm cổng (truyền `retry`, không `reset`); `states/region-error.tsx` (`catchError` của `next/error`, cùng Alert) bọc MỘT vùng dữ liệu để PageHeader vẫn đứng; `states/app-crash.tsx` trong `app/global-error.tsx` khi layout hỏng (tự có `<html>`, CSS, ThemeProvider) | chữ đỏ tự tô, error boundary class tự viết |
| Trống | `ui/empty` (`Empty`: tiêu đề, 1 dòng, 1 hành động) | `<p>` canh giữa |
| Ảnh (khung) | Khung lớn `aspect-[3/2]` — ảnh ngang `object-cover`; ảnh dọc/vuông (rộng/cao < 1,2) `object-contain` trên nền `bg-muted` ở ảnh chính, `object-cover` ở thẻ nhỏ để lưới đều (`photoFit` trong `listing/listing-gallery.tsx`). Ô nhỏ/thumbnail `aspect-square` + `object-cover`. Xem phóng to: `object-contain`, không khung. Ảnh chết → bỏ ảnh (lùi ảnh kế / bố cục không ảnh), không ô vỡ. Căn cứ: đo 25/10 trên 469 ảnh tự thu — ngang 65% (3:2 là 42%), dọc 33%; 3:2 cắt TB 4% ảnh ngang. Áp dần ở hàng của từng trang (Mạnh 25/10): đã áp gallery listing và thẻ Duyệt listing; Đã lưu, So sánh, thẻ deal Ops còn khung cũ | Chiều cao cố định (`h-28`, `h-36`) cho ảnh; `aspect-[4/3]` mới; ảnh dọc phủ kín khung ngang ở ảnh chính |
| Màu chuỗi biểu đồ | `charts/palette.ts` (`themeOf`, `swatchOf`; luật ở `data-color.md`) | màu block gốc chép vào từng biểu đồ, `--chart-1..5`, hex |
| Phần chung của biểu đồ | `components/charts/` (menu "Thao tác khác", nút chuyển kỳ, hàng tooltip, chấm màu, tải CSV/sao chép, icon) | chép `use-trigger-tooltip`/`icons`/`value-faces` của block vào thư mục biểu đồ |

## ReUI Blocks (installed 2026-10-17)

| Block | File | Dùng cho | Ghi chú | previewUrl |
|-------|------|----------|---------|------------|
| `@reui/c-chart-16` | examples/c-chart-16.tsx | Timeseries revenue/ADR/occupancy | Area + glowing dots | https://reui.io/preview/base/components/c-chart-16 |
| `@reui/c-chart-2` | examples/c-chart-2.tsx | Bar so sánh city/room-type | Multi-dataset | https://reui.io/preview/base/components/c-chart-2 |
| `@reui/c-chart-19` | examples/c-chart-19.tsx | Donut phân bổ revenue | Center total | https://reui.io/preview/base/components/c-chart-19 |
| `@reui/c-card-15` | examples/c-card-15.tsx | KPI card + trend | Có overflow menu | https://reui.io/preview/base/components/c-card-15 |
| `@reui/c-data-grid-11` | examples/c-data-grid-11.tsx | Bảng phường sortable | + reui/data-grid/* engine | https://reui.io/preview/base/components/c-data-grid-11 |
| `@reui/app-shell-30` | blocks/app-shell-30/ (bản gốc, tham chiếu) → **components/shell/** (bản dùng) | Shell mọi cổng: top bar, nav, ⌘K, account | Cài 2026-10-18 (P0). Nav khai báo ở `shell/nav.tsx` | https://reui.io/preview/base/app-shell-30 |
| `@reui/c-command-5` | examples/c-command-5.tsx → shell/search-command.tsx | ⌘K tìm tỉnh/phường | cmdk, tìm không dấu qua `keywords` | https://reui.io/preview/base/components/c-command-5 |
| `@reui/c-alert-1` | examples/c-alert-1.tsx → states/page-error.tsx | Trạng thái lỗi + Thử lại | `error.tsx` | https://reui.io/preview/base/components/c-alert-1 |
| `@reui/c-empty-3` | examples/c-empty-3.tsx → states/not-found-state.tsx | 404 | `not-found.tsx` | https://reui.io/preview/base/components/c-empty-3 |
| `@reui/c-empty-11` | examples/c-empty-11.tsx → saved/saved-empty.tsx | Đã lưu trống | Chữ tiếng Việt, nút sang `/vn`, thêm `border` cho khớp các vùng trống khác | https://reui.io/preview/base/components/c-empty-11 |
| `@reui/stats-1` | blocks/stats-1/ → insight/insight-stats.tsx | KPI Insight | Bỏ menu "…"; badge = vị trí so với phường anh em (p30/p60/p90) thay cho % tháng trước | https://reui.io/preview/base/stats-1 |
| `@reui/chart-6` | blocks/chart-6/ → insight/performance/ | Hiệu suất theo tháng (4 ô chuyển 1 đường) | Theo THÁNG, dữ liệu qua props, bỏ lớp "kỳ trước" (lịch tương lai), mốc = Tết/30-4/Hè/2-9; màu từ `charts/palette.ts`, phần chép trùng dùng chung `components/charts/` (B3) | https://reui.io/preview/base/chart-6 |
| `@reui/chart-13` | blocks/chart-13/ → insight/revenue-mix/ | Cơ cấu doanh thu theo loại phòng | Một cửa sổ (bỏ đổi kỳ); cột "thay đổi" → số listing; màu từ `charts/palette.ts`, phần chép trùng dùng chung `components/charts/` (B3) | https://reui.io/preview/base/chart-13 |
| `@reui/frame`, `@reui/icon-tile`, `breadcrumb`, `sonner` | reui/, ui/ | Khung panel, breadcrumb, toast | `Toaster` gắn trong providers.tsx | https://reui.io/components/frame · https://reui.io/components/icon-tile |
| `@reui/data-grid-base-2` | blocks/data-grid-base-2/ → finder/finder-cells.tsx | Finder: thanh chỉ số (ScoreCell) + sparkline lịch đặt | Thanh tô theo bậc p30/p60/p90 (cùng màu bản đồ); sparkline một màu trung tính vì lịch tương lai luôn thưa dần | https://reui.io/preview/base/data-grid-base-2 |
| `@reui/form-5` | blocks/form-5/ → listing/booking-heatmap.tsx | Lịch đặt 365 đêm của listing | Lấy riêng activity heatmap: cột = tuần (T2→CN), 3 trạng thái thay 4 mức cường độ; tooltip từng đêm; nút mở tooltip là nút của `TooltipTrigger` (không truyền phần tử button tay), nhãn thứ `text-xs` (bản gốc 9px); lịch trống do trang vẽ `listing/listing-calendar-empty.tsx` (Empty + Xem lịch trên Airbnb) | https://reui.io/preview/base/form-5 |
| `@reui/product-detail-5` | (không giữ bản gốc trong blocks/: bản gốc kéo `ui/carousel.tsx` đỏ lint react-hooks và embla, mà trang chỉ cần gallery + cột thông tin) → listing/listing-gallery.tsx · listing/listing-hero.tsx | Đầu trang chi tiết listing: ảnh tự thu + Đặc điểm | Gallery: thumbnail là `Radio` của Base UI trong `Item` (bản gốc tự dựng nút role=radio), ảnh chính 3:2 theo quy định khung ảnh (ảnh dọc hiện trọn trên nền), thumbnail 1:1 trên MỘT hàng trượt ngang, ảnh chết rời gallery, hết ảnh thì cha bỏ cột ảnh. Cột phải: bỏ giá/biến thể/giỏ (số ở hàng KPI ngay dưới), giữ khuôn «Specs» thành bảng Đặc điểm + một nút «Mở trên Airbnb» | https://reui.io/preview/base/product-detail-5 |
| `@reui/product-grid-2` | blocks/product-grid-2/ → listing/listing-card.tsx | Thẻ listing ở trang Duyệt listing | Panel ảnh = ảnh tự thu (`photo_urls`, ≤ 3, bản `?im_w=480`) khung 3:2 `object-cover` thay khung vuông; ảnh chết lùi ảnh kế, hết ảnh thì không panel; swatch/giá → badge loại phòng + 3 chỉ số | https://reui.io/preview/base/product-grid-2 |
| `@reui/filters` | reui/filters/ (component, import trực tiếp) → listing/listings-filter-bar.tsx | Thanh chip lọc Duyệt listing (≥ lg) | `variant="basic"`, bốn trường Phường · Loại phòng · Phòng ngủ · Giá/đêm (lựa chọn lấy từ dữ liệu, kèm số); nhãn khung tiếng Việt `FILTER_LABELS_VI`, điều kiện ngắn `FILTER_OPERATORS_VI`; cây `FilterQuery` biên dịch ở `listing/listing-filter-query.ts` (module thường) | https://reui.io/components/filters |
| `@reui/filter-sidebar-5` | blocks/filter-sidebar-5/ → listing/listings-filter-sheet.tsx | Ngăn Bộ lọc màn hẹp (< lg) | Mục thời trang → Loại phòng · Phòng ngủ tối thiểu · Giá/đêm (thanh trượt tới p95) · Phường (cuối); số cạnh lựa chọn đếm sống (bản gốc cố định), lựa chọn đếm 0 bị tắt; chip đang chọn là Badge + nút bỏ (bản gốc nút tròn tự dựng); chọn là nháp, «Xem N listing» ghi cây lọc chung với thanh chip | https://reui.io/preview/base/filter-sidebar-5 |
| `@mapcn/map` | components/ui/map.tsx (vendor, nguyên văn) | Nền bản đồ mapcn: `Map`, `MapControls`, `MapPopup`, `useMap` | Không sửa tay; eslint tắt riêng `react-hooks/refs` + `set-state-in-effect` cho tệp này; CSS popup chỉ dưới `[data-mapcn]` (globals.css); nền qua prop `styles` = `lib/map-style.ts` (không Carto) | https://mapcn.dev/docs/installation |
| `@mapcn/store-locator` | (không giữ bản gốc — khuôn tham chiếu) → listing/listings-map.tsx | Bản đồ Duyệt listing | Khuôn LocatorMap: `Map` + `MapControls` + `MapPopup` (tên, badge, giá, công suất, «Xem listing»); bỏ Sidebar và `MapMarker` DOM (tới 300 listing, gom cụm) — danh sách là lưới thẻ; cụm + nhãn giá ở `ListingLayers` (không `MapClusterLayer`: font Open Sans không có trên glyph OpenFreeMap) | https://mapcn.dev/blocks/store-locator |
| `@reui/form-11` | blocks/form-11/ → yield/yield-form.tsx | Form ước tính lợi suất + dải tóm tắt trực tiếp | Đặt trong Frame (trang họ Frame); `noValidate` vì bước ±0,1 tỷ chỉ là bước của nút | https://reui.io/preview/base/form-11 |
| `@reui/chart-36` | blocks/chart-36/ → yield/pnl/ | Doanh thu vs chi phí 12 tháng + biên lợi nhuận | Dữ liệu qua props, mốc = biên để ngang thuê dài hạn (ẩn khi > 100%), làn biên tối thiểu 20 điểm %, bước trục theo bậc độ lớn; màu từ `charts/palette.ts`, phần chép trùng dùng chung `components/charts/` (B3) | https://reui.io/preview/base/chart-36 |
| `@reui/number-field` | reui/number-field.tsx | Ô nhập số (PN, m², giá, chi phí) | `id` của NumberField là id của ô nhập | https://reui.io/components/number-field |
| `@reui/auth-4` | blocks/auth-4/ → auth/login-form.tsx | Đăng nhập | Bỏ đăng nhập mạng xã hội + "Quên mật khẩu" (chưa có); nối server action; nền noise ở (auth)/layout | https://reui.io/preview/base/auth-4 |
| `@reui/auth-5` | blocks/auth-5/ → auth/register-form.tsx | Đăng ký | Bỏ dải logo khách hàng (không có thật); hero viết cho nhà đầu tư, số đếm thật | https://reui.io/preview/base/auth-5 |
| `@reui/wishlist-2` | blocks/wishlist-2/ → saved/ | Đã lưu | Tín hiệu giá → loại khu vực; ảnh → panel số RevPAR; ✕ = bỏ lưu thật; "Add all" → So sánh | https://reui.io/preview/base/wishlist-2 |
| `@reui/comparison-1` | blocks/comparison-1/ → compare/ | So sánh tối đa 4 khu vực | Cột trên URL; ô tốt nhất mỗi hàng tô xanh; thêm cột bằng hộp c-command-5. Hằng số ở compare-types.ts (module thường) | https://reui.io/preview/base/comparison-1 |
| `@reui/navbar-12` | blocks/navbar-12/ → marketing/marketing-navbar.tsx | Thanh điều hướng trang chủ/Phương pháp | Thêm ⌘K + tài khoản + menu ☰ cho màn hẹp (bản gốc không có) | https://reui.io/preview/base/navbar-12 |
| `@reui/hero-8` | blocks/hero-8/ → marketing/hero.tsx | Hero trang chủ | Ô email → ô tìm khu vực; "console" giả → bản xem trước số thật; nền vẽ (`frame-backdrop.tsx`) dùng biến palette `var(--color-blue-…/sky-500)` qua `style`, không hex | https://reui.io/preview/base/hero-8 |
| `@reui/card-29` | blocks/card-29/ → marketing/market-cards.tsx | Thị trường đang theo dõi | Dải diện tích vẽ từ doanh thu theo tháng thật (bản gốc là hình cố định); thang chàm có cặp `dark:` (doanh thu = chàm); 0 thị trường → `Empty` | https://reui.io/preview/base/card-29 |
| `@reui/how-it-works-1` | blocks/how-it-works-1/ → marketing/how-it-works.tsx | 3 bước dùng sản phẩm | Card → Frame (trang chủ họ Frame) | https://reui.io/preview/base/how-it-works-1 |
| `@reui/faq-6` | blocks/faq-6/ → marketing/faq-section.tsx | Hỏi đáp trang chủ (accordion) | Dữ liệu qua props | https://reui.io/preview/base/faq-6 |
| `@reui/faq-3` | blocks/faq-3/ → marketing/definition-grid.tsx + hàng hai nút ở (marketing)/methodology/page.tsx | Định nghĩa trang Phương pháp, mở sẵn | Tiêu đề mục là h2 có id (mục lục); mỗi ô mang id riêng (đích của ⓘ); câu trả lời nhận ReactNode; hàng hỗ trợ → Xem thị trường / Ước tính lợi suất (không có bàn hỗ trợ) | https://reui.io/preview/base/faq-3 |
| `@reui/data-grid-advanced-7` | (không giữ bản gốc trong blocks/ — bản gốc không qua tsc với data-grid đang cài) → yield/financing/financing-grid.tsx + financing-cells.tsx, mô hình lib/financing.ts | Dòng tiền vốn vay ở /yield | Chỉ đọc: tham số vay sửa ở form-11 (URL, chia sẻ được); không thêm/sửa/xoá dòng, không chọn ô; mục Doanh thu · Chi phí vận hành · Thu nhập ròng · Trả nợ vay (lãi/gốc) · Dòng tiền sau nợ · So với thuê dài hạn; cột Hằng tháng + Năm 1…5; dòng tổng ghim = lợi nhuận / tiền mặt bỏ ra | https://reui.io/preview/base/data-grid-advanced-7 |

## Cổng Ops — block Solutions (B1, cài 2026-10-23)

Bản gốc ở `blocks/<tên>/` (chỉ tham chiếu). Bản chuyển thể: comment đầu tệp ghi `chuyển thể từ @reui/<tên>`.
Ma trận trang → block máy kiểm: `scripts/ui-standards/b1-block-map.json`.

| Block | File | Dùng cho | Đã đổi so với bản gốc | previewUrl |
|-------|------|----------|------------------------|------------|
| `@reui/app-shell-36` | blocks/app-shell-36/ → **shell/ops-shell/** | Shell riêng của cổng Ops: thanh bên nhóm (Giám sát · Xử lý · Quản trị · Hệ thống), thanh icon ở máy tính bảng, ngăn kéo ở điện thoại, lọc ⌘F | Nav đọc từ `shell/nav.tsx` (mục `group`); workspace switcher → bộ chuyển cổng Vận hành ↔ Đầu tư; thẻ tài khoản chỉ giữ giao diện + đăng xuất; bỏ ghim trang, khung xương mẫu, breadcrumb ở header (breadcrumb ở PageHeader); meta `text-xs` | https://reui.io/preview/base/app-shell-36 |
| `@reui/solution-dev-ops-5` | blocks/solution-dev-ops-5/ → ops/overview/ | `/ops`: ô KPI ba dải + lưới mục tiêu độ tươi có tab trạng thái | Bỏ biểu đồ đốt ngân sách, kẹo mút mini trong ô, sheet SLO, chọn hàng/thao tác hàng loạt (chưa có chuỗi độ tươi theo ngày; trang chỉ đọc) | https://reui.io/preview/base/solution-dev-ops-5 |
| `@reui/solution-dev-ops-6` | blocks/solution-dev-ops-6/ → ops/collections/ (thẻ số, luồng, cần chú ý, `status-grid`) + ops/sources/ (`source-groups`, `new-group-sheet`) | Sức khoẻ nguồn, luồng 7 ngày, việc cần chú ý; nhóm thu theo nguồn | Trục luồng theo NGÀY (không theo giờ), hai chế độ Listing / Tin Zalo; thẻ số không chip so hôm qua, chân thẻ là liên kết neo; cần chú ý không nút sửa tại chỗ; sheet tạo rút gọn còn nguồn · URL/mã · tên; bỏ preview mẫu, xoay khoá, export | https://reui.io/preview/base/solution-dev-ops-6 |
| `@reui/solution-dev-ops-1` | blocks/solution-dev-ops-1/ → ops/collections/jobs-grid.tsx | Lưới job launchd có tab sức khoẻ | Bỏ công tắc bật/tắt job, cột 20 lần chạy, lần chạy kế, bộ sửa cron (không sửa launchd từ web) | https://reui.io/preview/base/solution-dev-ops-1 |
| `@reui/solution-ai-ops-2` | blocks/solution-ai-ops-2/ → ops/sources/ (`zalo-accounts`, `zalo-account-row`, `zalo-qr-dialog`) | Tài khoản Zalo: hàng kết nối + hộp kết nối QR | Connect key → Đăng nhập QR (ảnh QR / Skeleton); bỏ ưu tiên/định tuyến, công tắc tạm dừng, ô widget mẫu, bóng đổ tự tô của logo | https://reui.io/preview/base/solution-ai-ops-2 |
| `@reui/solution-agents-5` | (chờ) → ops/review/ | `/ops/review`: hàng chờ duyệt + sheet chi tiết | Làm sau khi `feat/enrich-qua-de-xuat` vào main | https://reui.io/preview/base/solution-agents-5 |
| `@reui/c-attachment-3` | ops/review-photos.tsx (`ui/attachment` + shadcn `Dialog`; file ví dụ không giữ trong `examples/`) | Dải ảnh tin trên thẻ `/ops/review` (Tin A/Tin B, tin bổ sung) + hộp phóng to có trước/sau | Bỏ tên tệp/kích thước; ô ảnh hỏng → `state="error"` + `ImageOff`; ảnh ngoài `referrerPolicy="no-referrer"`; chỉ có dữ liệu khi admin (`loadReviewMedia`) | https://reui.io/preview/base/components/c-attachment-3 |
| `@reui/c-alert-dialog-5` | ops/sources/confirm-delete.tsx | Xác nhận xoá nhóm thu / gỡ tài khoản Zalo | Chữ tiếng Việt, câu hậu quả nêu số bài sẽ xoá | https://reui.io/preview/base/components/c-alert-dialog-5 |

## Custom Components (created — LAST RESORT only)

| Component | File | Why not ReUI? | previewUrl |
|-----------|------|---------------|------------|
| MiniMap | components/mini-map.tsx | ReUI không có MapLibre blocks. Nền xám nhạt (lib/map-style.ts), phường đang xem tô đậm | |
| ChoroplethMap | components/finder/choropleth-map.tsx | MapLibre thuần (chỉ vẽ + popup + bấm); bộ chọn chỉ số và chú giải là ReUI bên ngoài. Màu bậc chung ở finder/bins.ts. Nền xám nhạt, lớp màu chèn DƯỚI lớp nhãn của nền | |
| PageHeader / StatTiles | components/page/ | Không phải component mới: page-header của app-shell-30 và stats-1 gom lại để Insight, Listing, Duyệt listing dùng chung (`actions` slot; `tierOf` ở page/tiers.ts để trang server gọi được) | https://reui.io/preview/base/app-shell-30 · https://reui.io/preview/base/stats-1 |
| ListingsMap / ListingLayers | components/listing/listings-map.tsx | Chuyển thể @mapcn/store-locator trên `Map` của @mapcn/map (dòng trên). `ListingLayers` (lớp tự viết qua `useMap()`): nhãn giá kiểu Airbnb vẽ bằng lớp symbol (ảnh viên thuốc co giãn), gom cụm tới zoom 11, nhãn đè nhau tự ẩn còn chấm; báo khung nhìn chỉ khi người dùng di chuyển (thao tác trong khung ≤ 1 giây trước, originalEvent, bấm cụm, nút ±), canh khung của máy mang cờ chặn | https://mapcn.dev/blocks/store-locator |
| InsightGrid | components/insight/insight-grid.tsx | Không phải component mới: Frame + DataGrid theo đúng mẫu c-data-grid-11, gom lại để 6 bảng dùng chung nhãn tiếng Việt (`DATA_GRID_VI`) | https://reui.io/preview/base/components/c-data-grid-11 |
| InsightNav | components/insight/insight-nav.tsx | Style view track của app-shell-30; tự theo dõi cuộn vì `@reui/scrollspy` với target document bám vào `scroll-area-viewport` đầu tiên trong trang (vùng cuộn DataGrid) và luôn báo nhầm mục cuối | https://reui.io/preview/base/app-shell-30 |
| SiteFooter | components/shell/site-footer.tsx | ReUI không có block footer | |
| charts/* | components/charts/ | Không phải component mới: phần ba block chart-6/13/36 chép trùng nhau (overflow-menu, segmented-toggle, tooltip-row, faces, halo-text, actions, icons, use-trigger-tooltip) gom lại ở B3, cộng `palette.ts` | https://reui.io/preview/base/chart-6 |
| AreaThumbnail | components/page/area-thumbnail.tsx + `getAreaThumbnails` (lib/queries.ts) | Ảnh đại diện khu vực (So sánh, Đã lưu): ảnh chính của một listing tự thu, ≤ 3 ứng viên không trùng giữa các khu vực cùng trang, lỗi thì lùi ứng viên kế, hết thì cha hiện ô số; `<img>` chỉ gắn sau hydrate (lỗi ảnh lúc hydrate bị mất). Khung cha giữ kích thước + nền muted; trên ảnh dùng Badge nền đặc | |
| RegionError | components/states/region-error.tsx | `catchError(fallback)` của Next 16 quanh một vùng (thường bọc `<Suspense>`): Alert destructive + Thử lại gọi `retry()` (tải lại vùng từ server); không bắt nhầm redirect()/notFound() | https://reui.io/preview/base/components/c-alert-1 |
| ListingKpis / ListingComps | components/listing/listing-sections.tsx | Không phải component mới: StatTiles và CompsTable tách thành hai vùng tải riêng của trang listing (truy vấn peers, comps), mỗi vùng có skeleton đúng bố cục (`ListingKpisSkeleton`, `ListingCompsSkeleton`) và comps trống là `Empty` + Duyệt listing ở thị trường | https://reui.io/preview/base/stats-1 |
| PageSkeleton | components/states/page-skeleton.tsx | Ghép từ `ui/skeleton` theo bố cục Insight; dùng trong `<Suspense>`, KHÔNG làm `loading.tsx` cấp segment (mất mã 404/307) | |

## Bản đồ nền (mọi bản đồ MapLibre)

- **Nguồn đích (chốt 2026-10-23): `mapcn`** (`@mapcn/map`, `@mapcn/choropleth`, `@mapcn/store-locator`, clusters) — ReUI không có bản đồ; thứ tự ReUI → mapcn (chỉ cho bản đồ) → tự ghép. Bản đồ Duyệt listing đã sang mapcn (I3, `listing/listings-map.tsx`, registry `@mapcn` khai trong `components.json`); ChoroplethMap (I1) và MiniMap (I2) còn MapLibre tay. Các luật nền bên dưới áp dụng cho cả bản mapcn.

- Dùng `lib/map-style.ts`: `basemapUrl("colored" | "muted", dark)` + `MAP_OPTIONS` + `addAttribution` + `prepareBasemap`. Nguồn OpenFreeMap (OSM, không khoá, không giới hạn lượt).
- `colored` (Liberty) cho bản đồ cần định vị (nhãn giá listing); `muted` (Positron) cho bản đồ mà màu là dữ liệu (choropleth). Chế độ tối dùng `dark` cho cả hai.
- Lớp dữ liệu dạng vùng chèn trước id mà `prepareBasemap` trả về, để tên đường nằm trên. Marker/nhãn thì thêm sau cùng.
- Dựng lớp riêng trong `map.on("style.load")`, đổi sáng/tối bằng `setStyle(url, { diff: false })` — không dựng lại bản đồ, giữ khung nhìn.
- Màu trong MapLibre phải là hex; màu "chưa có số" đổi theo sáng/tối (`NO_DATA_COLOR` / `NO_DATA_COLOR_DARK`).
- Popup: bản mapcn dùng `MapPopup` (nội dung React); bản MapLibre tay dùng `setDOMContent` + `textContent`. Không `setHTML` với tên lấy từ DB.
- Bắt buộc `setWorkerUrl` (`lib/map-worker.ts`), không thì bản đồ trắng.
