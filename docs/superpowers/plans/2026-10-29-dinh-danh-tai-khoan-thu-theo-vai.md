# Định danh tài khoản thu theo vai — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người xem và bearer chung nhận bản đã che (mã về null, giữ số dòng) ở API và trang Thu thập; bản tin máy thu thôi gửi mã nhóm lên cloud.

**Architecture:** Một hàm quyền `xemDinhDanhThu` (ops-access.ts) + một hàm che thuần `cheDinhDanhThu` (collections-queries.ts). API tách thân xử lý sang `lib/collections-api.ts` để ca thử tiêm nguồn dữ liệu; trang tách thân sang `CollectionsContent` (cùng khuôn `DataFlowContent`: `getUser` tiêm được). Bản tin: `push-ops-facts.mjs` dựng `zaloAccounts` bằng hàm xuất được, gửi `soNhomBat` thay `enabledGroups`; `factsChan` chặn mã nhóm.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, node:test + tsx + jsdom (app/tests), node:test (pipeline/scripts), PostgreSQL local :5433 (lược đồ tạm).

**Spec:** `docs/superpowers/specs/2026-10-29-dinh-danh-tai-khoan-thu-theo-vai-design.md` · hợp đồng `_acceptance/dinh-danh-tai-khoan-thu-theo-vai/contract.md` · evals `…/evals.yaml`

## Global Constraints

- Ngưỡng thấy: vai có hiệu lực ≥ `ops` theo `BAC_VAI` (email `OPS_EMAILS` tính như ops); bearer (`kiemQuyen` trả `nguoi: null`) → không thấy (Hỏi-2 = A).
- Che: `zaloAccounts[i]` → `{ accountId: null, name: null, profile: null, enabledGroups: [], soNhomBat: <n> }`; `zaloAllowlist[i]` → `{ groupId: null, enabled }`; `zaloGroups[i].ownerAccount` → `null`. Giữ số phần tử; `zaloAllowlist === null` giữ `null`.
- Bản tin: `zaloAccounts[i].enabledGroups = []`, `soNhomBat = n` (Hỏi-1 = A); `factsChan` thêm dòng `FACTS CHẶN [tầng A] zaloAccounts[<i>].enabledGroups mã nhóm`.
- Chữ UI: «mã nhóm chỉ hiện cho vai Vận hành trở lên.» (chú thích danh sách cho phép); ô tài khoản giữ nhóm bị che hiện «—».
- `route.ts` chỉ xuất `GET` và `dynamic` (luật route Next) — thân xử lý ở `lib/collections-api.ts`.
- Ca thử: tên mở đầu `DD-AC-n`; mã cấy dạng `dd-acc-<n>`, `dd-prof-<n>`, `dd-grp-<n>-<k>`; mỗi phép đo mới có chiều đỏ (bản chép tạm, thông điệp ghim) — khuôn `banChepTam` của `tests/viewer-the-duyet.test.tsx`; HOME giả cho cả tiến trình trước mọi import động (zalo-safety: không đọc/ghi `~/.openclaw` thật).
- Không chạm: `db/migrations/**`, `collector/**`, `pipeline/collect-*|import-*|apify-*`, `pipeline/cron/**`, `scripts/zalo-*.sh`, `docs/plan/lo-trinh.json`.

## Review Focus

1. Bearer khớp token NHƯNG cũng kèm cookie phiên ops — `kiemQuyen` trả nhánh bearer trước (`nguoi: null`) → bị che dù người là ops: chấp nhận (bearer thắng, che chặt hơn) — ghim bằng một ô trong DD-AC-3.
2. `zaloAllowlist` null (cấu hình không đọc được) với người bị che → vẫn `null`, trang vẫn «—» chứ không «0 nhóm» — ghim trong DD-AC-2.
3. Bản tin cũ trên cloud (trước khi máy thu chạy bản mới) còn `enabledGroups` có mã, không có `soNhomBat` → API che vẫn ra `soNhomBat = enabledGroups.length`; `/ops/sources` hiện đúng số — ghim trong DD-AC-4 và DD-AC-7.
4. Tài khoản `default` (không có mục `accounts`) → `profile` = mã → che như mọi tài khoản — ghim trong DD-AC-6.
5. Người dùng thường (`user`) gọi API → 403 như hôm nay, không lộ gì — ô `user` của DD-AC-3.

---

### Task 1: Hàm quyền `xemDinhDanhThu`  · phục vụ E1 · independent: true

**Files:** Modify `app/src/lib/ops-access.ts` · Create `app/tests/dinh-danh-thu.test.tsx` (khung chung: HOME giả, `banChepTam`, lược đồ tạm, `describe("DD-AC-1 …")`)

**Interfaces:** Produces `export function xemDinhDanhThu(user: User | null | undefined): boolean`

- [ ] Viết ca `DD-AC-1 bảng bảy kiểu người`: bảng `KIEU` 7 dòng viết tay (user false, viewer false, ops true, admin true, owner true, opsEmail true, bearer `null` false), assert từng dòng; đối chứng `banChepTam("src/lib/ops-access.ts", s => s.replace(<thân xemDinhDanhThu ngưỡng ops>, <ngưỡng viewer>))` → `assert.throws/rejects` với /dòng 'viewer'/.
- [ ] Chạy `cd app && node --import tsx --test tests/dinh-danh-thu.test.tsx` → đỏ (chưa có hàm).
- [ ] Viết hàm: `BAC_VAI[vaiHieuLuc(user ?? null)] >= BAC_VAI.ops` (cùng thân `xemNoiDungTin`, tên riêng vì nghĩa riêng).
- [ ] Chạy lại → xanh. Commit `feat(ops): xemDinhDanhThu — ngưỡng thấy định danh tài khoản thu`.

### Task 2: Hàm che `cheDinhDanhThu`  · phục vụ E2 · independent: true

**Files:** Modify `app/src/lib/collections-queries.ts` (kiểu `LocalFacts.zaloAccounts` thêm `soNhomBat?: number`; `ZaloAllowlistEntry.groupId: string | null`) · Test `app/tests/dinh-danh-thu.test.tsx`

**Interfaces:** Produces
- `export type TaiKhoanThu = { accountId: string | null; name: string | null; profile: string | null; enabledGroups: string[]; soNhomBat?: number }`
- `export function cheDinhDanhThu<T extends { zaloAccounts?: TaiKhoanThu[]; zaloAllowlist?: ZaloAllowlistEntry[] | null; zaloGroups?: ZaloGroupRow[] }>(p: T): T` — thuần, không đổi `p`.

- [ ] Ca `DD-AC-2`: bộ `BO_DU_LIEU` (2 tài khoản `dd-acc-1/2`, hồ sơ `dd-prof-1/2`, nhóm bật 2 và 1; allowlist 3 mã `dd-grp-*`; 2 nhóm `ownerAccount: "dd-acc-1"`); assert đủ vế của E2 + vế Review Focus 2 (`zaloAllowlist: null` → `null`); đối chứng bỏ dòng che `ownerAccount` → đỏ nêu 'ownerAccount'.
- [ ] Chạy → đỏ. Viết hàm; `soNhomBat = a.soNhomBat ?? a.enabledGroups.length`. Sửa chỗ dùng `groupId` (chú thích ở `collections-tables.tsx`) cho kiểu `string | null` (Task 4 vẽ câu). Chạy → xanh; `cd app && npx tsc --noEmit` sạch. Commit.

### Task 3: API che theo người gọi  · phục vụ E3, E4 · independent: false (cần Task 1, 2)

**Files:** Create `app/src/lib/collections-api.ts` · Modify `app/src/app/api/v1/ops/collections/route.ts` · Test `app/tests/dinh-danh-thu.test.tsx`

**Interfaces:**
- Consumes `xemDinhDanhThu`, `cheDinhDanhThu`, `kiemQuyen`.
- Produces `export type ThuThapPayload` (đúng các khoá route trả hôm nay) · `export async function docThuThap(days: number): Promise<ThuThapPayload>` (thân `Promise.all` hiện ở route) · `export async function xuLyThuThap(req: Request, doc: (days: number) => Promise<ThuThapPayload> = docThuThap): Promise<Response>` — `kiemQuyen(req, "ops.read")`, đọc `days` như cũ, che khi `!xemDinhDanhThu(q.nguoi)`.
- `route.ts`: `export async function GET(req: Request) { return xuLyThuThap(req); }`.

- [ ] Ca `DD-AC-3`: lược đồ tạm có `users`, `sessions` (`helpers/phien-thu.ts`: `dungBangPhien`, `taoNguoi`) cho 6 kiểu người; `OPS_API_TOKEN` thử đặt trước import; `MA_TRAN` 7 ô (assert length 7) + ô Review Focus 1 (bearer kèm cookie ops → bị che); doc giả trả `BO_DU_LIEU`; assert đủ vế E3. Hai đối chứng: bỏ nhánh che trong `collections-api.ts` → đỏ nêu ô 'viewer'/'bearer'; che theo `q.actor !== ACTOR_BEARER` thay vì `xemDinhDanhThu(q.nguoi)` → đỏ nêu ô 'bearer'.
- [ ] Ca `DD-AC-4`: `VERCEL=1`, bảng `ops_heartbeat` trong lược đồ tạm với bản tin có `zaloAccounts` mang `dd-acc-*`, `dd-prof-*`, `enabledGroups` `dd-grp-*` (không `soNhomBat` — Review Focus 3); doc giả dùng `getZaloAccountsFromFacts()` thật; assert đủ vế E4; đối chứng bỏ dòng che `profile` → đỏ nêu 'profile'; trả `VERCEL` như cũ ở `finally`.
- [ ] Ca `DD-AC-3b route gọi xuLyThuThap`: đọc `route.ts` → có `xuLyThuThap(req` và không có `cheDinhDanhThu`/`Promise.all` riêng; đối chứng chuỗi route tự dựng payload → đỏ.
- [ ] Chạy → đỏ; viết `collections-api.ts`, rút gọn `route.ts`; chạy → xanh; tsc sạch. Commit.

### Task 4: Trang Thu thập che ở máy chủ  · phục vụ E5 · independent: false (cần Task 1, 2)

**Files:** Create `app/src/components/ops/collections/collections-content.tsx` · Modify `app/src/app/ops/collections/page.tsx`, `app/src/components/ops/collections-tables.tsx` · Test `app/tests/dinh-danh-thu.test.tsx`

**Interfaces:**
- Produces `export async function CollectionsContent({ nowMs, getUser = getSessionUser, docMayThu = docMayThuThat }: { nowMs: number; getUser?: () => Promise<User | null>; docMayThu?: () => Promise<CollectionsData> })` — giữ nguyên hai nhánh cloud/máy thu của page hôm nay; nhánh máy thu che `zaloGroups`, `zaloAllowlist` bằng `cheDinhDanhThu` khi `!xemDinhDanhThu(user)` TRƯỚC khi trao `CollectionsView`.
- `page.tsx` chỉ còn `<CollectionsContent nowMs={requestTime()} />`.
- `ZaloGroupsTable`: danh sách cho phép có phần tử `groupId === null` → chú thích «danh sách cho phép đang bật N nhóm; mã nhóm chỉ hiện cho vai Vận hành trở lên.» thay cho dòng đuôi mã.

- [ ] Ca `DD-AC-5`: viewer/ops ở máy thu với `docMayThu` giả từ `BO_DU_LIEU`; vế cloud với `VERCEL=1` + bản tin giả; jsdom dựng `ZaloGroupsTable` từ props; assert đủ vế E5; đối chứng: bản `collections-content.tsx` chép tạm bỏ dòng che → đỏ nêu 'viewer'.
- [ ] Chạy → đỏ; viết; chạy → xanh; `cd app && npm run lint` sạch. Commit.

### Task 5: Bản tin không mang mã nhóm  · phục vụ E6 · independent: true

**Files:** Modify `pipeline/push-ops-facts.mjs` · Test `pipeline/scripts/soat-tang-a.test.mjs`

**Interfaces:** Produces `export function zaloAccountsTuCauHinh(z: object): Array<{ accountId: string; name: null; profile: string; enabledGroups: []; soNhomBat: number }>` (dùng `readS03Allowlist(z).byAccount`); `main` gọi hàm này; `factsChan` thêm dòng chặn khi `zaloAccounts[i].enabledGroups?.length > 0`.

- [ ] Ca `DD-AC-6`: cấu hình giả 1 tài khoản 2 nhóm bật + tài khoản `default` (Review Focus 4); assert đủ vế E6 (gồm cặp hai chiều của `factsChan`).
- [ ] `cd pipeline && node --test scripts/soat-tang-a.test.mjs` → đỏ; viết; → xanh. Commit.

### Task 6: `/ops/sources` cloud đọc `soNhomBat`  · phục vụ E7 · independent: true

**Files:** Modify `app/src/components/ops/sources/zalo-accounts.tsx` (`CloudAccount` thêm `soNhomBat?: number`; nhãn dùng `a.soNhomBat ?? a.enabledGroups.length`) · Test `app/tests/dinh-danh-thu.test.tsx`

- [ ] Ca `DD-AC-7`: jsdom + fetch giả theo E7; thêm phần tử bản tin cũ (có `enabledGroups` 3 mã, không `soNhomBat`) → «3 nhóm bật» (Review Focus 3); đối chứng đọc `enabledGroups.length` → đỏ nêu '0 nhóm bật'.
- [ ] Chạy → đỏ; sửa; → xanh. Commit.

### Task 7: Bộ test trọn, tài liệu, chốt S3  · phục vụ E8, E10 · independent: false (sau mọi task)

**Files:** Modify `app/CLAUDE.md` (dòng Routes `/ops/collections`), `docs/ROADMAP.md` (§2 as-built + §4 dòng hàng), `_acceptance/dinh-danh-tai-khoan-thu-theo-vai/contract.md` (`status: implemented`)

- [ ] `cd app && npx tsc --noEmit && npm run lint && npm test` → `ℹ fail 0`; `cd pipeline && npm test` → `ℹ fail 0`.
- [ ] Ghi tài liệu một dòng mỗi chỗ; contract `status: implemented`. Commit `docs: định danh tài khoản thu theo vai — ROADMAP, app/CLAUDE.md; contract implemented`.
