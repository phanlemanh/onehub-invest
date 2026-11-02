---
slug: can-gia-tot-biet-can
at: 2026-11-03T06:00:00Z
route: http://localhost:3460/ops/deals
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem-the)
options:
divergence: skipped — khuôn danh sách và trang chi tiết đã có ở /ops/people; hướng hộp thoại và nhồi vào thẻ đã loại ở thiết kế vì không có đường dẫn riêng cho CG5
ds_skill: onehub-ui
states: [ds-du, ds-trong, ds-nguoi-xem, can-du, can-thieu, can-can-xac-minh, can-roi-danh-sach, can-nguoi-xem, can-cloud, can-khong-tim-thay]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 6
deferred: 0
---
# design-pass — can-gia-tot-biet-can

Bản mẫu chạy trên route thật bằng dữ liệu bịa (số 0900 000 001, tên «Người Bán Mẫu», ảnh là ô màu), không đọc DB thật. Mã
bản mẫu không commit, giữ ở `evidence/design-pass/ban-mau.patch`; S3 thay dữ liệu mẫu bằng loader thật.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| ds-du | desktop-1280 | light | evidence/design-pass/ds-du--desktop-1280--light.png |
| ds-du | mobile-375 | light | evidence/design-pass/ds-du--mobile-375--light.png |
| ds-trong | desktop-1280 | light | evidence/design-pass/ds-trong--desktop-1280--light.png |
| ds-nguoi-xem | desktop-1280 | light | evidence/design-pass/ds-nguoi-xem--desktop-1280--light.png |
| can-du | desktop-1280 | light | evidence/design-pass/can-du--desktop-1280--light.png |
| can-du | desktop-1280 | dark | evidence/design-pass/can-du--desktop-1280--dark.png |
| can-du | mobile-375 | light | evidence/design-pass/can-du--mobile-375--light.png |
| can-thieu | desktop-1280 | light | evidence/design-pass/can-thieu--desktop-1280--light.png |
| can-can-xac-minh | desktop-1280 | light | evidence/design-pass/can-can-xac-minh--desktop-1280--light.png |
| can-roi-danh-sach | desktop-1280 | light | evidence/design-pass/can-roi-danh-sach--desktop-1280--light.png |
| can-nguoi-xem | desktop-1280 | light | evidence/design-pass/can-nguoi-xem--desktop-1280--light.png |
| can-cloud | desktop-1280 | light | evidence/design-pass/can-cloud--desktop-1280--light.png |
| can-khong-tim-thay | desktop-1280 | light | evidence/design-pass/can-khong-tim-thay--desktop-1280--light.png |

## Cảnh ngữ-cảnh

- Không cần: bản mẫu nhúng trong shell Ops thật, menu bên và đường dẫn đều chạy.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Dải ảnh 96 px quá nhỏ để biết căn: thêm lưới ảnh lớn cho trang một căn, thẻ duyệt giữ dải cũ.
- Nút gọi rơi xuống dưới màn hình: đưa «Gọi ai» lên trước «Ở đâu».
- Vai Người xem để trống cả cột trái: bỏ bố cục hai cột khi không có ảnh và chữ.
- Khung có lề đôi: bỏ lề tự thêm trong khung.
- Ô «Chưa có ảnh» lệch so với ảnh ở thẻ bên: kéo lên sát mép thẻ như ảnh.
- Giá ghi `5.2 tỷ`: đổi sang `fmtCompact` thành `5,2 tỷ` theo chuẩn chữ của kho; danh sách trống đổi sang `ui/empty` có hành động.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Không có.
