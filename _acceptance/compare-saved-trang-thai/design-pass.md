---
slug: compare-saved-trang-thai
at: 2026-10-24T14:00:00Z
route: http://localhost:3460/compare · http://localhost:3460/saved (đối số; khuôn chung design_pass.proto_route khai trong PR này theo U1-2)
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (gui-goi-anh)
options:
divergence: skipped — cả hai trang có block đích đã chốt trong routes.md (comparison-1, wishlist-2 + c-empty-11) và PageHeader dùng chung; việc chỉ thêm khung trang + trạng thái, không đổi bố cục
ds_skill: onehub-ui
states: [compare-anh, saved-anh, compare-du-lieu, compare-tai, compare-trong, compare-trong-ma-la, compare-loi, saved-du-lieu, saved-loc-phuong, saved-loc-trong, saved-tai, saved-trong, saved-loi]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 9
deferred: 1
---
# design-pass — compare-saved-trang-thai

Bản chạy là route THẬT trong shell Invest (nhánh `feat/compare-saved-trang-thai`, dev server :3460), không phải
route proto. Tải/lỗi chụp bằng chỉnh tạm KHÔNG commit (vùng số liệu chờ 2 phút / ném lỗi) rồi gỡ; «Thử lại» đã thử
thật: lỗi theo tệp cờ, xoá cờ, bấm Thử lại → 3 thẻ hiện lại, trang không tải lại (biến đánh dấu trên `window` còn).
`/saved` chụp bằng tài khoản thử riêng của dãy U1 (tạo qua `/register` trên :3460, DB local).

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| compare-anh | desktop-1280 | light | evidence/design-pass/compare-anh--desktop-1280--light.png |
| compare-anh | desktop-1280 | dark | evidence/design-pass/compare-anh--desktop-1280--dark.png |
| compare-anh | mobile-375 | light | evidence/design-pass/compare-anh--mobile-375--light.png |
| saved-anh | desktop-1280 | light | evidence/design-pass/saved-anh--desktop-1280--light.png |
| saved-anh | desktop-1280 | dark | evidence/design-pass/saved-anh--desktop-1280--dark.png |
| saved-anh | mobile-375 | light | evidence/design-pass/saved-anh--mobile-375--light.png |
| compare-du-lieu | desktop-1280 | light | evidence/design-pass/compare-du-lieu--desktop-1280--light.png |
| compare-du-lieu | desktop-1280 | dark | evidence/design-pass/compare-du-lieu--desktop-1280--dark.png |
| compare-du-lieu | mobile-375 | light | evidence/design-pass/compare-du-lieu--mobile-375--light.png |
| compare-tai | desktop-1280 | light | evidence/design-pass/compare-tai--desktop-1280--light.png |
| compare-tai | desktop-1280 | dark | evidence/design-pass/compare-tai--desktop-1280--dark.png |
| compare-trong | mobile-375 | light | evidence/design-pass/compare-trong--mobile-375--light.png |
| compare-trong-ma-la | desktop-1280 | light | evidence/design-pass/compare-trong-ma-la--desktop-1280--light.png |
| compare-loi | desktop-1280 | light | evidence/design-pass/compare-loi--desktop-1280--light.png |
| saved-du-lieu | desktop-1280 | light | evidence/design-pass/saved-du-lieu--desktop-1280--light.png |
| saved-du-lieu | desktop-1280 | dark | evidence/design-pass/saved-du-lieu--desktop-1280--dark.png |
| saved-du-lieu | mobile-375 | light | evidence/design-pass/saved-du-lieu--mobile-375--light.png |
| saved-loc-phuong | desktop-1280 | light | evidence/design-pass/saved-loc-phuong--desktop-1280--light.png |
| saved-loc-trong | desktop-1280 | light | evidence/design-pass/saved-loc-trong--desktop-1280--light.png |
| saved-tai | desktop-1280 | light | evidence/design-pass/saved-tai--desktop-1280--light.png |
| saved-trong | desktop-1280 | light | evidence/design-pass/saved-trong--desktop-1280--light.png |
| saved-trong | mobile-375 | light | evidence/design-pass/saved-trong--mobile-375--light.png |
| saved-loi | desktop-1280 | light | evidence/design-pass/saved-loi--desktop-1280--light.png |

Một số ảnh 1280 px (saved-du-lieu, compare-tai tối, compare-trong-ma-la, compare-loi, saved-tai) chụp lúc Browser pane
còn thu nhỏ khung giả lập nên trang chỉ chiếm ~¾ ảnh; bố cục bên trong vẫn là 1280 px. 375 px: đo
`scrollWidth = clientWidth = 375` trên `/compare?areas=…` (3 cột) và `/saved` (3 thẻ) — trang không cuộn ngang, bảng
cuộn trong khung.

Vòng 2 (góp ý của Mạnh ở Cổng Phạm vi 24/10: «thiếu ảnh thumbnail … đại diện cho khu vực»): thêm ảnh đại diện = ảnh
một listing tự thu. Bộ `*-anh--*` chụp bằng `playwright-cli` (trình duyệt riêng) vì Browser pane đang ẩn làm ảnh tải chập
chờn; các ảnh `compare-du-lieu`, `saved-du-lieu` là vòng 1 (trước khi có ảnh).

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — vật render trong shell Invest thật (nav, footer, breadcrumb).

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Ô «tốt nhất» của bảng So sánh dùng `text-success` làm chữ ở chế độ sáng (tương phản ~2,4) → `text-success-foreground dark:text-success`.
- Chú thích «Ô xanh là khu vực tốt nhất…» hiện cả khi bảng trống → chỉ hiện khi có ≥ 1 cột.
- Empty của So sánh nói «Bấm “Thêm khu vực”» trong khi nút đã lên PageHeader → «… ở trên».
- Tab của Đã lưu mang class ghi đè chiều cao/padding của block gốc (`h-10!`, `px-3 py-1.5`) → bỏ, dùng kích cỡ của Tabs; ô đếm `text-[10px]` → `Badge` cỡ mặc định.
- Nút bỏ lưu dùng `ease-out` tự chọn → đường cong reveal của ReUI + `motion-reduce:transition-none`.
- Kho chưa khai `design_pass.proto_route` / `host_embed` → khai trong `_acceptance/config.yaml` ở PR này (giám sát duyệt yêu cầu U1-2): route thật, cổng riêng :3460, guide `onehub-ui`.

- Vòng 2: ảnh phủ mất nhãn loại và nút ✕ trên thẻ Đã lưu (ảnh đứng sau trong DOM) → ảnh lên đầu khung, nằm dưới nhãn và nút.
- Vòng 2: nhãn «Phường» viền trong suốt chìm vào ảnh → khi có ảnh dùng biến thể nền đặc của Badge (`info` / `secondary`).
- Vòng 2: ~1/4 ảnh chính trên CDN đã chết (mẫu 25 ảnh: 6 trả 404) và lỗi ảnh lúc hydrate bị mất → 3 ứng viên mỗi khu vực, lùi khi lỗi, `<img>` chỉ gắn sau hydrate; hết ứng viên thì ô số.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Bảng So sánh (comparison-1) dùng `<table>` gốc của block với ngoại lệ tại chỗ; chuyển sang data-grid đã bị loại ở routes.md — giữ, chỉ ghi để Cổng Phạm vi biết vẫn còn một ngoại lệ lint có lý do.
