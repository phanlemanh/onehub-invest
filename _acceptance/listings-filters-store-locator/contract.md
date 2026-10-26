---
schema_version: 1
feature: Nhà đầu tư duyệt listing lọc bằng filters (màn hẹp filter-sidebar-5) và bản đồ @mapcn/store-locator gom cụm, vẫn lọc theo khung nhìn khi kéo hoặc zoom
slug: listings-filters-store-locator
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: verified
design_doc: docs/superpowers/specs/2026-10-26-listings-filters-store-locator-design.md
approved_by: Mạnh
approved_at: 2026-10-26T01:27:12Z
---

# Acceptance Contract: listings-filters-store-locator

## Context

Hàng UI6 (phủ GD4) của lộ trình giao diện 23/10, đợt I3 của `routes.md`: trang Duyệt listing
`/[country]/[market]/listings` thay hai `Select` bằng bộ lọc `@reui/filters` (màn rộng) và ngăn `filter-sidebar-5`
(màn hẹp) dùng chung một cây lọc; thay bản đồ MapLibre tay bằng `@mapcn/map` theo khuôn `@mapcn/store-locator` (gom cụm,
nhãn giá, popup), giữ lọc danh sách theo khung nhìn khi người dùng kéo/zoom; bật panel ảnh tự thu trên thẻ
`product-grid-2`; vùng dữ liệu có skeleton, trống, lỗi tại chỗ. Hàng bản đồ đầu tiên → khai registry `@mapcn`.

Căn cứ: `docs/plan/lo-trinh.json` hàng UI6 (GD4) · `.claude/skills/onehub-ui/routes.md` dòng `/[country]/[market]/listings`
(Block đích) và mục «Bản đồ» · `docs/plan/BOI-CANH.md` §4 dòng UI6/UI8/UI9 · catalog.md «Ảnh (khung)» (Mạnh 25/10) ·
ô Cổng Đáng `_acceptance/listings-filters-store-locator/opportunity.md` (Mạnh quyết build 23/10).

## Criteria

- AC-1: Given `app/components.json`, `app/src/components/ui/map.tsx`, `app/eslint.config.mjs`, `app/src/app/globals.css`,
  `app/package.json`, When đọc chúng, Then `registries` có `@mapcn` với url `https://mapcn.dev/r/{name}.json`; `ui/map.tsx`
  là bản `@mapcn/map` (xuất `Map`, `MapControls`, `MapPopup`, `useMap`); khối ngoại lệ lint chỉ áp cho đúng tệp
  `src/components/ui/map.tsx` và chỉ tắt `react-hooks/refs` + `react-hooks/set-state-in-effect`; CSS popup mapcn chỉ nằm
  dưới bộ chọn `[data-mapcn]` (popup của bản đồ MapLibre cũ giữ nguyên); phiên bản `maplibre-gl` trong `package.json`
  và bản đã khoá trong `package-lock.json` không đổi so với main; danh sách tệp được dùng hex không thêm tệp nào.
- AC-2: Given cây `FilterQuery` và một tập listing mẫu viết trước, When `compileListingFilter` lọc, Then kết quả đúng
  trọn ma trận trường × điều kiện của bốn trường đã chọn ở Hỏi-5 (Phường/Loại phòng: là, không phải; Phòng ngủ: từ, bằng,
  tới; Giá/đêm: trong khoảng, từ, tới, khoảng một đầu); điều kiện soạn dở (chưa chọn điều kiện hoặc chưa có giá trị) không lọc mất listing nào;
  listing không có số (giá/phòng ngủ null) không khớp điều kiện số; `queryFromFacets` → `facetsFromQuery` khứ hồi giữ
  nguyên facet, và điều kiện ngăn không biểu diễn được (vd «Phòng ngủ bằng 0») đi qua khứ hồi nguyên vẹn.
- AC-3: Given trang Duyệt listing Hà Nội ở 1280 px, When người dùng thêm chip «Loại phòng là Nguyên căn» rồi chip
  «Giá/đêm trong khoảng …» bằng thanh `filters`, Then lưới và bản đồ chỉ còn listing khớp cả hai, dòng tổng kết đọc
  «N listing khớp bộ lọc» với N = số đếm từ DB local cho cùng điều kiện (trong 300 listing đã tải), chip giá hiện số rút
  gọn (vd «1,5 tr ₫»), lựa chọn Phường/Loại phòng chỉ gồm giá trị có trong dữ liệu kèm số listing, mọi chữ khung của thanh
  bằng tiếng Việt, «Xoá» bỏ hết chip.
- AC-4: Given 390 px, When người dùng bấm «Bộ lọc», tích «Nguyên căn», chọn «Từ 2 phòng ngủ», kéo thanh giá rồi bấm «Xem
  N listing», Then ngăn đóng, lưới còn đúng N listing, nút «Bộ lọc» mang số 3; trước khi áp số cạnh mỗi lựa chọn đếm lại
  theo các lựa chọn khác và nút ghi đúng N; mở lại ngăn thì nháp đọc lại đúng ba lựa chọn đã áp; «Đặt lại» xoá nháp;
  chuyển 390 → 1280 px thì thanh chip hiện đúng ba điều kiện đó (một cây lọc); cây đã có điều kiện ngăn không biểu diễn
  được (vd «Loại phòng không phải Phòng riêng» dựng ở thanh chip) thì mở ngăn hiện dòng «Còn 1 điều kiện từ thanh lọc màn
  rộng…», áp từ ngăn vẫn giữ điều kiện đó trong cây, «Xoá hết» bỏ cả nó.
- AC-5: Given bản đồ của trang ở 1280 px (sáng và tối), When trang tải xong, Then bản đồ dựng bằng `Map` của
  `@mapcn/map` trên nền OpenFreeMap (không gọi basemaps Carto), thu nhỏ thấy cụm có số đếm hiện được, phóng to thấy nhãn
  giá; bấm cụm thì phóng tới mức tách cụm; bấm nhãn giá mở popup có tên listing, giá/đêm, công suất và link «Xem listing»
  tới `/listing/<id>` (trang không đổi URL khi bấm nhãn); đổi sáng/tối thay nền mà giữ khung nhìn và lớp listing; có
  đúng một nút ghi nguồn, thu gọn.
- AC-6: Given bản đồ đang hiện mọi listing khớp bộ lọc, When người dùng kéo bản đồ, lăn Ctrl/⌘ để zoom, bấm cụm, hoặc
  bấm nút phóng to, Then lưới chỉ còn listing nằm trong khung nhìn (AND với bộ lọc thuộc tính) kèm badge «Đang lọc theo
  vùng bản đồ» có nút bỏ; canh khung lúc tải, canh khung theo bộ lọc mới, resize cửa sổ, đổi sáng/tối và lăn chuột thường (không Ctrl/⌘ — trang
  cuộn, bản đồ không zoom) KHÔNG bật lọc vùng; khung không còn listing → Empty «Không có listing trong vùng này» với đúng một hành động «Bỏ lọc vùng» (bỏ lọc +
  canh lại khung); đang lọc vùng mà đổi bộ lọc thuộc tính thì giữ khung nhìn.
- AC-7: Given lưới và bản đồ cùng hiện, When rê chuột lên một thẻ, Then nhãn giá của listing đó trên bản đồ đổi sang
  kiểu đang chọn; rê lên một nhãn trên bản đồ thì thẻ tương ứng có viền chọn; bản đồ chỉ chứa listing khớp bộ lọc thuộc
  tính (số điểm trong nguồn bản đồ = số listing khớp).
- AC-8: Given listing có ảnh tự thu, When thẻ của nó hiện trong lưới, Then thẻ có panel ảnh khung 3:2 `object-cover` lấy
  ảnh đầu tiên bản `?im_w=480`; ảnh đầu chết trên CDN (kể cả lỗi trước hydrate) thì lùi ảnh kế trong tối đa 3 ảnh; chết
  hết hoặc không có ảnh thì thẻ không có panel ảnh và không ô vỡ; mọi `<img>` của thẻ thuộc `listings.photo_urls` của
  chính listing (không ảnh AirDNA — luật 5).
- AC-9: Given trang Duyệt listing, When dữ liệu đang tải / lỗi / trống, Then PageHeader đứng ngay và vùng listing là
  `RegionError > Suspense` với skeleton đúng bố cục (hàng công cụ, 4 thẻ có khối ảnh 3:2, khung bản đồ); lỗi truy vấn
  hiện Alert «Không tải được listing của thị trường» + «Thử lại» chỉ trong vùng; bản đồ lỗi hiện Alert «Không tải được
  bản đồ» trong khung bản đồ mà lưới vẫn dùng được; thị trường 0 listing hiện Empty «Đang thu thập listing ở <thị
  trường>» với đúng một hành động tới Insight thị trường; bộ lọc ra 0 hiện Empty «Không có listing khớp bộ lọc» với đúng
  một hành động «Xoá bộ lọc».
- AC-10: Given bản chạy ở :3460, When người chấm mở trang ở 1280 px sáng, 1280 px tối và 390 px (thêm một chip lọc, kéo
  bản đồ, mở ngăn Bộ lọc, bấm một nhãn giá), Then thanh chip, ngăn lọc, popup, thẻ có ảnh và bản đồ đọc được ở cả hai chế
  độ, trang không cuộn ngang ở 390 px; `npx tsc --noEmit && npm run lint` sạch, baseline suppressions không tăng; routes.md
  dòng Duyệt listing và catalog.md (dòng `@mapcn/map`, `@mapcn/store-locator`, `filter-sidebar-5`, `filters`, `product-grid-2`
  có ảnh, ListingsMap) nói nhất quán với code. (judgment)

## Coverage

- Trục A — trường × điều kiện lọc: Phường (là/không phải) | Loại phòng (là/không phải) | Phòng ngủ (từ/bằng/tới) | Giá/đêm
  (trong khoảng/từ/tới/một đầu) | soạn dở [thước CE: câu giao UI6 «lọc bằng filters» + danh mục điều kiện của
  `@reui/filters` (`filters-operators.tsx`); BỘ TRƯỜNG là câu chỉ-người Hỏi-5 — `[GIẢ ĐỊNH]` bốn trường tới khi Mạnh trả lời]
- Trục B — bề mặt lọc: thanh chip ≥ lg | ngăn < lg | chuyển khổ giữ một cây | điều kiện thanh chip ngăn không biểu diễn được [thước CE: routes.md Block đích «`filters` ·
  `filter-sidebar-5` (màn hẹp)»]
- Trục C — bản đồ: cụm | nhãn giá | popup | lọc vùng bởi người (kéo, lăn, bấm cụm, nút ±) | di chuyển của máy không lọc
  (canh đầu, canh theo bộ lọc, resize, sáng/tối, Bỏ lọc) [thước CE: câu giao «gom cụm, vẫn lọc theo khung nhìn khi kéo hoặc
  zoom» + hành vi đã ký của ListingsMap cũ (catalog.md dòng ListingsMap)]
- Trục D — trạng thái vùng: tải | có | trống bộ lọc | trống vùng | thị trường rỗng | lỗi truy vấn | lỗi bản đồ [thước CE:
  AGENTS.md › ReUI design rules 5]
- Trục E — ảnh thẻ: có | ảnh đầu chết | chết hết | không ảnh [thước CE: catalog.md «Ảnh (khung)»; đo DB local 26/10: 380/393
  listing Hà Nội có ảnh]
- Trục F — khổ × giao diện: 1280 sáng | 1280 tối | 390 sáng [thước CE: `onehub-ui/loop.md` bước 8]
- Ô Core → AC: vendor/registry → AC-1 · A → AC-2 (+AC-3) · B×rộng → AC-3 · B×hẹp + chuyển khổ → AC-4 · C×(cụm, nhãn, popup,
  sáng/tối) → AC-5 · C×lọc vùng → AC-6 · đồng bộ thẻ↔nhãn → AC-7 · E → AC-8 · D → AC-9 · F + tài liệu → AC-10.
- Later: đồng bộ bộ lọc lên URL; lọc công suất/doanh thu; tối ở 390 px không chụp riêng; WebGL lỗi chỉ dựng bằng ném lỗi
  giả trong jsdom (không có Chromium tắt GPU trong smoke).
- Never: dùng `MapClusterLayer` của mapcn (font Open Sans không có trên máy chủ glyph OpenFreeMap) — sổ quyết định.

## Đường đo

- bỏ đường-đo — ô Cổng Đáng không khai ngưỡng sống/chết (các ô «…» để trống), hàng giao diện ship thẳng; entry descope trong sổ quyết định.

## Out of scope

- Đồng bộ bộ lọc lên URL / chia sẻ link đã lọc; lưu bộ lọc.
- Lọc theo công suất, doanh thu, sức chứa; tìm theo tên listing.
- Chuyển bản đồ Finder (`@mapcn/choropleth`, đợt I1) và Insight/mini-map (`@mapcn/map`, đợt I2) sang mapcn.
- Khung ảnh 3:2 cho Đã lưu, So sánh, thẻ deal Ops (theo hàng của từng trang).
- Đổi phiên bản `maplibre-gl` hay chép lại worker trong `public/` (bản worker 6.14 lệch thư viện 6.15 có sẵn từ trước).
- Tải thêm listing ngoài 300 doanh thu cao nhất (lọc chạy trên tập đã tải).

## Notes

- Bản chạy cho bằng chứng: dev server cổng riêng **3460** của dãy U1 (`.claude/launch.json` cấu hình `app-3460`).
- Bản đồ cần WebGL: smoke chạy Chromium headless-shell (SwiftShader); khung bản đồ chờ `load` của MapLibre trước khi đo.
