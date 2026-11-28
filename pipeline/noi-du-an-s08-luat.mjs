#!/usr/bin/env node
// noi-du-an-s08-luat.mjs — DA55 soat-noi-s08-danh-ba: dự án S08 (stg_s08_project) vào danh bạ qua một thẻ luật theo nguồn mà Mạnh
// xem trước khi áp: nối nút có sẵn khi tên chuẩn trùng cùng tỉnh, đúc nút ứng viên khi không khớp, thẻ từng cặp hay từ chối có lý do.
//   node noi-du-an-s08-luat.mjs --the <tệp>                       dựng thẻ (chỉ đọc), dòng cuối «băm: <hex>»
//   node noi-du-an-s08-luat.mjs --ap --bam <hex> --nguoi <tên>    áp đúng thẻ đã xem (băm lệch → không ghi gì)
//   node noi-du-an-s08-luat.mjs --dao <rule_id> --nguoi <tên>     đảo cả lượt: bí danh nghỉ, dòng noi về chua_noi/dao-luat, giữ nút
//   node noi-du-an-s08-luat.mjs --kiem <rule_id>                  ba bất biến; lệch → thoát 1, in loại lỗi và số đếm
// Bảng tay s08_project_links (DN1) giữ nguyên; dự án đã nối tay thẻ không ghi gì. Không in mã dự án S08.
// Luật xếp ngả ở lib/noi-du-an-s08-lop.mjs. Áp lên DB máy thu là lời riêng của Mạnh kèm băm (design doc §7).
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { CAN_CU, LY_DO, NGUON, chuanTen, dungTheS08, khoaNhom, phanLopS08, tenGoc } from "./lib/noi-du-an-s08-lop.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Mỗi dự án S08 một dòng (bản danh mục mới nhất): tên, số căn, tỉnh và xã phủ điểm bản đồ, đã nối tay chưa. */
export const SQL_DU_AN = `
  WITH p AS (SELECT DISTINCT ON (project_id) project_id, catalog_payload cp, point_lng, point_lat
               FROM stg_s08_project ORDER BY project_id, fetched_at DESC NULLS LAST),
       inv AS (SELECT project_id::text AS pid, count(DISTINCT product_code)::int AS can FROM stg_s08_inventory GROUP BY 1),
       diem AS (SELECT project_id, ST_SetSRID(ST_MakePoint(point_lng::float, point_lat::float), 4326) AS g FROM p WHERE point_lng IS NOT NULL)
  SELECT p.project_id AS ma, p.cp ->> 'project_name' AS ten, coalesce(inv.can, 0) AS so_can,
         (SELECT a.id FROM areas a, diem WHERE diem.project_id = p.project_id AND a.region_type = 'market' AND a.geom IS NOT NULL
             AND ST_Covers(a.geom, diem.g) ORDER BY a.id LIMIT 1) AS tinh,
         (SELECT a.id FROM areas a, diem WHERE diem.project_id = p.project_id AND a.region_type <> 'market' AND a.geom IS NOT NULL
             AND ST_Covers(a.geom, diem.g) ORDER BY a.id LIMIT 1) AS xa,
         p.point_lng::float AS lng, p.point_lat::float AS lat,
         EXISTS (SELECT 1 FROM s08_project_links l WHERE l.project_id = p.project_id AND l.status = 'noi') AS noi_tay
    FROM p LEFT JOIN inv ON inv.pid = p.project_id
   ORDER BY p.project_id`;

export async function docDuAn(client) {
  return (await client.query(SQL_DU_AN)).rows.map((r) => ({ ...r, noiTay: r.noi_tay, soCan: r.so_can }));
}

/** Nút project kèm tỉnh (thị trường của xã đầu; null khi chưa có xã) và nguồn đúc (meta.nguon hay meta.nguon_ung_vien). */
export async function docNut(client) {
  return (await client.query(`
    SELECT n.id::int AS id, n.name, n.aliases, n.catalog_tier, coalesce(n.meta ->> 'nguon', n.meta ->> 'nguon_ung_vien') AS nguon,
           CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END AS tinh
      FROM asset_nodes n LEFT JOIN areas a ON a.id = n.area_ids[1]
     WHERE n.node_type = 'project'`)).rows;
}

async function docLink(client) {
  const { rows } = await client.query(`
    SELECT pl.source_project_id AS ma, pl.asset_node_id::int AS node_id, pl.status, pl.ly_do, n.meta ->> 'nguon' AS nguon_nut
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

/**
 * DA65: khoá nhóm → id nút S08 đã đúc cho nhóm ở lượt trước. Hai đường gom: dự án S08 đang trỏ nút S08 (theo khoá của dự án),
 * và chính nút S08 (theo tên gốc + tỉnh của nút) — nút có dự án đã rời nhóm vẫn được thấy.
 */
export function nhomDaDuc(duAn, nut, link) {
  const m = new Map();
  const them = (k, id) => m.set(k, [...new Set([...(m.get(k) ?? []), Number(id)])]);
  for (const n of nut) if (n.nguon === NGUON && n.tinh) them(khoaNhom(n.name, n.tinh), n.id);
  for (const d of duAn) {
    const l = link.get(d.ma);
    if (d.tinh && l?.node_id != null && l.nguon_nut === NGUON) them(khoaNhom(d.ten, d.tinh), l.node_id);
  }
  return m;
}

/** Dựng thẻ trên dữ liệu hiện tại. ds: mỗi dự án một dòng kèm kết cục. */
export async function dungTheLuat(client) {
  const duAn = await docDuAn(client);
  const nut = await docNut(client);
  const link = await docLink(client);
  const daDuc = nhomDaDuc(duAn, nut, link);
  const tenNut = new Map(nut.map((n) => [n.id, n.name]));
  const { rows: tenTinh } = await client.query("SELECT id, name FROM areas WHERE region_type = 'market'");
  const tinhTen = new Map(tenTinh.map((r) => [r.id, r.name]));
  const ds = duAn.map((d) => {
    const l = link.get(d.ma);
    const daNoi = l?.node_id != null ? { asset_node_id: l.node_id, laUngVienS08: l.nguon_nut === NGUON } : null;
    const kq = phanLopS08({ ma: d.ma, ten: d.ten, tinh: d.tinh, noiTay: d.noiTay }, nut, daNoi, daDuc);
    return { ma: d.ma, ten: d.ten, tinh: tinhTen.get(d.tinh) ?? d.tinh, tinhId: d.tinh, xa: d.xa, lng: d.lng, lat: d.lat, soCan: d.soCan, kq,
      tenNut: kq.node_id != null ? tenNut.get(kq.node_id) : undefined, tenUngVien: kq.ung_vien?.map((id) => tenNut.get(id) ?? `#${id}`) };
  });
  return { ...dungTheS08(ds), ds };
}

async function moGiaoDich(client, giaoDich) {
  if (giaoDich === "ngoai") await client.query("SAVEPOINT ns8_gd"); else await client.query("BEGIN");
}
async function dongGiaoDich(client, giaoDich, ok) {
  if (giaoDich === "ngoai") await client.query(ok ? "RELEASE SAVEPOINT ns8_gd" : "ROLLBACK TO SAVEPOINT ns8_gd");
  else await client.query(ok ? "COMMIT" : "ROLLBACK");
}

async function slugRieng(client, ten) {
  const goc = chuanTen(ten).replace(/ /g, "-") || "du-an";
  const { rows } = await client.query(`SELECT slug FROM asset_nodes WHERE slug = $1 OR slug ~ ('^' || $1 || '-[0-9]+$')`, [goc]);
  const co = new Set(rows.map((r) => r.slug));
  if (!co.has(goc)) return goc;
  for (let i = 2; ; i++) if (!co.has(`${goc}-${i}`)) return `${goc}-${i}`;
}

const datLink = (client, ma, nodeId, status, canCu, lyDo, ruleId) => client.query(
  `INSERT INTO project_links (source, source_project_id, asset_node_id, status, can_cu, ly_do, rule_id)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   ON CONFLICT (source, source_project_id) DO UPDATE SET asset_node_id = EXCLUDED.asset_node_id, status = EXCLUDED.status,
     can_cu = EXCLUDED.can_cu, ly_do = EXCLUDED.ly_do, rule_id = EXCLUDED.rule_id, updated_at = now()`,
  [NGUON, ma, nodeId, status, canCu, lyDo, ruleId]);

/** Áp thẻ luật đúng băm. Trả rule_id (null khi không đổi gì). Băm lệch → ném «bam-lech», không ghi gì. */
export async function apTheLuat(client, { bam, nguoi, giaoDich = "rieng" }) {
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
    const viec = the.ds.filter((d) => d.kq.status !== "giu_tay");
    const dungRoi = (d) => {
      const l = link.get(d.ma);
      const a = biDanh.get(d.ma);
      if (d.kq.status === "chua_noi") return l?.status === "chua_noi" && l.ly_do === d.kq.ly_do && !a;
      if (d.kq.node_id == null) return false; // nhóm cần đúc nút mới
      return l?.status === "noi" && l.node_id === d.kq.node_id && a?.object_key === `node:${d.kq.node_id}`;
    };
    if (viec.every(dungRoi)) { ok = true; return { rule_id: null, khongDoi: true }; }
    const { rows: [luat] } = await client.query(
      `INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by) VALUES ($1, $2, $3, $4, $5) RETURNING id::int`,
      [NGUON, CAN_CU.luat, bam, viec.length, String(nguoi).trim()]);
    const nutNhom = new Map();
    let soNutMoi = 0;
    for (const d of viec) {
      const a = biDanh.get(d.ma);
      if (d.kq.status === "chua_noi") {
        if (a) await client.query("UPDATE registry_aliases SET retired_at = now() WHERE id = $1", [a.id]);
        await datLink(client, d.ma, null, "chua_noi", CAN_CU.luat, d.kq.ly_do, luat.id);
        continue;
      }
      let nodeId = d.kq.node_id ?? nutNhom.get(d.kq.nhom);
      if (nodeId == null) {
        const ten = tenGoc(d.ten);
        const { rows: [n] } = await client.query(
          `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
           VALUES ('project', $1, $2, ARRAY[lower($1)], $3, 'mot_loi_khai', $4) RETURNING id::int`,
          [ten, await slugRieng(client, ten), [d.xa ?? d.tinhId], { nguon: NGUON, rule_id: luat.id, diem: { lng: d.lng, lat: d.lat } }]);
        nodeId = n.id;
        nutNhom.set(d.kq.nhom, nodeId);
        soNutMoi++;
      }
      const key = `node:${nodeId}`;
      if (a && a.object_key !== key) await client.query("UPDATE registry_aliases SET retired_at = now() WHERE id = $1", [a.id]);
      if (!a || a.object_key !== key) {
        await client.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)`,
          [key, `du_an/${d.ma}`, NGUON]);
      }
      await datLink(client, d.ma, nodeId, "noi", d.kq.can_cu, null, luat.id);
    }
    ok = true;
    return { rule_id: luat.id, khongDoi: false, soNutMoi };
  } finally {
    await dongGiaoDich(client, giaoDich, ok);
  }
}

/** Đảo một lượt: bí danh của các dự án lượt đã nối nghỉ, dòng noi về chua_noi/dao-luat (giữ nút), luật ghi người đảo. */
export async function daoTheLuat(client, { ruleId, nguoi, giaoDich = "rieng" }) {
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await moGiaoDich(client, giaoDich);
  let ok = false;
  try {
    const { rows: [luat] } = await client.query("SELECT id, source, dao_at FROM project_link_rules WHERE id = $1 FOR UPDATE", [ruleId]);
    if (!luat || luat.source !== NGUON) throw new Error(`luat-khong-co: ${ruleId}`);
    if (luat.dao_at) throw new Error(`da-dao: luật ${ruleId} đã đảo`);
    const { rowCount: soBiDanh } = await client.query(`
      UPDATE registry_aliases a SET retired_at = now()
        FROM project_links pl
       WHERE pl.source = $1 AND pl.rule_id = $2 AND pl.status = 'noi'
         AND a.source = $1 AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.value = 'du_an/' || pl.source_project_id`,
      [NGUON, ruleId]);
    await client.query(`UPDATE project_links SET status = 'chua_noi', ly_do = $3, updated_at = now()
                         WHERE source = $1 AND rule_id = $2 AND status = 'noi'`, [NGUON, ruleId, LY_DO.daoLuat]);
    await client.query("UPDATE project_link_rules SET dao_by = $2, dao_at = now() WHERE id = $1", [ruleId, String(nguoi).trim()]);
    ok = true;
    return { soBiDanh };
  } finally {
    await dongGiaoDich(client, giaoDich, ok);
  }
}

/** Ba bất biến của bảng luật S08 (AC-5). Trả số đếm theo loại lỗi; không trả mã. */
export async function kiemLuot(client) {
  const { rows: [h] } = await client.query(`
    SELECT count(*)::int AS n FROM (
      SELECT value FROM registry_aliases WHERE source = $1 AND kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\\_an/%'
       GROUP BY value HAVING count(DISTINCT object_key) > 1) x`, [NGUON]);
  const duAn = await docDuAn(client);
  const tinhDa = new Map(duAn.map((d) => [d.ma, d.tinh]));
  const nut = new Map((await docNut(client)).map((n) => [n.id, n.tinh]));
  const { rows: noi } = await client.query(
    "SELECT source_project_id AS ma, asset_node_id::int AS node_id FROM project_links WHERE source = $1 AND status = 'noi'", [NGUON]);
  const lechTinh = noi.filter((r) => { const t = nut.get(r.node_id); return t == null || t !== tinhDa.get(r.ma); }).length;
  const { rows: co } = await client.query(
    "SELECT source_project_id AS ma FROM project_links WHERE source = $1 UNION SELECT project_id FROM s08_project_links", [NGUON]);
  const coDong = new Set(co.map((r) => r.ma));
  const thieu = duAn.filter((d) => !coDong.has(d.ma)).length;
  return { hai_nut: h.n, lech_tinh: lechTinh, thieu_trang_thai: thieu };
}

// ---- CLI ----
function thamSo(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--ap") a.ap = true;
    else if (["--the", "--bam", "--nguoi", "--dao", "--kiem"].includes(k)) a[k.slice(2)] = argv[++i];
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
      const nga = Object.entries(the.tong).map(([k, t]) => `${k} ${t.du_an}`).join(" · ");
      console.log(`thẻ: ${the.ds.length} dự án (${nga}), ${the.soNutMoi} nút mới, băm ${the.bam} → ${a.the}`);
    } else if (a.ap) {
      const kq = await apTheLuat(client, { bam: a.bam, nguoi: a.nguoi });
      console.log(kq.khongDoi ? "đã áp, không đổi" : `đã áp luật ${kq.rule_id}: ${kq.soNutMoi} nút mới`);
    } else if (a.dao) {
      const kq = await daoTheLuat(client, { ruleId: Number(a.dao), nguoi: a.nguoi });
      console.log(`đã đảo luật ${a.dao}: ${kq.soBiDanh} bí danh nghỉ`);
    } else if (a.kiem) {
      const k = await kiemLuot(client);
      const loi = Object.entries(k).filter(([, n]) => n > 0);
      if (loi.length) { console.log(`kiểm lượt S08: lỗi — ${loi.map(([t, n]) => `${t} ${n}`).join(" · ")}`); process.exitCode = 1; }
      else console.log("kiểm lượt S08: đạt");
    } else {
      console.error("dùng: --the <tệp> | --ap --bam <hex> --nguoi <tên> | --dao <rule_id> --nguoi <tên> | --kiem <rule_id>");
      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

// So bằng realpath: launchd gọi qua symlink ~/dev/one-invest.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exitCode = 1; });
}
