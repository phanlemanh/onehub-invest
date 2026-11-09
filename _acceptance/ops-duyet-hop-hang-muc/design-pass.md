---
slug: ops-duyet-hop-hang-muc
at: 2026-11-08T12:10:00Z
route: http://localhost:3463/ops/review
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (gui-anh-cung-the-cong-pham-vi)
options:
divergence: skipped — khuôn đã chốt ở báo cáo §f4 (Mạnh duyệt solution-agents-9, c-dialog-9, sheet hiện có); ba lựa chọn còn mở là hành vi (Hỏi-1..3), không phải hướng nhìn
ds_skill: onehub-ui
states: [dau-trang, hop-tat-ca, hop-chon, gan-day, sheet-the, sheet-chan, bang-phim, cho-gui, toast-hoan-tac, sau-hoan-tac, hop-mobile, sheet-the-mobile]
breakpoints: [desktop-1280, mobile-375]
themes: [light, dark]
patched: 2
deferred: 1
---
# design-pass — ops-duyet-hop-hang-muc

Route thật `/ops/review` trên dev :3463 của worktree, DB thử `oneinvest_od1` (bản chép DB máy thu: 665 thẻ chờ, bảy hạng mục).
Đã bấm thật: chọn «Gộp Người» (URL thành `?category=party_merge`), «Duyệt liền» (sheet «1/25 · Gộp Người»), phím `?` (bảng
phím), phím `3` (Hoãn: sheet sang «1/24», toast «Đã ghi #166526 · Hoãn»), «Hoàn tác» trong 5 giây (sheet về «1/25», không
lệnh nào tới route). Chụp theo phần tử: đầu trang, hộp, đầu và chân sheet, toast, bảng phím, Quyết định gần đây — không chụp
thân thẻ, chữ bài hay cột liên hệ.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| dau-trang | desktop-1280 | light | evidence/design-pass/dau-trang--desktop-1280--light.png |
| hop-tat-ca | desktop-1280 | light | evidence/design-pass/hop-tat-ca--desktop-1280--light.png |
| hop-chon | desktop-1280 | light | evidence/design-pass/hop-chon--desktop-1280--light.png |
| gan-day | desktop-1280 | light | evidence/design-pass/gan-day--desktop-1280--light.png |
| sheet-the | desktop-1280 | light | evidence/design-pass/sheet-the--desktop-1280--light.png |
| sheet-chan | desktop-1280 | light | evidence/design-pass/sheet-chan--desktop-1280--light.png |
| bang-phim | desktop-1280 | light | evidence/design-pass/bang-phim--desktop-1280--light.png |
| cho-gui | desktop-1280 | light | evidence/design-pass/cho-gui--desktop-1280--light.png |
| toast-hoan-tac | desktop-1280 | light | evidence/design-pass/toast-hoan-tac--desktop-1280--light.png |
| sau-hoan-tac | desktop-1280 | light | evidence/design-pass/sau-hoan-tac--desktop-1280--light.png |
| hop-mobile | mobile-375 | dark | evidence/design-pass/hop--mobile-375--dark.png |
| sheet-the-mobile | mobile-375 | dark | evidence/design-pass/sheet-the--mobile-375--dark.png |

## Cảnh ngữ-cảnh

- Không cần: vật nhúng thẳng trong host thật (`host-embedded`).

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Màn 375 px: mỗi mục hộp chiếm trọn bề ngang nên dải chỉ thấy «Tất cả» — thêm `w-auto min-w-44` cho mục ở màn hẹp; mục kế ló
  ra, trang không cuộn ngang (scrollWidth 375 = clientWidth 375).
- Số phím nằm trong nút làm đổi tên nút («Cùng căn1») với trình đọc màn hình — đặt `Kbd` cạnh nút, nút mang
  `aria-keyshortcuts`.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Quyết định gần đây bỏ chấm chỉ báo của `recent-decisions` gốc (chỉ còn đường dọc): bản gốc tô chấm theo duyệt/từ chối, mà
  OD2 có tới năm bộ nhãn đáp án — chưa có bảng màu theo đáp án; giữ đường dọc trơn tới khi OD3 làm đáp án theo câu hỏi.
