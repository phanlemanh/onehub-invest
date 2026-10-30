# Danh bạ người trên Ops — kế hoạch thi công

> For agentic workers: thực thi tuần tự trong phiên (T2, các task chạm chung `people.ts`).

**Goal:** hai trang Ops chỉ-đọc ở máy thu — `/ops/people` (danh sách phân trang) và `/ops/people/[partyKey]` (một người).

**Architecture:** truy vấn thuần ở `app/src/lib/ops/people.ts` (mỗi hàm nhận `q: Q = pool`); trang server theo khuôn
`/ops/labels` (page → RegionError → Suspense → Content async → View); bảng là `data-grid` một trang 100 người.

**Spec:** `docs/superpowers/specs/2026-10-30-danh-ba-nguoi-tren-ops-design.md` · hợp đồng `_acceptance/danh-ba-nguoi-tren-ops/contract.md`.

## Global Constraints

- N = 5 tin sống → nhãn «Có thể là môi giới» + «suy luận» (Hỏi-1). Trang 100 người, `?page=` (Hỏi-2).
- Chỉ `SELECT`; `people.ts` không nhắc `source_registry`, `real_name`, `users`, `sessions`, `user_events`, `user_profile`.
- Bí danh: viewer → ẩn; `sdt_bam` → 8 ký tự + «…»; còn lại → `maskSourceNames(value, entries) ?? "—"`.
- Luật ReUI của kho; chữ UI tiếng Việt theo CONTEXT.md.

## Review Focus

1. `?page=` lạ (0, âm, chữ, quá số trang) → trang 1 (E3).
2. `source` không phải `S0[1-9]` → bỏ lọc (E3).
3. Danh sách tên nguồn rỗng → bí danh về «—», không hiện nguyên văn (E7).
4. Khoá người sai khuôn / không tồn tại → 404 (E4).
5. Người không bí danh / không tin → câu trống trong trang người (E8).

### Task 1: Truy vấn danh bạ — phục vụ E2, E3, E4, E5, E7 · independent: false

**Files:** Create `app/src/lib/ops/people.ts`; Test `app/tests/danh-ba-nguoi-tren-ops.test.tsx`.

**Produces:** `NGUONG_MOI_GIOI = 5`, `PAGE_SIZE = 100`, `parseSource(v?: string): string | null`,
`parsePage(v?: string): number`, `laMoiGioi(soTin: number): boolean`,
`danhBaTongQuan(q?): Promise<{ nguoi: number; vaiSong: number; theoNguon: { source: string; nguoi: number }[] }>`,
`danhSachNguoi(f: { source: string | null; q: string; page: number }, q?): Promise<{ rows: NguoiHang[]; total: number; page: number; pages: number }>`,
`motNguoi(key: string, q?): Promise<MotNguoi | null>`,
`hienBiDanh(kind: string, value: string, entries: SourceNameEntry[], xem: boolean): string | null`.

Verify: `cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx` (ca DBN-AC-2, -3, -4, -5, -7 kèm bản đột biến).

### Task 2: Hai trang + thành phần — phục vụ E1, E4, E5, E6, E7, E8, E13, E14 · independent: false

**Files:** Create `app/src/app/ops/people/page.tsx`, `app/src/app/ops/people/[partyKey]/page.tsx`,
`app/src/components/ops/people/{people-content,people-view,people-table,people-filter,people-skeleton,person-content,person-view}.tsx`.

Verify: test như Task 1 (ca DBN-AC-1, -6, -8) + `npx tsc --noEmit` + `npm run lint`.

### Task 3: Đường vào và từ điển — phục vụ E9, E10, E11 · independent: false

**Files:** Modify `CONTEXT.md` (dòng `Slug URL: people` dưới «Danh bạ người»), `.claude/skills/onehub-ui/routes.md`,
`app/src/components/shell/nav.tsx`, `docs/architecture/portals.md`.

Verify: `cd app && npm run test:lint-rules` + ca DBN-AC-9.

### Task 4: Đối chiếu trên DB máy thu — phục vụ E15 · independent: false

**Files:** Create `app/tests/danh-ba-nguoi-doi-chieu.test.tsx` (chỉ SELECT, phiên READ ONLY, chỉ in số).

Verify: `cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx`.
