#!/usr/bin/env node
// noi-du-an-s06.mjs — DA32 ma-du-an-s06-thanh-nut: mã dự án S06 (≥10 tin căn hộ đang rao) thành bí danh của đúng một nút dự án
// qua một thẻ luật theo nguồn mà người xem mẫu trước khi áp (ROADMAP §3 mục 44 Hỏi-1, mục 48 QĐ5).
//   node noi-du-an-s06.mjs --the <tệp>                         dựng thẻ luật (chỉ đọc), dòng cuối «băm: <hex>»
//   node noi-du-an-s06.mjs --ap --bam <hex> --nguoi <tên>      áp đúng thẻ đã xem (băm lệch → không ghi gì)
//   node noi-du-an-s06.mjs --dao <rule_id> --nguoi <tên>       đảo cả loạt: bí danh nghỉ, trạng thái về chua_noi/dao-luat
// Luật xếp ngả ở lib/noi-du-an-s06-lop.mjs. Áp lên DB máy thu là lời riêng của Mạnh («Áp thẻ luật S06 <băm>»).
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { phanLop, dungThe, chuanTen, LY_DO } from "./lib/noi-du-an-s06-lop.mjs";

export const NGUON = "S06";
export const CAN_CU = "S06-ma-nguon";
export const NGUONG_TIN = 10;
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Tin S06 căn hộ đang rao có mã dự án nguồn; tỉnh = thị trường của xã (cây khu hai cấp: xã → thị trường).
const SQL_TIN = `
  SELECT c.payload ->> 'projectid' AS ma, c.payload ->> 'pty_project_name' AS ten, r.area_id,
         (c.payload ->> 'latitude')::float AS lat,
         CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END AS tinh
    FROM sale_offer_records r
    JOIN stg_chotot_ads c ON c.list_id::text = r.originating_system_key
    LEFT JOIN areas a ON a.id = r.area_id
   WHERE r.source = 'S06' AND r.property_type = 'apartment' AND r.retired_at IS NULL AND r.superseded_by IS NULL
     AND coalesce(c.payload ->> 'projectid', '') <> ''`;

/** Một dòng mỗi mã ≥10 tin: tên, số tin, tỉnh (mảng), xã nhiều tin nhất (hoà → id nhỏ nhất), độ tản vĩ độ (m). */
export const SQL_DOC_MA = `
  WITH o AS (${SQL_TIN}),
  xa AS (SELECT DISTINCT ON (ma) ma, area_id FROM o WHERE area_id IS NOT NULL
          GROUP BY ma, area_id ORDER BY ma, count(*) DESC, area_id)
  SELECT o.ma, min(o.ten) AS ten, count(*)::int AS so_tin,
         coalesce(array_agg(DISTINCT o.tinh) FILTER (WHERE o.tinh IS NOT NULL), '{}') AS tinh,
         xa.area_id AS xa_nhieu, ax.name AS xa_ten, at.name AS tinh_ten,
         coalesce((max(o.lat) - min(o.lat)) * 111000, 0)::float AS dlat_m
    FROM o LEFT JOIN xa ON xa.ma = o.ma
    LEFT JOIN areas ax ON ax.id = xa.area_id
    LEFT JOIN areas at ON at.id = CASE WHEN ax.region_type = 'market' THEN ax.id ELSE ax.parent_id END
   GROUP BY o.ma, xa.area_id, ax.name, at.name
  HAVING count(*) >= ${NGUONG_TIN}
   ORDER BY o.ma`;

export async function docMa(client) {
  return (await client.query(SQL_DOC_MA)).rows.map((r) => ({
    ma: r.ma, ten: r.ten ?? "", soTin: r.so_tin, tinh: r.tinh, xaNhieu: r.xa_nhieu,
    xaTen: r.xa_ten, tinhTen: r.tinh_ten, dlatM: r.dlat_m,
  }));
}

export async function docNut(client) {
  return (await client.query(`
    SELECT n.id::int AS id, n.name, n.aliases, n.catalog_tier,
           CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END AS tinh
      FROM asset_nodes n LEFT JOIN areas a ON a.id = n.area_ids[1]
     WHERE n.node_type = 'project'`)).rows;
}

async function docLink(client) {
  const { rows } = await client.query(`
    SELECT pl.source_project_id AS ma, pl.asset_node_id::int AS node_id, pl.status, pl.ly_do, n.catalog_tier
      FROM project_links pl LEFT JOIN asset_nodes n ON n.id = pl.asset_node_id
     WHERE pl.source = $1`, [NGUON]);
  return new Map(rows.map((r) => [r.ma, r]));
}

async function docBiDanh(client) {
  const { rows } = await client.query(`
    SELECT id, substring(value FROM 7) AS ma, object_key FROM registry_aliases
     WHERE source = $1 AND kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\\_an/%'`, [NGUON]);
  return new Map(rows.map((r) => [r.ma, r]));
}

/** Dựng thẻ trên dữ liệu hiện tại. ds: mỗi mã một dòng kèm kết cục. */
export async function dungTheLuat(client) {
  const ma = await docMa(client);
  const nut = await docNut(client);
  const link = await docLink(client);
  const tenNut = new Map(nut.map((n) => [n.id, n.name]));
  const ds = ma.map((m) => {
    const l = link.get(m.ma);
    const daNoi = l?.node_id != null ? { asset_node_id: l.node_id, laUngVien: l.catalog_tier === "mot_loi_khai" } : null;
    const kq = phanLop(m, nut, daNoi);
    return { ma: m.ma, ten: m.ten, tinh: m.tinhTen, xa: m.xaTen, soTin: m.soTin, xaId: m.xaNhieu, kq,
      tenNut: kq.node_id != null ? tenNut.get(kq.node_id) : undefined };
  });
  return { ...dungThe(ds), ds };
}

async function moGiaoDich(client, giaoDich) {
  if (giaoDich === "ngoai") await client.query("SAVEPOINT ms6_gd"); else await client.query("BEGIN");
}
async function dongGiaoDich(client, giaoDich, ok) {
  if (giaoDich === "ngoai") await client.query(ok ? "RELEASE SAVEPOINT ms6_gd" : "ROLLBACK TO SAVEPOINT ms6_gd");
  else await client.query(ok ? "COMMIT" : "ROLLBACK");
}

async function slugRieng(client, ten) {
  const goc = chuanTen(ten).replace(/ /g, "-") || "du-an";
  const { rows } = await client.query(`SELECT slug FROM asset_nodes WHERE slug = $1 OR slug ~ ('^' || $1 || '-[0-9]+$')`, [goc]);
  const co = new Set(rows.map((r) => r.slug));
  if (!co.has(goc)) return goc;
  for (let i = 2; ; i++) if (!co.has(`${goc}-${i}`)) return `${goc}-${i}`;
}

/** Áp thẻ luật đúng băm. Trả rule_id (null khi không đổi gì). Băm lệch → ném «bam-lech», không ghi gì. */
export async function apTheLuat(client, { bam, nguoi, giaoDich = "rieng", _sauNutDau = null }) {
  if (!/^[0-9a-f]{64}$/.test(String(bam ?? ""))) throw new Error("bam-sai-khuon: cần --bam <64 hex>");
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await moGiaoDich(client, giaoDich);
  let ok = false;
  try {
    await client.query("LOCK TABLE project_links IN SHARE ROW EXCLUSIVE MODE");
    const the = await dungTheLuat(client);
    if (the.bam !== bam) throw new Error(`bam-lech: thẻ hiện tại ${the.bam}, băm khai ${bam} — dựng thẻ mới rồi xem lại`);
    const link = await docLink(client);
    const biDanh = await docBiDanh(client);
    const dungRoi = (d) => {
      const l = link.get(d.ma);
      const a = biDanh.get(d.ma);
      if (d.kq.status === "chua_noi") return l?.status === "chua_noi" && l.ly_do === d.kq.ly_do && !a;
      if (d.kq.node_id == null) return false; // mã cần đúc nút mới
      return l?.status === "noi" && l.node_id === d.kq.node_id && a?.object_key === `node:${d.kq.node_id}`;
    };
    if (the.ds.every(dungRoi)) { ok = true; return { rule_id: null, khongDoi: true }; }
    const { rows: [luat] } = await client.query(
      `INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by) VALUES ($1, $2, $3, $4, $5) RETURNING id::int`,
      [NGUON, CAN_CU, bam, the.ds.length, String(nguoi).trim()]);
    let daDuc = 0;
    for (const d of the.ds) {
      const a = biDanh.get(d.ma);
      if (d.kq.status === "chua_noi") {
        if (a) await client.query("UPDATE registry_aliases SET retired_at = now() WHERE id = $1", [a.id]);
        await client.query(
          `INSERT INTO project_links (source, source_project_id, asset_node_id, status, can_cu, ly_do, rule_id)
           VALUES ($1, $2, $3, 'chua_noi', $4, $5, $6)
           ON CONFLICT (source, source_project_id) DO UPDATE SET status = 'chua_noi', ly_do = EXCLUDED.ly_do,
             can_cu = EXCLUDED.can_cu, rule_id = EXCLUDED.rule_id, updated_at = now()`,
          [NGUON, d.ma, link.get(d.ma)?.node_id ?? null, CAN_CU, d.kq.ly_do, luat.id]);
        continue;
      }
      let nodeId = d.kq.node_id;
      if (nodeId == null) {
        const ten = String(d.ten).trim();
        const { rows: [n] } = await client.query(
          `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
           VALUES ('project', $1, $2, ARRAY[lower($1)], $3, 'mot_loi_khai', $4) RETURNING id::int`,
          [ten, await slugRieng(client, ten), d.xaId ? [d.xaId] : [], { nguon: NGUON, rule_id: luat.id }]);
        nodeId = n.id;
        if (++daDuc === 1 && _sauNutDau) await _sauNutDau();
      }
      const key = `node:${nodeId}`;
      if (a && a.object_key !== key) await client.query("UPDATE registry_aliases SET retired_at = now() WHERE id = $1", [a.id]);
      if (!a || a.object_key !== key) {
        await client.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)`,
          [key, `du_an/${d.ma}`, NGUON]);
      }
      await client.query(
        `INSERT INTO project_links (source, source_project_id, asset_node_id, status, can_cu, ly_do, rule_id)
         VALUES ($1, $2, $3, 'noi', $4, NULL, $5)
         ON CONFLICT (source, source_project_id) DO UPDATE SET asset_node_id = EXCLUDED.asset_node_id, status = 'noi',
           ly_do = NULL, can_cu = EXCLUDED.can_cu, rule_id = EXCLUDED.rule_id, updated_at = now()`,
        [NGUON, d.ma, nodeId, CAN_CU, luat.id]);
    }
    ok = true;
    return { rule_id: luat.id, khongDoi: false };
  } finally {
    await dongGiaoDich(client, giaoDich, ok);
  }
}

/** Đảo một luật: bí danh của các mã luật đã nối nghỉ, trạng thái về chua_noi/dao-luat (giữ nút), luật ghi người đảo. */
export async function daoTheLuat(client, { ruleId, nguoi, giaoDich = "rieng", _giuaChung = null }) {
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await moGiaoDich(client, giaoDich);
  let ok = false;
  try {
    const { rows: [luat] } = await client.query("SELECT id, dao_at FROM project_link_rules WHERE id = $1 FOR UPDATE", [ruleId]);
    if (!luat) throw new Error(`luat-khong-co: ${ruleId}`);
    if (luat.dao_at) throw new Error(`da-dao: luật ${ruleId} đã đảo`);
    const { rowCount: soBiDanh } = await client.query(`
      UPDATE registry_aliases a SET retired_at = now()
        FROM project_links pl
       WHERE pl.source = $1 AND pl.rule_id = $2 AND pl.status = 'noi'
         AND a.source = $1 AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.value = 'du_an/' || pl.source_project_id`,
      [NGUON, ruleId]);
    if (_giuaChung) await _giuaChung();
    await client.query(`
      UPDATE project_links SET status = 'chua_noi', ly_do = $3, updated_at = now()
       WHERE source = $1 AND rule_id = $2 AND status = 'noi'`, [NGUON, ruleId, LY_DO.daoLuat]);
    await client.query("UPDATE project_link_rules SET dao_by = $2, dao_at = now() WHERE id = $1", [ruleId, String(nguoi).trim()]);
    ok = true;
    return { soBiDanh };
  } finally {
    await dongGiaoDich(client, giaoDich, ok);
  }
}

// ---- Ba câu kiểm bất biến (AC-5); dùng lại ở bản chạy trên dữ liệu thật ----
const SQL_BI_DANH_SONG = `SELECT substring(value FROM 7) AS ma, object_key FROM registry_aliases
  WHERE source = 'S06' AND kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\\_an/%' AND object_key LIKE 'node:%'`;

/** Mã có bí danh còn hiệu lực trỏ từ hai nút trở lên. */
export async function kiemHaiNut(client) {
  return (await client.query(`SELECT ma FROM (${SQL_BI_DANH_SONG}) b GROUP BY ma HAVING count(DISTINCT object_key) > 1 ORDER BY ma`)).rows;
}

/** Cặp mã–nút còn hiệu lực mà tỉnh của nút không nằm trong các tỉnh có tin của mã. */
export async function kiemLechTinh(client) {
  return (await client.query(`
    WITH o AS (${SQL_TIN}),
    t AS (SELECT ma, array_agg(DISTINCT tinh) FILTER (WHERE tinh IS NOT NULL) AS tinh FROM o GROUP BY ma),
    b AS (${SQL_BI_DANH_SONG})
    SELECT b.ma FROM b
      JOIN asset_nodes n ON n.id = substring(b.object_key FROM 6)::bigint
      LEFT JOIN areas a ON a.id = n.area_ids[1]
      JOIN t ON t.ma = b.ma
     WHERE NOT (CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END = ANY (t.tinh))
        OR a.id IS NULL
     ORDER BY b.ma`)).rows;
}

/** Mã ≥10 tin thiếu dòng project_links. */
export async function kiemThieuTrangThai(client) {
  return (await client.query(`
    SELECT m.ma FROM (${SQL_DOC_MA}) m
     WHERE NOT EXISTS (SELECT 1 FROM project_links pl WHERE pl.source = 'S06' AND pl.source_project_id = m.ma)
     ORDER BY m.ma`)).rows;
}

// ---- CLI ----
function thamSo(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--ap") a.ap = true;
    else if (["--the", "--bam", "--nguoi", "--dao"].includes(k)) a[k.slice(2)] = argv[++i];
    else a._.push(k);
  }
  return a;
}

async function main(argv) {
  const a = thamSo(argv);
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    if (a.the) {
      const the = await dungTheLuat(client);
      writeFileSync(a.the, the.markdown);
      const tin = Object.values(the.tong).reduce((s, t) => s + t.tin, 0);
      console.log(`thẻ: ${the.ds.length} mã ≥${NGUONG_TIN} tin, ${tin} tin, băm ${the.bam} → ${a.the}`);
    } else if (a.ap) {
      const kq = await apTheLuat(client, { bam: a.bam, nguoi: a.nguoi });
      console.log(kq.khongDoi ? "đã áp, không đổi" : `đã áp luật ${kq.rule_id}`);
    } else if (a.dao) {
      const kq = await daoTheLuat(client, { ruleId: Number(a.dao), nguoi: a.nguoi });
      console.log(`đã đảo luật ${a.dao}: ${kq.soBiDanh} bí danh nghỉ`);
    } else {
      console.error("dùng: --the <tệp> | --ap --bam <hex> --nguoi <tên> | --dao <rule_id> --nguoi <tên>");
      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

// So bằng realpath: launchd gọi qua symlink ~/dev/one-invest (scripts/entrypoint-symlink.test.mjs AC-3).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exitCode = 1; });
}
