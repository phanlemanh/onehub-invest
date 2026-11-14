---
slug: s08-nap-sua
at: 2026-11-14T04:05:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ thay (d-6) ghi máy quyết «CI không đo» trong khi lối mở việc cho làn thu vẫn sống | Không ai mở việc cho làn thu; lần sửa sau làm hỏng nhánh hoãn mà CI xanh | Dòng sổ mới nêu cả hai lối | fixed: dòng sổ mới thay d-6 — ship có tên VÀ gửi việc phụ cho làn thu cấp DB thử trên CI; lối duy nhất bị bỏ (giữ PR chờ CI) chết vì lượt thu 22/11; Notes ghi giới hạn |
| P1 | evals | E1–E3 không loại ca bị SKIP vì thiếu DATABASE_URL | Executor không có DB thử, ca SKIP, eval vẫn thoát 0 | expected đòi pass 1, skipped 0 | fixed: expected E1–E3 đòi dòng tổng tests 1 · pass 1 · skipped 0; thiếu DB thì tệp thoát trước khi khai ca nên tests 0 ≠ 1 |
| P1 | evals | Không eval nào nạp snapshot S08 thật | Khuôn item thật lệch khuôn test, coCatalogS08 dò sai khoá | Eval trên snapshot thật ở máy thu | rejected: bộ dò coCatalogS08 (kind project_catalog) đã có trên main và đang chạy cho boHetS08; bản sửa chỉ dùng lại nó cho nhánh hoãn, không thêm khoá dò mới |
| P2 | contract | Ô (chỉ căn, có 094) ghi «phủ bởi suite» mà không trỏ ca | Đảo coBang094 về sau làm snapshot chỉ căn bị hoãn khi có 094 | Gọi tên nhánh hoặc thêm ca | fixed: Coverage gọi tên nhánh coS08DanhMuc && coBang094, dòng mã không đổi ở hồ sơ này, ghi rõ không thêm ca đo |
