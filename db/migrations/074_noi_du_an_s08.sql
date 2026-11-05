-- 074_noi_du_an_s08.sql — DN1 noi-du-an-s08-khu-do-thi: bảng nối dự án S08 vào khu đô thị, dọn sổ dự án của lát Ocean Park 1 và Grand Park.
-- Nguồn: docs/superpowers/specs/2026-11-05-noi-du-an-s08-khu-do-thi-design.md, ROADMAP §3 mục 28, 30. Số do liên làn cấp.
-- KHÔNG sync cloud: s08_project_links chứa mã dự án S08 (luật 5). Dòng nối do pipeline/noi-du-an-s08.mjs ghi từ tệp ở máy thu, không nằm ở đây.
-- asset_nodes có sync cloud: tên, bí danh, area_ids mới lên cloud ở lần sync sau khi áp. Áp lên DB thật xin giám sát.

CREATE TABLE IF NOT EXISTS s08_project_links (
  project_id    text PRIMARY KEY,
  asset_node_id bigint REFERENCES asset_nodes(id),
  status        text NOT NULL,
  ly_do         text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT s08_project_links_status_check CHECK (status IN ('noi', 'chua_noi')),
  CONSTRAINT s08_project_links_noi_check CHECK (status <> 'noi' OR asset_node_id IS NOT NULL),
  CONSTRAINT s08_project_links_chua_noi_ly_do_check CHECK (status <> 'chua_noi' OR ly_do IS NOT NULL),
  CONSTRAINT s08_project_links_chua_noi_nut_check CHECK (status <> 'chua_noi' OR asset_node_id IS NULL)
);
CREATE INDEX IF NOT EXISTS s08_project_links_node_idx ON s08_project_links (asset_node_id);

-- Bí danh trùng mã toà: S7, S10 là toà, 107 tin S03 ghi vậy, S10 lại là toà ở Ocean Park.
UPDATE asset_nodes SET aliases = array_remove(array_remove(aliases, 's7'), 's10') WHERE slug = 'phu-my-hung';

-- Ocean Park 1–3: bí danh sai địa danh (Vũ Yên ở Hải Phòng, Vàng Danh ở Quảng Ninh), `vuong` không nguồn; mã vùng đã chết.
-- OCP1 xã Gia Lâm theo Nghị quyết 1656/NQ-UBTVQH15. OCP2, OCP3 cấp tỉnh: nguồn chưa thống nhất xã, areas chưa có xã của Hưng Yên (Mạnh duyệt Hỏi-2).
UPDATE asset_nodes SET aliases = array_remove(array_remove(aliases, 'vuong'), 'vang danh'), area_ids = ARRAY['vn-hanoi-gia-lam']::text[]
 WHERE slug = 'vinhomes-ocean-park-1';
UPDATE asset_nodes SET name = 'Vinhomes Ocean Park 2', aliases = array_remove(array_remove(aliases, 'vu yen'), 'vang danh 2'), area_ids = ARRAY['vn-hung-yen']::text[]
 WHERE slug = 'vinhomes-ocean-park-2';
UPDATE asset_nodes SET name = 'Vinhomes Ocean Park 3', aliases = array_remove(aliases, 'vu yen 3'), area_ids = ARRAY['vn-hung-yen']::text[]
 WHERE slug = 'vinhomes-ocean-park-3';
