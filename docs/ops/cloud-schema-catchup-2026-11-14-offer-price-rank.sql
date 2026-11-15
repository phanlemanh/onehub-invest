-- cloud-schema-catchup-2026-11-14-offer-price-rank.sql — CG9 bang-hang-gia-m2: bảng offer_price_rank cho cloud (Supabase).
-- Nội dung bằng db/migrations/104_offer_price_rank.sql (áp lại được). Mạnh duyệt rồi áp qua Management API; sync-cloud bỏ qua
-- bảng này với một dòng cảnh báo cho tới khi cloud có bảng. Khác 104 đúng một chỗ: không khoá ngoại tới bảng tin.

CREATE TABLE IF NOT EXISTS offer_price_rank (
  offer_id          text PRIMARY KEY,   -- cloud: sale_offers là bảng thường, sync chép bảng con của tin sống (như property_offers), không khoá ngoại
  kind              text NOT NULL,
  property_type     text,
  bedrooms          integer,
  thuoc             text,
  gia_tri           numeric,
  cap               text,
  nut               text,
  pn_nhom           integer,
  n                 integer,
  trung_vi          numeric,
  p20               numeric,
  hang_pct          numeric(5,1),
  duoi_trung_vi_pct numeric(7,1),
  nhan              text,
  can_xac_minh      boolean NOT NULL DEFAULT false,
  ly_do             text,
  computed_at       timestamptz NOT NULL DEFAULT now(),
  run_id            text NOT NULL
);

ALTER TABLE offer_price_rank DROP CONSTRAINT IF EXISTS offer_price_rank_cap_check;
ALTER TABLE offer_price_rank ADD CONSTRAINT offer_price_rank_cap_check
  CHECK (cap IS NULL OR cap IN ('phuong', 'du_an', 'phan_khu', 'toa'));
ALTER TABLE offer_price_rank DROP CONSTRAINT IF EXISTS offer_price_rank_thuoc_check;
ALTER TABLE offer_price_rank ADD CONSTRAINT offer_price_rank_thuoc_check
  CHECK (thuoc IS NULL OR thuoc IN ('gia-m2', 'gia-thang-pn'));
ALTER TABLE offer_price_rank DROP CONSTRAINT IF EXISTS offer_price_rank_nhan_check;
ALTER TABLE offer_price_rank ADD CONSTRAINT offer_price_rank_nhan_check
  CHECK (nhan IS NULL OR nhan IN ('re-trong-phuong', 'gia-tot'));

CREATE INDEX IF NOT EXISTS offer_price_rank_nhom_idx ON offer_price_rank (cap, nut, kind, property_type, pn_nhom);
CREATE INDEX IF NOT EXISTS offer_price_rank_nhan_idx ON offer_price_rank (kind, nhan) WHERE nhan IS NOT NULL;

COMMENT ON TABLE offer_price_rank IS
  'CG9: hạng giá tính sẵn mỗi tin đang rao trong nhóm sâu nhất đủ căn (cap/nut/pn_nhom); ghi bởi pipeline/xep-hang-gia.mjs';
