# Cột trạng thái trên điện thoại (ON13) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên chính).

**Goal:** Ở 390px, cột trạng thái của 6 bảng Ops đứng ngay sau cột tên và nằm trong khung nhìn khi chưa cuộn ngang.

**Architecture:** Chỉ đổi định nghĩa cột (thứ tự + `size`) của 6 bảng, bỏ `truncate` ô tên Nhóm, rút nhãn «Im N ngày».
Thước tĩnh đọc SSR (`<th data-col-id>`, `<colgroup>`); smoke đo bố cục thật bằng playwright-core + Chromium không giao diện.

**Tech Stack:** Next.js 16, ReUI data-grid, `node --test` + tsx, playwright-core 1.64.1 (collector), pg.

**Spec:** `docs/superpowers/specs/2026-10-25-ops-mobile-cot-trang-thai-design.md` · hợp đồng `_acceptance/ops-mobile-cot-trang-thai/contract.md`.

## Global Constraints

- Không sửa `components/ui|reui|blocks|examples`; không thêm phụ thuộc vào `app/package.json`.
- Ngân sách khung ở 390px: StatusGrid 348px, InsightGrid 316px. Tập cột gốc 4af4dd8 ở design doc §3.
- Smoke chỉ tạo phiên tạm trên DB localhost; trả lại `app/next-env.d.ts`/`app/AGENTS.md` mà `next dev` sinh.
- Tên ca mở đầu `ON13-AC-n`; mỗi thước mới có chiều đỏ cùng fixture, thông điệp ghim.

## Review Focus

1. Nhãn trạng thái dài nhất mỗi bảng tràn ô (vd «Chưa kiểm được», «Chưa khai SLO») — AC-3 đo mọi hàng.
2. Bảng 0 hàng trên DB local — smoke thoát có tên.
3. Trang rộng hơn 390 vì phần tử khác — AC-3 vế trang không cuộn ngang.
4. Desktop mất/trùng cột khi đổi thứ tự — AC-4 so tập gốc.
5. Trình duyệt/playwright-core vắng — smoke thoát có tên.

---

### Task 1: Đổi thứ tự + bề rộng 6 bảng (independent: false) — phục vụ E1, E2

**Files:** Modify `lockdown-grid.tsx`, `feeds-grid.tsx` (giữ), `collections-tables.tsx` (Nhóm: name 160 bỏ `truncate`,
status 150, nhãn «Im N ngày»), `jobs-grid.tsx` (label 200, alive lên cột 2), `quality/dq-checks-table.tsx` (check 190,
status lên cột 2), `quality-tables.tsx` (TruthfulCoverage: name 160, ratio lên cột 2). Create
`app/tests/ops-mobile-cot-trang-thai.test.tsx`.
- [ ] Ca `ON13-AC-1 cột trạng thái ngay sau cột tên — <bảng>` ×6 + chiều đỏ (trạng thái cuối, chen một cột).
- [ ] Ca `ON13-AC-2 tên + trạng thái ≤ ngân sách khung — <bảng>` ×6 + biên (bằng → không báo, +1 → báo) + chiều đỏ 400px.
- [ ] Sửa định nghĩa cột tới khi xanh; `tsc`, `lint`, `npm test` xanh (sửa ca cũ ghim thứ tự cột nếu có).

### Task 2: Smoke trang chạy thật 390/1280 (independent: false) — phục vụ E3, E4

**Files:** Create `scripts/lib/ops-app.mjs` (`batApp(root)`, `phienAdminTam(db)` — từ chối DB không phải localhost),
`scripts/smoke-ops-mobile.mjs` (tìm playwright-core: app → collector của cây → collector của checkout chính; trình duyệt:
mặc định của playwright, vắng thì Chromium headless mới nhất trong `ms-playwright`).
- [ ] Chiều đỏ (a) cột đầu 400px, (b) ô trạng thái 60px, (c) phần tử 500px; 1280: gỡ một th, nhân đôi + gỡ.
- [ ] 390px: 6 bảng — ≥1 hàng, th/td trạng thái ≤ khung ≤ 390, nhãn trọn trong ô, ngay sau tên, scrollLeft 0; tên Nhóm không
  cắt; trang không cuộn ngang; ảnh chụp vào `.acceptance-runs/ops-mobile-cot-trang-thai/`.
- [ ] 1280px: tập cột = tập gốc, trạng thái ngay sau tên. `node scripts/smoke-ops-mobile.mjs` exit 0.
