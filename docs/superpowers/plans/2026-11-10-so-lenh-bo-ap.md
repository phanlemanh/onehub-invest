# Sổ lệnh và bộ áp (TV4) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cloud ghi Lệnh có khuôn (`source.pause`, `source.resume`); máy thu kéo bằng token máy `ops:pull`, áp đúng một lần vào `source_registry`, báo kết quả kèm trước/sau qua `push-ops-facts` → `ingest`.

**Architecture:** Migration 091 dựng sổ lệnh, token máy, sổ áp, `ops_heartbeat`, `ops_audit` (chạy được cả hai khuôn DB). Một hàm kiểm khuôn thuần có hai bản (`.mjs` máy thu, `.ts` cloud) giữ chẵn bằng test. Bộ áp `pipeline/ops-apply.mjs` áp trong một giao dịch với sổ áp khoá `idempotency_key`.

**Tech Stack:** Node 22 `.mjs` + `pg`, Next.js 16 route handler TS strict, PostgreSQL 16 (PostGIS :5433, DB thử qua `db/db-thu.sh`), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-10-so-lenh-bo-ap-design.md` · hợp đồng `_acceptance/so-lenh-bo-ap/contract.md` · evals `_acceptance/so-lenh-bo-ap/evals.yaml` (ca `SL-AC-1`…`SL-AC-10`, `SL-NOI`).

## Global Constraints

- Mọi ca DB chạy qua executor `so_lenh_db` / `so_lenh_app` (DB thử `oneinvest_suite_tv4*`), lược đồ tạm `sl_<pid>_<ca>`; mọi ca chụp `public` trước/sau và deepEqual — 091 chưa áp lên `public`.
- 14 loại lệnh = danh sách ADR-0015 §4 (rút bằng bộ đọc tệp trong test); 9 trạng thái = ADR-0015 §5: `draft submitted approved queued applying applied rejected failed reverted`.
- `LOAI_CO_BO_AP = ["source.pause", "source.resume"]`; `KHOA_CAM` = 11 khoá ADR-0015 §7: `bindings`, `channels.zalo`, `plugins.entries.zalo`, `agents`, `talk`, `commands`, `hooks.internal`, `pluginHooks`, `groupPolicy`, `groupAllowFrom`, `requireMention` (khoá chấm khớp theo đường; `agents.*`, `commands.*` khớp mọi khoá con).
- `target` khớp `^S\d{2}$`. Payload pause: `{reason (bắt buộc, không trống), resume_when?}`; resume: `{}`.
- Không tên nguồn thật trong tệp mới; không đổi `CLOUD_ALLOW`; không nạp plist; không áp 091 lên DB chung hay Supabase.
- Actor: `user:<id>` (cloud), `machine:<tên token>` (kết quả ở cloud), `machine:ops-apply` (máy thu).
- Token đọc từ `~/.oneinvest/cloud.env` biến `OPS_MACHINE_TOKEN` (ghi đè được bằng env `OPS_APPLY_CONFIG_DIR` cho test); phanh = tệp `<thư mục cấu hình>/ops-apply.dung`. Không in token.

## Review Focus

- Kéo trả lệnh `queued` lần hai khi kết quả lần trước gửi hỏng → bộ áp không áp lại, chỉ báo lại kết quả từ sổ áp (SL-AC-6, đã có).
- `payload` không phải object (chuỗi, mảng, `null`) → kiemLenh trả `payload-sai-khuon`, không ném (thêm ô vào ma trận Task 2).
- Header `authorization` có token nhưng thừa khoảng trắng hay sai chữ hoa `bearer` → 401, không ném 500 (Task 4, thêm vào bảng lời gọi xấu của SL-AC-4).
- Ingest nhận `results` không phải mảng hay phần tử thiếu `id` → 400, không đổi lệnh nào (Task 5).
- `resume_when` gửi dạng chuỗi rỗng → lưu `NULL`, không lưu `''` (Task 3, thêm vào ca SL-AC-6).

---

### Task 1: Migration 091 và fixture lược đồ hai khuôn

**Files:**
- Create: `db/migrations/091_so_lenh.sql`
- Create: `pipeline/scripts/so-lenh-fixture.mjs`
- Create: `pipeline/scripts/so-lenh.itest.mjs` (ca `SL-AC-1`, `SL-AC-1b`)

**Interfaces:**
- Produces: bảng `change_requests(id uuid PK DEFAULT gen_random_uuid(), type, target, payload jsonb NOT NULL DEFAULT '{}', status, requested_by, approved_by, idempotency_key UNIQUE NOT NULL, before, after, result jsonb, note text, inverse_of uuid, created_at, decided_at, queued_at, finished_at)` với CHECK `change_requests_type_chk`, `change_requests_status_chk`; `machine_tokens(name PK, token_hash UNIQUE NOT NULL, scopes text[] NOT NULL, created_at, revoked_at, last_used_at)`; `change_request_applies(idempotency_key PK, change_request_id uuid, type, target, outcome CHECK in applied|failed|reverted, before, after, detail jsonb, applied_at)`; `ops_heartbeat`, `ops_audit` khuôn 018 (IF NOT EXISTS).
- Produces (fixture): `MIGRATION_091`, `dungMayThu(admin, S)` (lược đồ có `source_registry` đã chạy 047 + `ops_audit`), `dungCloud(admin, S)` (chỉ `ops_heartbeat` khuôn cloud + bảng phiên), `chay091(client)`, `loaiTuAdr()`, `trangThaiTuAdr()`, `chupPublic`/`xoaLuocDo` (dùng lại `vong-doi-fixture.mjs`).

- [ ] **Step 1:** Viết ca `SL-AC-1` và `SL-AC-1b` đúng `expected` của E1 (hai khuôn × hai lần chạy; 14 loại rút từ ADR khớp `pg_get_constraintdef`; 9 trạng thái; idempotency trùng; role `anon` tạo trong DB thử, `has_table_privilege` sai, `relrowsecurity` đúng; đối chứng gỡ khối DO; đối chứng đổi tên một loại). So `LOAI_LENH` hai bản để lại cho Task 2 (ca `SL-AC-1` gọi khi tệp tồn tại).
- [ ] **Step 2:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/so-lenh.itest.mjs` → FAIL (thiếu tệp 091).
- [ ] **Step 3:** Viết 091 bằng skill `/new-migration` (header, idempotent, `IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS` trước `ADD CONSTRAINT`); khối `DO` chỉ khi có role `anon`: `REVOKE ALL … FROM anon, authenticated` + `ENABLE ROW LEVEL SECURITY` năm bảng (khuôn 037).
- [ ] **Step 4:** Chạy lại lệnh Step 2 → PASS.
- [ ] **Step 5:** Commit `feat(db): 091 sổ lệnh, token máy, sổ áp (TV4)`.

### Task 2: Hàm kiểm khuôn lệnh, hai bản chẵn

**Files:**
- Create: `pipeline/lib/lenh.mjs` (phần kiểm), `app/src/lib/lenh.ts`
- Create: `pipeline/scripts/lenh.test.mjs` (ca `SL-AC-5`, `SL-AC-5b`)

**Interfaces:**
- Produces: `LOAI_LENH: readonly string[]` (14), `LOAI_CO_BO_AP`, `KHOA_CAM`, `kiemLenh(cmd: {type, target, payload}) → {ok: true} | {ok: false, ly_do: string}` — cùng tên, cùng chữ ký ở hai bản. Mã lý do: `loai-la:<t>`, `loai-chua-co-bo-ap:<t>`, `target-sai-khuon`, `payload-sai-khuon`, `thieu-reason`, `khoa-thua:<k>`, `khoa-cam:<k>`.
- Thứ tự kiểm: loại → target → khoá cấm (đệ quy mọi độ sâu, kể cả trong mảng) → payload object → khoá thừa → reason.

- [ ] **Step 1:** Viết ma trận 32 ô + ô `payload` không phải object (Review Focus) và ca chẵn qua `tsx`; đối chứng đột biến bỏ đệ quy (11 ô độ sâu 3 lệch).
- [ ] **Step 2:** `cd pipeline && node --test scripts/lenh.test.mjs` → FAIL.
- [ ] **Step 3:** Viết hai bản.
- [ ] **Step 4:** Chạy lại Step 2 và ca `SL-AC-1` của Task 1 → PASS.
- [ ] **Step 5:** Commit `feat(pipeline): kiemLenh hai bản chẵn (TV4)`.

### Task 3: Áp một lệnh trong một giao dịch

**Files:**
- Modify: `pipeline/lib/lenh.mjs` (thêm `apLenh`)
- Modify: `pipeline/scripts/so-lenh.itest.mjs` (ca `SL-AC-6b`, `SL-AC-7`)

**Interfaces:**
- Consumes: `kiemLenh`, `docTrangThai`/`isRunnable` (`pipeline/lib/vong-doi.mjs`).
- Produces: `apLenh(client: pg.Client, cmd: {id, type, target, payload, idempotency_key, requested_by, approved_by}, opts?: {kiemSau?: (client, cmd) => Promise<void>}) → Promise<{id, idempotency_key, outcome: "applied"|"failed"|"reverted", before, after, ly_do?, applied_at}>`. `before`/`after` = `{status, reason, resume_when}`.
- Luồng: BEGIN → `INSERT … change_request_applies … ON CONFLICT DO NOTHING` (0 dòng → ROLLBACK, trả dòng sổ cũ) → `SELECT … FOR UPDATE` → tiền điều kiện (`tien-dieu-kien:nguon-<status>` / `tien-dieu-kien:nguon-khong-co`; ghi sổ `failed`, COMMIT) → UPDATE (`resume_when` rỗng → NULL; resume xoá `reason`, `resume_when`) → `kiemSau` (mặc định: `docTrangThai` khớp đích) → `ops_audit` actor `machine:ops-apply` → UPDATE dòng sổ `applied` → COMMIT. `kiemSau` ném → ROLLBACK, giao dịch mới ghi sổ `reverted`.

- [ ] **Step 1:** Viết ca `SL-AC-7` (năm ca + đối chứng dương resume + đột biến bỏ ROLLBACK) và `SL-AC-6b` (hai `apLenh` song song bằng hai client → 1 UPDATE).
- [ ] **Step 2:** Chạy executor `so_lenh_db` → FAIL.
- [ ] **Step 3:** Viết `apLenh`.
- [ ] **Step 4:** Chạy lại → PASS.
- [ ] **Step 5:** Commit `feat(pipeline): apLenh áp đúng một lần (TV4)`.

### Task 4: Token máy và route lệnh trên cloud

**Files:**
- Create: `app/src/lib/token-may.ts`, `scripts/cap-token-may.mjs`
- Create: `app/src/app/api/v1/ops/change-requests/route.ts` (GET danh sách, POST tạo), `…/[id]/decide/route.ts`, `…/pull/route.ts`
- Modify: `app/src/lib/ops-access.ts` (`HanhDong` thêm `lenh.gui_tam_dung` vai ops, `lenh.gui_bat_lai` admin, `lenh.duyet` admin, `lenh.xem` viewer; tất cả `bearer: false`)
- Create: `app/tests/so-lenh.test.tsx` (ca `SL-AC-2`, `SL-AC-3`, `SL-AC-4`, `SL-AC-9`)

**Interfaces:**
- Produces: `bamToken(t: string): string` (sha256 hex); `kiemTokenMay(req: Request, scope: string) → Promise<{ok: true, ten: string} | {ok: false, res: Response}>` — header phải đúng `Bearer <token>`; khớp hàng chưa thu hồi có scope → cập nhật `last_used_at`; sai → 401 (`unauthorized`), thiếu scope → 403. `cap-token-may.mjs --name <n> --scope <s>[,<s>]` in token (32 byte hex, tiền tố `om_`) một lần; `--thu-hoi <n>`.
- Phản hồi pull: `{commands: [{id, type, target, payload, idempotency_key, requested_by, approved_by}]}` — khuôn này E11 ghim qua đầu-cuối.
- Phản hồi danh sách: `{commands: [...mọi cột trừ không có], last_pull_at: string|null}`.

- [ ] **Step 1:** Viết bốn ca theo E2, E3, E4, E9 (lược đồ kiểu cloud từ `dungCloud`; người và phiên bằng `taoNguoi`); thêm vào bảng xấu của SL-AC-4 hai lời gọi `bearer <token>` thường và `Bearer  <token>` thừa khoảng trắng (Review Focus).
- [ ] **Step 2:** Chạy executor `so_lenh_app` → FAIL.
- [ ] **Step 3:** Viết `token-may.ts`, script cấp, bốn route (giao dịch + audit qua `trongGiaoDich`/`ghiAuditTrong`; S03 tự duyệt → 409; pull `UPDATE … SET status='queued', queued_at=now() WHERE status='approved' … RETURNING` trong một giao dịch, sắp `created_at` tăng).
- [ ] **Step 4:** Chạy lại → PASS; `cd app && npx tsc --noEmit && npm run lint` → 0 lỗi.
- [ ] **Step 5:** Commit `feat(app): route lệnh và token máy ops:pull (TV4)`.

### Task 5: Kết quả lệnh qua push-ops-facts → ingest

**Files:**
- Modify: `app/src/app/api/v1/ops/ingest/route.ts` (nhánh `kind === "change_request_results"`)
- Modify: `pipeline/push-ops-facts.mjs` (cờ `--chi-lenh <tệp>`; hàm thuần `banTinLenh(results)` xuất được, `main()` chỉ chạy khi gọi trực tiếp)
- Modify: `app/tests/so-lenh.test.tsx` (ca `SL-AC-8`)

**Interfaces:**
- Consumes: `kiemTokenMay(req, "ops:pull")`, `factsChan`/`guardValues`.
- Produces: bản tin `{pushedAt, kind: "change_request_results", results: [{id, idempotency_key, outcome, before, after, ly_do?, applied_at}]}`; phản hồi `{ok: true, cap_nhat: n, bo_qua: m}`; `results` sai khuôn → 400 (Review Focus). Biến `OPS_MACHINE_TOKEN` đọc cùng `cloud.env`; `INGEST_URL` giữ như cũ.

- [ ] **Step 1:** Viết ca `SL-AC-8` theo E8 (server `http.createServer` bọc handler thật; tiến trình con `push-ops-facts.mjs --chi-lenh`), thêm ca `results` không phải mảng → 400.
- [ ] **Step 2:** Chạy executor `so_lenh_app` → FAIL.
- [ ] **Step 3:** Viết nhánh ingest (khớp `id` + `idempotency_key` + `status='queued'`; audit `machine:<ten>`; không chạm `ops_heartbeat`) và chế độ `--chi-lenh` (soát tầng A với tên từ `source_registry` của `DATABASE_URL`; trúng → thoát 1, không gửi).
- [ ] **Step 4:** Chạy lại → PASS; `cd pipeline && npm test` không đỏ thêm ca nào.
- [ ] **Step 5:** Commit `feat(pipeline,app): kết quả lệnh qua ingest (TV4)`.

### Task 6: Bộ áp ops-apply, phanh, plist

**Files:**
- Create: `pipeline/ops-apply.mjs`, `pipeline/cron/com.oneinvest.ops-apply.plist`
- Modify: `pipeline/scripts/so-lenh.itest.mjs` (ca `SL-AC-6`, `SL-AC-10`)

**Interfaces:**
- Consumes: `kiemLenh`, `apLenh`, `push-ops-facts.mjs --chi-lenh`.
- Produces: CLI `node pipeline/ops-apply.mjs`; env `OPS_APPLY_CLOUD` (gốc URL cloud, mặc định `https://onehub-invest.vercel.app`), `OPS_APPLY_CONFIG_DIR` (mặc định `~/.oneinvest`), `DATABASE_URL`, `INGEST_URL`. Thoát 0 = xong hoặc phanh; 2 = thiếu token, cloud lỗi/không tới. Lệnh `kiemLenh` hỏng → kết quả `failed` với `ly_do`, không chạm DB. Kết quả ghi tệp tạm rồi gọi `push-ops-facts.mjs --chi-lenh`.
- Plist: `Label com.oneinvest.ops-apply`, `StartInterval 60`, `ProgramArguments` gọi `node …/pipeline/ops-apply.mjs`, log dưới `~/Library/Logs/oneinvest/`.

- [ ] **Step 1:** Viết ca `SL-AC-6` (mười lượt, `xmin`, sổ một dòng, cloud giả nhận 10 bản, `resume_when ''` → NULL) và `SL-AC-10` (phanh, 503, cổng đóng, thiếu token, không lộ token, plist hợp lệ, đột biến bỏ phanh).
- [ ] **Step 2:** Chạy executor `so_lenh_db` → FAIL.
- [ ] **Step 3:** Viết `ops-apply.mjs` và plist.
- [ ] **Step 4:** Chạy lại → PASS.
- [ ] **Step 5:** Commit `feat(pipeline): bộ áp ops-apply và plist chưa nạp (TV4)`.

### Task 7: Đầu-cuối, tài liệu

**Files:**
- Modify: `app/tests/so-lenh.test.tsx` (ca `SL-NOI`)
- Modify: `CONTEXT.md` (mục «Token máy» · `machine_token (machine_tokens)` · không slug · _Avoid_: «API key», «bearer chung»)
- Modify: `docs/ROADMAP.md` (§2 as-built: đường lệnh kéo, hai lệnh; §4 TV4 trạng thái), `docs/ops/runtime-map.md` (mục ops-apply: chưa nạp, phanh, token)

**Interfaces:**
- Consumes: mọi thứ trên; khuôn phản hồi pull của Task 4.

- [ ] **Step 1:** Viết ca `SL-NOI` theo E11 (tiến trình con `ops-apply.mjs` thật; đối chứng đổi tên khoá phản hồi pull).
- [ ] **Step 2:** Chạy executor `so_lenh_app` → PASS (mọi ca); chạy `so_lenh_db` → PASS.
- [ ] **Step 3:** Sửa ba tệp tài liệu.
- [ ] **Step 4:** `/verify` cho app, pipeline, scripts.
- [ ] **Step 5:** Commit `docs: TV4 đường lệnh kéo — CONTEXT, ROADMAP, runtime-map`.
