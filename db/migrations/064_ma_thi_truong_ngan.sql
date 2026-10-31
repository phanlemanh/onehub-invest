-- 064_ma_thi_truong_ngan.sql — s06-vung-moi-len-canonical (gộp ma-thi-truong-ngan): mã thị trường cấp tỉnh một khuôn vn-<x>
-- docs/superpowers/specs/2026-10-31-s06-vung-moi-len-canonical-design.md · _acceptance/s06-vung-moi-len-canonical/
-- 32 thị trường cấp tỉnh mang mã dài vn-(thanh-pho|tinh)-<x> do bản cũ của import-provinces.mjs sinh; bản hiện tại sinh
-- vn-<x>. Đổi khoá sang vn-<x>, giữ tên/polygon/meta. Rào đóng chặt: mã ngắn đã có, hoặc còn dòng ở BẤT KỲ khoá ngoại
-- nào tới areas (liệt từ catalog, không danh sách tay) trỏ mã dài → RAISE, không đổi gì. Không còn mã dài → no-op.
-- areas + area_sources lên cloud qua sync (bảng giữ-chỗ): áp ở máy thu là cloud đổi theo trong ≤15′ — Mạnh duyệt áp riêng,
-- sau khi lệnh scripts/s06-vung-moi/dem-ma-dai.mjs chạy trên cloud ra 0.
DO $khoi$
DECLARE
  cap      record;
  fk       record;
  n        bigint;
  so_cap   int;
BEGIN
  CREATE TEMP TABLE _ma_cap ON COMMIT DROP AS
    SELECT id AS ma_dai, regexp_replace(id, '^vn-(thanh-pho|tinh)-', 'vn-') AS ma_ngan
      FROM areas
     WHERE region_type = 'market' AND id ~ '^vn-(thanh-pho|tinh)-';
  SELECT count(*) INTO so_cap FROM _ma_cap;
  IF so_cap = 0 THEN
    RAISE NOTICE '064: không còn mã thị trường dài — không đổi gì';
    RETURN;
  END IF;

  -- Rào 1: mã ngắn đích đã tồn tại (va chạm), hoặc hai mã dài rơi về cùng một mã ngắn
  FOR cap IN SELECT c.ma_dai, c.ma_ngan FROM _ma_cap c JOIN areas a ON a.id = c.ma_ngan LOOP
    RAISE EXCEPTION '064: mã ngắn % đã có trong areas (va chạm với %) — không đổi gì', cap.ma_ngan, cap.ma_dai;
  END LOOP;
  IF (SELECT count(DISTINCT ma_ngan) FROM _ma_cap) <> so_cap THEN
    RAISE EXCEPTION '064: hai mã dài cùng rơi về một mã ngắn — không đổi gì';
  END IF;

  -- Rào 2: mọi khoá ngoại tới areas (đọc catalog) không còn dòng trỏ mã dài
  FOR fk IN
    SELECT c.conrelid::regclass::text AS bang, a.attname AS cot
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.contype = 'f' AND c.confrelid = 'areas'::regclass
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I IN (SELECT ma_dai FROM _ma_cap)', fk.bang, fk.cot) INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION '064: % dòng ở %.% còn trỏ mã thị trường dài — không đổi gì', n, fk.bang, fk.cot;
    END IF;
  END LOOP;

  -- Cột chữ mang mã thị trường không có khoá ngoại (bảng chỉ có ở máy thu thì vắng trên cloud — bỏ qua khi vắng)
  IF to_regclass('area_sources') IS NOT NULL THEN
    UPDATE area_sources s SET area_id = c.ma_ngan FROM _ma_cap c WHERE s.area_id = c.ma_dai;
  END IF;
  IF to_regclass('area_breakdowns') IS NOT NULL THEN
    UPDATE area_breakdowns b SET area_id = c.ma_ngan FROM _ma_cap c WHERE b.area_id = c.ma_dai;
  END IF;
  IF to_regclass('data_level_snapshot') IS NOT NULL THEN
    UPDATE data_level_snapshot d SET market_id = c.ma_ngan FROM _ma_cap c WHERE d.market_id = c.ma_dai;
  END IF;

  UPDATE areas a SET id = c.ma_ngan FROM _ma_cap c WHERE a.id = c.ma_dai;
  RAISE NOTICE '064: đổi % mã thị trường dài sang vn-<x>', so_cap;
END
$khoi$;
