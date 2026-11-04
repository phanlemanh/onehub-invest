# Căn giá tốt biết căn — kế hoạch thi công (CG1)

> Thực thi tuần tự trong vòng chính (`superpowers:executing-plans`); các việc phụ thuộc nhau qua kiểu `DealChiTiet`, nên không chạy song song. Quy ước verify của kho thắng: mỗi việc kết bằng lệnh dưới.

**Goal:** Thay bản mẫu dữ liệu bịa của `/ops/deals` và `/ops/deals/<offerId>` bằng loader thật, áp vai, chạy cả máy thu lẫn cloud.

**Architecture:** Ba ngưỡng và hàm thuần ở `lib/deals-chi-tiet.ts` (không kéo pg, thành phần client dùng được). `lib/deals.ts` giữ câu SQL và loader, trả căn đã gắn ảnh và cờ `mayThu`. Trang tính `DealHang` phía máy chủ rồi đưa xuống bảng; sheet và trang dùng chung `DealBody`.

**Tech Stack:** Next.js 16, Postgres (lược đồ tạm trong test), ReUI data-grid, filters, sheet.

**Spec:** `docs/superpowers/specs/2026-11-03-can-gia-tot-biet-can-design.md` · hợp đồng `_acceptance/can-gia-tot-biet-can/contract.md` · tiêu chí đo `evals.yaml`.

## Global Constraints

- Không migration, không thu thêm. Không đọc `listing_url`, không đưa `media_url` xuống trình duyệt.
- Bản cloud chỉ đọc cột trong `CLOUD_ALLOW`; không `unit_number`, `street_number`, `media`, `stg_zalo_posts`.
- Vai Người xem không nhận ảnh, chữ bài, tên, nhóm, số, toà, tầng, số căn, số nhà trong dữ liệu trang.
- Ngưỡng 5, 35, 50 và 45 ngày là hằng số dùng chung cho SQL và chữ trên trang.
- Luật ReUI và `onehub-ui`; không sửa `components/ui`, `components/reui`.
- Số, tên, chữ bài trong test là bịa; báo cáo đối chiếu không chép giá trị thật.

## Review Focus

- `?can=` mang mã lạ hay ký tự lạ: chuyển sang trang căn, mã được mã hoá, ra «Không tìm thấy», không lỗi 500.
- Tên người bán hay chữ bài ở máy thu chứa tên nguồn thật: qua bộ che trước khi xuống trình duyệt.
- Căn nằm trong danh sách lúc `getDeals` nhưng bị vượt `LIMIT`: mở trang căn vẫn đúng, không có nhãn rời.
- Mất bảng `media` khi `stg_zalo_posts` còn: lỗi thiếu lược đồ không được làm trang câm, căn vẫn hiện, coi như bản cloud.
- Phím J, K khi đang ở ô nhập hay giữ phím bổ trợ: không chuyển căn.

---

### Task 1: Loader và hàm thuần

**Files:** Modify `app/src/lib/deals.ts`, `app/src/lib/deals-chi-tiet.ts`; Delete `app/src/lib/deals-proto.ts`. Phục vụ E1–E8.

**Interfaces — Produces:**
- `deals-chi-tiet.ts`: `NGUONG_VAO_PCT = 5`, `NGHI_NGO_PCT = 35`, `NGUONG_LOAI_PCT = 50`, `NGAY_TOI_DA = 45`; `lyDoRoi(d, quaHan)`; `cauChungMinh(d)`; `tenCan`, `thieuGi`, `canCungTieuChi`, `tabCua`; kiểu `DealHang`; `dealHang(d, tel, sdt, vai)`.
- `deals.ts`: `export { NGHI_NGO_PCT }`, `dealsSql({ cloud })`, `dealSql({ cloud })`, `toDealRow`, `dealTheoVai`, `getDeals(limit, min): Promise<{ rows: DealChiTiet[]; mayThu: boolean }>`, `getDeal(offerId): Promise<{ deal: DealChiTiet | null; mayThu: boolean }>`. Bỏ `dealMediaSrc`, `mediaPath`, `mediaUrl`.

**Verify:** `cd app && npx tsc --noEmit` chỉ còn lỗi ở các tệp của Task 2–4.

### Task 2: Giao diện dùng chung

**Files:** Create `app/src/components/ops/deal-body.tsx`, `app/src/app/ops/deals/loading.tsx`, `app/src/app/ops/deals/[offerId]/loading.tsx`; Modify `deal-sheet.tsx`, `deal-similar.tsx`, `deals-grid.tsx`, `deals-cells.tsx`, `review-photos.tsx`; Delete `deal-card.tsx`, `deal-detail-view.tsx`. Phục vụ AC-1, AC-2, AC-5, AC-9, AC-11, AC-12.

`DealBody({ d, xemNoiDung, mayThu, beMat })`: `beMat` là `"sheet"` (mục trống ghi «chưa có») hay `"trang"` (bỏ dòng trống, hai cột từ 1024 px). Thứ tự hẹp: ảnh, vì sao giá tốt, gọi ai, ở đâu, tin, chữ bài.

**Verify:** `cd app && npx eslint src/components/ops src/app/ops/deals`.

### Task 3: Hai trang thật

**Files:** Modify `app/src/app/ops/deals/page.tsx`, `app/src/app/ops/deals/[offerId]/page.tsx`. Phục vụ AC-1, AC-3, AC-6, AC-7.

Vai từ `getSessionUser`, chặn bằng `canAccessOps`; lỗi DB rơi vào `RegionError`; `?can=` ngoài danh sách gọi `redirect("/ops/deals/" + encodeURIComponent(can))`.

**Verify:** `cd app && npx tsc --noEmit`.

### Task 4: Test chính

**Files:** Create `app/tests/can-gia-tot-biet-can.test.tsx` (ca CGT-AC-1…7, 11, 12 kèm đối chứng đỏ theo `evals.yaml`); Modify `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx`, `app/tests/deals-phi-ly.test.tsx`.

**Verify:** `node --import tsx --test tests/can-gia-tot-biet-can.test.tsx tests/deals-phi-ly.test.tsx tests/sellers-chip.test.tsx tests/danh-ba-nguoi-deals-lien-he.test.tsx` trong `app`: xanh.

### Task 5: Cổng tĩnh và tài liệu

**Files:** Modify `scripts/check-portal-compliance.mjs` mục 4, `.claude/skills/onehub-ui/routes.md`, `.claude/skills/onehub-ui/catalog.md`, `CONTEXT.md`, `docs/ROADMAP.md`. Phục vụ E11.

**Verify:** `node scripts/check-portal-compliance.mjs` và `cd app && npm run -s test:lint-rules`: xanh; lệnh `executors.script.can_gia_tot_quet_ma` thoát 0.

### Task 6: Đối chiếu DB thật và ba vai

**Files:** Create `app/tests/can-gia-tot-doi-chieu.test.tsx` (E8), `scripts/can-gia-tot-ba-vai.mjs` (E10). Không ghi DB, không in giá trị thật.

**Verify:** `executors.test.can_gia_tot_doi_chieu` thoát 0; `executors.script.can_gia_tot_ba_vai` thoát 0 với bản chạy :3460.
