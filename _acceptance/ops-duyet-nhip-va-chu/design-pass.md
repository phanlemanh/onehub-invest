---
slug: ops-duyet-nhip-va-chu
at: 2026-11-08T00:05:00Z
route: http://localhost:3463/ops/review · http://localhost:3463/ops/deals (dev từ worktree, DB thử oneinvest_od1)
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (ghim — ảnh gửi cùng thẻ Cổng Phạm vi)
options:
divergence: skipped — giữ khuôn danh-sách-chi-tiết của trang (UI1); rail hạng mục (khuôn khác) là OD2, Mạnh đã duyệt khuôn ở báo cáo soát Ops f4
ds_skill: onehub-ui
states: [nhip-trong, nhip-co-so, loc-nguoi, sheet-ghep-da-quyet, card-thieu, deals-o-can-cho-ghep, deals-sheet-cho-ghep]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 0
deferred: 2
---
# design-pass — ops-duyet-nhip-va-chu

Bản bấm được là route thật trên nhánh `feat/ops-duyet-nhip-va-chu`, dev :3463 nối DB thử chép từ máy thu (Mạnh «Đồng ý P4»,
08/11). Hai lượt quyết «Hoãn» (một thẻ Người) và «Không chắc» (một thẻ Ghép căn) ghi vào DB thử để thấy bảng nhịp có số và
nhãn đáp án. Chụp theo phần tử, không chụp thân thẻ, chữ bài, cột liên hệ hay thanh bên có email.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| nhip-trong | desktop-1280 | dark | evidence/design-pass/nhip-trong--desktop-1280--dark.png |
| nhip-co-so | desktop-1280 | light | evidence/design-pass/nhip-co-so--desktop-1280--light.png |
| nhip-co-so | mobile-375 | dark | evidence/design-pass/nhip-co-so--mobile-375--dark.png |
| loc-nguoi | desktop-1280 | light | evidence/design-pass/loc-nguoi--desktop-1280--light.png |
| sheet-ghep-da-quyet (đầu) | desktop-1280 | light | evidence/design-pass/sheet-ghep-da-quyet-dau--desktop-1280--light.png |
| sheet-ghep-da-quyet (chân) | desktop-1280 | light | evidence/design-pass/sheet-ghep-da-quyet-chan--desktop-1280--light.png |
| card-thieu | desktop-1280 | light | evidence/design-pass/card-thieu--desktop-1280--light.png |
| deals-o-can-cho-ghep | desktop-1280 | light | evidence/design-pass/deals-o-can-cho-ghep--desktop-1280--light.png |
| deals-sheet-cho-ghep | desktop-1280 | light | evidence/design-pass/deals-sheet-cho-ghep--desktop-1280--light.png |

Đã thấy trên bản chạy: tiêu đề Ghép căn «Cùng căn? Phường Cầu Giấy · 80 m² và 80 m²» không còn «score»; badge đầu sheet và chân
sheet cùng «Không chắc»; bộ lọc «Người» ra 28 thẻ mang badge «Người»; Frame nhịp sau hai lượt: Ghép căn 1 lượt 3,2 giây ở thẻ,
19,3 giây giữa hai lượt, Gộp Người 1 lượt 2,3 giây; căn ở Căn giá tốt mang «Đang chờ ghép», sheet có ba liên kết «Mở thẻ ghép
#105727…#105729», bấm mở đúng thẻ ở `/ops/review?card=105727`; `?card=999999` hiện Alert «Không tìm thấy thẻ #999999»; 375 px
không cuộn ngang trang (scrollWidth = clientWidth = 375).

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — vật nằm trên route thật trong vỏ Ops.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- (không có)

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Bảng nhịp ở 375 px rộng 635 px trong khung 341 px: sáu cột tự cuộn ngang trong Frame (trang không cuộn). Đề xuất: giữ ở OD1,
  rail hạng mục của OD2 (solution-agents-9) thay khung này trên mọi khổ.
- Một căn có ba thẻ Ghép căn chờ hiện ba liên kết «Mở thẻ ghép #…» nối nhau trên một dòng. Đề xuất: giữ (đúng số thẻ đang chờ);
  nếu thường gặp hơn ba thì gom thành «Mở 3 thẻ ghép» ở hàng sau.
