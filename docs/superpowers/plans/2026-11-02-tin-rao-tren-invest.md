# Tin rao trên Invest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa tên, số người bán và hai cột thông số lên cloud an toàn, khoá bề mặt API công khai, và phủ test cho bản giao diện đã dựng, để vào S4.

**Architecture:** Bản bấm được (trang Bán, Cho thuê, thẻ, `offers-public.ts`) đã có trên cây, chưa commit. Phần còn lại là đường sync, tệp catch-up, sổ bề mặt, bộ test `tir_*` và tài liệu luật. Che định danh nguồn ngay trong câu SELECT của sync, nên giá trị bẩn không rời máy và bộ soát tên nguồn vẫn là lưới cuối.

**Tech Stack:** Node `.mjs` (pipeline, scripts), Next.js 16, node:test + tsx, Postgres lược đồ tạm trên :5433.

**Spec:** `docs/superpowers/specs/2026-11-02-tin-rao-tren-invest-design.md`, hợp đồng `_acceptance/tin-rao-tren-invest/contract.md`, evals `evals.yaml` (các đối chứng đỏ ghim thông điệp ở đó là bắt buộc).

## Global Constraints

- Không ghi dữ liệu DB `oneinvest`; test có ghi dùng lược đồ tạm và tự xoá. `tir_quet_that`, `tir_doi_chieu` chỉ đọc, chỉ in số.
- Không chạy catch-up, không `supabase db push`, không bật tường lửa: việc của Mạnh sau khi ký.
- Tên nguồn thật chỉ ở `source_registry` local; commit, test, tệp công khai chỉ mã `S0x` và token giả.
- Không thêm migration: `stories`, `frontage_length` đã có ở local.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture, thông điệp đỏ ghim đúng như `evals.yaml`.
- Không sửa code hàng SV1, không sửa migration đã commit. Chạy `/verify` trước mỗi commit mã.
- Trước S4 xin khoá `s4` qua `dieu-phoi.mjs`; ghim lại hồ sơ đã ký bằng khoá `ghim-lai`.

## Review Focus

- Bảng `source_registry` rỗng hoặc đọc lỗi khi sync: không được gửi tên chưa che; lượt phải dừng, không im lặng cho qua.
- Token nguồn có ký tự đặc biệt của regex hay `'`: so bằng `position(lower(..))` với `lit()`, không dựng regex.
- Tên có dấu, viết hoa khác token: phép che không phân biệt hoa thường; tên sạch giữ nguyên từng byte.
- Cloud có hai trong bốn cột (áp dở): sync gửi cột có, cảnh báo cột thiếu; trang Bán báo lỗi vùng, thuê ngắn hạn vẫn chạy.
- `frontage_length` numeric về dạng chuỗi, `first_seen` cuối ngày giờ VN: `firstSeenDays` tính theo ngày VN, không âm.

---

### Task 1: Commit bản bấm được

**Files:** toàn bộ thay đổi `app/`, `CONTEXT.md`, `docs/ROADMAP.md`, `docs/architecture/invest-portal-ia.md`, `.claude/skills/onehub-ui/*` đang chưa commit.

- [ ] Chạy `/verify` cho `app`; kỳ vọng typecheck, lint, `tests/listings-browse`, `listing-detail`, `tin-rao-the` xanh.
- [ ] Commit `feat(app): trang Bán, Cho thuê và thẻ tin rao trên Invest`.

### Task 2: Đường sync người bán

**Files:**
- Modify: `pipeline/sync-cloud.mjs`, `pipeline/sync-cloud.test.mjs`
- Create: `pipeline/scripts/sync-nguoi-ban.itest.mjs`, `pipeline/scripts/sync-nguoi-ban-that.itest.mjs`

**Interfaces:**
- Produces: `selectList(table, localCols, geoCols = [], sourceTokens = [])`; `localReadSql` không đổi chữ ký; `countMaskedSeller(local, sourceTokens) -> { name: number, phone: number }`.

Phục vụ E1, E2, E2b.

- [ ] Viết ca E1 trong `sync-cloud.test.mjs`: ma trận viết trước, số assert bằng số ô; `seller_name`, `seller_phone`, `stories`, `frontage_length` của `sale_offers` gửi; `sellers.name`, `properties.seller_name`, `listing_url`, `photos`, cột mới chưa khai ở lại; đối chứng giữ `seller_phone` trong `PII_EXCLUDE` đỏ `SDT O LAI MAY`. Chạy, kỳ vọng đỏ.
- [ ] Bỏ hai cột khỏi `PII_EXCLUDE.sale_offers`, thêm bốn cột vào `CLOUD_ALLOW.sale_offers`.
- [ ] Viết `sync-nguoi-ban.itest.mjs` phần E2 trên lược đồ tạm theo `evals.yaml`. Chạy, kỳ vọng đỏ ở bộ soát `seller_name`.
- [ ] Trong `selectList`, với `sale_offers.seller_name`, `seller_phone`: biểu thức `CASE WHEN` có `position(lower(token) in lower(cột)) > 0` với bất kỳ token nào thì `NULL`, ngoài ra giữ cột. Thêm `countMaskedSeller`, đường chạy sync in một cảnh báo chỉ đếm; dùng danh sách token `syncOnce` đã nạp, vốn dừng lượt khi rỗng. Phép che phải phủ đúng những gì `scanSourceNames` bắt, không thì lượt sync dừng; E2b chứng điều này trên toàn bảng.
- [ ] Viết `sync-nguoi-ban-that.itest.mjs` (E2b): READ ONLY, chỉ in số, thiếu DB thì exit 1 `THIEU DB MAY THU`.
- [ ] Chạy `node --test pipeline/sync-cloud.test.mjs pipeline/scripts/sync-cloud-pii.test.mjs pipeline/scripts/soat-tang-a.test.mjs`, rồi hai itest; kỳ vọng xanh, E2b báo 0 trúng.
- [ ] Commit `feat(pipeline): đưa người bán lên cloud, che giá trị mang định danh nguồn`.

### Task 3: Tệp catch-up bốn cột

**Files:** Create `docs/ops/cloud-schema-catchup-2026-11-02-tin-rao.sql`; Modify `pipeline/scripts/sync-nguoi-ban.itest.mjs`.

Phục vụ E3.

- [ ] Viết ca E3: khối ÁP chỉ `ALTER TABLE public.sale_offers ADD COLUMN IF NOT EXISTS` với `seller_name`, `seller_phone`, `stories`, `frontage_length`; năm mốc tường lửa, gộp, kéo về, áp, sync theo thứ tự dòng; đảo hai dòng đỏ; thêm `DROP` vào bản chép đỏ `CAU CAM`. Chạy, kỳ vọng đỏ vì chưa có tệp.
- [ ] Viết tệp theo khuôn `docs/ops/cloud-schema-catchup-2026-10-31-060.sql`: đầu tệp ghi thứ tự và lý do, khối ĐO TRƯỚC, khối ÁP. Kiểu cột khớp local: `text`, `text`, `integer`, `numeric`.
- [ ] Chạy itest, kỳ vọng xanh. Commit `ops(cloud): tệp catch-up bốn cột tin rao`.

### Task 4: Test API và cầu nối cloud

**Files:** Create `app/tests/tin-rao-cong-khai.test.tsx`, `app/tests/tin-rao-doi-chieu.test.tsx`; Modify `app/src/app/api/v1/listings/route.ts`, `app/src/lib/offers-public.ts` nếu test bắt lỗi.

**Interfaces:** Consumes `getPublicOffers`, `getOfferPhone`, `parseOfferFilters`, `selectList`, `localReadSql`, tệp catch-up.

Phục vụ E4, E4b, E4c, E5, E7, E8b, E9b. Khẳng định từng ô đúng như `evals.yaml`, kèm: danh sách trường đúng 17 trường của AC-4; số tầng 31 và mặt tiền 101 trả null; `firstSeenDays` không âm.

- [ ] Viết E4, E5, E7, E8b, E9b trên lược đồ tạm với các đối chứng `TIN AN LO SO`, `NHIEU TEN`, `DEM SAU LOC`. Chạy, sửa tới xanh.
- [ ] Viết E4c trên lược đồ vai cloud dựng từ `CLOUD_ALLOW` trừ bốn cột: chưa catch-up và đã catch-up.
- [ ] Viết E4b chỉ đọc: `total` khớp đếm độc lập, 0 định danh nguồn, trang đầu mọi cách sắp dưới 1 giây.
- [ ] Chạy `tir_api`, `tir_doi_chieu`; kỳ vọng xanh. Commit `test(app): API tin rao công khai và cầu nối cloud`.

### Task 5: Sổ bề mặt, MCP, smoke

**Files:** Modify `app/src/lib/api-surface.ts`, `scripts/check-api-surface.mjs`, `scripts/check-api-surface.test.mjs`, `scripts/check-mcp-tools.mjs`, `scripts/check-mcp-tools.test.mjs`, nguồn công cụ MCP, smoke bề mặt, bảng kiểm kê route.

**Interfaces:** Produces khoá `publicOffers: true` trên `ApiSurfaceEntry`; công cụ `oneinvest_get_listings`.

Phục vụ E6, E6b.

- [ ] Viết đột biến: route public khác đọc `sale_offers` đỏ đúng thông điệp cũ; `publicOffers` trên route ngoài danh sách đỏ có tên; thư viện đọc `sale_offers` khác `offers-public` đỏ; bỏ câu chưa hứa ổn định đỏ `ON DINH`. Chạy, kỳ vọng đỏ.
- [ ] Khai `v1/listings`, `v1/listings/[id]/contact` là `public` + `publicOffers`; thêm công cụ MCP và ca smoke khách `v1/listings?kind=sale` 200, `v1/offers` 401.
- [ ] Chạy `tir_be_mat`, `portal_static`, ba ca `TA-AC-3`, `QV-AC-9`, `VT-AC-8`; kỳ vọng xanh. Commit `feat(api): khai bề mặt công khai của tin rao`.

### Task 6: Test giao diện

**Files:** Create `app/tests/tin-rao-giao-dien.test.tsx`; chuyển ca của `app/tests/tin-rao-the.test.tsx` vào đó rồi xoá tệp cũ.

Phục vụ E8, E9. Ca «chọn Loại tin» của E9 đọc là ô Dài hạn | Ngắn hạn, vì tab Loại tin đã bỏ.

- [ ] Viết E8, E9 theo `evals.yaml`, kèm: `renderToString` thẻ không chứa ký hiệu ₫; thứ tự ô; `offerSpecs`, `firstSeenVi`; đối chứng `DON VI GIA`, `GIU THI TRUONG`.
- [ ] Chạy `tir_ui`, kỳ vọng xanh. Chạy lại `chuyen-huong-ma-thi-truong.itest.tsx` trên DB thử `bash db/db-thu.sh`, xoá bằng `--xoa`.
- [ ] Commit `test(app): giao diện tin rao, liên hệ và trạng thái`.

### Task 7: Tài liệu luật

**Files:** Modify `docs/adr/0007-collector-operating-principles.md`, `AGENTS.md` luật 6, `.claude/rules/pii-spl.md`, `docs/architecture/portals.md`, `docs/ROADMAP.md` §2 và §4; kiểm lại `CONTEXT.md`, `routes.md`, `catalog.md`, `invest-portal-ia.md`.

Phục vụ E10.

- [ ] Sửa để không câu nào còn nói tên, số người bán ở lại máy; tên nguồn vẫn tầng A; S02, S08 không hiển thị; không đụng phần ảnh của hàng `anh-tin-cong-khai`.
- [ ] `git grep -n "ở lại máy"` trên các tệp trên, đọc từng dòng còn lại. Commit `docs: tên, số người bán lên cloud và Invest`.

### Task 8: Sang S4

- [ ] Chạy `/verify` toàn bộ module đã đổi; đặt hợp đồng `status: implemented`; chạy design-floor S3; xin khoá `s4`; dispatch workflow S4.
