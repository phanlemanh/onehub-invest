---
slug: gan-nhan-theo-nhom-s03
at: 2026-11-04T09:50:00Z
route: http://localhost:3460/ops/labels/proto/d
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-2 (ban-bam-duoc)
options:
  - A khuôn PL7 nối thêm trường
  - B khuôn @reui/form-2
  - C vẽ tay
  - D kết hợp
divergence: Mạnh yêu cầu dựng ba cách và so; máy thêm D
ds_skill: onehub-ui
states: [da-dien, bai-dai, luot-hai, thieu-ly-do]
breakpoints: [mobile-390, desktop-1440]
themes: [light, dark]
patched: 6
deferred: 2
---
# design-pass — gan-nhan-theo-nhom-s03

Bốn bản thử dựng trên shell thật, thành phần thật, dữ liệu giả, không đụng DB. Mạnh chọn bản D 04/11. Ảnh và số đo: `figures/so-sanh-bon-cach.html`.

## Ma trận chụp

| Trạng thái | 1440 sáng | 1440 tối | 390 |
|---|---|---|---|
| Đã điền | figures/ban-d-sang.png | | figures/ban-d-390.png |
| Bài dài | | figures/ban-d-toi-bai-dai.png | |
| Lượt hai | figures/ban-d-luot-hai.png | | |

## Findings

Người chấm giấu tên xếp D, B, C, A (16, 16, 12, 13 điểm trên 20; D thắng B vì lỗi còn lại sửa được ở lớp hiển thị).

Đã sửa ở bản D: nền đã chọn; chú giải căn cứ; bài gốc thường, dính đầu, gấp sau ba dòng; nút Lưu dính chân; Lý do trong biểu mẫu; ô không suy ra được bỏ trạng thái chọn của căn cứ.

Để lại: phím tắt chọn căn cứ (đợi số phút thật); «Loại hình» vẫn xuống hai dòng ở 1440. Bản D sau khi sửa chưa được chấm lại độc lập.
