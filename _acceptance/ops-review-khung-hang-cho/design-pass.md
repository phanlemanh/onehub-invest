---
slug: ops-review-khung-hang-cho
at: 2026-10-26T04:45:00Z
route: http://ui1.localhost:3460/ops/review
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem-the)
options:
divergence: skipped — câu giao chỉ đích danh block solution-agents-5 (hàng chờ + sheet), routes.md đã chốt họ khung Frame; không còn hướng thứ hai khả dĩ
ds_skill: onehub-ui
states: [bang-cho, loc-rong, sheet-ghep-can, sheet-bo-sung-tin, sheet-ghep-can-anh]
breakpoints: [mobile-390, desktop-1280]
themes: [light, dark]
patched: 4
deferred: 2
---
# design-pass — ops-review-khung-hang-cho

Bản bấm được là trang THẬT `/ops/review` trong vỏ Ops (OpsShell) của dev server dãy U1 (:3460, worktree
`u1-compare-saved`), dữ liệu là `review_queue` local thật (13 thẻ chờ), đăng nhập bằng tài khoản thử
`scripts/dev-ops-account.mjs` (admin). Mở qua `ui1.localhost` thay `localhost`: cookie tách khỏi phiên localhost có sẵn
của trình duyệt; `127.0.0.1` không hydrate trên dev server Next 16 (không bấm được). Khổ 390 là `mobile-390` (khổ
`routes.md`/LUAT đợt), không phải 375.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| bang-cho | desktop-1280 | light | evidence/design-pass/bang-cho--desktop-1280--light.png |
| bang-cho | desktop-1280 | dark | evidence/design-pass/bang-cho--desktop-1280--dark.png |
| bang-cho | mobile-390 | light | evidence/design-pass/bang-cho--mobile-390--light.png |
| loc-rong | desktop-1280 | light | evidence/design-pass/loc-rong--desktop-1280--light.png |
| sheet-ghep-can | desktop-1280 | light | evidence/design-pass/sheet-ghep-can--desktop-1280--light.png |
| sheet-bo-sung-tin | desktop-1280 | dark | evidence/design-pass/sheet-bo-sung-tin--desktop-1280--dark.png |
| sheet-ghep-can | mobile-390 | light | evidence/design-pass/sheet-ghep-can--mobile-390--light.png |
| sheet-ghep-can-anh | mobile-390 | light | evidence/design-pass/sheet-ghep-can-anh--mobile-390--light.png |

Đo kèm lúc chụp: 390 px `scrollWidth = clientWidth = 390`; sheet 390 px rộng 390 (toàn bề ngang), Tin A trên Tin B;
sheet 1280 px rộng 672 (`max-w-2xl`), Tin A cạnh Tin B; ngoài các đoạn trích nguyên văn `[data-review-quote]` không chuỗi
«N%» hay «tự tin» nào trong ba sheet đã mở. Trạng thái trống / tải / lỗi không dựng được trên DB thật (không xoá thẻ) —
đo ở jsdom (E11).

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — vật chạy trong vỏ Ops thật, thanh bên «Xử lý › Hàng duyệt» hiện trong mọi ảnh 1280.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Sheet không nhận `w-full sm:max-w-2xl` (class `data-[side=right]:w-3/4 …:sm:max-w-sm` của Sheet mạnh hơn) → sheet 292 px ở 390, 384 px ở 1280; đổi sang `data-[side=right]:w-full data-[side=right]:sm:max-w-2xl`.
- 390 px: cột Loại/Trạng thái ra ngoài khung nhìn (bảng cuộn ngang) → nhắc lại hai badge ngay dưới tên thẻ, chỉ ở màn hẹp (`sm:hidden`).
- Mã «#id» lệch lề so với tên thẻ (nút link có đệm) → dòng phụ dưới tên dùng cùng lề `ps-2`.
- Lý do của máy chứa «5.3%» (chênh giá, không phải độ tự tin) → đánh dấu các đoạn trích nguyên văn `data-review-quote`, phép đo Q9 (AC-6, E8/E9) gỡ chúng trước khi tìm «%»; hợp đồng + evals sửa theo.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- `className="w-full sm:max-w-md"` trên `SheetContent` không có tác dụng ở các sheet khác của kho (vd `components/ops/sources/new-group-sheet.tsx`) vì cùng lý do — đề xuất một việc dọn riêng (ngoài UI1, không sửa `components/ui`).
- Ô ảnh tin hiện khung xám trống trước khi ảnh ngoài tải xong (lazy, URL nguồn có hạn) — hành vi có sẵn của `ReviewPhotos`; thuộc Known limits của `review-card-photos` → PL23.
