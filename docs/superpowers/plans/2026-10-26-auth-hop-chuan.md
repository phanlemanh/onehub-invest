# auth-hop-chuan (UI7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hai trang `/login`, `/register` theo luật ReUI của kho (không chuyển động nền, không màu tự chọn, cỡ chữ theo thang, có `(auth)/error.tsx`) mà đăng nhập và đăng ký vẫn chạy y như cũ — chứng bằng test jsdom và hai smoke đầu-cuối trên bản chạy.

**Architecture:** Phần giao diện đã dựng ở S1 (bản bấm được, commit `4adbab8c`) và đã có test `app/tests/auth-hop-chuan.test.tsx` (AH-AC-1..5). Việc còn lại là Hỏi-3 = A: một smoke đăng ký đầu-cuối mới (`scripts/dev-register-check.mjs`) đi qua form server action thật của `/register`, kiểm phiên + vai `user`, rồi xoá tài khoản thử trong `finally`. Smoke chỉ chạy trên DB local (dùng lại rào `assertLocalDatabaseUrl`).

**Tech Stack:** Next.js 16 server actions · Node 22 `fetch`/`FormData` · `pg` mượn từ `app/` · `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-26-auth-hop-chuan-design.md` · hợp đồng `_acceptance/auth-hop-chuan/contract.md` (đã duyệt 2026-10-26) · sổ `_acceptance/auth-hop-chuan/decisions.jsonl` (Hỏi-1..3 = A).

## Global Constraints

- Không đổi `login`/`register` trong `app/src/app/actions.ts`, `safeNext`, `AuthError` (OOS-2).
- Bảng `users`/`sessions` là hồ sơ người dùng app — tầng A, chỉ local: smoke từ chối mọi `DATABASE_URL` không phải localhost (`assertLocalDatabaseUrl` của `scripts/dev-ops-account.mjs`).
- Không in mật khẩu ra stdout/stderr (khuôn của `dev-ops-login-check.sh`).
- Email thử có dạng `register-smoke-<16 hex>@local.test`; mọi `users` khớp tiền tố `register-smoke-` là rác smoke, được dọn.
- Dev server của dãy U1: `http://ui1.localhost:3460` (cấu hình `app-3460` của `.claude/launch.json`).
- Hoàn lại `app/next-env.d.ts` trước mỗi commit và trước S4.

## Review Focus

1. Smoke chết giữa chừng (POST lỗi, assert đỏ) → tài khoản thử vẫn phải bị xoá: `finally` xoá theo email, và lượt sau quét dọn mọi email tiền tố `register-smoke-` sót lại (ca test `dọn rác sót`).
2. Email trùng: lượt POST thứ hai cùng email phải về `/register?error=` chứ không tạo phiên mới (smoke kiểm `location`).
3. Tự đăng ký không được vào Ops: phiên vừa tạo mở `/ops/sources` không được trả 200 (vai `user` → 404).
4. `DATABASE_URL` trỏ máy khác → thoát 2 trước khi chạm mạng hay DB (ca test dùng lại `assertLocalDatabaseUrl`).
5. Form `/register` mất `action` (server action không gắn) → smoke đỏ với thông điệp ghim `không thấy trường $ACTION_ID_ trong form /register` (phá-thử S3).

---

### Task 1: Giao diện đã dựng ở S1 — kiểm lại, không viết thêm

`independent: true` · phục vụ E1–E5, E7, E8

**Files:** (đã có trên nhánh, commit `4adbab8c`)
- `app/src/components/auth/register-form.tsx`, `login-form.tsx`; xoá `gradient-wave.tsx`
- Create đã có: `app/src/app/(auth)/error.tsx`, `app/tests/auth-hop-chuan.test.tsx`
- `app/eslint-suppressions.json` (bỏ 3 khoá auth), `.claude/skills/onehub-ui/catalog.md`

- [ ] **Step 1: Chạy test + lint + kiểu**

Run: `cd app && node --import tsx --test tests/auth-hop-chuan.test.tsx && npx tsc --noEmit && npm run lint`
Expected: 5/5 ca `AH-AC-*` xanh; tsc 0 lỗi; eslint 0 lỗi.

- [ ] **Step 2: Không còn khoá suppressions của nhóm (auth)**

Run: `grep -c 'src/app/(auth)/\|src/components/auth/' app/eslint-suppressions.json`
Expected: `0`.

### Task 2: Smoke đăng ký đầu-cuối có dọn tài khoản (Hỏi-3 = A)

`independent: true` · phục vụ E10 (mới, AC-5, backend-effect)

**Files:**
- Create: `scripts/dev-register-check.mjs`
- Create: `scripts/dev-register-check.test.mjs`
- Modify: `_acceptance/config.yaml` (thêm `executors.script.auth_register_smoke` ngay dưới `auth_login_smoke`)
- Modify: `_acceptance/auth-hop-chuan/evals.yaml` (thêm E10; bỏ comment «Hỏi-3 … thì S3 thêm E10» ở E6)

**Interfaces:**
- Consumes: `assertLocalDatabaseUrl(raw: string): URL`, `DEFAULT_DATABASE_URL` từ `scripts/dev-ops-account.mjs`.
- Produces (export từ `dev-register-check.mjs`, cho test):
  - `SMOKE_EMAIL_PREFIX = "register-smoke-"`
  - `smokeEmail(): string` → `register-smoke-<16 hex>@local.test`
  - `parseActionId(html: string): string | null` → tên trường `$ACTION_ID_<hex>` đầu tiên hoặc `null`
  - `checkRegisterResponse(res: { status: number; location: string | null; setCookie: string | null }, next: string): string[]` → danh sách lỗi (rỗng = đạt): status 303, `location` = `next`, cookie `oi_session=<64 hex>` có `HttpOnly`
  - `checkDuplicateResponse(res: { status: number; location: string | null }): string[]` → status 303 và `location` bắt đầu `/register?error=`
  - `cleanupSmokeUsers(client: pg.Client): Promise<number>` → `DELETE FROM users WHERE email LIKE 'register-smoke-%@local.test'`, trả số dòng (sessions/saved_markets/user_events/user_profile đi theo `ON DELETE CASCADE`)
  - CLI: `node scripts/dev-register-check.mjs [base_url]` — mặc định `http://ui1.localhost:3460`

- [ ] **Step 1: Viết test hai chiều trên cùng fixture** — `scripts/dev-register-check.test.mjs`

```js
test("parseActionId: form có action → tên trường; form trần → null", () => {
  assert.equal(parseActionId('<input type="hidden" name="$ACTION_ID_7f3a"/>'), "$ACTION_ID_7f3a");
  assert.equal(parseActionId('<form><input name="email"/></form>'), null);
});
test("checkRegisterResponse: 303 + cookie HttpOnly → [], thiếu cookie → lỗi ghim", () => {
  const ok = { status: 303, location: "/saved", setCookie: `oi_session=${"a".repeat(64)}; Path=/; HttpOnly` };
  assert.deepEqual(checkRegisterResponse(ok, "/saved"), []);
  assert.match(checkRegisterResponse({ ...ok, setCookie: null }, "/saved").join("\n"), /không trả cookie oi_session HttpOnly/);
  assert.match(checkRegisterResponse({ ...ok, status: 200 }, "/saved").join("\n"), /POST \/register trả 200, cần 303/);
});
test("checkDuplicateResponse: về /register?error= → []; tạo phiên lần hai → lỗi ghim", () => {
  assert.deepEqual(checkDuplicateResponse({ status: 303, location: "/register?error=x&next=%2Fsaved" }), []);
  assert.match(checkDuplicateResponse({ status: 303, location: "/saved" }).join("\n"), /email trùng không bị từ chối/);
});
test("smokeEmail mang tiền tố dọn", () => assert.match(smokeEmail(), /^register-smoke-[0-9a-f]{16}@local\.test$/));
test("dọn rác sót (DB local; DB không lên → skip)", ...)  // BEGIN; chèn 2 user tiền tố + 1 user khác; cleanupSmokeUsers → 2; user khác còn; ROLLBACK
```

- [ ] **Step 2: Chạy test, thấy đỏ**

Run: `node --test scripts/dev-register-check.test.mjs`
Expected: FAIL — `Cannot find module './dev-register-check.mjs'`.

- [ ] **Step 3: Viết `scripts/dev-register-check.mjs`**

Luồng `main(base)`: `assertLocalDatabaseUrl` (sai → stderr + exit 2) → nạp `pg` theo cách `loadPg()` của `dev-ops-account.mjs` → `cleanupSmokeUsers` (in số rác sót đã dọn) → mật khẩu `randomBytes(16).toString("hex")` không in → `GET <base>/register` → `parseActionId` (null → `FAIL: không thấy trường $ACTION_ID_ trong form /register`) → POST `multipart` (`FormData`, `redirect: "manual"`) các trường `<aid>=""`, `email`, `password`, `next=/saved` → `checkRegisterResponse` → DB: đúng 1 dòng `users` với email đó, `role = 'user'`, ≥ 1 dòng `sessions` → `GET /ops/sources` kèm cookie ≠ 200 → POST lần hai cùng email → `checkDuplicateResponse` → in `OK: đăng ký đầu-cuối qua form /register được <base>`. `finally`: `DELETE FROM users WHERE email = $1`, kiểm 0 dòng `users` và 0 dòng `sessions` của id đó, in `dọn: đã xoá tài khoản thử`; dọn lỗi → exit 1 dù phần trên xanh. Mỗi kiểm đạt in một dòng (khuôn `dev-ops-login-check.sh`).

- [ ] **Step 4: Test xanh**

Run: `node --test scripts/dev-register-check.test.mjs`
Expected: PASS mọi ca (ca DB chạy khi :5433 lên).

- [ ] **Step 5: Chạy smoke thật, rồi phá-thử**

Run: `node scripts/dev-register-check.mjs http://ui1.localhost:3460`
Expected: exit 0, dòng cuối `OK: đăng ký đầu-cuối …`, có `dọn: đã xoá tài khoản thử`; sau đó `SELECT count(*) FROM users WHERE email LIKE 'register-smoke-%'` = 0.
Phá-thử: tạm gỡ `action={register}` ở `register-form.tsx` → smoke exit 1 với `không thấy trường $ACTION_ID_ trong form /register` và vẫn in `dọn:` (không có tài khoản nào được tạo); hoàn lại bằng `git checkout -- app/src/components/auth/register-form.tsx`.

- [ ] **Step 6: Khai executor + eval E10**

`_acceptance/config.yaml` dưới `auth_login_smoke`:
`auth_register_smoke: "node scripts/dev-register-check.mjs ${BASE_URL:-http://ui1.localhost:3460}"` (comment một dòng: đăng ký đầu-cuối qua form, email dùng một lần, xoá tài khoản cuối lượt — chỉ DB local).
`evals.yaml` thêm E10: `criterion: AC-5`, `executor: script`, `layer: backend-effect`, `cmd: config:executors.script.auth_register_smoke`, `paths: [app/src/components/auth/**, app/src/app/(auth)/**, app/src/app/actions.ts, scripts/dev-register-check.mjs]`, `expected` liệt đúng các dòng in của Step 3. Thêm dòng sổ `approach` stage `S3` nêu E10 sinh từ Hỏi-3 = A. Trước khi sửa `config.yaml`: `yeu-cau cham-tep --tep _acceptance/config.yaml` theo LUAT của đợt.

- [ ] **Step 7: Commit**

```bash
git checkout -- app/next-env.d.ts 2>/dev/null; git add scripts/dev-register-check.mjs scripts/dev-register-check.test.mjs _acceptance/config.yaml _acceptance/auth-hop-chuan/evals.yaml _acceptance/auth-hop-chuan/decisions.jsonl
git commit -m "feat(auth): smoke đăng ký đầu-cuối có dọn tài khoản (UI7 E10, Hỏi-3)"
```

### Task 3: Kiểm toàn bộ rồi chuyển S4

`independent: false` (sau Task 1, 2)

- [ ] **Step 1:** `/verify` cho `app` và `scripts` — Expected: `cd app && npm test` xanh (trừ ca chập chờn đã biết trên nền main: UC-TA-5, ON22-AC-5, listings-browse — ghi nhận, không sửa); `node --test scripts/*.test.mjs` xanh; `bash scripts/dev-ops-login-check.sh http://ui1.localhost:3460` OK.
- [ ] **Step 2:** contract `status: implemented`, commit, xin khoá `s4` của đợt rồi chạy Workflow S4.
