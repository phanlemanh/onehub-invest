---
slug: yield-dong-tien-von-vay
at: 2026-10-25T01:10:00Z
route: http://localhost:3460/yield?area=vn-hanoi · /vn/hanoi/dau-tu (301 → #financing)
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem — gói ảnh trạng thái × khổ gửi cùng thẻ Cổng Phạm vi)
options:
divergence: skipped — block đích (data-grid-advanced-7) và chỗ đặt (mục #financing của /yield) đã chốt ở routes.md/CONTEXT.md; quyết định mở là cách tính (Hỏi-1), không phải hướng giao diện
ds_skill: onehub-ui
states: [yield-default, yield-financing-redirect, yield-low-leverage, yield-phone, form-truoc]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 2
deferred: 1
---
# design-pass — yield-dong-tien-von-vay

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| yield-default (cả trang) | desktop-1280 | light | evidence/design-pass/yield--desktop-1280--light.png |
| yield-default (cả trang) | desktop-1280 | dark | evidence/design-pass/yield--desktop-1280--dark.png |
| yield-default (cả trang) | mobile-375 | light | evidence/design-pass/yield--mobile-375--light.png |
| yield-financing-redirect (/vn/hanoi/dau-tu) | desktop-1280 | light | evidence/design-pass/financing--desktop-1280--light.png |
| yield-financing-redirect | desktop-1280 | dark | evidence/design-pass/financing--desktop-1280--dark.png |
| yield-financing-redirect | mobile-375 | light | evidence/design-pass/financing--mobile-375--light.png |
| yield-low-leverage (eq 80%, lãi 6%, 25 năm) | desktop-1280 | light | evidence/design-pass/financing-vay-thap--desktop-1280--light.png |
| form-truoc (dải gradient bản oklch cũ) | desktop-1280 | light | evidence/design-pass/form-truoc--desktop-1280--light.png |

Ảnh `form-truoc` chụp khi `yield-form.tsx` tạm là bản HEAD rồi trả lại bản mới — để so dải gradient form-11 trước/sau khi
đổi `oklch(...)` sang biến palette.

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — lưới và form render trong trang `/yield` thật (app-shell-30).

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Dải màu hàng mục không hiện: lớp Tailwind ghép bằng hàm không được sinh → viết nguyên văn từng lớp trong `financing-grid.tsx`.
- Ở 375 px ba cột ghim chiếm hết bề ngang → điện thoại chỉ ghim nút mở + tên khoản mục (như block gốc).

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- `/yield` chưa có trạng thái tải (trang chờ đủ số rồi mới vẽ) — Hỏi-2 ở Cổng Phạm vi.
