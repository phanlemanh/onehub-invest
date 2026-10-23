# Sổ bề mặt API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một sổ khai mọi route API + rào máy giữ mã khớp sổ; đóng `/api/v1/offers`, beacon khách 204, chặn ảnh QR ở `/api/zalo-media`; vá rào DB-local cho smoke deals.

**Architecture:** Sổ là dữ liệu thuần (`app/src/lib/api-surface.ts`), kiểm là hàm thuần (`scripts/check-api-surface.mjs`) chạy trên map tệp → nguồn, nên chế độ đột biến dựng bản hỏng trong bộ nhớ. Cổng offers dùng lại `canCallOpsApi`; chặn QR dùng hằng tiền tố chung với bên viết (`zalo-admin.ts`).

**Tech Stack:** Next.js 16 route handlers · Node ESM scripts (strip-types import `.ts`) · node:test + tsx.

**Spec:** `docs/superpowers/specs/2026-10-23-so-be-mat-api-design.md` · `_acceptance/so-be-mat-api/contract.md` · `evals.yaml`.

## Global Constraints

- Chế độ đóng: `public | ops | ops-session | admin | session-or-noop`.
- Thông điệp ghim (nguyên văn): «chưa khai trong sổ», «sổ trỏ route không còn», «phương thức lệch sổ», «đọc sale_offers mà sổ khai public», «cổng ops (canCallOpsApi) chạy trước pool.query», «chế độ ops mà mã thiếu cổng», «chế độ ops-session mà mã thiếu canAccessOps», «chế độ admin mà mã không có isAdmin», «chế độ session-or-noop mà khách không nhận 204».
- `api-surface.ts` và `zalo-admin.ts` phần xuất mới không import `next/*` ở cấp trên cùng nếu script cần nạp — script chỉ nạp `api-surface.ts`.
- Không sửa tệp dưới `app/src/app/api/v1/ops/**` (T3).

## Review Focus

1. Route có nhiều phương thức (zalo accounts GET/POST/DELETE) — so khớp cả tập phương thức, không chỉ phương thức đầu — Task 1 (M3).
2. Import vòng tròn trong bao đóng (`a` ↔ `b`) — duyệt có tập đã thăm, không lặp vô hạn — Task 1.
3. Đường route có đoạn động `[id]` — khoá sổ là đường thư mục nguyên văn — Task 1.
4. Tên QR viết hoa / đuôi `.PNG` — so không phân biệt hoa thường — Task 3.
5. Beacon khách gửi thân rác — vẫn 204 (kiểm phiên trước khi đọc thân) — Task 2.

---

### Task 1: Sổ + kiểm tĩnh + đột biến
Phục vụ: E1–E4 · `independent: false` (Task 2 cần sổ khai offers/beacon đúng chế độ)

**Files:** Create `app/src/lib/api-surface.ts`, `scripts/check-api-surface.mjs`; Modify `scripts/check-portal-compliance.mjs` (mục 11).

- [ ] Viết `API_SURFACE` 18 dòng (route = đường thư mục dưới `app/src/app/api`, vd `v1/ops/review/[id]/decide`).
- [ ] Viết `checkApiSurface({ entries, files })` → `{ violations: string[], routes: number }`; bao đóng import bắc cầu (`@/` → `app/src/`, tương đối theo thư mục tệp; thử đuôi `.ts`, `.tsx`, `/index.ts`), tập đã thăm.
- [ ] `static` trên cây thật — trước Task 2 phải TRƯỢT ở offers («cổng ops…») và beacon («…204»): chiều đỏ.
- [ ] `mutation`: bảng M1–M14 đúng design §2; không áp được → TRƯỢT có tên.
- [ ] Nối vào `check-portal-compliance.mjs`.
- [ ] Commit `feat(scripts): sổ bề mặt API + kiểm tĩnh (NT4)`.

### Task 2: Đóng offers + beacon 204 + audit-all
Phục vụ: E1, E5, E6, E7 · `independent: false`

**Files:** `app/src/app/api/v1/offers/route.ts`, `app/src/app/api/v1/user-events/route.ts`, `scripts/audit-all.sh`.

- [ ] offers: khối cổng đúng khuôn AU2 ở dòng đầu; docstring tạm đóng.
- [ ] user-events: `if (!user) return new NextResponse(null, { status: 204 });` trước khi đọc thân.
- [ ] audit-all: offers khách → 401 đạt, bearer CTOKEN → 200 đạt; dời khỏi nhóm PUBLIC.
- [ ] `check-api-surface static` + `mutation` xanh; `tsc` + `lint` app xanh.
- [ ] Commit `fix(app): đóng /api/v1/offers, beacon khách 204 (NT4)`.

### Task 3: Chặn ảnh QR ở zalo-media
Phục vụ: E8, E9 · `independent: true`

**Files:** `app/src/lib/zalo-admin.ts` (xuất `LOGIN_QR_PREFIX`, `loginQrPath`, `isLoginQrFile`; `qrFile` dùng chung), `app/src/lib/ops/zalo-media.ts`, `app/tests/zalo-media.test.tsx`.

- [ ] Test hỏng trước: tệp `path.basename(loginQrPath("acc2"))` trong gốc media giả → 403; symlink `vo-hai.png` → tệp QR → 403; đối chứng `a.jpg` 200.
- [ ] Sửa `sendImage` hai lớp. Phá-thử: bỏ lớp realpath → ca symlink đỏ.
- [ ] Commit `fix(app): /api/zalo-media chặn ảnh QR đăng nhập Zalo (NT4)`.

### Task 4: Smoke sống + rào DB-local + kiểm rào
Phục vụ: E5, E7, E9, E10 · `independent: true`

**Files:** Create `scripts/smoke-api-surface.mjs`, `scripts/check-smoke-guard.mjs`; Modify `scripts/smoke-deals-api.mjs`.

- [ ] smoke-deals-api: `assertLocalDatabaseUrl` ở đầu khi không `--chi-doc`, trước mọi HTTP.
- [ ] check-smoke-guard: chạy smoke-deals-api với `DATABASE_URL=postgres://db.example.com:5432/x`, `BASE_URL=http://127.0.0.1:9` → phải thoát ≠ 0 với thông điệp rào và KHÔNG có dòng `khách:`; đối chứng `--chi-doc` cùng env → không có thông điệp rào.
- [ ] smoke-api-surface theo design §7 (+ `--chi-doc`); chạy hai chiều trên app worktree.
- [ ] Commit `test(scripts): smoke sổ bề mặt API + rào DB-local smoke deals`.

### Task 5: Tài liệu
Phục vụ: E11 · `independent: true` — `docs/architecture/portals.md` mục «Sổ bề mặt API»; ROADMAP Track 5 dòng V10.
