# Hình tại điểm quyết định — test-khong-prune-worktree

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 gộp selftest hook vào hàng (T3) hay tách hàng T3 riêng | 2 nhánh rẽ | `hoi-1-gop-hay-tach` |
| d-2 gỡ theo gitdir thay vì prune | dưới ngưỡng: 1 lối sống | — |

## hoi-1-gop-hay-tach — đề bài
- Loại: cây quyết định hai nhánh (disposition / solution tree).
- Gốc: «Soát toàn kho thấy 2 chỗ prune kho dùng chung» — nút con: «zalo-import-job-lan.test.mjs: prune chỉ khi gỡ lỗi (T2)» và «selftest hook typecheck-changed: prune MỖI lần chạy, chạy ở mọi lượt ghim lại ui-standards-reui (đường T3)».
- Nhánh A «Gộp (khuyến nghị)»: một PR, T3, Mạnh ký 3 cổng (Phạm vi · 1.5 · Bằng chứng); cả hai chỗ hết prune khi merge.
- Nhánh B «Tách»: PR này T2 làn V (zalo) — hàng T3 mới cho selftest, vẫn 3 cổng; prune vô điều kiện chạy tiếp tới khi hàng sau merge.
- AC liên quan: AC-1 (soát), AC-5 (cleanup selftest).
