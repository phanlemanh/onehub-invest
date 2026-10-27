# quyen-bon-vai-mot-cho (TV1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 11 route `/api/v1/ops/**` kiểm quyền qua một bảng bốn vai ở `ops-access.ts`; mỗi thao tác ghi để đúng một dòng
`ops_audit` mang `user:<id>`, ghi cùng transaction; `users.role` có CHECK (049).

**Architecture:** `kiemQuyen(req, hanhDong)` đọc bearer và phiên (từ header `Cookie`) của chính request, tra
`QUYEN_OPS`, trả 401/403 hoặc `actor`. `trongGiaoDich` + `ghiAuditTrong` gói BEGIN → việc → INSERT audit → COMMIT; việc
ngoài DB (zalo) chạy SAU INSERT audit, TRƯỚC COMMIT. Route giữ nguyên câu SQL nghiệp vụ.

**Tech Stack:** Next.js 16 route (TS strict), PostgreSQL :5433, `node:test` + `tsx`, lược đồ tạm (`schemaUrl`).

**Spec:** `docs/superpowers/specs/2026-10-27-quyen-bon-vai-mot-cho-design.md` · hợp đồng
`_acceptance/quyen-bon-vai-mot-cho/contract.md` (duyệt 27/10, nhận khuyến nghị Hỏi-1/2/3) · evals E1–E10.

## Global Constraints

- Bậc: `user 0 < viewer 1 < ops 2 < admin 3 < owner 4`; email `OPS_EMAILS` = `ops` (Hỏi-1); `unit.toggle` = admin (Hỏi-2).
- Bảng `QUYEN_OPS` đúng 10 hành động của design doc; bearer chỉ `ops.read`, `ingest.push`.
- Actor: `user:<id>`; bearer nạp số `machine:cloud-sync`. Action ghi vào `ops_audit` = tên hành động của bảng
  (`unit.toggle`, `unit.create`, `unit.delete`, `unit.set_mode`, `unit.update_meta`, `review.decide`, `ingest.push`,
  `zalo.admin`); thao tác cụ thể đi trong `detail.thao_tac` (vd `toggle`, `account.create`, `login.start`).
- Mã HTTP: không ai 401 `{error:"unauthorized"}`; sai vai/bearer cấm 403 `{error:"forbidden"}`.
- Không sửa câu SQL chạm `source_groups` trong `source-groups/route.ts` (PL12 ghim 10 câu); tệp mới không nhắc chữ
  `source_groups`.
- Migration `db/migrations/049_users_role_nam_vai.sql`, idempotent, tên ràng buộc `users_role_chk`; áp DB dùng chung chỉ sau gộp.
- Đối chứng dùng 11 fixture `app/tests/fixtures/ops-routes-truoc-tv1/<đường route>.ts.txt` = `git show 39c660ca:<route>`.
- Mọi lệnh openclaw trong ca thử là openclaw giả (`zaloAdminPaths()` đọc env); luật 8 (không gửi Zalo) giữ nguyên.

## Review Focus

1. Cookie phiên hết hạn hoặc token không có trong `sessions` → 401, không 500. Ca: Task 1 `QV-AC-8` thêm ô «phiên hết hạn».
2. Header `Authorization: Bearer <token>` đúng nhưng hành động cấm bearer, kèm cookie admin hợp lệ → dùng phiên (qua),
   không 403 vì bearer. Ca: Task 3 `QV-AC-2` ô «bearer + phiên admin».
3. Nhóm không tồn tại ở toggle → 404/`{ok:false}` như hôm nay, 0 dòng audit. Ca: Task 3 `QV-AC-3` ô ngoài bảng.
4. zalo/login DELETE khi không có tiến trình đăng nhập đang chạy → giữ trả lời hôm nay, 0 dòng audit. Ca: Task 4 `QV-AC-5`.
5. `OPS_EMAILS` có khoảng trắng/chữ hoa → vẫn khớp như `canAccessOps` hôm nay. Ca: Task 1 `QV-AC-8`.

---

### Task 1: Bảng quyền, vai năm bậc, phiên từ request, helper audit

**independent: false** · phục vụ E8 (và nền cho mọi task)

**Files:**
- Modify: `app/src/lib/ops-access.ts`, `app/src/lib/auth.ts`, `app/src/lib/audit.ts`
- Create: `app/tests/quyen-bon-vai.test.tsx` (khung + `QV-AC-8`), `app/tests/helpers/phien-thu.ts`
- Modify: `_acceptance/config.yaml` (đã có khoá `quyen_bon_vai`)

**Interfaces — Produces:**
- `auth.ts`: `type Vai = "user"|"viewer"|"ops"|"admin"|"owner"`; `User.role: Vai`; `nguoiTuRequest(req: Request): Promise<User|null>`
  (đọc cookie `COOKIE` từ header, cùng truy vấn với `getSessionUser`, giá trị lạ → `"user"`).
- `ops-access.ts`: `BAC_VAI: Record<Vai, number>`; `type HanhDong` (10 tên); `QUYEN_OPS: Record<HanhDong, {vai: Exclude<Vai,"user">; bearer: boolean}>`;
  `vaiHieuLuc(u: User|null): Vai` (OPS_EMAILS nâng tối đa lên `ops`); `canAccessOps(u)` = bậc ≥ viewer; `isAdmin(u)` = bậc ≥ admin;
  `kiemQuyen(req: Request, hd: HanhDong): Promise<{ok:true; nguoi: User|null; actor: string} | {ok:false; res: Response}>`
  (bearer khớp và `QUYEN_OPS[hd].bearer` → `{nguoi:null, actor:"machine:cloud-sync"}`; còn lại đọc phiên).
- `audit.ts`: `trongGiaoDich<T>(fn: (c: PoolClient) => Promise<T>): Promise<T>`; `ghiAuditTrong(c, actor, action, detail?)`.
  `auditOpsWrite` giữ export (fixture đối chứng import nó), không route nào gọi.
- `helpers/phien-thu.ts`: `taoNguoi(c: pg.Client, vai: Vai, email?): Promise<{id: string; cookie: string}>` (INSERT users + sessions trong lược đồ tạm).

- [ ] Viết `QV-AC-8` theo E8 nguyên văn (bảng 7 dòng + ô «phiên hết hạn» + `OPS_EMAILS` hoa/khoảng trắng) và ca khung của `kiemQuyen` (bảng 10 hành động × 7 người gọi chỉ ở mức hàm). Chạy `config:executors.test.quyen_bon_vai` → FAIL (`kiemQuyen` chưa có).
- [ ] Làm các hàm trên. Chạy lại → `QV-AC-8` PASS; `cd app && npx tsc --noEmit`.
- [ ] Commit `feat(ops): bảng quyền bốn vai và kiemQuyen ở ops-access`.

### Task 2: Migration 049

**independent: true** · phục vụ E7

**Files:** Create `db/migrations/049_users_role_nam_vai.sql`; Modify `app/tests/quyen-bon-vai.test.tsx` (`QV-AC-7`).

- [ ] Viết `QV-AC-7` theo E7 (lược đồ tạm có `users` ở khuôn hiện tại, áp tệp 049 hai lần, năm vai nhận, `superuser` lỗi có tên `users_role_chk`, public trước = sau, 0 dòng vi phạm ở public). FAIL (tệp chưa có).
- [ ] Viết 049 qua skill `/new-migration` (header, `DO $$ … IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_role_chk') … $$`). PASS.
- [ ] Commit `feat(db): 049 users.role CHECK năm vai`.

### Task 3: Route DB và route đọc theo kiemQuyen, audit trong transaction

**independent: false** (sau Task 1) · phục vụ E1, E2 (phần DB), E3, E4, E6

**Files:**
- Modify: `app/src/app/api/v1/ops/{audit,collections,coverage,extraction-quality,truthful-coverage,ingest,source-groups}/route.ts`,
  `app/src/app/api/v1/ops/review/[id]/decide/route.ts`, `app/src/lib/che-do-thu.ts`, `app/src/lib/so-don-vi.ts`
- Create: 11 fixture `app/tests/fixtures/ops-routes-truoc-tv1/**.ts.txt` (cả 11 route, kể cả zalo — dùng ở Task 4)
- Modify: `app/tests/quyen-bon-vai.test.tsx` (`QV-AC-1`, `QV-AC-2`, `QV-AC-3`, `QV-AC-4`, `QV-AC-6`)

- [ ] Ghim 11 fixture bằng `git show 39c660ca:<route>`; viết `BANG_ROUTE` (21 ô) và `MA_TRAN` (147 ô) viết trước; viết `QV-AC-1/2/3/4/6` theo E1–E4, E6 nguyên văn. FAIL.
- [ ] Đổi 8 route trên: đầu mỗi phương thức `const q = await kiemQuyen(req, "<hđ>"); if (!q.ok) return q.res;`; ghi qua `trongGiaoDich` + `ghiAuditTrong(c, q.actor, "<hđ>", {thao_tac, …})`; `che-do-thu.ts`/`so-don-vi.ts` nhận `actor` thay vì tự `getSessionUser` (giữ chữ ký `datCheDo(b, getUser)` cho ca thử cũ bằng một lớp bọc, action đổi `unit.set_mode`/`unit.update_meta`). GET source-groups kiểm trên `req` thật.
- [ ] Chạy `quyen_bon_vai` → ô DB của QV-AC-2 và QV-AC-1/3/4/6 PASS; `node --test pipeline/scripts/so-nhom.itest.mjs` (PL12 ghim SQL) PASS; tsc + lint.
- [ ] Commit `fix(ops): route DB kiểm quyền theo bảng, audit cùng transaction`.

### Task 4: Route zalo

**independent: false** (sau Task 1, chung tệp ca thử với Task 3) · phục vụ E2 (phần zalo), E5

**Files:** Modify `app/src/app/api/v1/ops/zalo/{accounts,groups,login}/route.ts`; `app/tests/quyen-bon-vai.test.tsx` (`QV-AC-5`, `QV-AC-5b`).

- [ ] Viết `QV-AC-5`, `QV-AC-5b` theo E5 (openclaw giả ghi nhật ký lệnh, tệp cấu hình giả, trigger `qv-audit-hong`). FAIL.
- [ ] Mỗi phương thức: `kiemQuyen(req,"zalo.admin")`; phương thức ghi: `trongGiaoDich(c => { ghiAuditTrong(...); <hàm zalo-admin hiện có> })` — audit trước việc, việc lỗi ném → ROLLBACK. `login` POST/DELETE thêm audit `thao_tac: login.start|login.cancel`.
- [ ] PASS + toàn bộ ô zalo của `QV-AC-2`; tsc + lint. Commit `fix(ops): zalo quản trị chỉ admin, audit trước việc`.

### Task 5: Sổ bề mặt và bộ kiểm sổ

**independent: false** (sau Task 3, 4) · phục vụ E9

**Files:** Modify `app/src/lib/api-surface.ts`, `scripts/check-api-surface.mjs` (nhận `kiemQuyen(req, "<hđ>")`: chế độ `ops` ↔ hđ có bearer, `ops-session` ↔ hđ không bearer bậc ops/viewer, `admin` ↔ hđ bậc admin; phương thức khác chế độ khai riêng bằng trường mới `methodModes`); `app/tests/quyen-bon-vai.test.tsx` (`QV-AC-9`).

- [ ] Viết `QV-AC-9` theo E9. FAIL.
- [ ] Sửa sổ + bộ kiểm, giữ các ca đột biến cũ của NT4 và thêm một ca đột biến «route admin gọi kiemQuyen với hđ có bearer». `node scripts/check-api-surface.mjs static` và `mutation` thoát 0.
- [ ] Commit `fix(api-surface): sổ theo bảng quyền từng phương thức`.

### Task 6: Ca thử cũ sang phiên thật, máy đêm, quét bearer

**independent: false** (sau Task 3–5) · phục vụ E10

**Files:** Modify `app/tests/{cong-tac-nhom-go,vong-doi-nguon,so-nhom,che-do-thu,coverage-cloud-got-tang-a,go-tai-khoan-kiem-id,go-tai-khoan-kiem-cfg,login-kiem-id,nhom-moi-requiremention}.test.tsx` (gọi route ghi bằng `taoNguoi(…,"admin")` + `Cookie`, đếm audit theo action mới), `app/tests/quyen-bon-vai.test.tsx` (`QV-AC-10`, `QV-AC-10b`); `docs/ROADMAP.md` (một dòng V19).

- [ ] Viết `QV-AC-10`, `QV-AC-10b` theo E10. Chạy → PASS hoặc FAIL ở ca thử cũ.
- [ ] Chuyển các ca thử cũ; giữ đối chứng của chúng (fixture cũ gọi bằng bearer). `cd app && npm test`, `cd pipeline && npm test`, `node --test scripts/*.test.mjs` xanh.
- [ ] Commit `test(ops): ca thử route ghi gọi bằng phiên thật`; ROADMAP §4 một dòng, commit `docs`.
