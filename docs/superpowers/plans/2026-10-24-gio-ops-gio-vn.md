# Giờ Việt Nam trên cổng Ops (ON8 · gio-ops-gio-vn) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mọi mốc giờ trên cổng Ops hiện theo giờ VN kèm «(GMT+7)», ngày gom theo giờ VN ở local lẫn số đẩy lên cloud, nguồn quá hạn hiện «<tuổi> · trễ <mức>».

**Architecture:** Bộ định dạng chung trong `app/src/lib/format.ts` (Intl, `timeZone: "Asia/Ho_Chi_Minh"` tường minh); 11 chỗ hiện mốc gọi nó; `getFlowDays`/`readGateFunnel` gom ngày VN (SQL `AT TIME ZONE`, khoá `vnDayKey`, nhận `opts.now`); pipeline có `lib/vn-day.mjs` + `lib/ops-flow.mjs` (tách từ `push-ops-facts.mjs`); `fmtOverdue` trong `lib/freshness.ts`.

**Tech Stack:** Next.js 16 (React server/client components, TanStack data-grid của ReUI), `node --test` + `tsx` (app), `node --test` (pipeline), PostgreSQL local :5433 (`Etc/UTC`).

**Spec:** `docs/superpowers/specs/2026-10-24-gio-ops-gio-vn-design.md` · hợp đồng `_acceptance/gio-ops-gio-vn/contract.md` (AC-1…AC-9, Hỏi-1/2/3 theo khuyến nghị) · evals `_acceptance/gio-ops-gio-vn/evals.yaml`.

## Global Constraints

- Khuôn: mốc giờ `YYYY-MM-DD HH:MM (GMT+7)`; mốc ngày `YYYY-MM-DD` (ngày VN); không đọc được / chuỗi không ghi múi → `—`. Mức trễ: `trễ N phút|giờ|ngày` (<1h phút, <48h giờ, còn lại ngày; làm tròn xuống, tối thiểu 1); hiển thị `<fmtAge(tuổi)> · trễ <mức>`.
- Chỉ đổi chữ: không đổi bố cục, component ReUI, màu, kích thước (luật ReUI trong AGENTS.md). `npm run lint` sạch.
- Phép đo DB: lược đồ tạm riêng `gio_vn_test_<pid>`, `search_path` CHỈ lược đồ đó, bảng tạo `CREATE TABLE … AS SELECT * FROM public.<bảng> WITH NO DATA`, xoá ở `after()`. Không ghi bảng thật.
- Phép đo funnel: `HOME` giả; không đọc `~/.openclaw`. Không import `push-ops-facts.mjs` (chạy `main()`).
- Tên ca `GV-AC-<n>`. Comment domain tiếng Việt.

## Review Focus

1. Component client (`"use client"`) render ở server và trình duyệt — `Intl` với `timeZone` tường minh cho cùng chuỗi ở cả hai, không lệch hydrate (AC-1 chạy dưới hai múi máy).
2. `checked_at::text` của Postgres có dạng `2026-10-23 12:13:45.123+00` (offset 2 chữ số) — bộ đọc phải chuẩn hoá (AC-1 có ca này).
3. `lockdown` cố ý dùng ngày giờ MÁY cho tên tệp log gateway (ON2) — nằm trong danh sách miễn của thước tĩnh, không đổi.
4. `listings.last_seen` là `date` — không bọc `AT TIME ZONE` (sai kiểu); danh sách miễn ghi rõ.
5. Ngày cũ nhất của luồng: `since` = 00:00 giờ VN của (ngày hôm nay VN − (n−1)) → tin 00:10 VN ngày đó được đếm (AC-4).

---

### Task 1: Bộ định dạng VN + mức trễ (AC-1, AC-7)

`independent: false` (Task 2, 3 dùng). Phục vụ E1, E7.

**Files:** Modify `app/src/lib/format.ts`, `app/src/lib/freshness.ts`; Create `app/tests/gio-ops-gio-vn.test.tsx`.

**Interfaces — Produces:**
- `export const VN_TZ = "Asia/Ho_Chi_Minh"`
- `export function fmtVnDateTime(v: string | Date | number | null | undefined): string`
- `export function fmtVnDate(v: string | Date | number | null | undefined): string`
- `export function vnDayKey(v: Date | number): string` (YYYY-MM-DD)
- `export function vnDayStart(key: string): Date` (00:00 giờ VN = `key`T00:00+07:00)
- Chuẩn hoá chuỗi: `" "`→`"T"`; offset `±HH` cuối → `±HH:00`; chuỗi không có `Z`/offset → không đọc (`—`).
- `export function fmtOverdue(ageHours: number | null, sloHours: number | null): string | null` — `null` khi thiếu số hoặc `ageHours <= sloHours` (cùng vị từ `status` ở `freshness.ts:97`).

- [ ] Step 1: ca `GV-AC-1 …` (11 đầu vào viết trước × 2 hàm, lặp với `process.env.TZ = "UTC"` rồi `"America/New_York"`) và `GV-AC-7 fmtOverdue ma trận viết trước` (11 dòng của AC-7) — đỏ (hàm chưa có).
- [ ] Step 2: cài; chạy `cd app && node --import tsx --test tests/gio-ops-gio-vn.test.tsx` → xanh.
- [ ] Step 3: commit `feat(ops): bộ định dạng giờ VN và mức trễ (ON8)`.

### Task 2: 11 chỗ hiện mốc + mức trễ + nhãn + thước tĩnh (AC-2, AC-3, AC-8, AC-9)

`independent: false`. Phục vụ E2, E3, E8, E9.

**Files:** Modify `app/src/components/ops/quality/dq-checks-table.tsx`, `collections/jobs-grid.tsx`, `collections/feeds-grid.tsx`, `collections/pipe-panels.tsx` (2 chỗ), `collections/lockdown-grid.tsx`, `overview/objectives-grid.tsx`, `overview/overview-tiles.tsx`, `quality-tables.tsx` (2 chỗ), `app/src/app/ops/deals/page.tsx` (`firstSeen` — tách phần hiện thành hàm/thành phần render được trong test nếu trang là async server component), `collections/sync-activity.tsx`; `app/src/app/ops/quality/page.tsx` nếu `checked_at::text` cần giữ offset; test file.

- [ ] Step 1: ca `GV-AC-2 <tên chỗ> render mốc theo giờ VN` ×11 — mỗi ca render thật component (renderToStaticMarkup, props tối thiểu thật của component) với mốc ở khuôn nguồn của chỗ đó (ISO `Z` của Node cho lastLogAt/lastRunAt/updatedAt/lastEventAt/lastSnapshotAt/capturedAt/firstSeen; `::text` Postgres cho checked_at; `date -Iseconds` cho lastWatchdogAt) → có chuỗi VN mong đợi, không có `12:13`/`2026-10-23T`. Ca `GV-AC-8 <chỗ> hiện mức trễ` ×3 (objectives-grid, feeds-grid, overview-tiles) với ba nguồn (8,4d/8d; tuổi = SLO; 7d/8d) — đọc `status` của từng hàng: `stale` ⇔ có «trễ». Ca `GV-AC-9`. Ca `GV-AC-3` + 3 chiều đỏ (quét chuỗi; danh sách miễn viết trước: `ops-queries.ts` lockdown `getFullYear/getMonth/getDate` (tên tệp log theo ngày máy, ON2); `collections-queries.ts` `last_seen::date` (cột kiểu date) — mỗi mục kèm lý do; bỏ comment trước khi quét).
- [ ] Step 2: sửa 11 chỗ + 3 chỗ mức trễ + nhãn; xanh; `npx tsc --noEmit`, `npm run lint`.
- [ ] Step 3: nạp skill `reui` rồi `onehub-ui`, tự soát theo self-check của ReUI cho các tệp đã sửa (chỉ chữ — không có vi phạm mới); commit `fix(ops): mọi mốc trên cổng Ops theo giờ VN, nguồn quá hạn hiện mức trễ (ON8)`.

### Task 3: Gom ngày VN cho luồng 7 ngày và funnel (AC-4, AC-5)

`independent: false` (dùng Task 1). Phục vụ E4, E5.

**Files:** Modify `app/src/lib/collections-queries.ts` (`getFlowDays(n = 7, opts: { now?: number } = {})`, `readGateFunnel(opts: { now?: number } = {})`); test file.

- [ ] Step 1: ca `GV-AC-4` (lược đồ tạm như Global Constraints; 6 cột × 2 mốc + tin 00:10 VN ngày cũ nhất; deepEqual bản đồ viết trước) + chiều đỏ thiếu bảng tạm; ca `GV-AC-5` (HOME giả, dòng log sinh bằng `new Date(t).toISOString() + " post 202 …"` như `collector/openclaw/handler.js:18`, chạy dưới hai múi máy).
- [ ] Step 2: SQL `(<col> AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text` cho 5 cột timestamptz (giữ `last_seen::date::text`), `since = vnDayStart(vnDayKey(now - (n-1)*86400000))`, khoá ngày `vnDayKey(now - i*86400000)`; funnel: `todayKey = vnDayKey(now)`, ngày của dòng = `vnDayKey(Date.parse(iso))`, mốc 7 ngày từ `now`.
- [ ] Step 3: xanh + bộ đủ app; commit `fix(ops): luồng 7 ngày và funnel gom theo ngày VN (ON8)`.

### Task 4: Số đẩy lên cloud theo ngày VN (AC-6)

`independent: true` (chỉ pipeline). Phục vụ E6.

**Files:** Create `pipeline/lib/vn-day.mjs` (`VN_TZ`, `vnDayKey(t)`, `VN_DAY_SQL(col) → \`(${col} AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text\``), `pipeline/lib/ops-flow.mjs` (`parseLog(text, { now })` chuyển nguyên từ `push-ops-facts.mjs` với `todayKey = vnDayKey(now)` và ngày dòng theo VN; `zaloFlow(client, { now })` = hai truy vấn `flow` của `zaloExtras` dùng `VN_DAY_SQL`, cửa sổ từ 00:00 VN ngày cũ nhất); Modify `pipeline/push-ops-facts.mjs` (import và gọi hai hàm, bỏ bản cũ); Create `pipeline/scripts/vn-day.test.mjs`.

- [ ] Step 1: ca `GV-AC-6 hàm dựng zaloFlow/funnel bản pipeline trên lược đồ tạm` (stg_zalo_posts, sale_offers tạo như Task 3; khoá + số đếm viết trước), `GV-AC-6 vnDayKey bản pipeline cùng ma trận khoá ngày` (đối chiếu giá trị viết trước giống AC-1), `GV-AC-6 push-ops-facts dùng hàm lib, không còn ::date/date_trunc/to_char thiếu AT TIME ZONE` (đọc tệp, bỏ comment), chiều đỏ bản sao dùng `captured_at::date::text`.
- [ ] Step 2: cài; `cd pipeline && npm test` xanh; `node --check push-ops-facts.mjs`.
- [ ] Step 3: commit `fix(pipeline): số Zalo đẩy lên cloud gom theo ngày VN (ON8)`.

---

## Phụ lục 24/10 — sau Cổng Bằng chứng lượt 1 (Ngoài-1 → AC-10)

### Task 5: Dòng log mốc hỏng không làm hỏng lượt đếm (AC-10)

`independent: false` (sửa `pipeline/lib/ops-flow.mjs` và hai tệp test của Task 3, 4). Phục vụ E10, E11.

**Files:** Modify `pipeline/lib/ops-flow.mjs` (`parseLog`: sau `const t = new Date(ts).getTime()` thêm `if (!Number.isFinite(t)) continue;` — bỏ qua dòng mốc hỏng trước mọi phép đếm); `pipeline/scripts/vn-day.test.mjs`; `app/tests/gio-ops-gio-vn.test.tsx`. Bản app (`readGateFunnel`) đã chặn bằng `Number.isFinite(Date.parse(iso))` — chỉ thêm ca đo, không đổi mã.

- [ ] Step 1: ca `GV-AC-10 parseLog bản pipeline bỏ qua dòng mốc hỏng` (log = dòng 16:30Z hợp lệ, `2026-10-23T99:99:99.000Z post 202 group=x`, `2026-10-23T`, dòng 17:30Z hợp lệ; `now` như AC-5 → không ném, today 1, last7 2) — đỏ trên mã hiện tại (RangeError); chiều đỏ `GV-AC-10 bản sao ops-flow bỏ chặn mốc → ném, nêu mốc hỏng` (bản sao xoá dòng chặn, `assert.throws(/Invalid time value/)`, thông điệp «mốc hỏng»). Ca `GV-AC-10 readGateFunnel bản app bỏ qua dòng mốc hỏng` (cùng tệp log, tiến trình con như AC-5).
- [ ] Step 2: thêm dòng chặn; `cd pipeline && npm test`, `cd app && node --import tsx --test tests/gio-ops-gio-vn.test.tsx` xanh; `node push-ops-facts.mjs --kho` với HOME tạm vẫn sạch.
- [ ] Step 3: commit `fix(pipeline): parseLog bỏ qua dòng log mốc hỏng (ON8 AC-10)`.
