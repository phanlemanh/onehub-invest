---
slug: phat-bieu-va-phan-xu
at: 2026-10-26T15:50:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | E1 áp 045 thật vào DB local trước cắt chuyển mà sổ không có dòng nào | apply_enrichment bản mới gọi phân xử khi chưa có legacy → đường/WC/toà không đỡ về NULL rồi lên cloud | Dòng sổ có tên + ca: DB đã áp 045, chưa cắt chuyển, gọi apply_enrichment → ô giữ nguyên hoặc từ chối có thông điệp ghim | fixed: cổng «phân xử: chưa cắt chuyển» trong resolve_offer_fields (AC-8 bullet cổng, E15 ma trận 4 đường × 2 assert); sổ d-19 (mot-loi, kho_dao false — cổng loại bỏ đường mất ô); design §3.3 |
| P1 | design | Không có rào thứ tự giữa cắt chuyển thật và lượt transform đêm đầu sau merge | transform-chotot mới phân xử cả nguồn trước khi ai chạy cắt chuyển → mất ~13,5 nghìn ô | Ca: transform trên DB đã áp 045 thiếu audit cắt chuyển → exit ≠ 0 thông điệp ghim; đối chứng có audit | fixed: cùng cổng (E15 gồm runTransformChotot); design §3.3 ghi thứ tự triển khai pull → cắt chuyển → lượt đêm |
| P1 | evals | E12/E14 so bảng đếm, mốc chụp sau cắt chuyển nên so gần tự đúng [do-khu-vuc-tu-dung-moi#F1] | Cắt chuyển đổi giá trị mà giữ số ô → bảng đếm bằng nhau, «lệch 0» | Mốc từng ô (offer_id, trường, giá trị) trước cắt chuyển; đối chứng legacy mang giá trị khác | fixed: AC-7/AC-8 so từng ô với mốc trước cắt chuyển, chỉ trừ danh sách ô S05 khai trước; E12, E14 sửa; E13 thêm đối chứng legacy-khac |
| P1 | evals | Actor 'hitl:thu' viết tay khớp khuôn bên đọc; không ca nào round-trip actor từ chỗ gọi thật [auth-error-thu-lai-retry#F2] | Đường quyết định người truyền actor khác tiền tố → quyết định người thành observed, thua parser | Ma trận chỗ gọi viết trước, actor đọc từ chính mã gọi; chỗ gọi mới ngoài tập thì đỏ | fixed: AC-6 bullet ma trận chỗ gọi; E22 mới (đọc tiền tố actor ở chính tệp gọi, 3 chỗ hôm nay; đối chứng đổi vai route decide) |
| P1 | evals | Bộ quét AC-5 bỏ migration cũ, .sql, .sh, SET nhiều dòng, alias | Hàm SQL đời cũ hoặc transform .sql vẫn ghi thẳng năm cột mà quét báo 0 | Quét pg_proc sau 045 (tập rỗng ngoài resolve_offer_fields) + ma trận đối chứng 6 dạng | fixed: AC-5 thêm pg_proc + ma trận 6 phần tử; E9 sửa (đối chứng .mjs/.ts/.sql/.sh/nhiều dòng/alias, đúng 6 dòng đỏ) |

Hai lỗ nhẹ critic nêu ngoài cap: (1) Timebox trống ở opportunity.md → fixed: một vòng, tối đa 3 lượt chấm; (2) kiểm
mồ côi AC-4 chỉ đo provenance có mặt, không đo giá trị ô = giá trị phát biểu được trích → deferred: AC-7 so từng ô
với mốc sau dựng lại phủ phần này (ô lệch giá trị thì dung-lai đỏ).
