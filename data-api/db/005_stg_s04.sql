-- 005_stg_s04.sql — staging ranh giới hành chính từ S04
CREATE TABLE IF NOT EXISTS stg_osm_boundaries (
  osm_id     text NOT NULL,
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  name       text,
  payload    jsonb NOT NULL,   -- nguyên vẹn element gốc của S04 (tags + members.geometry)
  PRIMARY KEY (osm_id, snapshot_id)
);
