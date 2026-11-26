-- 136_inquiry_post_records.sql — YC0 `bang-yeu-cau-noi-lai`: lớp bài Yêu cầu (bên mua: cần mua · cần thuê) khoá theo bài, ý định
-- đi qua phát biểu và phân xử (ADR-0013 câu 3, 4). Số 136 do giám sát cấp 26/11.
-- Nguồn: docs/superpowers/specs/2026-11-26-bang-yeu-cau-noi-lai-design.md · _acceptance/bang-yeu-cau-noi-lai/contract.md ·
-- sổ pipeline/mappings.yaml (khối inquiries; trục assertion_field, inquiry_kind, property_type). RESO DD 2.1: không có bản ghi ngang
-- hàng Property cho nhu cầu bên mua, gần nhất SavedSearch (khoá, hệ thống); tiêu chí dùng lại trường Property phía bán.
-- CHỈ DB local: không vào FILL / CLOUD_ALLOW của pipeline/sync-cloud.mjs. Không cột danh tính người đăng (tầng C, không cần ở YC0).
-- Migration KHÔNG ghi dòng nào vào bảng dữ liệu (chỉ dòng sổ ref_lookup, ref_field_lookup). Chạy lại an toàn.
-- Lùi: rút phát biểu listing_intent của lượt; DROP VIEW inquiries; DROP TABLE inquiry_post_records; DROP FUNCTION
-- resolve_inquiry_fields(text[]); trả CHECK trường về bản 117 (xoá dữ liệu — cần lời Mạnh).

-- 1. Bảng bài Yêu cầu: một dòng mỗi bài có phát biểu ý định thắng là inquiry. Chỉ resolve_inquiry_fields (§4) ghi dòng.
CREATE TABLE IF NOT EXISTS inquiry_post_records (
  inquiry_id             text PRIMARY KEY,          -- SavedSearchKey = khoá chủ thể phát biểu '<S0x>:<post_id>' (không băm nội dung)
  source                 text NOT NULL,             -- OriginatingSystemName: mã S0x (ADR-0007)
  originating_system_key text NOT NULL,             -- OriginatingSystemKey: post_id của bài
  posted_at              timestamptz,               -- OriginalEntryTimestamp: lúc bài đăng (observed_at của phát biểu ý định)
  intent_status          text NOT NULL,             -- song: luật hoặc người nhận · cho-duyet: chỉ nhãn model (Hỏi-1a)
  intent_assertion_ids   bigint[] NOT NULL DEFAULT '{}',  -- phát biểu listing_intent thắng (field_assertions.id)
  -- Tiêu chí: NULL ở YC0, hàng YC9 ghi qua phát biểu + phân xử (ADR-0013 câu 4).
  kind                   text,                      -- PropertyType phía bán dùng lại: sale = mua · rent_lt / rent_st = thuê
  property_type          text,                      -- PropertySubType dùng lại
  bedrooms               integer,                   -- BedroomsTotal dùng lại
  area_m2                numeric,                   -- LivingArea dùng lại
  budget_min_vnd         bigint,                    -- ListPrice dùng lại, đầu dưới ngân sách
  budget_max_vnd         bigint,                    -- ListPrice dùng lại, đầu trên ngân sách
  area_id                text,                      -- phường/xã; không khoá ngoại (reassign-areas xoá area không phải phường)
  market_id              text,                      -- thị trường
  project_node_id        bigint,                    -- dự án (SubdivisionName) — nút danh bạ
  retired_at             timestamptz,               -- nghỉ thay vì xoá (khuôn PL14)
  retired_reason         text,                      -- het-y-dinh: phát biểu ý định thắng không còn là inquiry
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_post_records_key_chk') THEN
    ALTER TABLE inquiry_post_records ADD CONSTRAINT inquiry_post_records_key_chk
      CHECK (inquiry_id = source || ':' || originating_system_key);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_post_records_source_chk') THEN
    ALTER TABLE inquiry_post_records ADD CONSTRAINT inquiry_post_records_source_chk CHECK (source ~ '^S0[0-9]$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_post_records_intent_status_chk') THEN
    ALTER TABLE inquiry_post_records ADD CONSTRAINT inquiry_post_records_intent_status_chk
      CHECK (intent_status IN ('song', 'cho-duyet'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_post_records_kind_chk') THEN
    ALTER TABLE inquiry_post_records ADD CONSTRAINT inquiry_post_records_kind_chk CHECK (kind IN ('sale', 'rent_lt', 'rent_st'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_post_records_property_type_chk') THEN
    ALTER TABLE inquiry_post_records ADD CONSTRAINT inquiry_post_records_property_type_chk
      CHECK (property_type IN ('apartment', 'house', 'land', 'room', 'commercial', 'unknown'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_post_records_budget_chk') THEN
    ALTER TABLE inquiry_post_records ADD CONSTRAINT inquiry_post_records_budget_chk CHECK (budget_min_vnd <= budget_max_vnd);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_post_records_retired_chk') THEN
    ALTER TABLE inquiry_post_records ADD CONSTRAINT inquiry_post_records_retired_chk
      CHECK ((retired_at IS NULL) = (retired_reason IS NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS inquiry_post_records_source_live_idx ON inquiry_post_records (source) WHERE retired_at IS NULL;

-- View sống: Yêu cầu chưa nghỉ và đã được luật hoặc người nhận. Dòng chờ duyệt (chỉ nhãn model) không có ở đây.
CREATE OR REPLACE VIEW inquiries AS
  SELECT * FROM inquiry_post_records WHERE retired_at IS NULL AND intent_status = 'song';

-- 2. Trục trường phát biểu = tập của 117 + bốn trường của Yêu cầu (sổ: pipeline/mappings.yaml trục assertion_field).
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status', 'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude', 'builder_name', 'area_id', 'floor_raw', 'floor_band', 'project_node_id', 'subzone_node_id', 'living_area', 'building_area_total', 'direction_faces', 'lot_size_area', 'universal_property_id', 'listing_intent', 'kind', 'budget_min_vnd', 'budget_max_vnd'));

-- 3. Miền giá trị của bốn trường, ở MỌI phương pháp (kể cả hitl); chỉ trên tin/bài (resource Property, khoá '<S0x>:<id>').
CREATE OR REPLACE FUNCTION field_assertions_gia_tri_136()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.field IN ('listing_intent', 'kind', 'budget_min_vnd', 'budget_max_vnd') AND NEW.resource_name <> 'Property' THEN
    RAISE EXCEPTION 'field_assertions: trường % chỉ ở resource Property, nhận %', NEW.field, NEW.resource_name;
  END IF;
  IF NEW.field = 'listing_intent' AND NEW.value NOT IN ('offer', 'inquiry', 'not_listing', 'unknown') THEN
    RAISE EXCEPTION 'phát biểu listing_intent ngoài sổ (offer|inquiry|not_listing|unknown): «%»', NEW.value;
  END IF;
  IF NEW.field = 'kind' AND NEW.value NOT IN ('sale', 'rent_lt', 'rent_st') THEN
    RAISE EXCEPTION 'phát biểu kind ngoài sổ (sale|rent_lt|rent_st): «%»', NEW.value;
  END IF;
  IF NEW.field IN ('budget_min_vnd', 'budget_max_vnd') AND btrim(NEW.value) !~ '^[1-9][0-9]{0,17}$' THEN
    RAISE EXCEPTION 'phát biểu % phải là số nguyên dương (VND): «%»', NEW.field, NEW.value;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS field_assertions_gia_tri_136 ON field_assertions;
CREATE TRIGGER field_assertions_gia_tri_136 BEFORE INSERT ON field_assertions
  FOR EACH ROW EXECUTE FUNCTION field_assertions_gia_tri_136();

-- 4. Bộ phân xử Yêu cầu. Với mỗi khoá bài trong p_ids (NULL = mọi bài có phát biểu listing_intent hay có dòng): phát biểu
-- listing_intent sống thắng theo luật lớp của 045 — fact › observed › inferred, rồi assertion_method_rank, rồi mới nhất. Thắng là
-- inquiry ở fact/observed → «song»; thắng là inquiry ở inferred (không lớp trên nào) → «cho-duyet»; thắng là giá trị khác hay
-- không còn phát biểu → dòng đang sống nghỉ «het-y-dinh»; trở lại → sống lại cùng khoá. Bài ngoài p_ids không bị đụng (lượt
-- một phần không nghỉ bài nó không xét). Không DELETE. Cùng cổng «chưa cắt chuyển» với resolve_offer_fields (045).
CREATE OR REPLACE FUNCTION resolve_inquiry_fields(p_ids text[])
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  n_xet      integer;
  n_them     integer;
  n_doi      integer;
  n_song_lai integer;
  n_nghi     integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    RAISE EXCEPTION 'phân xử: chưa cắt chuyển — chạy node pipeline/phat-bieu-cat-chuyen.mjs trước (PL15)';
  END IF;

  WITH ids AS (
    SELECT DISTINCT x AS k FROM unnest(coalesce(p_ids, '{}'::text[])) AS x WHERE x IS NOT NULL
    UNION
    SELECT subject_key FROM field_assertions
     WHERE p_ids IS NULL AND field = 'listing_intent' AND retracted_at IS NULL
    UNION
    SELECT inquiry_id FROM inquiry_post_records WHERE p_ids IS NULL
  ), a AS (
    SELECT fa.subject_key AS k, fa.id, fa.value_key, fa.evidence_tier,
           row_number() OVER (PARTITION BY fa.subject_key
                              ORDER BY CASE fa.evidence_tier WHEN 'fact' THEN 0 WHEN 'observed' THEN 1 ELSE 2 END,
                                       assertion_method_rank(fa.method), fa.created_at DESC, fa.id DESC) AS rn,
           min(fa.observed_at) OVER (PARTITION BY fa.subject_key) AS dang_luc
      FROM ids JOIN field_assertions fa ON fa.subject_key = ids.k AND fa.field = 'listing_intent' AND fa.retracted_at IS NULL
  ), muon AS (   -- bài mà phát biểu thắng là inquiry, kèm trạng thái
    SELECT k, id, dang_luc,
           CASE WHEN evidence_tier IN ('fact', 'observed') THEN 'song' ELSE 'cho-duyet' END AS st
      FROM a WHERE rn = 1 AND value_key = 'inquiry'
  ), them AS (
    INSERT INTO inquiry_post_records (inquiry_id, source, originating_system_key, posted_at, intent_status, intent_assertion_ids)
    SELECT m.k, split_part(m.k, ':', 1), substr(m.k, strpos(m.k, ':') + 1), m.dang_luc, m.st, ARRAY[m.id]
      FROM muon m
     WHERE NOT EXISTS (SELECT 1 FROM inquiry_post_records r WHERE r.inquiry_id = m.k)
    RETURNING 1
  ), doi AS (
    UPDATE inquiry_post_records r
       SET intent_status = m.st, intent_assertion_ids = ARRAY[m.id], retired_at = NULL, retired_reason = NULL, updated_at = now()
      FROM muon m, inquiry_post_records o
     WHERE r.inquiry_id = m.k AND o.inquiry_id = r.inquiry_id
       AND (r.intent_status, r.intent_assertion_ids, r.retired_at) IS DISTINCT FROM (m.st, ARRAY[m.id], NULL::timestamptz)
    RETURNING o.retired_at IS NOT NULL AS song_lai
  ), nghi AS (
    UPDATE inquiry_post_records r
       SET retired_at = now(), retired_reason = 'het-y-dinh', updated_at = now()
      FROM ids
     WHERE r.inquiry_id = ids.k AND r.retired_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM muon m WHERE m.k = r.inquiry_id)
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM ids), (SELECT count(*) FROM them), (SELECT count(*) FROM doi WHERE NOT song_lai),
         (SELECT count(*) FROM doi WHERE song_lai), (SELECT count(*) FROM nghi)
    INTO n_xet, n_them, n_doi, n_song_lai, n_nghi;
  RETURN jsonb_build_object('xet', n_xet, 'them', n_them, 'cap_nhat', n_doi, 'song_lai', n_song_lai, 'nghi', n_nghi);
END $$;

-- 5. Bộ phân xử tin không đọc bốn trường của Yêu cầu: phát biểu ý định của bài không được đổi field_provenance hay cột nào của tin
-- (AC-7 — bài suy loại thành tin rao vẫn có thể mang nhãn model). Vá thân hàm đang có theo khuôn 068/069/095 (không chép cả hàm);
-- mất mốc thì dừng có tên MOC-136.
DO $do$
DECLARE
  ham  regprocedure := to_regprocedure('resolve_offer_fields(text[])');
  moc  constant text := $m$AND fa.field <> 'offer_status'$m$;
  moi  constant text := $m$AND fa.field NOT IN ('offer_status', 'listing_intent', 'kind', 'budget_min_vnd', 'budget_max_vnd') /* yeu_cau_136 */$m$;
  dinh_nghia text;
BEGIN
  IF ham IS NULL THEN
    RAISE EXCEPTION 'MOC-136: không có hàm resolve_offer_fields(text[])';
  END IF;
  dinh_nghia := pg_get_functiondef(ham);
  IF position('yeu_cau_136' IN dinh_nghia) > 0 THEN
    RETURN;   -- đã vá
  END IF;
  IF position(moc IN dinh_nghia) = 0 THEN
    RAISE EXCEPTION 'MOC-136: định nghĩa resolve_offer_fields không còn mốc «%», phải sửa tay 136', moc;
  END IF;
  EXECUTE replace(dinh_nghia, moc, moi);
END $do$;

-- 6. Sổ từ vựng (khớp pipeline/mappings.yaml: trục inquiry_kind mới, bốn trường mới của assertion_field, cột của bảng 136).
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('inquiry_kind', 'sale', 'Residential', 'Mua', false, 1),
  ('inquiry_kind', 'rent_lt', 'ResidentialLease', 'Thuê dài hạn', false, 2),
  ('inquiry_kind', 'rent_st', NULL, 'Thuê ngắn hạn', true, 3),
  ('assertion_field', 'listing_intent', NULL, 'Ý định tin', true, 25),
  ('assertion_field', 'kind', 'PropertyType', 'Dịch vụ', false, 26),
  ('assertion_field', 'budget_min_vnd', 'ListPrice', 'Ngân sách từ', false, 27),
  ('assertion_field', 'budget_max_vnd', 'ListPrice', 'Ngân sách đến', false, 28)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('inquiry_post_records', 'kind', 'inquiry_kind'),
  ('inquiry_post_records', 'property_type', 'property_type')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
