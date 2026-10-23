# Hình tại điểm quyết định — ui-clean-b3-charts (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 bảng màu A (theo nghĩa) vs B (giữ sắc block) — d-20261022T225936Z-1 | 2 nhánh rẽ → cần hình | `bang-mau.html` / `.png` |
| Hỏi-2 suite_keys — d-20261022T225936Z-2 | 2 nhánh rẽ → cần hình | `suite-keys.html` / `.png` |
| Hỏi-3 danh sách miễn 3:1 — d-20261022T230514Z-9 | 2 nhánh rẽ → cần hình | `bang-mau.html` / `.png` (thẻ MIỄN + tỉ lệ từng khoá) |
| d-…-4 ngoại lệ 3 disable "nguyên bản chart-6" | 1 bước, 0 nhánh mở → dưới ngưỡng: 1 | — |
| d-…-7 bỏ design-pass | 1 bước → dưới ngưỡng: 1 | — |

## Đề bài `bang-mau`

- Loại hình: bảng so sánh hai cột (A khuyên | B), mỗi cột hai dải nền (sáng #fff-card, tối card tối) với ô màu từng khoá + tỉ lệ tương phản.
- Nút: khoá revenue, occupancy, adr, revpar, expenses, margin, share1–3, rest, hatch; A theo bảng §4 design doc; B = teal-600/400, amber-600/400, sky-600/400, violet-500/400, indigo-500/400 (pnl), slate-300/600, emerald-600/400, violet-700/500·500/400·300/300, zinc.
- Nhãn bằng chữ: "Doanh thu: chàm ở cả 3 biểu đồ (A) / teal–violet–chàm (B)"; đánh dấu ô dưới 3:1.
- Kèm 2 cặp ảnh thật: evidence/before/ward-performance-light.png ↔ evidence/proto-a/ward-performance-light.png; evidence/before/market-mix-dark.png ↔ evidence/proto-a/market-mix-dark.png.
- AC liên quan: AC-1, AC-2, AC-3, AC-9.

## Đề bài `suite-keys`

- Loại hình: hai nhánh. Nhánh khuyên `[test.app, test.ui_lint_rules]` (tsc+lint app; RuleTester plugin onehub-ui) → mỗi lượt S4 ~1–2 phút. Nhánh khác: thêm collector/pipeline/agent → chắc hơn cho kho, chậm hơn, không liên quan đợt UI.
- AC liên quan: AC-6.
