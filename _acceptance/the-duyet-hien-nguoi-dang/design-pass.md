---
slug: the-duyet-hien-nguoi-dang
at: 2026-11-02T02:08:42Z
route: http://localhost:3462/ops/review
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (ghim)
options:
divergence: skipped — giữ khuôn bảng so của PL3, chỉ thêm một hàng; vị trí hàng là Hỏi-3 có ảnh thật
ds_skill: onehub-ui
states: [the-that-khac-nguon-dang-nhieu, tin-nhieu-nguoi, khop-cung-nguoi, lech-cung-nguon, ngoai-danh-ba-co-ten-goi]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 2
deferred: 1
---
# design-pass — the-duyet-hien-nguoi-dang

Thẻ `the-that-khac-nguon-dang-nhieu` là thẻ chờ thật #105723 trên DB máy thu. Bốn trạng thái còn lại chưa có thẻ chờ thật: ảnh dùng dữ liệu giả
trên route thật, người giả, đã gỡ khỏi mã sau khi chụp. Bản nháp chạy ở cổng 3462 vì cổng 3461 đang bận.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| the-that-khac-nguon-dang-nhieu | desktop-1280 | dark | evidence/design-pass/the-that-khac-nguon-dang-nhieu--desktop-1280--dark.png |
| the-that-khac-nguon-dang-nhieu | mobile-375 | dark | evidence/design-pass/the-that-khac-nguon-dang-nhieu--mobile-375--dark.png |
| tin-nhieu-nguoi | desktop-1280 | dark | evidence/design-pass/tin-nhieu-nguoi--desktop-1280--dark.png |
| tin-nhieu-nguoi | desktop-1280 | light | evidence/design-pass/tin-nhieu-nguoi--desktop-1280--light.png |
| tin-nhieu-nguoi | mobile-375 | dark | evidence/design-pass/tin-nhieu-nguoi--mobile-375--dark.png |
| khop-cung-nguoi | desktop-1280 | dark | evidence/design-pass/khop-cung-nguoi--desktop-1280--dark.png |
| lech-cung-nguon | desktop-1280 | dark | evidence/design-pass/lech-cung-nguon--desktop-1280--dark.png |
| ngoai-danh-ba-co-ten-goi | desktop-1280 | dark | evidence/design-pass/ngoai-danh-ba-co-ten-goi--desktop-1280--dark.png |

## Cảnh ngữ-cảnh

- Không cần: vật render ngay trong sheet thật của `/ops/review`.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Tin nhiều người: Badge của người khác đứng dưới tên người neo, đọc nhầm là số tin của người neo; chuyển xuống dưới «+n người khác».
- Tên «unknown» của S05 hiện như một tên thật; bỏ qua ở cả tên trên tin lẫn bí danh, ô hiện «—».

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Ở 375px, Badge «Không so được» làm bảng rộng hơn sheet 38px: cột So cuộn ngang trong bảng và chữ bị cắt ở cạnh phải. Ops chủ yếu dùng khổ rộng; đề xuất chấp nhận, ghi Known limits.
