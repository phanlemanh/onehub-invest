# Hình tại điểm quyết định — ui-clean-b1-ops (Cổng Phạm vi)

Ngưỡng N5: từ ba bước nối tiếp hoặc từ hai nhánh rẽ (không tính câu có/không một bước).

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 che chữ tầng A trong ảnh | 1 bước, có/không | dưới ngưỡng: 1 |
| Hỏi-2 suite_keys | 1 bước, chọn tập lệnh | dưới ngưỡng: 1 |
| Hỏi-3 phiên đăng nhập để chụp | 1 bước, hai lối không rẽ tiếp | dưới ngưỡng: 1 |
| Hỏi-4 mở lại phiên cho MCP reui | 1 bước, có/không | dưới ngưỡng: 1 |
| Bỏ design-pass → Cổng Phạm vi duyệt UI bằng chữ (6 trang × 3–9 vùng) | 6 nhánh trang, mỗi nhánh ≥3 vùng nối tiếp | cần hình: `b1-ops-trang-vung.html` |

## Đề bài hình `b1-ops-trang-vung`

- Loại hình: sơ đồ khối (wireframe thô) — 6 cột, mỗi cột một trang Ops, khối xếp trên → dưới theo thứ tự vùng.
- Nút: tên vùng + khuôn dùng (PageHeader, InsightGrid, StatTiles, Frame, OpsSection, AlertDialog/Dialog).
- Nhãn: tiếng Việt, đúng bảng mục 3 của design doc; tô đậm hai chỗ sửa lỗi bố cục (collections: hết section lồng header; quality: PageHeader lên đầu).
- AC liên quan: AC-3, AC-4, AC-5, AC-8.
- Nguồn: `docs/superpowers/specs/2026-10-23-ui-clean-b1-ops-design.md` mục 3.
