---
slug: people-hien-so-goc
at: 2026-11-02T06:15:00Z
route: http://localhost:3460/ops/people
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem-the)
options:
divergence: skipped — sửa thẳng route thật theo khuôn bảng và thẻ sẵn có, chỗ đặt số đã chốt ở cột đầu nhờ phản biện gap-probe
ds_skill: onehub-ui
states: [people-truoc-uu-tien, people-mac-dinh, people-tim, person-so, deals-ops, people-viewer, deals-viewer]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 3
deferred: 0
---
# design-pass — people-hien-so-goc

Mọi ảnh chụp từ route thật với tài khoản thử hai vai. Trước khi chụp, số, tên, tên nhóm và mã tài khoản được thay bằng giá trị mẫu vì kho công khai, nên `0912 345 678` và «Người mẫu» trên ảnh không phải dữ liệu thật.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| deals-ops | desktop-1280 | dark | evidence/design-pass/deals-ops--desktop-1280--dark.png |
| deals-ops | desktop-1280 | light | evidence/design-pass/deals-ops--desktop-1280--light.png |
| deals-ops | mobile-375 | light | evidence/design-pass/deals-ops--mobile-375--light.png |
| deals-viewer | desktop-1280 | light | evidence/design-pass/deals-viewer--desktop-1280--light.png |
| deals-viewer | mobile-375 | light | evidence/design-pass/deals-viewer--mobile-375--light.png |
| people-mac-dinh | desktop-1280 | light | evidence/design-pass/people-mac-dinh--desktop-1280--light.png |
| people-mac-dinh | mobile-375 | light | evidence/design-pass/people-mac-dinh--mobile-375--light.png |
| people-tim | desktop-1280 | dark | evidence/design-pass/people-tim--desktop-1280--dark.png |
| people-tim | desktop-1280 | light | evidence/design-pass/people-tim--desktop-1280--light.png |
| people-tim | mobile-375 | light | evidence/design-pass/people-tim--mobile-375--light.png |
| people-truoc-uu-tien | desktop-1280 | light | evidence/design-pass/people-truoc-uu-tien--desktop-1280--light.png |
| people-truoc-uu-tien | mobile-375 | light | evidence/design-pass/people-truoc-uu-tien--mobile-375--light.png |
| people-viewer | desktop-1280 | light | evidence/design-pass/people-viewer--desktop-1280--light.png |
| people-viewer | mobile-375 | light | evidence/design-pass/people-viewer--mobile-375--light.png |
| person-so | desktop-1280 | dark | evidence/design-pass/person-so--desktop-1280--dark.png |
| person-so | desktop-1280 | light | evidence/design-pass/person-so--desktop-1280--light.png |
| person-so | mobile-375 | light | evidence/design-pass/person-so--mobile-375--light.png |

## Cảnh ngữ-cảnh

- Không cần: vật nằm trong khung Vận hành thật, `context: host-embedded`.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Số đặt ở cột đầu «Người», dưới tên, để khổ 375 không phải vuốt ngang mới chạm được; cột cũ đổi tên thành «Tài khoản».
- Danh bạ của vai xem được số xếp người có số lên trước theo khuyến nghị Hỏi-3; `people-truoc-uu-tien` là ảnh trước khi đổi, trang đầu không có số nào.
- Bảng danh bạ vẽ đủ mọi hàng máy chủ gửi; trước đây dừng ở 10 hàng và không có nút chuyển trang.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Không có.
