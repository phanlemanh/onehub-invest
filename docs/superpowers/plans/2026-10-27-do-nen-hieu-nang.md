# Kế hoạch — do-nen-hieu-nang

Hợp đồng: `_acceptance/do-nen-hieu-nang/contract.md` (T2, Mạnh duyệt Cổng Phạm vi 29/10, Hỏi-1 theo khuyến nghị: HTML phía
server trên build prod, 20 lượt, 5 trang). Thiết kế: `docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md`.

Hàng đo, không đặt luật. Các task 1–4 đã làm trước Cổng Phạm vi (phiên P4 cũ, 27/10) vì thước đo trùng với khuyến nghị mà
Mạnh duyệt; vòng này chỉ kiểm lại trên cây đã gộp `origin/main` rồi vào S4.

| # | Task | Tệp | Kiểm per-task | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Bật `pg_stat_statements`, `max_connections` 200 bằng `ALTER SYSTEM` + `docker restart` sau `pg_dump` | (DB local, không tệp kho) | `node _acceptance/do-nen-hieu-nang/probes/db.mjs` | E1 | true |
| 2 | Script đo 5 trang trên `next start` + tài khoản đo riêng `perf-test@local.test`, reset pg_stat_statements trước làm nóng, che tên nguồn | `scripts/do-nen-hieu-nang/do.mjs` | `bash _acceptance/do-nen-hieu-nang/probes/trang.sh` (cần `cd app && npx next build`) | E2 | false |
| 3 | Ghi số nền: JSON thô + tài liệu (bảng 5 trang, 2 danh sách 10 truy vấn, 15 bảng lớn, giới hạn đo, đề xuất ngưỡng) | `docs/research/do-nen-hieu-nang-2610.{md,json}` | `node _acceptance/do-nen-hieu-nang/probes/tai-lieu.mjs` · `thong-ke.mjs` · `khong-luat.mjs` | E3, E4, E5 | false (sau 2) |
| 4 | Giữ phạm vi | — | `bash _acceptance/do-nen-hieu-nang/probes/pham-vi.sh` | E6 | true |
| 5 | Gộp `origin/main`, build prod lại, chạy lại các lệnh kiểm trên | — | như trên | E1–E6 | false |

Số nền trong tài liệu đo trên build tách từ `origin/main` 1453f30e (27/10) và tài liệu ghi rõ commit đó; lượt chấm S4 chạy
lại `do.mjs` trên build của cây hiện hành để chứng script còn đo đúng trang, không thay số nền.
