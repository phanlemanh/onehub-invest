-- 103_stg_s16.sql — DA33 nap-s16-vao-danh-ba: staging S16 (item thô, khu, toà, mã căn), view khoá căn, nới mã nguồn bí danh.
-- Thiết kế: docs/superpowers/specs/2026-11-14-nap-s16-vao-danh-ba-design.md §4 · ADR-0011/0013 (stg giữ hình dạng nguồn).
-- KHÔNG sync cloud: mã căn, khu_id, toa_id lấy bằng phiên đăng nhập (chỉ nội bộ — ROADMAP §3 mục 48); sync-cloud.mjs chặn
-- mọi bảng ^stg_s16 (bộ soát pipeline/lib/s16-soat.mjs). Bộ nạp (làn thu) ghi qua dongS16 + câu chèn của
-- pipeline/lib/s16-danh-muc.mjs. Số 103 do giám sát cấp. Áp lên DB máy thu là bước sau gộp, cần lời Mạnh.
-- Idempotent: chạy lại không lỗi, lược đồ không đổi.

CREATE TABLE IF NOT EXISTS stg_s16_item (
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  source_id   text NOT NULL CHECK (btrim(source_id) <> ''),
  kind        text NOT NULL CHECK (kind IN ('du-an', 'phan-khu', 'du-an-dang-ban', 'mngt-khu', 'mngt-toa', 'mngt-can',
                                            'tin-niem-yet', 'mngt-toa-khong-alias', 'mngt-can-moi', 'mngt-can-pha3',
                                            'mngt-toa-progress')),
  payload     jsonb NOT NULL,           -- nguyên văn item.payload, url đã bỏ host
  fetched_at  timestamptz,
  PRIMARY KEY (snapshot_id, source_id)
);

-- Khu (mngt-khu + khu của toà không mã khu). du_an = mã dự án của nguồn.
CREATE TABLE IF NOT EXISTS stg_s16_khu (
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  du_an       text NOT NULL CHECK (btrim(du_an) <> ''),
  du_an_ten   text,
  khu_id      text NOT NULL CHECK (btrim(khu_id) <> ''),
  khu_ten     text,
  khu_alias   text,
  so_can      integer,
  PRIMARY KEY (snapshot_id, du_an, khu_id)
);

-- Toà (mngt-toa, toà không mã khu, khoá toà trong jsonl pha 2–3). khu_nhan: nhãn khu như dòng nguồn ghi (alias hay id).
CREATE TABLE IF NOT EXISTS stg_s16_toa (
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  du_an       text NOT NULL CHECK (btrim(du_an) <> ''),
  khu_id      text,
  khu_nhan    text NOT NULL DEFAULT '',
  toa_id      text NOT NULL CHECK (btrim(toa_id) <> ''),
  toa_ten     text,
  so_can      integer,
  PRIMARY KEY (snapshot_id, du_an, toa_id)
);

-- Mã căn: mỗi dòng nguồn một dòng (bỏ dòng trùng y hệt trong cùng snapshot). pha 1 csv · 2 theo tầng · 3 trie.
CREATE TABLE IF NOT EXISTS stg_s16_can (
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  du_an       text NOT NULL CHECK (btrim(du_an) <> ''),
  khu_nhan    text NOT NULL DEFAULT '',
  toa_id      text,
  toa_ten     text NOT NULL DEFAULT '',
  tang        text,
  ma_can      text NOT NULL CHECK (btrim(ma_can) <> ''),
  pha         smallint NOT NULL CHECK (pha IN (1, 2, 3)),
  PRIMARY KEY (snapshot_id, du_an, khu_nhan, toa_ten, ma_can)
);
CREATE INDEX IF NOT EXISTS stg_s16_can_ma_idx ON stg_s16_can (du_an, upper(btrim(ma_can)));

-- Tên toà chuẩn hoá để so (cùng nghĩa chuanHoaTenToa trên tên ASCII: bỏ khoảng, gạch ngang, gạch dưới; viết hoa).
CREATE OR REPLACE FUNCTION s16_chuan_toa(t text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT upper(regexp_replace(coalesce(t, ''), '[[:space:]_-]+', '', 'g')) $$;

-- Mỗi toà một dòng (bản mới nhất theo snapshot).
CREATE OR REPLACE VIEW v_s16_toa AS
SELECT DISTINCT ON (du_an, toa_id) du_an, toa_id, toa_ten, khu_id, khu_nhan, so_can, snapshot_id
  FROM stg_s16_toa
 ORDER BY du_an, toa_id, snapshot_id DESC;

-- Mỗi (dự án, mã căn) một dòng; luật chọn toà = chonToa của s16-danh-muc.mjs (thiết kế §5.2):
-- một tên toà → chọn; nhiều tên → đúng một tên chuẩn hoá là tiền tố của mã chuẩn hoá thì chọn, còn lại mơ hồ.
CREATE OR REPLACE VIEW v_s16_can AS
WITH d AS (
  SELECT du_an, upper(btrim(ma_can)) AS ma, NULLIF(btrim(toa_ten), '') AS toa_ten, toa_id, tang FROM stg_s16_can
), g AS (
  SELECT du_an, ma, array_agg(DISTINCT toa_ten ORDER BY toa_ten) FILTER (WHERE toa_ten IS NOT NULL) AS toa_ds,
         count(*)::int AS so_dong
    FROM d GROUP BY du_an, ma
), c AS (
  SELECT g.*,
         CASE WHEN cardinality(g.toa_ds) = 1 THEN g.toa_ds[1]
              ELSE (SELECT min(x) FROM unnest(g.toa_ds) x
                     WHERE s16_chuan_toa(x) <> '' AND s16_chuan_toa(g.ma) LIKE s16_chuan_toa(x) || '%'
                    HAVING count(*) = 1) END AS toa_ten
    FROM g
)
SELECT c.du_an, c.ma AS ma_can, c.toa_ten, (c.toa_ten IS NULL) AS mo_ho, c.toa_ds, c.so_dong,
       (SELECT min(d.toa_id) FROM d WHERE d.du_an = c.du_an AND d.ma = c.ma AND d.toa_ten = c.toa_ten) AS toa_id,
       (SELECT max(d.tang) FROM d WHERE d.du_an = c.du_an AND d.ma = c.ma AND d.toa_ten = c.toa_ten) AS tang
  FROM c;

-- Bí danh mang nguồn S10–S19 (055 chỉ nhận S01–S09). Chỉ registry_aliases; các bảng khác của 055 giữ nguyên.
ALTER TABLE registry_aliases DROP CONSTRAINT IF EXISTS registry_aliases_source_check;
ALTER TABLE registry_aliases ADD CONSTRAINT registry_aliases_source_check CHECK (source ~ '^S(0[1-9]|1[0-9])$');
