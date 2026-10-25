# Hiệu chuẩn một bộ số (ON10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vùng «Hiệu chuẩn» của `/ops/quality` cho mỗi thị trường một bộ số nhất quán (một «listing tự thu», market S02
đại diện cố định, cờ mẫu mỏng, gộp thị trường chưa có số), và bước chụp của kho chụp được `/ops` đã đăng nhập.

**Architecture:** Logic thuần + câu SQL dùng chung nằm ở `app/src/lib/calibration.ts`; ba hàm truy vấn trong
`app/src/lib/queries.ts` nhận `db` tuỳ chọn (mặc định `pool`) để test chạy đúng hàm trên fixture trong giao dịch. Trang chỉ
đọc kết quả `splitCalibrated`. Bước chụp: `scripts/ui-capture.sh` uỷ cho `scripts/ui-capture-login.mjs` (đăng nhập HTTP → storage
state → `playwright-cli state-load` → che tầng A → chụp), runner `playwright-cli` tiêm được để test kín.

**Tech Stack:** Next.js 16 / React (ReUI InsightGrid, Badge), node:test + tsx + jsdom, pg, playwright-cli.

**Spec:** `docs/superpowers/specs/2026-10-25-hieu-chuan-mot-bo-so-design.md` · hợp đồng `_acceptance/hieu-chuan-mot-bo-so/contract.md` (AC-1…AC-10) · `evals.yaml` (E1…E10).

## Global Constraints

- Chữ nguyên văn (Cổng Phạm vi 25/10): `Listing tự thu: số listing đang theo dõi trong cả khu vực (gồm phường con)` · `<n> thị trường hiệu chuẩn` · `đại diện cho <k> thị trường S02` · Badge `warning-light` `mẫu mỏng` · `Chưa có số: A, B, …`.
- Ngưỡng mẫu mỏng: cỡ mẫu metrics (`max(listing_count)` của `market_metrics` cho khu vực) `< 5`.
- Market đại diện: nhiều `listing_count` S02 (kỳ mới nhất) nhất; hoà → `airdna_id` nhỏ nhất (so số khi cả hai là số).
- «Chưa có số» = mọi số của hai phía null hoặc 0 và điểm S02 null hoặc 0.
- Số S02 chỉ ở `/ops` (luật 5); không tên nguồn thật trong ảnh/stdout (ADR-0007); mật khẩu/cookie không ra stdout/stderr.
- ReUI: dùng InsightGrid/Badge sẵn có, `text-sm`/`text-xs`, không tự vẽ khung.
- Test DB: `BEGIN … ROLLBACK` + `pg_advisory_xact_lock(33033)`.

## Review Focus

- Khu vực có market S02 mà `airdna_market_metrics` chưa có `listing_count` → `pickRepresentative` coi là 0, vẫn chọn được (Task 1 ma trận).
- `airdna_id` không phải số (chuỗi) → so chuỗi, không NaN (Task 1 ma trận thêm dòng «a10» vs «a9»).
- Cloud: `pool` có bộ đổi tên bảng (`airdna_*` → `ref_calib_*`) — hàm truy vấn phải mặc định `db = pool`, không tự mở Client (Task 2 kiểm trang gọi không tham số).
- `getAirdnaMarkets` market không nối khu vực → «Listing tự thu» `null` (hiện «—»), không 0 (Task 2).
- Bước chụp: `UI_CAPTURE_SIZE` sai dạng → thoát 2 với lời rõ, không chụp (Task 5).

---

### Task 1: Logic thuần + câu SQL chung (`calibration.ts`)

independent: false · phục vụ E1 (ma trận), E4 (ma trận), E5, E6 (nhãn)

**Files:**
- Create: `app/src/lib/calibration.ts`
- Test: `app/tests/hieu-chuan.test.tsx`

**Interfaces — Produces:**
- `TU_THU_DINH_NGHIA: string` (chữ nguyên văn ở trên) · `MAU_MONG_DUOI = 5`
- `isThin(sample: number | null): boolean` — `sample !== null && sample < 5`
- `pickRepresentative(ms: { airdnaId: string; listingCount: number | null }[]): { airdnaId: string; ofMarkets: number } | null`
- `isEmptyComparison(c: AirdnaComparison | null): boolean`
- `splitCalibrated<T extends { market: { name: string }; data: AirdnaComparison | null }>(rows: T[]): { calibrated: (T & { data: AirdnaComparison })[]; empty: string[]; label: string }` — `label = \`${fmtInt(calibrated.length)} thị trường hiệu chuẩn\``, `empty` = tên ngắn (`shortAreaName`)
- `ourListingsSql(): string` — câu đếm listing theo `coalesce(sa.parent_id, sa.id)` (đúng câu `ours` hiện ở `getTruthfulCoverage`)
- `loadOurListings(db: Queryable): Promise<Map<string, number>>` · `type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> }`

- [ ] **Step 1: Viết test hỏng** — ca `HC-AC-1 market đại diện` (ma trận: `[{a:'10',10},{b:'3',3}]→'10'`; hoà `5/5` → mã nhỏ hơn; `0` cạnh `7` → `7`; `null` cạnh `2` → `2`; `'a10'/'a9'` hoà → `'a10'`; `[]` → `null`; `ofMarkets` = độ dài), `HC-AC-4 mẫu mỏng` (ma trận `isThin`: 0,1,4 → true; 5,6,null → false), `HC-AC-5 gộp thị trường chưa có số` (5 thị trường của E5 → calibrated 3, empty 2 tên; bộ lọc cũ `data !== null` giữ 5), `HC-AC-6 đếm` (`label === "3 thị trường hiệu chuẩn"`).
- [ ] **Step 2:** `cd app && node --import tsx --test tests/hieu-chuan.test.tsx` → FAIL (module chưa có).
- [ ] **Step 3:** Viết `calibration.ts` theo Interfaces.
- [ ] **Step 4:** chạy lại → PASS.
- [ ] **Step 5:** commit `feat(ops-quality): calibration.ts — market đại diện, mẫu mỏng, gộp chưa có số (ON10)`.

### Task 2: Ba hàm truy vấn đọc một số tự thu + market đại diện

independent: false (dùng Task 1) · phục vụ E1 (fixture), E2

**Files:**
- Modify: `app/src/lib/queries.ts:856-1090` (`getTruthfulCoverage`, `getAirdnaMarkets`, `getAirdnaComparison`)
- Test: `app/tests/hieu-chuan.test.tsx`

**Interfaces:**
- Consumes: `loadOurListings`, `pickRepresentative`, `Queryable` (Task 1).
- Produces: `getTruthfulCoverage(db?: Queryable)`, `getAirdnaMarkets(db?: Queryable)` (`ourListings` = số cây của `ourAreaId`, `null` khi không nối), `getAirdnaComparison(areaId: string, db?: Queryable)` trả thêm `representative: { airdnaId: string; ofMarkets: number }`, `ourListings: number` (số cây), `sampleListings: number | null` (`max(listing_count)` market_metrics); dòng metric `"Listing"` (giữ tên — ON12 ghim) với `ourValue = ourListings`.
- Crosswalk mới: lấy MỌI `source_area_key` của khu vực kèm `listing_count` kỳ mới nhất (`DISTINCT ON (airdna_id) … ORDER BY period DESC`), rồi `pickRepresentative`.

- [ ] **Step 1: Viết test hỏng** — fixture trong giao dịch (khoá 33033): khu vực `vn-zz-test` + phường con `vn-zz-test-p1`, 3 listing ở cha + 4 ở phường; hai market S02 `zz1` (listing_count 0) chèn TRƯỚC `zz2` (listing_count 9); `market_metrics` cho khu vực với `listing_count` 1. Ca `HC-AC-1 fixture`: gọi `getAirdnaComparison('vn-zz-test', c)` hai lần → cả hai `representative.airdnaId === 'zz2'`, `ofMarkets === 2`; chiều đỏ: câu cũ `SELECT source_area_key … LIMIT 1` trả `'zz1'`. Ca `HC-AC-2 một số tự thu`: dòng `vn-zz-test` của `getTruthfulCoverage(c)`, dòng `zz2` của `getAirdnaMarkets(c)` và `getAirdnaComparison` đều cho 7 (vẽ ở Task 3); chiều đỏ: `max(listing_count)` = 1 ≠ 7.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** sửa ba hàm theo Interfaces; `db = pool` mặc định (giữ bộ đổi tên bảng cloud).
- [ ] **Step 4:** chạy → PASS; `cd app && npx tsc --noEmit` sạch.
- [ ] **Step 5:** commit `feat(ops-quality): một số listing tự thu + market S02 đại diện cố định (ON10)`.

### Task 3: Bảng/thẻ + trang + từ điển

independent: false (dùng Task 1–2) · phục vụ E1 (vẽ), E2 (vẽ), E3, E4 (vẽ), E5 (dòng), E6 (trang), E8

**Files:**
- Modify: `app/src/components/ops/quality-tables.tsx`, `app/src/app/ops/quality/page.tsx`, `CONTEXT.md`
- Test: `app/tests/hieu-chuan.test.tsx`

**Interfaces — Produces:**
- `TruthfulCoverageTable`: tiêu đề cột `Listing tự thu`; footnote mở đầu `TU_THU_DINH_NGHIA`.
- `CalibrationTable`: badge slot = `đại diện cho <k> market ${s02}` (chỉ khi `ofMarkets > 1`, Badge outline) + `mẫu mỏng` (Badge `warning-light`, khi `isThin(sampleListings)`) + ngày thu; footnote mở đầu `TU_THU_DINH_NGHIA`, rồi «ADR, công suất tự thu: cả cửa sổ lịch đặt, từ <sample> listing».
- `AirdnaMarketsTable`: footnote = `TU_THU_DINH_NGHIA`.
- `CalibrationEmptyLine({ names }: { names: string[] })` → `<p className="text-sm text-muted-foreground">Chưa có số: A, B</p>`; `names` rỗng → `null`.
- Trang: `const cal = splitCalibrated(comparisons)`; header dùng `cal.label`; vẽ `cal.calibrated`, rồi `<CalibrationEmptyLine names={cal.empty} />`.
- `CONTEXT.md`: ba mục «Listing tự thu», «Mẫu mỏng», «Thị trường hiệu chuẩn» (nhãn · code · slug — · định nghĩa · _Avoid_).

- [ ] **Step 1: Viết test hỏng** — jsdom (khuôn `dq-moi-nhat.test.tsx`): `HC-AC-1` thẻ có chữ `đại diện cho 2 thị trường S02`; `HC-AC-2` vẽ ba bảng từ kết quả Task 2 → ô tự thu của khu vực fixture đều `7`; `HC-AC-3` mỗi bảng chứa `TU_THU_DINH_NGHIA` và hằng bằng chữ nguyên văn; `HC-AC-4` thẻ sample 1 có Badge `mẫu mỏng`, sample 5 không; fixture cây 7 / metrics 1 → có; `HC-AC-5` `CalibrationEmptyLine` một dòng liệt hai tên; `HC-AC-6` quét `page.tsx` (bỏ comment): `splitCalibrated(` xuất hiện một lần, header và danh sách thẻ đọc cùng biến `cal`, không còn `.filter((c) => c.data !== null)`.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** sửa component/trang/CONTEXT.
- [ ] **Step 4:** `cd app && npm test && npx tsc --noEmit && npm run lint` sạch.
- [ ] **Step 5:** commit `feat(ops-quality): vùng Hiệu chuẩn một bộ số + từ điển (ON10)`.

### Task 4: Phép đo dữ liệu thật

independent: false (dùng Task 1–2) · phục vụ E7

**Files:**
- Create: `scripts/hieu-chuan-do.mjs`
- Modify: `_acceptance/config.yaml` (`executors.script.hieu_chuan_do: "cd app && node --import tsx ../scripts/hieu-chuan-do.mjs"`)

Khuôn `scripts/dq-moi-nhat-do.mjs` (Client riêng, `check(ok,msg)`, exit 1 khi có FAIL). In: `ok tự thu bằng nhau ở ba nguồn cho <n> khu vực` (so `ourListings` ba hàm trả, tra theo `areaId`/`ourAreaId`); `ok chọn market đại diện hai lần cùng kết quả (<k> khu vực nhiều market)` (k = 0 → FAIL); đếm có-số bằng SQL độc lập (khu vực có ít nhất một: điểm S02 > 0, `airdna_market_metrics` value > 0 của market đại diện, hoặc `market_metrics` adr/occupancy > 0) so với `splitCalibrated` → `ok số thị trường hiệu chuẩn = <m>`; `mẫu mỏng: <tên (cỡ mẫu)>, …`; đối chứng `max(listing_count)` cũ → `ok đối chứng: cũ lệch ở <j> khu vực` (j = 0 → FAIL). Không in tên nguồn thật.

- [ ] **Step 1:** viết script; chạy → exit 0, các dòng ok.
- [ ] **Step 2:** commit `test(ops-quality): phép đo hiệu chuẩn trên DB local (ON10)`.

### Task 5: Bước chụp `/ops` có phiên

independent: true · phục vụ E9, E10

**Files:**
- Create: `scripts/ui-capture-login.mjs`, `scripts/ui-capture-login.test.mjs`
- Modify: `scripts/ui-capture.sh` (giữ lối gọi `<url> <out.png>`, `exec node scripts/ui-capture-login.mjs "$@"`)

**Interfaces — Produces (`ui-capture-login.mjs`):**
- `export async function loginState({ base, email, password, fetchImpl = fetch }): Promise<StorageState>` — GET `/login`, lấy `$ACTION_ID_…`, POST multipart (`email`, `password`, `next=/ops`), cần 303 + `Set-Cookie oi_session=…; HttpOnly`; không thì ném `Error("không đăng nhập được: <lý do không chứa mật khẩu>")`.
- `export async function capture({ url, out, env, run, readCred, ensureAccount, tierANames }): Promise<number>` — mã thoát; `run(args: string[]) => string` là runner `playwright-cli -s=<phiên> …` (thật: `execFileSync`), các phụ thuộc còn lại tiêm được.
  - URL không có đường `/ops` → `open`, (chế độ), `screenshot`, như cũ.
  - `/ops`: `ensureAccount()` (`node scripts/dev-ops-account.mjs`), `readCred()` (`.claude/ops-test-account.json`), `loginState` → ghi `mkdtemp` (700) / `state.json` (600) → `state-load`, `goto url`, `eval () => location.pathname` (đọc khối sau `### Result`) — bắt đầu `/login` → thoát 4 «phiên hỏng — trang cuối là /login».
  - Che tầng A: `eval` gán `window.__TIER_A_NAMES` + nội dung `scripts/ui-standards/mask-tier-a.js` → `leaked`/`attrLeaked` khác rỗng → thoát 5, không `screenshot`.
  - Chế độ: `UI_CAPTURE_SCHEME=dark` → `set-color-scheme dark`; `UI_CAPTURE_SIZE=WxH` → `resize W H`; sai dạng → thoát 2.
  - `finally`: xoá thư mục tạm, `close`. stdout chỉ in đường ảnh + `tầng A: đã che <n>`.

- [ ] **Step 1: Viết test hỏng** `UC-AC-9` (node:test, máy chủ giả `node:http` khuôn form server action, runner giả ghi lệnh): (a) `/ops/x` → có `state-load`, tệp state quyền 600 khi runner thấy nó, mất sau khi xong; (b) stdout+stderr gộp không chứa mật khẩu/cookie; (c) mật khẩu sai (máy chủ trả 200) → mã ≠ 0, lời chứa `không đăng nhập được`, không `screenshot`; (d) `/vn/hanoi` → máy chủ không nhận `/login`; (e) runner trả `leaked:[0]` → mã 5, không `screenshot`; chiều đỏ: bỏ đăng nhập (runner báo pathname `/login`) → mã 4; (f) `UI_CAPTURE_SIZE=abc` → mã 2.
- [ ] **Step 2:** `node --test scripts/ui-capture-login.test.mjs` → FAIL.
- [ ] **Step 3:** viết `ui-capture-login.mjs`, sửa `ui-capture.sh`.
- [ ] **Step 4:** test PASS; chạy thật trên dev :3456: `bash scripts/ui-capture.sh http://localhost:3456/ops/quality <scratch>/q.png` → ảnh là trang đã đăng nhập (mở ảnh xem).
- [ ] **Step 5:** commit `feat(capture): ui-capture chụp /ops bằng phiên tài khoản ops thử (ON10)`.

### Task 6: Kiểm toàn nhánh

- [ ] `/verify` (app + scripts), `node scripts/product-map.mjs --root . --check` (khi không có ô `_acceptance` chưa track), contract → `status: implemented`, commit.
