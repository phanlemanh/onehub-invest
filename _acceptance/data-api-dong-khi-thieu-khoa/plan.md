# PB3 data-api đóng khi thiếu khoá — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** data-api từ chối mọi lời gọi dữ liệu (503) và bản Node không khởi động khi danh sách khoá rỗng ở mọi môi trường không khai rõ là dev/test.

**Architecture:** Một hàm `authConfig()` đọc `process.env` ở mỗi lời gọi và quyết «mở được» hay «đóng». Middleware `auth` dùng nó cho mọi lối vào (Node và Vercel cùng nhập `app.ts`); `index.ts` dùng cùng hàm để thoát trước `serve()`. Test gọi `app.request` trực tiếp, đếm truy vấn bằng cách bọc `pool.query` như test HT19, và sinh tiến trình con cho bước khởi động.

**Tech Stack:** Hono 4, @hono/node-server, node:test + tsx, pg, DB thử `db/db-thu.sh`.

**Spec:** `_acceptance/data-api-dong-khi-thieu-khoa/design.md` + `contract.md` (AC-1…AC-9) + `evals.yaml` (E1…E11).

## Global Constraints

- Mở được ⇔ `NODE_ENV` ∈ {`development`, `test`} (so đúng chữ, phân biệt hoa thường) VÀ `VERCEL` vắng hoặc rỗng. Mọi thứ khác là đóng.
- Danh sách khoá = `DATA_API_KEYS` tách dấu phẩy, `trim`, bỏ phần tử rỗng.
- Đóng + rỗng: `/v1/**` (và mọi đường khác trừ hai đường dưới) → 503 `{error:{code:"AUTH_NOT_CONFIGURED",message}}`, không gọi handler; `/health` → 503 `{status:"misconfigured",error:{code:"AUTH_NOT_CONFIGURED",message}}`; `/openapi.json` → 200.
- Có khoá (đóng hay mở): hành vi cũ giữ nguyên — 401 `UNAUTHORIZED` khi thiếu/sai, `Bearer` hoặc `X-API-Key` đúng thì qua; `/health`, `/openapi.json` không cần khoá.
- Thông điệp không chứa giá trị khoá. Tên code tiếng Anh (AGENTS.md «Đặt tên»); comment domain tiếng Việt.
- Mọi tệp trong `data-api/` là công khai: không tên nguồn thật, không khoá thật, không email.
- Không đụng `package-lock.json`, `Dockerfile`, `vercel.json`, `api/[...route].ts`. Ranh giới tệp: contract AC-8(a).

## Review Focus

1. `NODE_ENV=Development` (viết hoa) hay `" development"` — người đọc nghĩ là dev, luật so đúng chữ nên phải ĐÓNG. Test: ca `PB3-AC-1b` ở Task 1.
2. `DATA_API_KEYS=" k1 , k2 "` (khoảng trắng quanh khoá) — khoá vẫn khớp sau `trim`. Test: thêm vào ca AC-3 ở Task 1.
3. `Authorization: Bearer ` (token rỗng) ở môi trường có khoá — phải 401, không lọt. Test: thêm vào ca AC-3 ở Task 1.
4. Đường lạ `/v1/khong-co` khi đóng — 503, không 404 lộ cấu trúc (không phải lỗ dữ liệu, chỉ ghim hành vi). Test: một assert trong ca AC-1 ở Task 1, NGOÀI phép đếm `15 × (2N + 2)`.
5. Bản Docker vắng `DATABASE_URL` lẫn khoá — tiến trình vẫn thoát ≠ 0 (lỗi `client.ts` đến trước); không phải luật của hàng, chỉ ghi lại, không test.

---

### Task 1: Luật đóng trong middleware + test ma trận (AC-1, AC-2, AC-3, AC-4, AC-6 phần thân trả về)

`independent: false` · phục vụ E1, E2, E3, E4, E6, E11

**Files:**
- Modify: `data-api/src/middleware/auth.ts` (viết lại)
- Create: `data-api/test/auth-dong.test.ts`
- Modify: `data-api/test/dong-ba-route.test.ts` (thêm đúng một dòng `process.env.NODE_ENV = "test";` ngay sau dòng `delete process.env.DATA_API_KEYS;`)

**Interfaces — Produces:**
- `export const MISSING_KEYS_MESSAGE: string` = `"DATA_API_KEYS is empty: refusing to serve data outside NODE_ENV=development or NODE_ENV=test (never on Vercel). Set DATA_API_KEYS to a comma-separated list of API keys."`
- `export function authConfig(env: NodeJS.ProcessEnv = process.env): { open: boolean; keys: string[] }` — `open` = được chạy không khoá.
- `export const auth` — middleware Hono như cũ, đọc `authConfig()` ở mỗi lời gọi.

- [ ] **Step 1: Viết test đỏ `data-api/test/auth-dong.test.ts`.** Đầu tệp: từ chối nếu `DATABASE_URL` không chứa `_suite_` (như HT19); bọc `pool.query` đếm số lần gọi; nạp `app` bằng `await import`; nạp `auth.ts` bằng `await import` để đọc `MISSING_KEYS_MESSAGE` (vắng → các ca cần nó đỏ với «PB3 thiếu hằng thông điệp»). Hàm `datEnv({NODE_ENV?, VERCEL?, DATA_API_KEYS?})` gán/xoá biến; `after` trả lại env gốc. Danh sách đường: `app.routes.filter(r => r.method === "GET" && r.path.startsWith("/v1"))`, thay `/:[^/]+` bằng `/mau`, khử trùng lặp; `console.log("PB3 đường /v1 đếm được: " + N)`; `assert.ok(N > 5)`.
  - `PB3-AC-1 môi trường đóng, khoá rỗng → 503`: 5 env (`production`; vắng; `staging`; `development`+`VERCEL=1`; `test`+`VERCEL=1`) × 3 dạng khoá (vắng; `""`; `" , ,"`) × (mỗi đường × {không header, `Authorization: Bearer x`} + `/health` + `/openapi.json`). Đếm assert, in `PB3 số assert trạng thái: <k>`, `assert.equal(k, 15 * (2 * N + 2))`. Gom lỗi theo khuôn `PB3 đóng: <env>/<dạng khoá>/<đường> trả <mã>, mong <mã>` rồi assert một lần. Sau ma trận: bộ đếm truy vấn = 0, sai → `PB3 đóng mà vẫn truy vấn DB: <n>`; `/v1/khong-co` → 503 (Review Focus 4, ngoài phép đếm). Đối chứng cùng ca: env `test`, khoá rỗng, `/v1/markets` → bộ đếm > 0.
  - `PB3-AC-1b NODE_ENV viết hoa hay có khoảng trắng vẫn đóng`: `Development`, `" development"` → `/v1/markets` 503.
  - `PB3-AC-2 môi trường mở, khoá rỗng → mở như cũ`: `development`, `test` (không `VERCEL`) → 200; sai → `PB3 mở: <env> trả <mã>, mong 200`.
  - `PB3-AC-3 có khoá → xác thực như cũ`: `DATA_API_KEYS=" k1 , k2 "` (khoá giả, chuỗi canh của AC-6 ghép vào); ở `production` và `development`: không header 401 `UNAUTHORIZED`; khoá sai 401; `Bearer ` rỗng 401; `Bearer k1` 200; `X-API-Key: k2` 200; `/health` 200; `/openapi.json` 200.
  - `PB3-AC-4 đọc biến ở mỗi lời gọi`: `production`; rỗng → 503; đặt khoá → không header 401; xoá → 503; không nạp lại module.
  - `PB3-AC-6 không lộ giá trị khoá`: chuỗi canh `CANH-KHOA-PB3-<randomUUID>` làm một khoá (AC-3) và nằm ở biến phụ `DATA_API_KEYS_BACKUP` trong một ca `production` khoá rỗng; gom mọi thân trả về của các ca này → không chứa chuỗi canh (`PB3 lộ giá trị khoá ở <nơi>`); đối chứng: bộ dò bắt được chuỗi canh khi cấy vào một thân giả. (Phần stdout/stderr tiến trình con ở Task 2.)
- [ ] **Step 2: Chạy, thấy đỏ.** `bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/auth-dong.test.ts'` → AC-1, AC-1b, AC-4 đỏ (bản cũ trả 200); AC-2, AC-3 xanh.
- [ ] **Step 3: Viết lại `auth.ts` theo Interfaces + Global Constraints.** `/openapi.json` luôn qua; đóng + rỗng → `/health` trả thân misconfigured, mọi đường khác trả 503 AUTH_NOT_CONFIGURED; còn lại như cũ. Comment tiếng Việt nêu lý do đóng mặc định (design §3).
- [ ] **Step 4: Thêm dòng `NODE_ENV` vào test HT19.**
- [ ] **Step 5: Chạy lại lệnh Step 2 → xanh; chạy E11** `bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/*.test.ts'` → `ℹ fail 0`, có tên ca của cả hai tệp; `cd data-api && npm run typecheck` → 0.
- [ ] **Step 6: Commit** `fix(data-api): PB3 đóng mọi lời gọi dữ liệu khi thiếu khoá ngoài dev/test`.

### Task 2: index.ts không khởi động + script dev (AC-5, AC-6 phần tiến trình con)

`independent: false` (dùng `authConfig`, `MISSING_KEYS_MESSAGE` của Task 1) · phục vụ E5, E6

**Files:**
- Modify: `data-api/src/index.ts` (thêm kiểm trước `serve()`)
- Modify: `data-api/package.json` (chỉ `scripts.dev` → `"NODE_ENV=development tsx watch src/index.ts"`)
- Modify: `data-api/test/auth-dong.test.ts` (thêm ca)

**Interfaces — Consumes:** `authConfig`, `MISSING_KEYS_MESSAGE` từ `./middleware/auth.js`.

- [ ] **Step 1: Thêm ca đỏ `PB3-AC-5 index.ts không khởi động khi thiếu khoá`.** Cổng trống tìm bằng `net.createServer().listen(0)` rồi đóng. `spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {cwd: data-api, env: {PATH, DATABASE_URL, PORT, ...ca}})`. Ca đóng (`production`, `NODE_ENV` vắng; khoá rỗng; có `DATA_API_KEYS_BACKUP` mang chuỗi canh): chờ `exit` ≤ 10 s, mã ≠ 0, stderr chứa nguyên `MISSING_KEYS_MESSAGE`, `net.connect` tới cổng bị từ chối. Ca đối chứng (`production` + khoá chứa chuỗi canh; `development` không khoá): `fetch /health` thử lặp tới 200 trong 10 s, rồi `kill`. Gom stdout+stderr của mọi tiến trình con → không chứa chuỗi canh. Sai → `PB3 khởi động: <ca> <điều sai>`. `after` giết mọi tiến trình con còn sống.
- [ ] **Step 2: Chạy lệnh Task 1 Step 2 → AC-5 đỏ** (bản hiện tại khởi động ở cả hai ca đóng).
- [ ] **Step 3: Trong `index.ts`, trước `serve()`: nếu `!open && keys.length === 0` → `console.error(MISSING_KEYS_MESSAGE)`, `process.exit(1)`.** Sửa `scripts.dev`.
- [ ] **Step 4: Chạy lại → xanh cả tệp; E11 xanh; typecheck 0.**
- [ ] **Step 5: Commit** `fix(data-api): PB3 bản Node không khởi động khi thiếu khoá`.

### Task 3: Hai probe chiều đỏ và phạm vi (AC-7, AC-8)

`independent: false` (đo tệp của Task 1–2) · phục vụ E7, E8

**Files:**
- Create: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs` (khuôn theo `_acceptance/data-api-dong-ba-route-lo/probes/pha.mjs`)
- Create: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs` (khuôn theo `…/data-api-dong-ba-route-lo/probes/pham-vi.mjs`)

- [ ] **Step 1: `pha.mjs`.** `base = git merge-base HEAD origin/main`; chép `data-api/` sang `mkdtemp` (bỏ `node_modules`, nối lại bằng symlink tuyệt đối); ghi đè `src/middleware/auth.ts`, `src/index.ts` bằng `git show <base>:<đường>`; chạy lệnh E1 trên bản sao với DB thử `oneinvest_suite_dapi_pha`. Đầu ra không có `PB3-AC-` → thoát 1 `pha: bản sao không nạp được tệp test`. Phải thoát ≠ 0 và tập ca đỏ (dòng `✖ PB3-AC-…`) gồm AC-1, AC-4, AC-5 → in `pha: bản cũ đỏ ở <ds>`; thiếu → thoát 1 `pha: thước không đỏ ở <ca>`. Rồi chạy lệnh E1 trên cây thật → thoát 0, in `pha: cây thật xanh`. `finally` xoá thư mục tạm.
- [ ] **Step 2: `pham-vi.mjs`.** Hàm thuần `soat({tep, diffConfig, diffHt19, pkgCu, pkgMoi, tepTen})` trả danh sách lỗi; chạy trên dữ liệu thật (diff với merge-base) → phải rỗng, in dòng tóm tắt E8 (không in tên nguồn). Năm lượt phá cùng lượt trên dữ liệu giả lập (`pha-tep` Dockerfile, `pha-lock`, `pha-ht19` thêm dòng thứ hai, `pha-ten` cấy tên lấy từ bộ `scripts/lib/tier-a-source-names.mjs` vào một bản chép tạm, `pha-config` khoá ngoài `dapi_khoa*`) → mỗi lượt phải ra đúng thông điệp ghim trong E8; ô không đỏ → thoát 1.
- [ ] **Step 3: Chạy hai probe** → thoát 0 cả hai.
- [ ] **Step 4: Commit** `test(acceptance): PB3 probe chiều đỏ và phạm vi`.

### Task 4: Tài liệu và compose (AC-9)

`independent: true` (chỉ tài liệu; nhưng nhỏ — làm tuần tự sau Task 3, không tách Workflow) · phục vụ E10, E8

**Files:**
- Modify: `data-api/README.md` (dòng bảng biến `DATA_API_KEYS` dòng 48; mục Authentication dòng 85–101)
- Modify: `data-api/.env.example` (chú thích `DATA_API_KEYS`)
- Modify: `data-api/docker-compose.yml` (dịch vụ `api`: thêm `DATA_API_KEYS: ${DATA_API_KEYS:?set_api_keys}`)
- Modify: `data-api/CLAUDE.md` (dòng 11 mô tả `auth.ts`)

- [ ] **Step 1: Sửa bốn tệp** theo bảng design §2: chỉ `NODE_ENV` development/test (không trên Vercel) chạy được không khoá; nơi khác thiếu khoá → `/v1` 503 `AUTH_NOT_CONFIGURED`, `/health` 503, bản Node không khởi động; `npm run dev` đã tự đặt `NODE_ENV=development`. Xoá mọi câu «empty = no auth» vô điều kiện.
- [ ] **Step 2: Kiểm** `grep -n -i 'no auth\|tắt auth' data-api/README.md data-api/.env.example data-api/CLAUDE.md` → chỉ còn câu có điều kiện dev/test; chạy lại `pham-vi.mjs` → thoát 0.
- [ ] **Step 3: Commit** `docs(data-api): PB3 tài liệu và compose theo luật đóng khi thiếu khoá`.

Sau Task 4: sàn thiết kế S3 (`design-floor-s3.mjs`), contract → `implemented`, S4.
