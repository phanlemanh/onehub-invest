---
slug: auth-hop-chuan
at: 2026-10-26T09:40:00Z
route: http://ui7.localhost:3460/login
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem-the)
options:
divergence: skipped — câu giao chỉ đích danh ba thứ phải bỏ; hướng thay nền đăng ký là Hỏi-1 ở Cổng Phạm vi (khuyên nền trơn + noise sẵn có)
ds_skill: onehub-ui
states: [dang-nhap, dang-ky]
breakpoints: [mobile-390, desktop-1280]
themes: [light, dark]
patched: 0
deferred: 1
---
# design-pass — auth-hop-chuan

Bản bấm được là hai trang THẬT `/login`, `/register` trong layout `(auth)` của dev server dãy U1 (:3460, worktree
`u1-compare-saved`), mở qua `ui7.localhost` (host không cookie nên `/login` không chuyển hướng). Đo lúc chụp: 0 phần tử
còn chạy animation, `scrollWidth = clientWidth` ở mọi khổ.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| dang-nhap | desktop-1280 | light | evidence/design-pass/dang-nhap--desktop-1280--light.png |
| dang-nhap | desktop-1280 | dark | evidence/design-pass/dang-nhap--desktop-1280--dark.png |
| dang-nhap | mobile-390 | light | evidence/design-pass/dang-nhap--mobile-390--light.png |
| dang-ky | desktop-1280 | light | evidence/design-pass/dang-ky--desktop-1280--light.png |
| dang-ky | desktop-1280 | dark | evidence/design-pass/dang-ky--desktop-1280--dark.png |
| dang-ky | mobile-390 | light | evidence/design-pass/dang-ky--mobile-390--light.png |

Trạng thái lỗi `error.tsx` không dựng được trên bản chạy mà không phá trang — đo ở jsdom (AH-AC-4).

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — hai trang chạy trong layout `(auth)` thật.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Không có.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Tiêu đề Frame «Đăng nhập» về cỡ mặc định `text-sm` của `reui/frame` nên trông nhỏ so với bản block gốc (`text-2xl`) — đúng luật «không resize FrameTitle»; muốn tiêu đề lớn hơn thì cần biến thể Frame/tiêu đề ở tầng DS, không chèn lớp cỡ.
