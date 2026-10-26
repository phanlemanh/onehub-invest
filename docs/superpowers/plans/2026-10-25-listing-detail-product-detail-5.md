# listing-detail-product-detail-5 (UI5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trang `/listing/[id]` theo product-detail-5 với gallery ảnh tự thu (khung 3:2 + một hàng ảnh nhỏ 1:1 trượt), hộp Đặc điểm, lịch form-5 sạch lint, vùng KPI/comps có chờ-trống-lỗi.

**Architecture:** Bản bấm được đã dựng ở S1 trên route thật (commit 13f4c17a, hợp đồng duyệt 4c1d6fc8): `listing-body.tsx` (thân trang đồng bộ) → `listing-hero.tsx` (đầu trang) → `listing-gallery.tsx` (client); `listing-sections.tsx` hai vùng async trong `RegionError > Suspense`. Kế hoạch này chỉ còn hai lớp chống dữ liệu bẩn mà Review Focus chỉ ra, cộng tài liệu trạng thái.

**Tech Stack:** Next.js 16 App Router, Base UI (Radio/RadioGroup/ScrollArea), ReUI + shadcn base-nova, node:test + jsdom (`app/tests`), Chromium qua playwright-core (`scripts/smoke-listing-detail.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-25-listing-detail-product-detail-5-design.md` · hợp đồng `_acceptance/listing-detail-product-detail-5/contract.md` · evals `_acceptance/listing-detail-product-detail-5/evals.yaml`

## Global Constraints

- Ảnh chỉ từ `listings.photo_urls` tự thu, không AirDNA (AGENTS.md luật 5).
- Khung ảnh: lớn `aspect-[3/2]`, rộng/cao < 1,2 → `object-contain`; nhỏ `aspect-square` (catalog.md «Ảnh (khung)»).
- Không sửa `components/ui/**`, `components/reui/**`; không `<button>` tay; không cỡ chữ `text-[…]`; `npm run lint` 0 lỗi.
- Baseline `app/eslint-suppressions.json` chỉ giảm.
- Chữ UI tiếng Việt; số qua `lib/format.ts`.

## Review Focus

1. URL ảnh trùng trong `photo_urls` (collector ghi lặp) → React key và giá trị radio trùng: người dùng thấy hai ô giống nhau, chọn một ô thì cả hai sáng. Mong đợi: gallery khử trùng, giữ thứ tự lần đầu. (DB 25/10: 0 listing trùng — phòng sẵn.)
2. URL ảnh đã có sẵn query (`?…`) → `photoSrc` nối thêm `?` thành URL hỏng, ảnh 404. Mong đợi: nối bằng `&`. (DB 25/10: 0 URL có `?`; 4 769 URL trần không scheme — đã xử.)
3. Listing > 10 ảnh → chỉ 10 ảnh đầu (giữ giới hạn cũ của trang). Đã có: `slice(0, 10)` ở trang cũ — kiểm còn giữ.
4. Ảnh chết hết (10% listing theo đo 25/10) → bố cục không ảnh. Đã có ca LD-AC-4 + smoke anh-chet-het.
5. Ảnh dọc làm ảnh bìa (23% ảnh đầu) → hiện trọn. Đã có ca LD-AC-1 khung ảnh + smoke 10/10.

---

### Task 1: Gallery chống URL trùng, URL có query, quá 10 ảnh

**Files:**
- Modify: `app/src/components/listing/listing-gallery.tsx` (`photoSrc`, đầu `ListingGallery`)
- Test: `app/tests/listing-detail.test.tsx` (ca mới «LD-AC-1 dữ liệu ảnh bẩn»)

**Interfaces:**
- Produces: `photoSrc(url: string, large: boolean): string` — nối `?` hay `&` theo URL; `ListingGallery({ urls, name, onEmpty })` — khử trùng + cắt 10 trước mọi xử lý.

- [ ] **Step 1: Viết ca đỏ** `LD-AC-1 dữ liệu ảnh bẩn`: `photoSrc("https://a/x.jpg?v=2", false) === "https://a/x.jpg?v=2&im_w=480"`, `photoSrc("a/x.jpg", true) === "https://a/x.jpg?aki_policy=x_large"`; render `urls=[A, A, B]` → 2 radio, alt ảnh chính «Ảnh 1/2 — …»; render 12 URL khác nhau → 10 radio.
- [ ] **Step 2: Chạy** `cd app && node --import tsx --test tests/listing-detail.test.tsx` → FAIL ở ca mới.
- [ ] **Step 3: Sửa** `photoSrc` (dấu nối theo `base.includes("?")`); trong `ListingGallery` dùng `const list = [...new Set(urls)].slice(0, 10)` thay `urls` ở mọi chỗ.
- [ ] **Step 4: Chạy lại** → 13/13 PASS; `npx tsc --noEmit && npm run lint` sạch.
- [ ] **Step 5: Commit** `fix(listing): gallery khử URL trùng, nối query đúng, tối đa 10 ảnh`.

### Task 2: ROADMAP trạng thái I3

**Files:**
- Modify: `docs/ROADMAP.md:296` (dòng I3 của bảng đợt giao diện)

- [ ] **Step 1:** Dòng I3 ghi `/listing/[id]` xong phần đầu trang (hồ sơ `listing-detail-product-detail-5`, UI5): gallery ảnh tự thu khung 3:2 + dải 1:1 trượt, hộp Đặc điểm, lịch form-5 sạch lint (baseline −3), KPI/comps Suspense + lỗi tại vùng + Empty; quy định khung ảnh chung ở catalog; `/listings` còn ở UI6.
- [ ] **Step 2: Commit** `docs(roadmap): I3 — /listing/[id] product-detail-5 (UI5)`.

**Phân nhánh:** Task 1 và Task 2 `independent: true` nhưng mỗi task vài phút — làm tuần tự trong phiên chính (fan-out tốn hơn việc).
