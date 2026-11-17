# Suite scripts vào lượt chấm — Implementation Plan (bản 2, tệp khai vùng)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (feature-loop chạy tuần tự trong phiên chính). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Lượt chấm S4 và ghim lại chạy bộ `scripts/*.test.mjs` theo đúng các bước job CI `scripts`, chỉ những tệp có vùng khai tay chạm diff của nhánh.

**Architecture:** `scripts/suite-scripts-vung.json` (viết tay từ ma trận đọc tay) là nguồn sự thật cho vùng của từng tệp test. `scripts/suite-neu-doi.mjs` thêm bộ chọn đọc tệp khai + ba rào, và lệnh `--chay-scripts` chạy bốn bước CI trên một DB trống dựng mới. Không phân tích luồng tự động.

**Tech Stack:** Node 24 ESM, `node:test`, git, PostGIS container `one-invest-db` (:5433, ảnh `kartoza/postgis:17-3.5`).

**Spec:** `docs/superpowers/specs/2026-11-17-suite-scripts-vao-luot-cham-design.md` (mục «Đổi hướng 17/11 06:00Z») · hợp đồng và evals ở `_acceptance/suite-scripts-vao-luot-cham/`.

## Global Constraints

- Ranh giới: `_acceptance/config.yaml`, `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`, `scripts/suite-scripts-vung.json`, `_acceptance/suite-scripts-vao-luot-cham/**`, `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`, spec, plan này.
- `executors.test.scripts`, mọi `executors.test.*` của main, `executors.script.portal_static` giữ nguyên byte.
- DB trống không bao giờ tên `oneinvest`; giữ lưới từ chối DB có bảng của `ci-db-init.mjs`.
- Tên ca mới `SSL-AC-<n>`; mỗi phép đo có cặp hai chiều trên cùng fixture, thông điệp đỏ gọi tên.
- Không chạy suite nặng khi khoá s4 đang ở dãy khác.

## Review Focus

1. Glob trong tệp khai dạng `pipeline/**/*.test.mjs` — `khop()` hiện chỉ hỗ trợ `x/**` và `*` một tầng; phải khớp `**` giữa đường. Ca ở Task 2.
2. Diff chỉ chạm tệp không vùng nào phủ → chỉ chạy tập `"luon"` + `node --check`; không gọi `node --test` với danh sách rỗng (node sẽ chạy mặc định mọi tệp). Ca ở Task 2.
3. Diff có tệp đã xoá → so glob trên đường, không đọc tệp. Ca ở Task 2.
4. `--chay-scripts` bị ngắt → DB trống vẫn bị xoá (trap). Ca ở Task 4.
5. Tệp khai hỏng JSON → trọn bộ có lời (AC-8). Ca ở Task 2.

---

### Task 1: Ma trận đọc tay và tệp khai vùng

**Files:** Create `_acceptance/suite-scripts-vao-luot-cham/ma-tran.json`, `scripts/suite-scripts-vung.json`

**Interfaces — Produces:**
- `ma-tran.json`: `{ "doc": { "<scripts/x.test.mjs>": "lietke: <tệp:dòng>" | "tinh" | "tam" }, "chu_the": { "<test>": "<chủ thể>" }, "ci": { "<phần tử job>": "tuong-duong: …" | "mien: <lý do>" } }` — 43 khoá `doc`, 15 `chu_the`.
- `suite-scripts-vung.json`: `{ "<scripts/x.test.mjs>": ["<glob>", …] | "luon" }` — 43 khoá; `"luon"` đúng các tệp `lietke` không khoanh được.

- [ ] Step 1: Viết `ma-tran.json#doc` cho 43 tệp, đọc tay tệp test và tệp nó kéo vào (bộ quét nháp chỉ để gợi ý). Ghi `chu_the` (15) và `ci`.
- [ ] Step 2: Viết `suite-scripts-vung.json` từ ma trận: chủ thể + tệp import + thư mục được đọc; `db-thu.test.mjs` → `["scripts/db-thu.test.mjs","db/db-thu.sh","app/tests/**","app/probes/**","pipeline/**/*.test.mjs","agent/tests/**","app/src/**","pipeline/lib/**","agent/src/**"]`.
- [ ] Step 3: `node -e` đếm khoá → `43 15 43`. Commit.

### Task 2: Bộ chọn đọc tệp khai + ba rào + bảo thủ

**Files:** Modify `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`

**Interfaces — Produces:**
- `export const HA_TANG = ["scripts/lib/**","db/migrations/**","scripts/ci-db-init.mjs","scripts/ci-bo-qua.json",".github/workflows/ci-test.yml","scripts/suite-scripts-vung.json","app/package.json","app/package-lock.json","pipeline/package.json","pipeline/package-lock.json","agent/package.json","agent/package-lock.json"]`
- `export function docKhai(root: string): { khai: Record<string, string[]|"luon"> | null, loi: string | null }`
- `export function chonScripts({ root: string, tep: string[] | null, khai, tests: string[], ep?: boolean }): { chon: string[], ly_do: Record<string,string>, tron_bo: string | null }` — tệp test chưa khai → coi `"luon"`.
- `khop(duong, glob)` hỗ trợ `**` giữa đường.

- [ ] Step 1: Tests `SSL-AC-2` (fixture a/b/c như hợp đồng + Review Focus 1–3), `SSL-AC-4` (một assert mỗi phần tử `HA_TANG` + đối chứng), `SSL-AC-8` (null/rỗng/JSON hỏng/ép + đối chứng).
- [ ] Step 2: Chạy → FAIL. Step 3: Implement. Step 4: `--test-name-pattern='SSL-AC-(2|4|8)|S4V-AC-'` → PASS. Commit.

### Task 3: Ca canh tệp khai và khớp ma trận

**Files:** Modify `scripts/suite-neu-doi.test.mjs`

- [ ] Step 1: `SSL-AC-3` trên kho thật + chiều đỏ trên bản sao (thiếu dòng / dòng thừa / mảng rỗng; tệp thiếu được `chonScripts` coi luon).
- [ ] Step 2: `SSL-AC-5`: luon ⇔ `lietke` không khoanh (43 assert); 15 chủ thể khớp vùng; vùng db-thu khớp bốn đường mẫu, không phải `**`/luon; chiều đỏ bỏ chủ thể dung-worktree-cham.
- [ ] Step 3: Chạy → PASS (dữ liệu đã có từ Task 1; nếu đỏ thì sửa tệp khai, không sửa thước). Commit.

### Task 4: Lệnh --chay-scripts theo bốn bước CI

**Files:** Modify `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`

**Interfaces — Produces:** CLI `--chon-scripts [--root] [--base]` (in tập chọn + lý do) và `--chay-scripts [--root] [--base]`: `node --check` mọi `scripts/**/*.mjs` → `createdb oneinvest_ci_scripts_<pid>` → `ci-db-init.mjs` → `NODE_OPTIONS="$(CI=true node scripts/lib/ci-can-du-lieu.mjs scripts)" node --test <chọn>` → `dropdb` (trap). `export function buocSuite(): { ten: string, lenh: string }[]`.

- [ ] Step 1: `SSL-AC-1 ma trận` (phần tử job ↔ `ma-tran.json#ci` ↔ `buocSuite()`, ảnh, Node; chiều đỏ thêm bước / đổi ảnh) và `SSL-AC-1 đầu ra thật` (DB nối tới ≠ `oneinvest`, ca bỏ = `ci-bo-qua.json#scripts`, DB bị xoá kể cả khi SIGTERM; bỏ qua có lời khi CI hay không có docker).
- [ ] Step 2: FAIL → implement → PASS. Commit.

### Task 5: Cấu hình tám suite, S4V-AC-6, probe

**Files:** Modify `_acceptance/config.yaml`, `scripts/suite-neu-doi.test.mjs` (S4V-AC-6), `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`

- [ ] Step 1: `executors.suite.scripts: "node scripts/suite-neu-doi.mjs --chay-scripts"`; `suite_keys` thêm key thứ tám.
- [ ] Step 2: S4V-AC-6 kỳ vọng riêng cho `scripts` (không bọc nguyên văn); probe thêm `scripts` vào vòng lệnh gốc nguyên byte.
- [ ] Step 3: `node --test --test-name-pattern=S4V-AC-6 scripts/suite-neu-doi.test.mjs && bash _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh` → PASS. Dòng sổ `approach` ở hồ sơ NÀY. Commit.

### Task 6: Hai probe dữ liệu thật

**Files:** Create `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh`, `…/probes/do-app-src.sh`

- [ ] Step 1: `tai-hien.sh` — worktree tạm mỗi đỉnh (`5b02c3de`, `f3fecd5f`), `dung-worktree-cham.sh --khong-tsc`, chạy `--chay-scripts` của HEAD với `--root`, kiểm tệp chọn + ca đỏ, in sha bộ chọn; trap xoá.
- [ ] Step 2: `do-app-src.sh` — nhánh tạm sửa một dòng chú thích `app/src/lib/ops/registry/doc.ts`, đo `--chay-scripts` (≤ 120″ phần `node --test`) và trọn bộ cùng máy.
- [ ] Step 3: Chạy khi máy yên → 0. Commit.

### Task 7: Hồi quy, số đo, implemented

- [ ] `node --test scripts/*.test.mjs` → 0; ghi số tệp/ca/giây và giá tập luôn chạy vào Notes; `status: implemented`; commit.
