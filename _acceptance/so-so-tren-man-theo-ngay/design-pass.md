---
slug: so-so-tren-man-theo-ngay
at: 2026-11-18T08:50:00Z
route: http://localhost:3462/ops/data-flow
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem — ảnh trạng thái × khổ ở evidence/design-pass/)
options:
divergence: skipped — vùng là một dải ô trong trang Dashboard grid đã có, khuôn và họ khung đã chốt ở thiết kế
ds_skill: onehub-ui
states: [ST-somoc-loading, ST-somoc-empty, ST-somoc-motngay, ST-somoc-du, ST-somoc-dungyen]
breakpoints: [mobile-390, desktop-1440]
themes: [light, dark]
patched: 3
deferred: 3
---
# design-pass — so-so-tren-man-theo-ngay

Phiên xem màn riêng chụp trên DB thử, số các ngày trước là số chèn tay. Nhận xét và ảnh: `evidence/design-pass/nhan-xet.md`.

Đã sửa: gợi ý rê chuột dùng định dạng số Việt Nam, chấm đáy không bị cắt, trục có ngày đầu và cuối kèm khoảng số của đường.

Giữ nguyên: rê chuột vào ngày trống không có gợi ý, «Toàn kho» vẽ 30 ngày, cờ xuống dòng ở khổ 1.280px.

Chưa xem trên màn thật: trạng thái lỗi kèm nút «Thử lại», phủ bằng test dựng màn của AC-8.

Chưa đo đúng: dòng «không cuộn ngang» trong `evidence/design-pass/nhan-xet.md` chỉ đo `document`, còn vùng cuộn thật của cổng Ops là khung trang. Ảnh 390px không thấy tràn; số đo đúng thuộc E10 của lượt chấm.
