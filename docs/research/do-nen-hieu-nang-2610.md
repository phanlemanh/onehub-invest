# Đo nền hiệu năng — DB local + 5 trang chính (27/10/2026)

Hàng `do-nen-hieu-nang` (Mạnh giao 27/10): bật pg_stat_statements ở DB local, đo p50/p95 thời gian tải 5 trang chính (Invest +
Ops) và 10 truy vấn chậm nhất, ghi số nền; **ngưỡng chỉ là đề xuất** (mục cuối), đưa vào luật hay không là Mạnh quyết.
Số thô: [`do-nen-hieu-nang-2610.json`](do-nen-hieu-nang-2610.json). Đo lại: `node scripts/do-nen-hieu-nang/do.mjs --luot 20
--ra <tệp.json>` (cần `cd app && npx next build` trước).

## Máy và dữ liệu

- Máy: Darwin 27.0.0, Apple M5 Max, 18 nhân, 128 GB RAM, Node v24.21.0.
- DB: PostgreSQL 17.7 (Debian 17.7-3.pgdg12+1) (container `one-invest-db`, :5433), cỡ DB 2973 MB; `max_connections` 200,
  `shared_buffers` 256 MB, `work_mem` 16 MB; `shared_preload_libraries` pg_cron, pg_stat_statements.
- App: build prod `next build` (BUILD_ID `ohbBBHoFHUUcfK5Kqvt8o`), chạy `next start` cổng 3463, trên nhánh tách từ `origin/main` 1453f30e.
- Lượt đo: reset pg_stat_statements 2026-10-27T07:36:52.311Z, đo 2026-10-27T07:36:52.330Z → 2026-10-27T07:36:55.611Z.

## Cách đo

- Năm trang: Invest `/vn` (Finder), `/vn/hanoi` (Insight thị trường), `/vn/hanoi/listings` (Duyệt listing); Ops `/ops` (Tổng quan
  vận hành), `/ops/data-flow` (Dòng chảy dữ liệu). Hai trang Ops đăng nhập bằng tài khoản đo riêng `perf-test@local.test` (chỉ DB
  local, xoay mật khẩu mỗi lượt và giữ trong bộ nhớ), không đụng tài khoản ops thử mà các worktree khác dùng.
- Mỗi trang 2 lượt làm nóng (không tính) rồi 20 lượt tuần tự, một client. **TTFB** = tới khi có header; **tổng** =
  tới khi đọc hết HTML (server đã dựng xong nội dung). Lượt chỉ được tính khi HTTP 200 và `<title>` đúng trang, nên trang lỗi
  hay bị đẩy về `/login` không lọt vào số.
- `pg_stat_statements_reset()` ngay trước lượt làm nóng đầu tiên, nên cửa sổ truy vấn chỉ gồm khoảng 3 giây đo. Số lần gọi của mọi
  truy vấn là bội của 22 (2 làm nóng + 20 lượt), tức không có truy vấn của job nền nào lọt vào.
- Câu truy vấn và tên bảng đã che tên nguồn thật bằng mã S0x (`maskSourceNames`, SPL tầng A), nên một số tên bảng hiện dạng
  `stg_S0x_…`.

## Thời gian tải 5 trang (ms, 20 lượt)

| Trang | Cổng | Lượt đúng trang | TTFB p50 | TTFB p95 | Tổng p50 | Tổng p95 | HTML (KB) |
|---|---|---|---|---|---|---|---|
| `/vn` | Invest | 20/20 | 33.2 | 38.8 | 34.9 | 40.5 | 196 |
| `/vn/hanoi` | Invest | 20/20 | 34.9 | 37.6 | 38.6 | 42.8 | 426 |
| `/vn/hanoi/listings` | Invest | 20/20 | 8.5 | 11.9 | 14.9 | 17.4 | 509 |
| `/ops` | Ops | 20/20 | 21.1 | 22.5 | 21.9 | 23.3 | 126 |
| `/ops/data-flow` | Ops | 20/20 | 4.6 | 5.4 | 34.4 | 38.6 | 474 |

`/vn/hanoi/listings` và `/ops/data-flow` stream: header về sớm (TTFB vài ms), phần còn lại tới theo từng khối, nên con số
**tổng** mới là thời gian dựng trang. Trang nặng nhất là `/vn/hanoi` (tổng p95 42.8 ms).

## 10 truy vấn theo tổng thời gian

| # | Gọi | Tổng ms | TB ms | Max ms | Dòng trả | Câu (120 ký tự đầu) |
|---|---|---|---|---|---|---|
| Q1 | 22 | 420.5 | 19.11 | 19.5 | 3036 | `SELECT id, name, ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, $2)) AS geojson, ST_Y(ST_Centroid(geom)) AS lat, ST_X(ST…` |
| Q2 | 44 | 362.2 | 8.23 | 16 | 1584 | `WITH a AS ( SELECT a.id, a.name, a.parent_id, p.name AS parent_name, CASE WHEN $2 THEN ST_AsGeoJSON(ST_SimplifyPreserveT…` |
| Q3 | 22 | 344.7 | 15.67 | 16.9 | 7216 | `SELECT o.offer_id, o.source, o.kind, o.property_type, o.price_vnd, o.area_m2, o.bedrooms, o.confidence, o.n_reposts, o.f…` |
| Q4 | 22 | 206.3 | 9.38 | 15.4 | 44 | `WITH a AS ( SELECT a.id, a.name, a.parent_id, p.name AS parent_name, CASE WHEN $2 THEN ST_AsGeoJSON(ST_SimplifyPreserveT…` |
| Q5 | 22 | 177.7 | 8.08 | 9.1 | 44 | `SELECT s.city, max(s.collected_at) AS last FROM stg_S06_ads c JOIN S01_snapshots s USING (snapshot_id) WHERE s.source = …` |
| Q6 | 22 | 101.9 | 4.63 | 5 | 22 | `SELECT s.city, max(s.collected_at) AS last FROM stg_S03_posts p JOIN S01_snapshots s USING (snapshot_id) WHERE p.agent_i…` |
| Q7 | 22 | 45.6 | 2.07 | 2.3 | 22814 | `SELECT o.offer_id, p.snapshot_id, p.media, p.media_files FROM sale_offers o CROSS JOIN LATERAL unnest(o.post_ids) WITH O…` |
| Q8 | 66 | 30.2 | 0.46 | 0.7 | 22308 | `SELECT a.id, a.region_type, a.name, a.parent_id, p.name AS parent_name FROM areas a LEFT JOIN areas p ON p.id = a.parent…` |
| Q9 | 22 | 28.6 | 1.3 | 1.5 | 352 | `SELECT d.snapshot_id, to_char(min(a.collected_at), $2) AS date, array_agg(DISTINCT d.listing_id) AS ids FROM stg_abnb_di…` |
| Q10 | 22 | 27 | 1.23 | 1.4 | 6600 | `WITH ls AS ( SELECT l.*, a.name AS area_name, a.region_type FROM listings l JOIN areas a ON a.id = l.area_id WHERE (a.id…` |

- 3 câu hình học khu vực (`ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, …))` trên `areas`, tính lúc tải trang) gộp
  989 ms, khoảng 57% tổng 1745 ms của 10 câu đầu. Đây là chỗ đáng precompute nhất
  (luật 10): Q1 tốn trung bình 19.11 ms mỗi lượt.
- Kế tiếp là danh sách căn giá tốt ở `/ops` và độ tươi theo nguồn (`max(collected_at)` trên bảng stg).

### 10 truy vấn theo thời gian trung bình (gọi ≥ 3)

| # | Gọi | TB ms | Max ms | Câu (100 ký tự đầu) |
|---|---|---|---|---|
| T1 | 22 | 19.11 | 19.5 | `SELECT id, name, ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, $2)) AS geojson, ST_Y(ST_Centroid(ge…` |
| T2 | 22 | 15.67 | 16.9 | `SELECT o.offer_id, o.source, o.kind, o.property_type, o.price_vnd, o.area_m2, o.bedrooms, o.confiden…` |
| T3 | 22 | 9.38 | 15.4 | `WITH a AS ( SELECT a.id, a.name, a.parent_id, p.name AS parent_name, CASE WHEN $2 THEN ST_AsGeoJSON(…` |
| T4 | 44 | 8.23 | 16 | `WITH a AS ( SELECT a.id, a.name, a.parent_id, p.name AS parent_name, CASE WHEN $2 THEN ST_AsGeoJSON(…` |
| T5 | 22 | 8.08 | 9.1 | `SELECT s.city, max(s.collected_at) AS last FROM stg_S06_ads c JOIN S01_snapshots s USING (snapshot_i…` |
| T6 | 22 | 4.63 | 5 | `SELECT s.city, max(s.collected_at) AS last FROM stg_S03_posts p JOIN S01_snapshots s USING (snapshot…` |
| T7 | 22 | 2.07 | 2.3 | `SELECT o.offer_id, p.snapshot_id, p.media, p.media_files FROM sale_offers o CROSS JOIN LATERAL unnes…` |
| T8 | 22 | 1.3 | 1.5 | `SELECT d.snapshot_id, to_char(min(a.collected_at), $2) AS date, array_agg(DISTINCT d.listing_id) AS …` |
| T9 | 22 | 1.23 | 1.4 | `WITH ls AS ( SELECT l.*, a.name AS area_name, a.region_type FROM listings l JOIN areas a ON a.id = l…` |
| T10 | 22 | 0.86 | 1.1 | `WITH l AS ( SELECT count(*)::int AS n FROM listings WHERE area_id = $1 OR area_id LIKE $1 \|\| $3 ), s…` |

## Thống kê bảng: bộ đếm trống ở 5 bảng lớn

15 bảng `public` lớn nhất, chụp lúc đo (cỡ gồm chỉ mục; `reltuples` là ước lượng số dòng của planner):

| Bảng | Cỡ | n_live_tup | reltuples | ANALYZE gần nhất |
|---|---|---|---|---|
| `nights` | 1322 MB | 0 | 215.400 | — |
| `stg_calendar` | 720 MB | 0 | 11.288.353 | — |
| `sale_offer_records` | 268 MB | 13795 | 13.795 | 2026-10-27 00:56 |
| `stg_S06_ads` | 174 MB | 22497 | 22.497 | 2026-10-26 22:35 |
| `stg_abnb_listings` | 123 MB | 0 | 853 | — |
| `stg_listings` | 82 MB | 0 | 30.922 | — |
| `stg_abnb_nights` | 62 MB | 0 | 305.505 | — |
| `S02_listings` | 52 MB | 79197 | 79.197 | 2026-10-26 12:49 |
| `field_assertions` | 43 MB | 4149 | 4.149 | 2026-10-27 00:56 |
| `areas` | 24 MB | 338 | 338 | 2026-10-26 07:22 |
| `properties` | 20 MB | 19651 | 19.651 | 2026-10-26 22:46 |
| `stg_S03_posts` | 10 MB | 14906 | 14.906 | 2026-10-27 05:01 |
| `stg_S04_boundaries` | 9008 kB | 579 | 579 | — |
| `spatial_ref_sys` | 7144 kB | 0 | 8.500 | — |
| `property_offers` | 5344 kB | 21176 | 20.470 | 2026-10-26 22:42 |

5 bảng lớn có `n_live_tup` 0 và không có lần ANALYZE nào trong `pg_stat_user_tables` (đếm thật bằng `count(*)` lúc
07:29Z):

- `nights` 1322 MB: `reltuples` 215.400, đếm thật 217.540 dòng
- `stg_calendar` 720 MB: `reltuples` 11.288.353, đếm thật 11.286.530 dòng
- `stg_abnb_listings` 123 MB: `reltuples` 853, đếm thật 853 dòng
- `stg_listings` 82 MB: `reltuples` 30.922, đếm thật 30.922 dòng
- `stg_abnb_nights` 62 MB: `reltuples` 305.505, đếm thật 305.505 dòng

**Gốc:** bộ đếm thống kê đã bị xoá. Đây là bộ đếm hoạt động `pg_stat`, không phải thống kê của planner. Các bảng này không ghi
thêm kể từ lần xoá, nên autovacuum không bao giờ đạt ngưỡng để tự ANALYZE lại hay đếm lại. Lần khởi động lại 27/10 không gây ra
chuyện này: các bảng có ghi vẫn giữ `last_autoanalyze` ngày 26/10. Lần xoá xảy ra trước đó (tắt không sạch hoặc khôi phục), và log
container không còn để chứng.

**Ảnh hưởng đo được:**
- Planner **không** mù: `reltuples` ở bảng trên khớp số dòng đếm thật, và `pg_statistic` có thống kê cột cho các bảng này.
- Cái thật sự mù là autovacuum, vì không thấy dòng chết. `nights` có 217.540 dòng (khoảng 64 byte mỗi dòng, tức khoảng 14 MB dữ
  liệu) nhưng heap 724 MB và chỉ mục 598 MB, **phình khoảng 50 lần**. Không trang nào trong 5 trang đọc thẳng `nights` (luật
  precompute qua `listing_stats`), nên số trang ở trên không chịu ảnh hưởng. Pipeline đọc `nights` thì có.

**Lược đồ test sót:** 22 lược đồ `dc_*` / `freshness_test_*` với 226 bảng, tổng khoảng 6,3 MB. Nhỏ, nhưng làm rối
`pg_stat_user_tables` và các lần soát.

Hàng này không sửa gì ở trên. Đó là đề xuất 3 và 4 dưới đây.

## Khởi động lại DB để bật pg_stat_statements

- Sao lưu TRƯỚC khởi động lại: `pg_dump -Fc` 07:17:40Z → 07:17:51Z, `pg_restore -l` đọc 325 mục dữ liệu bảng. Bản giữ ở
  `research-local/backup-oneinvest-2710.dump` (160.181.966 byte, gitignored), chép sang lúc 07:21:03Z nên giờ sửa tệp là 07:21.
  sha256 ghi ở design doc `docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md`. Giữ tới khi hàng chuyển dữ liệu vào
  volume xong.
- `ALTER SYSTEM` (preload pg_cron + pg_stat_statements, `max_connections` 200) rồi `docker restart one-invest-db` lúc 07:18:15Z.
  Không `compose up/down`, không sửa `db/docker-compose.yml`, vì dữ liệu DB đang nằm trong lớp ghi của container chứ không trong
  volume. Tạo lại container là mất dữ liệu, nên việc chuyển vào volume là một hàng riêng.
- Postgres không lên vì `ALTER SYSTEM` ghi cả danh sách preload thành một chuỗi. Lúc 07:20:08Z phiên P4 **tự sửa** dòng ấy trong
  `postgresql.auto.conf` và khởi động lại, không hỏi giám sát trước. Lời dặn «đừng tự gỡ» tới sau đó (07:20:55Z). DB lên `healthy`
  07:20:13Z, tức dừng khoảng 2 phút. 285 bảng trước và sau, số dòng bảng lớn khớp. Lượt cloud-sync kế tiếp (07:25Z) xanh.

## Giới hạn đo

- Một máy rất mạnh (Apple M5 Max, 18 nhân), DB cùng máy, không có độ trễ mạng. Số này **không** dự báo được prod (Vercel +
  Supabase), chỉ làm nền để bắt hồi quy trên cùng máy.
- Một client tuần tự: chưa đo tải đồng thời hay tranh kết nối.
- Chỉ đo HTML phía server: không đo JS, hydrate, ảnh, bản đồ hay LCP trong trình duyệt. Chọn thước này và chọn 5 trang là câu
  hỏi đang chờ Mạnh (Cổng Phạm vi của hàng).
- Cache ấm (2 lượt làm nóng), cùng một bộ tham số mỗi trang. Lượt đầu sau khởi động không có trong số.
- DB dùng chung với job nền (cloud-sync, launchd). Cửa sổ 3 giây không lẫn truy vấn nền, nhưng CPU máy vẫn có thể đang bận.

## Đề xuất ngưỡng (chờ Mạnh quyết, chưa vào luật)

Đây là đề xuất chờ Mạnh quyết. Hàng này **không** sửa `AGENTS.md` hay luật nào. Mỗi ngưỡng kèm số nền và cái giá nếu chọn sai.

1. **Trang:** trên build prod local (script này, 20 lượt), **tổng p95 ≤ 100 ms** cho mỗi trang trong 5 trang. Số nền cao nhất
   là 42.8 ms (`/vn/hanoi`), tức chừa hơn 2 lần. Ngưỡng này bắt được hồi quy lớn (truy vấn N+1, bỏ
   precompute, gộp `nights` lúc tải trang) nhưng bỏ lọt hồi quy nhỏ dưới 2 lần. Chặt hơn (60 ms) thì dễ đỏ vì máy bận.
2. **Truy vấn:** trong lượt đo 5 trang, **không câu nào có thời gian trung bình > 50 ms**. Số nền cao nhất là 19.11 ms
   (hình học khu vực). Câu vượt ngưỡng phải precompute ở `pipeline/sql` (luật 10) hoặc có chỉ mục.
3. **Thống kê bảng:** bảng `public` > 50 MB phải có `last_analyze` hoặc `last_autoanalyze`, và pipeline chạy `ANALYZE` sau mỗi lượt
   nạp lớn. Việc trước mắt cần Mạnh duyệt: ANALYZE một lần các bảng trên, đo phình `nights` (pgstattuple), rồi quyết
   `VACUUM FULL` (khoá bảng) hay nạp lại.
4. **Dọn lược đồ test:** test tạo lược đồ `dc_*` / `freshness_test_*` thì phải tự xoá khi xong. Kèm một lần dọn 22 lược đồ còn sót.

Chưa đề xuất ngưỡng cho cloud: chưa có số đo ở đó.
