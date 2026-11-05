# Trang chi tiết tin — kế hoạch thi công

> **For agentic workers:** thực thi tuần tự trong phiên chính (feature-loop S3); các task phụ thuộc giao diện của nhau nên không chạy song song.

**Goal:** Thẻ tin bán, tin thuê dài hạn mở được `/listing/<offer_id>`, trang hiện đủ thông số, liên hệ, tin cùng tiêu chí, không lộ tầng A.

**Architecture:** Route `/listing/[id]` rẽ nhánh bằng hàm thuần theo tiền tố id. `offers-public.ts` thêm `getPublicOffer`, `getOfferComps` dùng chung `VISIBLE` và hàm dựng dòng. Thân trang là server component `offer-body.tsx`, khối tin cùng tiêu chí tải trong `RegionError > Suspense`.

**Tech Stack:** Next.js 16, ReUI/shadcn, pg, node:test + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-04-trang-chi-tiet-tin-design.md`; hợp đồng `_acceptance/trang-chi-tiet-tin/contract.md`.

## Global Constraints

- Không đổi `offers-filters.ts`; không đổi `VISIBLE`, `whereOf`, chữ ký `getPublicOffers` (GC3 dùng).
- Chỉ đọc cột có trong `CLOUD_ALLOW.sale_offers`; không có `street_number`, `unit_number`, toạ độ, `listing_url`.
- Số không vào HTML, kể cả `__next_f`; `OfferContact` giữ nguyên.
- Không hiện tên, mã nguồn; không thêm route API nên `api-surface.ts` không đổi.
- Trang có `noindex`; tiêu đề không có tên người đăng.
- Mọi ca không hiện: 404, câu «Tin này không còn hiện».
- Biên diện tích ±25%, tối đa 6 thẻ.
- Test HTTP chạy trên DB thử `oneinvest_tct`, từ chối DB tên `oneinvest`; máy chủ Next chạy từ bản sao ngoài cây vật, không ghi vào cây.

## Review Focus

- Id có ký tự lạ, mã hoá URL (`/listing/offer_%27`): 404, không lỗi 500. Ca trong ma trận E5.
- Giá trị che được ở `street_raw`, `block_raw`, `floor_raw` khi chứa tên nguồn: bỏ dòng, không để nhãn trơ. Ca trong E4.
- `area_id` là thị trường: không liên kết phường, không khối tin cùng tiêu chí. Ca trong E2, E7.
- `stories`, `frontage_length` phi lý: về null như thẻ. Ca trong E2b.
- Tiêu chí diện tích đúng biên 75%, 125%: được tính. Ca trong E7.

---

### Task 1: Đọc một tin và tin cùng tiêu chí

**Files:** Modify `app/src/lib/offers-public.ts`. Test `app/tests/trang-chi-tiet-tin-db.test.tsx`. **Phục vụ:** E2b, E5, E7. `independent: false`.

**Produces:**
- `type PublicOfferDetail = PublicOffer & { block: string | null; floor: string | null; market: { id: string; name: string; path: string } | null; atMarketLevel: boolean }`
- `getPublicOffer(offerId: string): Promise<PublicOfferDetail | null>`
- `getOfferComps(o: PublicOfferDetail): Promise<PublicOffer[]>`; tin cấp thị trường trả `[]` không truy vấn.

- [ ] Viết ma trận DB cho `TCT-AC-2-doc`, `TCT-AC-5`, `TCT-AC-7`; chạy thấy đỏ.
- [ ] Tách hàm dựng dòng khỏi `getPublicOffers`; che `street`, `block`, `floor` bằng `mangDinhDanh`; thêm hai hàm đọc.
- [ ] Bản phá: thay SQL lúc chạy qua `pool.query` (bỏ `VISIBLE`, bỏ điều kiện loại hình) phải đỏ, thông điệp gọi dòng ma trận. Cột ngoài `CLOUD_ALLOW` phải đỏ, gọi tên cột.
- [ ] `npm run test` riêng tệp bằng `config:executors.test.tct_db`: xanh. Commit.

### Task 2: Thẻ mở được

**Files:** Modify `app/src/components/listing/offer-card.tsx`. Test `app/tests/trang-chi-tiet-tin.test.tsx`. **Phục vụ:** E1. `independent: false`.

- [ ] Viết `TCT-AC-1`: đúng một liên kết chính, liên kết phường, nhãn, Xem số không nằm trong nó.
- [ ] Giá thành `Link` có `after:absolute after:inset-0`; ba phần tử riêng `relative z-10`.
- [ ] Bản phá bỏ liên kết chính đỏ, ghim `TCT-AC-1`. Các test thẻ cũ vẫn xanh. Commit.

### Task 3: Trang tin

**Files:** Create `app/src/lib/listing-branch.ts`, `app/src/components/listing/offer-body.tsx`, `app/src/app/(app)/listing/[id]/not-found.tsx`. Modify `app/src/app/(app)/listing/[id]/page.tsx`. Test `app/tests/trang-chi-tiet-tin.test.tsx`. **Phục vụ:** E2, E6, E6b, E8, E10, E11, E12. `independent: false`.

**Consumes:** Task 1. **Produces:** `listingBranch(id): "offer" | "rent_st"`, `offerTitle(o)`, `OfferBody`, `OfferCompsRegion`, `OfferComps`, `OfferCompsSkeleton`, `OfferCompsEmpty`.

- [ ] Viết `TCT-AC-2-ve`, `TCT-AC-6`, `TCT-AC-8`, `TCT-AC-9`; chạy thấy đỏ.
- [ ] Viết code theo bố cục hai cột của Đặc tả UX; trường thiếu bỏ dòng.
- [ ] Bản phá mỗi ca đỏ với thông điệp ghim. `tsc`, lint, `listing_static`, `tct_gate`, `floor` xanh. Commit.

### Task 4: Phép đo qua máy chủ thật

**Files:** Modify `app/tests/trang-chi-tiet-tin-db.test.tsx`. **Phục vụ:** E3, E4, E5. `independent: false`.

- [ ] Dựng hàm chạy `next dev` từ bản sao, DB thử, cổng riêng; đối chứng dương route liên hệ trả đúng số, trang 200.
- [ ] `TCT-AC-3`, `TCT-AC-4` (ba nguồn × từng cột cấm, cộng tên nguồn giả trong bốn trường), `TCT-AC-5` qua HTTP.
- [ ] Ba bản phá trên bản sao: truyền số qua props, in cột ra trang, chỉ truyền cột qua props của client. Đều đỏ, ghim tên.
- [ ] Commit.

### Task 5: Nhìn và tài liệu

**Files:** Modify `CONTEXT.md`, `.claude/skills/onehub-ui/routes.md`, `.claude/skills/onehub-ui/catalog.md`, `app/CLAUDE.md`, `docs/ROADMAP.md`.

- [ ] Design-pass trên route thật: chụp 375 và rộng, sáng và tối, sửa thứ lệch; ghi `design-pass.md`.
- [ ] Self-check ReUI trên tệp đã đổi. Cập nhật tài liệu. `design-floor-s3`. Contract `implemented`. Commit, đẩy nhánh.
