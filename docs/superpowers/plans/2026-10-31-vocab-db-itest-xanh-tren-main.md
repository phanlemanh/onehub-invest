# vocab-db itest xanh trên main — kế hoạch thi công

> Phương thức: tuần tự trong phiên (Native). T2 — làn V.

**Goal:** `pipeline/scripts/vocab-db.itest.mjs` đo đúng sổ hiện tại, xanh trên main và trên DB đi trước main.
**Spec:** `docs/superpowers/specs/2026-10-31-vocab-db-itest-xanh-tren-main-design.md` · hợp đồng + E1–E4.

### Task 1: bộ rút câu ref_* + CHECK (E1, E2) — independent: true
**Files:** `pipeline/scripts/vocab-db.itest.mjs`.
- [x] Thay `MIG045_REF` bằng `refGiua(tu, den)` (câu cấp ngoài cùng của migration số trong khoảng, theo thứ tự); khúc 044–049 trước
  050, khúc sau 050 sau; VD-IQ-3 nạp khúc sau 050 trước khi đo «043 một mình lệch ở inquiry».
- [x] Rào: số câu `INSERT INTO ref_*` trong tệp khác số câu rút được → ném lỗi nêu tệp.
- [x] `config:executors.test.vocab_db` xanh 7/7 trên :5433; `vocab_db_rieng` xanh trên DB dựng từ migration.

### Task 2: phép đo đối chứng (E3) — independent: true
**Files:** `_acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs`, `_acceptance/config.yaml`.
- [x] Bản 82a53e0a đỏ đủ bốn ca; bản sửa xanh 3/3; tên ca + số assert giống; băm *_chk + số dòng ref_* trước = sau.

### Task 3: suite
- [ ] `cd pipeline && npm test` xanh; contract `implemented`; vào S4.
