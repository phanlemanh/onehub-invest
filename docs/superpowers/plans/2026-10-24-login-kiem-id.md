# Đăng nhập tài khoản thu kiểm id (login-kiem-id) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `POST /api/v1/ops/zalo/login` từ chối id rỗng, có khoảng trắng, dạng cờ hoặc không có trong danh sách tài khoản TRƯỚC khi spawn `openclaw channels login`; `default` luôn đăng nhập lại được; id thật chạy đúng một lệnh login.

**Architecture:** Tách bước kiểm của ON14 thành `requireAccountId(cfg, id, { allowDefault })`, bọc bởi `requireDeletableAccount` (gỡ) và `requireLoginAccount` (đăng nhập), hai vỏ ném `AccountIdError`. `startZaloLogin` đọc config, kiểm, rồi mới tới nhánh phiên đang chạy và spawn. Thư mục QR đọc từ `OPENCLAW_QR_DIR` (mặc định `/tmp/openclaw`). Một tệp test với openclaw giả + thước tĩnh.

**Tech Stack:** Next.js 16 route handler, `node --test` + `tsx` (`cd app && npm test`), TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-10-24-login-kiem-id-design.md` · hợp đồng `_acceptance/login-kiem-id/contract.md` (AC-1…AC-10) · evals `_acceptance/login-kiem-id/evals.yaml` (E1…E10).

## Global Constraints

- An toàn Zalo: phép đo KHÔNG spawn openclaw thật, KHÔNG đọc/ghi `~/.openclaw` hay `/tmp/openclaw`, KHÔNG gọi route trên dev server đang chạy.
- Tệp test KHÔNG import tĩnh `zalo-admin` hay route — chỉ `await import()` sau khi đặt `HOME`, `PATH`, `OPENCLAW_QR_DIR`, `OPS_API_TOKEN`, `DATABASE_URL` (= `postgres://127.0.0.1:9/khong-co`). Mọi bản sao đột biến nạp qua MỘT hàm, hàm này chạy rào trên `zaloAdminPaths()` của bản sao trước khi trả nó.
- Giữ NGUYÊN VĂN trong `zalo-admin.ts` hai chuỗi mà test ON14 đột biến: `requireDeletableAccount(cfg, accountId);` và `if (accountId.startsWith("-")) throw new Error("id dạng cờ");`. Thông điệp và thứ tự kiểm của ON14 không đổi.
- Thông điệp ghim: `id rỗng` · `id có khoảng trắng` · `id dạng cờ` · `không xoá được tài khoản default` · `không có trong danh sách tài khoản`.
- Tên ca mở đầu `LK-AC-<n>`. Comment domain tiếng Việt. Không đổi `api-surface.ts`, không đổi UI, không đổi `GET`/`DELETE` của route login.

## Review Focus

1. Id `"   "` — không cắt nên rơi vào «id có khoảng trắng»; AC-1 chỉ ghim 400 + 0 lệnh cho ca này.
2. `__proto__` qua JSON.parse thành khoá thường của thân — vẫn là chuỗi `"__proto__"`, `Object.hasOwn(accounts, "__proto__")` false → 400 (nằm trong AC-3).
3. Config không đọc được (tệp vắng/hỏng) → lỗi KHÔNG phải `AccountIdError` → 500 như cũ; không thêm ca (hành vi không đổi).
4. Gọi lại `acc2` khi tiến trình giả trước đã thoát → spawn lại, nhật ký thêm một dòng (AC-4 đếm theo từng lượt, `resetSpy` giữa lượt).
5. Comment trong mã có chữ `channels login` (vd route login) — thước tĩnh bỏ comment trước khi quét để không đếm nhầm (Task 2 có ca khẳng định danh sách đúng 1 chỗ).

---

### Task 1: Bước kiểm dùng chung + đăng nhập kiểm id + thư mục QR + test hành vi (AC-1…AC-6, AC-8, AC-9, AC-10)

`independent: false` (Task 2 dùng cùng tệp test). Phục vụ E1–E6, E8, E9, E10.

**Files:**
- Modify: `app/src/lib/zalo-admin.ts` (`QR_DIR`, `zaloAdminPaths`, tách `requireAccountId`, thêm `AccountIdError`, `requireLoginAccount`, sửa `startZaloLogin`)
- Modify: `app/src/app/api/v1/ops/zalo/login/route.ts` (`POST`)
- Create: `app/tests/login-kiem-id.test.tsx`

**Interfaces:**
- Produces:
  - `const QR_DIR = process.env.OPENCLAW_QR_DIR || "/tmp/openclaw";` (nguyên văn — chiều đỏ AC-9 đột biến chuỗi `"/tmp/openclaw"` trong dòng này).
  - `export function zaloAdminPaths(): { openclaw: string; config: string; qrDir: string }`.
  - `export class AccountIdError extends Error {}`.
  - `function requireAccountId(cfg, accountId: unknown, opts: { allowDefault: boolean }): string` — thứ tự: không phải chuỗi/`""` → `throw new Error("id rỗng")`; `/\s/` → `"id có khoảng trắng"`; dòng nguyên văn `if (accountId.startsWith("-")) throw new Error("id dạng cờ");`; `"default"`: `allowDefault` → trả id, ngược lại `"không xoá được tài khoản default"`; `!accounts || !Object.hasOwn(accounts, accountId)` → `"không có trong danh sách tài khoản"` (chiều đỏ AC-3b đột biến chuỗi `Object.hasOwn(accounts, accountId)`).
  - `export function requireDeletableAccount(cfg, accountId: unknown): string` và `export function requireLoginAccount(cfg, accountId: unknown): string` — gọi `requireAccountId` (allowDefault false / true), bắt `Error` và ném lại `new AccountIdError(e.message)`.
  - `startZaloLogin(accountId: string)`: `isZaloAdminAvailable` → `const cfg = await readCfg();` → `requireLoginAccount(cfg, accountId);` (nguyên văn — chiều đỏ AC-1 xoá chuỗi này) → nhánh phiên đang chạy → spawn → chờ QR như cũ.
  - Route `POST`: `accountId` = `body.accountId` khi body là object và trường là chuỗi, ngược lại `""`; `startZaloLogin(id)`; `catch`: `e instanceof AccountIdError` → 400, khác → 500 (thông điệp như cũ). Bỏ nhánh «thiếu accountId».

- [ ] **Step 1: Viết `app/tests/login-kiem-id.test.tsx` (đỏ)**

Khung như `app/tests/go-tai-khoan-kiem-id.test.tsx`:
- `before()`: thư mục tạm `tmp`; `qrDir = tmp/qr`; openclaw giả (cùng script ở `tmp/home/.openclaw/bin/openclaw` và `tmp/bin/openclaw`): ghi argv nối `\t` vào `tmp/spy.log`; lấy id = đối số cuối; ghi `"<id>-QR"` vào `$qrDir/openclaw-zalouser-qr-<id>.png`; nếu id là `acc3` thì `exec sleep 30`. Fixture `openclaw.json` có `accounts` `default`, `acc2`, `acc3`, `--channel`, `Acc_5`. Đặt env, import động `../src/lib/zalo-admin` và route login, `assertRao(tmp, admin.zaloAdminPaths())` — ném `"rào: đường lạc — <tên> <đường>"` nếu `homedir()`, `openclaw`, `config` hoặc `qrDir` (realpath, fallback resolve) không nằm dưới `realpath(tmp)`.
- `after()`: `admin.cancelZaloLogin("acc3")`, khôi phục env, `pool.end()`, xoá `tmp`.
- `napBanSao(ten, tu, thanh)`: thay chuỗi, `assert.notEqual` với bản gốc, ghi `tmp/mut-<ten>/zalo-admin.ts`, import động, `assertRao(tmp, mut.zaloAdminPaths())`, trả `mut`.
- Helper `post(body)`, `spy()`, `resetSpy()`, `datLai()` (ghi lại fixture + xoá spy), `qrGia(id)` = base64 của `"<id>-QR"`, `loginLine(id)` = argv login nối `\t` + `\t`.

Ca (tên nguyên văn theo evals):
- `LK-AC-8 rào: homedir, openclaw, config, qrDir nằm dưới thư mục tạm`; `LK-AC-8 rào với HOME thật hoặc qrDir /tmp/openclaw trả vi phạm nêu đường lạc` (2 `assert.throws(/đường lạc/)`: HOME gốc, và `{...paths, qrDir: "/tmp/openclaw"}`).
- `LK-AC-1 accountId rỗng/thiếu/không phải chuỗi → 400, openclaw giả 0 lệnh` — 7 thân `{}`, `{accountId:""}`, `{accountId:"   "}`, `{accountId:5}`, `{accountId:null}`, `"not-json"`, `"null"`; mỗi thân 400 + `spy().length === 0`; 6 thân (trừ `"   "`) `error === "id rỗng"`; đối chứng dương `acc2` → 200, `spy().length === 1`; `datLai()`.
- `LK-AC-1 bản sao bỏ bước kiểm → openclaw giả nhận login với id rỗng` — `napBanSao("bo-kiem", "requireLoginAccount(cfg, accountId);", "")`, `await mut.startZaloLogin("")`, spy có `loginLine("")`, thông điệp `"login với id rỗng"`.
- `LK-AC-2 accountId có khoảng trắng → 400, openclaw giả 0 lệnh` — 4 id × (mã, `error === "id có khoảng trắng"`, 0 dòng).
- `LK-AC-3 id lạ/khoá kế thừa/dạng cờ → 400 đúng thông điệp lớp, openclaw giả 0 lệnh` — bảng 8 dòng viết trước như evals E3, mỗi dòng 3 assert.
- `LK-AC-3 bản sao chỉ kiểm thành viên → login --account --channel lọt, nêu dạng cờ` — xoá dòng `-`; `startZaloLogin("--channel")`; spy có `loginLine("--channel")`.
- `LK-AC-3 bản sao kiểm thành viên bằng in → login --account constructor lọt, nêu khoá kế thừa` — thay `Object.hasOwn(accounts, accountId)` bằng `accountId in accounts`; `startZaloLogin("constructor")`; spy có `loginLine("constructor")`.
- `LK-AC-4 id thật acc2 và Acc_5 → 200, qrBase64 của ảnh QR giả, đúng một lệnh login --account <id>` — mỗi id: `resetSpy()`, 200, `qrBase64 === qrGia(id)`, `assert.deepEqual(spy(), [loginLine(id)])`.
- `LK-AC-5 default (có và vắng accounts.default) → 200, QR của default, đúng một lệnh login --account default` — lượt 1 fixture; lượt 2 ghi config không có khoá `default` trong `accounts`; mỗi lượt 3 assert; `datLai()`.
- `LK-AC-6 đang có phiên acc3 dở → --channel và khong-co vẫn 400, không trả QR acc3, nhật ký vẫn 1 dòng` — `resetSpy()`; `post({accountId:"acc3"})` 200 (QR có ngay, tiến trình còn sống); rồi `--channel` và `khong-co`: 400 đúng lớp, `json.qrBase64 === undefined`, `spy().length === 1`; cuối ca `admin.cancelZaloLogin("acc3")`.
- `LK-AC-9 không đặt OPENCLAW_QR_DIR → zaloAdminPaths().qrDir là /tmp/openclaw` — `execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", "<import(pathToFileURL(file)) rồi in zaloAdminPaths().qrDir>"], { cwd: APP, env: { HOME: <home giả>, PATH: <PATH gốc> } })` (env không có `OPENCLAW_QR_DIR`) → stdout trim `=== "/tmp/openclaw"`.
- `LK-AC-9 bản sao mặc định os.tmpdir() ra khác, nêu QR mặc định` — bản sao thay `import { homedir } from "node:os";` → `import { homedir, tmpdir } from "node:os";` và `"/tmp/openclaw"` (trong dòng QR_DIR) → `path.join(tmpdir(), "openclaw")`; chạy cùng tiến trình con trên tệp bản sao (không qua `napBanSao` vì không import trong tiến trình test); stdout `!== "/tmp/openclaw"`, thông điệp `"QR mặc định"`.

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd app && node --import tsx --test tests/login-kiem-id.test.tsx`
Expected: FAIL ở `before()` — `assertRao` báo `qrDir` thiếu (đường `undefined`) → không ca nào chạy.

- [ ] **Step 3: Cài theo Interfaces (zalo-admin.ts + route.ts)**

- [ ] **Step 4: Xanh + hồi quy ON14**

Run: `cd app && node --import tsx --test tests/login-kiem-id.test.tsx tests/go-tai-khoan-kiem-id.test.tsx`
Expected: PASS mọi ca `LK-AC-*` và đủ 11 ca `GT-AC-*`; `stat -f %m ~/.openclaw/openclaw.json` và `ls /tmp/openclaw` không đổi so với trước khi chạy.

- [ ] **Step 5: tsc + lint, commit**

Run: `cd app && npx tsc --noEmit && npm run lint` → exit 0.
```bash
git add app/src/lib/zalo-admin.ts app/src/app/api/v1/ops/zalo/login/route.ts app/tests/login-kiem-id.test.tsx
git commit -m "fix(ops): đăng nhập tài khoản thu kiểm id trước khi spawn openclaw (login-kiem-id)"
```

### Task 2: Thước tĩnh login-sau-bước-kiểm (AC-7)

`independent: false` (cùng tệp test). Phục vụ E7.

**Files:**
- Modify: `app/tests/login-kiem-id.test.tsx`

**Interfaces:**
- Produces: `function quetLogin(files: { path: string; text: string }[]): { path: string; fn: string | null; ok: boolean }[]` — bỏ comment (`/* … */`, `// …`) trước; trong tệp có `/openclaw/i`, mỗi khớp của `/(["'`])login\1|["'`][^"'`\n]*channels login[^"'`\n]*["'`]/g` → `fn` = `function <tên>(` gần nhất phía trước; `ok` = đoạn từ đầu hàm tới khớp chứa `requireLoginAccount(`. `viPhamLogin(kq)` → `"<path>: login trước bước kiểm id"`.

- [ ] **Step 1: Ba ca**
  - `LK-AC-7 chỗ login trong app/src bằng đúng danh sách viết trước [zalo-admin.ts · startZaloLogin] và đứng sau requireLoginAccount` — `deepEqual` danh sách `[{ path: "src/lib/zalo-admin.ts", fn: "startZaloLogin" }]`, `viPhamLogin` rỗng.
  - `LK-AC-7 bản sao spawn trước bước kiểm` — cắt dòng `  requireLoginAccount(cfg, accountId);\n` rồi chèn lại ngay sau dòng `proc.unref();`; assert khác gốc và bước kiểm nằm sau `"login"`; `viPhamLogin` nêu `src/lib/zalo-admin.ts`.
  - `LK-AC-7 bản sao thêm mảng argv nháy đơn` — nối `export function buildLoginArgs(id: string): string[] { return ['channels', 'login', '--account', id]; }`; thước ra 2 chỗ, chỗ `buildLoginArgs` không ok.
  - `LK-AC-7 bản sao thêm chuỗi lệnh channels login` — nối `export function loginCmd(id: string): string { return "openclaw channels login --account " + id; }`; chỗ `loginCmd` không ok.

- [ ] **Step 2: Chạy xanh; phá-thử trên cây thật** (dời bước kiểm xuống sau spawn trong `src/lib/zalo-admin.ts`, chạy lại → `LK-AC-7 chỗ login…` và các ca hành vi đỏ; `git checkout -- src/lib/zalo-admin.ts`).

- [ ] **Step 3: Bộ đủ app** — `cd app && npm test && npx tsc --noEmit && npm run lint` → exit 0.

- [ ] **Step 4: Commit**
```bash
git add app/tests/login-kiem-id.test.tsx
git commit -m "test(ops): thước tĩnh — mọi lời gọi channels login đứng sau bước kiểm id (login-kiem-id AC-7)"
```
