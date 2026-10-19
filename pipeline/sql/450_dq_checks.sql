-- 450_dq_checks.sql — DQO (ADR-0007): 4 trụ freshness/volume/schema/distribution.
-- Chạy sau 410 trong weekly-collect. Mỗi check ghi 1 dòng vào dq_check_results
-- (migration 012). pass = trong ngưỡng; skip = chưa đủ dữ liệu để kết luận;
-- fail = mất ngưỡng — mỗi fail là một incident tiềm ẩn (quy tắc: mỗi incident
-- dữ liệu sinh ra đúng 1 check mới).

-- ============ (a) Schema/Domain: occupancy ∈ [0,1] ============
INSERT INTO dq_check_results (check_name, entity, status, detail)
SELECT 'occupancy-domain', 'market_metrics',
  CASE WHEN count(*) FILTER (WHERE occupancy < 0 OR occupancy > 1) = 0 THEN 'pass' ELSE 'fail' END,
  'vi phạm: ' || count(*) FILTER (WHERE occupancy < 0 OR occupancy > 1)
FROM market_metrics WHERE occupancy IS NOT NULL;

INSERT INTO dq_check_results (check_name, entity, status, detail)
SELECT 'occupancy-domain', 'listing_stats',
  CASE WHEN count(*) FILTER (WHERE occupancy < 0 OR occupancy > 1) = 0 THEN 'pass' ELSE 'fail' END,
  'vi phạm: ' || count(*) FILTER (WHERE occupancy < 0 OR occupancy > 1)
FROM listing_stats WHERE occupancy IS NOT NULL;

-- Dòng metric rỗng (mọi giá trị null) — phát hiện transform ghi row vô nghĩa
INSERT INTO dq_check_results (check_name, entity, status, detail)
SELECT 'not-null', 'market_metrics',
  CASE WHEN count(*) = 0 THEN 'pass' ELSE 'fail' END,
  'dòng toàn NULL: ' || count(*)
FROM market_metrics
WHERE adr IS NULL AND occupancy IS NULL AND revenue IS NULL AND listing_count IS NULL;

-- Area slug hợp lệ: id submarket không được kết thúc bằng '-' (dòng rác
-- 'vn-hanoi-' từng khiến matchPhuong khớp MỌI text vì includes('') luôn true)
INSERT INTO dq_check_results (check_name, entity, status, detail)
SELECT 'area-slug-valid', 'areas',
  CASE WHEN count(*) = 0 THEN 'pass' ELSE 'fail' END,
  'slug rỗng/lệch: ' || count(*)
FROM areas
WHERE region_type = 'submarket'
  AND (id ~ '-$' OR length(split_part(id, '-', 3)) = 0);

-- ============ (b) Volume: tổng items thu được 7 ngày gần nhất vs 7 ngày trước đó ============
-- Theo (city, source airbnb-listing). Mỗi run batch cap 25 theo thiết kế → so
-- batch-to-batch chỉ nhiễu; tổng cửa sổ tuần phản ánh volume thu thập thật.
INSERT INTO dq_check_results (check_name, entity, status, detail)
SELECT 'listing-volume', city,
  CASE
    WHEN prev_items = 0 THEN 'skip'
    WHEN cur_items >= prev_items * 0.8 THEN 'pass'
    ELSE 'fail'
  END,
  '7 ngày gần: ' || cur_items || ' vs 7 ngày trước: ' || prev_items
FROM (
  SELECT city,
    COALESCE(sum((manifest->'counts'->>'items')::int)
      FILTER (WHERE collected_at > now() - interval '7 days'), 0) AS cur_items,
    COALESCE(sum((manifest->'counts'->>'items')::int)
      FILTER (WHERE collected_at <= now() - interval '7 days'
              AND collected_at > now() - interval '14 days'), 0) AS prev_items
  FROM airbnb_snapshots
  WHERE source = 'airbnb-listing'
  GROUP BY city
) s;

-- ============ (c) Distribution: median ADR giữa 2 tháng gần nhất ============
INSERT INTO dq_check_results (check_name, entity, status, detail)
SELECT 'adr-drift', 'market_metrics',
  CASE
    WHEN prev_median IS NULL THEN 'skip'
    WHEN cur_median <= prev_median * 1.3 AND cur_median >= prev_median * 0.7 THEN 'pass'
    ELSE 'fail'
  END,
  'median ADR ' || round(cur_median::numeric, 0) || ' vs ' || round(prev_median::numeric, 0)
FROM (
  SELECT month, percentile_cont(0.5) WITHIN GROUP (ORDER BY adr) AS med
  FROM market_metrics WHERE adr IS NOT NULL
  GROUP BY month ORDER BY month DESC LIMIT 2
) m,
LATERAL (SELECT m.med AS cur_median,
  (SELECT m2.med FROM (SELECT month, percentile_cont(0.5) WITHIN GROUP (ORDER BY adr) AS med
     FROM market_metrics WHERE adr IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 2) m2
   WHERE m2.month < m.month ORDER BY m2.month DESC LIMIT 1) AS prev_median) x
WHERE m.month = (SELECT max(month) FROM market_metrics WHERE adr IS NOT NULL);

-- ============ (d) Freshness: max(collected_at) theo mã SPL × city ============
-- none → skip (city chưa triển khai nguồn đó); stale → fail.
INSERT INTO dq_check_results (check_name, entity, status, detail)
SELECT 'freshness', code || '/' || city,
  CASE
    WHEN last_at IS NULL THEN 'skip'
    WHEN age_days <= slo THEN 'pass'
    ELSE 'fail'
  END,
  COALESCE('snapshot cuối ' || last_at::date || ' (' || age_days || ' ngày, SLO ' || slo || ')',
           'chưa có snapshot')
FROM (
  SELECT s.city,
    CASE s.source
      WHEN 'airbnb-discovery' THEN 'S01' WHEN 'airbnb-listing' THEN 'S01'
      WHEN 'airdna-research' THEN 'S02' WHEN 'zalo-mock' THEN 'S03'
      WHEN 'osm-boundaries' THEN 'S04' END AS code,
    max(s.collected_at) AS last_at,
    floor((extract(epoch FROM now() - max(s.collected_at))) / 86400)::int AS age_days,
    CASE s.source
      WHEN 'airbnb-discovery' THEN 8 WHEN 'airbnb-listing' THEN 8
      WHEN 'airdna-research' THEN 35 WHEN 'zalo-mock' THEN 3
      WHEN 'osm-boundaries' THEN 90 END AS slo
  FROM airbnb_snapshots s
  WHERE s.source IN ('airbnb-discovery','airbnb-listing','airdna-research','zalo-mock','osm-boundaries')
  GROUP BY s.city,
    CASE s.source
      WHEN 'airbnb-discovery' THEN 'S01' WHEN 'airbnb-listing' THEN 'S01'
      WHEN 'airdna-research' THEN 'S02' WHEN 'zalo-mock' THEN 'S03'
      WHEN 'osm-boundaries' THEN 'S04' END,
    CASE s.source
      WHEN 'airbnb-discovery' THEN 8 WHEN 'airbnb-listing' THEN 8
      WHEN 'airdna-research' THEN 35 WHEN 'zalo-mock' THEN 3
      WHEN 'osm-boundaries' THEN 90 END
) f;

-- Tổng kết cho log weekly-collect
SELECT check_name, entity, status, detail
FROM dq_check_results ORDER BY checked_at DESC, id DESC LIMIT 32;
