# Hình tại điểm quyết định — ui-clean-b1-ops (Cổng Phạm vi)

Ngưỡng N5: từ ba bước nối tiếp hoặc từ hai nhánh rẽ (không tính câu có/không một bước).

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 che chữ tầng A trong ảnh | 1 bước, có/không | dưới ngưỡng: 1 |
| Hỏi-2 bộ lệnh chạy mỗi lượt chấm | 1 bước, chọn tập lệnh | dưới ngưỡng: 1 |
| Hỏi-3 phiên đăng nhập để chụp | 1 bước, hai lối không rẽ tiếp | dưới ngưỡng: 1 |
| Hỏi-4 mở lại phiên cho MCP reui | 1 bước, có/không | dưới ngưỡng: 1 |
| Hỏi-5 shell Ops + trang → block (4 shell ứng viên, 7 trang) | ≥4 nhánh | cần hình: `thumbs-shell.png`, `thumbs-devops.png`, `thumbs-agents-aiops.png` (ảnh chính chủ) + `b1-ops-trang-vung.png` |
| Hỏi-6 khoá cài block Pro | 1 bước, hai lối | dưới ngưỡng: 1 |
| Bỏ design-pass → duyệt UI bằng chữ | 6 nhánh trang | cùng hình `b1-ops-trang-vung.png` |

## Đề bài hình `b1-ops-trang-vung` (bản 2 — sau chỉ đạo dùng block Solutions)

- Loại hình: sơ đồ khối (wireframe thô) — dải trên cùng là shell Ops (sidebar nhóm Giám sát / Xử lý / Quản trị + Thư viện, chuyển thể app-shell-36; ghi chú Invest giữ app-shell-30), dưới là 6 cột trang, khối xếp trên → dưới theo vùng.
- Nút: tên vùng + block nguồn (dev-ops-5, dev-ops-6, dev-ops-1, ai-ops-2, agents-5, InsightGrid, StatTiles, PageHeader, AlertDialog). Cột Chất lượng ghi rõ "không block Solutions — giữ InsightGrid/StatTiles".
- Nhãn tiếng Việt theo bảng mục 3 của design; tô nổi hai chỗ sửa lỗi bố cục (Thu thập, Chất lượng) và đánh dấu Hàng chờ duyệt "làm sau khi enrich vào main".
- AC liên quan: AC-3, AC-4, AC-5, AC-6, AC-9.
- Nguồn: `docs/superpowers/specs/2026-10-23-ui-clean-b1-ops-design.md` mục 2a, 2b, 3.
