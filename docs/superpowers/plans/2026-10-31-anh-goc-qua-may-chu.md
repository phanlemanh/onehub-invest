# Ảnh tin chỉ có URL gốc đi qua máy chủ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vai Vận hành ở máy thu thấy ảnh S06/S05 (chỉ có `media_url`) trên thẻ duyệt qua `/api/zalo-media?media=<media_key>`; trình duyệt không nhận URL hay tên miền nguồn ở mọi vai.

**Architecture:** Bộ lấy ảnh thuần `lay-anh-goc.ts` (chặn SSRF, trần cỡ/giờ/chuyển hướng) được chế độ thứ ba của `serveZaloMedia` gọi sau khi tra dòng `media` theo khoá. Loader thẻ duyệt đổi mọi ảnh chỉ-có-URL-gốc thành `origin: "proxy"` và thôi đưa `evidence.image_url` xuống client. Sổ bề mặt API, bộ kiểm cổng §6 và tài khoản thử vai ops theo sau.

**Tech Stack:** Next.js 16 route handler, `node:https` + `node:dns/promises`, `pg`, `node --test` + tsx.

**Spec:** `docs/superpowers/specs/2026-10-31-anh-goc-qua-may-chu-design.md` · hợp đồng `_acceptance/anh-goc-qua-may-chu/contract.md` (AC-1..9, đã duyệt 31/10, Hỏi-1 = chỉ máy thu).

## Global Constraints

- `?media=` mở cho vai Vận hành trở lên (`xemNoiDungTin`); gate đứng TRƯỚC mọi đọc DB/mạng/đĩa.
- Khoá: `/^[0-9a-f]{32}$/` — sai khuôn → 404, không chạm DB.
- Bộ lấy ảnh: chỉ `https:`; chặn địa chỉ riêng/loopback/link-local IPv4, IPv6 `fc00::/7`, `fe80::/10`, `::1`, và `::ffff:`-ánh-xạ; ≤ 3 chuyển hướng (kiểm lại mỗi bước); 8 giây; 8 MB (khai trước và đếm lúc đọc); `content-type` phải `image/*`.
- Mã lỗi theo bảng chặn của design doc: 403 (giao thức, địa chỉ riêng, chuyển hướng tới địa chỉ chặn) · 502 (quá chuyển hướng, không 2xx, không ảnh, quá cỡ) · 504 (quá giờ). Thân lỗi là chữ chung; không URL/tên máy trong thân, header hay log.
- DB thiếu bảng `media` (42P01, cloud) → 404 ở route, `{}` ở loader.
- Không sửa `db/migrations/**`, `collector/**`, `pipeline/collect-*|import-*|apify-*`; không in tên miền nguồn thật ra test output, commit hay chat.
- Test chạm DB: chỉ đọc (`BEGIN READ ONLY` / ROLLBACK); không docker compose up/down.

## Review Focus

1. **DNS rebinding** — tên máy phân giải ra địa chỉ công khai lúc kiểm rồi ra địa chỉ riêng lúc nối: kết nối phải đi bằng chính địa chỉ đã kiểm (`lookup` của `https.request` là hàm kiểm), không tra lại. Test: `lookup` giả trả công khai lần 1, riêng lần 2 → 403 hoặc chỉ một lần tra.
2. **Chuyển hướng tương đối và `Location` hỏng** — `Location: /x` phải ghép với URL hiện tại rồi kiểm lại; `Location` rỗng/không parse được → 502. Test trong T1.
3. **`content-length` khai thấp hơn thân thật** — đếm byte lúc đọc phải cắt ở 8 MB dù header nói nhỏ. Ca AC-4 «khai sai».
4. **Khoá hoa** — `media_key` viết hoa → 404 (khuôn chỉ thường), không tra DB. Test trong T2.
5. **Tin có cả ảnh local lẫn URL gốc cùng `media_key`** — `local_file` thắng, không gọi mạng (AC-6); loader không lặp ảnh. Test trong T2/T3.

---

### Task 1: Bộ lấy ảnh `lay-anh-goc.ts` (AC-4) — independent

**Files:**
- Create: `app/src/lib/ops/lay-anh-goc.ts`
- Test: `app/tests/anh-goc-qua-may-chu.test.tsx` (khối `AGM-AC-4`)

**Interfaces:**
- Produces:
  - `export type TraDns = (host: string) => Promise<{ address: string; family: 4 | 6 }[]>`
  - `export type TaiVe = (url: URL, diaChi: { address: string; family: 4 | 6 }, signal: AbortSignal) => Promise<{ status: number; headers: Headers; body: AsyncIterable<Uint8Array> }>` — mặc định dùng `https.request` với `lookup` trả đúng `diaChi` đã kiểm (chống rebinding).
  - `export function laDiaChiChan(ip: string): boolean`
  - `export async function layAnhGoc(url: string, deps?: { traDns?: TraDns; taiVe?: TaiVe; thoiHanMs?: number; tranByte?: number; tranChuyenHuong?: number }): Promise<Response>` — mặc định 8000 ms, 8 × 1024 × 1024 byte, 3 chuyển hướng.

- [ ] **Step 1: Viết 15 ca `AGM-AC-4.<n>`** một-một với bảng chặn (http; 10.x, 127.x, 169.254.x, 172.16.x, 192.168.x; `::1`, `fc00::1`, `fe80::1`, `::ffff:127.0.0.1`; chuyển hướng tới riêng; 4 chuyển hướng; 404 nguồn; `text/html`; `content-length` 9 MB; thân 9 MB không khai; quá giờ bằng `thoiHanMs: 50`). Mỗi ca `assert.equal(res.status, <mã>)` và `assert.ok(!(await res.text()).includes(host))`. Thêm ca dương 200 `image/jpeg` + byte đúng, và hai ca Review Focus 1–2.
- [ ] **Step 2:** `cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx` → FAIL (module chưa có).
- [ ] **Step 3: Cài `layAnhGoc`** — vòng ≤ `tranChuyenHuong + 1` bước: kiểm giao thức → `traDns` → mọi địa chỉ qua `laDiaChiChan` (một địa chỉ chặn là chặn) → `taiVe` với `AbortSignal.timeout`; 3xx thì `new URL(location, cur)` rồi lặp; đọc thân bằng đếm byte. `laDiaChiChan` dùng `net.isIP` + so dải bằng số, tách `::ffff:` về IPv4.
- [ ] **Step 4:** chạy lại → PASS khối AC-4.
- [ ] **Step 5: Commit** `feat(ops): bộ lấy ảnh gốc chặn SSRF cho zalo-media (anh-goc-qua-may-chu T1)`.

### Task 2: Chế độ `?media=` của `serveZaloMedia` (AC-1, 2, 3, 6)

**Files:**
- Modify: `app/src/lib/ops/zalo-media.ts` (thêm chế độ trước nhánh `?snapshot=`), `app/src/app/api/zalo-media/route.ts` (chỉ comment đầu tệp)
- Test: `app/tests/anh-goc-qua-may-chu.test.tsx` (khối `AGM-AC-1/2/3/6`)

**Interfaces:**
- Consumes: `layAnhGoc` (T1).
- Produces:
  - `export const MEDIA_KEY = /^[0-9a-f]{32}$/`
  - `export function mediaKeyUrl(key: string): string | null` → `/api/zalo-media?media=<key>`
  - `export type MediaKeyQuery = (key: string) => Promise<{ media_url: string | null; local_file: string | null } | null>`
  - `serveZaloMedia(req: Request, user: User | null, deps?: { traMedia?: MediaKeyQuery; layAnh?: typeof layAnhGoc }): Promise<Response>` — tham số thứ ba chỉ để test; route giữ `serveZaloMedia(req, user)`.

- [ ] **Step 1: Viết ca** — AGM-AC-1 (200, byte + `content-type` đúng, thân/header không chứa host gốc); AGM-AC-2 ma trận 5 vai × 3 khoá = 15 ô, đếm số lần `traMedia`/`layAnh` bị gọi = 0 cho khách/user/viewer; AGM-AC-3 (khoá sai khuôn, khoá hoa, không dòng, `traMedia` ném `{code:"42P01"}` → 404, `layAnh` không gọi); AGM-AC-6 (dòng có `local_file` trong snapshots tạm → 200 qua `sendImage`, `layAnh` không gọi; `local_file` trỏ ra ngoài → 403).
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3: Cài** — sau `xemNoiDungTin`: `q.get("media")` khác null → khuôn sai → 404; `traMedia` mặc định `SELECT media_url, local_file FROM media WHERE media_key = $1` qua `pool`; 42P01 → 404; `local_file` → tách `<snapshotId>/<file>` → `snapshotMediaPath` → `sendImage(..., [snapshotsRoot()], true)`; còn lại `media_url` → `layAnh(media_url)`; 200 thì thêm `cache-control: private, max-age=300`.
- [ ] **Step 4:** chạy → PASS khối AC-1..4, 6.
- [ ] **Step 5: Commit** `feat(ops): zalo-media ?media=<khoá> cho vai Vận hành (anh-goc-qua-may-chu T2)`.

### Task 3: Loader thẻ duyệt qua proxy + đối chiếu DB thật (AC-5, AC-7)

**Files:**
- Modify: `app/src/lib/ops/review-media.ts`, `app/src/components/ops/review-photos.tsx` (nhãn và `referrerPolicy` theo `origin`; câu `chiGoc` → «chỉ có ở nguồn, chưa lấy được»)
- Create: `app/tests/anh-goc-doi-chieu.test.tsx`
- Test: `app/tests/anh-goc-qua-may-chu.test.tsx` (khối `AGM-AC-5`); cập nhật test cũ của `buildMediaImages`/`loadReviewMedia` (the-duyet-du-can-cu, viewer-the-duyet) theo hành vi mới

**Interfaces:**
- Consumes: `mediaKeyUrl` (T2).
- Produces: `ReviewImage.origin: "local" | "proxy"` (bỏ `"remote"` khỏi `buildMediaImages`; `buildOfferImages` giữ nguyên làm thước); `MediaRow` thêm `media_key: string | null`; `buildMediaImages(rows: MediaRow[]): ReviewImage[]` (bỏ tham số ảnh mẫu); `loadReviewMedia` không còn nhánh admin; `chiGoc` chỉ đếm dòng không có khoá hợp lệ.

- [ ] **Step 1: Viết ca** — AGM-AC-5: thẻ entity_match, bên A có 3 dòng chỉ-URL-gốc + `evidence.offer_a.image_url`; chạy cho ops và admin → mỗi bên `origin: "proxy"`, `src` khớp `/^\/api\/zalo-media\?media=[0-9a-f]{32}$/`, `chiGoc` vắng, `JSON.stringify(kết quả)` không chứa hostname nào của `media_url`/`image_url`. AGM-DC (đối chiếu, DB :5433 chỉ đọc): chọn một tin S06 có dòng `media`; dựng `ReviewPhotos` bằng `renderToStaticMarkup` cho vai ops → ≥ 1 ảnh proxy, HTML không chứa hostname nào của các `media_url` tin ấy; đếm `media_key !~ '^[0-9a-f]{32}$'` = 0 và `media_url !~ '^https://'` = 0 cho S03/S05/S06. Không in hostname ra output — chỉ in số.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3: Cài** — `MEDIA_SQL` thêm `media_key`; `buildMediaImages`: dòng có `local_file` → local; dòng còn lại có khoá đúng khuôn → `{ src: mediaKeyUrl(key), origin: "proxy", expiring: false }`; không đẩy URL gốc. `loadReviewMedia`: mọi vai `xemNoiDungTin` cùng kết quả.
- [ ] **Step 4:** chạy hai tệp test + `the-duyet-du-can-cu`, `viewer-the-duyet` → PASS.
- [ ] **Step 5: Commit** `feat(ops): ảnh thẻ duyệt đi qua máy chủ theo media_key (anh-goc-qua-may-chu T3)`.

### Task 4: Sổ bề mặt API + bộ kiểm cổng §6 (AC-8) — independent

**Files:**
- Modify: `app/src/lib/api-surface.ts` (dòng `zalo-media`: thêm «?media=<khoá> cho vai Vận hành trở lên, máy chủ tự lấy ảnh gốc»), `scripts/check-portal-compliance.mjs` §6

- [ ] **Step 1:** thêm chiều đỏ §6: bản sao `zalo-media.ts` gọi `layAnh`/`traMedia` trước `if (!xemNoiDungTin(user)) return` → báo; bản sao route import `lay-anh-goc` → báo.
- [ ] **Step 2:** thêm kiểm dương: trong `serveZaloMedia`, chỉ số `xemNoiDungTin` < chỉ số `traMedia(` và `layAnh(`.
- [ ] **Step 3:** `node scripts/check-api-surface.mjs static && node scripts/check-portal-compliance.mjs` → xanh.
- [ ] **Step 4: Commit** `feat(ops): sổ bề mặt + kiểm cổng cho zalo-media ?media= (anh-goc-qua-may-chu T4)`.

### Task 5: Tài khoản thử vai ops + chụp màn (AC-9)

**Files:**
- Modify: `scripts/dev-ops-account.mjs` (`VAI_THU.ops = { email: "ops-role-test@local.test", file: .claude/ops-role-test-account.json }`, role `ops`), test của nó trong `scripts/*.test.mjs`, `app/CLAUDE.md` (một dòng lệnh `--vai ops`)
- Evidence: `_acceptance/anh-goc-qua-may-chu/evidence/E10-*.png` (S4)

- [ ] **Step 1:** test `--vai ops` parse được, `--vai x` vẫn ném lỗi liệt cả ba vai; chạy `node --test scripts/*.test.mjs` → FAIL rồi PASS sau khi thêm.
- [ ] **Step 2:** `node scripts/dev-ops-account.mjs --vai ops` trên DB local (chỉ ghi bảng `users` local).
- [ ] **Step 3:** dev server worktree `:3460` (nền), đăng nhập bằng `scripts/ui-capture-login.mjs` với tài khoản ops, mở `/ops/review` tới thẻ có bên S06, chụp sáng/tối/hẹp; kiểm mã trang (`document.documentElement.outerHTML` + dữ liệu RSC) không chứa hostname từ DB. Tắt server.
- [ ] **Step 4: Commit** `feat(scripts): tài khoản thử vai ops cho dev (anh-goc-qua-may-chu T5)`.

### Task 6: Kiểm tổng

- [ ] `cd app && npx tsc --noEmit && npm run lint`; chạy `anh_goc`, `anh_goc_doi_chieu`, các test kiểm kê (`visible-strings`, `viewer-the-duyet`) và `node --test scripts/*.test.mjs`. Sau đó contract `status: implemented`, vào S4.
