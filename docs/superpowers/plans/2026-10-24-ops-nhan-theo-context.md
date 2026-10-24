# Nhãn cổng Ops theo CONTEXT.md (ON12) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên chính). Steps dùng `- [ ]`.

**Goal:** 7 trang Ops chỉ còn chữ tiếng Việt theo CONTEXT.md — 0 từ _Avoid_, 0 tiếng Anh ngoài danh sách giữ, 0 mã thô, tên
thị trường có dấu, sr-only tiếng Việt.

**Architecture:** Một bộ thước chung (`scripts/lib/ops-nhan.mjs`, thuần JS, không phụ thuộc) dùng cho cả thước tĩnh (cây cú
pháp TypeScript ở `app/tests/ops-nhan/`) và smoke trang chạy thật (`scripts/smoke-ops-nhan.mjs`). Chữ từ dữ liệu đi qua ba
lib nhãn thuần (`dq-labels.ts`, `market-names.ts`, `ops-labels.ts`) + một hàm nạp tên khu vực (`getAreaNames`). Component
chỉ đổi chữ và gọi lib.

**Tech Stack:** Next.js 16, TypeScript strict, ReUI data-grid, `node --test` + tsx, `pg` (DB local :5433), `typescript` API.

**Spec:** `docs/superpowers/specs/2026-10-24-ops-nhan-theo-context-design.md` · hợp đồng `_acceptance/ops-nhan-theo-context/contract.md`.

## Global Constraints

- Không sửa `src/components/{ui,reui,blocks,examples}/**` (vendor).
- Chữ UI tiếng Việt, nhãn từ CONTEXT.md; khái niệm mới → khối thuật ngữ mới cùng commit (nhãn · Code · định nghĩa · `_Avoid_`).
- Không đổi truy vấn chọn dòng/nhãn trạng thái bảng kiểm (ON9), số vùng Hiệu chuẩn (ON10), bố cục.
- Phép đo DB chỉ đọc; smoke tạo/xoá phiên admin tạm trong cùng lượt; không ghi bảng thật khác.
- Mọi phép đo mới có cặp hai chiều trên cùng fixture với thông điệp ghim (MEASURE-BIRTH-CLAUSE).
- Tên ca mở đầu `ON12-AC-n`.

## Review Focus

1. Âm tiết tiếng Việt không dấu trùng chữ tiếng Anh («map», «can») — hạn chế đã khai; ma trận AC-2 ghim các ca biên.
2. Khuôn chi tiết DQ cũ còn trong 7 ngày (`snapshot mới X vs trước Y (±d)`, `S02_active=`) — ma trận AC-4 có cả hai.
3. Mã thị trường lạ / `airdna_id` lạ / enum lạ → dự phòng có tên, AC-8 đếm 0 dấu dự phòng trên trang thật.
4. Chữ trong `<code>` vẫn qua luật _Avoid_ và tên kiểm — chiều đỏ AC-1, AC-8.
5. Ô data-grid cắt chữ ở phần tử bọc bên trong — AC-10 đo cả cây con.

---

### Task 1: Bộ thước chữ hiển thị (independent: false) — phục vụ E1, E2, E8

**Files:** Create `scripts/lib/ops-nhan.mjs`, `app/tests/ops-nhan/visible-strings.ts`, `app/tests/ops-nhan-theo-context.test.tsx`.

**Interfaces — Produces** (`scripts/lib/ops-nhan.mjs`):
- `avoidTerms(contextMd: string): { term: string, label: string }[]` — mọi cụm sau `_Avoid_:` tách dấu phẩy, bỏ cụm có
  backtick/mô tả dài (vd «tên nguồn thật ở mọi trang…»), trừ `_Allow_`.
- `findAvoid(text, terms, allow): string[]` — khớp không phân biệt hoa thường theo ranh giới chữ Unicode, bỏ vùng khớp
  cụm `_Allow_`.
- `boldAsciiWords(contextMd): Set<string>`; `KEEP_EN: Set<string>` (danh sách §2.2c); `englishTokens(text, keep): string[]`
  — token `\p{L}+` ≥ 2 chữ cái, chỉ ASCII, không khớp `VN_SYLLABLE`, không khớp mã `S0\d|P[0-2]|L\d+b?`, không trong keep.
- `rawCodeHits(text): string[]` — tên kiểm của bên ghi (`DQ_CHECK_NAMES`), `\w+=\S`, `vn(-[a-z0-9]+)+`, `\bvn\b` thường, snake_case.
- `FALLBACK_MARKS` và `htmlVisibleText(html): { text, code: string[] }`.

`app/tests/ops-nhan/visible-strings.ts`: `SCAN_FILES` (danh sách đóng viết tay, §3.1), `PARTIAL: Record<file, fnNames[]>`,
`visibleStrings(file, src): { line, text, inCode }[]` theo luật §3.1.

- [ ] Viết ca `ON12-AC-2 ma trận phân loại token viết trước` + `ON12-AC-1/2` quét cây (đỏ trên cây hiện tại — in danh sách vi phạm).
- [ ] Viết ca đỏ trên bản sao (tiêu đề review, mục thanh bên, `Heartbeat` trong code; `Uptime 24h` + `title="Toggle"`) và ca
  danh sách tệp thiếu → đỏ nêu tệp.
- [ ] Cài bộ thước; chạy: ma trận + ca đỏ xanh, ca quét cây đỏ (danh sách là việc của Task 3).

### Task 2: Lib nhãn từ dữ liệu (independent: false) — phục vụ E4, E6, E7

**Files:** Create `app/src/lib/dq-labels.ts`, `app/src/lib/market-names.ts`, `app/src/lib/ops-labels.ts`; Modify
`app/src/lib/ops-queries.ts` (thêm `getAreaNames(): Promise<Map<string,string>>` — `SELECT id, name FROM areas WHERE
region_type IN ('country','market')`, bỏ tiền tố qua `shortAreaName`).

**Interfaces — Produces:**
- `dqCheckName(check): { label: string, known: boolean }`, `dqEntityLabel(entity, areaNames): string`,
  `dqDetail(check, detail): { text: string, known: boolean }`.
- `S02_MARKET_VI: Record<airdnaId, string>` (43 mã), `s02MarketName(id, vendor): { name, known }`,
  `shortAreaName(name)`, `marketNameOf(code, areaNames): { name, known }`.
- `sourceStatusLabel`, `propertyTypeLabel`, `offerKindLabel`, `confidenceLabel`, `aiSuggestionLabel`, `calibrationMetricLabel`
  → `{ label, known }`.
- [ ] Ma trận viết trước AC-4 (mỗi khuôn một assert), AC-6 (Quang Tr, Binh Thu, Phan RangaThap Cham, Hanoi, Ho Chi Minh
  City, mã lạ), AC-7 (mỗi giá trị) + ca «khuôn ma trận còn trong tệp bên ghi» và bản sao 450 đổi `'vi phạm: '` → đỏ.
- [ ] Cài; chạy ma trận xanh.

### Task 3: Đổi chữ 7 trang + CONTEXT.md (independent: false) — phục vụ E1, E2, E3, E5, E6, E7, E9, E10

**Files:** Modify các tệp trong `SCAN_FILES` có vi phạm (bảng §4 design doc), `CONTEXT.md` (8 khối mới + `_Avoid_`),
`app/src/components/shell/ops-shell/ops-header.tsx` (Button + `useSidebar`), `app/src/components/page/page-header.tsx`
(`aria-label="Đường dẫn trang"`), `app/src/lib/ops-queries.ts` (`getLockdownStatus` câu Việt + `key`), `lockdown-grid.tsx`
(hiện `key` trong `<code>`), `quality/page.tsx`, `dq-checks-table.tsx` (cột Kiểm/Đối tượng/Chi tiết), `quality-tables.tsx`,
`pipe-panels.tsx`, `objectives-grid.tsx`, `overview-tiles.tsx`, `status.ts`, `registry-table.tsx`, `review-card.tsx`,
`review-content.tsx`, `nav.tsx`, `queries.ts` (`getAirdnaComparison` tên chỉ số).
- [ ] Viết ca render AC-3 (+ đối chứng `SidebarTrigger`), AC-5/AC-6/AC-7 trên DB local qua hàm nạp thật, AC-10 cây con ô
  (+ đối chứng cột khác vẫn `truncate`).
- [ ] Đổi chữ theo bảng §4 tới khi ca AC-1/AC-2 quét cây xanh; thêm khối CONTEXT.md.
- [ ] Cột tên thị trường / chi tiết kiểm: ô không `truncate` — `enableResizing: false` + `meta.cellClassName:
  "whitespace-normal"` hoặc cách data-grid cho phép, xác định khi chạy ca AC-10.
- [ ] `cd app && npx tsc --noEmit && npm run lint && npm test` xanh.

### Task 4: Smoke trang chạy thật (independent: false) — phục vụ E8

**Files:** Create `scripts/smoke-ops-nhan.mjs`.
- [ ] Chiều đỏ trên HTML viết trước (9 mục) chạy trước, in `ok   chiều đỏ HTML viết trước: báo đủ 9 mục`.
- [ ] Bật `next dev` từ `app/` trên cổng trống khi thiếu `BASE_URL` (chờ dòng sẵn sàng, tắt khi xong); tạo user admin +
  session tạm (`*.verify.test`), GET 7 trang, áp luật (a)–(f), in mỗi trang một dòng + danh sách `<code>`; `finally` xoá
  phiên/user tạm, in `dọn: 0 phiên tạm còn lại`.
- [ ] `node scripts/smoke-ops-nhan.mjs` exit 0; phá thử một nhãn → exit 1 nêu trang + mục.
