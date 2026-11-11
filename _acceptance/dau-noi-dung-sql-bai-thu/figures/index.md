# Hình tại điểm quyết định — dau-noi-dung-sql-bai-thu (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1: định nghĩa bài thử ở mã hay hàm SQL qua migration | 2 nhánh rẽ → cần hình | `hoi-1-hai-loi.html` |
| d-4: số «Bài nhận» trên Ops đổi sau gộp | dưới ngưỡng: 1 bước | — |
| Các dòng descope (coverage-scan, design-pass, đặc-tả-UX) | dưới ngưỡng: 0 nhánh | — |

## Đề bài hình `hoi-1-hai-loi`

- Loại: so sánh hai lối (hai cột cạnh nhau), cùng một nguồn ở trên: `test-posts.mjs` (testMarker, regex JS).
- Lối A (máy khuyên): hằng `NOI_DUNG_SQL` trong `test-posts.mjs` → `ops-flow.mjs` và `test-data-residue.mjs` dùng hằng; `600_data_flow.sql` và
  `app collections-queries.ts` chép chữ; một ma trận khớp canh cả bốn bản. Giá: không DDL, một vòng T2.
- Lối B: hàm SQL `is_test_post()` qua migration mới → cả bốn chỗ gọi hàm. Giá: thêm DDL, áp DB máy thu là bước triển khai riêng có sao lưu.
- Nhãn bằng chữ tiếng Việt; AC liên quan: AC-1.
