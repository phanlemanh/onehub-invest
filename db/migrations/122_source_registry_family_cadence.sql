-- 122_source_registry_family_cadence.sql — NK1 so-nguon-kho-khai-bao: sổ nguồn khai họ nguồn, nhịp đo, tổng thể, bảng nạp,
-- thị trường có lịch; thêm dòng S09, S17; S11 tạm dừng.
-- Nguồn: ROADMAP §3 mục 58 (lát A) · thiết kế docs/superpowers/specs/2026-11-21-so-nguon-kho-khai-bao-design.md ·
-- hồ sơ _acceptance/so-nguon-kho-khai-bao (Mạnh duyệt Cổng Phạm vi 21/11: Hỏi-1 nhịp 192 giờ giữ chỗ, Hỏi-2 dừng S11 ở đây).
-- source_registry chỉ ở máy thu (tầng A), không lên cloud — không DDL cloud.
-- RESO: cột sổ vận hành nội bộ (nhịp đo, bảng nạp của nguồn thu), không phải field tin/căn — Data Dictionary không có
-- khái niệm tương ứng, không vào pipeline/mappings.yaml (ADR-0011 áp cho field dữ liệu BĐS).
--
-- Nhịp (`cadence_hours`) chỉ ghi ở tệp này: hai bản độ tươi (scripts/lib/freshness.mjs, app/src/lib/freshness.ts) đọc nó
-- từ sổ, test đọc bảng VALUES dưới qua scripts/lib/so-nguon-122.mjs. Tên thật S09, S17 KHÔNG ở đây: dòng mới chèn không
-- cột real_name (NULL), source_ids rỗng; điền trên máy thu sau khi áp (ap-may-thu.md của hồ sơ).
--
-- Chạy lại không đổi ô nào: cột IF NOT EXISTS, dòng mới ON CONFLICT DO NOTHING, mọi UPDATE chỉ điền ô còn trống
-- (coalesce, '{}', NULL) — giá trị người vận hành đổi sau áp không bị ghi đè khi áp lại.

-- <<<COT-122
ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS family text CHECK (family IN ('flow', 'stock'));
ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS cadence_hours integer CHECK (cadence_hours > 0);
ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS universe jsonb NOT NULL DEFAULT '{}';
ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS stg_tables text[] NOT NULL DEFAULT '{}';
ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS measured_markets text[];
-- COT-122>>>

-- Dòng mới chưa có tên thật lúc áp (điền trên máy thu ngay sau): real_name được trống. Bộ nạp tên nguồn bỏ token không
-- phải chuỗi (pipeline/lib/source-name-entries.mjs), nên dòng trống không thành tên rỗng khớp mọi chữ.
ALTER TABLE source_registry ALTER COLUMN real_name DROP NOT NULL;

COMMENT ON COLUMN source_registry.family IS
  'Họ nguồn: flow = nguồn luồng (tin rao chảy liên tục), stock = nguồn kho (danh mục tích luỹ). ROADMAP §3 mục 58; NK1.';
COMMENT ON COLUMN source_registry.cadence_hours IS
  'Nhịp đo độ tươi (giờ) — SLO của check-freshness và /ops. NULL = không đo («chưa khai SLO»). Một chỗ ghi: migration 122; NK1.';
COMMENT ON COLUMN source_registry.universe IS
  'Tổng thể nguồn tự công bố kèm mốc và nơi lấy; {} tới khi có số (không ước). NK1.';
COMMENT ON COLUMN source_registry.stg_tables IS
  'Bảng nạp của nguồn. Mã không có câu đo riêng đo độ tươi bằng snapshot mới nhất có dòng ở một trong các bảng này. NK1.';
COMMENT ON COLUMN source_registry.measured_markets IS
  'Thị trường có lịch thu — độ tươi chỉ đo ở đây. NULL = mọi thị trường có dữ liệu. NK1.';

-- Họ và nhịp theo mã. Nhịp S01–S11 = đúng hằng SLO_HOURS trước NK1; S16, S09 = 192 giữ chỗ theo khuôn S08 (Hỏi-1) tới khi
-- làn thu khai lịch; mã không đo để NULL.
-- <<<NHIP-122
UPDATE source_registry r
   SET family = coalesce(r.family, v.family),
       cadence_hours = coalesce(r.cadence_hours, v.cadence_hours)
  FROM (VALUES
    ('S01', 'flow',  192),
    ('S02', 'flow',  840),
    ('S03', 'flow',  72),
    ('S04', 'stock', NULL),
    ('S05', 'flow',  96),
    ('S06', 'flow',  36),
    ('S07', 'stock', NULL),
    ('S08', 'stock', 192),
    ('S09', 'stock', 192),
    ('S10', 'stock', 192),
    ('S11', 'stock', 192),
    ('S12', 'stock', NULL),
    ('S13', 'stock', NULL),
    ('S14', 'stock', NULL),
    ('S15', 'stock', NULL),
    ('S16', 'stock', 192),
    ('S17', 'stock', NULL)
  ) AS v(code, family, cadence_hours)
 WHERE r.code = v.code
   AND (r.family IS NULL OR (r.cadence_hours IS NULL AND v.cadence_hours IS NOT NULL));
-- NHIP-122>>>

-- Dòng mới: không real_name, source_ids rỗng — tên thật điền trên máy thu (tầng A không vào kho).
INSERT INTO source_registry (code, label_vi, status, source_ids, family, cadence_hours, stg_tables)
VALUES ('S09', 'Danh mục dự án (API)', 'active', '{}', 'stock', 192, '{stg_s09_item}')
ON CONFLICT (code) DO NOTHING;
INSERT INTO source_registry (code, label_vi, status, source_ids, family)
VALUES ('S17', 'Nguồn kho — nháp', 'draft', '{}', 'stock')
ON CONFLICT (code) DO NOTHING;

-- Bảng nạp: S16, S09 đo qua đây (không có câu đo riêng); S07, S10 khai để thước kho (NK2–NK4) đọc, câu đo riêng giữ nguyên.
UPDATE source_registry r SET stg_tables = v.t
  FROM (VALUES
    ('S07', '{stg_s07_project,stg_s07_project_card,stg_s07_sitemap_url}'::text[]),
    ('S09', '{stg_s09_item}'::text[]),
    ('S10', '{stg_s10_project,stg_s10_stock}'::text[]),
    ('S16', '{stg_s16_can,stg_s16_can_chi_tiet,stg_s16_item,stg_s16_khu,stg_s16_toa}'::text[])
  ) AS v(code, t)
 WHERE r.code = v.code AND r.stg_tables = '{}';

-- S01 chỉ thu theo lịch ở Hà Nội; hcmc, vn là lượt tay cũ — thôi đo ở đó.
UPDATE source_registry SET measured_markets = '{hanoi}' WHERE code = 'S01' AND measured_markets IS NULL;

-- S11 tạm dừng (Hỏi-2): chưa có bản thu nào, nạp S11 đang hoãn.
UPDATE source_registry
   SET status = 'paused',
       reason = 'hoãn nạp S11 — ROADMAP §3 mục 53',
       resume_when = 'làn thu có bộ nạp S11 và lịch thu được duyệt'
 WHERE code = 'S11' AND status = 'active';
