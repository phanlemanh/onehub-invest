-- 108_the_dia_chi_nhom.sql — TG1 the-dia-chi-nhom-s03: thẻ địa chỉ của nhóm S03 và lịch sử sửa thẻ.
-- docs/superpowers/specs/2026-11-16-the-dia-chi-nhom-s03-design.md · _acceptance/the-dia-chi-nhom-s03 (Mạnh duyệt 16/11) ·
-- ROADMAP §3 mục 51 (thẻ nhóm là mặc định cho địa chỉ tin; đóng dấu lên tin là TG2). Số 108 do giám sát đợt cấp.
-- Một dòng mỗi NHÓM THẬT (khoá bỏ tiền tố «…group:», như khoaNhomThat của pipeline/lib/eval-labels.mjs), kể cả nhóm có bài mà
-- chưa có trong sổ (unit_code NULL). group_key là khoá nhóm — tầng A, không rời hàm đọc; API và giao diện dùng card_code.
-- Bốn ô: dự án (0–3 nút project), phường (areas submarket) + tỉnh (areas market cha của phường), phân khu (nút subzone/building),
-- mục đích (ban · thue · ca_hai). Không đổi collection_units, field_assertions hay tin (Hỏi-2: TG2 đọc thẻ đã duyệt).
-- KHÔNG sync cloud: chỉ máy thu (cloud cần lời riêng). Áp lại được. Áp lên DB máy thu đi cùng chữ ký Cổng Bằng chứng theo
-- _acceptance/the-dia-chi-nhom-s03/ap-may-thu/. Lùi: ap-may-thu/108-lui.sql.

CREATE SEQUENCE IF NOT EXISTS group_address_card_seq;

CREATE TABLE IF NOT EXISTS group_address_cards (
  group_key         text        PRIMARY KEY,                       -- khoá nhóm thật (tầng A)
  card_code         text        NOT NULL UNIQUE
                    DEFAULT 'TN-' || lpad(nextval('group_address_card_seq')::text, 3, '0'),
  unit_code         text,                                          -- mã sổ đại diện; NULL = nhóm chưa có trong sổ
  status            text        NOT NULL DEFAULT 'nhap',
  project_node_ids  bigint[]    NOT NULL DEFAULT '{}',
  area_id           text,                                          -- phường (areas submarket)
  province_area_id  text,                                          -- tỉnh (areas market)
  subzone_node_id   bigint,
  purpose           text,
  evidence          jsonb       NOT NULL DEFAULT '{}'::jsonb,      -- mỗi ô: {nguon, so_bai, ...}; so_bai_doc của nhóm
  evidence_hash     text,                                          -- băm căn cứ lúc dựng nháp — nháp chỉ dựng lại khi đổi
  version           integer     NOT NULL DEFAULT 1,
  drafted_at        timestamptz NOT NULL DEFAULT now(),
  decided_by        text,
  decided_at        timestamptz,
  decision_note     text,
  CONSTRAINT group_address_cards_status_chk  CHECK (status IN ('nhap', 'da_duyet', 'bac')),
  CONSTRAINT group_address_cards_purpose_chk CHECK (purpose IS NULL OR purpose IN ('ban', 'thue', 'ca_hai')),
  CONSTRAINT group_address_cards_du_an_chk   CHECK (cardinality(project_node_ids) <= 3),
  CONSTRAINT group_address_cards_code_chk    CHECK (card_code ~ '^TN-[0-9]{3,}$')
);

CREATE TABLE IF NOT EXISTS group_address_card_history (
  id        bigserial   PRIMARY KEY,
  card_code text        NOT NULL,
  version   integer     NOT NULL,
  action    text        NOT NULL,
  actor     text        NOT NULL,
  at        timestamptz NOT NULL DEFAULT now(),
  before    jsonb,
  after     jsonb       NOT NULL,
  CONSTRAINT group_address_card_history_action_chk CHECK (action IN ('dung_nhap', 'nhan', 'sua', 'bac'))
);
CREATE INDEX IF NOT EXISTS group_address_card_history_card_idx ON group_address_card_history (card_code, version);

-- Kiểm tham chiếu: lỗi nêu tên ô để route trả 400 có nghĩa.
CREATE OR REPLACE FUNCTION group_address_cards_kiem() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  sai bigint;
BEGIN
  SELECT x INTO sai FROM unnest(NEW.project_node_ids) x
   WHERE NOT EXISTS (SELECT 1 FROM asset_nodes n WHERE n.id = x AND n.node_type = 'project') LIMIT 1;
  IF sai IS NOT NULL THEN
    RAISE EXCEPTION 'the-dia-chi: o du_an — nut % khong phai du an', sai USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.subzone_node_id IS NOT NULL AND NOT EXISTS
     (SELECT 1 FROM asset_nodes n WHERE n.id = NEW.subzone_node_id AND n.node_type IN ('subzone', 'building')) THEN
    RAISE EXCEPTION 'the-dia-chi: o phan_khu — nut % khong phai phan khu hay toa', NEW.subzone_node_id USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.area_id IS NOT NULL AND NOT EXISTS
     (SELECT 1 FROM areas a WHERE a.id = NEW.area_id AND a.region_type = 'submarket') THEN
    RAISE EXCEPTION 'the-dia-chi: o phuong — % khong phai phuong/xa', NEW.area_id USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.province_area_id IS NOT NULL AND NOT EXISTS
     (SELECT 1 FROM areas a WHERE a.id = NEW.province_area_id AND a.region_type = 'market') THEN
    RAISE EXCEPTION 'the-dia-chi: o tinh — % khong phai tinh/thanh', NEW.province_area_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS group_address_cards_kiem_trg ON group_address_cards;
CREATE TRIGGER group_address_cards_kiem_trg BEFORE INSERT OR UPDATE ON group_address_cards
  FOR EACH ROW EXECUTE FUNCTION group_address_cards_kiem();

COMMENT ON TABLE group_address_cards IS
  'TG1: thẻ địa chỉ nhóm S03 (dự án, phường + tỉnh, phân khu, bán/thuê) — nháp máy dựng, người nhận/sửa/bác; chỉ máy thu';
COMMENT ON TABLE group_address_card_history IS
  'TG1: lịch sử thẻ địa chỉ nhóm — mỗi lần dựng nháp, nhận, sửa, bác một dòng (người, giờ, bản trước, bản sau); chỉ thêm';
