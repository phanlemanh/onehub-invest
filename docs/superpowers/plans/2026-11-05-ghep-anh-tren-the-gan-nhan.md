# Ghép ảnh trên thẻ gắn nhãn — kế hoạch

**Mục tiêu:** thẻ gắn nhãn hiện tin chữ cùng cả cụm ảnh đã ghép bằng `ganBaiAnh`. **Thiết kế:** `docs/superpowers/specs/2026-11-05-ghep-anh-tren-the-gan-nhan-design.md`.

## Task 1: ghép và ghi cột (E1, E2) — independent: false
Tệp: `db/migrations/076_labels_ghep.sql`, `pipeline/lib/gop-anh.mjs` (thêm `soChuGan`), `pipeline/lib/ghep-mau.mjs`, `pipeline/label-ghep.mjs`, `pipeline/label-sample.mjs`, `pipeline/scripts/label-ghep.test.mjs`. Kiểm: `cd pipeline && node --test scripts/label-ghep.test.mjs`.

## Task 2: đọc cụm ở app (E3, E4, E6, E7, E9, E10) — independent: false
Tệp: `app/src/lib/labels-anh.ts`, `app/src/lib/labels-cum.ts`, `labels-queries.ts`, `labels-luot-hai.ts`, `labels-normalize.ts`, `ops/zalo-media.ts`, `app/tests/labels-ghep.test.ts`. Kiểm: `cd app && node --import tsx --test tests/labels-ghep.test.ts`.

## Task 3: giao diện (E5, E8) — independent: false
Tệp: `anh-bai.tsx`, `label-form-nhom.tsx`, `labels-view.tsx`, `luot-hai.tsx`, `CONTEXT.md`. Kiểm: `npx tsc --noEmit`, eslint, tự chạy bản 3463.

## Task 4: phép đo (E2, E4, E7, E9, E10, E11, E12) — independent: false
Tệp: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/{_db,seed,nap,that,kin}.mjs`, `mau-bam.txt`.
