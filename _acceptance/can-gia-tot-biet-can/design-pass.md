---
slug: can-gia-tot-biet-can
at: 2026-11-02T23:46:38Z
route: http://localhost:3460/ops/deals
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem-the, Mạnh phản hồi bằng lời trên phiên)
options: _acceptance/can-gia-tot-biet-can/phuong-an.md
divergence: opened
ds_skill: onehub-ui
states: [bang-du, bang-loc, bang-nguoi-xem, bang-trong, can-can-xac-minh, can-cloud, can-du, can-khong-tim-thay, can-nguoi-xem, can-roi-danh-sach, can-thieu, sheet-can-xac-minh, sheet-cloud, sheet-cung, sheet-cung-trong, sheet-du, sheet-nguoi-xem, sheet-thieu]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 12
deferred: 1
---
# design-pass — can-gia-tot-biet-can

Bản mẫu chạy trên route thật bằng dữ liệu bịa (số 0900 000 001, tên «Người Bán Mẫu», ảnh là ô màu), không đọc DB thật. Mã
bản mẫu không commit, giữ ở `evidence/design-pass/ban-mau.patch`; S3 thay dữ liệu mẫu bằng loader thật.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| bang-du | desktop-1280 | dark | evidence/design-pass/bang-du--desktop-1280--dark.png |
| bang-du | desktop-1280 | light | evidence/design-pass/bang-du--desktop-1280--light.png |
| bang-du | mobile-375 | light | evidence/design-pass/bang-du--mobile-375--light.png |
| bang-loc | desktop-1280 | light | evidence/design-pass/bang-loc--desktop-1280--light.png |
| bang-nguoi-xem | desktop-1280 | light | evidence/design-pass/bang-nguoi-xem--desktop-1280--light.png |
| bang-trong | desktop-1280 | light | evidence/design-pass/bang-trong--desktop-1280--light.png |
| can-can-xac-minh | desktop-1280 | light | evidence/design-pass/can-can-xac-minh--desktop-1280--light.png |
| can-cloud | desktop-1280 | light | evidence/design-pass/can-cloud--desktop-1280--light.png |
| can-du | desktop-1280 | dark | evidence/design-pass/can-du--desktop-1280--dark.png |
| can-du | desktop-1280 | light | evidence/design-pass/can-du--desktop-1280--light.png |
| can-du | mobile-375 | light | evidence/design-pass/can-du--mobile-375--light.png |
| can-khong-tim-thay | desktop-1280 | light | evidence/design-pass/can-khong-tim-thay--desktop-1280--light.png |
| can-nguoi-xem | desktop-1280 | light | evidence/design-pass/can-nguoi-xem--desktop-1280--light.png |
| can-roi-danh-sach | desktop-1280 | light | evidence/design-pass/can-roi-danh-sach--desktop-1280--light.png |
| can-thieu | desktop-1280 | light | evidence/design-pass/can-thieu--desktop-1280--light.png |
| sheet-can-xac-minh | desktop-1280 | light | evidence/design-pass/sheet-can-xac-minh--desktop-1280--light.png |
| sheet-cloud | desktop-1280 | light | evidence/design-pass/sheet-cloud--desktop-1280--light.png |
| sheet-cung | desktop-1280 | dark | evidence/design-pass/sheet-cung--desktop-1280--dark.png |
| sheet-cung | desktop-1280 | light | evidence/design-pass/sheet-cung--desktop-1280--light.png |
| sheet-cung | mobile-375 | light | evidence/design-pass/sheet-cung--mobile-375--light.png |
| sheet-cung-trong | desktop-1280 | light | evidence/design-pass/sheet-cung-trong--desktop-1280--light.png |
| sheet-du | desktop-1280 | dark | evidence/design-pass/sheet-du--desktop-1280--dark.png |
| sheet-du | desktop-1280 | light | evidence/design-pass/sheet-du--desktop-1280--light.png |
| sheet-du | mobile-375 | light | evidence/design-pass/sheet-du--mobile-375--light.png |
| sheet-nguoi-xem | desktop-1280 | light | evidence/design-pass/sheet-nguoi-xem--desktop-1280--light.png |
| sheet-thieu | desktop-1280 | light | evidence/design-pass/sheet-thieu--desktop-1280--light.png |

## Cảnh ngữ-cảnh

- Không cần: bản mẫu nhúng trong shell Ops thật, menu bên và đường dẫn đều chạy.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Dải ảnh 96 px quá nhỏ để biết căn: thêm lưới ảnh lớn cho trang một căn, thẻ duyệt giữ dải cũ.
- Nút gọi rơi xuống dưới màn hình: đưa «Gọi ai» lên trước «Ở đâu».
- Vai Người xem để trống cả cột trái: bỏ bố cục hai cột khi không có ảnh và chữ.
- Khung có lề đôi: bỏ lề tự thêm trong khung.
- Ô «Chưa có ảnh» lệch so với ảnh ở thẻ bên: kéo lên sát mép thẻ như ảnh.
- Mạnh chê lưới thẻ cho người vận hành: thay bằng bảng cộng sheet, 9 căn trọn màn so với 3 (`phuong-an.md`).
- Sheet thiếu mục so với trang: thêm đủ thông tin căn, tin, người đăng; Mạnh yêu cầu.
- Mạnh yêu cầu căn cùng tiêu chí: thêm tab so sánh, đầu sheet ghim giá để đổi tab vẫn thấy căn đang xem.
- Bản đầu xếp căn cần xác minh lên đầu, trái ON11: về đúng thứ tự `dealsSql`.
- Ở 375 px mức giảm phải cuộn ngang mới thấy: đưa vào dưới giá, ẩn cột Giảm.
- Đóng sheet mất dấu chỗ đang duyệt: hàng vừa xem giữ nền chọn.
- Giá ghi `5.2 tỷ`: đổi sang `fmtCompact` thành `5,2 tỷ` theo chuẩn chữ của kho; danh sách trống đổi sang `ui/empty` có hành động.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- `ui/sheet` luôn vẽ lớp phủ, nên sheet che bảng và không bấm được bảng khi đang mở. Muốn khác phải sửa mã vendor; đề xuất giữ nguyên, J, K và tab cùng tiêu chí bù phần này.
