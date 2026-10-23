---
paths:
  - "app/src/components/**"
  - "app/src/app/**"
---

# Giao diện (UI)

- Trước khi sửa UI nạp skill `reui` rồi `onehub-ui` (`.claude/skills/onehub-ui/`), kể cả khi `acceptance-gate:ux-ui-craft` kích hoạt trước.
- Thẩm quyền: ReUI > onehub-ui > ux-ui-craft; xung đột thì theo bên trái.
- Route map, danh mục block, màu dữ liệu, chữ VN, vòng làm việc: xem `onehub-ui/SKILL.md`.
- `cd app && npm run lint` phải sạch (có luật `onehub-ui`); không thêm `eslint-disable` trần.
- Không dùng `eslint --suppress-all` / `--suppress-rule` để làm xanh lint: CI chặn khi baseline tăng; sửa vi phạm hoặc dùng ngoại lệ có lý do.
- Sửa xong phải nhìn: chạy preview, chụp ảnh sáng/tối + hẹp, đối chiếu `onehub-ui/loop.md`.
