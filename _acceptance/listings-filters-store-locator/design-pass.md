---
slug: listings-filters-store-locator
at: 2026-10-26T02:10:00Z
route: http://localhost:3460/vn/hanoi/listings
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (ghim — Hỏi-1..4 ghim trên thẻ Cổng Phạm vi cạnh ảnh ma trận; bản bấm được :3460 mở sẵn để Mạnh bấm thử nếu muốn)
options:
divergence: skipped — block đích đã chốt trong routes.md (filters · filter-sidebar-5 · @mapcn/store-locator · product-grid-2), khuôn master-detail hiển nhiên
ds_skill: onehub-ui
states: [mac-dinh, loc-chip, loc-vung, popup, vung-trong, ngan-loc, che-do-ban-do]
breakpoints: [mobile-390, desktop-1280]
themes: [light, dark]
patched: 6
deferred: 2
---
# design-pass — listings-filters-store-locator

Route thật trên nhánh `feat/listings-filters-store-locator`, dev server cổng 3460 của dãy U1, dữ liệu DB local
(vn-hanoi: 393 listing, tải 300 doanh thu cao nhất). Ma trận chụp bằng
`scripts/smoke-listings-browse.mjs --chup` (Chromium headless-shell, khung nhìn — không full page vì bản đồ dính).

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| mac-dinh | desktop-1280 | light | evidence/design-pass/mac-dinh--desktop-1280.png |
| mac-dinh | desktop-1280 | dark | evidence/design-pass/mac-dinh--desktop-1280--dark.png |
| loc-chip | desktop-1280 | light | evidence/design-pass/loc-chip--desktop-1280.png |
| loc-chip | desktop-1280 | dark | evidence/design-pass/loc-chip--desktop-1280--dark.png |
| popup | desktop-1280 | light | evidence/design-pass/popup--desktop-1280.png |
| loc-vung | desktop-1280 | light | evidence/design-pass/loc-vung--desktop-1280.png |
| vung-trong | desktop-1280 | light | evidence/design-pass/vung-trong--desktop-1280.png |
| mac-dinh | mobile-390 | light | evidence/design-pass/mac-dinh--mobile-390.png |
| ngan-loc | mobile-390 | light | evidence/design-pass/ngan-loc--mobile-390.png |
| che-do-ban-do | mobile-390 | light | evidence/design-pass/che-do-ban-do--mobile-390.png |

## Cảnh ngữ-cảnh

- Không cần — `host-embedded`: vật render trong shell thật của Invest (top bar app-shell-30, breadcrumb, PageHeader).

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Lệnh cài `@mapcn/map` chèn CSS popup vào `@layer base` toàn cục → thu vào `[data-mapcn]`; popup ChoroplethMap/MiniMap giữ khung cũ.
- Hai nút ghi nguồn (effect chạy lại dưới StrictMode) → chỉ gắn khi khung chưa có; một nút, thu gọn ở 390 px.
- Bản đồ lệch hydrate (server không biết sáng/tối) → cùng một khung `data-mapcn` ở hai phía, `Map` gắn sau hydrate.
- Link «Xem listing» trong popup trông như chữ thường → `Button variant="outline" size="xs"` bọc `Link`.
- Ngăn lọc: mục Phường (~40 dòng) đẩy Loại phòng/Giá xuống dưới màn → xếp Phường cuối; lựa chọn đếm 0 bị tắt (vẫn bỏ chọn được nếu đang chọn).
- Bấm điểm có nhãn và chấm chồng nhau mở popup nhầm listing (ba lớp cùng nhận click) → một bộ nghe cho cả ba lớp, lấy phần tử trên cùng.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Thẻ không ảnh (mọi ảnh chết) đứng cạnh thẻ có ảnh trong cùng hàng lưới bị kéo cao bằng thẻ kia, để khoảng trống giữa tên và chỉ số. Quy định khung ảnh cấm ô giữ chỗ; lối khác là lưới `items-start` (hàng lệch cao). Máy giữ như bản mẫu, ghi Known limits nếu Mạnh không chọn khác.
- Bản đồ nền sáng (OpenFreeMap Liberty) tải chậm ~5–10 s trên dev; loader của mapcn (ba chấm `bg-muted-foreground/60` trên nền `bg-background/50`) gần như không thấy trên khung trắng. Loader là của vendor `ui/map.tsx` — đổi thì ngoài phạm vi hàng.
