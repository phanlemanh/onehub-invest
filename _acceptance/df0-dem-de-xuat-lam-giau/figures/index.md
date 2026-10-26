# Hình tại điểm quyết định — df0-dem-de-xuat-lam-giau

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — đếm mọi đề xuất chờ hay bỏ tuyến review | 2 nhánh rẽ → cần hình | `hoi-1.html` / `hoi-1.png` |
| Dòng đỏ nền hạ tầng (thiếu design-scan.js) | 1 dòng, không rẽ → dưới ngưỡng: 1 | — |
| Gap-probe P0 human-gate1 | trùng Hỏi-1 | — |

## Đề bài hình hoi-1

- Loại hình: nhánh rẽ (solution tree / so sánh hai lối), một khung.
- Nút: «Đề xuất làm giàu đang chờ (queued)» tách theo tuyến: tự áp (direct), có chứng (corroborated), cần duyệt (review — đã có thẻ ở Hàng duyệt).
- Nhánh A (máy khuyên): đếm cả ba tuyến → «N đề xuất làm giàu» = quy mô hàng đợi; thẻ chờ duyệt đếm riêng (đơn vị thẻ).
- Nhánh B: bỏ tuyến review → số nhỏ hơn, không trùng với «thẻ chờ duyệt»; thêm một điều kiện tuyến phải đo.
- AC liên quan: AC-1 (fixture phủ mọi tuyến), AC-5 (thẻ chờ duyệt giữ nguyên).
