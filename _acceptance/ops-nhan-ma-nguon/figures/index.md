# Hình tại điểm quyết định — ops-nhan-ma-nguon (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — ngưỡng payload đo giá trị hay cả khoá JSON | hai nhánh rẽ (giá trị · cả khoá) → cần hình | `hoi-1-payload.html` |
| Nền đỏ — `ui_check` thiếu `design-scan.js` (lỗi kit) | một nhánh (ghi nhận, đã descope ui-observed) → dưới ngưỡng: 1 | — |
| Sổ S1 máy đã quyết (11 dòng) | mỗi dòng một lựa chọn, không rẽ → dưới ngưỡng: 1 | — |

## Đề bài hình `hoi-1-payload`

- Loại hình: luồng rẽ hai nhánh (flowchart ngang).
- Nút: «push-ops-facts dựng payload» → «Thước AC-4 quét» → rẽ: (A) «chỉ GIÁ TRỊ chuỗi — khoá zaloGroups/zaloFlow/zaloAccounts giữ nguyên» → «vòng ON7 xong; NT2 quyết khoá» ; (B) «cả KHOÁ JSON» → «đổi khoá + bộ đọc nhận cả khoá cũ lẫn mới» → «deploy app Vercel và máy thu cùng lúc».
- Nhãn: nhánh A ghi «máy khuyên», nhánh B ghi «thêm 1 ca giao thời».
- AC liên quan: AC-4. Không ghi tên nguồn thật nào (dùng mã S03).
