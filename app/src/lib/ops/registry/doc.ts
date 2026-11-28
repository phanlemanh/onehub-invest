import type { PoolClient } from "pg"

import { pool } from "../../db"

/**
 * Danh bạ dự án, toà, căn trên Ops (`trang-danh-ba-chi-doc`) — truy vấn của /ops/registry và /ops/registry/[nodeId].
 * Chỉ SELECT: cây `asset_nodes` (dự án · phân khu; ba nút `building` là phân khu Grand Park — CONTEXT «Tòa nhà»), vật thể
 * `buildings` · `stacks` · `units`, bí danh `registry_aliases`, bảng nối `project_links` · `s08_project_links` ·
 * `s10_project_links`, view `offer_project` và danh mục đã nạp `stg_s08_project` · `v_s09_du_an_moi`. Mọi số đếm tính
 * trong SQL; không đọc `source_registry` (tên nguồn thật chỉ đi qua bộ che ở tầng hiển thị).
 */

type Q = Pick<PoolClient, "query">

export type LoaiNut = "project" | "subzone" | "building"

/** Một nút của cây kèm số đếm cả cây con (toà, căn quy về mọi tổ tiên). */
export type NutDanhBa = {
  id: number
  loai: LoaiNut
  parentId: number | null
  ten: string
  biDanh: string[]
  bac: string
  /** Mã tỉnh/thành gốc của khu vực đầu tiên (`areas` không cha); phân khu không có khu vực thì null. */
  tinhId: string | null
  /** Nguồn nối tới nút: bảng nối dự án (`noi`) và mã S09 trên `meta`. Chỉ mã `S0x`. */
  nguon: string[]
  soPhanKhu: number
  soToa: number
  toaChuaCan: number
  soCan: number
  /** Tin đang rao có đúng một dự án (`offer_project.status = mot_du_an`) theo nguồn. View đã quy mọi tin về dự án gốc
   * (`project_node_id` là gốc), nên phân khu không mang tin và cộng tin trên các dự án gốc không đếm trùng. */
  tin: Record<string, number>
}

/** `noiUngVien`: số mã đã nối mà nút đích là nút ứng viên (`catalog_tier = 'mot_loi_khai'`, chưa ai xác minh) — DA55 tách khỏi số nối nút có sẵn. */
export type NguonDanhMuc = { source: string; daNap: number; daNoi: number; chuaNoi: number; noiUngVien: number }

export type TongDanhBa = {
  duAn: number
  duAnXacMinh: number
  phanKhu: number
  toa: number
  toaCoCan: number
  truc: number
  can: number
  /** Toà mang bí danh còn dùng của S09 (S09 góp tên toà dù chưa có bảng nối dự án). */
  toaBiDanhS09: number
  danhMuc: NguonDanhMuc[]
}

export type MaChuaNoi = { source: string; ma: string; ten: string | null; lyDo: string | null }

export type DanhBa = { tong: TongDanhBa; nut: NutDanhBa[]; tinh: Record<string, string>; chuaNoi: MaChuaNoi[] }

/** CTE chung: tổ tiên của mỗi nút (kể cả chính nó) và tỉnh/thành gốc của mỗi khu vực. Cây sâu tối đa 16 như `offer_project`. */
const CTE_CAY = `
  to_tien AS (
    SELECT id AS node_id, id AS anc, parent_id, 0 AS sau FROM asset_nodes
    UNION ALL
    SELECT t.node_id, n.id, n.parent_id, t.sau + 1 FROM to_tien t JOIN asset_nodes n ON n.id = t.parent_id WHERE t.sau < 16
  ),
  khu AS (
    SELECT id, id AS goc, parent_id, 0 AS sau FROM areas
    UNION ALL
    SELECT k.id, a.id, a.parent_id, k.sau + 1 FROM khu k JOIN areas a ON a.id = k.parent_id WHERE k.sau < 8
  ),
  tinh AS (SELECT k.id, a.id AS tinh_id FROM khu k JOIN areas a ON a.id = k.goc WHERE a.parent_id IS NULL),
  can_toa AS (SELECT building_key, count(*)::int AS so_can FROM units WHERE status = 'active' GROUP BY 1),
  -- Toà nằm ở nút vùng HIỆU LỰC (v_toa_nut_vung, 097: cụm S09, rồi phân khu S09, rồi cột gốc) — DA36.
  toa AS (
    SELECT b.building_key, v.region_node_id, coalesce(c.so_can, 0) AS so_can
    FROM buildings b JOIN v_toa_nut_vung v USING (building_key) LEFT JOIN can_toa c USING (building_key) WHERE b.status = 'active'
  )`

const SQL_NUT = `
WITH RECURSIVE ${CTE_CAY},
  dem_toa AS (
    SELECT t.anc AS node_id, count(*)::int AS so_toa, (count(*) FILTER (WHERE x.so_can = 0))::int AS toa_chua_can,
           sum(x.so_can)::int AS so_can
    FROM toa x JOIN to_tien t ON t.node_id = x.region_node_id GROUP BY t.anc
  ),
  dem_khu AS (
    SELECT t.anc AS node_id, count(*)::int AS so_phan_khu FROM to_tien t JOIN asset_nodes n ON n.id = t.node_id
    WHERE t.node_id <> t.anc AND n.node_type IN ('subzone', 'building') AND COALESCE((n.meta ->> 'nghi')::boolean, false) = false GROUP BY t.anc
  ),
  tin AS (
    SELECT project_node_id AS node_id, jsonb_object_agg(source, n) AS tin FROM (
      SELECT project_node_id, source, count(*)::int AS n FROM offer_project WHERE status = 'mot_du_an' GROUP BY 1, 2
    ) s GROUP BY 1
  ),
  nguon AS (
    SELECT node_id, array_agg(DISTINCT source ORDER BY source) AS nguon FROM (
      SELECT asset_node_id AS node_id, source FROM project_links WHERE status = 'noi'
      UNION ALL SELECT asset_node_id, 'S08' FROM s08_project_links WHERE status = 'noi'
      UNION ALL SELECT asset_node_id, 'S10' FROM s10_project_links WHERE status = 'noi'
      UNION ALL SELECT id, 'S09' FROM asset_nodes WHERE meta ? 's09_sector_ids' OR meta ? 's09_sector_id'
    ) s GROUP BY 1
  )
SELECT n.id::int, n.node_type, n.parent_id::int, n.name, n.catalog_tier, n.aliases, tn.tinh_id,
       coalesce(dk.so_phan_khu, 0) AS so_phan_khu, coalesce(dt.so_toa, 0) AS so_toa,
       coalesce(dt.toa_chua_can, 0) AS toa_chua_can, coalesce(dt.so_can, 0) AS so_can,
       coalesce(ti.tin, '{}'::jsonb) AS tin, coalesce(ng.nguon, '{}'::text[]) AS nguon
FROM asset_nodes n
LEFT JOIN tinh tn ON tn.id = n.area_ids[1]
LEFT JOIN dem_khu dk ON dk.node_id = n.id
LEFT JOIN dem_toa dt ON dt.node_id = n.id
LEFT JOIN tin ti ON ti.node_id = n.id
LEFT JOIN nguon ng ON ng.node_id = n.id
WHERE COALESCE((n.meta ->> 'nghi')::boolean, false) = false -- nút đã nối về nút khác (DA46) không hiện trên danh bạ
ORDER BY n.id`

type HangNut = {
  id: number
  node_type: LoaiNut
  parent_id: number | null
  name: string
  catalog_tier: string
  aliases: string[]
  tinh_id: string | null
  so_phan_khu: number
  so_toa: number
  toa_chua_can: number
  so_can: number
  tin: Record<string, number>
  nguon: string[]
}

const SQL_TONG = `
SELECT
  (SELECT count(*) FROM asset_nodes WHERE node_type = 'project')::int AS du_an,
  (SELECT count(*) FROM asset_nodes WHERE node_type = 'project' AND catalog_tier = 'xac_minh')::int AS du_an_xac_minh,
  (SELECT count(*) FROM asset_nodes WHERE node_type IN ('subzone', 'building') AND COALESCE((meta ->> 'nghi')::boolean, false) = false)::int AS phan_khu,
  (SELECT count(*) FROM buildings WHERE status = 'active')::int AS toa,
  (SELECT count(*) FROM buildings b WHERE b.status = 'active'
     AND EXISTS (SELECT 1 FROM units u WHERE u.building_key = b.building_key AND u.status = 'active'))::int AS toa_co_can,
  (SELECT count(*) FROM stacks WHERE status = 'active')::int AS truc,
  (SELECT count(*) FROM units WHERE status = 'active')::int AS can,
  (SELECT count(DISTINCT a.object_key) FROM registry_aliases a JOIN buildings b ON b.building_key = a.object_key
     WHERE a.source = 'S09' AND a.retired_at IS NULL AND b.status = 'active')::int AS toa_bi_danh_s09`

/**
 * Danh mục dự án đã nạp theo nguồn: số mã dự án khác nhau đã nạp, số đã nối nút, số đã nối vào nút ứng viên, số chưa nối (gồm
 * cả mã chưa qua bước nối). S06: mã trong `project_links`. S08: dự án của `stg_s08_project`, nối ở bảng tay `s08_project_links`
 * (DN1) hoặc ở `project_links` nguồn S08 (thẻ luật DA55) — mỗi dự án đếm một lần, bảng luật trước. S09: dự án của
 * `v_s09_du_an_moi` — kho chưa có bảng nối dự án S09 nên đã nối = 0.
 */
const SQL_DANH_MUC = `
SELECT 'S06' AS source, count(*)::int AS da_nap, (count(*) FILTER (WHERE pl.status = 'noi'))::int AS da_noi,
       (count(*) FILTER (WHERE pl.status = 'noi' AND n.catalog_tier = 'mot_loi_khai'))::int AS noi_ung_vien
FROM project_links pl LEFT JOIN asset_nodes n ON n.id = pl.asset_node_id WHERE pl.source = 'S06'
UNION ALL
SELECT 'S08', count(*)::int, (count(*) FILTER (WHERE x.nut IS NOT NULL))::int,
       (count(*) FILTER (WHERE x.nut IS NOT NULL AND n.catalog_tier = 'mot_loi_khai'))::int
FROM (SELECT p.project_id, coalesce(
        (SELECT asset_node_id FROM project_links pl WHERE pl.source = 'S08' AND pl.source_project_id = p.project_id AND pl.status = 'noi'),
        (SELECT asset_node_id FROM s08_project_links l WHERE l.project_id = p.project_id AND l.status = 'noi')) AS nut
      FROM (SELECT DISTINCT project_id FROM stg_s08_project) p) x
LEFT JOIN asset_nodes n ON n.id = x.nut
UNION ALL
SELECT 'S09', count(*)::int, 0, 0 FROM v_s09_du_an_moi`

/** Mã dự án nguồn chưa nối (thứ tự: nguồn, mã). Tên dự án S08, S09 là thông tin dự án công khai (ROADMAP §3 mục 38). */
const SQL_CHUA_NOI = `
SELECT 'S06' AS source, source_project_id AS ma, NULL::text AS ten, ly_do FROM project_links WHERE source = 'S06' AND status = 'chua_noi'
UNION ALL
SELECT 'S08', p.project_id, max(p.project_name), coalesce(max(pl.ly_do), max(l.ly_do))
FROM stg_s08_project p LEFT JOIN s08_project_links l USING (project_id)
LEFT JOIN project_links pl ON pl.source = 'S08' AND pl.source_project_id = p.project_id
WHERE l.status IS DISTINCT FROM 'noi' AND pl.status IS DISTINCT FROM 'noi' GROUP BY p.project_id
UNION ALL
SELECT 'S09', project_id, data ->> 'name', NULL FROM v_s09_du_an_moi
ORDER BY 1, 2`

function nutTuHang(r: HangNut): NutDanhBa {
  return {
    id: r.id,
    loai: r.node_type,
    parentId: r.parent_id,
    ten: r.name,
    biDanh: r.aliases ?? [],
    bac: r.catalog_tier,
    tinhId: r.tinh_id,
    nguon: r.nguon ?? [],
    soPhanKhu: r.so_phan_khu,
    soToa: r.so_toa,
    toaChuaCan: r.toa_chua_can,
    soCan: r.so_can,
    tin: r.tin ?? {},
  }
}

/** Toàn bộ danh bạ cho trang /ops/registry: dải số, mọi nút kèm số đếm, tên tỉnh/thành, mã nguồn chưa nối. */
export async function docDanhBa(q: Q = pool): Promise<DanhBa> {
  const [tong, nut, danhMuc, chuaNoi, tinh] = await Promise.all([
    q.query<{ du_an: number; du_an_xac_minh: number; phan_khu: number; toa: number; toa_co_can: number; truc: number; can: number; toa_bi_danh_s09: number }>(SQL_TONG),
    q.query<HangNut>(SQL_NUT),
    q.query<{ source: string; da_nap: number; da_noi: number; noi_ung_vien: number }>(SQL_DANH_MUC),
    q.query<{ source: string; ma: string; ten: string | null; ly_do: string | null }>(SQL_CHUA_NOI),
    q.query<{ id: string; name: string }>(`SELECT id, name FROM areas WHERE parent_id IS NULL`),
  ])
  const t = tong.rows[0]
  return {
    tong: {
      duAn: t.du_an,
      duAnXacMinh: t.du_an_xac_minh,
      phanKhu: t.phan_khu,
      toa: t.toa,
      toaCoCan: t.toa_co_can,
      truc: t.truc,
      can: t.can,
      toaBiDanhS09: t.toa_bi_danh_s09,
      danhMuc: danhMuc.rows.map((r) => ({ source: r.source, daNap: r.da_nap, daNoi: r.da_noi, chuaNoi: r.da_nap - r.da_noi, noiUngVien: r.noi_ung_vien })),
    },
    nut: nut.rows.map(nutTuHang),
    // Tên ngắn như getAreaNames của /ops: bỏ tiền tố «Thành phố »/«Tỉnh ».
    tinh: Object.fromEntries(tinh.rows.map((r) => [r.id, r.name.replace(/^(Thành phố|Tỉnh)\s+/u, "")])),
    chuaNoi: chuaNoi.rows.map((r) => ({ source: r.source, ma: r.ma, ten: r.ten, lyDo: r.ly_do })),
  }
}
