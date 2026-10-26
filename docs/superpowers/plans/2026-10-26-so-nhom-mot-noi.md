# so-nhom-mot-noi (PL12) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một sổ `collection_units` (đổi tên từ `source_groups`, view tương thích tên cũ) chứa mọi đơn vị thu S02/S03/S05/S06
với mã ổn định `S0x-[NVM]ddd`, thị trường, dự án; script đồng bộ chỉ đọc nguồn; khu «Sổ đơn vị thu» trên `/ops/sources`.

**Architecture:** Migration 048 đổi tên bảng, thêm cột + bộ đếm mã + ba trigger, dựng view `source_groups` gồm mọi dòng
(ghi xuyên được, trigger 047 vẫn chạy trên bảng gốc). Bên đọc/ghi cũ giữ nguyên câu SQL; ba chỗ của trang nhóm thu cũ
lọc S05/S06. `pipeline/sync-don-vi.mjs` upsert S03 (từ cấu hình gateway, chỉ đọc, qua `readS03Groups` cạnh
`readS03Allowlist`) và S02 (từ `airdna_markets` + `area_sources`). Route `source-groups` thêm action `set-meta` (admin,
audit cùng giao dịch); trang thêm khu sổ. Mọi phép thử chạy trên lược đồ tạm; `public` chỉ áp 048 sau gộp.

**Tech Stack:** PostgreSQL 16 (:5433), Node `node:test` + `pg`, Next.js 16 route/RSC (TS, test bằng `tsx` + jsdom), ReUI.

**Spec:** `docs/superpowers/specs/2026-10-26-so-nhom-mot-noi-design.md` · hợp đồng `_acceptance/so-nhom-mot-noi/contract.md`
(duyệt 26/10: Hỏi-1 có · Hỏi-2 bỏ design-pass · Hỏi-3 chỉ khu đô thị · Hỏi-4 paused giữ mã) · `evals.yaml` E1–E13.

## Global Constraints

- Tên: bảng `collection_units`, view `source_groups`, bảng đếm `collection_unit_seq(source_code text, unit_type text,
  last int, PRIMARY KEY (source_code, unit_type))`. Trigger trên `collection_units`: `collection_units_cap_ma` (BEFORE
  INSERT), `collection_units_khoa_ma` (BEFORE UPDATE OF unit_code), `collection_units_kiem_tham_chieu` (BEFORE INSERT OR
  UPDATE OF market_codes, project_node_ids). Giữ nguyên tên năm CHECK của 047, trigger `source_groups_dong_bo_enabled`,
  khoá duy nhất `source_groups_source_code_group_key_key`, dãy `source_groups_id_seq`.
- `unit_type` ∈ `nhom` · `vung` · `market`; chữ mã N · V · M. Suy khi chèn không nêu: S03, S05 → `nhom`; S06 → `vung`;
  S02 → `market`; mã khác → lỗi `collection_units: không suy được unit_type cho <mã>` (check_violation).
- Khuôn mã `^S0[0-9]-[NVM][0-9]{3}$`; backfill theo `id`; không cấp lại sau xoá hay `retired`.
- `project_node_ids` chỉ nhận `asset_nodes.node_type = 'project'` (Hỏi-3). `market_codes` chỉ nhận `areas.region_type = 'market'`.
- Lý do cố định (nguyên văn): `'tắt ở gateway'` · `'không còn ở gateway'` (Hỏi-4). Nhãn UI: «Sổ đơn vị thu», «theo gateway»,
  «Khai thị trường, dự án», «Chưa có đơn vị nào», «Không đọc được sổ đơn vị thu».
- Action audit: `source-group:set-meta`. Mã ngoài S05/S06 ở `toggle`/`add`/`delete`/`set-mode` → 400
  `{error: "chỉ quản nhóm S05/S06 ở đây"}`.
- Khoá S03 lưu bỏ tiền tố `group:` (một nhóm một dòng dù cấu hình viết hai kiểu).
- Tệp 048 không có `public.` hay `search_path`; không tên nguồn thật, không id nhóm thật trong mọi tệp (kho công khai).
- KHÔNG áp 048 lên `public` trước gộp. KHÔNG sửa `pipeline/apify-*`, `pipeline/collect-*` (làn ZCode). KHÔNG ghi
  cấu hình gateway (luật 8) — script chỉ `readFile`.
- Test cần DB ở `*.itest.mjs`; lược đồ tạm qua `schemaUrl(S)` (search_path chỉ lược đồ tạm). UI theo ReUI/onehub-ui
  (khối `ReUI design rules` của AGENTS.md).

## Review Focus

1. Đường ghi cũ chèn qua view không nêu `unit_type`/`unit_code`/`original_name` (route `add`, script khác) → trigger suy;
   mã nguồn không suy được → lỗi có tên, không chèn nửa. Ca: Task 1 `SN-AC-3b`.
2. Chèn qua view không nêu `status`/`params` → nhận mặc định của BẢNG GỐC (không NULL). Ca: Task 1 `SN-AC-1b`, và
   bản chép test C7 (`LIKE public.source_groups` từ view mất mặc định) ở Task 2 `SN-AC-2b`.
3. Cấu hình gateway có cùng nhóm ở hai tài khoản, một nơi viết `group:<id>`, nơi kia `<id>` → một đơn vị. Nhóm bật ở tài
   khoản A, tắt ở tài khoản B → `active` (hợp các nhóm bật, như `readS03Allowlist`). Ca: Task 4 `SN-AC-5c`.
4. `set-meta` nhận mảng có phần tử trùng hoặc rỗng → khử trùng; mảng rỗng xoá khai báo (200). Ca: Task 5 `SN-AC-8b`.
5. Danh sách tên che ảnh chụp (`scripts/ui-standards/tier-a-names.mjs`) đọc `source_groups` → sau đồng bộ kéo tên
   market S02 và khoá S03 vào; phải chỉ đọc S05/S06. Ca: Task 3 `SN-AC-2c`.

---

### Task 1: Migration 048 — sổ, mã, kiểm tham chiếu

**independent: false** (mọi task sau dựa vào khuôn này) · phục vụ E1 (AC-1), E4 (AC-3), E5 (AC-4)

**Files:**
- Create: `db/migrations/048_so_nhom_mot_noi.sql`
- Create: `pipeline/scripts/so-nhom-fixture.mjs`
- Create: `pipeline/scripts/so-nhom.itest.mjs`

**Interfaces:**
- Consumes: `dungKhuonTruoc`, `chay047`, `chupPublic`, `xoaLuocDo` (`vong-doi-fixture.mjs`); `schemaUrl` (`ops-facts-fixture.mjs`).
- Produces: `MIGRATION_048: string` · `chay048(client): Promise<void>` · `dungSauGop(admin, S, {thamChieu?: boolean}):
  Promise<void>` (khuôn trước 047 + 047 + 048; `thamChieu` thêm `areas`/`asset_nodes` tối giản: 1 market `vn-sn-m1`,
  1 submarket `vn-sn-s1`, node project id 9001, node building id 9002) · `DAU_SN = 'sn-thu'`.

- [ ] **Step 1: Viết `SN-AC-1`** theo E1 nguyên văn (4 nhóm, chạy 048 hai lần, `pg_class.relkind` r/v, dữ liệu deepEqual,
  trigger trên `collection_units`, năm tên CHECK, view đủ dòng + đúng tên cột cũ, đối chứng đổi tên cột view làm câu
  rút từ `collect-chotot.mjs` ném lỗi). Thêm `SN-AC-1b`: `INSERT INTO source_groups (source_code, group_key, name)` →
  `status = 'active'`, `params = '{}'`, `unit_type = 'nhom'` cho S05. `before/after` `chupPublic` bằng nhau.
- [ ] **Step 2: Viết `SN-AC-3`** theo E4 nguyên văn, cộng `SN-AC-3b` (chèn S01 qua view → lỗi nêu `không suy được
  unit_type`, số dòng không đổi).
- [ ] **Step 3: Viết `SN-AC-4`** theo E5 với Hỏi-3 (node 9002 building → lỗi; 9001 → nhận; 999999 → lỗi; `vn-sn-s1` → lỗi;
  `vn-xyz-khong-co` → lỗi; `vn-sn-m1` → nhận); mọi lỗi nêu `collection_units_kiem_tham_chieu`.
- [ ] **Step 4: Chạy** `cd pipeline && node --test scripts/so-nhom.itest.mjs` → FAIL (tệp 048 chưa có).
- [ ] **Step 5: Viết 048.** Một `BEGIN … COMMIT`, khối `DO` bỏ qua khi thiếu cả hai tên. Thứ tự: `ALTER TABLE
  source_groups RENAME TO collection_units` (chỉ khi `to_regclass('collection_units') IS NULL`); thêm cột (`IF NOT
  EXISTS`); bảng đếm; backfill `unit_type`, `original_name := name`, mã theo `id` (rồi `last` của bộ đếm = số đã cấp);
  `SET NOT NULL` + CHECK khuôn mã + UNIQUE `unit_code`; ba hàm trigger (`CREATE OR REPLACE`) và `DROP TRIGGER IF EXISTS`
  + `CREATE TRIGGER`; `CREATE OR REPLACE VIEW source_groups AS SELECT id, source_code, group_key, name, enabled, params,
  note, created_at, updated_at, status, reason, resume_when FROM collection_units`. Kiểm tham chiếu: `EXISTS` trên
  `areas`/`asset_nodes` (bảng vắng → lỗi có tên khi mảng khác rỗng). Đầu tệp: chú thích kiểu 047 (căn cứ, không cloud,
  áp sau gộp).
- [ ] **Step 6: Chạy lại** lệnh Step 4 → PASS; `bash scripts/check-migration-header.sh` nếu có, không thì soát tay đầu tệp.
- [ ] **Step 7: Commit** `feat(db): 048 sổ đơn vị thu — collection_units, mã đơn vị, view source_groups (PL12)`.

### Task 2: Đường cũ qua view — rút câu SQL, test C7 và TV2a sau gộp

**independent: false** (cần Task 1) · phục vụ E2, E3, E13 (AC-2)

**Files:**
- Modify: `pipeline/scripts/so-nhom.itest.mjs`
- Modify: `pipeline/scripts/vong-doi-fixture.mjs`, `pipeline/scripts/vong-doi.itest.mjs` (VD-KHUON đọc `collection_units`
  khi public có bảng ấy, không thì `source_groups` — fixture không lệch bảng thật sau khi public áp 048)

**Interfaces:**
- Consumes: `dungSauGop`, `chay048` (Task 1).
- Produces: `TEP_NHAC_SOURCE_GROUPS: string[]` (danh sách viết trước trong `so-nhom.itest.mjs`, dùng ở E2).

- [ ] **Step 1: Viết `SN-AC-2`** theo E2 nguyên văn: số câu rút mỗi tệp viết trước (đếm bằng tay lúc viết test, ghi hằng);
  hai lược đồ song song (sau 047 / sau 048) so tập dòng; ca ghi; S03/S02 chèn thêm không lọt kết quả câu đọc của
  script thu và `docNhomThu`/GET (hai cái sau đo ở Task 3 bằng hàm thật); `ha-bung-het-han` `FOR UPDATE` trên dòng S03
  mode bung; `docTrangThai(c,'S03',k)`. Tập `git grep -l source_groups` (loại `_acceptance/`, `docs/`, `db/migrations/0*`)
  deepEqual `TEP_NHAC_SOURCE_GROUPS`.
- [ ] **Step 2: Viết `SN-AC-2b`** theo E3 nguyên văn (chép `app/tests/che-do-thu.test.tsx` → `app/tests/.sn-che-do-thu-<pid>.test.tsx`,
  thay `public.` → `<P>.` với số chỗ thay viết trước, chạy `node --import tsx --test` trong `app/`, `finally` xoá tệp;
  đối chứng P không có cột `status` trong view → bản chép đỏ).
- [ ] **Step 3: Chạy** `cd pipeline && node --test scripts/so-nhom.itest.mjs` → ca 2/2b PASS hoặc chỉ ra chỗ fixture TV2a lệch.
- [ ] **Step 4: Sửa VD-KHUON** trong `vong-doi-fixture.mjs`/`vong-doi.itest.mjs` theo Files; chạy
  `config:executors.test.vong_doi_nguon` → PASS (E13).
- [ ] **Step 5: Commit** `test(pl12): đường cũ qua view source_groups — câu rút nguyên văn, C7 và TV2a sau gộp`.

### Task 3: Bên đọc cũ chỉ S05/S06 — route, docNhomThu, danh sách che ảnh

**independent: false** (cần Task 1 để đo) · phục vụ E2 (AC-2), E8 (AC-7)

**Files:**
- Modify: `app/src/lib/che-do-thu.ts` (`docNhomThu` thêm `WHERE g.source_code IN ('S05','S06')`; `datCheDo` mã khác → 400)
- Modify: `app/src/app/api/v1/ops/source-groups/route.ts` (GET lọc như trên; `toggle`/`add`/`delete` mã khác → 400 trước mọi ghi)
- Modify: `scripts/ui-standards/tier-a-names.mjs` (hai câu `source_groups` thêm `WHERE source_code IN ('S05','S06')`)
- Test: `app/tests/so-nhom.test.tsx` (ca `SN-AC-2-route`), `pipeline/scripts/so-nhom.itest.mjs` (`SN-AC-2c`, `SN-AC-7`)

**Interfaces:**
- Consumes: `dungSauGop` (Task 1). `docTrangThai` giữ câu trên tên `source_groups` (view = mọi dòng, chạy được cả trước và sau 048).

- [ ] **Step 1: Viết `SN-AC-2-route`** — lược đồ tạm sau gộp có một đơn vị mỗi nguồn: `docNhomThu()` và GET chỉ trả S05/S06;
  POST `toggle`/`add`/`delete`/`set-mode` với `sourceCode: 'S03'` → 400 đúng chuỗi lỗi, dòng không đổi, không dòng audit.
- [ ] **Step 2: Viết `SN-AC-2c`** — chạy `tier-a-names.mjs --out <tạm>` với `DATABASE_URL` lược đồ tạm có tên market và khoá
  S03 dấu `sn-thu-…`: tệp ra không chứa dấu ấy; tên nhóm S05 dấu vẫn có.
- [ ] **Step 3: Viết `SN-AC-7`** theo E8 nguyên văn.
- [ ] **Step 4: Chạy** hai lệnh test → FAIL ở 2-route và 2c.
- [ ] **Step 5: Sửa** ba tệp theo Files.
- [ ] **Step 6: Chạy lại** → PASS; `cd app && npx tsc --noEmit`.
- [ ] **Step 7: Commit** `fix(ops): trang nhóm thu cũ chỉ quản S05/S06 sau khi gộp sổ (PL12)`.

### Task 4: Script đồng bộ `sync-don-vi.mjs` (S03, S02)

**independent: true** (sau Task 1; không chạm tệp của Task 3/5) · phục vụ E6 (AC-5), E7 (AC-6)

**Files:**
- Modify: `scripts/lib/ops-local.mjs` (thêm `readS03Groups`)
- Create: `pipeline/sync-don-vi.mjs`
- Test: `pipeline/scripts/so-nhom.itest.mjs` (`SN-AC-5`, `SN-AC-5b`, `SN-AC-5c`, `SN-AC-6`)

**Interfaces:**
- Produces: `export function readS03Groups(z): {key: string, enabled: boolean}[]` — hợp nhóm mọi tài khoản theo cùng luật
  kế thừa của `readS03Allowlist`, khoá bỏ `group:`, `enabled` = bật ở ít nhất một tài khoản; thứ tự theo khoá.
  `pipeline/sync-don-vi.mjs`: CLI `node pipeline/sync-don-vi.mjs [--chi S02|S03]`; đường cấu hình `ONEHUB_GATEWAY_CONFIG`
  (mặc định đường hiện có trong `push-ops-facts.mjs`); export `dongBoS03(client, z)`, `dongBoS02(client)` trả
  `{them, doi, giu}`. stdout một dòng mỗi nguồn: `S03: thêm a · đổi b · giữ c` (không khoá, không tên). Thoát 0 xong ·
  1 lỗi đọc cấu hình/JSON (sổ không đổi, cả lượt trong một giao dịch, S02 cũng không ghi) · 2 lỗi DB.
- Luật S03: dòng có mặt và bật → `active` (lý do, `resume_when` xoá); có mặt, tắt → `paused` `'tắt ở gateway'`; vắng khỏi
  cấu hình → `paused` `'không còn ở gateway'`; KHÔNG chạm dòng `retired`/`completed`. `original_name` = `groups[k].name`
  nếu có, không thì `'Nhóm S03 chưa có tên'` (tiêu đề chuẩn là ON19).
- Luật S02: mỗi `airdna_markets` một đơn vị `market`, `unit_key = airdna_id`, `original_name = name`; `market_codes` lấy từ
  `area_sources` (`source = 'S02'`, `source_area_key = airdna_id`) CHỈ khi dòng đang rỗng — khai tay của admin thắng.

- [ ] **Step 1: Viết `SN-AC-5`** theo E6 nguyên văn (4 lượt chạy, tệp vắng, tệp hỏng, băm, stdout).
- [ ] **Step 2: Viết `SN-AC-5b`** theo E6: ma trận 5 fixture, `effectiveEnabledGroups` (TS, import qua `tsx` trong test app
  `app/tests/so-nhom.test.tsx`) so tập khoá `enabled` của `readS03Groups`; một fixture sinh bằng `setZaloGroupEnabled`
  trên tệp tạm (biến môi trường trỏ cấu hình tạm như `zalo-safety` đang làm).
- [ ] **Step 3: Viết `SN-AC-5c`** (Review Focus 3) và `SN-AC-6` theo E7.
- [ ] **Step 4: Chạy** → FAIL.
- [ ] **Step 5: Viết** `readS03Groups` rồi `sync-don-vi.mjs` (entry check `realpathSync` như `vong-doi.mjs`).
- [ ] **Step 6: Chạy lại** → PASS; `node --check pipeline/sync-don-vi.mjs`.
- [ ] **Step 7: Commit** `feat(pipeline): sync-don-vi đưa S03 (chỉ đọc gateway) và S02 vào sổ đơn vị thu (PL12)`.

### Task 5: Khu «Sổ đơn vị thu» + action `set-meta`

**independent: true** (sau Task 1; tệp riêng, trừ hai chỗ nối ở `route.ts` và `sources-content.tsx`) · phục vụ E9, E10 (AC-8), E11 (AC-9)

**Files:**
- Create: `app/src/lib/so-don-vi.ts`
- Create: `app/src/components/ops/sources/so-don-vi.tsx`, `app/src/components/ops/sources/so-don-vi-dialog.tsx`
- Modify: `app/src/app/api/v1/ops/source-groups/route.ts` (nhánh `set-meta` trước nhánh `toggle`)
- Modify: `app/src/components/ops/sources/sources-content.tsx` (đọc sổ + danh mục, đặt khu sau `SourceGroups`)
- Modify: `CONTEXT.md` (thuật ngữ «Sổ đơn vị thu» · code `collection_units` · slug — · định nghĩa · _Avoid_ «bảng nhóm»)
- Test: `app/tests/so-nhom.test.tsx` (`SN-AC-8`, `SN-AC-8b`, `SN-AC-9`)

**Interfaces:**
- Produces (`so-don-vi.ts`): `type DonViRow = {unit_code, source_code, unit_type, original_name, market_codes: string[],
  project_node_ids: number[], status, reason: string|null}` (không `group_key`) · `docSoDonVi(db?): Promise<DonViRow[]>`
  (ném khi lỗi) · `docDanhMuc(db?): Promise<{markets: {id,name}[], projects: {id,name}[]}>` · `khaiDonVi(body, getUser,
  db?): Promise<{status: number, body: object}>` — chỉ người `role = 'admin'` (Bearer/không phiên/`ops` → 403), khử trùng
  mảng, `UPDATE collection_units … WHERE unit_code = $1` + `INSERT INTO ops_audit` cùng giao dịch, lỗi
  `check_violation` → 400 kèm chữ lỗi, mã không có → 404.
- UI: `SoDonVi({rows, danhMuc, loi})` client — `StatusGrid` tab theo nguồn (S02, S03, S05, S06), cột mã · nguồn · tên gốc ·
  thị trường (tên) · dự án (tên) · trạng thái (`Badge` `-light`) + chữ phụ «theo gateway» ở dòng S03; tab rỗng → `Empty`
  kèm nút sao chép `node pipeline/sync-don-vi.mjs`; `loi` → `RegionError` «Không đọc được sổ đơn vị thu» + Thử lại
  (`router.refresh()`). `SoDonViDialog` — `Dialog` + hai `Combobox` chọn nhiều; Lưu khoá khi gửi; 4xx giữ hộp mở, hiện chữ lỗi.

- [ ] **Step 1: Viết `SN-AC-8`** theo E9 nguyên văn (jsdom vẽ bằng hàm đọc thật, nhãn theo gateway, đối chứng CHECK audit,
  fetch giả 400, tab rỗng, hàm đọc ném).
- [ ] **Step 2: Viết `SN-AC-8b`** (Review Focus 4) và `SN-AC-9` theo E11.
- [ ] **Step 3: Chạy** `config:executors.test.so_nhom_app` → FAIL.
- [ ] **Step 4: Viết** `so-don-vi.ts`, nhánh route, hai component, nối `sources-content.tsx` (đọc trong `try`, lỗi →
  `loi = true`); viết kế hoạch UI 7 dòng của `.agents/skills/reui/SKILL.md` vào commit message trước khi viết TSX.
- [ ] **Step 5: Chạy lại** → PASS; `cd app && npx tsc --noEmit && npm run lint`; tự kiểm ReUI trên tệp đã đổi (≤2 vòng).
- [ ] **Step 6: Nhìn** — `public` chưa được áp 048, nên dựng lược đồ `sn_ui` (`dungSauGop` + chép dòng
  `public.source_groups` + `sync-don-vi` trỏ vào đó) và chạy dev ở `:3457` với
  `DATABASE_URL=…/oneinvest?options=-c%20search_path%3Dsn_ui,public` (bảng khác rơi về `public`; audit ghi
  `public.ops_audit` mang dấu `sn-thu`). Chụp sáng, tối, khổ hẹp, tab trống, hộp khai; xoá `sn_ui` sau chụp. Cùng
  cách ấy dùng cho E10 ở S4. Trên `:3456` (`public` chưa áp) chụp thêm trạng thái «Không đọc được sổ» để chứng trang
  không vỡ trước khi áp.
- [ ] **Step 7: Commit** `feat(ops): khu Sổ đơn vị thu trên /ops/sources — khai thị trường, dự án (PL12)`.

### Task 6: Không lên cloud + tài liệu

**independent: false** (cuối) · phục vụ E12 (AC-10)

**Files:**
- Test: `pipeline/scripts/so-nhom.itest.mjs` (`SN-AC-10`)
- Modify: `docs/ROADMAP.md` (§2 as-built, §4 trạng thái PL12), `docs/ops/runtime-map.md` (lệnh `sync-don-vi` chạy tay)

- [ ] **Step 1: Viết `SN-AC-10`** theo E12 (bản đã chỉnh — xem mục «Lệch hợp đồng» dưới).
- [ ] **Step 2: Chạy** → PASS; `/verify` (app, pipeline, scripts).
- [ ] **Step 3: Commit** `docs(pl12): ROADMAP, runtime-map — sổ đơn vị thu`.

---

## Lệch hợp đồng cần anh quyết ở Gate 1.5

**E12 (AC-10) không đạt được như đã viết.** E12 bảo soát `guardValues` (tên thật + `source_ids` của `source_registry`)
trên toàn văn `sync-don-vi.mjs` phải ra 0 chỗ trúng. Bộ soát khớp mọi biến thể ≥ 4 ký tự ở bất kỳ đâu, mà script BẮT
BUỘC nêu tên bảng `airdna_markets` (đọc market S02) — tên bảng chứa tên nguồn S02. Tên bảng này đã có trong ≥ 5 tệp
công khai trên `main` (`push-ops-facts.mjs`, `airdna-rotate.mjs`, `dq-truthful-coverage.mjs`…), nên không phải thứ vòng
này làm lộ thêm. Khoá cấu hình gateway của S03 (`channels.<khoá kênh>`) cũng chứa tên nguồn S03 và đã có trên `main` (`zalo-admin.ts`,
`push-ops-facts.mjs`).

Đề xuất sửa E12 (một dòng sổ `fix` ở S2, trình tại đây): soát 0 chỗ trúng trên (a) toàn văn 048, (b) mọi giá trị
`sync-don-vi.mjs` ghi vào sổ và in ra stdout trong ca thử, (c) toàn văn `sync-don-vi.mjs` SAU KHI bỏ các định danh
và khoá đã có trên `main` (danh sách viết trước: `airdna_markets`, khoá kênh gateway; ca kiểm mỗi mục có trong ≥ 3
tệp đã commit trên `origin/main`); đối chứng: thêm một chuỗi chứa tên thật vào bản chép
của script → ≥ 1.
