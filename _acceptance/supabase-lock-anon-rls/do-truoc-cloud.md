# Đo Supabase smqpqiigzulwpmrsrhci — 2026-10-23T02:29:08Z (chỉ đọc, không dữ liệu)

## Tóm tắt (đối tượng do postgres làm chủ)

- rel_owned=38
- rel_api_open=38
- tables_rls_off=36
- views_definer=2
- seq_api_open=4
- svc_tables_missing=0
- fn_owned=0
- fn_api_exec=0
- defacl_api=3
- defacl_fn_public=true
- foreign_api_open=3

## Bảng quyền public

Chữ quyền: r SELECT · a INSERT · w UPDATE · d DELETE · D TRUNCATE (sequence: U USAGE). RLS: on/OFF; view: definer/invoker.

| quan hệ | loại | chủ | RLS | anon | authenticated | service_role |
|---|---|---|---|---|---|---|
| (hàm public) | F | supabase_admin | - | X 744/744 | X 744/744 | X 744/744 |
| airbnb_snapshots | r | postgres | OFF | rawdD | rawdD | rawdD |
| area_breakdowns | r | postgres | OFF | rawdD | rawdD | rawdD |
| area_sources | r | postgres | OFF | rawdD | rawdD | rawdD |
| areas | r | postgres | OFF | rawdD | rawdD | rawdD |
| asset_nodes | r | postgres | OFF | rawdD | rawdD | rawdD |
| dq_check_results | r | postgres | OFF | rawdD | rawdD | rawdD |
| listing_stats | r | postgres | OFF | rawdD | rawdD | rawdD |
| listings | r | postgres | OFF | rawdD | rawdD | rawdD |
| market_asset_stats | r | postgres | OFF | rawdD | rawdD | rawdD |
| market_metrics | r | postgres | OFF | rawdD | rawdD | rawdD |
| nights | r | postgres | OFF | rawdD | rawdD | rawdD |
| ops_audit | r | postgres | OFF | rawdD | rawdD | rawdD |
| ops_heartbeat | r | postgres | OFF | rawdD | rawdD | rawdD |
| properties | r | postgres | OFF | rawdD | rawdD | rawdD |
| property_offers | r | postgres | OFF | rawdD | rawdD | rawdD |
| ref_calib_future_daily | r | postgres | OFF | rawdD | rawdD | rawdD |
| ref_calib_listings | r | postgres | OFF | rawdD | rawdD | rawdD |
| ref_calib_market_metrics | r | postgres | OFF | rawdD | rawdD | rawdD |
| ref_calib_markets | r | postgres | OFF | rawdD | rawdD | rawdD |
| ref_calib_scores | r | postgres | OFF | rawdD | rawdD | rawdD |
| ref_calib_sub_monthly | r | postgres | OFF | rawdD | rawdD | rawdD |
| ref_calib_submarket_metrics | r | postgres | OFF | rawdD | rawdD | rawdD |
| sale_offers | r | postgres | OFF | rawdD | rawdD | rawdD |
| saved_markets | r | postgres | OFF | rawdD | rawdD | rawdD |
| sellers | r | postgres | OFF | rawdD | rawdD | rawdD |
| sessions | r | postgres | OFF | rawdD | rawdD | rawdD |
| spatial_ref_sys | r | supabase_admin | OFF | rawdD | rawdD | rawdD |
| stg_abnb_discovery | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_abnb_listings | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_abnb_nights | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_calendar | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_geojson | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_listings | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_neighbourhoods | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_osm_boundaries | r | postgres | OFF | rawdD | rawdD | rawdD |
| stg_zalo_posts | r | postgres | OFF | rawdD | rawdD | rawdD |
| users | r | postgres | OFF | rawdD | rawdD | rawdD |
| asset_nodes_id_seq | S | postgres | - | Urw | Urw | Urw |
| dq_check_results_id_seq | S | postgres | - | Urw | Urw | Urw |
| ops_audit_id_seq | S | postgres | - | Urw | Urw | Urw |
| properties_id_seq | S | postgres | - | Urw | Urw | Urw |
| geography_columns | v | supabase_admin | definer | rawdD | rawdD | rawdD |
| geometry_columns | v | supabase_admin | definer | rawdD | rawdD | rawdD |
| v_ruler_p2 | v | postgres | definer | rawdD | rawdD | rawdD |
| v_ruler_p2_area | v | postgres | definer | rawdD | rawdD | rawdD |

## Default privileges (schema public + toàn cục)

| role tạo | schema | loại | ACL |
|---|---|---|---|
| postgres | public | f | `{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| postgres | public | r | `{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}` |
| postgres | public | S | `{postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres}` |
| supabase_admin | public | f | `{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}` |
| supabase_admin | public | r | `{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}` |
| supabase_admin | public | S | `{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}` |

## PostgREST (HEAD, chỉ mã trạng thái + số dòng trong Content-Range)

| bảng | anon | service_role |
|---|---|---|
| sessions | 200 (17 dòng) | 200 (17 dòng) |
| users | 200 (1 dòng) | 200 (1 dòng) |
| sale_offers | 206 (9845 dòng) | 206 (9845 dòng) |
| sellers | 206 (1043 dòng) | 206 (1043 dòng) |
| saved_markets | 200 (0 dòng) | 200 (0 dòng) |
| properties | 206 (8270 dòng) | 206 (8270 dòng) |
| ops_audit | 200 (195 dòng) | 200 (195 dòng) |
| areas | 200 (372 dòng) | 200 (372 dòng) |
| market_metrics | 200 (912 dòng) | 200 (912 dòng) |
| v_ruler_p2 | 200 (238 dòng) | 200 (238 dòng) |

## Kỳ vọng sau 037

FAIL cloud: rel_api_open=38 (cần 0)
FAIL cloud: tables_rls_off=36 (cần 0)
FAIL cloud: views_definer=2 (cần 0)
FAIL cloud: seq_api_open=4 (cần 0)
PASS cloud: svc_tables_missing=0
PASS cloud: fn_api_exec=0
FAIL cloud: defacl_api=3 (cần 0)
FAIL cloud: defacl_fn_public=true (cần false)
check-supabase-lock cloud: CÓ LỖI
