# Bản đồ route → bề mặt → archetype → họ khung → block đích

Mỗi `page.tsx` dưới `app/src/app` đúng một dòng. Thêm, xoá hay dời trang thì sửa bảng
này **cùng commit**: `app/eslint-plugin-onehub-ui/tests/routes-map.test.mjs` đối chiếu
cột 2 với cây thư mục và đỏ khi lệch, và đỏ khi một dòng thiếu/sai cột Block đích hoặc Slug đích (chạy trong
`npm run test:lint-rules` và CI `ui-lint`).

- Bề mặt và archetype: tên nguyên văn từ `.claude/skills/reui/rules/compose.md`.
- Họ khung là **đích**. Nếu khác hiện trạng, cột Ghi chú nói rõ, kèm đợt dọn nó.
- **Block đích**: block ReUI (tên registry trong backtick) mà trang được dựng từ đó khi dọn xong —
  đã chốt với Mạnh. Viết `chờ (…)` khi chưa chọn, `—` chỉ cho route không có UI (redirect).
  Phần không có block (bản đồ MapLibre, view track…) ghi sau dấu `+` kèm tên component tự viết.
  Cổng Invest chốt 2026-10-23 (hồ sơ `_acceptance/invest-target-map/`, bảng có hình
  `ban-quyet-dinh.html`); cổng Ops theo bảng 2b của B1 (`_acceptance/ui-clean-b1-ops/`).
- **Slug đích** (chốt 2026-10-23, Mạnh: «url tôi đề xuất tiếng anh toàn bộ»): mọi đoạn URL tiếng
  Anh, chữ UI tiếng Việt; slug địa lý (`hanoi`, `vn-hanoi-…`) và mã quốc gia (`/vn`) giữ nguyên.
  `giữ` = đã là tiếng Anh. Đổi slug (file route + 301 trong `next.config.ts`) làm trong đợt dọn của
  nhóm trang đó, không làm riêng. Thuật ngữ (nhãn VN ↔ tên code ↔ slug) chốt ở `CONTEXT.md`.
- **Bản đồ** (chốt 2026-10-23): ReUI không có bản đồ → nguồn là `mapcn` (registry `@mapcn`,
  MapLibre ^6 nguyên bản), cài ở đợt của nhóm trang: Finder `@mapcn/choropleth`, Duyệt listing
  `@mapcn/store-locator` + clusters, Insight map cơ bản + lớp GeoJSON. Giữ `lib/map-style.ts`
  (OpenFreeMap sáng/tối, lớp dưới nhãn) và `setWorkerUrl` (`lib/map-worker.ts`). Thứ tự: ReUI →
  mapcn (chỉ cho bản đồ) → tự ghép.
- "khung trang: PageHeader" = `components/page/page-header.tsx` (breadcrumb, tiêu đề 1–3 chữ,
  mô tả 1 mệnh đề, actions bên phải). Bắt buộc cho mọi trang operational ở cả hai cổng.
- Cổng: `/ops/**` là Ops (bắt buộc đăng nhập), còn lại là Invest. Xem `docs/architecture/portals.md`.

## Shell theo cổng

| Cổng | Shell | Ghi chú |
|---|---|---|
| Invest app (`(app)/**`) | `app-shell-30` (giữ, chốt 2026-10-23) | Top nav 4 mục phẳng, bản đồ cần trọn bề ngang, view track khớp mục lục Insight. Dự phòng `app-shell-28` khi > 6 module |
| Invest marketing (`(marketing)/**`) | `navbar-12` + `SiteFooter` | ReUI không có block footer |
| Invest auth (`(auth)/**`) | không shell | auth-4 / auth-5 toàn màn hình |
| Ops (`ops/**`) | `app-shell-36` (B1) | Sidebar nhóm cho 7 trang quản trị |

## Bảng route

| Route | File (từ `app/src/app`) | Slug đích | Bề mặt | Archetype | Họ khung | Block đích | Ghi chú |
|---|---|---|---|---|---|---|---|
| `/` | `(marketing)/page.tsx` | giữ | marketing | Marketing spine | Frame | `navbar-12` · `hero-8` · `card-29` · `how-it-works-1` · `faq-6` (giữ) | Không PageHeader: navbar-12 + hero-8 là đầu trang. Frame vì hero-8, card-29, faq-6 gốc dùng Frame (how-it-works-1 đã đổi Card → Frame). Nền hero và dải diện tích card-29 dùng biến palette/cặp `dark:`, không hex (I6 xong, hồ sơ `trang-chu-methodology`); thẻ thị trường trống có `Empty`. Lỗi trang: `(marketing)/error.tsx` (navbar + chân trang vẫn đứng); layout hỏng: `global-error.tsx` |
| `/methodology` | `(marketing)/methodology/page.tsx` | giữ | marketing | Marketing spine | Frame | `faq-3` (thay `faq-6`) | Không PageHeader. Badge eyebrow + tiêu đề + mục lục + ba lưới định nghĩa mở sẵn (`marketing/definition-grid.tsx`, không accordion; mỗi ô có id để ⓘ trỏ thẳng, vd `#revpar`) + hàng hai nút của faq-3. `/phuong-phap` → 301 trong `next.config.ts` (I6 xong, hồ sơ `trang-chu-methodology`) |
| `/login` | `(auth)/login/page.tsx` | giữ | flow | Auth card | Frame | `auth-4` (giữ) | Không PageHeader. auth-4 gốc là Frame, giữ nguyên. `?mode=register` chuyển sang `/register`. Đợt I6 |
| `/register` | `(auth)/register/page.tsx` | giữ | flow | Auth card | Frame | `auth-5` (giữ) | Không PageHeader. auth-5 (hero + form chia đôi), gốc là Frame. Đợt I6 |
| `/[country]` | `(app)/[country]/page.tsx` | giữ | operational | Dashboard grid | Frame | `solution-analytics-1` (lưới + đầu Frame; bỏ panel sức khoẻ/xu hướng) + `@mapcn/choropleth` (thay `ChoroplethMap`) | khung trang: PageHeader (chưa có, I1). Cấp chưa tự thu dùng `empty-state-5` "đang thu thập". Đợt I1 |
| `/[country]/[market]` | `(app)/[country]/[market]/page.tsx` | giữ | operational | Record detail | Frame | `solution-analytics-8` (khung + hàng KPI + phân rã + timeline nguồn cung) · `chart-6` · `chart-13` + `InsightGrid` · map cơ bản `@mapcn/map` (thay `MiniMap`) · `InsightNav` | khung trang: PageHeader (đã có, qua `InsightPage`). Hàng KPI của block thay `stats-1` (ngoại lệ có tên). Đợt I2 |
| `/[country]/[market]/[submarket]` | `(app)/[country]/[market]/[submarket]/page.tsx` | giữ | operational | Record detail | Frame | `solution-analytics-8` (cùng template thị trường; phân rã = benchmark p30/p60/p90 với phường anh em) + map cơ bản `@mapcn/map` (thay `MiniMap`) | khung trang: PageHeader (đã có, qua `InsightPage`). Đợt I2 |
| `/[country]/[market]/listings` | `(app)/[country]/[market]/listings/page.tsx` | giữ | operational | Table-backed management | Frame | `product-grid-2` (giữ, bật panel ảnh tự thu) + component `filters` · `filter-sidebar-5` (màn hẹp) + `@mapcn/store-locator` + clusters (thay `ListingsMap`) | khung trang: PageHeader (đã có). Thẻ thay cho data-grid. Đợt I3 xong (hồ sơ `listings-filters-store-locator`): một cây lọc `FilterQuery` cho thanh chip `listing/listings-filter-bar.tsx` (≥ lg) và ngăn `listing/listings-filter-sheet.tsx` (< lg); bản đồ `listing/listings-map.tsx` trên `@mapcn/map` (`ui/map.tsx`) theo khuôn store-locator — cụm + nhãn giá ở `ListingLayers`, popup «Xem listing», lọc lưới theo khung nhìn khi người dùng di chuyển; thẻ `listing/listing-card.tsx` có ảnh 3:2; vùng `listing/listings-region.tsx` trong RegionError > Suspense, bản đồ có RegionError riêng |
| `/[country]/[market]/map` | `(app)/[country]/[market]/map/page.tsx` | giữ | redirect | — | — | — | Chỉ `redirect()` sang `/[country]?level=submarket&market=…&view=map` (giữ link cũ). Không có UI |
| `/listing/[id]` | `(app)/listing/[id]/page.tsx` | giữ | operational | Record detail | Frame | `product-detail-5` (đầu trang: ảnh tự thu + hộp thông tin) · `StatTiles` · `form-5` (heatmap) + `CompsTable` | khung trang: PageHeader (đã có). Đầu trang product-detail-5 xong (hồ sơ `listing-detail-product-detail-5`): gallery `listing/listing-gallery.tsx` + hộp Đặc điểm `listing/listing-hero.tsx`; không ảnh tự thu (hoặc mọi ảnh chết trên CDN) thì ẩn gallery, hộp trải ngang; ảnh AirDNA không lên Invest (luật 5). Thân trang `listing/listing-body.tsx`: KPI và Listing tương tự tải trong Suspense (`listing/listing-sections.tsx`), lỗi tại chỗ (`states/region-error.tsx`); lịch trống và comps trống là `Empty` có hành động. Đợt I3 xong cả trang Duyệt listing |
| `/yield` | `(app)/yield/page.tsx` | giữ | operational | Dashboard grid | Frame | `form-11` (giữ) · `data-grid-advanced-7` (chi phí vận hành + dòng tiền vốn vay, `yield/financing/`) · `StatTiles` · `chart-36` + `CompsTable` | khung trang: PageHeader (đã có). Luôn có badge "DỮ LIỆU MÔ PHỎNG". Nhận phần của `/dau-tu` (I4 xong, hồ sơ `yield-dong-tien-von-vay`): mục «Dòng tiền vốn vay» `#financing`, tham số `eq`/`rate`/`term`; `/<country>/<market>/dau-tu` → 301 `/yield?area=<market>#financing` trong `next.config.ts` |
| `/compare` | `(app)/compare/page.tsx` | giữ | operational | Table-backed management | Frame | `comparison-1` (giữ) + `c-command-5` | khung trang: PageHeader (I5 xong, hồ sơ `compare-saved-trang-thai`); `/so-sanh` → 301 trong `next.config.ts`. Bảng là comparison-1, không phải data-grid; `<table>` của block gốc mang ngoại lệ tại chỗ `no-raw-table`. Ô đầu cột là ảnh đại diện (`page/area-thumbnail.tsx`). Bảng tải trong Suspense (`compare/compare-skeleton.tsx`), lỗi tại chỗ (`states/region-error.tsx`) |
| `/saved` | `(app)/saved/page.tsx` | giữ | operational | Frame stack | Frame | `wishlist-2` (giữ) + `c-empty-11` | khung trang: PageHeader (I5 xong, hồ sơ `compare-saved-trang-thai`). Tabs theo loại + thẻ khu vực (panel ảnh = ảnh đại diện, chưa có ảnh thì panel số); trống dùng `c-empty-11` (`saved/saved-empty.tsx`). Thẻ tải trong Suspense (`saved/saved-skeleton.tsx`), lỗi tại chỗ |
| `/ops` | `ops/page.tsx` | giữ | operational | Dashboard grid | Frame | `solution-dev-ops-5` (đã áp, B1) | dense. Shell Ops (`shell/ops-shell/`, app-shell-36). khung trang: PageHeader. Ô KPI ba dải + lưới mục tiêu độ tươi có tab trạng thái (`ops/overview/`). Trên máy chủ: số từ bản tin máy thu (`FactsStamp`/`FactsStaleAlert`, `ops/facts-status.tsx`), ô «—» khi chưa có số (ON3) |
| `/ops/collections` | `ops/collections/page.tsx` | giữ | operational | Dashboard grid | Frame | `solution-dev-ops-6` + lưới job của `solution-dev-ops-1` (đã áp, B1) | dense. Shell Ops. khung trang: PageHeader. Thẻ số, luồng 7 ngày (màu qua `palette.ts`, khoá `ops*`) + cần chú ý, lưới nguồn/lockdown (`ops/collections/`). Trên máy chủ: chỉ hàng ô số, lưới nguồn, lưới tác vụ (khi có bản tin); vùng còn lại gom về một Alert; lưới khoá an toàn đọc khối `lockdown`, chưa có số thì 8/8 «Chỉ kiểm ở máy thu» (ON23); bảng nhóm S03 đọc khối `s03` khi có (ON4) |
| `/ops/data-flow` | `ops/data-flow/page.tsx` | giữ | operational | Dashboard grid | Frame | `chart-49` (Sankey đường ống) + `solution-analytics-3` (chặng theo ngày, loại giao dịch, lưới chất lượng) + `@reui/filters` | dense. Shell Ops (nhóm Giám sát). khung trang: PageHeader + nút khoảng (7 ngày · 30 ngày · Toàn kho, `?window=`). Vùng: đường ống → chặng theo ngày + loại giao dịch → chất lượng từng chặng (nguồn/nhóm thu) → tin mới nhất + Sheet hồ sơ tin (`components/ops/data-flow/`). Chỉ máy thu: trên máy chủ LocalOnlyAlert |
| `/ops/ai-calls` | `ops/ai-calls/page.tsx` | giữ | operational | Table-backed management | Frame | `solution-analytics-3` (Frame + data-grid, khuôn lưới của «Tin mới nhất») | dense. Shell Ops (nhóm Giám sát). khung trang: PageHeader với ba số 30 ngày (cuộc · token · chi phí). Vùng: dòng trạng thái số (máy chủ: FactsStamp/LocalOnlyAlert) → lưới ngày × việc × model (`components/ops/ai-calls/`). Trên máy chủ: khối `aiCalls` của bản tin (PL29) |
| `/ops/quality` | `ops/quality/page.tsx` | giữ | operational | Table-backed management | Frame | không block Solutions: `StatTiles` + `InsightGrid` (đã áp, B1) | dense. Shell Ops. khung trang: PageHeader đầu trang. Bảng DQ + 3 bảng AirDNA. Số AirDNA chỉ được hiện ở trang này |
| `/ops/deals` | `ops/deals/page.tsx` | giữ | operational | Table-backed management | Frame | chờ (B5; ứng viên nhóm data-grid/base) | dense. Dời từ `/deals` (PR #3, chỉ sau đăng nhập; có SĐT người bán — Tầng A, không lên cổng công khai). khung trang: PageHeader (chưa có). Dọn UI ở B1/B5 |
| `/ops/review` | `ops/review/page.tsx` | giữ | operational | Table-backed management | Frame | `solution-agents-5` (UI1 đã dựng khung) | dense. Shell Ops (nav nhóm Xử lý). UI1 (26/10): Frame «Danh sách thẻ» + data-grid lọc theo loại thẻ + trạng thái (mặc định Chờ duyệt), bấm hàng mở Sheet chi tiết (`components/ops/review/`: `review-queue.tsx`, `review-detail-sheet.tsx`) giữ nội dung thẻ cũ (`review-card.tsx`) + dải ảnh tin `c-attachment-3` NẰM TRONG sheet; không hiện độ tự tin (Q9). Lọc theo bậc căn cứ + thẻ duyệt v2 (phát biểu theo bậc, E1↔AI mọi cặp) là PL23; trả lại hàng loạt (không duyệt hàng loạt) là UI12. Trên cloud: chỉ số thẻ chờ theo loại + mốc đo (ON3) |
| `/ops/sources` | `ops/sources/page.tsx` | giữ | operational | Frame stack | Frame | `solution-ai-ops-2` + lưới kết nối `solution-dev-ops-6` + `InsightGrid` (registry) (đã áp, B1) | dense. Shell Ops. khung trang: PageHeader. Chỉ admin. Tên tầng A đánh dấu `data-tier-a`, không chép vào aria-label (`ops/sources/`) |
| `/ops/design` | `ops/design/page.tsx` | giữ | operational | Frame stack | Frame | không block (trang trưng bày): `PageHeader` + Frame (đã áp, B1) | dense. Shell Ops. khung trang: PageHeader. Mẫu sống từng loại UI + bảng mẫu Solutions (`ops/design/`) |

## Đợt dọn cổng Invest theo nhóm trang

Mỗi đợt làm trọn khung (shell giữ, PageHeader) + KPI + biểu đồ (bảng màu chung của B3,
`components/charts/palette.ts`) + trạng thái tải/trống/lỗi cho nhóm trang của nó. Thay cho cách cắt
B2 (khung & KPI) / B4 (trạng thái) / B5 (phần còn lại) theo loại component — các phần đó của Invest
đi vào đợt của nhóm trang. Trong trang theo block Solutions, ô KPI và lưới là của chính block
(ngoại lệ có tên của luật "một loại UI, một cách làm", như G4 của B1).

| Đợt | Trang | Block kéo theo biểu đồ |
|---|---|---|
| I1 Finder | `/[country]` | sparkline của `solution-analytics-1`; bản đồ `@mapcn/choropleth` |
| I2 Insight | `/[country]/[market]`, `/[country]/[market]/[submarket]` | `chart-6`, `chart-13` (giữ, B3) |
| I3 Listing | `/listing/[id]`, `/[country]/[market]/listings` | không có biểu đồ chuỗi (heatmap lịch `form-5` giữ nguyên, tô theo trạng thái đêm) |
| I4 Lợi suất | `/yield` (gồm `/dau-tu` cũ) | `chart-36` (giữ, B3) |
| I5 So sánh + Đã lưu | `/compare`, `/saved` | không |
| I6 Trang chủ / Phương pháp / Auth | `/`, `/methodology`, `/login`, `/register` | dải diện tích của `card-29` |
