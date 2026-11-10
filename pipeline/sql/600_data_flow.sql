-- 600_data_flow.sql — DF1 `dong-chay-len-cloud`: làm tươi data_flow_snapshot (migration 051), MỘT định nghĩa số
-- «Dòng chảy dữ liệu» cho cả trang máy thu lẫn khối `dataFlow` lên cloud (luật 10, ADR-0014).
-- Chạy mỗi lượt cloud-sync, TRƯỚC push-ops-facts (scripts/cloud-sync.sh). Idempotent: xoá rồi ghi lại đúng ba dòng
-- (7d · 30d · all) trong một giao dịch. CHỈ ghi data_flow_snapshot; bảng nạp và bảng tin chỉ được đọc.
-- Mốc = now() của lượt làm tươi; ngày theo giờ VN. Phép gộp chuyển nguyên từ getDataFlow (app/src/lib/data-flow-
-- queries.ts) trước DF1: bài thử theo ba dấu của pipeline/lib/test-posts.mjs, năm trường lõi của lib/data-level.ts,
-- S06 «đọc được» = min(tin, quảng cáo) (chưa có khoá nối ngược), chuỗi ngày 30 ngày gần nhất cho mọi cửa sổ.
-- Tên không mang tiền tố lược đồ: phép đo chạy tệp này trên lược đồ tạm mà không chạm bảng thật.
-- Mốc «hôm nay» = `now()`; phép đo đặt `SET oneinvest.flow_now = '<ISO>'` trong phiên để ghim ngày (trống → now()).
-- Năm đoạn định nghĩa đứng trong cặp chú thích `/*<<<TÊN*/ … /*TÊN>>>*/` (IS_TEST · COMPLETE · ENRICH · LOCATED_PENDING ·
-- UNIQUE_ID) để bài kiểm rút
-- đúng câu thật thay vì chép tay.
-- DF6 (`bai-nhan-tru-bai-chi-anh`): nhánh của bài S03 (ảnh đã ghép vào tin · Yêu cầu · ảnh chưa ghép) KHÔNG tính ở đây —
-- bộ chạy refresh-data-flow.mjs tính bằng hàm của transform (pipeline/lib/nhanh-bai-s03.mjs), nạp bảng tạm
-- `flow_s03_branch` của phiên rồi bật `oneinvest.flow_branch`. Cờ tắt (600 chạy trần) → khối KHÔNG có ba khoá nhánh, giống
-- hệt khối trước DF6 (trang đọc khoá vắng thành null — normalizeFacts).
-- «Đọc được» thắng mọi nhánh: bài trong post_ids của tin không bao giờ vào nhánh mới.

CREATE TEMP TABLE IF NOT EXISTS flow_s03_branch (post_id text PRIMARY KEY, branch text NOT NULL);

BEGIN;

DELETE FROM data_flow_snapshot;

WITH
-- Mốc: ngày VN hôm nay; cửa sổ bắt đầu ngày (hôm nay − n + 1); chuỗi ngày 30 ngày gần nhất.
today AS (
  SELECT (coalesce(nullif(current_setting('oneinvest.flow_now', true), '')::timestamptz, now())
          AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS d
),
win AS (
  SELECT w.time_window, w.n,
         CASE WHEN w.n IS NULL THEN NULL ELSE (SELECT d FROM today) - (w.n - 1) END AS since_day
  FROM (VALUES ('7d', 7), ('30d', 30), ('all', NULL::int)) AS w(time_window, n)
),
series AS (SELECT (SELECT d FROM today) - 29 AS from_day),
src AS (SELECT * FROM (VALUES ('S03', 1), ('S05', 2), ('S06', 3)) AS s(source, ord)),
-- Nhánh bài S03 chỉ có nghĩa khi bộ chạy đã nạp (cờ bật). Nối THẲNG bảng tạm (khoá chính post_id) — bọc nó trong CTE
-- thì planner mất chỉ mục và lặp lồng hàng tỉ dòng (đo 09/11: 1 giây thành hơn 3 phút).
flag AS (SELECT coalesce(current_setting('oneinvest.flow_branch', true), '') = 'on' AS on_),
-- Bài S03/S05: bản chụp mới nhất của mỗi post_id; nguồn theo tác tử; dấu bài thử.
p AS (
  SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, group_name, posted_at
  FROM stg_zalo_posts
  ORDER BY post_id, captured_at DESC
),
t AS (
  SELECT post_id, posted_at, group_name,
         CASE WHEN agent_id = 'apify-facebook' THEN 'S05' ELSE 'S03' END AS src,
         (/*<<<IS_TEST*/split_part(snapshot_id, '__', 2) ~* '(mock|test|e2e)' OR split_part(snapshot_id, '__', 2) = 'example'
          OR coalesce(agent_id, '') ~* '^(e2e|test|mock)' OR btrim(coalesce(group_name, '')) ~* '^test($|[^[:alpha:]])'/*IS_TEST>>>*/) AS is_test
  FROM p
),
used AS (
  SELECT DISTINCT unnest(post_ids) AS post_id, source FROM sale_offers WHERE source IN ('S03', 'S05')
),
link AS (
  SELECT DISTINCT unnest(post_ids) AS post_id, offer_id, source FROM sale_offers WHERE source IN ('S03', 'S05')
),
-- Theo (nguồn, ngày VN) cho mọi thời gian — cửa sổ chỉ là bộ lọc ngày.
posts_daily AS (
  SELECT t.src AS source, (t.posted_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS d,
         count(*) FILTER (WHERE NOT t.is_test) AS received,
         count(*) FILTER (WHERE t.is_test) AS test_rejected,
         count(*) FILTER (WHERE NOT t.is_test AND u.post_id IS NOT NULL) AS readable,
         count(*) FILTER (WHERE NOT t.is_test AND u.post_id IS NULL AND b.branch = 'anh-da-ghep') AS image_merged,
         count(*) FILTER (WHERE NOT t.is_test AND u.post_id IS NULL AND b.branch = 'yeu-cau') AS inquiry,
         count(*) FILTER (WHERE NOT t.is_test AND u.post_id IS NULL AND b.branch = 'anh-chua-ghep') AS image_unmerged,
         max(t.posted_at) FILTER (WHERE NOT t.is_test)::text AS latest
  FROM t LEFT JOIN used u ON u.post_id = t.post_id AND u.source = t.src
         LEFT JOIN flow_s03_branch b ON b.post_id = t.post_id AND t.src = 'S03' AND (SELECT on_ FROM flag)
  GROUP BY 1, 2
),
ads_daily AS (
  SELECT 'S06'::text AS source, (list_time AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS d,
         count(*) AS received, max(list_time)::text AS latest
  FROM stg_chotot_ads GROUP BY 2
),
-- Mức nhận diện của tin (gan-can-dinh-danh-duy-nhat, FRAMING §3.4 viết lại 08/11). Gom cụm: tin nằm trong cụm
-- `properties` có từ hai tin SỐNG (view sale_offers) — cụm một tin không tính. Định vị (B2) và Gắn căn (B3) chỉ tính khi
-- tin khớp một nút của danh bạ; toà, trục, mã căn, số nhà trong chữ tin chỉ là «chờ khớp».
cum AS (
  SELECT po.property_id, count(DISTINCT po.offer_id) AS n
  FROM property_offers po JOIN sale_offers o ON o.offer_id = po.offer_id
  GROUP BY 1
),
-- Chưa có bảng nối tin → nút danh bạ (V9, chuỗi GC0–GC3): hai CTE rỗng này là chỗ DUY NHẤT phải đổi khi bộ gắn ra đời.
dinh_vi_link AS (SELECT NULL::text AS offer_id WHERE false),
gan_can_link AS (SELECT NULL::text AS offer_id WHERE false),
muc AS (
  SELECT o.offer_id,
         EXISTS (SELECT 1 FROM property_offers po JOIN cum c ON c.property_id = po.property_id
                 WHERE po.offer_id = o.offer_id AND c.n >= 2) AS clustered,
         EXISTS (SELECT 1 FROM dinh_vi_link l WHERE l.offer_id = o.offer_id) AS located,
         EXISTS (SELECT 1 FROM gan_can_link l WHERE l.offer_id = o.offer_id) AS unit_linked,
         coalesce(/*<<<LOCATED_PENDING*/nullif(btrim(o.block_raw), '') IS NOT NULL OR o.unit_number ~* 'xx'/*LOCATED_PENDING>>>*/, false) AS ghi_toa,
         coalesce(/*<<<UNIQUE_ID*/(nullif(btrim(o.block_raw), '') IS NOT NULL AND o.unit_number !~* 'xx'
                   AND o.unit_number NOT IN ('0', '1') AND length(o.unit_number) >= 3)
                  OR (o.street_number NOT IN ('0', '1') AND nullif(btrim(o.street_raw), '') IS NOT NULL
                   AND a.region_type = 'submarket')/*UNIQUE_ID>>>*/, false) AS dinh_danh
  FROM sale_offers o LEFT JOIN areas a ON a.id = o.area_id
  WHERE o.source IN ('S03', 'S05', 'S06')
),
offers_daily AS (
  SELECT o.source, (o.first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS d,
         count(*) AS offers,
         count(*) FILTER (WHERE m.clustered) AS clustered,
         count(*) FILTER (WHERE m.located) AS located,
         count(*) FILTER (WHERE m.unit_linked) AS unit_linked,
         count(*) FILTER (WHERE m.ghi_toa AND NOT m.located) AS located_pending,
         count(*) FILTER (WHERE m.dinh_danh AND NOT m.unit_linked) AS unique_id_pending,
         count(*) FILTER (WHERE m.located AND NOT m.unit_linked) AS deep_located,
         count(*) FILTER (WHERE m.clustered AND NOT m.located AND NOT m.unit_linked) AS deep_clustered,
         count(*) FILTER (WHERE o.area_id IS NOT NULL) AS with_ward,
         count(*) FILTER (WHERE o.property_type <> 'unknown') AS with_type,
         count(*) FILTER (WHERE o.price_vnd IS NOT NULL AND o.area_m2 IS NOT NULL) AS with_price_area,
         count(*) FILTER (WHERE o.confidence = 'high') AS high_conf,
         count(*) FILTER (WHERE /*<<<COMPLETE*/o.kind IS NOT NULL AND o.property_type IS NOT NULL AND o.property_type <> 'unknown'
                          AND o.price_vnd > 0 AND o.area_m2 > 0 AND o.area_id IS NOT NULL/*COMPLETE>>>*/) AS complete,
         count(*) FILTER (WHERE o.kind = 'sale') AS sale,
         count(*) FILTER (WHERE o.kind = 'rent_lt') AS rent_lt
  FROM sale_offers o JOIN muc m USING (offer_id)
  GROUP BY 1, 2
),
-- Tổng theo (cửa sổ, nguồn).
recv AS (
  SELECT w.time_window, x.source,
         sum(x.received) AS received, sum(x.readable) AS readable, sum(x.test_rejected) AS test_rejected, max(x.latest) AS latest,
         sum(x.image_merged) AS image_merged, sum(x.inquiry) AS inquiry, sum(x.image_unmerged) AS image_unmerged
  FROM win w
  JOIN (
    SELECT source, d, received, readable, test_rejected, latest, image_merged, inquiry, image_unmerged FROM posts_daily
    UNION ALL
    SELECT source, d, received, 0, 0, latest, 0, 0, 0 FROM ads_daily
  ) x ON w.since_day IS NULL OR x.d >= w.since_day
  GROUP BY 1, 2
),
offs AS (
  SELECT w.time_window, o.source,
         sum(o.offers) AS offers, sum(o.clustered) AS clustered, sum(o.located) AS located,
         sum(o.unit_linked) AS unit_linked, sum(o.located_pending) AS located_pending,
         sum(o.unique_id_pending) AS unique_id_pending, sum(o.deep_located) AS deep_located,
         sum(o.deep_clustered) AS deep_clustered, sum(o.with_ward) AS with_ward, sum(o.with_type) AS with_type,
         sum(o.with_price_area) AS with_price_area, sum(o.complete) AS complete, sum(o.high_conf) AS high_conf,
         sum(o.sale) AS sale, sum(o.rent_lt) AS rent_lt
  FROM win w JOIN offers_daily o ON w.since_day IS NULL OR o.d >= w.since_day
  GROUP BY 1, 2
),
sources_by_win AS (
  SELECT w.time_window,
         jsonb_agg(jsonb_build_object(
           'source', s.source,
           'received', coalesce(r.received, 0),
           'readable', CASE WHEN s.source = 'S06' THEN least(coalesce(f.offers, 0), coalesce(r.received, 0))
                            ELSE coalesce(r.readable, 0) END,
           'offers', coalesce(f.offers, 0),
           'clustered', coalesce(f.clustered, 0),
           'located', coalesce(f.located, 0),
           'unitLinked', coalesce(f.unit_linked, 0),
           'locatedPending', coalesce(f.located_pending, 0),
           'uniqueIdPending', coalesce(f.unique_id_pending, 0),
           'deepest', jsonb_build_object('unitLinked', coalesce(f.unit_linked, 0), 'located', coalesce(f.deep_located, 0),
                                         'clustered', coalesce(f.deep_clustered, 0)),
           'testRejected', coalesce(r.test_rejected, 0),
           'withWard', coalesce(f.with_ward, 0),
           'withType', coalesce(f.with_type, 0),
           'withPriceArea', coalesce(f.with_price_area, 0),
           'complete', coalesce(f.complete, 0),
           'highConfidence', coalesce(f.high_conf, 0),
           'latestAt', r.latest,
           'approx', s.source = 'S06'
         ) || CASE WHEN (SELECT on_ FROM flag) THEN jsonb_build_object(
           'imageMerged', coalesce(r.image_merged, 0), 'inquiry', coalesce(r.inquiry, 0),
           'imageUnmerged', coalesce(r.image_unmerged, 0)) ELSE '{}'::jsonb END ORDER BY s.ord) AS sources,
         jsonb_build_object('sale', coalesce(sum(f.sale), 0), 'rentLt', coalesce(sum(f.rent_lt), 0)) AS mix_base
  FROM win w CROSS JOIN src s
  LEFT JOIN recv r ON r.time_window = w.time_window AND r.source = s.source
  LEFT JOIN offs f ON f.time_window = w.time_window AND f.source = s.source
  GROUP BY 1
),
-- Chuỗi 30 ngày theo (nguồn, ngày) — giống nhau ở mọi cửa sổ; chỉ ngày có số.
days_raw AS (
  SELECT source, d, sum(received) AS received, sum(readable) AS readable, sum(offers) AS offers,
         sum(unit_linked) AS unit_linked, sum(image_merged) AS image_merged, sum(inquiry) AS inquiry,
         sum(image_unmerged) AS image_unmerged
  FROM (
    SELECT source, d, received, readable, 0 AS offers, 0 AS unit_linked, image_merged, inquiry, image_unmerged FROM posts_daily
    UNION ALL
    SELECT source, d, received, 0, 0, 0, 0, 0, 0 FROM ads_daily
    UNION ALL
    SELECT source, d, 0, 0, offers, unit_linked, 0, 0, 0 FROM offers_daily
  ) x
  WHERE d >= (SELECT from_day FROM series)
  GROUP BY 1, 2
),
days_json AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'source', source, 'day', d::text, 'received', received,
           'readable', CASE WHEN source = 'S06' THEN least(offers, received) ELSE readable END,
           'offers', offers, 'unitLinked', unit_linked
         ) || CASE WHEN (SELECT on_ FROM flag) THEN jsonb_build_object(
           'imageMerged', image_merged, 'inquiry', inquiry, 'imageUnmerged', image_unmerged) ELSE '{}'::jsonb END
         ORDER BY d, source), '[]'::jsonb) AS days
  FROM days_raw
),
-- Nhóm thu theo cửa sổ (đếm phân biệt nên tính riêng mỗi cửa sổ, không cộng theo ngày).
groups_by_win AS (
  SELECT w.time_window,
         coalesce(jsonb_agg(jsonb_build_object(
           'group', g.g, 'source', g.src, 'received', g.received, 'readable', g.readable, 'offers', g.offers,
           'latestAt', g.latest
         ) || CASE WHEN (SELECT on_ FROM flag) THEN jsonb_build_object(
           'imageMerged', g.image_merged, 'inquiry', g.inquiry, 'imageUnmerged', g.image_unmerged) ELSE '{}'::jsonb END ORDER BY g.src, g.g) FILTER (WHERE g.g IS NOT NULL), '[]'::jsonb) AS groups
  FROM win w
  LEFT JOIN LATERAL (
    -- Tên nhóm là tầng C; tên rỗng hay chính là mã nhóm (handler thiếu tên kênh ghi mã vào group_name) gộp vào
    -- «Nhóm chưa có tên» — khối lên cloud không mang mã nhóm (Hỏi-2 27/10, cùng luật khối s03).
    SELECT t.src,
           CASE WHEN btrim(coalesce(t.group_name, '')) = '' OR btrim(t.group_name) ~ '^[0-9]{15,}$'
                     OR btrim(t.group_name) LIKE 'group:%' THEN 'Nhóm chưa có tên'
                ELSE btrim(t.group_name) END AS g,
           count(DISTINCT t.post_id) AS received,
           count(DISTINCT t.post_id) FILTER (WHERE l.offer_id IS NOT NULL) AS readable,
           count(DISTINCT l.offer_id) AS offers,
           max(t.posted_at)::text AS latest,
           count(DISTINCT t.post_id) FILTER (WHERE l.offer_id IS NULL AND b.branch = 'anh-da-ghep') AS image_merged,
           count(DISTINCT t.post_id) FILTER (WHERE l.offer_id IS NULL AND b.branch = 'yeu-cau') AS inquiry,
           count(DISTINCT t.post_id) FILTER (WHERE l.offer_id IS NULL AND b.branch = 'anh-chua-ghep') AS image_unmerged
    FROM t LEFT JOIN link l ON l.post_id = t.post_id AND l.source = t.src
           LEFT JOIN flow_s03_branch b ON b.post_id = t.post_id AND t.src = 'S03' AND (SELECT on_ FROM flag)
    WHERE NOT t.is_test
      AND (w.since_day IS NULL OR t.posted_at >= (w.since_day::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'))
    GROUP BY 1, 2
  ) g ON TRUE
  GROUP BY 1
),
short_by_win AS (
  SELECT w.time_window,
         jsonb_build_object(
           'received', (SELECT count(DISTINCT listing_id) FROM stg_abnb_listings
                        WHERE w.since_day IS NULL OR fetched_at >= (w.since_day::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')),
           'stored', count(l.id), 'withWard', count(l.area_id), 'latestAt', max(l.last_seen)::text
         ) AS short_stay
  FROM win w
  LEFT JOIN listings l ON w.since_day IS NULL OR l.last_seen >= w.since_day
  GROUP BY w.time_window, w.since_day
),
enrich AS (SELECT /*<<<ENRICH*/count(*) AS n FROM enrichment_proposals WHERE status = 'queued'/*ENRICH>>>*/)
INSERT INTO data_flow_snapshot (time_window, computed_at, facts)
SELECT w.time_window, now(),
       jsonb_build_object(
         'sources', s.sources,
         'days', (SELECT days FROM days_json),
         'groups', g.groups,
         'shortStay', ss.short_stay,
         'mix', s.mix_base || jsonb_build_object('shortStay', ss.short_stay -> 'stored'),
         'enrichPending', (SELECT n FROM enrich)
       )
FROM win w
JOIN sources_by_win s USING (time_window)
JOIN groups_by_win g USING (time_window)
JOIN short_by_win ss USING (time_window);

COMMIT;
