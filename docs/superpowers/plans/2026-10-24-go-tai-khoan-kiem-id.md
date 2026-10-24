# Gỡ tài khoản thu kiểm id (ON14) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `DELETE /api/v1/ops/zalo/accounts` từ chối id rỗng, có khoảng trắng, dạng cờ, `default` hoặc không có trong danh sách tài khoản TRƯỚC khi gọi openclaw; id thật thì logout đúng một lần rồi gỡ khỏi config.

**Architecture:** Bước kiểm `requireDeletableAccount` nằm trong `app/src/lib/zalo-admin.ts`; `deleteZaloAccount` đọc config → kiểm → logout → gỡ. Route thôi `trim()`. Một tệp test duy nhất chạy handler thật với openclaw giả (HOME/PATH giả) và một thước quét tĩnh.

**Tech Stack:** Next.js 16 route handler, `node --test` + `tsx` (`cd app && npm test`), TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-10-24-go-tai-khoan-kiem-id-design.md` · hợp đồng `_acceptance/go-tai-khoan-kiem-id/contract.md` (AC-1…AC-6) · evals `_acceptance/go-tai-khoan-kiem-id/evals.yaml` (E1…E6).

## Global Constraints

- An toàn Zalo: phép đo KHÔNG gọi openclaw thật, KHÔNG đọc/ghi `~/.openclaw`, KHÔNG gọi route trên dev server đang chạy (`.claude/rules/zalo-safety.md`).
- Tệp test KHÔNG import tĩnh `zalo-admin` hay route — chỉ `await import()` sau khi đặt `HOME`, `PATH`, `OPS_API_TOKEN`, `DATABASE_URL`.
- `DATABASE_URL` của test = `postgres://127.0.0.1:9/khong-co` (cổng đóng, không tài khoản) — không ghi `ops_audit` vào DB :5433 dùng chung.
- Tên ca mở đầu `GT-AC-<n>` (evals bám chuỗi này). Comment domain bằng tiếng Việt.
- Thông điệp lỗi ghim (chép nguyên văn): `id rỗng` · `id có khoảng trắng` · `id dạng cờ` · `không xoá được tài khoản default` · `không có trong danh sách tài khoản`.
- Không đổi `app/src/lib/api-surface.ts`, không đổi UI.

## Review Focus

1. Id là `"  "` (chỉ khoảng trắng) — phải là «id rỗng»? Không: không cắt nên rơi vào «id có khoảng trắng»; cả hai đều 400 và 0 lệnh — test AC-1 chỉ ghim 400 + 0 lệnh cho ca này, không ghim lớp thông điệp.
2. Thân request không phải JSON — `req.json()` lỗi → `{}` → «id rỗng», 400 (thêm vào ma trận AC-1 thành thân `"not-json"`).
3. Config `openclaw.json` không có `channels.zalouser.accounts` — id bất kỳ → «không có trong danh sách tài khoản», không ném TypeError (Task 1 bước kiểm dùng optional chaining; ma trận AC-3 chạy trên fixture có accounts — ca config rỗng thêm vào Task 1).
4. Gọi lại DELETE cùng id thật lần hai — lần hai 400 «không có trong danh sách tài khoản», 0 lệnh mới (thêm vào AC-4).
5. openclaw giả thoát mã ≠ 0 — gỡ config vẫn chạy (best-effort như cũ); không phép đo nào trong hợp đồng — giữ nguyên hành vi, không thêm ca.

---

### Task 1: Bước kiểm id + thứ tự logout + test hành vi (AC-1, AC-2, AC-3, AC-4, AC-6)

`independent: false` (Task 2 dùng cùng tệp test và tên `requireDeletableAccount`). Phục vụ E1, E2, E3, E4, E6.

**Files:**
- Modify: `app/src/lib/zalo-admin.ts:145-161` (`deleteZaloAccount`), thêm `zaloAdminPaths`, `requireDeletableAccount`
- Modify: `app/src/app/api/v1/ops/zalo/accounts/route.ts:43-56` (`DELETE`)
- Create: `app/tests/go-tai-khoan-kiem-id.test.tsx`

**Interfaces:**
- Produces:
  - `export function zaloAdminPaths(): { openclaw: string; config: string }` — trả đúng hằng `OPENCLAW`, `CONFIG` của module.
  - `export function requireDeletableAccount(cfg: { channels?: { zalouser?: { accounts?: Record<string, unknown> } } }, accountId: unknown): string` — trả id khi hợp lệ; ném `Error` với một trong năm thông điệp ghim, theo thứ tự kiểm: không phải chuỗi hoặc `""` → `id rỗng`; `/\s/` → `id có khoảng trắng`; mở đầu `-` → `id dạng cờ`; `"default"` → `không xoá được tài khoản default`; không có trong `accounts` (dùng `Object.hasOwn`) → `không có trong danh sách tài khoản`.
  - `deleteZaloAccount(accountId: string)`: `isZaloAdminAvailable` → `readCfg()` → `requireDeletableAccount(cfg, accountId);` (đúng một dòng lệnh, nguyên văn — Task 1/2 đột biến theo chuỗi này) → logout best-effort như cũ → đọc lại config, xoá khoá, `writeCfg`.
  - Dòng kiểm cờ trong `requireDeletableAccount` viết nguyên văn `if (accountId.startsWith("-")) throw new Error("id dạng cờ");` (chiều đỏ AC-3 xoá đúng dòng này).

- [ ] **Step 1: Viết tệp test với rào AC-6 và ma trận AC-1…AC-4 (đỏ)**

Khung tệp (`app/tests/go-tai-khoan-kiem-id.test.tsx`), chỉ import tĩnh `node:*`:
- `before()`: `tmp = mkdtempSync(join(tmpdir(), "go-tk-"))`; tạo `tmp/home/.openclaw/bin/openclaw` và `tmp/bin/openclaw` — cùng script sh ghi mỗi lần gọi một dòng argv nối bằng `\t` vào `tmp/spy.log`, `chmod 755`; đặt `HOME=tmp/home`, `PATH=tmp/bin:` + PATH cũ, `OPS_API_TOKEN="T"`, `DATABASE_URL` cổng đóng; ghi fixture `openclaw.json` (`channels.zalouser.accounts`: `default`, `acc2`, `acc3`, `--channel`, `Acc_5`, mỗi khoá `{ enabled: true, profile: <id> }`); rồi `admin = await import("../src/lib/zalo-admin")`, `route = await import("../src/app/api/v1/ops/zalo/accounts/route")`; gọi `assertRao(tmp, admin.zaloAdminPaths())` — ném `Error("rào: HOME thật …")` nếu `homedir()`, `realpathSync(paths.openclaw)` hoặc `realpathSync(paths.config)` không bắt đầu bằng `realpathSync(tmp)`.
- `after()`: khôi phục env, `(await import("../src/lib/db")).pool.end()`, `rmSync(tmp)`.
- Helper `del(body: unknown)` → `route.DELETE(new Request("http://localhost/api/v1/ops/zalo/accounts", { method: "DELETE", headers: { authorization: "Bearer T", "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) }))`; `spy()` → các dòng của `spy.log` (vắng → `[]`); `resetSpy()`; `cfgBytes()`.

Ca:
- `GT-AC-6 rào: homedir, realpath zaloAdminPaths().openclaw và .config nằm dưới thư mục tạm` — gọi lại `assertRao`, không ném.
- `GT-AC-6 rào với HOME thật trả vi phạm nêu HOME thật` — `assert.throws(() => assertRao(tmp, { openclaw: join(<HOME gốc lưu lúc đầu>, ".openclaw/bin/openclaw"), config: … }), /HOME thật/)` (không gọi handler).
- `GT-AC-1 id rỗng/thiếu/không phải chuỗi → 400, openclaw giả 0 lệnh, config giữ nguyên` — thân `{}`, `{id:""}`, `{id:"   "}`, `{id:5}`, `{id:null}`, `"not-json"`: mỗi thân `status === 400`, `spy().length === 0`, `cfgBytes()` bằng bản trước; với năm thân đầu trừ `"   "` thì `error === "id rỗng"`. Đối chứng dương cùng fixture ở cuối ca: chép fixture sang bản lưu, `del({id:"acc2"})` → `spy().length === 1`, rồi khôi phục fixture + `resetSpy()`.
- `GT-AC-1 bản sao bỏ bước kiểm id → openclaw giả nhận logout với id rỗng` — đọc `src/lib/zalo-admin.ts`, thay `"requireDeletableAccount(cfg, accountId);"` bằng `""`, `assert.notEqual` bản sao với bản gốc, ghi `tmp/mut-bo-kiem/zalo-admin.ts`, import động, `await mut.deleteZaloAccount("")`, assert `spy()` có một dòng kết thúc bằng `--account\t\t` với thông điệp `"logout với id rỗng"`.
- `GT-AC-2 id có khoảng trắng → 400, openclaw giả 0 lệnh, acc2 còn trong config` — `" acc2 "`, `"acc2 "`, `"acc 2"`, `"acc2\n"`: 400, `error === "id có khoảng trắng"`, 0 lệnh, `acc2` còn.
- `GT-AC-3 id lạ/default/dạng cờ → 400 đúng thông điệp lớp, openclaw giả 0 lệnh, config giữ nguyên` — bảng viết trước `[["khong-co","không có trong danh sách tài khoản"],["../acc2",…],["ACC2",…],["default","không xoá được tài khoản default"],["--channel","id dạng cờ"]]`: mỗi dòng 4 assert (mã, error, số dòng spy, byte config). Thêm Review Focus 3: ghi tạm config `{}` → `del({id:"acc2"})` 400 «không có trong danh sách tài khoản», rồi khôi phục.
- `GT-AC-3 bản sao chỉ kiểm thành viên → openclaw giả nhận logout --account --channel, ca đỏ nêu dạng cờ` — bản sao xoá dòng `if (accountId.startsWith("-")) throw new Error("id dạng cờ");`, assert khác bản gốc, `deleteZaloAccount("--channel")` → spy có dòng chứa `--account\t--channel` (thông điệp `"dạng cờ"`); khôi phục fixture.
- `GT-AC-4 id thật acc2 và Acc_5 → 200, mỗi lần đúng một lệnh logout --account <id>, config mất id đó còn default và acc3, có bản .bak` — mỗi id: `resetSpy()`, 200 `{ok:true}`, `spy()` deepEqual `[["channels","logout","--channel","zalouser","--account",id].join("\t") + "\t"]`, config không còn id, còn `default`, `acc3`; `readdirSync(<.openclaw>)` có `openclaw.json.bak-`. Review Focus 4: gọi lại `acc2` → 400 «không có trong danh sách tài khoản», 0 lệnh mới.

- [ ] **Step 2: Chạy test, xác nhận đỏ**

Run: `cd app && node --import tsx --test tests/go-tai-khoan-kiem-id.test.tsx`
Expected: FAIL — `before()` ném vì `zaloAdminPaths is not a function` (rào chưa có ⇒ không ca nào chạy).

- [ ] **Step 3: Cài `zaloAdminPaths`, `requireDeletableAccount`, sửa `deleteZaloAccount` và route `DELETE`**

Route: `const id = typeof body.id === "string" ? body.id : ""` (bỏ `.trim()`), dùng `id` cho cả `deleteZaloAccount(id)` và `auditOpsWrite(...{ accountId: id })`; `body` kiểu `{ id?: unknown }`.

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `cd app && node --import tsx --test tests/go-tai-khoan-kiem-id.test.tsx`
Expected: PASS mọi ca `GT-AC-1/2/3/4/6`; `ls ~/.openclaw` không đổi mtime (soi `stat -f %m ~/.openclaw/openclaw.json` trước/sau).

- [ ] **Step 5: Typecheck + lint**

Run: `cd app && npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/zalo-admin.ts app/src/app/api/v1/ops/zalo/accounts/route.ts app/tests/go-tai-khoan-kiem-id.test.tsx
git commit -m "fix(ops): gỡ tài khoản thu kiểm id trước khi gọi openclaw (ON14)"
```

### Task 2: Thước quét tĩnh logout-sau-bước-kiểm (AC-5)

`independent: false` (cùng tệp test với Task 1). Phục vụ E5.

**Files:**
- Modify: `app/tests/go-tai-khoan-kiem-id.test.tsx`

**Interfaces:**
- Consumes: chuỗi `requireDeletableAccount(` và vị trí logout trong `deleteZaloAccount` từ Task 1.
- Produces: `function quetLogout(files: { path: string; text: string }[]): { path: string; fn: string | null; ok: boolean }[]` trong tệp test — với mỗi tệp có `/openclaw/i`, mỗi literal `"logout"`/`'logout'`: `fn` = tên của `function <tên>(` gần nhất phía trước; `ok` = đoạn từ đầu hàm đó tới literal chứa `requireDeletableAccount(`.

- [ ] **Step 1: Viết ca AC-5 (xanh trên cây thật) và hai chiều đỏ**

- `GT-AC-5 chỗ logout trong app/src bằng đúng danh sách viết trước [zalo-admin.ts · deleteZaloAccount] và đứng sau requireDeletableAccount` — đi đệ quy `src/` lấy `.ts`/`.tsx`, `path` tương đối `app/`; `assert.deepEqual(kq.map(({path, fn}) => ({path, fn})), [{ path: "src/lib/zalo-admin.ts", fn: "deleteZaloAccount" }])`; mọi `ok === true`.
- `GT-AC-5 bản sao logout trước bước kiểm → vi phạm nêu tệp và «logout trước bước kiểm id»` — bản sao `zalo-admin.ts` cắt dòng `requireDeletableAccount(cfg, accountId);` rồi chèn lại SAU khối `try { await run(OPENCLAW, ["channels", "logout"…` (đột biến theo chuỗi, assert khác gốc); `quetLogout` trên bản sao → phần tử `ok === false`; hàm phụ `viPham(kq)` trả `"<path>: logout trước bước kiểm id"` và ca assert chuỗi đó có `src/lib/zalo-admin.ts`.
- `GT-AC-5 bản sao thêm mảng argv logout không qua bước kiểm → thước bắt, nêu tệp` — bản sao nối thêm `export function buildLogoutArgs(id: string): string[] { return ["channels", "logout", "--account", id]; }`; `quetLogout` ra 2 phần tử, phần tử `fn === "buildLogoutArgs"` có `ok === false`, `viPham` nêu `src/lib/zalo-admin.ts`.

- [ ] **Step 2: Chạy, xác nhận cả ba ca xanh và hai bản sao thật sự đỏ**

Run: `cd app && node --import tsx --test tests/go-tai-khoan-kiem-id.test.tsx`
Expected: PASS mọi ca `GT-AC-*`.

- [ ] **Step 3: Phá-thử thước trên cây thật (không commit)**

Tạm đổi thứ tự trong `src/lib/zalo-admin.ts` (logout lên trước bước kiểm), chạy lại: ca `GT-AC-5 chỗ logout…` ĐỎ với thông điệp `logout trước bước kiểm id`; `git checkout -- src/lib/zalo-admin.ts`.

- [ ] **Step 4: Bộ đủ của app**

Run: `cd app && npm test && npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/tests/go-tai-khoan-kiem-id.test.tsx
git commit -m "test(ops): thước tĩnh — mọi lời gọi logout đứng sau bước kiểm id (ON14 AC-5)"
```
