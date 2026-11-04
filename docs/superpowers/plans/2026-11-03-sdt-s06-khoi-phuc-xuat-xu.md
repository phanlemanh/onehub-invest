# Kế hoạch: khôi phục xuất xứ số S06 từ stg

Thiết kế: `docs/superpowers/specs/2026-11-03-sdt-s06-khoi-phuc-xuat-xu-design.md`. Hợp đồng: `_acceptance/sdt-s06-khoi-phuc-xuat-xu/contract.md`. Các task làm tuần tự, không task nào `independent`.

## Task 1: test đỏ
- Files: `pipeline/scripts/gan-sdt-s06.test.mjs` (chỉ thêm dòng).
- Verify: `node --test pipeline/scripts/gan-sdt-s06.test.mjs`, các ca KP đỏ, các ca GS xanh.
- Phục vụ: E1–E7, E8a, E11. `independent: false`.

## Task 2: bộ gán
- Files: `pipeline/gan-sdt-s06.mjs`, `pipeline/transform-chotot.mjs`.
- Việc: hai nhánh CASE trong `muc`, `cac_so` trong `tk_so`, số đếm `khoi_phuc`, `khong_ro`; `dongGan` dùng ở `--thu`, `chayThat`; thêm hai số vào log.
- Verify: `node --test pipeline/scripts/gan-sdt-s06.test.mjs`, `node pipeline/gan-sdt-s06.mjs --thu`.
- Phục vụ: E1–E8b, E10, E11. `independent: false`.

## Task 3: tài liệu và ranh giới
- Files: `pipeline/CLAUDE.md`, `docs/ROADMAP.md`.
- Verify: `bash _acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh`.
- Phục vụ: E9. `independent: false`.
