# viewer-khong-thay-the-duyet — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vai viewer vào được Ops nhưng không nhận nội dung thẻ duyệt hay bài gốc — chỉ số đếm và một câu chú thích; vai Vận hành trở lên như hôm nay.

**Architecture:** Một hàm `xemNoiDungTin(user)` ở `app/src/lib/ops-access.ts` là luật duy nhất. `/ops/review` với vai dưới ops chỉ chạy câu đếm (cùng câu với `readReviewQueue` của bản tin cloud) và dùng lại khối số đếm của nhánh cloud. `/ops/data-flow` tách thân trang thành `DataFlowContent({ window, user })`, xoá `postText`/`postGroup` trước khi trao cho thành phần client và truyền cờ `xemBaiGoc` xuống sheet. Một tệp test mới `app/tests/viewer-the-duyet.test.tsx` (lược đồ tạm) mang ca VT-AC-1…8.

**Tech Stack:** Next.js 16 server components, `pg` pool của app, `node:test` + tsx + jsdom + `react-dom/server`.

**Spec:** `docs/superpowers/specs/2026-10-27-viewer-khong-thay-the-duyet-design.md` · hợp đồng `_acceptance/viewer-khong-thay-the-duyet/contract.md` (9 AC, đã duyệt 27/10) · `evals.yaml` (E1–E10).

## Global Constraints

- Hai câu chú thích nguyên văn: «Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.» và «Bài gốc chỉ hiện cho vai Vận hành trở lên.»
- Ngưỡng = bậc `ops` của `BAC_VAI`; email `OPS_EMAILS` tính như ops qua `vaiHieuLuc` (không đọc `role` thẳng).
- Nhánh cloud (`localOnlyTable(...)` true) chạy TRƯỚC nhánh vai ở cả hai trang; HTML cloud của viewer = của ops.
- Không sửa vendor (`components/ui`, `components/reui`); luật ReUI: không thành phần mới, dùng `Badge`/`Alert` có sẵn.
- `ops-access.ts` không thêm import runtime nào lúc nạp (check-portal-compliance nhập nó bằng node trần).
- Không sửa migration, không đụng làn ZCode, không in mật khẩu tài khoản thử.
- Tệp test mới nằm ở `app/tests/` (glob `tests/*.test.tsx` của `npm test` = `executors.test.app_ui`) và dọn lược đồ tạm ở `after`.
- Chữ mới hiển thị nằm trong `SCAN_FILES` (`tests/ops-nhan/visible-strings.ts`) — thêm `data-flow-content.tsx`.

## Review Focus

1. Vai `viewer` mà email nằm trong `OPS_EMAILS` → tính ops, thấy nội dung (người cấp quyền bằng email không bị hạ). Ca thêm trong VT-AC-1 (Task 1).
2. Hàng duyệt có thẻ đã quyết (`approved`) → viewer chỉ đếm thẻ `pending`, khớp số trên cloud. Thẻ `approved` trong fixture VT-AC-2 (Task 2).
3. Hàng duyệt rỗng → viewer thấy «0 thẻ đang chờ» và câu chú thích, không lỗi. Ca VT-AC-2b (Task 2).
4. `user` null tới `DataFlowContent` (phiên hết giữa chừng) → che như viewer. Ô `null` trong VT-AC-4 (Task 3).
5. Viewer mở bản ghi S06 (vốn không có bài) → vẫn câu chú thích vai, không câu «S06 chưa lưu khoá…». Ca VT-AC-5 (Task 3).

---

### Task 1: luật `xemNoiDungTin` + khung tệp test

Phục vụ: E1 (AC-1). Độc lập: không (Task 2–5 dùng hàm và khung tệp).

**Files:**
- Modify: `app/src/lib/ops-access.ts` (thêm sau `isAdmin`)
- Create: `app/tests/viewer-the-duyet.test.tsx`
- (khoá `viewer_the_duyet` của `_acceptance/config.yaml` đã có, không sửa)

**Interfaces:**
- Produces: `export function xemNoiDungTin(user: User | null | undefined): boolean` — `BAC_VAI[vaiHieuLuc(user)] >= BAC_VAI.ops`, null → false.
- Produces (trong tệp test): `NGUOI: Record<"user"|"viewer"|"ops"|"admin"|"owner"|"opsEmail", User>`; `opsEmail` = role `user`, email `vt-ops@local.test`, và `process.env.OPS_EMAILS = "vt-ops@local.test"` đặt ở đầu tệp TRƯỚC import động.
- Produces: lược đồ tạm `vt_<pid>` dựng ở `before` (khuôn `makeSchema` của `tests/ops-dong-chay.test.tsx`: `CREATE TABLE … (LIKE public.<t> INCLUDING DEFAULTS)`) với bảng `review_queue, stg_zalo_posts, sale_offers, property_offers, stg_chotot_ads, stg_abnb_listings, listings, areas, enrichment_proposals, source_registry`; `DATABASE_URL = schemaUrl(S)` trước import động; `after` DROP SCHEMA + `pool.end()`.

- [ ] **Step 1: Viết ca đỏ `VT-AC-1 luật xem nội dung`**

```ts
const BANG: [keyof typeof NGUOI, boolean][] = [
  ["user", false], ["viewer", false], ["ops", true], ["admin", true], ["owner", true], ["opsEmail", true],
]
for (const [k, mong] of BANG) assert.equal(xemNoiDungTin(NGUOI[k]), mong, `dòng '${k}'`)
assert.equal(xemNoiDungTin(null), false, "khách")
assert.equal(xemNoiDungTin({ ...NGUOI.viewer, email: "vt-ops@local.test" }), true, "viewer có email OPS_EMAILS tính như ops")
// đối chứng: bản ops-access chép tạm vào tests/.vt-cu-<pid>.ts với ngưỡng hạ về viewer
const sai = await banChepTam((s) => s.replace("BAC_VAI.ops", "BAC_VAI.viewer"))
assert.throws(() => { for (const [k, m] of BANG) assert.equal(sai.xemNoiDungTin(NGUOI[k]), m, `dòng '${k}'`) }, /dòng 'viewer'/)
```
`banChepTam(doi)` chép `src/lib/ops-access.ts` thành `tests/.vt-cu-<pid>.ts` (đổi `./auth` → đường tuyệt đối), import, xoá ở `after`. Thêm `**/.vt-cu-*` vào `globalIgnores` của `app/eslint.config.mjs` cạnh `.route-cu-*`.

- [ ] **Step 2: Chạy, thấy đỏ** — `cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx` → FAIL `xemNoiDungTin is not a function`.
- [ ] **Step 3: Viết `xemNoiDungTin` trong `ops-access.ts`** (comment tiếng Việt trỏ AGENTS.md luật 6).
- [ ] **Step 4: Chạy lại** → `✔ VT-AC-1`.
- [ ] **Step 5: Commit** `feat(ops-access): xemNoiDungTin — nội dung tin cho vai ops trở lên`.

### Task 2: `/ops/review` — viewer chỉ thấy số đếm

Phục vụ: E2 (AC-2), nửa review của E3. Độc lập: không (cần Task 1).

**Files:**
- Modify: `app/src/components/ops/review-content.tsx`
- Test: `app/tests/viewer-the-duyet.test.tsx`

**Interfaces:**
- Consumes: `xemNoiDungTin` (Task 1).
- Produces: `async function loadPendingCounts(): Promise<PendingCount>` (kiểu từ `@/lib/ops-cloud`) — SQL nguyên văn của `readReviewQueue` (`scripts/lib/ops-local.mjs:48`): `SELECT item_type AS type, count(*)::int AS n FROM review_queue WHERE status = 'pending' GROUP BY item_type ORDER BY item_type`.
- Produces: `function PendingCounts({ pending, stale }: { pending: PendingCount | null; stale: boolean })` — khối `<p data-pending-total>` + Badge `data-pending-type` hiện có của nhánh cloud, tách ra để hai nhánh dùng chung (nhánh cloud vẫn render y hệt).
- Nhánh mới trong `ReviewContent`, sau nhánh cloud: `!xemNoiDungTin(user)` → `<h1>Hàng duyệt</h1>` + `PendingCounts` + `<Alert>` của `@/components/reui/alert` (variant mặc định, cùng khuôn `LocalOnlyAlert`) mang câu «Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.». Không gọi `loadReviewQueue`, không gọi `loadReviewMedia`.

- [ ] **Step 1: Viết ca đỏ `VT-AC-2 viewer: hàng duyệt chỉ số đếm`.** Fixture: 3 thẻ `pending` (2 `entity_match`, 1 `data_quality`) + 1 thẻ `approved` (`entity_match`); thẻ thứ n mang `vt-mat-<n>-title`, `vt-mat-<n>-evidence` (trong jsonb), `vt-mat-<n>-ai_suggestion`, `vt-mat-<n>-ai_reasoning`.

```ts
const ghi: { sql: string; rows: unknown[] }[] = []
// bọc pool.query: ghi sql + rows trả về; gỡ ở finally
const el = await ReviewContent({ user: NGUOI.viewer })
const html = renderToStaticMarkup(el)
assert.match(html, /data-pending-total="3"/)
assert.match(html, /entity_match: 2/); assert.match(html, /data_quality: 1/)
assert.match(html, /Nội dung thẻ chỉ hiện cho vai Vận hành trở lên\./)
assert.doesNotMatch(html, /vt-mat-/)
assert.doesNotMatch(JSON.stringify(propsCuaCay(el)), /vt-mat-/)   // duyệt đệ quy element.props.children
for (const g of ghi) {
  for (const r of g.rows as Record<string, unknown>[]) for (const k of ["title", "evidence", "ai_suggestion", "ai_reasoning"]) assert.ok(!(k in r), `cột '${k}' trả cho viewer`)
  assert.doesNotMatch(JSON.stringify(g.rows), /vt-mat-/)
}
```
Ca `VT-AC-2b hàng rỗng`: lược đồ `vt_<pid>_rong` chỉ có `review_queue` rỗng → `data-pending-total="0"` + câu chú thích.
Đối chứng: bản `review-content.tsx` chép tạm (`.vt-cu-…`) thay nhánh viewer bằng `loadReviewQueue(user)` → ca báo `cột 'title'`.

- [ ] **Step 2: Chạy → đỏ** (viewer nhận thẻ đầy đủ, `vt-mat-1-title` trong HTML).
- [ ] **Step 3: Viết `loadPendingCounts`, `PendingCounts`, nhánh viewer.**
- [ ] **Step 4: Chạy → `✔ VT-AC-2`, `✔ VT-AC-2b`;** chạy `node --import tsx --test tests/ops-review-sources-cloud.test.tsx tests/review-media.test.tsx` → xanh (nhánh cloud không đổi).
- [ ] **Step 5: Commit** `feat(ops/review): vai dưới Vận hành chỉ thấy số thẻ chờ`.

### Task 3: `/ops/data-flow` — tách thân trang, che bài gốc, cờ `xemBaiGoc`

Phục vụ: E4 (AC-4), E5 (AC-5), nửa data-flow của E3. Độc lập: không (cần Task 1; cùng tệp test).

**Files:**
- Create: `app/src/components/ops/data-flow/data-flow-content.tsx` (server, không `"use client"`)
- Modify: `app/src/app/ops/data-flow/page.tsx` (chỉ còn `parseFlowWindow`, `RegionError > Suspense`, `getSessionUser()` và `<DataFlowContent window={window} user={user} />`; không import `DataFlowView`)
- Modify: `app/src/components/ops/data-flow/data-flow-view.tsx`, `records-grid.tsx`, `record-sheet.tsx` (thêm prop `xemBaiGoc: boolean`, bắt buộc)
- Modify: `app/tests/ops-nhan/visible-strings.ts` (thêm `src/components/ops/data-flow/data-flow-content.tsx` vào `SCAN_FILES`)
- Modify: `app/tests/ops-dong-chay.test.tsx` (các chỗ dựng `RecordsGrid` truyền `xemBaiGoc` — ca cũ giữ ý nghĩa: `xemBaiGoc` true)

**Interfaces:**
- Consumes: `xemNoiDungTin` (Task 1).
- Produces: `export async function DataFlowContent({ window, user }: { window: FlowWindow; user: User | null }): Promise<JSX.Element>` — thứ tự: nhánh `localOnlyTable("stg_zalo_posts")` (LocalOnlyAlert nguyên văn như hôm nay) → `getDataFlow` + `getSourceRoles` → `xem = xemNoiDungTin(user)` → `records` = `xem ? flow.records : flow.records.map((r) => ({ ...r, postText: null, postGroup: null }))` → `media` như hôm nay (isAdmin) → `<DataFlowView flow={{ ...flow, records }} roles nowMs media xemBaiGoc={xem} />`.
- `RecordSheet` khối «Bài gốc»: `!xemBaiGoc` → `<p className="text-muted-foreground text-sm">Bài gốc chỉ hiện cho vai Vận hành trở lên.</p>` (trước mọi nhánh khác, kể cả S06); `xemBaiGoc` → nhánh hiện có không đổi.

- [ ] **Step 1: Viết ca đỏ `VT-AC-4 data-flow: props đã che`.** Fixture thêm vào `vt_<pid>`: ≥ 2 bài `stg_zalo_posts` agent `apify-facebook`, `group_name` `nhóm vt`, `text` `vt-bai-<n>`, và tin S05 trỏ `post_ids` tới chúng (khuôn `POSTS`/`OFFERS` của ops-dong-chay).

```ts
for (const [nhan, u] of [["viewer", NGUOI.viewer], ["null", null]] as const) {
  const el = await DataFlowContent({ window: "all", user: u })
  assert.equal(el.type, DataFlowView, nhan)
  assert.ok(el.props.flow.records.length >= 2)
  for (const r of el.props.flow.records) { assert.equal(r.postText, null, nhan); assert.equal(r.postGroup, null, nhan) }
  assert.doesNotMatch(JSON.stringify(el.props), /vt-bai-/, nhan)
  assert.equal(el.props.xemBaiGoc, false, nhan)
}
const ops = await DataFlowContent({ window: "all", user: NGUOI.ops })
assert.deepEqual(ops.props.flow.records.filter((r) => r.source === "S05").map((r) => r.postText).sort(), ["vt-bai-1", "vt-bai-2"])
const page = readFileSync("src/app/ops/data-flow/page.tsx", "utf8")
assert.doesNotMatch(page, /DataFlowView/); assert.match(page, /<DataFlowContent[^>]*user=/)
```
- [ ] **Step 2: Viết ca đỏ `VT-AC-5 sheet bài gốc`** (jsdom, `render`/`click`/`dialogs` chép khuôn ops-dong-chay): `RecordsGrid` một bản ghi S05 `postText: "vt-bai-x"`, `postGroup: "nhóm vt"`, và một bản ghi S06; `xemBaiGoc={false}` → sheet chứa câu chú thích, không `vt-bai-x`, sheet S06 cũng chứa câu chú thích; `xemBaiGoc` → chứa `vt-bai-x` và `Nhóm nhóm vt`, không chứa câu chú thích.
- [ ] **Step 3: Chạy → đỏ** (`DataFlowContent` chưa export).
- [ ] **Step 4: Tách `data-flow-content.tsx`, nối prop `xemBaiGoc` qua `DataFlowView → RecordsGrid → RecordSheet`, sửa `page.tsx`, sửa chỗ gọi trong `ops-dong-chay.test.tsx`, thêm SCAN_FILES.**
- [ ] **Step 5: Chạy** `node --import tsx --test tests/viewer-the-duyet.test.tsx tests/ops-dong-chay.test.tsx tests/ops-nhan-theo-context.test.tsx` → xanh; `npx tsc --noEmit` sạch.
- [ ] **Step 6: Commit** `feat(ops/data-flow): bài gốc chỉ cho vai Vận hành trở lên`.

### Task 4: ma trận 6 × 2 và nhánh cloud

Phục vụ: E3 (AC-3), E6 (AC-6). Độc lập: không (cần Task 2, 3).

**Files:** Test: `app/tests/viewer-the-duyet.test.tsx`

- [ ] **Step 1: Viết `VT-AC-3 ma trận vai`.** `MA_TRAN` viết tay 12 ô `{ kieu, trang: "review"|"data-flow", thay: boolean }` (thấy ở ops, admin, owner, opsEmail; không ở user, viewer); `assert.equal(MA_TRAN.length, 12)`. Ô review: `/vt-mat-1-title/` có/không trong `renderToStaticMarkup(await ReviewContent({ user }))`. Ô data-flow: `/vt-bai-/` có/không trong `JSON.stringify(el.props)` và `el.props.xemBaiGoc === thay`. Đối chứng: bản `data-flow-content.tsx` chép tạm thay `xemNoiDungTin(user)` bằng `user?.role === "ops"` → ca đỏ nêu ô `admin` (thông điệp `ô '<kieu>/<trang>'`).
- [ ] **Step 2: Viết `VT-AC-6 cloud không đổi`.** Pool của app gắn với `vt_<pid>` lúc import, nên «như máy chủ» dựng TRÊN CÙNG lược đồ: trong ca, `ALTER TABLE "<S>".review_queue RENAME TO vt_rq_tam` và `stg_zalo_posts → vt_zp_tam` (để `to_regclass` trả null), tạo `ops_heartbeat` LIKE public với một bản tin có khối `reviewQueue` `{ byType: [{ type: "entity_match", n: 2 }], total: 2 }` theo khuôn dòng của `tests/o-kpi-chi-do-local.test.tsx`; `finally` đổi tên lại + DROP `ops_heartbeat` (ca chạy tuần tự, không subprocess). Kiểm: HTML ReviewContent viewer === ops, chứa `thẻ đang chờ` và `Hàng duyệt chỉ có ở máy thu`; DataFlowContent viewer và ops đều trả phần tử `LocalOnlyAlert` tiêu đề `Chỉ xem ở máy thu`.
- [ ] **Step 3: Chạy** `node --import tsx --test tests/viewer-the-duyet.test.tsx` → `✔ VT-AC-3`, `✔ VT-AC-6`; tạm đổi luật về `role === "ops"` bằng tay một lần để thấy VT-AC-3 đỏ rồi trả lại.
- [ ] **Step 4: Commit** `test(ops): ma trận vai × trang và nhánh cloud cho nội dung tin`.

### Task 5: bảng kiểm kê route Ops

Phục vụ: E8 (AC-8). Độc lập: không (cùng tệp test; đọc kết quả Task 2–3).

**Files:** Test: `app/tests/viewer-the-duyet.test.tsx`

**Interfaces:**
- `KIEM_KE: Record<string, { doc_noi_dung: boolean; che: "xemNoiDungTin" | "isAdmin" | "khong-doc" }>` — 22 khoá (đường tương đối từ `app/`): 8 `page.tsx` dưới `src/app/ops` + 14 `route.ts` dưới `src/app/api/v1/ops`, `src/app/api/zalo-media`, `src/app/api/v1/deals`, `src/app/api/v1/offers`. Khai: `ops/review/page.tsx` và `ops/data-flow/page.tsx` → `xemNoiDungTin`; `ops/deals/page.tsx`, `api/zalo-media/route.ts` → `isAdmin`; còn lại `khong-doc` (kể cả `review/[id]/decide` — chỉ đọc `id, item_type, item_id, status`, trả `{ ok, status }`). Evals ghi «9 trang»; trên đĩa hôm nay là 8 — phép đo là deepEqual với đĩa, con số ngoặc trong evals sai (ghi một dòng sổ `fix` ở S3).
- Tín hiệu «đọc nội dung tin» trong bao đóng import: `/\b(ai_reasoning|ai_suggestion|post_text|postText)\b/`. Bao đóng: theo `from "@/…"` và `from "./…"`/`"../…"` (tĩnh lẫn `import("…")`), giải về `src/**/*.{ts,tsx}`, bỏ `node_modules`.

- [ ] **Step 1: Viết `VT-AC-8 kiểm kê route`:** (a) tập route glob trên đĩa (gốc suy từ `import.meta.url`) `deepEqual` `Object.keys(KIEM_KE).sort()`; (b) dòng `doc_noi_dung` true → bao đóng chứa tên hàm `che`; dòng false → bao đóng không trúng tín hiệu NGOÀI các tệp đã che bằng `xemNoiDungTin`/`isAdmin` (tệp thư viện dùng chung như `data-flow-queries.ts` được phép khi điểm vào có hàm che) — nếu (b) với dòng false trúng tín hiệu, thông điệp nêu route + tệp trúng; (c) đối chứng: thêm vào tập đọc (không ghi đĩa) `src/app/ops/vt-gia/page.tsx` nội dung `SELECT title FROM review_queue` → ca nêu `src/app/ops/vt-gia/page.tsx`.
- [ ] **Step 2: Chạy** → xanh; ghi số khoá (22) và số tệp trong bao đóng vào output ca (`t.diagnostic`).
- [ ] **Step 3: Commit** `test(ops): kiểm kê route Ops đọc nội dung tin`.

### Task 6: tài khoản thử vai viewer

Phục vụ: E10 (AC-9), điều kiện của E9. **Độc lập: có** (tệp riêng, không cần Task 1–5).

**Files:**
- Modify: `scripts/dev-ops-account.mjs` (CLI), `scripts/dev-ops-account.test.mjs`, `.gitignore` (thêm `.claude/viewer-test-account.json` cạnh dòng 39)

**Interfaces:**
- Produces: `export const VAI_THU = { admin: { email: "ops-test@local.test", file: ".claude/ops-test-account.json" }, viewer: { email: "viewer-test@local.test", file: ".claude/viewer-test-account.json" } }`; `export function docVai(argv: string[]): "admin" | "viewer"` — không cờ → `admin`; `--vai <x>` khác hai giá trị → ném lỗi chứa `admin, viewer` (main bắt → exit 2 trước khi kết nối DB). `DEFAULT_EMAIL`, `CRED_FILE` giữ nguyên tên export (bằng giá trị admin) cho người gọi cũ. `main` truyền `role` và `email` của vai vào `ensureAccount`, ghi `role` đúng vai vào tệp cred, dòng log cuối nói đúng vai.

- [ ] **Step 1: Viết `describe("vai viewer")`** với bốn ca (a)–(d) đúng nguyên văn E10 (ca (a) trong ROLLBACK như ca `ensureAccount` hiện có; ca (c) chạy CLI `--vai la` với `DATABASE_URL` local và kiểm stderr + exit 2 + không có dòng `tài khoản ops thử`).
- [ ] **Step 2: Chạy** `node --test scripts/dev-ops-account.test.mjs` → đỏ.
- [ ] **Step 3: Viết `VAI_THU`, `docVai`, nối vào `main`; thêm dòng `.gitignore`.**
- [ ] **Step 4: Chạy lại → xanh** (mọi ca cũ vẫn ✔).
- [ ] **Step 5: Commit** `feat(scripts): dev-ops-account --vai viewer cho tài khoản thử`.

### Task 7: cả bộ + nhìn bằng mắt

Phục vụ: E7 (AC-7), E9 (AC-9). Độc lập: không (cuối).

- [ ] **Step 1:** `ls app/tests/viewer-the-duyet.test.tsx` — tệp nằm thẳng dưới `tests/` để glob `tests/*.test.tsx` của `npm test` nhặt.
- [ ] **Step 2:** `cd app && npx tsc --noEmit && npm run lint` sạch; chạy lệnh `app_ui` MỘT tiến trình, không gì chạy song song → `ℹ fail 0`, có ✔ cho ops-nhan-theo-context, ops-dong-chay, review-media, o-kpi-chi-do-local, ops-review-sources-cloud.
- [ ] **Step 3:** `node scripts/dev-ops-account.mjs --vai viewer` và `node scripts/dev-ops-account.mjs`; preview `app` :3456 từ worktree; đăng nhập bằng tài khoản viewer (đọc tệp cred, không in), chụp `/ops/review` và sheet một tin S05 ở `/ops/data-flow`; lặp bằng tài khoản admin. Ảnh ra `.acceptance-runs/viewer-khong-thay-the-duyet/` (ra khỏi `_acceptance/`).
- [ ] **Step 4:** Cập nhật ROADMAP §2 as-built + §4 trạng thái một dòng; `app/CLAUDE.md` mục Routes `/ops/review` thêm «nội dung thẻ cho vai ops trở lên». Commit `docs: viewer không thấy thẻ duyệt và bài gốc`.
- [ ] **Step 5:** `contract.md` `status: implemented`, commit.
