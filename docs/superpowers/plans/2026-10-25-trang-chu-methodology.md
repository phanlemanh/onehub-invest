# trang-chu-methodology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng phần đo của hàng UI2 — phần UI (route `/methodology`, 301, `definition-grid`, nền hero, thẻ thị trường, hai ranh giới lỗi) đã dựng ở S1 làm bản bấm được; còn test jsdom, hai smoke HTTP và tài liệu.

**Architecture:** Test `app/tests/trang-chu-methodology.test.tsx` (ca «TCM-AC-n», jsdom + `renderToStaticMarkup`, không cần DB) theo khuôn `compare-saved.test.tsx`. Smoke `scripts/smoke-trang-chu-methodology.mjs` chỉ GET trên dev :3460. Smoke `scripts/smoke-trang-chu-loi-db.mjs` chạy `next start` bản build ở :3462 với `DATABASE_URL` trỏ cổng chết.

**Tech Stack:** Next.js 16.4, React 19, node:test + tsx, jsdom, pg (mượn từ `app/`).

**Spec:** `docs/superpowers/specs/2026-10-25-trang-chu-methodology-design.md` · hợp đồng `_acceptance/trang-chu-methodology/contract.md` · evals `_acceptance/trang-chu-methodology/evals.yaml`.

## Global Constraints

- Redirect: `{ source: "/phuong-phap", destination: "/methodology", statusCode: 301 }` (đã có).
- Chữ UI tiếng Việt nguyên văn: «Không tải được dữ liệu», «One Invest không mở được», «Thử lại», «Về trang chủ», «Chưa có thị trường nào có số», «Cách thu thập số liệu», «Xem thị trường», «Ước tính lợi suất».
- Smoke chỉ GET, không ghi DB; cổng mặc định của dãy U1 là 3460 (`BASE_URL`), cổng tạm của bản build là 3462.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture (MEASURE-BIRTH-CLAUSE): vật lành → xanh, bản phá → đỏ với thông điệp ghim.
- Đường dẫn trong test/script suy từ vị trí tệp (`import.meta.url`), không hardcode gốc kho.

## Review Focus

- Link cũ có hash `/phuong-phap#revpar` — trình duyệt giữ hash qua 301; smoke chỉ đo được phần server (Location không mang hash), ghi rõ trong output.
- Số ô lẻ trong lưới (Chỉ số có 7) — ô cuối đứng một mình; test E7 dùng 3 ô để phủ ca lẻ.
- `error` không phải `Error` (client ném chuỗi) — `PageError`/`AppCrash` đọc `error?.digest`; test AC-8 thêm ca `error` không có digest.
- Bản build cũ trong `.next` — smoke DB chết luôn chạy sau `next build` của chính lệnh executor.
- Dev server ghi lại `app/next-env.d.ts` — trả tệp về trước mỗi commit/ghim.

---

### Task 1: Test jsdom TCM-AC-2..9

**Files:**
- Create: `app/tests/trang-chu-methodology.test.tsx`
- Modify: `app/src/components/states/app-crash.tsx` (chỉ khi ca AC-8 lộ lỗi)

**Interfaces:**
- Consumes: `MethodologyPage` (default export `src/app/(marketing)/methodology/page.tsx`), `DefinitionGrid`, `FaqSection`, `FrameBackdrop`, `MarketCards`, default export `(marketing)/error.tsx`, default export `app/global-error.tsx`, `AppCrash`.
- Produces: các ca mang tên đúng như cột `expected` của E3, E5, E7, E8, E9, E10, E11, E13.

- [ ] **Step 1:** Viết ca theo đúng tên và khẳng định trong evals: `TCM-AC-2 không còn /phuong-phap` (hàm `findOldSlug(dir)` quét .ts/.tsx/.mjs/.sh; đối chứng thư mục tạm có 1 chỗ), `TCM-AC-3 định nghĩa mở sẵn` (đếm h1=1, section id, 15 ô có id, câu hỏi + đoạn đầu câu trả lời rút từ mảng của trang — export `METRICS`, `YIELD`, `SOURCES` từ page; 0 `aria-expanded`; đối chứng FaqSection có `aria-expanded`), `TCM-AC-4 lưới faq-3`, `TCM-AC-4 hàng hai nút`, `TCM-AC-5 nền hero` (quét màu cứng + mọi `var(--color-*)` có trong `node_modules/tailwindcss/theme.css`; hai chiều đỏ), `TCM-AC-6 dải doanh thu`, `TCM-AC-6 trống`, `TCM-AC-7 lỗi trang marketing` (retry 1, reset 0; chiều đỏ bản sao tạm nối reset), `TCM-AC-8 lỗi toàn cục`, `TCM-AC-9 baseline`.
- [ ] **Step 2:** `cd app && node --import tsx --test tests/trang-chu-methodology.test.tsx` — mọi ca xanh; nếu ca nào đỏ vì vật, sửa vật (không sửa kỳ vọng).
- [ ] **Step 3:** Phá thử từng thước một lần (đổi tạm vật, thấy đúng thông điệp ghim), trả vật về.
- [ ] **Step 4:** Commit `test(trang-chu-methodology): ca TCM-AC-2..9`.

### Task 2: Smoke HTTP trên dev :3460

**Files:**
- Create: `scripts/smoke-trang-chu-methodology.mjs`

**Interfaces:**
- Produces: dòng `ok …` đúng như E1, E4, E6; thoát 1 kèm dòng `FAIL …` khi lệch.

- [ ] **Step 1:** Viết script: `get(path, { redirect: "manual" })` với `BASE_URL ?? "http://localhost:3460"`; đo 301 + Location (giải mã) cho `/phuong-phap`, `/phuong-phap?x=1`; `/methodology` 200 không 3xx; HTML `/methodology`: 1 h1, id chi-so/loi-suat/nguon, 15 ô có id, 0 aria-expanded, có «Doanh thu ÷ tổng đêm khả dụng»; HTML `/` và `/login`: có `href="/methodology"`, 0 `/phuong-phap` (đếm `/` ≥ 4 chỗ).
- [ ] **Step 2:** `BASE_URL=http://localhost:3460 node scripts/smoke-trang-chu-methodology.mjs` → exit 0.
- [ ] **Step 3:** Phá thử: tạm xoá dòng redirect trong `next.config.ts` → script đỏ «/phuong-phap → 404» (hoặc mã thật); trả lại.
- [ ] **Step 4:** Commit `test(trang-chu-methodology): smoke HTTP`.

### Task 3: Smoke bản build với DB chết

**Files:**
- Create: `scripts/smoke-trang-chu-loi-db.mjs`

**Interfaces:**
- Consumes: `app/.next` do `next build` của executor `trang_chu_loi_db_smoke` vừa dựng.
- Produces: dòng `ok …` như E19.

- [ ] **Step 1:** Viết script: spawn `npx next start -p 3462` trong `app/` với env `DATABASE_URL=postgres://x:x@127.0.0.1:1/x`, chờ cổng mở (≤ 60 s), GET `/` và `/methodology` → HTML bắt đầu `<html lang="vi"`, có «One Invest không mở được», «Thử lại», `href="/"` «Về trang chủ», không «Internal Server Error»; đối chứng dương: GET dev `${BASE_URL}/` (DB sống) KHÔNG có «One Invest không mở được»; tắt tiến trình ở `finally` (kill cả nhóm).
- [ ] **Step 2:** `cd app && npx next build && cd .. && node scripts/smoke-trang-chu-loi-db.mjs` → exit 0.
- [ ] **Step 3:** Phá thử: chạy script với `DATABASE_URL` sống (biến môi trường ghi đè cho phép) → đỏ «không thấy trang lỗi toàn cục».
- [ ] **Step 4:** Commit `test(trang-chu-methodology): smoke bản build DB chết`.

### Task 4: Tài liệu as-built

**Files:**
- Modify: `docs/architecture/invest-portal-ia.md` (dòng `/phuong-phap` → `/methodology`), `docs/ROADMAP.md` (§2 as-built + §4 dòng I6: trang chủ/Phương pháp xong, auth giữ).

- [ ] **Step 1:** Sửa các dòng; `routes.md`/`catalog.md`/`app/CLAUDE.md` đã sửa ở S1.
- [ ] **Step 2:** `cd app && npm run test:lint-rules` xanh (routes map + slug).
- [ ] **Step 3:** Commit `docs(trang-chu-methodology): IA + ROADMAP`.
