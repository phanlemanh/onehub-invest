# DO1 giữ dấu ngày lập mốc — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make DO1 treat a baseline day (lap-moc or doi-thang) as a baseline day for every run that day, add a repair command for a past scale-change day, and make TB-AC-11 runnable on a DB copy that already has 087.

**Architecture:** In `pipeline/do-hang-ngay.mjs`, a pure ordering function picks the day's label from (existing marker, unit table state, scale apply date). The baseline branch also clears that day's `data_level_change` rows (constant `HOI1`). A new exported `suaNgayDoiThang(client, {write, dotBien})` plus the CLI flag handle a past day (constant `HOI2`). Tests run on the per-run DB copy, with 087 loaded inside BEGIN … ROLLBACK.

**Tech Stack:** Node ESM, pg, node:test; app tests are tsx with react-dom/server.

**Spec:** docs/superpowers/specs/2026-11-10-do1-giu-dau-doi-thang-design.md (contract `_acceptance/do1-giu-dau-doi-thang/`)

## Global Constraints

- No migration. Do not touch `scripts/cloud-sync.sh` (OOS-1).
- `HOI1 = "xoa"` and `HOI2 = "xoa"` are exported constants (Gate 1, d-…-11). Each function also takes an override `hoi1`/`hoi2` for tests.
- Mutations for the red direction go through `dotBien`: `bo-giu-moc`, `bo-ngay-ap`, `ngay-ap-truoc-rong`, `bo-don-ngay`, `sua-moi-ngay`.
- Tests are named `DD-AC-n`. Messages are pinned exactly as written in evals.yaml.

## Review Focus

- Bảng 1 has five rows. Each row's label is pinned by a real `doHangNgay` run (E3 «DD bảng 1»).
- A second run on the same baseline day must never DELETE the marker row. The marker is re-written with the same `ly_do`.
- The repair command never touches days other than D, and never touches `data_level_unit`.

---

### Task 1: Baseline-day label + clear rows (pipeline)

**Files:** Modify `pipeline/do-hang-ngay.mjs`.

**Interfaces — Produces:**
- `export const HOI1 = "xoa"`, `export const HOI2 = "xoa"`
- `export function nhanNgay({ dau, bangRong, coThangCu, ngay, tuNgay, dotBien }) → "lap-moc" | "doi-thang" | null`. `dau` is the existing marker's `ly_do`, or null.
- `doHangNgay(client, { ngay, write, dotBien, hoi1 = HOI1 })`

Steps:
- [ ] Read the existing marker before computing: the do1-chuyen-bac row whose `detail->>'ngay' = ngay`, the latest one, status skip.
- [ ] Order: marker → empty → old scale → `ngay === tuNgay` → null. `ngay-ap-truoc-rong` swaps steps 2 and 4; `bo-giu-moc` drops steps 1 and 4; `bo-ngay-ap` drops step 4.
- [ ] For a label: on write, `DELETE FROM data_level_change WHERE snap_date = ngay` unless `hoi1 === "giu"` or `dotBien === "bo-don-ngay"`. Push the skip row with `ly_do`, `don_vi`, `thang`. Then `thayDonVi`.

**Verify:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tb --chay node --test --test-concurrency=1 scripts/thang-bac.itest.mjs` (TB-AC-5 still green). Serves E1–E5. Independent: false.

### Task 2: Repair command

**Files:** Modify `pipeline/do-hang-ngay.mjs` (`main`).

**Interfaces — Produces:** `export async function suaNgayDoiThang(client, { write = false, hoi2 = HOI2, dotBien }) → { ngay, xoa } | { bo_qua: "chua-ap-087" | "chua-co-thang-moi" }`. It throws `DD-AC-8 ngày áp D lệch ngày có dấu X` when a doi-thang marker exists on another day. CLI: `--sua-ngay-doi-thang [--write]` prints `ngày D · N dòng sẽ xoá` and runs in ROLLBACK without `--write`.

Steps:
- [ ] D = `tuNgayThang` from the snapshot table. If there is none → `chua-co-thang-moi`. If there is no 087 → `chua-ap-087`.
- [ ] Count D rows. On write: delete them (unless `hoi2 === "giu"`; `sua-moi-ngay` drops the date filter), delete the do1-chuyen-bac rows of D, insert the skip doi-thang row with `thang`.

Serves E8. Independent: false (same file as Task 1).

### Task 3: Tests DD-AC-1…5, 8

**Files:** Create `pipeline/scripts/do-hang-ngay-doi-thang.itest.mjs`, modelled on `thang-bac.itest.mjs`: `trongGiaoDich` with lock 33033, load 087 if missing, and the same fixture helpers (copy the minimal `tin()` maker).

Serves E1–E5, E8. Verify: `config:executors.test.do1_dd`.

### Task 4: App tests — TB-AC-11 rewrite + DD-AC-6

**Files:** Modify `app/tests/thang-bac-db.itest.tsx`.

TB-AC-11 runs inside a transaction:
- derive the object set from the 087 file vs earlier migrations;
- DROP that set;
- insert a row with thang (positive control), then an older-style row;
- mutate the query of the real `getDataFlow` for the red direction.

DD-AC-6: two real DO1 runs on the same scale-change day, then `loadDo1` and `ve`.

Serves E6, E7. Verify: `config:executors.test.tb_app_db`.

### Task 5: Docs

`pipeline/CLAUDE.md`: add `--sua-ngay-doi-thang` and the baseline-day rule to the `do-hang-ngay.mjs` row.

## Vòng 2 — nâng phạm vi (Mạnh 10/11, Cổng Phạm vi duyệt lại 03:08Z)

- Task 6 (AC-9, E9): `ngayApThang` = ngày VN nhỏ nhất có dòng `do1-chuyen-bac` mang `thang-0811`; `tuNgayThang` dùng chung;
  đột biến `ngay-ap-theo-anh-chup`. Thước `DD-AC-9` (pipeline itest); nền các ca cũ dựng ngày áp bằng dòng DO1 mang thang
  (`nen({ap, anhChup})`, `chuanBi`); TB-AC-5 của thang-bac-moi đổi theo.
- Task 7 (AC-10, E10): `suaNgayDoiThang` ghi `checked_at = least(giờ chạy, cuối ngày D VN)` + `don_vi`; đột biến
  `sua-gio-chay`. Thước `DD-AC-10` (app itest: sửa → DO1 ngày X thật → `loadDo1`).
- Task 8 (AC-8): lớp `TuChoi`, `main` thoát 2; ca tiến trình thật trong `DD-AC-8`.
- Task 9 (E3): bảng 1 mười lăm ô, so trọn danh sách ô viết trước.
