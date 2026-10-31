# Mã thị trường vùng mới S06 (tạm ở app) — kế hoạch thi công

> Phương thức: tuần tự trong phiên (Native). T2 — làn V.

**Goal:** /ops gọi đúng tên thị trường vùng mới S06 khi `areas` còn mã dài; ON12-AC-7 xanh trên main.
**Spec:** `docs/superpowers/specs/2026-10-31-khu-vuc-vung-moi-s06-design.md` · hợp đồng + E1–E4.

### Task 1: marketNameOf tra mã dài (E1, E2) — independent: true
**Files:** `app/src/lib/market-names.ts`, `app/tests/ma-thi-truong-dai.test.tsx`, `_acceptance/khu-vuc-vung-moi-s06/rang/on12-tien-de.mjs`.
- [x] Sau `code`, `vn-<mã>` thử `vn-thanh-pho-<mã>`, `vn-tinh-<mã>`; bỏ tiền tố `vn-` của mã vào trước khi thử.
- [x] Test ma trận 12 mã + hai chiều đỏ (bỏ tra mã dài, đảo thứ tự); tiền đề E2 đếm ảnh chụp S06.

### Task 2: suite
- [x] `cd app && npm test` 760/760; tsc + lint 0 lỗi.
