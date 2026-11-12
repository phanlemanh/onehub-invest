# dbv-itest xanh lại trên main — kế hoạch

**Spec:** `docs/superpowers/specs/2026-11-12-dbv-itest-xanh-lai-tren-main-design.md` · hợp đồng `_acceptance/dbv-itest-xanh-lai-tren-main/`.

Hai task, tuần tự (cùng một tệp), `independent: false`.

### Task 1: fixture vùng theo luật một tỉnh — phục vụ E2, E3, E5(a)
- Files: `pipeline/scripts/danh-ba-vat-the.itest.mjs` (`napFixture`)
- Chèn trước hai thị trường `q-m1` (`admin_code` 01), `q-m2` (79), rồi `q-p1` (cha `q-m1`), `q-p2`, `q-p3` (cha `q-m2`). `area_ids` các nút không đổi.
- Verify: `node --test --test-concurrency=1 --test-name-pattern="DBV-AC-3" pipeline/scripts/danh-ba-vat-the.itest.mjs` xanh.

### Task 2: DB dừng ở 082 cho phép đo lũy đẳng — phục vụ E1, E3, E5(b)
- Files: cùng tệp (`before`, `after`, DBV-AC-1)
- `TEN_082 = ${TEN}_082`, `taoDbThu(TEN_082, { hetSo: 82 })` trong `before`, xoá ở `after`; DBV-AC-1 đo `dau(db082)` quanh `apTep(TEN_082, …)`.
- Verify: cả tệp 18/18; `probes/giu.mjs` PASS; `probes/doi-chung.mjs` PASS.
