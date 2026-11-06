# Kế hoạch: dau-luoc-do-ban-mau

Hợp đồng: `_acceptance/dau-luoc-do-ban-mau/contract.md` · thiết kế: `docs/superpowers/specs/2026-11-06-dau-luoc-do-ban-mau-design.md`. T2, tuần tự.

## Task 1 — câu dấu mới và chế độ `--dau` (independent: false)

- Files: `db/dau-luoc-do.sql` (mới), `db/db-thu.sh`.
- Làm: chuyển câu dấu ra tệp, phủ đủ nhóm của thiết kế; `dau_chung` gọi `docker exec -e PGOPTIONS=…read_only=on`; chế độ `bash db/db-thu.sh --dau` in
  `chi_doc=<…>` rồi dấu.
- Verify: `node --test --test-name-pattern='^DT-' scripts/db-thu.test.mjs` xanh; `bash db/db-thu.sh --dau` trên máy in `chi_doc=on` và 32 hex.
- Phục vụ: E8, E8b.

## Task 2 — ma trận test DL- trên Postgres thật (independent: false, sau task 1)

- Files: `scripts/db-thu.test.mjs`.
- Làm: ma trận viết trước (DDL · AC · «câu cũ: bắt|sót»), lược đồ mẫu, đo ba điểm, câu cũ chép trong test, hai đột biến, kiểm kết nối và xoá DB; ca DL-AC-8 trên
  docker giả đọc argv; đối chứng bỏ cờ.
- Verify: `node --test --test-name-pattern='^DL-' scripts/db-thu.test.mjs` xanh; phá thử: tạm dùng câu cũ cho câu mới → các ca DL-AC-1..6 đỏ với thông điệp ghim.
- Phục vụ: E1–E7, E8, E9.

## Task 3 — probe dấu DB chung (independent: false, sau task 1)

- Files: `_acceptance/dau-luoc-do-ban-mau/probes/dau-chung.mjs`.
- Làm: chạy `--dau` hai lần, đo ms, kiểm `chi_doc=on`; đối chứng bản chép script bỏ cờ trong thư mục tạm phải ra `off`.
- Verify: `node _acceptance/dau-luoc-do-ban-mau/probes/dau-chung.mjs` thoát 0.
- Phục vụ: E8b.
