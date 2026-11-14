-- 104_offer_price_rank.sql — CG9 bang-hang-gia-m2: bảng hạng giá tính sẵn cho mọi tin đang rao.
-- docs/superpowers/specs/2026-11-14-bang-hang-gia-m2-design.md §2.1 · _acceptance/bang-hang-gia-m2/
-- Một dòng mỗi tin của view sale_offers (bán và thuê, mọi nguồn), kể cả tin không chấm (ly_do cho trang một căn). Bước ghi:
-- pipeline/xep-hang-gia.mjs chạy pipeline/sql/420_price_rank.sql (xoá trọn rồi chèn, một giao dịch). Pipeline tính, app và API
-- chỉ đọc (luật 10). Khoá nhóm = cap + nut + pn_nhom: hàng này chỉ sinh cap 'phuong' (nut = area_id); CG10, CG11 thêm cấp
-- dự án, phân khu, toà (nut = asset_nodes.id) mà không đổi bảng.
-- Áp lại được. Áp lên DB máy thu/cloud là bước triển khai riêng (lời Mạnh sau gộp, pg_dump trước); cloud dùng tệp
-- docs/ops/cloud-schema-catchup-2026-11-14-offer-price-rank.sql.

CREATE TABLE IF NOT EXISTS offer_price_rank (
  offer_id          text PRIMARY KEY REFERENCES sale_offer_records (offer_id) ON DELETE CASCADE,
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
