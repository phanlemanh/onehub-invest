-- 044_nap_lai_khong_xoa.sql — PL14: nạp lại không xoá — bảng bản ghi + view sống, retired_at thay DELETE,
-- khoá ngoại RESTRICT, khoá gốc nguồn (originating_system_key), đối soát chuyển quyết định sang tin kế.
-- Nguồn: docs/superpowers/specs/2026-10-26-nap-lai-khong-xoa-design.md · review phân loại §3.4 · ADR-0013 §3.
-- Số 044 theo SO-MIGRATION liên làn. Không PII. Lối A (PL14-Hỏi-1, Mạnh duyệt 26/10): chỗ đọc giữ tên
-- `sale_offers` / `listings` (nay là VIEW chỉ hàng sống); đường ghi nhắm `sale_offer_records` / `listing_records`.
-- Lưu ý cho hàng sau: view `SELECT *` chốt danh sách cột lúc tạo — thêm cột vào bảng bản ghi thì tạo lại view.

-- 1. Đổi tên bảng (giữ OID: chỉ mục, CHECK 025/043, khoá ngoại con đi theo)
DO $$
BEGIN
  IF to_regclass('public.sale_offer_records') IS NULL THEN
    ALTER TABLE public.sale_offers RENAME TO sale_offer_records;
  END IF;
  IF to_regclass('public.listing_records') IS NULL THEN
    ALTER TABLE public.listings RENAME TO listing_records;
  END IF;
END $$;

-- 2. Cột nghỉ + khoá gốc nguồn
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS retired_at timestamptz;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS retired_reason text;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS superseded_by text;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS originating_system_key text;
ALTER TABLE listing_records ADD COLUMN IF NOT EXISTS retired_at timestamptz;
ALTER TABLE listing_records ADD COLUMN IF NOT EXISTS retired_reason text;
ALTER TABLE listing_records ADD COLUMN IF NOT EXISTS originating_system_key text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_retired_reason_chk') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_retired_reason_chk
      CHECK (retired_reason IS NULL OR retired_reason IN ('het_trong_luot','ngoai_phuong','doi_khoa'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listing_records_retired_reason_chk') THEN
    ALTER TABLE listing_records ADD CONSTRAINT listing_records_retired_reason_chk
      CHECK (retired_reason IS NULL OR retired_reason IN ('het_trong_luot','ngoai_phuong','doi_khoa'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_superseded_by_fkey') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_superseded_by_fkey
      FOREIGN KEY (superseded_by) REFERENCES sale_offer_records(offer_id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sale_offer_records_retired_idx ON sale_offer_records (retired_at) WHERE retired_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS sale_offer_records_osk_idx ON sale_offer_records (source, originating_system_key);
CREATE INDEX IF NOT EXISTS listing_records_retired_idx ON listing_records (retired_at) WHERE retired_at IS NOT NULL;

-- 3. Điền khoá gốc nguồn (ADR-0013 §3 OriginatingSystemKey)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE sale_offer_records o SET originating_system_key = c.list_id::text
  FROM (SELECT DISTINCT list_id FROM stg_chotot_ads) c
 WHERE o.source = 'S06' AND o.originating_system_key IS NULL
   AND o.offer_id = 'offer_' || substr(encode(digest('S06|' || c.list_id::text, 'sha256'), 'hex'), 1, 16);
UPDATE sale_offer_records o SET originating_system_key = (
    SELECT p.post_id FROM stg_zalo_posts p
     WHERE p.post_id = ANY (o.post_ids)
     ORDER BY p.posted_at NULLS LAST, p.post_id LIMIT 1)
 WHERE o.source IN ('S03','S05') AND o.originating_system_key IS NULL AND cardinality(o.post_ids) > 0;
UPDATE listing_records SET originating_system_key = substr(id, 6)
 WHERE originating_system_key IS NULL AND id LIKE 'abnb\_%';

-- 4. View sống mang tên cũ — mọi chỗ đọc (app, data-api, pipeline sql, sync-cloud) giữ nguyên
CREATE OR REPLACE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL;
CREATE OR REPLACE VIEW listings AS SELECT * FROM listing_records WHERE retired_at IS NULL;

-- 5. Khoá ngoại tới tin và listing: RESTRICT, trỏ bảng bản ghi
ALTER TABLE nights DROP CONSTRAINT IF EXISTS nights_listing_id_fkey;
ALTER TABLE nights ADD CONSTRAINT nights_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES listing_records(id) ON DELETE RESTRICT;
ALTER TABLE listing_stats DROP CONSTRAINT IF EXISTS listing_stats_listing_id_fkey;
ALTER TABLE listing_stats ADD CONSTRAINT listing_stats_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES listing_records(id) ON DELETE RESTRICT;
ALTER TABLE property_offers DROP CONSTRAINT IF EXISTS property_offers_offer_id_fkey;
ALTER TABLE property_offers ADD CONSTRAINT property_offers_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES sale_offer_records(offer_id) ON DELETE RESTRICT;
ALTER TABLE property_candidates DROP CONSTRAINT IF EXISTS property_candidates_offer_a_fkey;
ALTER TABLE property_candidates ADD CONSTRAINT property_candidates_offer_a_fkey
  FOREIGN KEY (offer_a) REFERENCES sale_offer_records(offer_id) ON DELETE RESTRICT;
ALTER TABLE property_candidates DROP CONSTRAINT IF EXISTS property_candidates_offer_b_fkey;
ALTER TABLE property_candidates ADD CONSTRAINT property_candidates_offer_b_fkey
  FOREIGN KEY (offer_b) REFERENCES sale_offer_records(offer_id) ON DELETE RESTRICT;
ALTER TABLE enrichment_proposals DROP CONSTRAINT IF EXISTS enrichment_proposals_offer_id_fkey;
ALTER TABLE enrichment_proposals ADD CONSTRAINT enrichment_proposals_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES sale_offer_records(offer_id) ON DELETE RESTRICT;

-- 6. Thước giá dựng lại trên view sống (nguyên văn 034; RENAME đã kéo chúng sang bảng bản ghi theo OID)
CREATE OR REPLACE VIEW v_ruler_p2_area AS
SELECT pr.area_id,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2::double precision) AS m,
       count(*)::integer AS n
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
   AND o.last_seen = (SELECT max(o2.last_seen)
                        FROM sale_offers o2
                        JOIN property_offers po2 ON po2.offer_id = o2.offer_id
                       WHERE po2.property_id = pr.id)
 WHERE pr.kind = 'sale'
   AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000
   AND pr.area_id IS NOT NULL
 GROUP BY pr.area_id
HAVING count(*) >= 5;

CREATE OR REPLACE VIEW v_ruler_p2 AS
SELECT pr.area_id,
       pr.property_type,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2::double precision) AS m,
       count(*)::integer AS n
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
   AND o.last_seen = (SELECT max(o2.last_seen)
                        FROM sale_offers o2
                        JOIN property_offers po2 ON po2.offer_id = o2.offer_id
                       WHERE po2.property_id = pr.id)
 WHERE pr.kind = 'sale'
   AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000
   AND pr.area_id IS NOT NULL
 GROUP BY pr.area_id, pr.property_type
HAVING count(*) >= 5;

-- 7. reconcile_stale_offers bản 044 — đối soát KHÔNG xoá (thay 039; cùng chữ ký nên CREATE OR REPLACE thay tại chỗ).
-- Với mỗi tin sống của nguồn vắng khỏi lượt (x):
--   lý do nghỉ: 'doi_khoa' khi x không mang khoá mới (khoá băm nội dung đời trước, PL14-Hỏi-2), ngược lại 'het_trong_luot';
--   có tin kế y (tin của lượt chung post nhiều nhất, hoà → offer_id nhỏ nhất) → chuyển sang y:
--     đề xuất enrich + thẻ enrich: như 039; property_offers (chép rồi bỏ dòng con cũ);
--     property_candidates đã quyết (merged/rejected) + thẻ pair: tương ứng — trùng cặp đã có thì giữ nguyên ở x;
--     x.superseded_by = y;
--   không có y → mọi dòng con giữ nguyên trỏ x (RESTRICT bảo đảm), thẻ enrich: chờ → 'deferred', ảnh chụp ở ops_audit.
-- Rồi đặt retired_at/retired_reason. Không câu DELETE nào nhắm bảng tin. Luật xác định + audit (LLM-off-data-path).
CREATE OR REPLACE FUNCTION reconcile_stale_offers(p_source text, p_live text[], p_actor text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  x          record;
  p          record;
  q          record;
  pc         record;
  y          text;
  card       bigint;
  ly_do      text;
  n_stale    integer := 0;
  moved      integer := 0;
  merged     integer := 0;
  reapplied  integer := 0;
  links      integer := 0;
  cands      integer := 0;
  kept       integer := 0;
  pairs      jsonb := '[]'::jsonb;
  r_offers   jsonb := '[]'::jsonb;
  reapply    bigint[];
  na         text;
  nb         text;
  summary    jsonb;
BEGIN
  IF p_live IS NULL OR cardinality(p_live) = 0 THEN
    RAISE EXCEPTION 'reconcile_stale_offers: lượt nạp rỗng — không đối soát nguồn %', p_source;
  END IF;

  FOR x IN
    SELECT o.* FROM sale_offer_records o
    WHERE o.source = p_source AND o.retired_at IS NULL AND NOT (o.offer_id = ANY (p_live))
    ORDER BY o.offer_id
    FOR UPDATE
  LOOP
    n_stale := n_stale + 1;
    ly_do := CASE WHEN x.originating_system_key IS NOT NULL
                   AND x.offer_id = 'offer_' || substr(encode(digest(p_source || '|' || x.originating_system_key, 'sha256'), 'hex'), 1, 16)
                  THEN 'het_trong_luot' ELSE 'doi_khoa' END;
    y := NULL;
    SELECT l.offer_id INTO y
    FROM sale_offer_records l
    WHERE l.source = p_source AND l.offer_id = ANY (p_live) AND l.post_ids && x.post_ids
    ORDER BY (SELECT count(*) FROM unnest(l.post_ids) u WHERE u = ANY (x.post_ids)) DESC, l.offer_id
    LIMIT 1;

    SELECT id INTO card FROM review_queue
    WHERE item_type = 'agent_output' AND item_id = 'enrich:' || x.offer_id AND status = 'pending';

    IF y IS NOT NULL THEN
      pairs := pairs || jsonb_build_object('from', x.offer_id, 'to', y, 'reason', ly_do);
      -- Đề xuất enrich (giữ nguyên luật 039).
      reapply := '{}';
      FOR p IN SELECT * FROM enrichment_proposals WHERE offer_id = x.offer_id ORDER BY id FOR UPDATE LOOP
        SELECT * INTO q FROM enrichment_proposals
        WHERE offer_id = y AND field = p.field AND value_key = p.value_key AND source = p.source;
        IF FOUND THEN
          merged := merged + 1;
          IF enrichment_status_rank(p.status) > enrichment_status_rank(q.status) THEN
            DELETE FROM enrichment_proposals WHERE id = q.id;
          ELSE
            DELETE FROM enrichment_proposals WHERE id = p.id;
            CONTINUE;
          END IF;
        END IF;
        IF p.status = 'applied' THEN
          UPDATE enrichment_proposals SET offer_id = y, status = 'queued' WHERE id = p.id;
          reapply := reapply || p.id;
        ELSE
          UPDATE enrichment_proposals SET offer_id = y WHERE id = p.id;
        END IF;
        moved := moved + 1;
      END LOOP;
      IF cardinality(reapply) > 0 THEN
        reapplied := reapplied + apply_enrichment(reapply, p_actor);
      END IF;

      IF card IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM review_queue WHERE item_type = 'agent_output'
                   AND item_id = 'enrich:' || y AND status = 'pending') THEN
          UPDATE review_queue SET status = 'deferred', decided_by = p_actor, decided_at = now(),
            decision_note = 'tin đã sửa — đề xuất chuyển sang ' || y
          WHERE id = card;
        ELSE
          UPDATE review_queue SET item_id = 'enrich:' || y,
            title = replace(title, x.offer_id, y),
            evidence = jsonb_set(evidence, '{offer_id}', to_jsonb(y))
          WHERE id = card;
        END IF;
      END IF;

      -- Thẻ enrich: đã quyết (không còn chờ) đi theo tin — chỉ mục duy nhất chỉ ràng thẻ chờ, nên đổi item_id không va.
      UPDATE review_queue SET item_id = 'enrich:' || y,
        evidence = CASE WHEN evidence ? 'offer_id' THEN jsonb_set(evidence, '{offer_id}', to_jsonb(y)) ELSE evidence END
      WHERE item_type = 'agent_output' AND item_id = 'enrich:' || x.offer_id AND status <> 'pending';

      -- Liên kết căn: chép sang y (căn đã có y thì giữ dòng của y), bỏ dòng con cũ.
      INSERT INTO property_offers (property_id, offer_id, score, signals, linked_at)
      SELECT po.property_id, y, po.score, po.signals, po.linked_at
        FROM property_offers po WHERE po.offer_id = x.offer_id
      ON CONFLICT DO NOTHING;
      WITH d AS (DELETE FROM property_offers WHERE offer_id = x.offer_id RETURNING 1)
      SELECT links + count(*) INTO links FROM d;

      -- Ứng viên ghép ĐÃ QUYẾT + thẻ pair: của nó. Cặp tự trỏ (bên kia chính là y) hoặc trùng cặp đã có → giữ ở x.
      FOR pc IN SELECT * FROM property_candidates
                WHERE (offer_a = x.offer_id OR offer_b = x.offer_id) AND status IN ('merged', 'rejected')
                ORDER BY id FOR UPDATE LOOP
        na := CASE WHEN pc.offer_a = x.offer_id THEN y ELSE pc.offer_a END;
        nb := CASE WHEN pc.offer_b = x.offer_id THEN y ELSE pc.offer_b END;
        IF na = nb THEN kept := kept + 1; CONTINUE; END IF;
        SELECT * INTO q FROM property_candidates
        WHERE (offer_a = na AND offer_b = nb) OR (offer_a = nb AND offer_b = na);
        IF FOUND THEN
          IF q.status IN ('merged', 'rejected') THEN kept := kept + 1; CONTINUE; END IF;
          -- Cặp mới còn chờ: quyết định người thắng — bỏ ứng viên chờ (không phải quyết định), chuyển ứng viên đã quyết.
          DELETE FROM property_candidates WHERE id = q.id;
          UPDATE review_queue SET status = 'deferred', decided_by = p_actor, decided_at = now(),
            decision_note = 'cặp đã quyết từ ' || x.offer_id || ' chuyển sang'
          WHERE item_type = 'entity_match' AND status = 'pending'
            AND item_id IN ('pair:' || q.offer_a || '|' || q.offer_b, 'pair:' || q.offer_b || '|' || q.offer_a);
        END IF;
        UPDATE property_candidates SET offer_a = na, offer_b = nb WHERE id = pc.id;
        UPDATE review_queue SET item_id = 'pair:' || na || '|' || nb
        WHERE item_type = 'entity_match' AND item_id = 'pair:' || pc.offer_a || '|' || pc.offer_b
          AND NOT (status = 'pending' AND EXISTS (SELECT 1 FROM review_queue r2 WHERE r2.item_type = 'entity_match'
                   AND r2.item_id = 'pair:' || na || '|' || nb AND r2.status = 'pending'));
        cands := cands + 1;
      END LOOP;

      UPDATE sale_offer_records SET superseded_by = y WHERE offer_id = x.offer_id;
    ELSE
      r_offers := r_offers || jsonb_build_object('offer_id', x.offer_id, 'reason', ly_do, 'enriched', jsonb_build_object(
        'property_type', x.property_type, 'bedrooms', x.bedrooms, 'bathrooms', x.bathrooms,
        'street_raw', x.street_raw, 'block_raw', x.block_raw),
        'proposals', (SELECT count(*) FROM enrichment_proposals WHERE offer_id = x.offer_id),
        'property_ids', COALESCE((SELECT jsonb_agg(property_id ORDER BY property_id) FROM property_offers WHERE offer_id = x.offer_id), '[]'::jsonb),
        'candidates', COALESCE((SELECT jsonb_agg(id ORDER BY id) FROM property_candidates
                                WHERE offer_a = x.offer_id OR offer_b = x.offer_id), '[]'::jsonb));
      IF card IS NOT NULL THEN
        UPDATE review_queue SET status = 'deferred', decided_by = p_actor, decided_at = now(),
          decision_note = 'tin không còn trong lượt nạp — đề xuất giữ ở tin đã nghỉ, gỡ khi tin quay lại'
        WHERE id = card;
      END IF;
    END IF;

    UPDATE sale_offer_records SET retired_at = now(), retired_reason = ly_do WHERE offer_id = x.offer_id;
  END LOOP;

  summary := jsonb_build_object('source', p_source, 'stale', n_stale, 'moved', moved, 'merged', merged,
    'reapplied', reapplied, 'links', links, 'candidates', cands, 'kept', kept, 'pairs', pairs);
  IF n_stale > 0 THEN
    INSERT INTO ops_audit (actor, action, env, detail) VALUES (p_actor, 'enrich:reconcile', 'local', summary);
  END IF;
  IF jsonb_array_length(r_offers) > 0 THEN
    INSERT INTO ops_audit (actor, action, env, detail) VALUES (p_actor, 'offer:retire', 'local',
      jsonb_build_object('source', p_source, 'offers', r_offers));
  END IF;
  RETURN summary;
END $$;
