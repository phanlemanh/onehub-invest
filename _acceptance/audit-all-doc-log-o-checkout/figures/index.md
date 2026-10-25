# Hình tại điểm quyết định — audit-all-doc-log-o-checkout (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Luật gốc log (sổ thay d-1, d-2) + Hỏi-1 (ca rơi về cây đang chạy) | 2 nhánh rẽ (tìm được / không tìm được checkout chính) + 3 bước nối tiếp (hỏi git → chọn gốc → đọc log) → cần hình | `goc-log.html` / `goc-log.png` |
| Bỏ ops-local/push-ops-facts, bỏ design-pass, đặc tả UX, ui-observed | dưới ngưỡng: mỗi điểm một lựa chọn không nối bước | — |
| Smoke dùng HOME tạm | dưới ngưỡng: một lựa chọn | — |

## Đề bài `goc-log`

- Loại: sơ đồ luồng (flowchart) trái → phải, một nút quyết định.
- Nút: «Cây đang chạy (worktree hoặc checkout chính)» → «Hỏi git: thư mục git chung» → quyết định «Tên `.git` và còn tồn tại?»
  → nhánh Có: «Gốc log = checkout chính» → «Đọc pipeline/logs ở checkout chính» → «Audit / trang Ops hiện số thật»;
  nhánh Không (git lỗi, kho trần, checkout chính đã dời): «Gốc log = chính cây» → «Log trống?» → «Dòng LIMITED ghi đường đã đọc (Hỏi-1, khuyến nghị)».
- Ghi chú dưới hình: ở checkout chính, thư mục git chung là `<cây>/.git` nên gốc log trùng cây.
- AC liên quan: AC-1, AC-3, AC-4, AC-5.
