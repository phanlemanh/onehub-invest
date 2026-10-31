# Proxy ảnh tin chặn SVG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/api/zalo-media` chỉ phục vụ jpeg/png/webp/gif; SVG và kiểu ảnh lạ trả 415; mọi phản hồi ảnh mang `nosniff` + CSP `sandbox`.

**Architecture:** Danh sách cho phép + hằng header sống trong `lay-anh-goc.ts`; `zalo-media.ts` dùng lại hằng header cho `sendImage`. Route không đổi (trả thẳng phản hồi lõi).

**Tech Stack:** TypeScript, `node --test` + tsx.

**Spec:** `docs/superpowers/specs/2026-10-31-proxy-anh-chan-svg-design.md` · hợp đồng `_acceptance/proxy-anh-chan-svg/contract.md` (AC-1..7, duyệt 31/10).

## Global Constraints

- Kiểu cho phép: `image/jpeg`, `image/png`, `image/webp`, `image/gif`; `image/jpg` → `image/jpeg`; so sau khi bỏ tham số và hạ chữ thường.
- `image/*` ngoài danh sách → 415, thân đúng «định dạng ảnh không được phép»; không phải `image/*` → 502 (giữ).
- Header: `x-content-type-options: nosniff`, `content-security-policy: sandbox; default-src 'none'`.
- Không sửa `app/tests/anh-goc-qua-may-chu.test.tsx` (E9 đo bằng `git diff`).
- Không in tên miền nguồn thật; fixture dùng đuôi `.test`.

## Review Focus

1. **415 phải quyết TRƯỚC khi đọc thân nguồn** — đọc 8 MB SVG rồi mới 415 là phí và rò. Test: bộ đếm đọc thân = 0.
2. **Kiểu có khoảng trắng / tham số lạ** (`image/png ;q=1`) — chuẩn hoá phải cắt đúng. Ô trong ma trận AC-1.
3. **Header trên phản hồi lỗi** — `loi()` dựng phản hồi riêng; quên một nhánh là thiếu nosniff. Ma trận AC-4 năm mã.
4. **`sendImage` ba đường trả 200** — chỉ nhánh 200 cần header; 403/404 của nó vẫn nên có nosniff (rẻ, thêm luôn).
5. **Route** — vẫn `return serveZaloMedia(req, user);` (E8 giữ).

---

### Task 1: Danh sách cho phép + header trong bộ lấy ảnh (AC-1..4) — independent: false

**Files:**
- Modify: `app/src/lib/ops/lay-anh-goc.ts`
- Create: `app/tests/anh-goc-chan-svg.test.tsx` (khối PAS-AC-1..4)

**Interfaces:**
- Produces: `export const ANH_CHO_PHEP: ReadonlySet<string>`; `export function chuanHoaKieu(raw: string | null): string` (trả kiểu đã chuẩn hoá, `""` khi vắng); `export const HEADER_ANH_AN_TOAN: Readonly<Record<string, string>>`; `loi` nhận thêm mã 415.

- [ ] **Step 1:** viết ma trận PAS-AC-1 (7 ô viết tay → 200 + kiểu kỳ vọng viết tay), PAS-AC-2 (7 ô → 415, thân hằng, không chứa host/pathname/query, bộ đếm đọc thân = 0), PAS-AC-3 (text/html, vắng → 502), PAS-AC-4 (200/403/415/502/504 → hai header); ba chiều đỏ bằng bản chép tạm: chép kiểu nguồn (ghim «PAS-AC-1 chép kiểu nguồn»), bỏ danh sách («PAS-AC-2 SVG lọt»), nối pathname vào thân 415 («PAS-AC-2 thân lộ đường»), bỏ header khỏi `loi` («PAS-AC-4 thiếu nosniff»).
- [ ] **Step 2:** `cd app && node --import tsx --test tests/anh-goc-chan-svg.test.tsx` → FAIL.
- [ ] **Step 3:** cài: `chuanHoaKieu` → không `image/` → 502; ngoài `ANH_CHO_PHEP` → 415 (trước vòng đọc thân); 200 trả kiểu chuẩn hoá; `loi()` và phản hồi 200 trải `HEADER_ANH_AN_TOAN`.
- [ ] **Step 4:** chạy lại → PASS; chạy `anh-goc-qua-may-chu` → PASS không sửa tệp.
- [ ] **Step 5:** commit `fix(ops): bộ lấy ảnh chỉ cho jpeg/png/webp/gif, SVG trả 415, nosniff + CSP (proxy-anh-chan-svg T1)`.

### Task 2: Header cho `sendImage` + đầu–cuối qua `serveZaloMedia` (AC-5, AC-6)

**Files:**
- Modify: `app/src/lib/ops/zalo-media.ts` (`sendImage`: trải `HEADER_ANH_AN_TOAN` vào 200; `outside()` và 404 của nó thêm nosniff)
- Test: `app/tests/anh-goc-chan-svg.test.tsx` (khối PAS-AC-5, PAS-AC-6)

**Interfaces:**
- Consumes: `HEADER_ANH_AN_TOAN`, `layAnhGoc` (T1); `serveZaloMedia(req, user, { traMedia, layAnh })` (HD10).

- [ ] **Step 1:** PAS-AC-5: vai ops, ba nhánh (`?media=` lấy hộ với `layAnhGoc` thật + `taiVe` giả, `?media=` có `local_file` trong SNAPSHOTS_DIR tạm, `?snapshot=`) → 200 + hai header; chiều đỏ bỏ header khỏi `sendImage` → nhánh `?snapshot=` đỏ («PAS-AC-5 sendImage thiếu header»). PAS-AC-6: nguồn SVG có `<script>` → 415, không host; đối chứng PNG → 200.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** cài trong `sendImage`.
- [ ] **Step 4:** chạy → PASS.
- [ ] **Step 5:** commit `fix(ops): ảnh đã tải của zalo-media mang nosniff + CSP sandbox (proxy-anh-chan-svg T2)`.

### Task 3: Kiểm tổng

- [ ] `cd app && npx tsc --noEmit && npm run lint`; `node scripts/check-portal-compliance.mjs` (E8); `git diff --exit-code 6b610913 -- app/tests/anh-goc-qua-may-chu.test.tsx` (E9); bộ `zalo-media`, `the-duyet-du-can-cu`, `media-canonical`. Rồi contract `status: implemented`, vào S4.
