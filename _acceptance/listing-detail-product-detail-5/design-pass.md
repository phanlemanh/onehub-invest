---
slug: listing-detail-product-detail-5
at: 2026-10-25T09:45:00Z
route: http://localhost:3460/listing/<id> (mẫu từ DB local — xem Ma trận)
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (ghim — Hỏi-1..3 ghim trên thẻ Cổng Phạm vi cạnh ảnh; Mạnh phản ứng vòng 1 bằng lời: dải ảnh nhỏ một hàng trượt)
options:
divergence: skipped — block đích đã chốt trong routes.md (product-detail-5), khuôn master-detail hiển nhiên
ds_skill: onehub-ui
states: [co-anh, anh-chet-mot, anh-chet-het, khong-anh, khong-lich]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 4
deferred: 0
---
# design-pass — listing-detail-product-detail-5

Route thật trên nhánh `feat/listing-detail-product-detail-5`, dev server cổng 3460 của dãy U1. Mẫu (DB local 25/10):
có ảnh `abnb_1012024343323572487` (10 ảnh), không ảnh `abnb_1146242072149071598`, chưa có lịch
`abnb_1294641113326335559`. Ảnh chết dựng bằng chặn mạng (CDN trả 404). Ma trận chụp bằng
`scripts/smoke-listing-detail.mjs --chup` (Chromium, full page).

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| co-anh | desktop-1280 | light | evidence/design-pass/co-anh--desktop-1280.png |
| co-anh | desktop-1280 | dark | evidence/design-pass/co-anh--desktop-1280--dark.png |
| co-anh | mobile-375 | light | evidence/design-pass/co-anh--mobile-375.png |
| anh-chet-mot | desktop-1280 | light | evidence/design-pass/anh-chet-mot--desktop-1280.png |
| anh-chet-het | desktop-1280 | light | evidence/design-pass/anh-chet-het--desktop-1280.png |
| khong-anh | desktop-1280 | light | evidence/design-pass/khong-anh--desktop-1280.png |
| khong-anh | desktop-1280 | dark | evidence/design-pass/khong-anh--desktop-1280--dark.png |
| khong-anh | mobile-375 | light | evidence/design-pass/khong-anh--mobile-375.png |
| khong-lich | desktop-1280 | light | evidence/design-pass/khong-lich--desktop-1280.png |
| khong-lich | desktop-1280 | dark | evidence/design-pass/khong-lich--desktop-1280--dark.png |
| khong-lich | mobile-375 | light | evidence/design-pass/khong-lich--mobile-375.png |

## Cảnh ngữ-cảnh

- Không cần — `host-embedded`: vật render trong shell thật của Invest (top bar, breadcrumb, chân trang).

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Ảnh chính khung vuông của block cắt ảnh Airbnb ngang → khung 4:3 (Hỏi-2 để người chốt).
- PageHeader còn vạch ngăn trơ khi không có badge → chỉ vẽ vạch + badge khi `stats` có phần tử (`page/page-header.tsx`).
- Nhãn thứ của lịch 9px (dưới sàn `text-xs`) → `text-xs`; vừa cột 1.25rem ở cả 1280 và 375.
- (vòng 1, Mạnh) Listing nhiều ảnh làm dải thumbnail xuống hai hàng, đầu trang mất cân đối → dải MỘT hàng trượt ngang trong ScrollArea (5 ô vừa khung, snap), đổi ảnh thì dải tự cuộn ngang theo; chụp lại ma trận.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- không có
