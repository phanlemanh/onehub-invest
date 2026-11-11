# Nạp danh mục dự án S07 vào `stg_s07_*` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raw S07 (`s07-danh-muc`) vào ba bảng `stg_s07_*` qua migration 093 và bộ nạp riêng, nạp lại không nhân dòng, không mang tên miền nguồn.

**Architecture:** Hàm thuần bóc HTML/XML (`pipeline/lib/s07-danh-muc.mjs`) → bộ nạp dòng lệnh (`pipeline/import-s07-danh-muc.mjs`) chèn `ON CONFLICT (snapshot_id, pj_id) DO NOTHING` vào ba bảng do `db/migrations/093_stg_s07.sql` tạo. Bộ soát lược đồ và bộ so cột nằm ở `pipeline/lib/s07-luoc-do.mjs`, dùng chung cho test và lệnh đo dữ liệu thật.

**Tech Stack:** Node ≥ 22 (ESM, `node:test`), `pg`, PostgreSQL 16 (PostGIS :5433), không thêm phụ thuộc.

**Spec:** `docs/superpowers/specs/2026-11-11-thu-danh-muc-s07-design.md` · hợp đồng `_acceptance/thu-danh-muc-s07/contract.md` · phép đo `_acceptance/thu-danh-muc-s07/evals.yaml`.

**Cách thi công:** tuần tự trong phiên chính (feature-loop S3); chấm bằng tác tử tươi ở S4.

## Global Constraints

- Tầng A: không tệp nào trong kho chứa tên miền hay nhãn của nguồn; chỉ mã `S07`. HTML trong test là giả, miền thử `nguon-thu.test`.
- DB: mọi bài kiểm có nạp chạy trên lược đồ tạm của DB riêng lượt (`bash ../db/db-thu.sh oneinvest_suite_s07 --chay …`). Không áp 093 lên DB chung `oneinvest` :5433.
- Không sửa `pipeline/import-airbnb.mjs`. Không build lại `collector/dist`.
- Migration idempotent (`CREATE … IF NOT EXISTS`, `COMMENT` chạy lại được), chỉ tạo ba bảng `stg_s07_*`.
- Tên cột theo liên làn duyệt 11/11: `builder_name_raw`, `builder_ref`, `builder_path`, `number_of_buildings_total` (thẻ), `number_of_buildings_total_raw` (trang dự án), `number_of_units_total`.
- `attributes` là mảng jsonb các cặp `{"label","value"}` theo thứ tự nguồn.
- Hỏi-1 (Mạnh duyệt 11/11): trang danh sách và trang dự án thiếu cờ `sessionLoggedIn` không nạp; sitemap thiếu cờ vẫn nạp.
- Số ca test cố định theo `_acceptance/config.yaml`: tệp thuần 9 ca (`pass 9`), tệp DB 8 ca (`pass 8`). Tên ca mở đầu bằng mã `S07-AC-<n>`.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture: vật lành xanh, bản phá đỏ với thông điệp ghim.

## Review Focus

1. Một snapshot có cùng dự án ở hai trang danh sách (danh sách xếp «mới nhất», dự án lùi trang giữa hai lời) → chỉ một dòng, phần lặp được đếm `lap` (Task 2, ca `S07-AC-7`).
2. `S07_HOST` đặt sai → tên miền thật vẫn bị bắt bởi bước soát, không dòng nào được ghi (Task 3, ca `S07-AC-6` trên DB).
3. Trang dự án bị nguồn trả trang rỗng (`mainHtml` null) → không thành dòng, đếm `trang_rong`, phép đo dữ liệu thật vẫn xanh (Task 2 + Task 4).
4. Nạp snapshot cũ SAU snapshot mới → nội dung ba bảng giống hệt nạp theo thứ tự ngược lại (Task 3, ca hai thứ tự).
5. Chữ có byte NUL hoặc thực thể HTML trong tên dự án → ghi được vào Postgres, tên đã giải thực thể (Task 2 ca `S07-AC-3`; `boNull` đã có ở bộ nạp, Task 3 thêm một trường mang `\u0000` vào item của ca nạp lại).

---

### Task 1: Migration 093 và bộ soát lược đồ

`independent: false` · phục vụ E1 (AC-1)

**Files:**
- Create: `db/migrations/093_stg_s07.sql`
- Create: `pipeline/lib/s07-luoc-do.mjs`
- Create: `pipeline/scripts/s07-danh-muc-db.test.mjs`

**Interfaces:**
- Produces: `BANG_093 = ["stg_s07_project_card","stg_s07_project","stg_s07_sitemap_url"]` · `kiemLuocDo093(client, schema): Promise<string[]>` (danh sách lỗi, rỗng = đạt) · `dauLuocDo(client, schema): Promise<string>` (sha256 của danh sách bảng.cột:kiểu + định nghĩa chỉ mục, sắp xếp) · `TEP_093` (đường tuyệt đối tới tệp migration, suy từ `import.meta.dirname`).

- [ ] **Step 1: Viết ca `S07-AC-1 áp 093 hai lần, lược đồ đủ và không đổi` và `S07-AC-1 should-NOT-fire: ba bản đột biến của 093 đỏ đúng tên`** trong tệp test DB. Khuôn lược đồ tạm như test S10 trên nhánh `feat/data-contract-s10-s11` (`CREATE SCHEMA`, `search_path` qua `?options=-csearch_path%3D<schema>`, `test.after` xoá). Khẳng định ca 1: `kiemLuocDo093` trả `[]` sau lần áp một và hai; `dauLuocDo` trước và sau lần hai bằng nhau; số bảng của lược đồ tăng đúng 3. Ca 2, mỗi bản đột biến áp vào một lược đồ tạm riêng:
  - bỏ dòng `CREATE INDEX` của `stg_s07_project` → lỗi chứa `stg_s07_project: thiếu chỉ mục (pj_id, captured_at DESC)`;
  - bỏ `COMMENT ON COLUMN … price_range_raw` → `price_range_raw thiếu chú thích chỉ nội bộ`;
  - đổi `PRIMARY KEY (snapshot_id, pj_id)` của `stg_s07_sitemap_url` thành `PRIMARY KEY (pj_id)` → `khoá chính của stg_s07_sitemap_url không phải (snapshot_id, pj_id)`.
  Đột biến bằng `String.replace` trên chữ của tệp 093 và khẳng định chuỗi thật sự đổi (không đổi thì ca đỏ «đột biến không trúng»).
- [ ] **Step 2: Chạy, thấy đỏ** — `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s07 --chay node --test --test-concurrency=1 scripts/s07-danh-muc-db.test.mjs`; mong đợi lỗi nạp mô-đun `s07-luoc-do.mjs`.
- [ ] **Step 3: Viết `093_stg_s07.sql`** theo DDL ở `s07-cot-093-de-xuat-20261111.md` đã đổi tên cột; đầu tệp: tên tệp, mã DAZ3 `thu-danh-muc-s07`, nguồn (design, DATA-CONTRACT mục S07), dòng `KHÔNG sync cloud: stg S07 chỉ ở máy thu`, dòng «Áp lên DB máy thu cần lời Mạnh». Mỗi bảng: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS <bảng>_pj_captured_idx ON <bảng> (pj_id, captured_at DESC)`, `COMMENT ON TABLE <bảng> IS 'stg S07 — chỉ máy thu, không sync cloud. …'`; riêng `stg_s07_project`: `COMMENT ON COLUMN stg_s07_project.price_range_raw IS 'chỉ nội bộ, ROADMAP §3 mục 27'`. `attributes jsonb` kèm chú thích cột «mảng cặp {label, value} theo thứ tự nguồn».
- [ ] **Step 4: Viết `s07-luoc-do.mjs`** — `kiemLuocDo093` đọc `pg_constraint` (contype `p`, tên cột theo `conkey`), `pg_index` + `pg_attribute` + `indoption` (cột 1 `pj_id`, cột 2 `captured_at` giảm dần), `obj_description`, `col_description`; không đọc chữ của tệp 093.
- [ ] **Step 5: Chạy lại, hai ca xanh.**
- [ ] **Step 6: Commit** — `feat(db): 093 ba bảng stg_s07_* + bộ soát lược đồ (DAZ3)`.

### Task 2: Hàm bóc và bộ đếm theo lý do

`independent: false` · phục vụ E2, E3, E4, E6, E8 (AC-2, AC-3, AC-4, AC-6, AC-7)

**Files:**
- Modify: `pipeline/lib/s07-danh-muc.mjs`
- Modify: `pipeline/import-s07-danh-muc.mjs` (chỉ `dongCuaSnapshot`, `kiemKhongMien`)
- Modify: `pipeline/scripts/s07-danh-muc.test.mjs` (bỏ phần DB sang tệp DB; còn đúng 9 ca)

**Interfaces:**
- Produces: `bocDuAn(item, mien).attributes: {label: string, value: string|null}[]` · `dongCuaSnapshot(items, mienEp?) → { the[], duAn[], sitemap[], mien: Set<string>, bo: { dang_nhap, lap, trang_rong, the_khong_du_an, kind_la, nguon_khac } }` (mọi số là số nguyên ≥ 0) · `kiemKhongMien(ra)` ném `S07: còn tên miền nguồn trong dòng <bảng> pj_id=<id> — dừng, không ghi`.

- [ ] **Step 1: Sửa test trước.** Chín ca, tên cố định: `S07-AC-2 thẻ chính`, `S07-AC-2 should-NOT-fire`, `S07-AC-3 trang dự án`, `S07-AC-3 should-NOT-fire`, `S07-AC-3 đường dẫn`, `S07-AC-4 sitemap`, `S07-AC-6 tên miền`, `S07-AC-6 rào còn sót`, `S07-AC-7 phiên khách và bộ đếm`. Khẳng định mới so với bản đang có:
  - `attributes` bằng đúng mảng bảy cặp theo thứ tự `Giá, Diện tích, Số căn hộ, Số tòa, Chủ đầu tư, Pháp lý, Quy mô`;
  - `S07-AC-7`, snapshot một (bảy item đúng như `expected` của E8: hai trang danh sách chung dự án 12, trang dự án 21 lành, trang dự án 22 cờ `true`, một sitemap hai đường dẫn, một item nguồn khác, một kind lạ) → `the` = [11, 12, 13], `duAn` = [21], 2 đường dẫn, `bo` = `{dang_nhap: 1, lap: 1, trang_rong: 0, the_khong_du_an: 0, kind_la: 1, nguon_khac: 1}`;
  - `S07-AC-7`, snapshot hai (thêm trang dự án 23 thiếu cờ, trang dự án 24 `mainHtml` null, một thẻ trỏ tin rao) → `dang_nhap`, `trang_rong`, `the_khong_du_an` mỗi số tăng đúng 1 so với snapshot một; `duAn` vẫn [21];
  - `S07-AC-6 rào còn sót`: `ra.mien` chứa cả miền cấu hình sai lẫn miền suy từ canonical; gài miền thử vào `scale_raw` → ném thông điệp chứa `còn tên miền nguồn` và `stg_s07_project`.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd pipeline && node --test scripts/s07-danh-muc.test.mjs`.
- [ ] **Step 3: Sửa mã.** `attributes` thành mảng (các cột tiện dụng đọc bằng `find(label)`); `dongCuaSnapshot` trả `bo` theo sáu lý do và gom vào `ra.mien` MỌI miền suy được (cấu hình, canonical của snapshot, miền của từng item); bóc dùng miền theo thứ tự cấu hình → canonical → item.
- [ ] **Step 4: Chạy lại** — `bash -o pipefail -c 'node --test scripts/s07-danh-muc.test.mjs | grep "pass 9$"'` thoát 0.
- [ ] **Step 5: Commit** — `feat(pipeline): hàm bóc S07 + bộ đếm phần bỏ theo lý do`.

### Task 3: Bộ nạp trên DB

`independent: false` · phục vụ E5, E7, E9, và vế DB của E8 (AC-5, AC-6, AC-7, AC-8)

**Files:**
- Modify: `pipeline/import-s07-danh-muc.mjs`
- Modify: `pipeline/lib/s07-luoc-do.mjs`
- Modify: `pipeline/scripts/s07-danh-muc-db.test.mjs`

**Interfaces:**
- Consumes: Task 1 (`TEP_093`, lược đồ tạm), Task 2 (`dongCuaSnapshot`, `bo`).
- Produces: cờ `--json` của bộ nạp — dòng stdout cuối là JSON `{"snapshot","da_co_dau","bo_snapshot","the","du_an","sitemap","bo":{…sáu lý do…}}`; dòng chữ tổng kết đổi thành `… · bỏ: <n> phiên đăng nhập hoặc thiếu cờ, <n> lặp trong snapshot, <n> trang dự án rỗng, <n> thẻ không trỏ dự án, <n> kind lạ, <n> nguồn khác` · `soCotLech(dongDb, dongBoc, cot: string[]): string[]` · `bamBang(client, schema): Promise<string>` (sha256 của `row_to_json` mọi dòng ba bảng, sắp theo khoá) trong `s07-luoc-do.mjs`.

- [ ] **Step 1: Viết sáu ca còn lại của tệp DB** (cộng hai ca Task 1 = 8): `S07-AC-8 chưa áp 093`, `S07-AC-5 nạp, nạp lại, so từng cột`, `S07-AC-5 thư mục cha`, `S07-AC-5 hai thứ tự`, `S07-AC-6 S07_HOST sai không làm lọt`, `S07-AC-8 should-NOT-fire`. Bảng dựng bằng `TEP_093`. Khẳng định theo `expected` của E5, E7, E9 trong `evals.yaml`; thêm cho Review Focus 5: tên dự án của item trang dự án mang `\u0000` → nạp được, cột không chứa NUL. Chiều đỏ của bộ so cột: đổi chỗ `legal_raw`/`scale_raw` trên bản sao dòng → `soCotLech` trả `["legal_raw","scale_raw"]`; đổi `captured_at` → `["captured_at"]`. Chiều đỏ của ca hai thứ tự: `UPDATE` một ô ở lược đồ B → `bamBang` khác.
- [ ] **Step 2: Chạy, thấy đỏ** ở các ca mới.
- [ ] **Step 3: Sửa bộ nạp** — cờ `--json`, dòng tổng kết sáu lý do, cộng dồn `bo` qua các snapshot; không đổi luật ghi.
- [ ] **Step 4: Chạy lại** — lệnh `config:executors.test.s07_db` thoát 0 (`pass 8`).
- [ ] **Step 5: Commit** — `feat(pipeline): bộ nạp import-s07-danh-muc + test nạp trên lược đồ tạm`.

### Task 4: Lệnh đo trên dữ liệu thật

`independent: false` · phục vụ E10, E11 (AC-9)

**Files:**
- Create: `pipeline/scripts/s07-nap-that.mjs`

**Interfaces:**
- Consumes: bộ nạp `--json`, `TEP_093`, `kiemLuocDo093`.
- Produces: `node scripts/s07-nap-that.mjs [--goc <thư mục>] [--doi-chung]`; mã thoát 0 đạt · 1 lệch (in `LỆCH <bảng>` / `TÊN MIỀN trong <bảng>` / `NHÃN NGUỒN trong tệp <đường>` / `ĐỌC LẠI <n> snapshot`) · 2 từ chối (`TỪ CHỐI: DB chung` / `KHÔNG CÓ SNAPSHOT S07`).

- [ ] **Step 1: Viết lệnh.** Nhận DB theo tên: `new URL(DATABASE_URL).pathname` phải khớp `/^\/oneinvest_[a-z0-9_]+$/`, khác thì thoát 2. Gốc mặc định: `git rev-parse --path-format=absolute --git-common-dir` từ thư mục của tệp → `<cha của .git>/collector/snapshots/vn`. Đếm độc lập bằng mã riêng trong tệp này (không gọi `lib/s07-danh-muc.mjs`): chuỗi mở thẻ, `<loc>…-pj<số>`, item theo `kind` và cờ. Tên miền = host của `payload.canonical` các item thật; nhãn = nhãn đầu của tên miền. Soát tệp của vòng: danh sách cố định bảy đường dẫn tính từ gốc kho của tệp. In một dòng JSON kết quả (realpath gốc, số snapshot, ba cặp số, sáu con số bỏ, số host còn lại, số dòng còn nhãn nguồn) — không in tên miền, không in nhãn. `finally` xoá lược đồ tạm.
- [ ] **Step 2: `--doi-chung`** chạy năm cách phá theo `expected` của E11, mỗi cách phải ra đúng thông điệp; đủ năm thì in `ĐỐI CHỨNG ĐỎ ĐÚNG`, thiếu thì thoát 1 gọi tên cách phá không đỏ. Cách (4) và (5) chạy bằng `spawnSync` của chính lệnh với `DATABASE_URL`/`--goc` khác.
- [ ] **Step 3: Chạy** `config:executors.script.s07_nap_that` và `…_doi_chung` trên máy thu; cả hai thoát 0.
- [ ] **Step 4: Commit** — `feat(pipeline): lệnh đo nạp S07 trên dữ liệu thật + năm đối chứng`.

### Task 5: Tài liệu và cả bộ kiểm

`independent: false` · phục vụ mọi eval (đường `paths`)

**Files:**
- Modify: `collector/docs/DATA-CONTRACT.md` (mục S07 đã viết; thêm một dòng ở luật đọc 6: `attributes` là mảng cặp; dòng lịch sử v9 giữ)
- Modify: `pipeline/CLAUDE.md` (dòng bộ nạp: thêm `--json`, sáu lý do bỏ; thêm dòng `scripts/s07-nap-that.mjs`)

- [ ] **Step 1: Sửa hai tệp tài liệu.**
- [ ] **Step 2: Chạy** `cd pipeline && npm test` (cả bộ, DB riêng lượt) và `cd collector && npm run check && npm test`; cả hai xanh. Ca nào của kho đếm số migration hay danh sách bảng mà đỏ vì 093 thì sửa theo đúng cách các migration trước đã làm, ghi một dòng sổ `fix`.
- [ ] **Step 3: `node --check`** từng `.mjs` mới; soát tên miền và nhãn nguồn trên các tệp đã đổi (đã nằm trong lệnh Task 4).
- [ ] **Step 4: Commit** — `docs: DATA-CONTRACT v9 mục S07 + ghi chú pipeline`. Đặt hợp đồng `status: implemented`.
