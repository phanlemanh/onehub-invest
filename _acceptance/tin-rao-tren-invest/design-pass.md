---
slug: tin-rao-tren-invest
at: 2026-11-02T01:10:00Z
route: http://localhost:3461/vn/hanoi/listings/sale
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-0 (gui-goi-anh)
options:
divergence: skipped — khuôn thẻ chung đã được Mạnh chốt ở bước đề xuất
ds_skill: onehub-ui
states: [ban, cho-thue-dai-han, thue-ngan-han, loc-ra-0, ngan-loc, phan-trang, so-da-hien]
breakpoints: [mobile-320, mobile-375, desktop-1280]
themes: [light, dark]
patched: 8
deferred: 0
---
# design-pass — tin-rao-tren-invest

Dựng trên route thật, dữ liệu DB máy thu. Ảnh commit che tên người đăng và số vì kho công khai. Làm lại sau khi Mạnh chốt một trang Listing với thẻ chung; bản bảng và tab cũ đã bỏ. Làm lại lần nữa sau khi Mạnh chốt đưa Bán, Cho thuê lên header.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| ban | desktop-1280 | dark | evidence/design-pass/ban--desktop-1280--dark.jpg |
| ban | desktop-1280 | light | evidence/design-pass/ban--desktop-1280--light.jpg |
| ban | mobile-375 | dark | evidence/design-pass/ban--mobile-375--dark.jpg |
| cho-thue-dai-han | desktop-1280 | dark | evidence/design-pass/cho-thue-dai-han--desktop-1280--dark.jpg |
| cho-thue-dai-han | mobile-375 | dark | evidence/design-pass/cho-thue-dai-han--mobile-375--dark.jpg |
| thue-ngan-han | desktop-1280 | dark | evidence/design-pass/thue-ngan-han--desktop-1280--dark.jpg |
| loc-ra-0 | desktop-1280 | dark | evidence/design-pass/loc-ra-0--desktop-1280--dark.jpg |
| ngan-loc | mobile-375 | dark | evidence/design-pass/ngan-loc--mobile-375--dark.jpg |
| phan-trang | desktop-1280 | light | evidence/design-pass/phan-trang--desktop-1280--light.jpg |
| so-da-hien | desktop-1280 | light | evidence/design-pass/so-da-hien--desktop-1280--light.jpg |

## Cảnh ngữ-cảnh

- Không cần: vật nhúng thẳng trong route thật.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Giá thuê ngắn hạn viết đủ số, hai loại kia viết gọn → cả ba dùng `fmtMoneyCompact`.
- Trang lưới không bội của cột để lại hàng lẻ → cỡ trang 24, trần lệch 960.
- Thanh công cụ màn 375 đè công tắc → màn hẹp lọc bằng ngăn Bộ lọc.
- Ngày thẻ `2026-10-24` → `24/10/2026`.
- Công tắc to hơn chữ cạnh nó → `size="sm"`.
- Giá nhập theo triệu trong khi gần 99% tin bán từ một tỷ → Bán nhập theo tỷ, số lẻ không làm tròn.
- Thứ tự trường lọc lệch giữa các loại → Phường, Loại, Giá, Phòng ngủ, Diện tích.

### Nhóm 2 — đòi-đổi-DS/component (Mạnh đã duyệt «Làm theo bản này» 02/11)

- Nav: mục Listing thành Bán, Cho thuê; `NavSection` thêm `hrefFor`, `pinned` để giữ thị trường và giữ hai mục ngoài menu ở màn hẹp.
- Bỏ `ui/tabs` chọn Loại tin; thêm `ui/toggle-group` cho thời hạn thuê.
- Phân trang vẽ tay bằng `ui/button` → cài `ui/pagination`, link thật.
- Thêm `listing/offers-filter-sheet.tsx`, chuyển thể `@reui/filter-sidebar-5`.

### Nhóm 3 — sửa thẻ sau đối chiếu sàn ngoài (Mạnh duyệt «Làm cả nhóm 1, 2» 02/11)

- Thẻ 6 dòng chữ còn 4: giá/m² lên hàng giá, thông số thành một dòng chữ, «Đăng bởi» cùng dòng với tên.
- Bỏ ₫ trên thẻ: `fmtCompact` thay `fmtMoneyCompact`, áp cả thẻ thuê ngắn hạn.
- Ngày góc phải thành «Thấy từ …» cuối hàng vị trí, tính từ `first_seen`; `updatedAt` vẫn ở API.
- Thông số theo loại hình, thêm `bathrooms`, `stories`, `frontageLength`, `firstSeenDays`; số tầng trên 30 và mặt tiền trên 100 m không hiện.
- «Chưa có số» từ badge thành chữ mờ; nút Xem số giữ nguyên.
- Màn 375 thẻ cao 164 px; màn 320 không tràn, nút số không vượt thẻ.

### Điều đã kiểm trên bản chạy

- Màn 375: `scrollWidth` bằng `innerWidth` ở Bán, thuê ngắn hạn; màn 320 ở thuê dài hạn: header còn đủ Bán, Cho thuê, không tràn. Thuê ngắn hạn ở 375 có hai hàng công cụ.
- `/vn/hanoi/listings` 308 sang `/listings/sale`; `?kind=rent_lt` sang `/listings/rent`; `?kind=rent_st&price_min=1` sang `/listings/rent?price_min=1&term=short`; thị trường không có trả 404.
- Từ `/vn/hcmc/listings/rent`, Bán trỏ `/vn/hcmc/listings/sale`.
- Bấm Ngắn hạn: URL `?term=short`, tiêu đề «Thuê ngắn hạn tại…», ô đúng trạng thái.
- Ngăn lọc nhập giá 1,5 tới 3: URL `price_min=1500000000&price_max=3000000000`, 526 tin, nút mang số 1.
- Bấm Sau: URL `?page=2`, về đầu trang; link có `href` thật, ngắt trang đúng 1, 2, 3, …, 41.
- Bấm Xem số: đúng một lời gọi `/api/v1/listings/<id>/contact` trả 200, link `tel:` đúng khuôn; HTML trước khi bấm không có dãy `+84`.
- Thẻ thuê ngắn hạn ảnh hỏng: không có ô ảnh, các ô khác giữ thứ tự.
