---
slug: trang-chu-methodology
at: 2026-10-24T22:50:00Z
route: http://localhost:3460/ · http://localhost:3460/methodology · /phuong-phap (301) · hai route lỗi tạm (đã xoá)
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem — gói ảnh trạng thái × khổ gửi cùng thẻ Cổng Phạm vi)
options:
divergence: skipped — block đích đã chốt ở routes.md (faq-3 cho Phương pháp, giữ hero-8/card-29/faq-6 cho trang chủ); màu chỉ đổi sang palette gần nhất, không có hướng thứ hai
ds_skill: onehub-ui
states: [methodology-default, methodology-deeplink, home-default, home-truoc, marketing-error, global-error]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 2
deferred: 1
---
# design-pass — trang-chu-methodology

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| methodology-default | desktop-1280 | light | evidence/design-pass/methodology--desktop-1280--light.png |
| methodology-default | desktop-1280 | dark | evidence/design-pass/methodology--desktop-1280--dark.png |
| methodology-default | mobile-375 | light | evidence/design-pass/methodology--mobile-375--light.png |
| methodology-deeplink (#revpar) | desktop-1280 | light | evidence/design-pass/methodology-revpar--desktop-1280--light.png |
| home-default | desktop-1280 | light | evidence/design-pass/home--desktop-1280--light.png |
| home-default | desktop-1280 | dark | evidence/design-pass/home--desktop-1280--dark.png |
| home-default | mobile-375 | light | evidence/design-pass/home--mobile-375--light.png |
| home-markets | desktop-1280 | light | evidence/design-pass/home-markets--desktop-1280--light.png |
| home-markets | desktop-1280 | dark | evidence/design-pass/home-markets--desktop-1280--dark.png |
| home-truoc (hero bản hex cũ) | desktop-1280 | light | evidence/design-pass/home-truoc--desktop-1280--light.png |
| home-truoc (hero bản hex cũ) | desktop-1280 | dark | evidence/design-pass/home-truoc--desktop-1280--dark.png |
| marketing-error | desktop-1280 | light | evidence/design-pass/loi-trang--desktop-1280--light.png |
| marketing-error | desktop-1280 | dark | evidence/design-pass/loi-trang--desktop-1280--dark.png |
| marketing-error | mobile-375 | light | evidence/design-pass/loi-trang--mobile-375--light.png |
| global-error | desktop-1280 | light | evidence/design-pass/loi-toan-cuc--desktop-1280--light.png |
| global-error | desktop-1280 | dark | evidence/design-pass/loi-toan-cuc--desktop-1280--dark.png |
| global-error | mobile-375 | light | evidence/design-pass/loi-toan-cuc--mobile-375--light.png |

Hai trạng thái lỗi chụp trên hai route tạm chỉ ném `Error` (`(marketing)/design-pass-loi-trang`,
`design-pass-loi-toan-cuc`), xoá ngay sau khi chụp. Ảnh `home-truoc--*` chụp khi `frame-backdrop.tsx` tạm là bản HEAD
(hex) rồi trả lại bản mới — để người duyệt so hình hero trước/sau.

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — vật render trong host thật (layout marketing, navbar-12, chân trang).

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Trang lỗi toàn cục hiện «Mã lỗi» bằng font thường vì `global-error` không qua layout gốc → nạp thêm Geist Mono trong `global-error.tsx`.
- Hai biểu tượng bản đồ cạnh nhau ở hàng hỗ trợ /methodology (ô biểu tượng + nút «Xem thị trường») → ô biểu tượng đổi sang `ChartColumnIcon`.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Trang chủ chưa có trạng thái tải (skeleton): trang chờ đủ số rồi mới vẽ — Hỏi-1 ở Cổng Phạm vi (máy khuyên để hàng sau).
