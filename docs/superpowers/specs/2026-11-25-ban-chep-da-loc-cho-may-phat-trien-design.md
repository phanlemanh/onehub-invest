# Bản chép DB đã lọc cho máy phát triển M5 — thiết kế (HT18)

Hàng HT18 `ban-chep-da-loc-cho-may-phat-trien`, dãy P2, GS giao 24/11. Máy M5 chỉ chạy API (`app/api/v1/**` trừ ops,
`data-api/**`) và cổng Invest (`app/src/app/(app)/**`). M5 không được giữ tầng A (AGENTS.md luật 6), nên cần một bản DB đã
lọc để chạy ca dữ liệu thật. Cách chuyển bản chép sang M5 là câu của Mạnh (Hỏi-1), hàng này không tự chuyển.

## 1. Bảng phủ ca (đếm trên DB máy thu, 25/11, chỉ đọc)

DB `oneinvest` :5433: 342 bảng, ~7,6 GB; ngoài `public` còn ~30 schema test sót lại, schema nào cũng có `source_registry`
(tên nguồn thật) → bản chép chỉ lấy `public`.

| Nhóm bảng | Bảng (cỡ trên máy thu) | Ai đọc phía sau (M5) | Xử lý |
|---|---|---|---|
| Tập cloud (FILL của `pipeline/sync-cloud.mjs`) | `nights` 1,39 GB · `properties` 177 MB · `offer_price_rank` 82 MB · `airdna_listings` 55 MB · `property_offers` 43 MB · `areas` 21 MB · `sale_offers` (view dòng sống), `listings`, `market_metrics`, `listing_stats`, `area_breakdowns`, `market_asset_stats`, `sellers`, `asset_nodes`, `area_sources`, `dq_check_results`, 7 bảng `airdna_*` | `lib/queries.ts`, `lib/offers-public.ts`, `lib/deals.ts`, `api/v1/{listings,markets,asset-stats,offers,deals}`, `data-api/src/routes/{markets,listings,deals,coverage}` | chép, đúng cột và lọc dòng như sync-cloud (CLOUD_ALLOW, PII_EXCLUDE, SOURCE_EXCLUDE, che tên/SĐT mang tên nguồn, bảng con theo cha sống); `airdna_*` đổi tên `ref_calib_*` như cloud, M5 chạy app với `RENAME_REFCALIB=1` |
| View | `v_ruler_p2` (034) và view khác của `public` | `lib/deals.ts` THUOC_CUNG_LOAI | có sẵn trong lược đồ chép |
| Tầng A — hồ sơ user app | `users`, `sessions`, `machine_tokens`, `user_events`, `user_profile`, `saved_markets` | `lib/auth.ts`, `actions.ts`, `api/v1/user-events` | lược đồ có, 0 dòng; M5 tạo tài khoản thử riêng |
| Tầng A — tên nguồn thật | `source_registry` (`real_name`, `source_ids`) | `lib/mask-source-names.ts`, `offers-public.ts`, `getMarketFreshness` | Hỏi-2: chỉ mã S0x + vai trò, hai cột tên để NULL |
| Thô `stg_*` | `stg_chotot_ads` 1,25 GB, `stg_calendar` 755 MB, `stg_s10_stock`, `stg_zalo_posts` 180 MB, `stg_s08_inventory`, `stg_s16_*`, `stg_abnb_*`… | `stg_zalo_posts`: `data-api/src/routes/deals.ts:99`; `stg_abnb_discovery`: `getSupplyHistory` | 0 dòng mọi `stg_*` (S02, S08 theo lời giao; các nguồn khác theo luật 6: bảng thô mang tên nguồn). Hỏi-3 cho `stg_zalo_posts` |
| Thô khác | `airbnb_snapshots`, `media`, `field_assertions`, `sale_offer_records`, `review_queue`, `ops_audit`, `ai_calls` | chỉ Ops hoặc pipeline | 0 dòng |
| Ngày sinh, giới tính người bán | không có cột nào tên khớp `dob|birth|gender|ngay_sinh|gioi_tinh` trong `public` hôm nay | — | bộ soát chặn theo tên cột và khoá JSON, để bảng mới thêm sau không lọt |
| Danh bạ, Ops | `registry_aliases`, `units`, `parties`, `party_roles`, `eval_*`… | chỉ `/ops/**` | 0 dòng (ngoài phạm vi: M5 không chạy Ops) |

Các ô bỏ: Ops trên M5 — ngoài phạm vi, vì lời giao chỉ nêu API + Invest.

## 2. Cách làm

`scripts/ban-chep-da-loc.mjs` (Node, mượn `pg` của app như `scripts/` khác):

1. Mở DB máy thu trong MỘT giao dịch `REPEATABLE READ READ ONLY` (cùng snapshot với sync-cloud).
2. Dựng DB đích `oneinvest_m5_<ngày>` trên :5433: lược đồ `public` lấy bằng `pg_dump --schema-only -n public` của DB máy thu
   (không seed), bỏ `pg_cron`.
3. Với mỗi bảng FILL: dùng chính `selectList`, `localReadSql`, `childFilterSql`, `maskedSourceExpr` của sync-cloud (import, không
   chép lại) → INSERT vào đích theo thứ tự cha trước con; `airdna_*` đổi tên `ref_calib_*` bằng `RENAME`.
4. `source_registry`: chỉ mã và vai trò (theo Hỏi-2).
5. **Bộ soát tầng A trên DB ĐÍCH** (đọc lại đích, không tin bước chép): (a) mọi giá trị text/json/mảng text của mọi bảng `public`
   đích, và lược đồ đích (thân hàm, định nghĩa view, COMMENT, DEFAULT, CHECK, nhãn enum) không chứa token tên nguồn thật đọc từ `source_registry` máy thu (`docSourceNameEntries` + `guardValues` của `tier-a-guard.mjs`, cùng
   lõi với sync-cloud); (b) bảng cấm 0 dòng: hồ sơ user app, `stg_*`, `airbnb_snapshots`, `review_queue`; (c) `source_registry` đích
   không có `real_name`/`source_ids` khác NULL; (d) không cột tên khớp ngày sinh/giới tính có giá trị, không khoá JSON khớp; (e) không
   schema nào ngoài `public` + schema của PostGIS. Trúng một mục → thoát 1, nêu mục và bảng (không in giá trị), xoá DB đích, không
   ghi dump.
   Ngoài FILL chỉ `source_registry` và bảng của PostGIS (`spatial_ref_sys`) được có dòng.
6. Xanh → `pg_dump -Fc` ra `state/ban-chep-m5/oneinvest-m5-<ngày>.dump` (gitignored) + `ke.json`: số dòng mỗi bảng, sha256 tệp,
   sha mã, thời điểm snapshot. Chạy lại cùng ngày thay thế.
7. `--kiem <tệp>`: khôi phục dump vào DB tạm, chạy lại bộ soát bước 5 và so số dòng với `ke.json`, rồi xoá DB tạm.

DB máy thu chỉ đọc; không ghi cloud; không chuyển tệp đi đâu.

## 3. Quyết định cần người (lên thẻ)

- Hỏi-1 (khó đảo): chuyển bản chép sang M5 qua LAN thế nào, ai chạy.
- Hỏi-2: `source_registry` trên bản chép chỉ mã S0x + vai trò.
- Hỏi-3: `stg_zalo_posts` không chép — đoạn chữ bài trong `/v1/deals` của data-api rỗng trên M5.
- Hỏi-4: lược đồ đích đổ từ DB máy thu (khớp app đang chạy, kèm soát DDL) hay dựng từ `db/migrations` (đã review, phải dọn seed).

## 4. Giới hạn đã biết

- M5 không có Ops và không có tài khoản user thật.
- Chữ đã che tên nguồn đi theo luật che của sync-cloud; tên nguồn mà bộ che chưa biết thì bộ soát (cùng lõi) cũng không biết.
