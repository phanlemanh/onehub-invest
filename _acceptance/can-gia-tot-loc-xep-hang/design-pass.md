---
slug: can-gia-tot-loc-xep-hang
at: 2026-11-18T08:02:36Z
route: http://localhost:3461/ops/deals
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-chup-qua-phien-phu)
options:
divergence: skipped — màn đã có khuôn bảng kèm sheet từ CG8–CG10, chỉ một khuôn khả dĩ
ds_skill: onehub-ui
states: [mac-dinh, du-an-1, cho-thue, tab-trong, cay-vi-tri, dang-tai]
breakpoints: [mobile-390, desktop-1440]
themes: [light, dark]
patched: 9
deferred: 1
---
# design-pass — can-gia-tot-loc-xep-hang

Phiên phụ N1b xem hai lượt trên route thật của nhánh, DB máy thu chỉ đọc. Nhận xét đầy đủ: `evidence/design-pass/nhan-xet.md`.
Chưa xem trên màn: lỗi kèm «Thử lại», tập rỗng, lược đồ cloud. Hai bản sửa nhỏ cuối (cột Hạng giá 220 px, `title` của dòng mặt bằng) đi sau lượt xem thứ hai.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| mac-dinh · quan-tri | desktop-1440 | light | evidence/design-pass/mac-dinh--sang--quan-tri.jpg |
| mac-dinh · van-hanh | desktop-1440 | light | evidence/design-pass/mac-dinh--sang--van-hanh.jpg |
| mac-dinh · nguoi-xem | desktop-1440 | light | evidence/design-pass/mac-dinh--sang--nguoi-xem.jpg |
| mac-dinh · quan-tri | desktop-1440 | dark | evidence/design-pass/mac-dinh--toi--quan-tri.jpg |
| mac-dinh · van-hanh | desktop-1440 | dark | evidence/design-pass/mac-dinh--toi--van-hanh.jpg |
| mac-dinh · nguoi-xem | desktop-1440 | dark | evidence/design-pass/mac-dinh--toi--nguoi-xem.jpg |
| mac-dinh · quan-tri | mobile-390 | light | evidence/design-pass/mac-dinh--hep-390--quan-tri.jpg |
| mac-dinh · van-hanh | mobile-390 | light | evidence/design-pass/mac-dinh--hep-390--van-hanh.jpg |
| mac-dinh · nguoi-xem | mobile-390 | light | evidence/design-pass/mac-dinh--hep-390--nguoi-xem.jpg |
| du-an-1 · quan-tri | desktop-1440 | light | evidence/design-pass/du-an-1--sang--quan-tri.jpg |
| du-an-1 · van-hanh | desktop-1440 | light | evidence/design-pass/du-an-1--sang--van-hanh.jpg |
| du-an-1 · nguoi-xem | desktop-1440 | light | evidence/design-pass/du-an-1--sang--nguoi-xem.jpg |
| du-an-1 · quan-tri | desktop-1440 | dark | evidence/design-pass/du-an-1--toi--quan-tri.jpg |
| du-an-1 · van-hanh | desktop-1440 | dark | evidence/design-pass/du-an-1--toi--van-hanh.jpg |
| du-an-1 · nguoi-xem | desktop-1440 | dark | evidence/design-pass/du-an-1--toi--nguoi-xem.jpg |
| du-an-1 · quan-tri | mobile-390 | light | evidence/design-pass/du-an-1--hep-390--quan-tri.jpg |
| du-an-1 · van-hanh | mobile-390 | light | evidence/design-pass/du-an-1--hep-390--van-hanh.jpg |
| du-an-1 · nguoi-xem | mobile-390 | light | evidence/design-pass/du-an-1--hep-390--nguoi-xem.jpg |
| cho-thue · quan-tri | desktop-1440 | light | evidence/design-pass/cho-thue--sang--quan-tri.jpg |
| cho-thue · van-hanh | desktop-1440 | light | evidence/design-pass/cho-thue--sang--van-hanh.jpg |
| cho-thue · nguoi-xem | desktop-1440 | light | evidence/design-pass/cho-thue--sang--nguoi-xem.jpg |
| cho-thue · quan-tri | desktop-1440 | dark | evidence/design-pass/cho-thue--toi--quan-tri.jpg |
| cho-thue · van-hanh | desktop-1440 | dark | evidence/design-pass/cho-thue--toi--van-hanh.jpg |
| cho-thue · nguoi-xem | desktop-1440 | dark | evidence/design-pass/cho-thue--toi--nguoi-xem.jpg |
| cho-thue · quan-tri | mobile-390 | light | evidence/design-pass/cho-thue--hep-390--quan-tri.jpg |
| cho-thue · van-hanh | mobile-390 | light | evidence/design-pass/cho-thue--hep-390--van-hanh.jpg |
| cho-thue · nguoi-xem | mobile-390 | light | evidence/design-pass/cho-thue--hep-390--nguoi-xem.jpg |
| tab-trong · quan-tri | desktop-1440 | light | evidence/design-pass/tab-trong--sang--quan-tri.jpg |
| tab-trong · van-hanh | desktop-1440 | light | evidence/design-pass/tab-trong--sang--van-hanh.jpg |
| tab-trong · nguoi-xem | desktop-1440 | light | evidence/design-pass/tab-trong--sang--nguoi-xem.jpg |
| tab-trong · quan-tri | desktop-1440 | dark | evidence/design-pass/tab-trong--toi--quan-tri.jpg |
| tab-trong · van-hanh | desktop-1440 | dark | evidence/design-pass/tab-trong--toi--van-hanh.jpg |
| tab-trong · nguoi-xem | desktop-1440 | dark | evidence/design-pass/tab-trong--toi--nguoi-xem.jpg |
| tab-trong · quan-tri | mobile-390 | light | evidence/design-pass/tab-trong--hep-390--quan-tri.jpg |
| tab-trong · van-hanh | mobile-390 | light | evidence/design-pass/tab-trong--hep-390--van-hanh.jpg |
| tab-trong · nguoi-xem | mobile-390 | light | evidence/design-pass/tab-trong--hep-390--nguoi-xem.jpg |
| cay-vi-tri · quan-tri | desktop-1440 | light | evidence/design-pass/cay-vi-tri--sang--quan-tri.jpg |
| cay-vi-tri · quan-tri | mobile-390 | light | evidence/design-pass/cay-vi-tri--hep-390--quan-tri.jpg |
| dang-tai · quan-tri | desktop-1440 | light | evidence/design-pass/dang-tai--sang--quan-tri.jpg |

## Cảnh ngữ-cảnh

- Không cần: màn chạy thật trong vỏ Ops.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Giá thuê dưới một triệu/m² ghi «nghìn/m²», không còn «0 tr/m²».
- Khổ 390 px: cột ẩn rời khỏi bảng, giá và mức giảm thấy khi chưa cuộn.
- Chân bảng ghi «1–15 / 7.460» có dấu chấm ngăn nghìn.
- Cột Hạng giá giữ số căn trong nhóm, chữ dài có `title`.
- Cùng một nhóm dùng một đơn vị «căn».
- Cây vị trí chỉ ghi số căn một lần.
- Tiêu đề cột cùng độ đậm.
- Dòng cấp dự án không còn nói nhóm «trong phường».
- Cột Hạng giá 220 px để bảng vừa khổ 1.440 px; dòng mặt bằng có `title`.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Badge đầu trang 10 px nằm ở `PageHeader` dùng chung cho mọi trang, ngoài vòng này.
