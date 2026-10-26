# vong-doi-nguon (TV2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `source_registry` và `source_groups` có vòng đời năm trạng thái kiểm bằng CHECK (paused bắt buộc lý do), và một
hàm `isRunnable` kèm CLI trả quyết định chạy cho mọi tổ hợp nguồn × đơn vị.

**Architecture:** Migration 047 (chỉ DB local, tự bỏ qua khi thiếu bảng) thêm `status/reason/resume_when`, năm CHECK và
trigger giữ `source_groups.enabled` khớp `status`. Hàm thuần `pipeline/lib/vong-doi.mjs` + loader đọc DB + CLI. Route
`source-groups` ghi `status` thay vì `enabled`. Mọi phép thử chạy trên lược đồ tạm; `public` chỉ được áp 047 sau gộp.

**Tech Stack:** PostgreSQL 16 (PostGIS image, :5433), Node `node:test`, `pg`, Next.js route (TS, chạy test bằng `tsx`).

**Spec:** `docs/superpowers/specs/2026-10-26-vong-doi-nguon-design.md` · hợp đồng `_acceptance/vong-doi-nguon/contract.md` ·
evals `_acceptance/vong-doi-nguon/evals.yaml`.

## Global Constraints

- Năm trạng thái, đúng chữ thường: `draft`, `active`, `paused`, `retired`, `completed`.
- Tên ràng buộc: `source_registry_status_chk`, `source_registry_paused_reason_chk`, `source_groups_status_chk`,
  `source_groups_paused_reason_chk`, `source_groups_enabled_khop_chk`. Trigger: `source_groups_dong_bo_enabled`.
- Chuỗi cố định (nguyên văn): `'trước TV2a: chưa ghi lý do'` · `'trước TV2a: tắt bằng công tắc enabled'` ·
  `'tắt qua cột enabled (đường ghi cũ)'` · `'tắt bằng công tắc /ops/sources'` · lỗi trigger
  `source_groups: không bật được đơn vị retired qua cột enabled` (và `… completed …`).
- `ly_do` của `isRunnable`: `chay` · `nguon-khong-co` · `nguon-<tt>` · `don-vi-khong-co` · `don-vi-<tt>` ·
  `trang-thai-la:nguon` · `trang-thai-la:don-vi`. CLI thoát 0 chạy · 3 không chạy · 2 lỗi; stdout đúng một dòng JSON
  `{code, run, ly_do}`.
- Tệp 047 không có chuỗi `public.` hay `search_path`; không tên nguồn thật trong tệp nào (kho công khai).
- KHÔNG áp 047 lên `public` trước gộp (phiên liên làn dặn). KHÔNG sửa `pipeline/apify-*`, `pipeline/collect-*` (làn ZCode).
- Test cần DB đặt ở `*.itest.mjs` (ngoài `npm test` của pipeline, vì CI không có DB); test thuần ở `*.test.mjs`.
- Lược đồ tạm dùng `schemaUrl(S)` (`pipeline/scripts/ops-facts-fixture.mjs`): `search_path` CHỈ gồm lược đồ tạm.

## Review Focus

1. DB đang có giá trị `status` lạ (chữ hoa, chữ khác) lúc áp 047 → migration phải lỗi trọn (không áp nửa chừng), nêu
   tên ràng buộc. Ca: Task 2, `VD-AC-3c`.
2. Route nhận `reason` toàn khoảng trắng → coi như vắng, ghi lý do mặc định (không để CHECK ném 500). Ca: Task 4.
3. Route bật nhóm `draft` → `active` (bật lần đầu); bật nhóm đang `active` → 200, không dòng audit mới. Ca: Task 4.
4. CLI nhận `group_key` là URL có `?`, `&`, khoảng trắng → truyền nguyên văn qua tham số SQL, không cắt. Ca: Task 3.
5. Chạy 047 khi chỉ một trong hai bảng có mặt → khối của bảng có mặt chạy, khối kia bỏ qua. Ca: Task 2, `VD-AC-8b`.

---

### Task 1: Luật chạy thuần `isRunnable`

**independent: true** · phục vụ E4 (AC-4)

**Files:**
- Create: `pipeline/lib/vong-doi.mjs`
- Test: `pipeline/scripts/vong-doi.test.mjs`

**Interfaces:**
- Produces: `export const TRANG_THAI: readonly string[]` (5 giá trị, thứ tự Global Constraints) ·
  `export function isRunnable(source: {code:string,status:string}|null, unit?: {status:string}|null): {run:boolean, ly_do:string}`
  — `unit === undefined` là «không hỏi đơn vị»; `unit === null` là «hỏi mà không có» → `don-vi-khong-co`.

- [ ] **Step 1: Viết test `VD-AC-4`** — bảng 49 dòng viết tay trước (nguồn × đơn vị theo evals E4), `assert.equal(BANG.length, 49)`
  trước khi lặp; mỗi dòng `deepEqual(isRunnable(...), {run, ly_do})`; đếm `run === true` bằng 2. Thêm ca `null` đơn vị
  (`{status:'active'}`, `null`) → `don-vi-khong-co`.
- [ ] **Step 2: Viết test `VD-AC-4b`** — chép `vong-doi.mjs` ra thư mục tạm (`fs.mkdtempSync`), thay một chuỗi ghim để
  `completed` qua cổng nguồn như `active`, import bản chép, chạy cùng bảng → tập ô lệch `deepEqual` danh sách viết trước
  7 ô nguồn `completed`; thông điệp `assert` nêu `completed`. Chuỗi ghim phải có thật trong tệp (test đỏ nếu `replace` không đổi gì).
- [ ] **Step 3:** `cd pipeline && node --test scripts/vong-doi.test.mjs` → FAIL (module chưa có).
- [ ] **Step 4:** Viết `isRunnable` theo thứ tự chặn của design doc (nguồn có → lạ → ≠ active → hỏi đơn vị? → có → lạ → ≠ active).
- [ ] **Step 5:** Chạy lại → PASS; `cd pipeline && npm test` → PASS.
- [ ] **Step 6: Commit** `feat(pipeline): isRunnable — luật chạy theo vòng đời nguồn × đơn vị (TV2a)`.

### Task 2: Migration 047 + khung itest

**independent: false** (Task 3, 4, 5 dùng helper và migration này) · phục vụ E1, E2, E3, E10, E12 (AC-1, 2, 3, 8, 10)

**Files:**
- Create: `db/migrations/047_vong_doi_nguon.sql`
- Create: `pipeline/scripts/vong-doi-fixture.mjs` (helper dùng chung cho itest và test app)
- Test: `pipeline/scripts/vong-doi.itest.mjs`

**Interfaces:**
- Produces (từ `vong-doi-fixture.mjs`):
  - `MIGRATION_047: string` — đường tuyệt đối suy từ vị trí tệp (không hardcode ROOT).
  - `dungKhuonTruoc(admin: pg.Client, S: string, {coRegistry=true, coGroups=true}={}): Promise<void>` — tạo lược đồ `S`,
    hai bảng ở khuôn TRƯỚC 047 (cột 012 + 013 + 024: registry `code, real_name, label_vi, status DEFAULT 'active', since,
    retired_at, source_ids, note`; groups `id, source_code, group_key, name, enabled DEFAULT true, params, note, created_at,
    updated_at`, FK sang registry).
  - `chay047(client: pg.Client): Promise<void>` — đọc tệp 047, một lời gọi `client.query(sql)`.
  - `chupPublic(admin: pg.Client): Promise<object>` — cột của hai bảng ở `public`, tên trong `pg_proc`/`pg_trigger`/
    `pg_constraint` của lược đồ `public`, `count(*)` của `public.ops_audit`.
  - `xoaLuocDo(admin, S)`.
- Produces (DB): cột `reason`, `resume_when` (cả hai bảng), `source_groups.status NOT NULL`; năm CHECK; trigger
  `source_groups_dong_bo_enabled` + hàm cùng tên.

- [ ] **Step 1: Ca `VD-KHUON`** — cột khuôn trước của fixture = cột `public` (đọc `information_schema.columns`) trừ
  `{reason, resume_when, status (chỉ source_groups)}`; lệch → `fail` nêu tên cột. (Ca này đúng cả trước lẫn sau khi
  public áp 047.)
- [ ] **Step 2: Ca `VD-AC-1`, `VD-AC-2`, `VD-AC-3` (a–d), `VD-AC-3c`, `VD-AC-8`, `VD-AC-8b`, `VD-AC-10`** đúng như `expected` của
  E1, E2, E3, E10, E12 trong `evals.yaml`, kèm các ca đối chứng gỡ CHECK/trigger trên bản sao. `VD-AC-3c`: khuôn trước có
  một dòng registry `status = 'Active'` → `chay047` ném lỗi chứa `source_registry_status_chk`, và lược đồ không có cột
  `reason` (giao dịch quay lui). `VD-AC-8b`: chỉ có `source_registry` → 047 chạy, registry có `reason`, không lỗi.
  `before`/`after` của tệp: `chupPublic` trước và sau → `deepEqual`.
- [ ] **Step 3:** `cd pipeline && node --test scripts/vong-doi.itest.mjs` → FAIL (chưa có 047).
- [ ] **Step 4: Viết 047.** Mở đầu comment theo `.claude/rules/migrations.md` (tên tệp, TV2a, ADR-0015, design doc,
  `KHÔNG sync cloud (tầng A)`). Toàn tệp trong `BEGIN … COMMIT`. Mỗi bảng một khối `DO $$ … IF to_regclass('source_registry')
  IS NULL THEN RETURN; …` (tên không tiền tố). Thứ tự trong khối groups: thêm cột → backfill `status`/`reason` từ `enabled`
  → `SET NOT NULL` → CHECK (dùng `DROP CONSTRAINT IF EXISTS` rồi `ADD`) → `CREATE OR REPLACE FUNCTION` trigger →
  `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER … BEFORE INSERT OR UPDATE … FOR EACH ROW`. Hàm trigger theo bảng 5 × 2 của
  design doc; nhánh UPDATE phân biệt «đổi status» (`NEW.status IS DISTINCT FROM OLD.status`) với «chỉ đổi enabled».
- [ ] **Step 5:** Chạy lại itest → PASS. Soát: `grep -nE "public\.|search_path" db/migrations/047_vong_doi_nguon.sql` → rỗng.
- [ ] **Step 6: Commit** `feat(db): 047 vòng đời nguồn — CHECK năm trạng thái, lý do tạm dừng, trigger giữ enabled khớp (TV2a)`.

### Task 3: Loader + CLI, và câu đọc của bên đọc

**independent: false** (cần Task 1, 2) · phục vụ E5, E7, E13 (AC-5, AC-7)

**Files:**
- Modify: `pipeline/lib/vong-doi.mjs` (thêm loader + nhánh CLI)
- Test: `pipeline/scripts/vong-doi.itest.mjs`

**Interfaces:**
- Produces: `export async function docTrangThai(client: pg.Client, code: string, unitKey?: string): Promise<{run, ly_do}>`
  — `SELECT status FROM source_registry WHERE code = $1`; có `unitKey` thì `SELECT status FROM source_groups WHERE
  source_code = $1 AND group_key = $2` (không có dòng → `unit = null`). CLI khi `import.meta.url` là tệp chạy:
  `node pipeline/lib/vong-doi.mjs <mã> [--unit <group_key>]`, `DATABASE_URL` hoặc `localDbUrl()`.

- [ ] **Step 1: Ca `VD-AC-5`** đúng E5 (gọi CLI bằng `execFileSync(process.execPath, [...])`, đọc `status` thoát), thêm ca
  Review Focus 4 (`--unit 'https://vi-du.invalid/nhom a?x=1&y=2'` có dòng `active` → thoát 0).
- [ ] **Step 2: Ca `VD-AC-7`, `VD-AC-7b`** đúng E7, E13: rút câu SQL bằng regex trên mã nguồn (`readFileSync`), không rút
  được đúng một câu → `fail` nêu tệp; chạy trên lược đồ tạm đã 047. Câu có tham số (`$1`) thì truyền giá trị của ca.
- [ ] **Step 3:** Chạy → FAIL. **Step 4:** Viết loader + CLI. **Step 5:** Chạy → PASS.
- [ ] **Step 6: Commit** `feat(pipeline): CLI vong-doi — hỏi nguồn/đơn vị có được thu (TV2a)`.

### Task 4: Route `source-groups` ghi `status`

**independent: false** (cần Task 2 cho lược đồ) · phục vụ E6 (AC-6)

**Files:**
- Modify: `app/src/app/api/v1/ops/source-groups/route.ts` (nhánh `toggle`, `add`)
- Test: `app/tests/vong-doi-nguon.test.tsx`

**Interfaces:**
- Consumes: `dungKhuonTruoc`, `chay047`, `chupPublic`, `xoaLuocDo` (Task 2).
- Thân `toggle` nhận thêm `reason?: string`, `resumeWhen?: string`. Trả 409 `{error: "nhóm đã gỡ — không bật lại"}` khi
  bật nhóm `retired` hay `completed`. Audit detail `{sourceCode, groupKey, enabled, from, to}`.

- [ ] **Step 1: Ca `VD-AC-6`** đúng E6, cộng ca `VD-AC-6b`: cùng các lời gọi trên lược đồ tạm khuôn TRƯỚC 047 → hành vi hôm
  nay (toggle đổi `enabled`, add chèn `enabled = true`), 200, không ném lỗi cột; (đặt `DATABASE_URL = schemaUrl(S)` và `OPS_API_TOKEN` TRƯỚC import động route, như
  `che-do-thu.test.tsx`), lược đồ tạm có `ops_audit`, `stg_zalo_posts` chép `LIKE public.… INCLUDING ALL`; thêm ca Review
  Focus 2 (`reason: '   '` → lý do mặc định) và 3 (bật `draft` → `active`; bật `active` → 200, audit không tăng).
- [ ] **Step 2:** `cd app && node --import tsx --test tests/vong-doi-nguon.test.tsx` → FAIL.
- [ ] **Step 3:** Sửa route. Mỗi lần ghi, hỏi `information_schema.columns` xem `source_groups.status` đã có chưa (không
  cache — tiến trình app mở trước lúc áp 047 phải tự sang đường mới). **Chưa có** (public trước 047): `toggle`/`add` chạy y
  như hôm nay, ghi `enabled`. **Đã có**: `toggle` đọc dòng `FOR UPDATE` trong một giao dịch, tính `to`, `UPDATE … SET status,
  reason, resume_when`; `add` chèn `status = 'active'` (không nêu `enabled`). Không đụng `delete`, `set-mode`, `GET`.
  Lý do: ca `che-do-thu` (E8, hồ sơ đã ký) gọi route thật trên bản chép khuôn `public` — trước gộp `public` chưa có 047.
  Nhánh «chưa có» bỏ được ở TV5 (route bị lệnh thay).
- [ ] **Step 4:** Chạy → PASS; `cd app && npx tsc --noEmit && npm run lint && npm test` → PASS.
- [ ] **Step 5: Commit** `feat(ops): route source-groups ghi trạng thái vòng đời, chặn bật nhóm đã gỡ (TV2a)`.

### Task 5: Chứng trên bản chép dữ liệu thật

**independent: false** (cần Task 2) · phục vụ E11 (AC-9)

**Files:**
- Test: `pipeline/scripts/vong-doi-local.itest.mjs`

- [ ] **Step 1: Ca `VD-AC-9`** đúng E11: `CREATE TABLE S.x (LIKE public.x INCLUDING ALL)` + `INSERT … SELECT * FROM public.x`
  cho hai bảng (public chưa áp 047), chụp số dòng theo status và cặp `(id, enabled)`, `chay047`, so; `chupPublic` trước/sau
  `deepEqual`; soát `guardValues` (`pipeline/lib/tier-a-guard.mjs`, `entriesFromTokens`) trên nội dung tệp 047 và
  `vong-doi.mjs` → 0 chỗ trúng, đối chứng một chuỗi chứa `real_name` đầu tiên → ≥ 1 (không in tên).
- [ ] **Step 2:** `cd pipeline && node --test scripts/vong-doi-local.itest.mjs` → PASS.
- [ ] **Step 3: Commit** `test(pipeline): 047 trên bản chép dữ liệu local (TV2a AC-9)`.

### Task 6: Tài liệu

**independent: true** · không phục vụ eval

**Files:** Modify `docs/ROADMAP.md` (§2.3 cột trạng thái ghi «năm trạng thái có CHECK sau 047»; §4 Track 5 thêm dòng V14
TV2a `_acceptance/vong-doi-nguon` 🔄), `docs/ops/runtime-map.md` nếu có mục DB local (thêm «áp 047 sau gộp»).

- [ ] **Step 1:** Sửa hai tệp. **Step 2: Commit** `docs: ROADMAP — TV2a vòng đời nguồn`.

## Sau gộp (không phải task của nhánh)

Áp 047 lên DB local :5433 bằng lệnh của `.claude/rules/migrations.md`, rồi chạy lại `executors.test.vong_doi_nguon`. Báo
phiên liên làn để ZCode biết `isRunnable`/CLI đã có cho TV2b.
