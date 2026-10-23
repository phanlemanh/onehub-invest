# Tạm đóng /api/v1/deals — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `GET /api/v1/deals` chỉ trả dữ liệu cho bearer `OPS_API_TOKEN` hoặc phiên ops; mọi người gọi khác nhận `401 {"error":"unauthorized"}` trước khi truy vấn DB.

**Architecture:** Một hàm cổng thuần `canCallOpsApi(req, getUser)` trong `app/src/lib/ops-access.ts` (đọc env lúc gọi, nhận `getUser` để test ngoài request Next). Route gọi nó ở dòng đầu. Rào hồi quy tĩnh `checkDealsRoute(src)` chạy trong `check-portal-compliance.mjs` (làn ghim lại) kèm chế độ đột biến; smoke HTTP trên app đang chạy.

**Tech Stack:** Next.js 16 route handler · node:test + tsx (`app/tests/*.test.tsx`) · Node ESM script ở `scripts/` (mượn `pg` từ `app/`).

**Spec:** `docs/superpowers/specs/2026-10-23-deals-api-tam-dong-design.md` · hợp đồng `_acceptance/deals-api-tam-dong/contract.md` · `evals.yaml`.

## Global Constraints

- Thân 401 đúng `{"error":"unauthorized"}` — khuôn các route `/api/v1/ops/*`.
- Bearer so khớp nguyên chuỗi `Bearer ${token}` (như route ops); token trống/thiếu → nhánh bearer luôn sai.
- `OPS_API_TOKEN` đọc trong thân hàm mỗi lần gọi, không gán hằng ở cấp module.
- `ops-access.ts` chỉ được `import type` từ `./auth` — `check-portal-compliance.mjs` nạp nó bằng Node strip-types; cấm import `next/*` vào đó.
- Không gom 5 route ops, không cờ mở lại, không `WWW-Authenticate` (Out of scope).
- Thông điệp ghim của kiểm tĩnh: `deals: cổng ops (canCallOpsApi) chạy trước pool.query`.
- Chữ tiếng Việt cho comment/thông điệp; nguồn gọi bằng mã S0x.

## Review Focus

1. Scheme viết thường `bearer T` hoặc thừa khoảng trắng → KHÔNG qua (giữ khớp nguyên chuỗi như route ops) — test ở Task 1.
2. `getUser` ném lỗi (DB phiên sập) → hàm từ chối lời hứa (reject), không trả `true` — test ở Task 1.
3. Gọi có query (`?limit=5&market=…`) không token vẫn 401 — smoke ở Task 3.
4. Bearer đúng kèm cookie phiên `user` → vẫn 200 (bearer thắng, không đọc phiên) — đã là ca E3 (bộ đếm getUser = 0).
5. Phiên hết hạn → `getSessionUser` trả null → 401 — smoke ở Task 3 (phiên `expires_at` trong quá khứ).

---

### Task 1: Hàm cổng `canCallOpsApi`

Phục vụ: E1, E3, E5, E7 · `independent: true`

**Files:**
- Modify: `app/src/lib/ops-access.ts` (thêm export sau `canAccessOps`)
- Create: `app/tests/deals-api-guard.test.tsx`

**Interfaces:**
- Produces: `export async function canCallOpsApi(req: Request, getUser: () => Promise<User | null>): Promise<boolean>`

- [ ] **Step 1: Viết test hỏng** — `app/tests/deals-api-guard.test.tsx`, khuôn `zalo-media.test.tsx` (node:test, assert/strict). Helper `req(auth?: string)` dựng `new Request("http://localhost:3456/api/v1/deals", { headers: auth ? { authorization: auth } : {} })`; `spy(user)` trả `{ fn, calls }` đếm lời gọi; `withToken(v, fn)` gán/xoá `process.env.OPS_API_TOKEN` và `OPS_EMAILS` rồi khôi phục trong `finally`. Ca (tên mở đầu bằng mã AC để evals bám):
  - `AC-1 khách: không bearer, không phiên → không qua` — token "T", `req()`, getUser→null ⇒ `false`.
  - `AC-2 bearer đúng → qua, không gọi getUser` — token "T", `req("Bearer T")`, spy(user("user")) ⇒ `true`, `calls === 0`.
  - `AC-3 bearer sai → không qua` — `req("Bearer X")`, getUser→null ⇒ `false`.
  - `AC-3 token máy chủ thiếu: 'Bearer ' và 'Bearer undefined' → không qua` — xoá env; cả hai header ⇒ `false`; env `""` cũng `false`.
  - `AC-3 token đọc lúc gọi: xoá env giữa chừng → Bearer T không qua` — env "T" ⇒ `true`; xoá env cùng tiến trình ⇒ cùng header `false`.
  - `AC-3 scheme viết thường / thừa khoảng trắng → không qua` — `"bearer T"`, `"Bearer  T"` ⇒ `false` (Review Focus 1).
  - `AC-4 phiên: ops/admin/email trong OPS_EMAILS qua; user, null không qua` — không header; bảng 5 hàng.
  - `AC-4 getUser ném lỗi → reject` — `await assert.rejects(canCallOpsApi(req(), async () => { throw new Error("db") }))` (Review Focus 2).

- [ ] **Step 2: Chạy, thấy đỏ** — `cd app && node --import tsx --test tests/deals-api-guard.test.tsx` ⇒ FAIL `canCallOpsApi` không được export.

- [ ] **Step 3: Viết `canCallOpsApi`** trong `ops-access.ts`: đọc `process.env.OPS_API_TOKEN` trong thân; `!!token && authorization === \`Bearer ${token}\`` → `true` không gọi `getUser`; ngược lại `canAccessOps(await getUser())`. Docstring tiếng Việt: luật chung của API ops (bearer hoặc phiên), dùng đầu tiên ở `/api/v1/deals`.

- [ ] **Step 4: Chạy, thấy xanh** — cùng lệnh ⇒ mọi ca pass; rồi `cd app && npm test` ⇒ exit 0.

- [ ] **Step 5: Lượt phá-thử (luật sinh phép đo)** — tạm sửa hàm chụp token ở cấp module (`const TOKEN = process.env.OPS_API_TOKEN`) ⇒ ca «token đọc lúc gọi» ĐỎ; tạm bỏ `!!token &&` ⇒ ca «token máy chủ thiếu» ĐỎ. Hoàn lại, xanh lại. Ghi hai dòng kết quả vào thân commit.

- [ ] **Step 6: Commit** — `feat(app): canCallOpsApi — luật bearer/phiên ops dùng chung, đọc token lúc gọi`.

### Task 2: Route đóng cổng + rào hồi quy tĩnh

Phục vụ: E9, E10 (và là vật mà E2/E4/E6/E8 đo) · `independent: false` (cần Task 1)

**Files:**
- Modify: `app/src/app/api/v1/deals/route.ts`
- Create: `scripts/check-deals-api.mjs`
- Modify: `scripts/check-portal-compliance.mjs` (thêm mục 10)
- (config `deals_api_mutation` đã có trong `_acceptance/config.yaml`)

**Interfaces:**
- Consumes: `canCallOpsApi` (Task 1), `getSessionUser` từ `@/lib/auth`.
- Produces: `export function checkDealsRoute(src: string): { ok: boolean; msg: string }` (msg luôn là thông điệp ghim) và `export const DEALS_GUARD_MSG`.

- [ ] **Step 1: Viết `scripts/check-deals-api.mjs`** — `checkDealsRoute(src)`: bỏ comment (cùng hàm `code()` như portal-compliance), bỏ mọi dòng `import`; ĐẠT khi khớp `/if \(!\(await canCallOpsApi\(req, getSessionUser\)\)\)\s*\{?\s*return NextResponse\.json\(\{ error: "unauthorized" \}, \{ status: 401 \}\)/` VÀ vị trí khớp < vị trí `pool.query(` đầu tiên VÀ `pool.query(` có mặt. Chế độ CLI: `static` đọc route thật, in `ok   …`/`FAIL …`, exit 0/1; `mutation` đọc route thật, dựng 4 đột biến bằng thay chuỗi — (a) xoá khối if (giữ import), (b) chuyển khối if xuống ngay sau lời gọi `pool.query(…)`, (c) bỏ `await`, (d) thay `return NextResponse.json(…401…)` bằng `console.warn("unauthorized")` — bản nguyên phải ĐẠT, mỗi đột biến phải `ok === false` và `msg === DEALS_GUARD_MSG`; đột biến nào không áp được (chuỗi gốc không có) là FAIL có tên (không im). Gốc kho suy từ `import.meta.url`.

- [ ] **Step 2: Chạy, thấy đỏ trên cây cũ** — `node scripts/check-deals-api.mjs static` ⇒ `FAIL deals: cổng ops (canCallOpsApi) chạy trước pool.query`, exit 1.

- [ ] **Step 3: Sửa route** — import `getSessionUser`, `canCallOpsApi`; dòng đầu của `GET` là khối if đúng khuôn trên; docstring thay «public API» bằng: tạm đóng — chỉ bearer `OPS_API_TOKEN` hoặc phiên ops (audit 23/10 P7: 29/30 deal là tin mock S03; Q3); mở lại khi PL2 đã rút tin mock là quyết riêng — hồ sơ `deals-api-tam-dong`.

- [ ] **Step 4: Xanh** — `node scripts/check-deals-api.mjs static` ⇒ exit 0; `node scripts/check-deals-api.mjs mutation` ⇒ 1 ĐẠT + 4 TRƯỢT đúng thông điệp, exit 0.

- [ ] **Step 5: Nối vào portal-compliance** — mục 10 trong `check-portal-compliance.mjs`: `const { checkDealsRoute } = await import("./check-deals-api.mjs")`; `check(checkDealsRoute(read("src/app/api/v1/deals/route.ts")).ok, DEALS_GUARD_MSG)`; cập nhật dòng mô tả đầu tệp. `node scripts/check-portal-compliance.mjs` ⇒ có `ok   deals: cổng ops (canCallOpsApi) chạy trước pool.query`, exit 0.

- [ ] **Step 6: Kiểm module** — `cd app && npx tsc --noEmit && npm run lint` ⇒ exit 0.

- [ ] **Step 7: Commit** — `fix(app): tạm đóng /api/v1/deals — chỉ token/phiên ops (AU2)`.

### Task 3: Smoke HTTP `scripts/smoke-deals-api.mjs`

Phục vụ: E2, E4, E6, E8 · `independent: true` (tệp riêng; chạy xanh cần Task 2 + app đang chạy)

**Files:**
- Create: `scripts/smoke-deals-api.mjs`

**Interfaces:**
- Consumes: HTTP `GET ${BASE_URL}/api/v1/deals`; bảng `users`, `sessions` của DB local.

- [ ] **Step 1: Viết smoke** theo khuôn `smoke-portal-compliance.mjs` (`check()`, `fails[]`, nonce, phiên tạm `*.verify.test`, dọn trong `finally`). Token: `process.env.OPS_API_TOKEN`, thiếu thì đọc dòng `OPS_API_TOKEN=` trong `app/.env.local` (gốc suy từ `import.meta.url`); vẫn thiếu ⇒ `FAIL thiếu OPS_API_TOKEN (env hoặc app/.env.local) — ca bearer đúng không thử được`. Cờ `--chi-doc`: chỉ ca khách + bearer, không mở DB. Dòng in (evals khớp nguyên văn):
  - `khách: 401 {"error":"unauthorized"}, không khoá data/meta` — thân parse JSON đúng một khoá `error`.
  - `khách có query (?limit=5&min_discount=0): 401` (Review Focus 3).
  - `bearer sai: 401`
  - `bearer đúng: 200, data là mảng, meta có total/minDiscount/ruler`
  - `phiên role=user: 401` · `phiên hết hạn: 401` (phiên `expires_at = now() - interval '1 minute'`) · `phiên role=ops: 200`
  - Tổng kết `deals-api-smoke: ĐẠT` / `deals-api-smoke: <n> lỗi`, exit 0/1.

- [ ] **Step 2: Chạy trên app TRƯỚC Task 2 (nếu Task 2 chưa xong) hoặc trên `git stash` của route** ⇒ dòng khách FAIL (200) — chiều đỏ của phép đo; rồi trên cây sau Task 2 ⇒ `deals-api-smoke: ĐẠT`. Lệnh: `BASE_URL=http://localhost:3456 node scripts/smoke-deals-api.mjs` với app chạy từ worktree này.

- [ ] **Step 3: Commit** — `test(scripts): smoke /api/v1/deals — ma trận người gọi trên app đang chạy`.

### Task 4: Tài liệu nói thật

Phục vụ: E11 · `independent: true`

**Files:**
- Modify: `docs/ROADMAP.md` (§4 Track 5: dòng V9)

- [ ] **Step 1:** Thêm dòng `V9` vào bảng Track 5: «Tạm đóng `/api/v1/deals` — chỉ bearer `OPS_API_TOKEN` hoặc phiên ops; lý do: audit 23/10 P7 (29/30 deal công khai là tin mock S03), Q3; mở lại khi PL2 đã rút tin mock khỏi canonical — quyết riêng, hàng riêng — `_acceptance/deals-api-tam-dong`» · trạng thái `🔄 chờ Cổng 2`.
- [ ] **Step 2: Commit** — `docs(roadmap): V9 tạm đóng /api/v1/deals`.

---

Sau Task 1–4: chạy `/verify` (app + scripts), đặt hợp đồng `status: implemented`, sang S4.
