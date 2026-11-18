import type { PoolClient } from "pg"

import { pool } from "../../db"
import { docDanhBa, type NutDanhBa } from "./doc"

/**
 * Một dự án của danh bạ (/ops/registry/[nodeId]): cây con (phân khu), toà theo nút cha, căn theo toà. Chỉ SELECT.
 * Tên toà là bí danh `ten` còn dùng; trục và căn hiện mã tại nguồn (`ma_nguon`) — bí danh, không phải tên nguồn.
 */

type Q = Pick<PoolClient, "query">

export type ToaDanhBa = {
  key: string
  /** Nút vùng hiệu lực (v_toa_nut_vung): cụm S09, rồi phân khu S09, rồi cột gốc. */
  nutId: number
  /** Cột gốc buildings.region_node_id và tên nút ấy (null khi toà không có cột gốc). */
  nutIdGoc: number | null
  tenNutGoc: string | null
  /** Nguồn của nút hiệu lực: goc | s09_cum | s09_phan_khu. */
  nguonNut: string
  ten: string[]
  maNguon: string[]
  bac: string
  nguon: string[]
  soTruc: number
  soCan: number
}

export type CanDanhBa = { key: string; toaKey: string; tang: string | null; truc: string | null; ma: string | null; bac: string; nguon: string[] }

export type MotDuAn = {
  /** Nút gốc (dự án) và mọi nút con, giữ thứ tự id. Số đếm lấy từ cùng câu đọc với trang danh sách. */
  nut: NutDanhBa[]
  toa: ToaDanhBa[]
  can: CanDanhBa[]
  /** Tên tỉnh/thành theo mã (`areas` không cha). */
  tinh: Record<string, string>
  /** Mã dự án tại nguồn đã nối (bảng nối), dạng `S06 du_an/10`. */
  maNoi: { source: string; ma: string }[]
}

/** Nút hợp lệ: số nguyên dương, không quá 18 chữ số (bigint). */
export function parseNodeId(v: string | undefined): number | null {
  if (!v || !/^[1-9][0-9]{0,17}$/.test(v)) return null
  const n = Number(v)
  return Number.isSafeInteger(n) ? n : null
}

const CTE_CON = `WITH RECURSIVE con AS (
  SELECT id FROM asset_nodes WHERE id = $1
  UNION ALL SELECT n.id FROM asset_nodes n JOIN con c ON n.parent_id = c.id
)`

const SQL_TOA = `${CTE_CON}
SELECT b.building_key, v.region_node_id::int AS nut_id, v.region_node_id_goc::int AS nut_id_goc, ng.name AS ten_nut_goc,
  v.nguon AS nguon_nut, b.catalog_tier,
  coalesce((SELECT array_agg(DISTINCT a.value ORDER BY a.value) FROM registry_aliases a
            WHERE a.object_key = b.building_key AND a.kind = 'ten' AND a.retired_at IS NULL), '{}') AS ten,
  coalesce((SELECT array_agg(DISTINCT a.value ORDER BY a.value) FROM registry_aliases a
            WHERE a.object_key = b.building_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL), '{}') AS ma_nguon,
  coalesce((SELECT array_agg(DISTINCT a.source ORDER BY a.source) FROM registry_aliases a
            WHERE a.object_key = b.building_key AND a.retired_at IS NULL), '{}') AS nguon,
  (SELECT count(*) FROM stacks s WHERE s.building_key = b.building_key AND s.status = 'active')::int AS so_truc,
  (SELECT count(*) FROM units u WHERE u.building_key = b.building_key AND u.status = 'active')::int AS so_can
FROM buildings b JOIN v_toa_nut_vung v USING (building_key) LEFT JOIN asset_nodes ng ON ng.id = v.region_node_id_goc
WHERE b.status = 'active' AND v.region_node_id IN (SELECT id FROM con)
ORDER BY v.region_node_id, 7, b.building_key`

const SQL_CAN = `${CTE_CON}
SELECT u.unit_key, u.building_key, u.floor, u.catalog_tier,
  (SELECT min(a.value) FROM registry_aliases a WHERE a.object_key = u.stack_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL) AS truc,
  (SELECT min(a.value) FROM registry_aliases a WHERE a.object_key = u.unit_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL) AS ma,
  coalesce((SELECT array_agg(DISTINCT a.source ORDER BY a.source) FROM registry_aliases a
            WHERE a.object_key = u.unit_key AND a.retired_at IS NULL), '{}') AS nguon
FROM units u JOIN buildings b USING (building_key) JOIN v_toa_nut_vung v ON v.building_key = b.building_key
WHERE u.status = 'active' AND b.status = 'active' AND v.region_node_id IN (SELECT id FROM con)
ORDER BY u.building_key, nullif(regexp_replace(u.floor, '[^0-9]', '', 'g'), '')::int NULLS LAST, u.floor, 5, u.unit_key`

const SQL_MA_NOI = `
SELECT source, source_project_id AS ma FROM project_links WHERE asset_node_id = $1 AND status = 'noi'
UNION ALL SELECT 'S08', project_id FROM s08_project_links WHERE asset_node_id = $1 AND status = 'noi'
UNION ALL SELECT 'S10', project_id FROM s10_project_links WHERE asset_node_id = $1 AND status = 'noi'
ORDER BY 1, 2`

/**
 * Đọc một dự án. Nút không tồn tại hay không phải dự án gốc (phân khu mở qua dự án của nó) → null (trang trả 404).
 * Số đếm của nút đi qua `docDanhBa` để trang chi tiết và trang danh sách không thể lệch nhau.
 */
export async function docDuAn(id: number, q: Q = pool): Promise<MotDuAn | null> {
  const goc = await q.query<{ node_type: string }>(`SELECT node_type FROM asset_nodes WHERE id = $1`, [id])
  if (goc.rows[0]?.node_type !== "project") return null
  const [danhBa, toa, can, maNoi] = await Promise.all([
    docDanhBa(q),
    q.query<{ building_key: string; nut_id: number; nut_id_goc: number | null; ten_nut_goc: string | null; nguon_nut: string; catalog_tier: string; ten: string[]; ma_nguon: string[]; nguon: string[]; so_truc: number; so_can: number }>(SQL_TOA, [id]),
    q.query<{ unit_key: string; building_key: string; floor: string | null; catalog_tier: string; truc: string | null; ma: string | null; nguon: string[] }>(SQL_CAN, [id]),
    q.query<{ source: string; ma: string }>(SQL_MA_NOI, [id]),
  ])
  const trongCay = new Set<number>([id])
  // Lặp tới khi đứng: nút con có thể mang id nhỏ hơn cha (cây dựng qua nhiều đợt).
  for (let them = true; them; ) {
    them = false
    for (const n of danhBa.nut) {
      if (n.parentId != null && trongCay.has(n.parentId) && !trongCay.has(n.id)) {
        trongCay.add(n.id)
        them = true
      }
    }
  }
  return {
    nut: danhBa.nut.filter((n) => trongCay.has(n.id)),
    tinh: danhBa.tinh,
    toa: toa.rows.map((r) => ({ key: r.building_key, nutId: r.nut_id, nutIdGoc: r.nut_id_goc, tenNutGoc: r.ten_nut_goc, nguonNut: r.nguon_nut, ten: r.ten, maNguon: r.ma_nguon, bac: r.catalog_tier, nguon: r.nguon, soTruc: r.so_truc, soCan: r.so_can })),
    can: can.rows.map((r) => ({ key: r.unit_key, toaKey: r.building_key, tang: r.floor, truc: r.truc, ma: r.ma, bac: r.catalog_tier, nguon: r.nguon })),
    maNoi: maNoi.rows,
  }
}
