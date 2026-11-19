# Suite scripts — Implementation Plan (bản 3, một lệnh trọn bộ ngoài khoá s4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (feature-loop chạy tuần tự trong phiên chính).

**Goal:** Một lệnh chạy trọn bộ `scripts/*.test.mjs` theo đúng các bước job CI `scripts`, ngoài khoá s4, ghi dòng tóm tắt vào run-log hồ sơ.

**Architecture:** Thêm nhánh `--chay-scripts` vào `scripts/suite-neu-doi.mjs`: đọc nguyên văn ba bước `run` của job từ `ci-test.yml` ở gốc đang chạy, chạy trên DB trống dựng mới trong cùng server :5433, nhóm tiến trình riêng để truyền tín hiệu, xoá DB khi thoát, in và (với `--ho-so`) ghi dòng `scripts-ci`.

**Spec:** `docs/superpowers/specs/2026-11-17-suite-scripts-vao-luot-cham-design.md` — mục «Đổi phán 17/11 07:00Z».

## Global Constraints

- Ranh giới: `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`, `_acceptance/config.yaml` (chỉ khoá `executors.test.sstl_*`), `_acceptance/suite-scripts-vao-luot-cham/**`, spec, plan.
- `suite_keys` bảy key; S4V-AC-6 và probe hồ sơ cũ trùng byte với main.
- DB trống không bao giờ tên `oneinvest`; lệnh không đụng DB chung.
- Không chạy lượt nặng khi khoá s4 đang ở dãy khác.

## Review Focus

1. Lệnh chạy từ trong một lượt `node --test` — gỡ `NODE_TEST_CONTEXT` khỏi môi trường bước (ca ở Task 1).
2. Bị SIGTERM giữa chừng — ngắt cả nhóm, xoá DB, thoát 143 (ca ở Task 1).
3. `--ho-so` trỏ hồ sơ không tồn tại — thoát 2, không tạo run-log (ca ở Task 1).
4. Đầu ra `node --test` không có dòng tổng kết (bị giết) — dòng tóm tắt vẫn in, số ca là `null` (ca ở Task 1).
5. Job CI đổi tên bước hay bỏ glob — thoát 2 có tên (ca ở Task 1).

### Task 1: Lệnh --chay-scripts

**Files:** Modify `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`

**Interfaces — Produces:** `export const BUOC_CI = ["kiểm cú pháp .mjs","dựng DB trống từ migration","test"]`; `export function buocSuite(root): {ten,lenh}[]`; `export function tomTat(out: string, { sha, exit, giay }): { kind:"scripts-ci", ts, sha, exit, tests, pass, fail, giay }`; CLI `--chay-scripts [--root] [--ho-so <slug>] [--tep <tệp,…>]` (`--tep` chỉ cho phép đo: thay glob bằng tệp chỉ định).

- [ ] SSL-AC-1 ma trận (job ↔ `ma-tran.json#ci` ↔ `buocSuite`, ảnh, Node; chiều đỏ) + đầu ra thật (DB, `CI=true`, NODE_OPTIONS).
- [ ] SSL-AC-2 dòng tóm tắt (xanh/đỏ), `--ho-so` ghi run-log, hồ sơ vắng → 2, DB xoá kể cả SIGTERM.
- [ ] Implement (cấy lại phần lệnh đã viết ở bản 2, bỏ phần chọn). Chạy `--test-name-pattern='SSL-AC-|S4V-AC-'` → xanh. Commit.

### Task 2: Probe tái hiện

**Files:** Modify `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh` (đối số `471`/`472`, bỏ `--khai`).

- [ ] Chạy khi máy yên: `tai-hien.sh 471`, `tai-hien.sh 472` → 0. Commit.

### Task 3: Xanh trên cây + hồi quy

- [ ] `node scripts/suite-neu-doi.mjs --chay-scripts --ho-so suite-scripts-vao-luot-cham` → 0, `fail:0` (đây cũng là lượt chạy khô của chính hàng). `node --test scripts/*.test.mjs` → 0. Ghi số vào Notes; `status: implemented`; commit.
