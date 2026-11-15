# CG9 bang-hang-gia-m2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bảng tính sẵn `offer_price_rank` chấm hạng mọi tin đang rao trong nhóm phường × loại × bán/thuê (± số phòng ngủ), job đêm làm mới, `/ops/deals` và hai API đọc bảng.

**Architecture:** Migration 104 thêm bảng; `pipeline/sql/420_price_rank.sql` là một câu SQL tính toàn bộ dòng (CTE phiếu → nhóm → hạng → nhãn); `pipeline/xep-hang-gia.mjs` chạy nó trong một giao dịch có khoá advisory (xoá trọn rồi chèn), được ba job đêm gọi bằng `job_run` sau bước định vị. Ba đường đọc nối `offer_price_rank` theo `offer_id`; bảng thiếu hay rỗng thì đọc như CG8.

**Tech Stack:** PostgreSQL 16 (PostGIS :5433), Node .mjs + `pg`, Next.js 16 (app), Hono (data-api), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-14-bang-hang-gia-m2-design.md` · hợp đồng `_acceptance/bang-hang-gia-m2/contract.md` · evals `_acceptance/bang-hang-gia-m2/evals.yaml`.

## Global Constraints

- Migration số **104** (`db/migrations/104_offer_price_rank.sql`), idempotent (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS` trước `ADD`); không sửa migration cũ.
- Ngưỡng: nhãn khi `n ≥ 10` ∧ `gia_tri ≤ p20` ∧ `duoi_trung_vi_pct ≥ 5`; số không nhãn khi `5 ≤ n ≤ 9`; không chấm khi `n < 5`; `can_xac_minh` khi `duoi_trung_vi_pct > 35`.
- Khoảng hợp lệ: bán 5.000.000–500.000.000 đ/m²; thuê 20.000–2.000.000 đ/m²/tháng; thuê theo tháng 1.000.000–500.000.000 đ/tháng.
- `duoi_trung_vi_pct = ROUND((1 − gia_tri / trung_vi) × 100, 1)`; `hang_pct = ROUND(percent_rank() × 100, 1)` theo giá trị phiếu tăng dần trong nhóm.
- Mã lý do đúng chữ: `pn-duoi-10`, `nhom-5-9`, `nhom-duoi-5`, `chua-ro-loai`, `thieu-phuong`, `thieu-gia`, `ngoai-khoang`, `phi-ly:<lý do ON11>`, `thieu-dt-va-pn`.
- `cap` CHECK ∈ (`phuong`, `du_an`, `phan_khu`, `toa`); hàng này chỉ sinh `phuong`. `nhan` CHECK ∈ (`re-trong-phuong`, `gia-tot`) hoặc NULL. `thuoc` CHECK ∈ (`gia-m2`, `gia-thang-pn`).
- `bait_gap_pct` và `refresh-bait-gap.mjs` không đổi cách tính (ca CG8 xanh không sửa ca).
- Mọi test DB chạy trên DB của riêng lượt (`db/db-thu.sh <tên> --chay`); không chạm DB `oneinvest` dùng chung. Tệp test pipeline mới xếp vào `pipeline/test-nua.json` (nửa nhẹ hơn).
- Chữ UI tiếng Việt: nhãn «Rẻ trong phường», «Cần xác minh»; câu «So với N căn cùng phường, cùng loại[, cùng kPN]: thấp hơn trung vị X%». Không tên nguồn thật ở đâu.

## Review Focus

1. Nhóm có nhiều phiếu bằng giá nhau (giá tròn số): `p20` rơi vào giá trị trùng → mọi phiếu bằng `p20` cùng được nhãn nếu dưới trung vị từ 5%; không phiếu nào nhãn khi trung vị = p20. Ca thêm ở Task 2.
2. Tin rời danh sách sống giữa hai lượt: lượt sau không còn dòng của tin đó (bảng dựng lại từ `sale_offers`), không lỗi khoá ngoại. Ca thêm ở Task 2.
3. Hai job đêm chạy chồng: lượt thứ hai chờ khoá advisory rồi chạy, không chèn trùng (PK). Ca thêm ở Task 2.
4. Loại `room` và `commercial` của thuê không bị quên: nhóm theo `property_type` chung, không danh sách loại viết tay. Ca thêm ở Task 2 (một nhóm `room` thuê).
5. `kind` vắng ở API cũ: người gọi hôm nay không truyền `kind` vẫn chỉ nhận tin bán. Ca thêm ở Task 5.

---

### Task 1: Migration 104 — bảng `offer_price_rank`

**Phục vụ:** E5 (phần migration). **independent:** false (nền của mọi task).

**Files:**
- Create: `db/migrations/104_offer_price_rank.sql`
- Create: `pipeline/scripts/hang-gia.itest.mjs` (khung + ca migration)
- Create: `docs/ops/cloud-schema-catchup-2026-11-14-offer-price-rank.sql` (cùng DDL bảng cho cloud, Mạnh áp)
- Modify: `pipeline/test-nua.json` (thêm `scripts/hang-gia.itest.mjs` nếu chay-nua nhận `.itest`; không thì chạy qua `cg9_db` riêng — đọc `chay-nua.mjs` để chọn)

**Interfaces:**
- Produces: bảng `offer_price_rank(offer_id text PK REFERENCES sale_offer_records(offer_id) ON DELETE CASCADE, kind text, property_type text, bedrooms int, thuoc text, gia_tri numeric, cap text, nut text, pn_nhom int, n int, trung_vi numeric, p20 numeric, hang_pct numeric(5,1), duoi_trung_vi_pct numeric(6,1), nhan text, can_xac_minh boolean NOT NULL DEFAULT false, ly_do text, computed_at timestamptz NOT NULL DEFAULT now(), run_id text NOT NULL)`; chỉ mục `(cap, nut, kind, property_type, pn_nhom)` và `(kind, nhan) WHERE nhan IS NOT NULL`.
- Produces (test): `async function napMigration104(c: pg.Client): Promise<void>` trong `pipeline/scripts/hang-gia.itest.mjs` — đọc tệp 104, chạy trong giao dịch của người gọi.

- [ ] **Step 1:** Viết ca `CG9-AC-5 migration`: áp 104 hai lần không lỗi; `INSERT … cap='quan'` lỗi mã `23514`; bốn giá trị `phuong|du_an|phan_khu|toa` qua.
- [ ] **Step 2:** Chạy `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.itest.mjs` → đỏ (tệp 104 chưa có).
- [ ] **Step 3:** Viết `104_offer_price_rank.sql` theo Interfaces; header theo khuôn skill `/new-migration` (không áp lên DB chung).
- [ ] **Step 4:** Chạy lại lệnh Step 2 → xanh. Phá thử: bỏ CHECK `cap` trong bản sao → ca đỏ «cap nhận giá trị lạ».
- [ ] **Step 5:** Commit `feat(db): 104 offer_price_rank (CG9)`.

### Task 2: Bước chấm — `420_price_rank.sql` + `xep-hang-gia.mjs`

**Phục vụ:** E1, E2, E3, E4, E5 (chạy lại, lỗi giữa chừng, số dòng), E11 (phần chạy lệnh). **independent:** false (cần Task 1).

**Files:**
- Create: `pipeline/sql/420_price_rank.sql`
- Create: `pipeline/xep-hang-gia.mjs`
- Modify: `pipeline/scripts/hang-gia.itest.mjs` (ca AC-1…AC-5, Review Focus 1–4)

**Interfaces:**
- Produces: `export async function xepHangGia(c: pg.Client, opts?: { runId?: string, sauXoa?: () => Promise<void> }): Promise<{ chuaAp104: boolean, tong: number, theoKind: Record<string, { nhan: number, chiSo: number, khongCham: Record<string, number> }> }>` — tự `BEGIN`/`COMMIT` khi `c` chưa ở giao dịch, dùng `SAVEPOINT` khi đã ở (khuôn `buocDem` của refresh-bait-gap); lấy khoá `SELECT pg_advisory_xact_lock(hashtext('xep-hang-gia'))`; `sauXoa` chỉ dùng cho ca đột biến AC-5 (ném lỗi sau DELETE). `to_regclass('offer_price_rank') IS NULL` → in `chưa áp 104`, trả `{ chuaAp104: true, tong: 0, theoKind: {} }`, không ghi.
- Produces: `export const SQL_420: string` (nội dung tệp 420, đọc theo `import.meta.url`).
- Phi lý ON11 tính trong JS: `xepHangGia` đọc `offer_id, area_m2, bedrooms` của tin đang rao, gọi `implausibleReason` của `lib/deal-plausibility.mjs`, truyền mảng `{offer_id, ly_do}` vào 420 qua tham số `$2::jsonb`.
- CLI: `node pipeline/xep-hang-gia.mjs` → in một dòng tổng và một dòng mỗi `kind`; thoát 0.

Thuật toán 420 (một câu INSERT … SELECT, `$1` = run_id, `$2` = phi lý):
1. `tin` = mọi dòng `sale_offers`; `gia_tri` = `price_perm2` khi `area_m2 > 0` (thuoc `gia-m2`), ngược lại khi `kind='rent_lt'` ∧ `bedrooms IS NOT NULL` → `price_vnd` (thuoc `gia-thang-pn`); `ly_do` không chấm theo thứ tự: `chua-ro-loai` → `thieu-phuong` → `phi-ly:*` → `thieu-dt-va-pn` (thuê) / `thieu-gia` → `ngoai-khoang`.
2. `phieu` = `COALESCE(min(property_id) qua property_offers, 'o:'||offer_id)`; giá trị phiếu = `gia_tri` của tin có `last_seen` lớn nhất trong phiếu (hoà → `offer_id` nhỏ nhất).
3. Nhóm thước `gia-m2`: khoá `(area_id, property_type, kind, bedrooms)` khi tin có PN và nhóm ấy ≥ 10 phiếu; ngược lại `(area_id, property_type, kind)` với `pn_nhom NULL`, `ly_do = 'pn-duoi-10'` khi tin có PN. Thước `gia-thang-pn`: khoá `(area_id, property_type, 'rent_lt', bedrooms)` trên mọi phiếu thuê có `price_vnd` trong khoảng tháng.
4. Thống kê theo phiếu: `n`, `percentile_cont(0.5)`, `percentile_cont(0.2)`; `hang_pct` = percent_rank của giá trị phiếu; mọi tin của phiếu mang cùng số.
5. `n < 5` → `ly_do='nhom-duoi-5'`, các cột số NULL; `5–9` → số, `ly_do='nhom-5-9'`, `nhan NULL`; `≥ 10` → nhãn theo Global Constraints.

- [ ] **Step 1:** Viết ca `CG9-AC-1` (ba nhóm 12 · 7 · 4 phiếu, kỳ vọng tính bằng hàm `kyVong(values)` viết riêng trong test: trung vị, p20 kiểu `percentile_cont`, percent_rank), `CG9-AC-2` (căn ba tin, tin hai căn, tin S03), `CG9-AC-3` (12 ô), `CG9-AC-4` (thuê), `CG9-AC-5` (chạy lại so từng dòng trừ `computed_at`/`run_id`; `sauXoa` ném → bảng còn dòng cũ; số dòng = `count(*) FROM sale_offers`), Review Focus 1–4. Mỗi ô một `assert`, thông điệp nêu `offer_id`.
- [ ] **Step 2:** Viết ba bản đột biến chạy trong cùng tệp bằng cách thay chuỗi trong `SQL_420` (bỏ `>= 5` của điều kiện nhãn; đổi `>= 10` thành `>= 5`; phiếu = offer_id) → kỳ vọng ca tương ứng đỏ (`assert.throws`/so khác).
- [ ] **Step 3:** Chạy lệnh `cg9_db` → đỏ (hàm chưa có).
- [ ] **Step 4:** Viết `420_price_rank.sql` và `xep-hang-gia.mjs` theo Interfaces.
- [ ] **Step 5:** Chạy lệnh `cg9_db` → xanh, ba đột biến đỏ đúng ca.
- [ ] **Step 6:** Commit `feat(pipeline): bước chấm hạng giá 420 + xep-hang-gia (CG9)`.

### Task 3: Nối job đêm

**Phục vụ:** E11. **independent:** false (cần Task 2).

**Files:**
- Modify: `scripts/chotot-daily.sh` (thêm `job_run chotot-daily xep-hang-gia node "$ROOT/pipeline/xep-hang-gia.mjs"` sau dòng `resolve-properties`)
- Modify: `scripts/zalo-import-daily.sh` (thêm `buoc zalo-import-daily xep-hang-gia node "$ROOT/pipeline/xep-hang-gia.mjs"` sau dòng `refresh-bait-gap`)
- Modify: `scripts/apify-facebook-daily.sh` (thêm `job_run apify-facebook-daily xep-hang-gia …` sau `refresh-bait-gap`)
- Modify: `pipeline/scripts/hang-gia.itest.mjs` (ca `CG9-AC-11`)

**Interfaces:**
- Produces (test): `function thuTuBuoc(noiDung: string): string[]` — rút tên bước từ các dòng `job_run <job> <buoc>` / `buoc <job> <buoc>`.

- [ ] **Step 1:** Ca `CG9-AC-11`: với mỗi script, `thuTuBuoc` có đúng một `xep-hang-gia`, chỉ số lớn hơn `resolve-properties` (chotot) hoặc `refresh-bait-gap` (hai job kia); bản sao bỏ dòng / đặt trước → kỳ vọng đỏ nêu tên job; chạy `xepHangGia` trên lược đồ tạm không có bảng → `chuaAp104 === true`, stdout có `chưa áp 104`; trên DB có 104 → `run_id` mới khác lượt trước.
- [ ] **Step 2:** Chạy `cg9_db` → đỏ. **Step 3:** Sửa ba script. **Step 4:** `cg9_db` xanh; `bash -n` ba script.
- [ ] **Step 5:** Commit `ops(cron): bước xep-hang-gia sau định vị ở ba job đêm (CG9)`.

### Task 4: `/ops/deals` và `/api/v1/deals` đọc bảng

**Phục vụ:** E6, E7 (phần app). **independent:** false (cần Task 2 cho fixture; chung tệp test với Task 5).

**Files:**
- Modify: `app/src/lib/deals.ts` (`dealsSql`, `dealSql`, `toDealRow`, `getDeals`, `getDeal`)
- Modify: `app/src/lib/deals-chi-tiet.ts` (`DealChiTiet` thêm trường hạng; `lyDoRoi`, `cauChungMinh`; hằng chữ lý do)
- Modify: `app/src/app/api/v1/deals/route.ts`
- Create: `app/tests/hang-gia-doc.test.tsx`

**Interfaces:**
- Produces: `DealChiTiet` thêm `rank_n: number | null`, `rank_median: number | null`, `rank_p20: number | null`, `rank_pct: number | null`, `rank_label: string | null`, `rank_pn: number | null`, `rank_reason: string | null`, `rank_thuoc: string | null`, `can_xac_minh: boolean`.
- Produces: `export function dealsSql({ cloud, coBang }: { cloud?: boolean; coBang?: boolean } = {}): string` và `dealSql` cùng cờ — `coBang=false` trả đúng câu CG8 hôm nay; `export async function coBangHang(): Promise<boolean>` (`to_regclass('offer_price_rank')` khác NULL ∧ `EXISTS (SELECT 1 FROM offer_price_rank)`), gọi trong `getDeals`/`getDeal` và route.
- Produces: `export const CHU_LY_DO: Record<string, string>` trong `deals-chi-tiet.ts` — một chữ cho mỗi mã lý do của Global Constraints (`phi-ly:*` dùng một chữ có đuôi lý do) cộng chữ mặc định cho mã lạ «Chưa chấm được hạng giá».
- `coBang=true`: danh sách `kind='sale' AND nhan IS NOT NULL AND duoi_trung_vi_pct BETWEEN $1 AND 50 AND last_seen >= now() - 45 ngày`, không lọc `price_tier`; xếp `can_xac_minh, duoi_trung_vi_pct DESC, offer_id`; `suspect = can_xac_minh`; `discount_pct = duoi_trung_vi_pct`.
- Route `/api/v1/deals`: tham số `kind` ∈ `sale|rent_lt` (vắng = `sale`, khác → 400); trường cũ giữ nguyên; thêm `rank: { level, n, median, p20, percentile, label, needsVerification, metric, bedroomsGroup, reason }`.

- [ ] **Step 1:** Viết `hang-gia-doc.test.tsx` ca `CG9-AC-6` (lược đồ dựng bằng 104 + chạy `xepHangGia` trên fixture của Task 2 chép sang; dùng khuôn lược đồ tạm của `tests/can-gia-cung-loai-db.test.tsx`): tập và thứ tự danh sách; số mỗi dòng = bảng; ma trận `CHU_LY_DO` đủ mã + mã lạ; `cauChungMinh` N = `n` (đột biến N = số tin đỏ), «cùng 2PN»; cặp «Cần xác minh» dương/âm; DB không bảng và bảng rỗng → câu CG8, không lỗi. Ca `CG9-AC-7 app`: `kind` vắng/sale/rent_lt/xyz, bảng khoá cũ, khối `rank`, không bảng → 200.
- [ ] **Step 2:** Chạy `cg9_doc` → đỏ. **Step 3:** Sửa ba tệp. **Step 4:** `cg9_doc` xanh; `cd app && npx tsc --noEmit && npm run lint` sạch.
- [ ] **Step 5:** Commit `feat(app): /ops/deals và /api/v1/deals đọc bảng hạng giá (CG9)`.

### Task 5: `/v1/deals` của data-api đọc bảng

**Phục vụ:** E7 (phần data-api). **independent:** false (chung tệp test với Task 4).

**Files:**
- Modify: `data-api/src/routes/deals.ts`
- Modify: `app/tests/hang-gia-doc.test.tsx` (ca `CG9-AC-7 data-api`, nạp `dealsRoute` qua URL như CG8)

**Interfaces:**
- Consumes: `offer_price_rank` (Task 1, 2). Cùng hợp đồng tham số và khối `rank` như route app ở Task 4; trường cũ (`offerId`, `priceVnd`, `areaM2`, `pricePerm2`, `bedrooms`, `phuong`, `marketId`, `propertyType`, `medianPerm2`, `discountPct`, `confidence`, `firstSeen`, `lastSeen`, `nReposts`, `contact`, `postText`) giữ tên và kiểu; `medianPerm2` = `trung_vi` khi `thuoc='gia-m2'`, NULL khi `gia-thang-pn`.
- Bảng thiếu/rỗng → câu CG8 hiện tại (giữ nguyên trong tệp, chọn theo `coBangHang` riêng của data-api).

- [ ] **Step 1:** Ca `CG9-AC-7 data-api` + Review Focus 5. **Step 2:** `cg9_doc` đỏ. **Step 3:** Sửa route. **Step 4:** `cg9_doc` xanh; `cd data-api && npm run typecheck`.
- [ ] **Step 5:** Commit `feat(data-api): /v1/deals đọc bảng hạng giá, tham số kind (CG9)`.

### Task 6: Đồng bộ cloud + rà ranh giới

**Phục vụ:** E8. **independent:** true (chỉ cần Task 1; tệp không chung với Task 2–5).

**Files:**
- Modify: `pipeline/sync-cloud.mjs` (`FILL` thêm `offer_price_rank`; `CHILD_OF_LIVE` thêm khuôn của `property_offers` theo `offer_id`; bảng tuỳ chọn: `const BANG_TUY_CHON = new Set(["offer_price_rank"])` — vắng trên cloud thì in `bỏ qua offer_price_rank — cloud chưa có bảng` và loại khỏi kế hoạch, bảng khác vắng vẫn ném «cloud thiếu bảng»)
- Modify: `pipeline/sync-cloud.test.mjs` (ca `CG9-AC-8 …`)
- Create: `pipeline/scripts/hang-gia-ranh-gioi.mjs` (`--base <ref>`: diff không đổi `pipeline/refresh-bait-gap.mjs`; 0 dòng thêm khớp danh sách tên nguồn thật lấy như `can-gia-cung-loai-ranh-gioi.mjs`; thoát 1 nêu tệp:dòng)

- [ ] **Step 1:** Ca: cloud giả có bảng → chép đúng dòng tin sống, cột chép không gồm `SOURCE_EXCLUDE`; cloud giả thiếu `offer_price_rank` → dòng bỏ qua, bảng khác chép; đối chứng: thiếu `areas` → vẫn ném «cloud thiếu bảng».
- [ ] **Step 2:** `cg9_sync` đỏ. **Step 3:** Sửa sync + viết script rà. **Step 4:** `cg9_sync` xanh; `cd pipeline && npm test -- sync-cloud.test.mjs` xanh.
- [ ] **Step 5:** Commit `feat(sync): offer_price_rank lên cloud, bỏ qua khi cloud chưa có bảng (CG9)`.

### Task 7: Đo trên bản chép DB máy thu + DB cho ảnh chụp

**Phục vụ:** E9, chuẩn bị E10. **independent:** false (cần Task 2; ghi-thu cần Task 4 để chụp).

**Files:**
- Create: `pipeline/scripts/hang-gia-db.sh` (chế độ `do`: dựng `oneinvest_u1_cg9_do` bằng `db/db-thu.sh` từ DB máy thu, áp 104, chạy đo, xoá khi xong; `ghi-thu`: DB `oneinvest_u1_cg9` áp 104 + `xepHangGia` có COMMIT cho ảnh chụp E10)
- Create: `pipeline/scripts/hang-gia-do.mjs` (áp 104 trong DB thử, `xepHangGia` hai lần, đếm độc lập bằng SQL viết riêng trong tệp, `--doi-chung-hong` đếm mỗi tin một phiếu → phải đỏ; in bảng đếm + mẫu số; thoát 1 nêu điều kiện hỏng)
- Create: `_acceptance/bang-hang-gia-m2/do-may-thu.md` (chép bảng đếm của lượt đo)

- [ ] **Step 1:** Viết `hang-gia-do.mjs` với các điều kiện của E9 (`lech=0`, hai lần bằng nhau, `nhan_nhom_duoi_10=0`, `so_khac_loai=0`). **Step 2:** `bash pipeline/scripts/hang-gia-db.sh do` → xanh; `--doi-chung-hong` đỏ.
- [ ] **Step 3:** Commit `test(pipeline): đo bảng hạng giá trên bản chép máy thu (CG9)`.

### Task 8: Từ vựng và tài liệu

**Phục vụ:** không eval riêng (đổi nhãn UI cùng commit thuật ngữ — luật AGENTS.md). **independent:** true.

**Files:**
- Modify: `CONTEXT.md` — sửa «Căn giá tốt», «Thước giá», «Tin cần xác minh» theo Q1–Q3; thêm «Hạng giá» (`offer_price_rank`), «Rẻ trong phường» (`re-trong-phuong`), «Nhóm so sánh».
- Modify: `pipeline/CLAUDE.md` (dòng `xep-hang-gia.mjs`, `420_price_rank.sql`), `docs/ROADMAP.md` §2 as-built + §4 trạng thái CG9.

- [ ] **Step 1:** Sửa ba tệp. **Step 2:** `cd app && npm run test:lint-rules` xanh (route slugs không đổi). **Step 3:** Commit `docs: hạng giá, rẻ trong phường (CG9)`.
