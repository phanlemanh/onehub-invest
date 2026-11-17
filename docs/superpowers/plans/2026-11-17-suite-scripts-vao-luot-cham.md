# Suite scripts vào lượt chấm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (feature-loop chạy tuần tự trong phiên chính). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lượt chấm S4 và ghim lại chạy bộ `scripts/*.test.mjs` theo đúng các bước của job CI `scripts`, chỉ những tệp có tập đọc chạm diff của nhánh.

**Architecture:** Mọi mã ở `scripts/suite-neu-doi.mjs` (đã có `tepDoi`, `trongVung`): dời bộ quét S4V-AC-5 sang đây và mở rộng thành bao đóng; thêm bộ phát hiện đọc động, bộ chọn từng tệp với ba rào, và lệnh `--chay-scripts` chạy bốn bước CI trên một DB trống dựng mới. Ma trận viết tay nằm ở `_acceptance/suite-scripts-vao-luot-cham/` và được viết TRƯỚC mã.

**Tech Stack:** Node 24 ESM, `node:test`, git, PostGIS trong container `one-invest-db` (:5433).

**Spec:** `docs/superpowers/specs/2026-11-17-suite-scripts-vao-luot-cham-design.md` · hợp đồng `_acceptance/suite-scripts-vao-luot-cham/contract.md` · evals cùng thư mục.

## Global Constraints

- Ranh giới tệp: `_acceptance/config.yaml`, `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`, `_acceptance/suite-scripts-vao-luot-cham/**`, `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`, spec và plan này. Không tạo tệp ở chỗ khác.
- `executors.test.scripts` và mọi `executors.test.*`, `executors.script.portal_static` giữ nguyên từng byte.
- DB trống không bao giờ tên `oneinvest`; `scripts/ci-db-init.mjs` từ chối DB đã có bảng — giữ nguyên lưới đó.
- Tên ca test mới bắt đầu `SSL-AC-<n>` (khớp `executors.test.sstl_*`).
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture, thông điệp đỏ ghim tên tệp/ca (MEASURE-BIRTH).
- Không chạy suite nặng khi khoá s4 của đợt đang có người khác giữ, trừ khi chính P3 giữ khoá.

## Review Focus

1. Tệp test gọi chủ thể qua biến trung gian (`const S = "x.sh"; join(HERE, S)`) — phải vào tập đọc (luật tên trần áp cho mọi literal, không chỉ đối số `join`). Ca thêm ở Task 2.
2. Diff có tệp đã xoá trên nhánh — `tepDoi` trả đường của tệp đã xoá; bộ chọn phải so được mà không `readFileSync` nó. Ca thêm ở Task 4.
3. Tệp test mới thêm trên nhánh (chưa có ở main) — chính nó trong diff nên được chọn. Đã ở AC-2 (Task 4).
4. Lệnh `--chay-scripts` bị ngắt giữa chừng — DB trống phải được xoá (trap EXIT). Ca thêm ở Task 5.
5. Bộ chọn trả tập rỗng (diff không chạm gì) — vẫn chạy tập luôn chạy và `node --check`, không gọi `node --test` với danh sách rỗng (node sẽ chạy mọi tệp mặc định). Ca thêm ở Task 4.

---

### Task 1: Ma trận viết tay trước mã

**Files:**
- Create: `_acceptance/suite-scripts-vao-luot-cham/ma-tran.json`

**Interfaces:**
- Produces: JSON `{ "doc_dong": { "<scripts/x.test.mjs>": "dong: <lối> @<dòng>" | "tinh" | "chi-doc-tam" }, "chu_the": { "<scripts/x.test.mjs>": "<scripts/x.sh>" }, "ci": { "<phần tử job>": "tuong-duong: <…>" | "mien: <lý do>" } }` — đúng 43 khoá ở `doc_dong`, 15 ở `chu_the`.

- [ ] **Step 1:** Đọc tay từng tệp `scripts/*.test.mjs` và các tệp mã nó gọi (grep `readdirSync|readdir\(|glob|ls-files|execSync|execFileSync|\$\{|import\(` làm gợi ý, kết luận bằng mắt theo gốc của lời đọc). Ghi 43 dòng `doc_dong`.
- [ ] **Step 2:** Ghi 15 cặp `chu_the` (tệp test → chủ thể cùng thân tên).
- [ ] **Step 3:** Rút mọi bước `run`, khoá `env`, `services.*.image` của job `scripts` trong `.github/workflows/ci-test.yml`, ghi `ci` với «tuong-duong»/«mien: lý do».
- [ ] **Step 4:** Kiểm số khoá: `node -e 'const m=require("./_acceptance/suite-scripts-vao-luot-cham/ma-tran.json");console.log(Object.keys(m.doc_dong).length,Object.keys(m.chu_the).length)'` → `43 15`.
- [ ] **Step 5:** Commit `docs(acceptance): suite-scripts ma trận viết tay trước mã`.

### Task 2: Bộ quét dời sang suite-neu-doi.mjs, bao đóng, luật tên trần cùng thư mục

**Files:**
- Modify: `scripts/suite-neu-doi.mjs` (thêm export), `scripts/suite-neu-doi.test.mjs:188-277` (bỏ định nghĩa, import từ module)

**Interfaces:**
- Produces: `export function quetNgoai(root: string, mods: string[], tepKho: string[]): Map<string,string>` (hành vi cũ + luật tên trần); `export function tapDoc(root: string, tep: string, tepKho: string[]): Set<string>` — bao đóng: thêm mọi tệp mã (`MA`) được nhắc bằng literal và quét tiếp; luật: literal không có `/` trùng tên tệp có thật cùng thư mục → tính là đọc.

- [ ] **Step 1:** Test `SSL-AC-5 bao đóng` trên kho tạm `scripts/a.test.mjs` (`join(HERE,"x.sh")`), `scripts/x.sh` (`node pipeline/y.mjs`), `pipeline/y.mjs`: `assert.ok(tapDoc(dir,"scripts/a.test.mjs",tep).has("pipeline/y.mjs"))`; đối chứng tệp `docs/z.md` không trong tập; ca biến trung gian `const S="x.sh"; join(HERE,S)` vẫn có `scripts/x.sh`.
- [ ] **Step 2:** Test `SSL-AC-5 chủ thể kho thật`: với mỗi cặp ở `ma-tran.json#chu_the`, `tapDoc(ROOT,t,tep).has(chuThe)` — 15 assert gọi tên tệp. Chiều đỏ: gọi `tapDoc` với cờ `{ tenTran: false }` → đúng ba tệp `cap-token-may`, `dung-worktree-cham`, `sao-luu-ngoai-may` lọt, thông điệp gọi tên cả ba; `{ baoDong: false }` → ca bao đóng đỏ.
- [ ] **Step 3:** Chạy `node --test --test-name-pattern=SSL-AC-5 scripts/suite-neu-doi.test.mjs` → FAIL (`tapDoc` chưa có).
- [ ] **Step 4:** Implement `tapDoc(root, tep, tepKho, { tenTran = true, baoDong = true } = {})` và dời `thamChieu`/`quetNgoai` sang module; test import từ `./suite-neu-doi.mjs`.
- [ ] **Step 5:** Chạy `node --test --test-name-pattern='SSL-AC-5|S4V-AC-5' scripts/suite-neu-doi.test.mjs` → PASS cả hai.
- [ ] **Step 6:** Commit.

### Task 3: Bộ phát hiện đọc động

**Files:**
- Modify: `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`

**Interfaces:**
- Produces: `export const LOI_DONG = ["readdir","glob","ls-files","exec","template","import-dong"]`; `export function docDong(src: string, { tat = [] } = {}): string[]` — các lối đọc kho động tìm thấy (rỗng = tĩnh hoặc chỉ đọc tạm); lời đọc gốc ở `tmpdir()`, `mkdtemp…`, biến HOME giả, thư mục test tự tạo thì không tính.

- [ ] **Step 1:** Test `SSL-AC-3 ma trận 43 tệp`: với mỗi khoá `ma-tran.json#doc_dong`, so `docDong(src).length > 0` với nhãn «dong»/khác — đúng 43 assert gọi tên. Assert riêng bảy tệp động và năm tệp chỉ-đọc-tạm.
- [ ] **Step 2:** Test `SSL-AC-3 chiều đỏ`: với mỗi lối trong `LOI_DONG` có ít nhất một tệp thật dùng nó, `docDong(src,{tat:[loi]})` làm tệp ấy lọt → thông điệp gọi tên tệp. Lối không có tệp thật dùng thì dùng fixture chuỗi một dòng.
- [ ] **Step 3:** Chạy → FAIL. **Step 4:** Implement. **Step 5:** Chạy `--test-name-pattern=SSL-AC-3` → PASS. **Step 6:** Commit.

### Task 4: Bộ chọn từng tệp với ba rào

**Files:**
- Modify: `scripts/suite-neu-doi.mjs`, `scripts/suite-neu-doi.test.mjs`

**Interfaces:**
- Consumes: `tapDoc`, `docDong`, `tepDoi(cwd, base)` (đã có).
- Produces: `export const HA_TANG = ["scripts/lib/**","db/migrations/**","scripts/ci-db-init.mjs","scripts/ci-bo-qua.json",".github/workflows/ci-test.yml","app/package.json","app/package-lock.json","pipeline/package.json","pipeline/package-lock.json","agent/package.json","agent/package-lock.json"]`; `export function chonScripts({ root: string, tep: string[] | null, ep?: boolean }): { chon: string[], ly_do: Record<string,string>, tron_bo: string | null }` — `ly_do[t]` ∈ «tập đọc: <tệp diff>» · «đọc động: <lối>» · «tệp test trong diff» · «trọn bộ: <lý do>».

- [ ] **Step 1:** Test `SSL-AC-2` (kho tạm hai tệp a/b như hợp đồng): chọn đúng theo ba ca diff + ca tệp test trong diff + đối chứng tệp không ai đọc.
- [ ] **Step 2:** Test `SSL-AC-4`: một assert cho mỗi phần tử `HA_TANG` (diff đơn lẻ → `tron_bo` gọi tên tệp, `chon.length === tổng`); đối chứng `scripts/x.mjs` thường và `scripts/lib-khac/x.mjs`.
- [ ] **Step 3:** Test `SSL-AC-8`: `tep: null` → trọn bộ «không giải được gốc»; `tep: []` → trọn bộ «diff rỗng»; `ep: true` → «ép chạy»; đối chứng diff chạm một tệp đọc tĩnh → không trọn bộ.
- [ ] **Step 4:** Review Focus 2 & 5: diff có tệp đã xoá → không ném lỗi; diff chỉ chạm tệp không ai đọc → `chon` = đúng tập luôn chạy (không rỗng thành «chạy mọi tệp»).
- [ ] **Step 5:** Chạy → FAIL. **Step 6:** Implement. **Step 7:** `--test-name-pattern='SSL-AC-(2|4|8)'` → PASS. **Step 8:** Commit.

### Task 5: Lệnh --chay-scripts theo các bước CI

**Files:**
- Modify: `scripts/suite-neu-doi.mjs` (nhánh CLI), `scripts/suite-neu-doi.test.mjs`

**Interfaces:**
- Consumes: `chonScripts`, `tepDoi`.
- Produces: CLI `node scripts/suite-neu-doi.mjs --chon-scripts [--root <dir>] [--base <ref>]` (in tập chọn + lý do, thoát 0) và `node scripts/suite-neu-doi.mjs --chay-scripts [--root <dir>] [--base <ref>]`: (1) `node --check` mọi `scripts/**/*.mjs`; (2) `docker exec one-invest-db createdb oneinvest_ci_scripts_<pid>`; (3) `DATABASE_URL=…/oneinvest_ci_scripts_<pid> node scripts/ci-db-init.mjs`; (4) `NODE_OPTIONS="$(CI=true node scripts/lib/ci-can-du-lieu.mjs scripts)" DATABASE_URL=… node --test <chọn>`; xoá DB khi thoát (cả khi bị ngắt). Mã thoát = mã của bước hỏng đầu tiên.
- Produces: `export function buocSuite(): { ten: string, lenh: string }[]` — danh sách bước mà test AC-1 so với ma trận `ci`.

- [ ] **Step 1:** Test `SSL-AC-1 ma trận`: rút phần tử job `scripts` từ `ci-test.yml` (dùng `js-yaml` mượn từ `app/`), mỗi phần tử có dòng trong `ma-tran.json#ci`; mỗi dòng «tuong-duong» khớp một phần tử `buocSuite()`; ảnh `services` = `docker inspect -f '{{.Config.Image}}' one-invest-db`; bản chính Node trùng. Chiều đỏ: bản sao workflow thêm một `run` → đỏ gọi tên; đổi ảnh → đỏ gọi tên ảnh.
- [ ] **Step 2:** Test `SSL-AC-1 đầu ra thật` (bỏ qua có lời khi `CI` hoặc không có docker): chạy `--chay-scripts` trên một tệp test cố định có ca in `current_database()`; assert DB khác `oneinvest` và bắt đầu `oneinvest_ci_scripts_`; danh sách `--test-skip-pattern` trong NODE_OPTIONS bằng danh sách `ci-bo-qua.json#scripts`; sau khi lệnh thoát, DB không còn (Review Focus 4: cả khi gửi SIGTERM giữa chừng).
- [ ] **Step 3:** Chạy → FAIL. **Step 4:** Implement. **Step 5:** `--test-name-pattern=SSL-AC-1` → PASS. **Step 6:** Commit.

### Task 6: Cấu hình tám suite, S4V-AC-6 và probe

**Files:**
- Modify: `_acceptance/config.yaml` (`feature_loop.suite_keys`, `executors.suite.scripts`), `scripts/suite-neu-doi.test.mjs` (S4V-AC-6), `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`

**Interfaces:**
- Consumes: CLI `--chay-scripts` (Task 5).
- Produces: `executors.suite.scripts: "node scripts/suite-neu-doi.mjs --chay-scripts"`; `suite_keys` thêm `executors.suite.scripts` (tám key).

- [ ] **Step 1:** Sửa S4V-AC-6: `ten` thêm `scripts` với lệnh kỳ vọng riêng `node scripts/suite-neu-doi.mjs --chay-scripts` (không bọc nguyên văn — theo quyết định d-…-2); giữ chiều đỏ «app» và chiều xanh «thêm executors.test.moi».
- [ ] **Step 2:** Probe: thêm `scripts` vào vòng kiểm lệnh gốc nguyên byte; câu báo xanh nói «chín lệnh cũ».
- [ ] **Step 3:** Sửa config. **Step 4:** `node --test --test-name-pattern=S4V-AC-6 scripts/suite-neu-doi.test.mjs && bash _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh` → PASS. **Step 5:** Ghi một dòng `approach` vào sổ của HỒ SƠ NÀY (không chạm sổ s4-suite-theo-vung) nêu việc sửa S4V-AC-6 và probe bảy → tám, rồi commit.

### Task 7: Hai probe trên dữ liệu thật

**Files:**
- Create: `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh`, `_acceptance/suite-scripts-vao-luot-cham/probes/do-app-src.sh`

**Interfaces:**
- Consumes: CLI `--chon-scripts`, `--chay-scripts` với `--root`.

- [ ] **Step 1:** `tai-hien.sh`: với mỗi đỉnh (`5b02c3de`, `f3fecd5f`), `git worktree add` vào thư mục tạm, nối `node_modules` bằng `scripts/dung-worktree-cham.sh --khong-tsc`, chạy `node <HEAD>/scripts/suite-neu-doi.mjs --chay-scripts --root <wt> --base <merge-base>`; in sha bộ chọn và lý do từng tệp; kỳ vọng tệp và ca đỏ như E6; xoá worktree (trap). Thoát 1 gọi tên đỉnh khi lệch.
- [ ] **Step 2:** `do-app-src.sh`: worktree tạm từ HEAD, sửa một dòng chú thích ở `app/src/lib/ops/registry/doc.ts`, commit tạm; đo `--chay-scripts` và trọn bộ (`node --test scripts/*.test.mjs`) cùng máy; kiểm ≤ 15 tệp, đủ tập luôn chạy, giây ≤ 40%.
- [ ] **Step 3:** Chạy cả hai khi máy yên (khoá s4 không ai giữ hoặc P3 giữ) → thoát 0. **Step 4:** Commit.

### Task 8: Hồi quy và số đo trọn bộ

- [ ] **Step 1:** `node --test scripts/*.test.mjs` → thoát 0; ghi số tệp, ca, giây vào Notes của hợp đồng cùng số giây tập luôn chạy.
- [ ] **Step 2:** Đặt `status: implemented` cho hợp đồng; commit.
