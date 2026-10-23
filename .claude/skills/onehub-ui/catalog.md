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
| Bảng so sánh thuộc tính (cột = đối tượng) | `compare/comparison.tsx` (comparison-1; `<table>` là của block gốc → ngoại lệ có lý do, không chuyển data-grid) | data-grid cho bảng so sánh, bảng so sánh tự dựng |
| Page header | `page/page-header.tsx` (`PageHeader`, slot `actions`) | `h1` + `p` tự viết |
| Đang tải | `states/page-skeleton.tsx` (hoặc Skeleton theo đúng bố cục vùng) đặt trong `<Suspense>` | `loading.tsx` cấp segment (mất mã 404/307), spinner cả trang |
| Lỗi | `states/page-error.tsx` (c-alert-1 + Thử lại) | chữ đỏ tự tô |
| Trống | `ui/empty` (`Empty`: tiêu đề, 1 dòng, 1 hành động) | `<p>` canh giữa |

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
| `@reui/stats-1` | blocks/stats-1/ → insight/insight-stats.tsx | KPI Insight | Bỏ menu "…"; badge = vị trí so với phường anh em (p30/p60/p90) thay cho % tháng trước | https://reui.io/preview/base/stats-1 |
| `@reui/chart-6` | blocks/chart-6/ → insight/performance/ | Hiệu suất theo tháng (4 ô chuyển 1 đường) | Theo THÁNG, dữ liệu qua props, bỏ lớp "kỳ trước" (lịch tương lai), mốc = Tết/30-4/Hè/2-9 | https://reui.io/preview/base/chart-6 |
| `@reui/chart-13` | blocks/chart-13/ → insight/revenue-mix/ | Cơ cấu doanh thu theo loại phòng | Một cửa sổ (bỏ đổi kỳ); cột "thay đổi" → số listing | https://reui.io/preview/base/chart-13 |
| `@reui/frame`, `@reui/icon-tile`, `breadcrumb`, `sonner` | reui/, ui/ | Khung panel, breadcrumb, toast | `Toaster` gắn trong providers.tsx | https://reui.io/components/frame · https://reui.io/components/icon-tile |
| `@reui/data-grid-base-2` | blocks/data-grid-base-2/ → finder/finder-cells.tsx | Finder: thanh chỉ số (ScoreCell) + sparkline lịch đặt | Thanh tô theo bậc p30/p60/p90 (cùng màu bản đồ); sparkline một màu trung tính vì lịch tương lai luôn thưa dần | https://reui.io/preview/base/data-grid-base-2 |
| `@reui/form-5` | blocks/form-5/ → listing/booking-heatmap.tsx | Lịch đặt 365 đêm của listing | Lấy riêng activity heatmap: cột = tuần (T2→CN), 3 trạng thái thay 4 mức cường độ; tooltip từng đêm | https://reui.io/preview/base/form-5 |
| `@reui/product-grid-2` | blocks/product-grid-2/ → listing/listing-card.tsx | Thẻ listing ở trang Duyệt listing | Bỏ panel ảnh (chưa thu ảnh, không dùng ảnh giả); swatch/giá → badge loại phòng + 3 chỉ số | https://reui.io/preview/base/product-grid-2 |
| `@reui/form-11` | blocks/form-11/ → yield/yield-form.tsx | Form ước tính lợi suất + dải tóm tắt trực tiếp | Đặt trong Frame (trang họ Frame); `noValidate` vì bước ±0,1 tỷ chỉ là bước của nút | https://reui.io/preview/base/form-11 |
| `@reui/chart-36` | blocks/chart-36/ → yield/pnl/ | Doanh thu vs chi phí 12 tháng + biên lợi nhuận | Dữ liệu qua props, mốc = biên để ngang thuê dài hạn (ẩn khi > 100%), làn biên tối thiểu 20 điểm %, bước trục theo bậc độ lớn | https://reui.io/preview/base/chart-36 |
| `@reui/number-field` | reui/number-field.tsx | Ô nhập số (PN, m², giá, chi phí) | `id` của NumberField là id của ô nhập | https://reui.io/components/number-field |
| `@reui/auth-4` | blocks/auth-4/ → auth/login-form.tsx | Đăng nhập | Bỏ đăng nhập mạng xã hội + "Quên mật khẩu" (chưa có); nối server action; nền noise ở (auth)/layout | https://reui.io/preview/base/auth-4 |
| `@reui/auth-5` | blocks/auth-5/ → auth/register-form.tsx | Đăng ký | Bỏ dải logo khách hàng (không có thật); hero viết cho nhà đầu tư, số đếm thật | https://reui.io/preview/base/auth-5 |
| `@reui/wishlist-2` | blocks/wishlist-2/ → saved/ | Đã lưu | Tín hiệu giá → loại khu vực; ảnh → panel số RevPAR; ✕ = bỏ lưu thật; "Add all" → So sánh | https://reui.io/preview/base/wishlist-2 |
| `@reui/comparison-1` | blocks/comparison-1/ → compare/ | So sánh tối đa 4 khu vực | Cột trên URL; ô tốt nhất mỗi hàng tô xanh; thêm cột bằng hộp c-command-5. Hằng số ở compare-types.ts (module thường) | https://reui.io/preview/base/comparison-1 |
| `@reui/navbar-12` | blocks/navbar-12/ → marketing/marketing-navbar.tsx | Thanh điều hướng trang chủ/Phương pháp | Thêm ⌘K + tài khoản + menu ☰ cho màn hẹp (bản gốc không có) | https://reui.io/preview/base/navbar-12 |
| `@reui/hero-8` | blocks/hero-8/ → marketing/hero.tsx | Hero trang chủ | Ô email → ô tìm khu vực; "console" giả → bản xem trước số thật | https://reui.io/preview/base/hero-8 |
| `@reui/card-29` | blocks/card-29/ → marketing/market-cards.tsx | Thị trường đang theo dõi | Dải diện tích vẽ từ doanh thu theo tháng thật (bản gốc là hình cố định) | https://reui.io/preview/base/card-29 |
| `@reui/how-it-works-1` | blocks/how-it-works-1/ → marketing/how-it-works.tsx | 3 bước dùng sản phẩm | Card → Frame (trang chủ họ Frame) | https://reui.io/preview/base/how-it-works-1 |
| `@reui/faq-6` | blocks/faq-6/ → marketing/faq-section.tsx | Hỏi đáp trang chủ + định nghĩa trang Phương pháp | Dữ liệu qua props | https://reui.io/preview/base/faq-6 |

## Custom Components (created — LAST RESORT only)

| Component | File | Why not ReUI? | previewUrl |
|-----------|------|---------------|------------|
| MiniMap | components/mini-map.tsx | ReUI không có MapLibre blocks. Nền xám nhạt (lib/map-style.ts), phường đang xem tô đậm | |
| ChoroplethMap | components/finder/choropleth-map.tsx | MapLibre thuần (chỉ vẽ + popup + bấm); bộ chọn chỉ số và chú giải là ReUI bên ngoài. Màu bậc chung ở finder/bins.ts. Nền xám nhạt, lớp màu chèn DƯỚI lớp nhãn của nền | |
| PageHeader / StatTiles | components/page/ | Không phải component mới: page-header của app-shell-30 và stats-1 gom lại để Insight, Listing, Duyệt listing dùng chung (`actions` slot; `tierOf` ở page/tiers.ts để trang server gọi được) | https://reui.io/preview/base/app-shell-30 · https://reui.io/preview/base/stats-1 |
| ListingsMap | components/listing/listings-map.tsx | MapLibre, nền có màu; nhãn giá kiểu Airbnb vẽ bằng lớp symbol (ảnh viên thuốc co giãn), gom cụm tới zoom 11, nhãn đè nhau tự ẩn còn chấm; chỉ lọc danh sách theo khung nhìn khi có cử chỉ thật (dragstart/zoomstart có originalEvent, hoặc bấm cụm) | |
| InsightGrid | components/insight/insight-grid.tsx | Không phải component mới: Frame + DataGrid theo đúng mẫu c-data-grid-11, gom lại để 6 bảng dùng chung nhãn tiếng Việt (`DATA_GRID_VI`) | https://reui.io/preview/base/components/c-data-grid-11 |
| InsightNav | components/insight/insight-nav.tsx | Style view track của app-shell-30; tự theo dõi cuộn vì `@reui/scrollspy` với target document bám vào `scroll-area-viewport` đầu tiên trong trang (vùng cuộn DataGrid) và luôn báo nhầm mục cuối | https://reui.io/preview/base/app-shell-30 |
| SiteFooter | components/shell/site-footer.tsx | ReUI không có block footer | |
| PageSkeleton | components/states/page-skeleton.tsx | Ghép từ `ui/skeleton` theo bố cục Insight; dùng trong `<Suspense>`, KHÔNG làm `loading.tsx` cấp segment (mất mã 404/307) | |

## Bản đồ nền (mọi bản đồ MapLibre)

- **Nguồn đích (chốt 2026-10-23): `mapcn`** (`@mapcn/map`, `@mapcn/choropleth`, `@mapcn/store-locator`, clusters) — ReUI không có bản đồ; thứ tự ReUI → mapcn (chỉ cho bản đồ) → tự ghép. Ba component tự viết dưới đây đổi sang mapcn ở đợt I1/I2/I3; các luật nền bên dưới vẫn áp dụng cho bản mapcn.

- Dùng `lib/map-style.ts`: `basemapUrl("colored" | "muted", dark)` + `MAP_OPTIONS` + `addAttribution` + `prepareBasemap`. Nguồn OpenFreeMap (OSM, không khoá, không giới hạn lượt).
- `colored` (Liberty) cho bản đồ cần định vị (nhãn giá listing); `muted` (Positron) cho bản đồ mà màu là dữ liệu (choropleth). Chế độ tối dùng `dark` cho cả hai.
- Lớp dữ liệu dạng vùng chèn trước id mà `prepareBasemap` trả về, để tên đường nằm trên. Marker/nhãn thì thêm sau cùng.
- Dựng lớp riêng trong `map.on("style.load")`, đổi sáng/tối bằng `setStyle(url, { diff: false })` — không dựng lại bản đồ, giữ khung nhìn.
- Màu trong MapLibre phải là hex; màu "chưa có số" đổi theo sáng/tối (`NO_DATA_COLOR` / `NO_DATA_COLOR_DARK`).
- Popup: `setDOMContent` + `textContent`, không `setHTML` với tên lấy từ DB.
- Bắt buộc `setWorkerUrl` (`lib/map-worker.ts`), không thì bản đồ trắng.
