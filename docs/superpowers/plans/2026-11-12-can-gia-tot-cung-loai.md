# CG8 `can-gia-tot-cung-loai` — kế hoạch thi công

> **For agentic workers:** chạy Native (vòng chính) theo superpowers:executing-plans. Bước dùng ô `- [ ]`.

**Goal:** ba đường hiện số giảm của Căn giá tốt (`refresh-bait-gap` → `/ops/deals`, `/api/v1/deals`, data-api `/v1/deals`) so tin
với thước `v_ruler_p2` cùng phường × loại hình; tin chưa rõ loại hoặc thiếu thước cùng loại không có số giảm và có lý do.

**Architecture:** không migration. Mỗi đường thay nguồn thước `v_ruler_p2_area` / `market_asset_stats` bằng `v_ruler_p2` nối theo
`(area_id, property_type)`, loại `property_type` NULL/`unknown` tường minh. Lời cho người nằm ở `deals-chi-tiet.ts` (hàm thuần).
Thước đo là bốn script `pipeline/scripts/can-gia-cung-loai-*` chạy trên DB thử `oneinvest_u1_cg8`, tính lại độc lập bằng SQL viết riêng.

**Tech Stack:** Node `.mjs` + `pg` (pipeline), Next.js 16 / TS (app), Hono (data-api), PostGIS :5433.

**Spec:** `docs/superpowers/specs/2026-11-12-can-gia-tot-cung-loai-design.md` · hợp đồng `_acceptance/can-gia-tot-cung-loai/contract.md`.

## Global Constraints

- Thước = `v_ruler_p2` (định nghĩa 044: `properties.property_type`, chỉ `kind='sale'`, giá/m² 5–500 tr, n ≥ 5). Không migration, không
  đổi `pipeline/sync-cloud.mjs`, không thêm trường liên lạc vào `/v1/deals` (AC-9).
- Số giảm = `ROUND((1 − price_perm2 / m) × 100, 1)`; không bao giờ lùi về thước cả phường (Hỏi-2).
- Tin thuê không đường nào chấm; `property_type` NULL hay `unknown` không có số giảm, không vào danh sách.
- Hai lý do, nguyên văn: «Chưa rõ loại hình — không so được với thước cùng loại» · «Phường chưa đủ tin <nhãn> để dựng thước».
- Nhãn loại = `LABELS_VI.property_type` viết thường chữ đầu (`căn hộ`, `nhà riêng`, `đất`, `phòng`, `mặt bằng`).
- `meta.ruler` của `/api/v1/deals` = `"phường × loại hình, n>=5"`.
- `/v1/deals` thêm `propertyType`; mọi khoá cũ giữ tên và kiểu (Hỏi-1).
- DB thử `oneinvest_u1_cg8` dựng bằng `db/db-thu.sh`; không ghi DB `oneinvest` dùng chung, không chạy tay `refresh-bait-gap` trên đó.
- Script cloud chỉ SELECT qua Management API (`~/.oneinvest/cloud.env`), không in token.

## Review Focus

1. Tin có `property_type` ≠ loại của `properties` (thước tính theo `properties.property_type`, tin nối theo `sale_offers.property_type`)
   → tin chỉ nhận thước khớp đúng loại của chính tin; ca AC-1 có một tin mà căn gắn loại khác (Task 1, fixture «lệch loại»).
2. `v_ruler_p2` có dòng `unknown` (nếu S06 có căn chưa rõ loại đủ 5) → đường vẫn loại `unknown` tường minh, không chỉ trông vào JOIN
   (Task 1 và Task 3, fixture có thước `unknown` n=5).
3. Trang một căn của tin `room` (loại có nhãn nhưng hiếm thước) → lý do «Phường chưa đủ tin phòng …», không «Không tính được mức giảm» (Task 2).
4. data-api lọc `area` lẫn `market` cùng lúc → giữ thứ tự ưu tiên cũ (`area` thắng) (Task 4).
5. Bản chép DB máy thu không có thước cho cả thị trường → phép đo in mẫu số 0 và thoát khác 0, không báo «0 lệch» trên rỗng (Task 5).

---

### Task 1: `refreshBaitGap` chấm theo thước cùng loại (AC-1, AC-2)

**Files:** Modify `pipeline/refresh-bait-gap.mjs:32-48` · Create `pipeline/scripts/can-gia-cung-loai-db.sh`,
`pipeline/scripts/can-gia-cung-loai.itest.mjs` · sửa fixture các test cũ trong `pipeline/scripts/` nếu đỏ.

**Interfaces:** Produces `refreshBaitGap(c) → { gap, sellersRemaining, loaiPhiLy, khongCham: { chua_ro_loai: number, thieu_thuoc_cung_loai: number } }`;
log một dòng `không chấm: chua-ro-loai=<n> thieu-thuoc-cung-loai=<n>`. `can-gia-cung-loai-db.sh <itest|do|ghi-thu>`.

- [ ] Viết `can-gia-cung-loai.itest.mjs`: trên DB thử, BEGIN, dựng fixture một phường có thước cả phường, bốn loại mỗi loại 5 căn S06
  (properties + property_offers + sale_offers) với trung vị khác nhau, tin P1 bán mỗi loại; ca «lệch loại» và thước `unknown` n=5;
  ma trận bảy ô AC-2 (unknown, NULL, bốn loại ở phường thứ hai chỉ có thước cả phường, tin thuê). Gọi `refreshBaitGap`, một assert mỗi
  ô, so log `chua-ro-loai=2 thieu-thuoc-cung-loai=4`; đối chứng dương: căn hộ có thước thì có số. Ca đột biến: chạy lại câu UPDATE cũ
  (nối `v_ruler_p2_area`) trên cùng fixture, assert mọi ô AC-1 lệch, thông điệp nêu mã tin. ROLLBACK.
- [ ] Viết `can-gia-cung-loai-db.sh`: `itest` = `db/db-thu.sh oneinvest_u1_cg8` (khi chưa có) rồi `node --test` file itest với
  `DATABASE_URL` trỏ DB thử; `do` = chạy `do-can-gia-cung-loai.mjs` (Task 5); `ghi-thu` = chạy `refreshBaitGap` có COMMIT trên DB thử.
- [ ] Chạy `bash pipeline/scripts/can-gia-cung-loai-db.sh itest` → đỏ (mã cũ).
- [ ] Sửa bước 1 (đếm thước theo loại từ `v_ruler_p2`), bước 2 (`UPDATE … FROM v_ruler_p2 r WHERE r.area_id = o.area_id AND
  r.property_type = o.property_type AND o.property_type <> 'unknown'`), thêm câu đếm hai lý do trên tin P1 bán có `price_perm2 > 0`.
- [ ] Chạy lại itest → xanh; `cd pipeline && npm test` → sửa fixture test cũ thiếu `property_type` (chỉ fixture, không nới assert).
- [ ] Commit `feat(pipeline): refresh-bait-gap so thước cùng phường × loại hình (CG8)`.

### Task 2: lời cho người ở trang một căn (AC-4)

**Files:** Modify `app/src/lib/deals-chi-tiet.ts:65-87,115-121` · chữ «thước phường» ở `app/src/app/ops/deals/page.tsx:33`,
`app/src/components/ops/deal-body.tsx:83`, `app/src/components/ops/deals-cells.tsx:30` · Create `app/tests/can-gia-cung-loai.test.tsx`.

**Interfaces:** Produces `thuocCua(t: string | null): string` (vd `"thước căn hộ cùng phường"`, NULL/unknown → `"thước cùng loại"`);
`lyDoRoi(d: Pick<DealChiTiet, "discountPct" | "medianPerm2" | "propertyType">, quaHan: boolean): string | null`.

- [ ] Test: `lyDoRoi({propertyType:"unknown",…})` và `null` → câu unknown; `{propertyType:"house", medianPerm2:null}` →
  «Phường chưa đủ tin nhà riêng để dựng thước»; `room` → «… tin phòng …»; `cauChungMinh` căn hộ chứa «thước căn hộ cùng phường», nhà
  chứa «thước nhà riêng cùng phường»; bốn ca cũ (quá hạn, đắt hơn, dưới ngưỡng, trên ngưỡng loại) giữ chữ cũ trừ cụm thước.
- [ ] Chạy `cd app && node --import tsx --test tests/can-gia-cung-loai.test.tsx` → đỏ.
- [ ] Sửa `lyDoRoi` (kiểm loại trước, rồi thiếu thước), `cauChungMinh`, `thieuGi` («Chưa có thước cùng loại»), ba chỗ chữ trên màn
  («so với thước cùng loại»). Sửa nơi gọi `lyDoRoi` cho đủ kiểu.
- [ ] Test xanh; chạy `can-gia-tot-biet-can`, `can-gia-tot-doi-chieu`, `deals-phi-ly`, `sellers-chip` → cập nhật chữ kỳ vọng cũ.
- [ ] Commit `feat(app): lý do và câu chứng minh nói thước cùng loại (CG8)`.

### Task 3: `/ops/deals` và `/api/v1/deals` đọc thước cùng loại (AC-3, AC-5)

**Files:** Modify `app/src/lib/deals.ts:96-132`, `app/src/app/api/v1/deals/route.ts:37-73` · thêm ca vào `can-gia-cung-loai.itest.mjs`.

**Interfaces:** Consumes fixture Task 1. `dealsSql`/`dealSql` giữ chữ ký; CTE `ruler AS (SELECT area_id, property_type, m, n FROM v_ruler_p2
WHERE property_type <> 'unknown')`, JOIN thêm `r.property_type = o.property_type`.

- [ ] Ca CG8-AC-3 (chạy `dealsSql`/`dealSql` qua `tsx` trên DB thử sau `refreshBaitGap`): `median_perm2`, `ruler_n` bằng dòng
  `v_ruler_p2` cùng khoá; 0 dòng unknown; đột biến `v_ruler_p2_area` đỏ.
- [ ] Ca CG8-AC-5: gọi `GET` của route với `OPS_API_TOKEN` thử → lệch ≤ 0,1; 0 unknown, 0 thuê (đối chứng dương tin bán cùng phường);
  `meta.ruler` chứa «phường × loại hình»; không token → 401.
- [ ] Chạy itest → đỏ; sửa hai tệp; chạy lại → xanh; `cd app && npx tsc --noEmit`.
- [ ] Commit `feat(app): /ops/deals và /api/v1/deals nối thước cùng loại (CG8)`.

### Task 4: data-api `/v1/deals` (AC-6)

**Files:** Modify `data-api/src/routes/deals.ts` · thêm ca vào itest.

**Interfaces:** phản hồi thêm `propertyType: string`; mọi khoá cũ (`offerId … contact, postText`) giữ tên/kiểu; `meta` giữ.

- [ ] Ca CG8-AC-6: `dealsRoute.request("/?…")` trên DB thử — bảng khoá viết trước (tên + `typeof`) so từng dòng; `propertyType ≠ unknown`;
  lệch ≤ 0,1; 0 thuê; lọc `area`, `market`, `limit`, `min_discount` đúng trên fixture; đột biến trỏ `market_asset_stats` đỏ.
- [ ] Đỏ → thay JOIN bằng `JOIN v_ruler_p2 r ON r.area_id = o.area_id AND r.property_type = o.property_type`, thêm
  `o.property_type <> 'unknown'`, cột `o.property_type`; xanh; `cd data-api && npm run typecheck`.
- [ ] Commit `feat(data-api): /v1/deals so thước cùng loại, thêm propertyType (CG8)`.

### Task 5: phép đo, ranh giới, cloud (AC-7, AC-9, AC-10)

**Files:** Create `pipeline/scripts/do-can-gia-cung-loai.mjs`, `pipeline/scripts/can-gia-cung-loai-ranh-gioi.mjs`,
`pipeline/scripts/can-gia-cung-loai-cloud.mjs`.

- [ ] `do-can-gia-cung-loai.mjs`: trên DB thử chép mới, BEGIN → `refreshBaitGap` → SQL viết riêng đếm `lech_pipeline`, `unknown_co_so`,
  `thue_co_so`; gọi hai API (`limit` 100, từng thị trường có thước) đếm `lech_api_app`, `lech_data_api`, `thue_api`, `unknown_api`, in mẫu
  số; trung vị số giảm căn hộ cũ/mới và mẫu số; mẫu số 0 hay một điều kiện hỏng → thoát 1 nêu điều kiện. ROLLBACK.
- [ ] `ranh-gioi.mjs --base <ref>`: đếm `migration_doi`, `sync_cloud_doi`, `contact_doi` (khối `contact:` của data-api đổi), `ten_nguon`
  (dòng thêm khớp mẫu tên nguồn đọc từ `source_registry` local, không in tên); đối chứng: cây tạm có tệp giả dưới `db/migrations` → 1, thoát 1.
- [ ] `cloud.mjs`: băm `md5(pg_get_viewdef('v_ruler_p2'))` hai phía + số dòng theo loại trên cloud; cờ `--doi-chung` so với định nghĩa
  sửa một ký tự → thoát 1 «lệch».
- [ ] Chạy ba script (lượt `duong-nen`/`s4` không cần cho `ranh-gioi`, `cloud`; `do` chạy khi giữ lượt đo DB) → kỳ vọng E7, E9, E10.
- [ ] Commit `test(cg8): phép đo bản chép, ranh giới, view cloud`.

### Task 6: S4

- [ ] `contract.md` → `status: implemented`; xin lượt `s4` qua giám sát; E8 chụp trên dev :3460 trỏ DB thử sau `ghi-thu`.
