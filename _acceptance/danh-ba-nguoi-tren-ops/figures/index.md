# Hình tại điểm quyết định — danh-ba-nguoi-tren-ops

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 ngưỡng nhãn suy luận | dưới ngưỡng: một con số, 0 bước nối tiếp, 0 nhánh rẽ | — |
| Hỏi-2 phân trang (cũng là gap-probe P0 human-gate1) | 2 nhánh rẽ (hai cách người vận hành tới một người ít tin) | phan-trang.html |
| bỏ design-pass (descope) | dưới ngưỡng: 1 bước | — |

## Đề bài phan-trang

- Loại hình: luồng hai nhánh song song (flowchart ngang).
- Nút chung: «Mở /ops/people» → «Lọc nguồn S06 (9.411 người)».
- Nhánh A «Phân trang máy chủ (khuyến nghị)»: «Trang 1/95 — 100 người nhiều tin nhất» → «Trang sau … Trang 95» → «Thấy cả người 1 tin».
- Nhánh B «Cắt 500»: «500 người nhiều tin nhất, sắp/lọc tức thì» → «Người thứ 501+ (73% có ≤ 2 tin)» → «Chỉ tới bằng ô tìm khi đã biết tên».
- AC liên quan: AC-3.
