# Tạm dừng, bật lại nguồn từ cloud (TV4b) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người vận hành bấm Tạm dừng/Bật lại một nguồn trên lưới «Sức khoẻ nguồn» của `/ops/collections`, ghi lý do, và
theo lệnh tới «Đã áp lúc HH:MM» kèm trước → sau.

**Architecture:** Route tạo lệnh của TV4 nhận thêm `tu_duyet` (đích khác S03 → `approved` ngay, hai dòng audit cùng giao
dịch). Mọi quyết định hiển thị nằm ở hàm thuần `app/src/lib/lenh-hien.ts`; màn chỉ ghép: một vỏ client `NguonVaLenh` giữ
danh sách lệnh, truyền xuống `FeedsGrid` (cột Thao tác) và `LenhGanDay` (vùng lệnh), hộp thoại `LenhNguonDialog` gửi lệnh.

**Tech Stack:** Next.js 16 route handler, `pg`, React 19 client components, ReUI/shadcn đã cài, `node:test` + tsx + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-12-tam-dung-nguon-tu-cloud-design.md` · hợp đồng
`_acceptance/tam-dung-nguon-tu-cloud/contract.md` (đã duyệt 12/11) · `evals.yaml` (E1–E11, mỗi ca mang mã «TD-AC-n»).

## Global Constraints

- Mọi chữ UI tiếng Việt; nguồn chỉ hiện bằng mã `S0x`; không hiện id người dùng (`user:<uuid>`) — người gửi hiện «Bạn»
  khi trùng actor của phiên, ngược lại «Thành viên khác».
- Lý do: cắt khoảng trắng hai đầu, bắt buộc, tối đa 500 ký tự (`LY_DO_TOI_DA = 500`).
- Giờ theo giờ Việt Nam, khuôn `HH:MM` (hàm mới `fmtVnClock` trong `lib/format.ts`, dùng `VN_PARTS` có sẵn).
- Badge `@/components/reui/badge` cỡ mặc định, biến thể: chờ → `warning-light`, đã nhận / chờ người thứ hai →
  `info-light`, đã áp → `success-light`, không áp được → `destructive-light`, hoàn lại / từ chối → `secondary`.
- Luật ReUI: không chỉnh height/radius/padding/shadow của component đã cài; `gap-*`; không `transition-all`; mọi vùng dữ
  liệu có Skeleton, Empty kèm hành động, lỗi kèm «Thử lại».
- `kiemLenh` (`app/src/lib/lenh.ts`) không đổi — phải trùng bản `.mjs` từng ô.
- Test route và đầu-cuối chạy dưới `db/db-thu.sh`, lược đồ tạm, `public` không được chạm (khuôn `app/tests/so-lenh.test.tsx`).
- Nhãn mới phải có trong `CONTEXT.md` cùng commit: «Tạm dừng nguồn», «Bật lại nguồn», «Lệnh gần đây», «Thao tác», và ghi
  chú «Đang chạy» là chữ của dòng trước → sau trong lệnh (contract AC-4 ghim chữ này; danh mục nguồn vẫn «Đang dùng»).

## Review Focus

1. Bật lại (`source.resume`) mà hộp thoại nhét lý do vào `payload` → route trả 400 `khoa-thua:reason` (payload của
   resume phải rỗng). Lý do của mọi lệnh đi bằng khoá gốc `ly_do`, ghi vào cột `note` lúc tạo; pause vẫn gửi
   `payload.reason` như hợp đồng. Test ở Task 2 và Task 5.
2. Gửi lại cùng `idempotency_key` kèm `tu_duyet` → 409, không thêm dòng audit nào (Task 2).
3. `tu_duyet: "true"` (chuỗi) hay `1` → không tự duyệt, lệnh `submitted` (chỉ `=== true`) (Task 2).
4. `lastPullAt` ở tương lai so với `nowMs` (lệch đồng hồ) → không cờ (Task 1).
5. Trang ẩn (`document.visibilityState === "hidden"`) → vùng lệnh không tự tải lại (Task 5).

---

### Task 1: Hàm thuần hiển thị lệnh

**Files:**
- Create: `app/src/lib/lenh-hien.ts`
- Modify: `app/src/lib/format.ts` (thêm `fmtVnClock`)
- Test: `app/tests/lenh-hien.test.ts` (executor `tdn_hien`)

**Interfaces:**
- Produces:
  ```ts
  export const LY_DO_TOI_DA = 500
  export const DANG_CHO: readonly string[] = ["submitted", "approved", "queued"]
  export type ToneLenh = "warning-light" | "info-light" | "success-light" | "destructive-light" | "secondary"
  export type LenhHien = { id: string; type: string; target: string; payload: Record<string, unknown> | null;
    status: string; requested_by: string; approved_by: string | null; note: string | null;
    before: { status?: string } | null; after: { status?: string } | null; result: { ly_do?: string } | null;
    created_at: string; decided_at: string | null; queued_at: string | null; finished_at: string | null }
  export function trangThaiLenh(cmd: LenhHien, lastPullAt: string | null, nowMs: number):
    { nhan: string; tone: ToneLenh; truoc_sau?: string; canh: string | null }
  export function trangThaiHieuLuc(trangThaiBanTin: string, factsPushedAt: string | null, lenhCuaNguon: LenhHien[]): string
  export function nutNguon(vai: Vai, trangThai: string, coLenhDangCho: boolean):
    { nut: "pause" | "resume" | null; ghi_chu?: "Đang có lệnh chờ" }
  export function coTheGui(lyDo: string): boolean
  export function nhanTruocSau(status: string | undefined): string   // active «Đang chạy», paused «Tạm dừng», khác → sourceStatusLabel(...).label
  export function dichLyDoAp(ma: string | undefined): string
  // format.ts
  export function fmtVnClock(v: string | Date | number | null | undefined): string  // "10:05"; null → "—"
  ```
  `Vai` từ `@/lib/auth`.

- [ ] **Step 1: Viết test hỏng** — bốn ca, mỗi ca mở bằng `assert.equal(ma_tran.length, N)` trước khi lặp:
  - `TD-AC-3a` (5 ô): đúng như E3.
  - `TD-AC-4` (8 ô): đúng nhãn và tone như E6; ô failed `result {ly_do:"nguon-khong-active"}` → nhãn
    `"Không áp được: nguồn không ở trạng thái Đang chạy"`; ô applied → `truoc_sau: "Đang chạy → Tạm dừng"`.
  - `TD-AC-5` (6 ô như E7) + ô thứ 7 Review Focus 4: approved, `lastPullAt` 03:10Z, `nowMs` 03:06Z → `canh: null`
    (đổi lời assert đếm thành 7).
  - `TD-AC-6` (30 ô, ba mảng `VAI=["viewer","ops","admin"]`, `TT=["active","paused","draft","retired","completed"]`,
    `CHO=[false,true]`, bảng kỳ vọng 30 dòng viết tay): `pause` ở ops·active·false, admin·active·false; `resume` ở
    admin·paused·false; `{nut:null, ghi_chu:"Đang có lệnh chờ"}` ở mọi ô `CHO=true` có trạng thái active hoặc paused
    (6 ô, mọi vai — khớp số 6 của E8); các ô còn lại `{nut:null}` (không có khoá `ghi_chu`).
  - `TD-AC-6c` (4 ô như E8), `factsPushedAt` "2026-11-12T03:00:00Z".
  - Đối chứng đỏ của mỗi ca theo E3/E6/E7/E8 (`khoang-trang`, `gio-vn`, `chi-approved`, `resume-admin`, `moc-ban-tin`):
    chép `lenh-hien.ts` sang tệp ẩn cùng thư mục với đúng một chỗ thay (khuôn `banSao` của `so-lenh.test.tsx`), import
    động, assert ô nêu lệch, thông điệp chứa mã đối chứng.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd app && node --import tsx --test tests/lenh-hien.test.ts` → FAIL (thiếu module).
- [ ] **Step 3: Viết `lenh-hien.ts` và `fmtVnClock`.** Ghi chú cho người viết:
  - Cờ máy thu: chỉ khi `status === "approved"`; `lastPullAt` null → «Máy thu chưa kéo lệnh lần nào»;
    `nowMs - lastPullAt > 5*60_000` → `Máy thu chưa nhận lệnh từ ${fmtVnClock(lastPullAt)}`; còn lại null.
  - Nhãn queued dùng `queued_at`, applied dùng `finished_at`.
  - `dichLyDoAp`: `nguon-khong-active` → «nguồn không ở trạng thái Đang chạy»; `tien-dieu-kien:nguon-<s>` → «nguồn đang
    <nhanTruocSau(s)>»; `kiem-sau-hong` → «kiểm sau khi áp không đạt»; `thieu-reason` → «thiếu lý do»; mã khác → nguyên mã.
  - `trangThaiHieuLuc`: lấy lệnh `applied` có `finished_at` lớn nhất; nếu `finished_at > factsPushedAt` (hoặc
    `factsPushedAt` null) và có `after.status` → trả nó; ngược lại trả bản tin. Lệnh mới nhất failed không đè applied cũ
    hơn mốc bản tin.
  - `coTheGui`: `const t = lyDo.trim(); return t.length > 0 && t.length <= LY_DO_TOI_DA`.
- [ ] **Step 4: Chạy, thấy xanh** — cùng lệnh → PASS, 5 ca.
- [ ] **Step 5: Commit** — `feat(ops): hàm thuần hiển thị lệnh tạm dừng/bật lại (TV4b)`.

### Task 2: Route tạo lệnh nhận `tu_duyet` và `ly_do`

**Files:**
- Modify: `app/src/app/api/v1/ops/change-requests/route.ts` (POST + chú thích đầu tệp)
- Test: `app/tests/tam-dung-nguon.test.tsx` (executor `tdn_route`)

**Interfaces:**
- Consumes: `kiemQuyen`, `isAdmin`, `trongGiaoDich`, `ghiAuditTrong`, `kiemLenh` (đã có).
- Produces: POST body `{type, target, payload?, idempotency_key?, tu_duyet?: boolean, ly_do?: string}` → 201 trả
  `{id, type, target, payload, status, requested_by, approved_by, decided_at, note, idempotency_key, created_at}`.

- [ ] **Step 1: Viết test hỏng.** Dựng như `so-lenh.test.tsx` (`dungCloud` + `dungBangPhien` + `chay091`, người
  viewer/ops/admin/admin2 bằng `taoNguoi`, lược đồ tên `tdn_${process.pid}`, chụp `public` trước/sau). Ca:
  - `TD-AC-1`: đúng E1, gồm ca cùng giao dịch (bản sao route thay
    `await ghiAuditTrong(c, q.actor, "change_request.decide"` bằng `await (async () => { throw new Error("hong") })(); await ghiAuditTrong(c, q.actor, "change_request.decide"`
    → handler ném/5xx, đếm hai bảng bằng trước) và đối chứng đỏ `tu-duyet` (thay `body.tu_duyet === true` bằng `false`).
  - `TD-AC-2`: đúng E2; đối chứng đỏ `S03` thay ` && body.target !== "S03"` bằng chuỗi rỗng.
  - `TD-AC-3c`: đúng E5.
  - `TD-RF` (Review Focus 1–3): admin `source.resume` S05 `payload:{}`, `ly_do:" đã nạp credit "`, `tu_duyet:true` →
    201, `status 'approved'`, `note 'đã nạp credit'`; cùng lời gọi mà `payload:{reason:"x"}` → 400
    `khoa-thua:reason`; `ly_do` 501 ký tự → 400 `{error:"lenh-sai-khuon", ly_do:"ly-do-qua-dai"}`; gửi lại cùng
    `idempotency_key` kèm `tu_duyet` → 409 và đếm `ops_audit` không đổi; `tu_duyet:"true"` → `submitted`.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx`.
- [ ] **Step 3: Sửa POST.** Đúng các chuỗi mà bản sao của test thay (giữ nguyên văn, mỗi chuỗi xuất hiện đúng một lần):
  ```ts
  const tuDuyet = body.tu_duyet === true && body.target !== "S03"
  ```
  Kiểm `ly_do` (chuỗi, trim, > 500 → 400 `ly-do-qua-dai`; rỗng → null) sau `kiemLenh`. INSERT ghi `status`
  (`tuDuyet ? 'approved' : 'submitted'`), `approved_by` (actor hoặc null), `decided_at` (`now()` hoặc null), `note`.
  Sau dòng audit `change_request.create`, khi `tuDuyet` ghi thêm
  `await ghiAuditTrong(c, q.actor, "change_request.decide", { change_request_id, decision: "approve", target, tu_duyet: true })`
  trong cùng `trongGiaoDich`. Không có `tu_duyet` → mọi chữ của hành vi TV4 giữ nguyên.
- [ ] **Step 4: Chạy, thấy xanh**; chạy lại `so-lenh.test.tsx` (executor `so_lenh_app` trong `_acceptance/config.yaml`) vẫn xanh.
- [ ] **Step 5: Commit** — `feat(ops): route lệnh nhận tu_duyet — người gửi tự duyệt trừ S03 (TV4b)`.

### Task 3: Chuỗi đầu-cuối tới `isRunnable`

**Files:**
- Test: `app/tests/tam-dung-dau-cuoi.test.tsx` (executor `tdn_dau_cuoi`)

**Interfaces:**
- Consumes: route POST (Task 2), `GET …/pull`, `POST /api/v1/ops/ingest`, `GET …/change-requests`;
  `apLenh(client, cmd)` của `pipeline/lib/lenh.mjs`; `docTrangThai(client, "S05")` của `pipeline/lib/vong-doi.mjs`
  (trả `{run, ly_do}`); `trangThaiLenh` (Task 1); `capToken` qua `scripts/cap-token-may.mjs`; fixture
  `dungCloud`, `dungMayThu`, `chay091`, `chay047` như `so-lenh.test.tsx`.

- [ ] **Step 1: Viết ca `TD-AC-7`** đúng E9: tạo (ops, `tu_duyet`) → `keo(Bearer token)` trả đúng 1 lệnh → `apLenh(mc, cmd)`
  → ingest `{pushedAt: new Date().toISOString(), kind: "change_request_results", results: [kq]}` bằng token máy →
  GET danh sách → assert `applied`, before/after, `trangThaiLenh(...).nhan` bắt đầu «Đã áp lúc»,
  `(await docTrangThai(mc,"S05")).run === false`; lặp resume (admin, `payload:{}`, `ly_do`) → `run === true`. Đối chứng
  `cho-duyet`: bản sao route thay `body.tu_duyet === true` bằng `false`, chạy lại nhánh pause → pull trả 0 lệnh và
  `run` vẫn true.
- [ ] **Step 2: Chạy** — `cd app && bash ../db/db-thu.sh oneinvest_suite_tdndc --chay node --import tsx --test tests/tam-dung-dau-cuoi.test.tsx` → PASS (mã sản phẩm đã có ở Task 1–2; đỏ ở đây là lỗi tích hợp phải sửa trong Task 2).
- [ ] **Step 3: Commit** — `test(ops): chuỗi đầu-cuối tạm dừng/bật lại tới isRunnable (TV4b)`.

### Task 4: Hộp thoại gửi lệnh

**Files:**
- Create: `app/src/components/ops/collections/lenh-nguon-dialog.tsx`
- Test: `app/tests/tam-dung-nguon-ui.test.tsx` (executor `tdn_ui`; dựng jsdom như `cong-tac-nhom-go.test.tsx`, không DB)

**Interfaces:**
- Consumes: `coTheGui`, `nhanTruocSau`, `LY_DO_TOI_DA` (Task 1).
- Produces:
  ```ts
  export function LenhNguonDialog(props: { code: string; loai: "pause" | "resume"; open: boolean;
    onOpenChange: (o: boolean) => void; onDaGui: () => void }): JSX.Element
  ```

- [ ] **Step 1: Viết ca `TD-AC-3b`** đúng E4 (tìm nút theo chữ «Gửi lệnh», ô theo nhãn «Lý do»), thêm: ca «Đang gửi…»
  của E10 (fetch treo → nút chữ «Đang gửi…», disabled) và Review Focus 1 (loai resume → body `payload` deepEqual `{}`,
  `ly_do` 'đã nạp credit', `type 'source.resume'`).
- [ ] **Step 2: Chạy, thấy đỏ** — `cd app && node --import tsx --test tests/tam-dung-nguon-ui.test.tsx`.
- [ ] **Step 3: Viết hộp thoại** bằng `ui/dialog`, `ui/label`, `ui/textarea`, `ui/button`, `reui/alert`, `sonner`:
  tiêu đề `Tạm dừng ${code}?` / `Bật lại ${code}?`; dòng `Trạng thái: Đang chạy → Tạm dừng` (resume đảo chiều); giải
  thích pause «Lượt thu kế tiếp của {code} không chạy. Bật lại cần quản trị viên.», resume «Lượt thu kế tiếp của {code}
  chạy lại.»; bộ đếm `n/500` ở chân ô, chữ phụ «Ghi lý do để đội biết vì sao» khi trống. `idempotency_key =
  crypto.randomUUID()` sinh mỗi lần `open` chuyển sang true. Body: pause
  `{type:"source.pause", target, payload:{reason: lyDo.trim()}, ly_do: lyDo.trim(), tu_duyet:true, idempotency_key}`;
  resume `{type:"source.resume", target, payload:{}, ly_do, tu_duyet:true, idempotency_key}`. Cờ `dangGui` chặn lần
  bấm thứ hai. Lỗi: `Alert` destructive — `ly_do === "thieu-reason"` → «Cần ghi lý do trước khi gửi.», 403 → «Vai của
  bạn không gửi được lệnh này.», 409 → «Lệnh này đã được gửi.», khác → «Không gửi được lệnh. Thử lại sau.»; chữ đã gõ
  giữ nguyên. Thành công: `toast.success(\`Đã gửi lệnh ${loai === "pause" ? "tạm dừng" : "bật lại"} ${code}\`)`, đóng,
  gọi `onDaGui`.
- [ ] **Step 4: Chạy, thấy xanh.**
- [ ] **Step 5: Commit** — `feat(ops): hộp thoại gửi lệnh tạm dừng/bật lại (TV4b)`.

### Task 5: Cột Thao tác, vùng Lệnh gần đây, nối vào trang

**Files:**
- Create: `app/src/components/ops/collections/lenh-gan-day.tsx`, `app/src/components/ops/collections/nguon-va-lenh.tsx`
- Modify: `app/src/components/ops/collections/feeds-grid.tsx`, `collections-view.tsx`, `collections-content.tsx`, `CONTEXT.md`
- Test: `app/tests/tam-dung-nguon-ui.test.tsx` (thêm ca)

**Interfaces:**
- Consumes: Task 1 (`trangThaiLenh`, `trangThaiHieuLuc`, `nutNguon`, `DANG_CHO`, `LenhHien`), Task 4 (`LenhNguonDialog`).
- Produces:
  ```ts
  export type ThaoTacNguon = { vai: Vai; lenh: LenhHien[]; factsPushedAt: string | null; onDaGui: () => void }
  export function FeedsGrid(p: { feeds: SourceFeedHealth[]; stale?: boolean; thaoTac?: ThaoTacNguon }): JSX.Element
  export function LenhGanDay(p: { vai: Vai; actor: string; taiLai: number;
    onTai?: (lenh: LenhHien[], lastPullAt: string | null) => void }): JSX.Element
  export function NguonVaLenh(p: { feeds: SourceFeedHealth[]; stale?: boolean; vai: Vai; actor: string;
    factsPushedAt: string | null }): JSX.Element
  ```
  `CollectionsData` thêm `vai?: Vai; actor?: string`; `CollectionsContent` điền từ `vaiHieuLuc(user)` và
  `user ? \`user:${user.id}\` : ""`.

- [ ] **Step 1: Viết ca hỏng** `TD-AC-6b` và `TD-AC-6d` đúng E10 (dựng `FeedsGrid` thật với `thaoTac`, ba nguồn S05
  active/S06 paused/S08 retired; dựng `LenhGanDay` với `globalThis.fetch` giả). Đối chứng `viewer`: bản sao
  `feeds-grid.tsx` thay `BAC_VAI[thaoTac.vai] >= BAC_VAI.ops` bằng `true`. Thêm Review Focus 5: `LenhGanDay` có lệnh
  `approved`, đặt `document.visibilityState` "hidden", tiến đồng hồ giả (`mock.timers` của `node:test`) 30 giây → fetch
  không gọi thêm; "visible" → gọi thêm 1 lần.
- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: Viết mã.**
  - `FeedsGrid`: cột `id:"thao-tac"`, tiêu đề «Thao tác», chỉ thêm khi `thaoTac && BAC_VAI[thaoTac.vai] >= BAC_VAI.ops`
    (đúng chuỗi này — bản sao của test thay nó). Ô: `nutNguon(vai, trangThaiHieuLuc(f.status, factsPushedAt,
    lenhCuaNguon), lenhCuaNguon.some(l => DANG_CHO.includes(l.status)))` → nút `ui/button` `size="sm"`
    `variant="outline"` «Tạm dừng» / «Bật lại» mở `LenhNguonDialog`, hoặc chữ `text-muted-foreground` «Đang có lệnh chờ»,
    hoặc trống. Badge cột «Trạng thái» giữ đọc bản tin (OOS-3).
  - `LenhGanDay`: `InsightGrid` tiêu đề «Lệnh gần đây», 20 lệnh đầu của GET `/api/v1/ops/change-requests`; cột Nguồn
    (mã) · Loại («Tạm dừng»/«Bật lại») · Người gửi («Bạn»/«Thành viên khác») · Lý do (`payload.reason ?? note ?? "—"`) ·
    Tiến trình (Badge `tone` + `nhan`, dòng phụ `truoc_sau`, dòng phụ `canh`) · Duyệt (admin, `status==="submitted"`,
    và `target !== "S03" || requested_by !== actor`: «Duyệt»/«Từ chối» → POST `…/[id]/decide`, rồi tải lại). Trạng thái:
    Skeleton 3 dòng khi đang tải lần đầu; `ui/empty` «Chưa có lệnh nào» + mô tả «Tạm dừng một nguồn ở bảng trên»; lỗi
    `reui/alert` «Không tải được danh sách lệnh» + nút «Thử lại». Tự tải lại mỗi 30 000 ms chỉ khi còn lệnh trong
    `DANG_CHO` và trang không ẩn; tải lại khi `taiLai` đổi.
  - `NguonVaLenh`: giữ `lenh` + `taiLai`; dựng `FeedsGrid` (truyền `thaoTac` với `onDaGui = () => setTaiLai(n+1)`) rồi
    `LenhGanDay` bên dưới, `gap-6` giữa hai vùng.
  - `collections-view.tsx`: thay hai chỗ `<FeedsGrid …/>` bằng `<NguonVaLenh …/>` (nhánh máy thu: `factsPushedAt` của
    props; nhánh cloud: `cloud.measuredAt`). Vắng `vai` → `"viewer"`.
  - `CONTEXT.md`: thêm bốn thuật ngữ ở Global Constraints theo khuôn nhãn · code · slug · định nghĩa · _Avoid_.
- [ ] **Step 4: Chạy, thấy xanh** — cả tệp `tam-dung-nguon-ui.test.tsx`.
- [ ] **Step 5: Kiểm module** — `/verify app` (tsc, lint, build) và `npm test` của app dưới `db-thu.sh` (bộ chung), sửa
  mọi đỏ mới; chạy self-check ReUI trên các tệp đã đổi.
- [ ] **Step 6: Commit** — `feat(ops): nút tạm dừng/bật lại và vùng Lệnh gần đây trên /ops/collections (TV4b)`.
