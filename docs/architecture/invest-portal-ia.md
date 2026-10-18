# Invest Portal — Kiến trúc thông tin (IA), Shell & bản đồ block ReUI

> Ngày: 2026-10-18 · Trạng thái: **đề xuất** (chờ duyệt) · Cổng: Invest (theo
> `portals.md`). Quy trình: Phân tích → Đánh giá → Hoàn thiện → Đề xuất.
>
> Nguồn chứng cứ:
> - `docs/research/airdna-app-ia.md` — app AirDNA quan sát qua ảnh chụp chính thức của Help Center và trang công khai (chưa đăng nhập)
> - `docs/research/airdna-public-ia.md` — sản phẩm, gói giá, đường dẫn từ trang công khai vào app; 63 bài help center
> - `docs/research/airdna-market-explorer-architecture.md`, `market-finder-spec.md`, `market-insights-spec.md` — REA/DevTools trên phiên thật, đã có từ trước
> - `docs/research/reui-inventory.md` — đã so 35 app-shell, mọi tên block đều xác minh có thật
> - Kiểm kê UI hiện tại của `app/`: tóm tắt ở Mục 6

---

## 1. Học được gì từ AirDNA (chưng cất)

| # | Pattern AirDNA | Bằng chứng | One Invest làm gì |
|---|---|---|---|
| L1 | **Phân cấp địa lý là xương sống**: Country → Market → Submarket → Listing; breadcrumb có ▾ để chuyển sang submarket khác ngay tại chỗ | OBS-SHOT | Giữ `vn → tỉnh/thành → phường/xã → listing`. Breadcrumb có ô chọn phường |
| L2 | **Một ô tìm kiếm toàn cục** cho market, submarket và địa chỉ | OBS-SHOT | Phím ⌘K + ô tìm trên thanh trên cùng: tỉnh, phường, listing (sau này thêm địa chỉ cho Yield) |
| L3 | **Một thanh bộ lọc dùng chung** cho mọi trang Research, lọc lại cả trang, lưu được bộ lọc theo tên | OBS-SHOT + DOC | Chừa chỗ ngay từ shell. Pha đầu chỉ có lọc theo số phòng ngủ và loại phòng, vì chỉ hai trường này có dữ liệu thật |
| L4 | **List \| Map tỉ lệ 60/40**, map luôn hiện, zoom map thì list lọc theo | OBS-SHOT | Finder và Listing explorer dùng bố cục chia đôi. Mobile chuyển qua lại List/Map |
| L5 | **Một bộ chọn metric điều khiển cả màu map, legend lẫn sort** | DOC | Đã có trong `finder-map`, giữ lại. Legend 4 bậc theo phân vị p30/p60/p90 |
| L6 | **Trang market là một trang dài**; 8 tab chỉ là neo cuộn tới từng phần | DOC | Tránh URL tab đụng với `[submarket]`. Tab = `#anchor` + scrollspy |
| L7 | **Score kèm 5 điểm thành phần giải thích được**, chỉ so trong cùng quốc gia | OBS-SHOT | "Điểm One Invest" của riêng mình (xem R1). Cố định một thang điểm duy nhất, vì AirDNA tự mâu thuẫn giữa 40–100 và 0–100 |
| L8 | **Ô KPI**: số lớn + % so với năm trước + ⓘ định nghĩa + chú thích "12 tháng gần nhất" | OBS-SHOT | `stats-1` + tooltip lấy từ trang Phương pháp |
| L9 | **Ước tính đi kèm độ tin cậy** (Comp Set Strength: Thấp/TB/Cao) | OBS-SHOT | Bắt buộc với dữ liệu VN còn mỏng: mọi ước tính hiện độ tin cậy và cỡ mẫu |
| L10 | **Tóm tắt một câu bằng lời thường** trên đầu mỗi khối | OBS-SHOT | Câu tóm tắt sinh theo luật (chưa cần LLM) |
| L11 | **SEO teaser → deep link** (`?cta=`); nội dung công khai chỉ hé lộ score | O | Trang `/vn/**` công khai, đọc được, SEO tốt, slug không dấu. Đây là lợi thế so với ID mờ của AirDNA |
| L12 | **Lưu và Chia sẻ** ở góc phải mỗi trang; mục Đã lưu nằm trong menu avatar | OBS-SHOT | Đã lưu có trang riêng + lối tắt trong menu avatar |
| L13 | **Khoá theo gói**: cắt từng trường dữ liệu hoặc trả 401 cả endpoint → chart mẫu + nút Upgrade | REA đã có | Envelope có `redactions[]` + khối "teaser khoá" (`empty-state-5`) |

**Không học theo:**
- **URL bằng ID mờ.** Giữ slug.
- **Thang điểm không nhất quán.**
- **"Doanh thu TB" chỉ tính trên listing có booking.** Phải ghi rõ mẫu số.
- **Map khó dùng trên điện thoại.** Mobile mặc định mở List, Map là tab phụ.
- **Tên gói giá đổi liên tục.**

**Xu hướng shell của AirDNA:** đã chuyển từ *top nav* (thiết kế cũ) sang *icon rail + menu phụ*
khi có thêm các module Pricing, Performance và Comps. Rail cùng menu phụ chiếm khoảng 13% chiều ngang.

---

## 2. Rủi ro phát hiện khi đối chiếu

| # | Vấn đề | Căn cứ | Đề xuất |
|---|---|---|---|
| **R1** | `/vn` đang **hiển thị công khai Market Score của AirDNA**, và trang market có khối "Đối chiếu AirDNA" | CLAUDE.md: *"Don't scrape AirDNA data into the product (calibration reference only per ToS)"* | Dời toàn bộ số liệu AirDNA sang **`/ops/quality`**, nơi đội vận hành dùng để hiệu chuẩn. Finder xếp hạng bằng metric của mình (RevPAR, doanh thu, công suất), sau này bằng **Điểm One Invest** |
| R2 | `globals.css` thiếu token nền của shadcn (`--card`, `--primary`, `--muted`, `--chart-*`, `--radius`, `--sidebar-*`) | kiểm kê | Mọi block ReUI sẽ hiện sai màu. Phải sửa **trước** khi cài block |
| R3 | `body { font-family: Arial }` ghi đè Geist; `lang="en"` trong khi nội dung là tiếng Việt | `globals.css:45`, `layout.tsx` | Sửa ở P0 |
| R4 | Không có `loading` / `error` / `not-found`; không có ThemeProvider (shell ReUI gọi `useTheme`) | kiểm kê | P0 |
| R5 | Toàn bộ nền ReUI (`components/ui`, `reui`, `examples`, `/design`) **chưa commit** | git status | Commit trước khi refactor (luật "chưa commit là chưa tồn tại") |
| R6 | `yield-card` hardcode `/vn/hanoi/…`; `airdna-compare` hardcode VND; `finder-map` còn `console.log` | kiểm kê | Tự hết khi thay bằng block |

---

## 3. IA đề xuất — Sitemap

```
INVEST PORTAL  (công khai, đọc là chính)
│
├─ /                         Trang chủ                       [shell: marketing]
├─ /phuong-phap              Phương pháp & thuật ngữ         [shell: marketing]  ← MỚI (L8, L11)
│
├─ /vn                       Tìm thị trường (Finder)         [shell: app]
│    ?view=list|map  ?level=market|submarket  ?metric=revpar  ?sort=…
│
├─ /vn/[market]              Insight thị trường              [shell: app]
│    #tong-quan #doanh-thu #cong-suat #gia-phong #nguon-cung
│    #mua-vu #phuong #listing #loi-suat
│  ├─ /vn/[market]/[submarket]   Insight phường/xã (cùng template, có thêm benchmark anh em)
│  ├─ /vn/[market]/listings      Listing explorer (lưới thẻ | map nhãn giá)   ← MỚI (L4)
│  └─ /vn/[market]/map           → redirect /vn?market=…&view=map (giữ link cũ)
│
├─ /listing/[id]             Chi tiết listing
├─ /yield                    Ước tính lợi suất ("Rentalizer" VN)   (G1 → G4)
│    bước nhập → /yield/[reportId] (báo cáo lưu được, chia sẻ được)
├─ /so-sanh?areas=a,b,c      So sánh 2–4 khu vực   ← MỚI; AirDNA không có màn riêng → điểm khác biệt
├─ /saved                    Đã lưu: tab Thị trường | Phường | Listing | Báo cáo yield
├─ /login, /register         Đăng nhập / Đăng ký
└─ /th/**                    Legacy Bangkok — cùng shell, chuyển qua bộ chọn quốc gia
```

**Từ khoá dành riêng** cho segment `[submarket]`: `listings`, `map`, `so-sanh`.
`resolveSubmarketId` phải từ chối các slug này. Tên phường tiếng Việt sau khi bỏ dấu không trùng các từ này.

### 3.1 Điều hướng toàn cục (shell app)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ◆ One Invest   Thị trường  Listing  Lợi suất  So sánh   [⌘K Tìm tỉnh, phường…]  🇻🇳 VND  (avatar)│
├───────────────────────────────────────────────────────────────────────────────┤
│ VN › Hà Nội ▾ › Tây Hồ ▾      [badge 239 listing] [badge 62 phường]   ⤴ Chia sẻ  ♡ Lưu │ ← page header
│ [Phòng ngủ ▾] [Loại phòng ▾] [Phân khúc giá ▾]* [Tất cả bộ lọc]  · 12 tháng gần nhất │ ← filter bar (*pha sau)
│ Tổng quan · Doanh thu · Công suất · Giá phòng · Nguồn cung · Mùa vụ · Phường · Listing · Lợi suất │ ← view track (anchor)
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Mục chính (4):** Thị trường (Finder + Insight) · Listing · Lợi suất · So sánh. Mục **Đã lưu** nằm trong menu avatar, giống AirDNA L12.
- **Bộ chọn quốc gia + tiền tệ:** VN/TH, VND/USD (`currencyFor` hiện đã có logic).
- **Footer:** Phương pháp · Giới thiệu · liên kết "Nội bộ" sang `/ops` (theo luật 4 của `portals.md`).

### 3.2 Template từng trang

| Trang | Vùng, trên → dưới | Ghi chú dữ liệu |
|---|---|---|
| **Trang chủ** | Thanh nav marketing → Hero + ô tìm thị trường → thẻ thị trường nổi bật → 3 bước (Tìm → Phân tích → Ước tính lợi suất) → gói (để sau) → FAQ → footer | Thẻ nổi bật lấy từ `market_metrics` của chính mình |
| **Finder `/vn`** | Header (VN ▾, số thị trường) → filter bar → **chia đôi**: trái = công tắc Thị trường\|Phường + sort + data grid xếp hạng (cột điểm có thanh tiến độ và sparkline); phải = choropleth + bộ chọn metric + legend 4 bậc. Tick nhiều dòng → khay So sánh | Hiện mới có Hà Nội tự thu ở cấp phường. Cấp tỉnh cần G2/G3. Trong lúc đó cấp tỉnh hiện **"Đang thu thập"** với trạng thái trống có chủ đích, không mượn số của AirDNA (R1) |
| **Insight thị trường** | Page header (breadcrumb ▾, badge, Lưu/Chia sẻ) → filter bar → view track → **Tổng quan**: thẻ điểm (radial + điểm thành phần) ‖ 4 KPI (Doanh thu năm, Listing hoạt động, ADR, Công suất) → câu tóm tắt → map phường + panel Top phường → **các phần** Doanh thu / Công suất / Giá phòng (chart timeseries có bộ chuyển metric), Nguồn cung (supply history), Mùa vụ (bar + line theo tháng), Phường (grid sort được), Listing (grid), Lợi suất (bảng yield, badge "DỮ LIỆU MÔ PHỎNG") | Đủ dữ liệu: `getMetrics`, `getKpis`, `getAreaBreakdown`, `getTopSubmarkets`, `getSupplyHistory`, `getYieldRows`. Chưa có % so với năm trước (cần tính từ `getMetrics` khi đủ 24 tháng; trước đó ẩn badge) |
| **Insight phường** | Cùng template. Thêm **thanh benchmark với các phường anh em** (p30/p60/p90) ngay dưới KPI. Phần "Phường" đổi thành "Phường lân cận" | `getSiblingBenchmark` |
| **Listing explorer** | Header → filter bar → chia đôi: lưới thẻ (ảnh, số PN, ADR, công suất, doanh thu ước tính) ‖ map dạng **nhãn giá**. Click thẻ → `/listing/[id]` | Cần query mới: danh sách listing theo khu vực kèm toạ độ |
| **Listing detail** | Breadcrumb → tiêu đề + thông số → 4 KPI → **lịch công suất 12 tháng** (heatmap) → biểu đồ giá → listing tương đồng trong cùng phường | `getListingDetail`. Chưa có ảnh: ẩn gallery, không làm giả |
| **Lợi suất** | Form (phường ▾, số PN, diện tích, giá mua) kèm **dải tóm tắt cập nhật trực tiếp** → báo cáo: KPI (yield STR, yield thuê dài hạn, doanh thu/tháng, công suất) + **độ tin cậy (cỡ mẫu)** + chart doanh thu theo tháng so với chi phí + bảng chi phí (sửa được) + bảng listing so sánh | `getYieldRows` (mô phỏng G1) + metrics. Badge MÔ PHỎNG bắt buộc |
| **So sánh** | Bảng so sánh: nhãn hàng dính đầu, cột xoá được; các nhóm Hiệu suất / Nguồn cung / Lợi suất | Tái dùng `getKpis` cho từng khu vực |
| **Đã lưu** | Tab theo loại → lưới thẻ, kèm badge tín hiệu ("RevPAR ↑") | `getSavedAreas` (mở rộng thêm listing và báo cáo sau) |

### 3.3 Trạng thái chuẩn (mọi vùng dữ liệu đều phải có)

| Trạng thái | Block | Dùng khi |
|---|---|---|
| Đang tải | `c-skeleton-6` (hàng KPI), `c-skeleton-5` (bảng), `c-skeleton-2` (chart) | `loading.tsx` theo segment |
| Trống, không có kết quả | `empty-state-2` (chip gợi ý) | bộ lọc ra 0 kết quả |
| Trống, chưa lưu gì | `c-empty-11` | `/saved` |
| **Chưa có dữ liệu / đang thu thập** | `empty-state-5` biến thể "đang thu thập" | tỉnh chưa tự thu |
| Khoá (sau này) | `empty-state-5` + `pricing-7` | khi bật gói Pro (`users.plan` đã có) |
| Lỗi | `c-alert-1` (destructive + Thử lại) | `error.tsx` |
| Mô phỏng / ước tính | Badge `warning-light` "MÔ PHỎNG", badge độ tin cậy | yield G1, ước tính |

---

## 4. Shell — quyết định

| Phương án | Ưu | Nhược | Kết luận |
|---|---|---|---|
| **`app-shell-30`** — top nav, page header có badge, 8 tab, mobile thu gọn thành dropdown | Map và chart chiếm trọn chiều ngang. Cảm giác là sản phẩm công khai chứ không phải trang admin. View track khớp đúng các phần của Insight | Chưa có ⌘K (phải ghép `c-command-5`). Nếu sau này có trên 6 module thì top nav chật | ✅ **Chọn** |
| `app-shell-28` — tab section + rail, có ⌘K | Gần với hướng AirDNA đang đi (rail + menu phụ) | Rail ăn mất bề ngang mà map đang cần. Với 4 module thì thừa | Dự phòng khi có trên 6 module |
| `app-shell-26` | Mật độ cao kiểu SOC | Quá dày cho nhà đầu tư | → **Ops Portal** (giữ nguyên quyết định cũ) |

Lý do chọn top nav, dù AirDNA đang đi theo hướng rail: AirDNA có 5 module chính
(Research, Pricing, Performance, Comps, Enterprise) phục vụ cả host lẫn nhà đầu tư.
One Invest chỉ có 4 mục, đều thuộc nhóm Research. Cấu hình nav viết thành **một mảng
khai báo** (`nav.config.ts`), nên đổi shell sau này không đụng tới IA.

**Shell marketing** (`/`, `/phuong-phap`): `navbar-12` + footer tự ghép từ Separator, cột link và nút link (ReUI không có block footer).

**Bề mặt:** trang app dùng **Frame** (`stats-*`, `chart-*`, `data-grid-*` của Pro đều là Frame). Các `c-chart-*` miễn phí đã cài là Card thì chuyển phần thân vào `FramePanel`. Không lồng Card trong Frame.

---

## 5. Bản đồ block ReUI theo trang

| Vùng | Block chính | Dự phòng | Thay cho (đang viết tay) |
|---|---|---|---|
| Shell app | `app-shell-30` | `app-shell-28` | *(chưa có shell)* |
| ⌘K / tìm khu vực | `c-command-5` + `c-autocomplete-9` | `c-command-8` | — |
| Menu avatar | (có sẵn trong shell) | `navbar-3` | `auth-bar.tsx` |
| Page header Insight | `navbar-6` (breadcrumb, Chia sẻ, So sánh) | header của `solution-analytics-8` | header inline trong `area-page.tsx` |
| Filter bar | `filters` (`c-filters-1`) + `cascader` + `c-slider-6` | `filter-sidebar-5` (mobile) | — |
| KPI | `stats-1` | `chart-2`, `c-card-15` | `kpi-strip.tsx`, KPI inline ở `/listing` |
| Timeseries có bộ chuyển metric | `chart-6` | `c-chart-16` | `metric-chart.tsx` (lưới 2×2) |
| Doanh thu so với kỳ trước | `chart-22` | `c-chart-13` | — |
| Mùa vụ / P&L lợi suất | `chart-36` | `data-grid-grouping-3` (heatmap) | — |
| Cơ cấu (loại phòng) | `chart-13` | `c-chart-19` | `breakdown-chart.tsx` (share) |
| Bar theo số PN | `c-chart-2` | `chart-9` | `breakdown-chart.tsx` (ADR) |
| Điểm thị trường | `c-chart-25` (radial) | `chart-8` | score box trong `airdna-compare` → **dời sang Ops** |
| Benchmark anh em | `stats-1` + `@reui/badge` light | Progress | `benchmark-bar.tsx` |
| Nguồn cung | `c-chart-14` | `chart-17` | chip inline trong `area-page` |
| Bảng xếp hạng Finder | `data-grid-base-2` | `data-grid-advanced-1` | bảng thô ở `/vn` |
| Top phường / listing / yield | `c-data-grid-11` (đã cài) | `data-grid-base-2` | `top-submarkets`, `top-listings`, `yield-card` |
| Chia đôi List \| Map | `c-resizable-5` + `c-toggle-group-1` | grid cố định 5/7 | — |
| Map | **MapLibre** (giữ nguyên), bọc trong `FramePanel` | — | `finder-map`, `mini-map` (chỉ thay phần vỏ, pill và legend) |
| Lịch công suất | lưới heatmap lấy từ `form-5` | shadcn `calendar` + modifiers | heatmap inline ở `/listing` |
| Listing detail | `product-detail-5` (khi có ảnh) | `product-detail-1` | trang inline |
| Giá listing | `chart-4` | `c-chart-17` | — |
| Form lợi suất | `form-11` + `c-number-field-1` | `wizard-2` | — |
| So sánh | `comparison-1` | `comparison-2` | — |
| Đã lưu | `wishlist-2` | `list-9` | `<ul>` ở `/saved` |
| Đăng nhập / đăng ký | `auth-4` / `auth-5` | `auth-15` | form thô ở `/login` |
| Trang chủ | `navbar-12`, `hero-8`, `card-29`, `how-it-works-1`, `faq-6`, `cta-2` | `hero-12`, `pricing-5` | link farm ở `/` |
| Thông báo | `c-sonner-1` | — | — |
| Chia sẻ | Dialog + InputGroup + `use-copy-to-clipboard` (ReUI không có block) | `dialog-8` | — |

**Giữ tự viết (có lý do):** `finder-map`, `mini-map` (ReUI không có map),
heatmap lịch, footer, dialog chia sẻ. Mọi thứ khác **xoá** sau khi thay.

---

## 6. Hiện trạng → đích (tóm tắt kiểm kê)

- 0/9 trang production dùng shadcn hay ReUI. Toàn bộ là Tailwind viết tay, màu `neutral-*` / `blue-*` / hex.
- 13 component viết tay (~1.200 dòng). Sau migrate chỉ giữ 2 cái map; còn lại thay bằng block.
- Dữ liệu đủ cho Insight, Listing và Lợi suất (mô phỏng). **Còn thiếu:** % so với năm trước, metric cấp tỉnh tự thu, ảnh listing, danh sách listing kèm toạ độ cho explorer.

---

## 7. Lộ trình triển khai (mỗi pha build được + trang trả 200)

| Pha | Nội dung | Tiêu chí đạt |
|---|---|---|
| **P0 Nền móng** | Commit nền ReUI hiện có (R5) → token shadcn đầy đủ + dark mode + `next-themes` + font Geist + `lang="vi"` (R2–R4) → route groups `(marketing)` / `(app)` / `ops` với layout riêng → cài `app-shell-30` + ⌘K + footer → `nav.config.ts` → `loading/error/not-found` → middleware chặn `/ops/**`, dời `/design` → `/ops/design` | `/design` hiển thị đúng màu; mọi trang cũ nằm trong shell mới; `npm run build` sạch |
| **P1 Insight** | Thay `area-page` bằng template mục 3.2 (navbar-6, stats-1, chart-6, c-chart-25, chart-36, chart-13, data-grid). Dời AirDNA sang `/ops/quality` (R1). Xoá component cũ | `/vn/hanoi` và một phường hoạt động; không còn import component viết tay |
| **P2 Finder** | `/vn` dùng data-grid-base-2 + filters + chia đôi list\|map + công tắc Thị trường\|Phường + khay So sánh. Redirect `/vn/[m]/map` | Xếp hạng theo metric tự thu; không còn số AirDNA |
| **P3 Listing** | `/listing/[id]` (KPI + lịch + giá) + `/vn/[m]/listings` (lưới + map nhãn giá) | Map và list đồng bộ khi zoom |
| **P4 Lợi suất** | `/yield` form-11 → báo cáo + độ tin cậy | Ra báo cáo cho 10+ phường, badge MÔ PHỎNG |
| **P5 Còn lại** | Trang chủ marketing, `/phuong-phap`, `/so-sanh`, `/saved` (wishlist-2), auth-4/5 | Không còn trang viết tay nào |

Ops Portal (`app-shell-26`) dựng song song từ P0, chỉ gồm khung và `/ops/design`, `/ops/quality`. Các trang Ops khác làm theo lộ trình G trong `portals.md`.
