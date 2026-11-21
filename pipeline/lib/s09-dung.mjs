// s09-dung.mjs — DA31 toa-s09-hai-khu-vao-danh-ba: bước S09 của lệnh dựng danh bạ vật thể (pipeline/danh-ba-vat-the.mjs).
// Chạy trong giao dịch và khoá cố vấn của DB1, sau bước S08 (thiết kế §4.3):
//   1. phân khu S09 → nút subzone con của khu; nút cùng tên có sẵn thì dùng lại (gắn meta.s09_sector_ids);
//   2. cụm (Hỏi-1): tiền tố «S10» từ hai toà cùng phân khu → nút subzone con của phân khu (meta.s09_cum);
//   3. toà: bí danh ma_nguon S09 trước; chưa có thì so tên với toà của khu — khớp một → bí danh, không khớp → đúc toà
//      `mot_loi_khai` (Hỏi-3) với nút vùng = cụm/phân khu, khớp từ hai → thẻ review_queue entity_match, không ghi toà nào.
// Toà S08 giữ region_node_id (082 chỉ thêm); nút vùng hiệu lực qua view v_toa_nut_vung (097). DB chưa áp 097 hay khu không
// có dòng S09 → bỏ qua có in lý do. Không in mã nguồn ra stdout.
import { chuanHoaTenToa, moiKhoa, upiToa } from "./danh-ba-vat-the.mjs";
import { DUONG, MA_DU_AN, MA_TOA, lechTangS16, phanLopDuAn, xetToa } from "./s09-danh-ba-can.mjs";
import { NOI_DU_AN_S16 } from "./s16-danh-muc.mjs";
import { createHash } from "node:crypto";
import { NGUON_S09, NOI_KHU_S09, cumS09, khoaTenS09, tienToCum, toaS09 } from "./s09-du-an.mjs";
const khoaTen = khoaTenS09;

const thuong = (s) => String(s ?? "").normalize("NFC").trim().toLowerCase();
const slugify = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const dsMeta = (n, k) => (Array.isArray(n.meta?.[k]) ? n.meta[k] : []);

/** Thẻ duyệt một lần mỗi mục (mọi trạng thái): chạy lại không nhân thẻ, thẻ đã quyết không mở lại. */
async function theDuyet(c, itemId, title, evidence) {
  const r = await c.query(
    `INSERT INTO review_queue (item_type, item_id, title, evidence)
     SELECT 'entity_match', $1, $2, $3::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM review_queue WHERE item_type = 'entity_match' AND item_id = $1)`,
    [itemId, title, JSON.stringify(evidence)]);
  return r.rowCount;
}

/**
 * Bước S09 cho các khu đang dựng.
 * @param {import("pg").Client} c — đang trong giao dịch của dung()
 * @param {{ khu: Map<number, {id:number, slug:string}>, isoKhu: Map<number,string>, noi?: Record<string,string>,
 *           log?: (s:string)=>void, taoKhoa?: (t:string)=>string }} o
 */
export async function buocS09(c, { khu, isoKhu, noi = NOI_KHU_S09, log = console.log, taoKhoa = (t) => moiKhoa(t) }) {
  if (!(await c.query("SELECT to_regclass('public.stg_s09_item') AS t")).rows[0].t) {
    log("danh-ba-vat-the: S09 bỏ qua — DB chưa áp 097 (không có stg_s09_item)");
    return { bo_qua: "chua-ap-097" };
  }
  const theoSlug = new Map([...khu.values()].map((k) => [k.slug, k]));
  const ra = { khu: {}, bo_qua_khu: [] };
  for (const [pid, slug] of Object.entries(noi)) {
    const k = theoSlug.get(slug);
    if (!k) continue;
    const { rows: da } = await c.query("SELECT data FROM v_s09_du_an_moi WHERE project_id = $1", [pid]);
    if (!da.length) {
      log(`danh-ba-vat-the: S09 bỏ qua — khu ${slug} không có dòng S09`);
      ra.bo_qua_khu.push(slug);
      continue;
    }
    const data = da[0].data;
    const tk = { phan_khu_moi: 0, phan_khu_dung_lai: 0, cum_moi: 0, toa_moi: 0, toa_co_nhan_bi_danh: 0, toa_da_noi: 0, the_moi: 0, mo_ho: 0 };

    // ---- 1. Phân khu ----
    const { rows: con } = await c.query(
      "SELECT id::int AS id, name, slug, aliases, meta FROM asset_nodes WHERE parent_id = $1 ORDER BY id", [k.id]);
    const nutPhanKhu = new Map(); // sector_id → node id
    const sectors = (Array.isArray(data.insight_by_sector) ? data.insight_by_sector : [])
      .filter((s) => s?.sector_id && String(s.sector_name ?? "").trim());
    for (const s of sectors) {
      const ten = thuong(s.sector_name);
      let n = con.find((x) => dsMeta(x, "s09_sector_ids").includes(s.sector_id))
        ?? con.find((x) => thuong(x.name) === ten || (x.aliases ?? []).some((a) => thuong(a) === ten));
      if (n) {
        if (!dsMeta(n, "s09_sector_ids").includes(s.sector_id)) {
          await c.query(
            `UPDATE asset_nodes SET meta = jsonb_set(meta, '{s09_sector_ids}',
               COALESCE(meta -> 's09_sector_ids', '[]'::jsonb) || to_jsonb($2::text)) WHERE id = $1`, [n.id, s.sector_id]);
          n.meta = { ...(n.meta ?? {}), s09_sector_ids: [...dsMeta(n, "s09_sector_ids"), s.sector_id] };
          tk.phan_khu_dung_lai++;
        }
      } else {
        const { rows } = await c.query(
          `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
           VALUES ('subzone', $1, $2, $3, $4, '{}', 'SubdivisionName', $5::jsonb)
           RETURNING id::int AS id, name, slug, aliases, meta`,
          [String(s.sector_name).trim(), `${slug}-${slugify(s.sector_name)}`, k.id, [ten],
           JSON.stringify({ parent_slug: slug, s09_sector_ids: [s.sector_id] })]);
        n = rows[0];
        con.push(n);
        tk.phan_khu_moi++;
      }
      nutPhanKhu.set(s.sector_id, n.id);
    }

    // ---- 2. Gộp toà, cụm ----
    const { toa, mo_ho } = toaS09(data);
    const nutCum = new Map(); // `${sector}|${tien_to}` → node id
    for (const cu of cumS09(toa)) {
      const cha = nutPhanKhu.get(cu.sector_id);
      if (!cha) continue;
      const chaSlug = con.find((x) => x.id === cha)?.slug ?? slug;
      const { rows: co } = await c.query(
        "SELECT id::int AS id FROM asset_nodes WHERE parent_id = $1 AND meta ->> 's09_cum' = $2", [cha, cu.tien_to]);
      let id = co[0]?.id;
      if (!id) {
        const r = await c.query(
          `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
           VALUES ('subzone', $1, $2, $3, $4, '{}', 'SubdivisionName', $5::jsonb) RETURNING id::int AS id`,
          [cu.tien_to, `${slug}-cum-${slugify(cu.tien_to)}`, cha, [thuong(cu.tien_to)],
           JSON.stringify({ parent_slug: chaSlug, s09_cum: cu.tien_to, s09_sector_id: cu.sector_id })]);
        id = r.rows[0].id;
        tk.cum_moi++;
      }
      nutCum.set(`${cu.sector_id}|${cu.tien_to}`, id);
    }
    const nutVung = (t) => nutCum.get(`${t.sector_id}|${tienToCum(t.ten_chuan)}`) ?? nutPhanKhu.get(t.sector_id) ?? k.id;

    // ---- 3. Toà ----
    const { rows: mn } = await c.query(
      "SELECT value, object_key FROM registry_aliases WHERE retired_at IS NULL AND kind = 'ma_nguon' AND source = $1", [NGUON_S09]);
    const maNguon = new Map(mn.map((r) => [r.value, r.object_key]));
    const { rows: toaKhu } = await c.query(
      `SELECT b.building_key FROM buildings b
         JOIN asset_nodes n ON n.id = b.region_node_id
         LEFT JOIN asset_nodes p ON p.id = n.parent_id
         LEFT JOIN asset_nodes g ON g.id = p.parent_id
        WHERE b.status = 'active' AND $1 IN (n.id, p.id, g.id)`, [k.id]);
    const { rows: ten } = await c.query(
      "SELECT object_key, value FROM registry_aliases WHERE kind = 'ten' AND retired_at IS NULL AND object_key = ANY($1)",
      [toaKhu.map((r) => r.building_key)]);
    const theoTen = new Map();
    for (const r of ten) {
      const t = khoaTenS09(r.value);
      theoTen.set(t, new Set([...(theoTen.get(t) ?? []), r.object_key]));
    }
    const ghiBiDanh = async (key, t) => {
      for (const id of t.block_ids) {
        const v = `${pid}/${id}`;
        if (maNguon.has(v)) continue;
        await c.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)", [key, v, NGUON_S09]);
        maNguon.set(v, key);
      }
      await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', $2, $3)
                     ON CONFLICT (object_key, kind, value) WHERE kind = 'ten' DO NOTHING`, [key, t.ten, NGUON_S09]);
    };
    for (const t of toa) {
      const daNoi = [...new Set(t.block_ids.map((id) => maNguon.get(`${pid}/${id}`)).filter(Boolean))];
      if (daNoi.length === 1) {
        await ghiBiDanh(daNoi[0], t);
        tk.toa_da_noi++;
        continue;
      }
      if (daNoi.length > 1) {
        tk.the_moi += await theDuyet(c, `s09-toa:${pid}/${t.ten_chuan}`, `Toà S09 «${t.ten}» nối hai toà danh bạ`,
          { khu: slug, ten: t.ten, building_keys: daNoi.sort(), block_ids: t.block_ids, ly_do: "ma-nguon-hai-toa" });
        continue;
      }
      const khop = [...(theoTen.get(t.ten_chuan) ?? [])].sort();
      if (khop.length === 1) {
        await ghiBiDanh(khop[0], t);
        tk.toa_co_nhan_bi_danh++;
      } else if (khop.length === 0) {
        const key = taoKhoa("bld");
        const iso = isoKhu.get(k.id);
        if (!iso) throw new Error(`khu ${slug}: không có mã tỉnh để đúc toà S09`);
        await c.query(
          `INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier) VALUES ($1, $2, $3, $4, 'mot_loi_khai')`,
          [key, nutVung(t), upiToa(iso, key), iso]);
        await ghiBiDanh(key, t);
        theoTen.set(t.ten_chuan, new Set([key]));
        tk.toa_moi++;
      } else {
        tk.the_moi += await theDuyet(c, `s09-toa:${pid}/${t.ten_chuan}`, `Toà S09 «${t.ten}» khớp ${khop.length} toà danh bạ`,
          { khu: slug, ten: t.ten, building_keys: khop, block_ids: t.block_ids, ly_do: "khop-nhieu-toa" });
      }
    }
    for (const m of mo_ho) {
      tk.mo_ho++;
      tk.the_moi += await theDuyet(c, `s09-toa-mo-ho:${pid}/${m.ten_chuan}`, `Toà S09 «${m.ten_chuan}» có ở hai phân khu`,
        { khu: slug, ten_chuan: m.ten_chuan, sector_ids: m.sector_ids, block_ids: m.block_ids, ly_do: "cung-ten-khac-phan-khu" });
    }
    ra.khu[slug] = tk;
  }
  return ra;
}

// =====================================================================================================================
// DA42 nap-s09-toa-tang-vao-danh-ba: bước S09 gói 1 (bảng stg_s09_danh_ba của 115). Chạy sau buocS09 (DA31) và trước buocS16
// trong cùng giao dịch của dung(); không phụ thuộc danh sách khu: xét mọi dự án trong danh mục gói 1 mới nhất.
//   1. dự án → bốn đường (phanLopDuAn): đã nối · thẻ luật nguồn S09 · thẻ từng cặp · nút ứng viên `mot_loi_khai`;
//      trạng thái ghi vào project_links (migration 100), nút ứng viên nhận bí danh node:<id> `danh-ba-du-an/<id>`;
//   2. toà của dự án đã nối (xetToa): bí danh `danh-ba-toa/<id>` + tên · thẻ · toà mới `mot_loi_khai` gắn nút dự án;
//      toà trùng tên với toà S16 (đã dựng hay mới ở stg) so số tầng — lệch thì thẻ, 0 bí danh, toà S09 đúc riêng.
// Không đổi cột gốc toà có sẵn, không xoá, không gộp, không tạo căn. Không in mã nguồn ra stdout.

/** Mã thẻ cặp toà S09 lệch tầng với S16: cùng một mã dù bước S09 hay bước S16 phát hiện (AC-8). */
export const theLechTangS16 = (toaId) => `s09-toa-lech-s16:${toaId}`;

/** Số tầng có căn của toà S16 theo tên chuẩn trong các dự án S16 của nút (đọc stg, không phụ thuộc đã dựng hay chưa). */
export async function soTangS16TheoTen(c, nodeSlug, noiS16 = NOI_DU_AN_S16) {
  const duAn = Object.entries(noiS16).filter(([, s]) => s === nodeSlug).map(([d]) => d);
  const ra = new Map();
  if (!duAn.length || !(await c.query("SELECT to_regclass('public.v_s16_can') AS t")).rows[0].t) return ra;
  const { rows } = await c.query(
    "SELECT toa_ten, count(DISTINCT tang)::int AS n FROM v_s16_can WHERE du_an = ANY($1) AND NOT COALESCE(mo_ho, false) AND tang IS NOT NULL GROUP BY 1",
    [duAn]);
  for (const r of rows) { const k = chuanHoaTenToa(r.toa_ten); ra.set(k, Math.max(ra.get(k) ?? 0, r.n)); }
  return ra;
}

/** Số tầng S09 của các toà mang bí danh gói 1, theo building_key (bước S16 tra trước khi gắn toà S09). */
export async function soTangS09TheoToa(c, buildingKeys) {
  const ra = new Map();
  if (!buildingKeys.length || !(await c.query("SELECT to_regclass('public.v_s09_db_tang') AS t")).rows[0].t) return ra;
  const { rows } = await c.query(
    `SELECT a.object_key, substring(a.value FROM 13) AS toa_id, (SELECT count(*)::int FROM v_s09_db_tang f WHERE f.toa_id = substring(a.value FROM 13)) AS n
       FROM registry_aliases a
      WHERE a.retired_at IS NULL AND a.source = $1 AND a.kind = 'ma_nguon' AND a.value LIKE 'danh-ba-toa/%' AND a.object_key = ANY($2)`,
    [NGUON_S09, buildingKeys]);
  for (const r of rows) ra.set(r.object_key, { toa_id: r.toa_id, so_tang: r.n });
  return ra;
}

/** Thẻ entity_match một lần mỗi mã (mọi trạng thái), mã giữ nguyên văn — bước S16 dùng cho thẻ lệch tầng chung. */
export async function theMuc(c, itemId, title, evidence) {
  const r = await c.query(
    `INSERT INTO review_queue (item_type, item_id, title, evidence)
     SELECT 'entity_match', $1, $2, $3::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM review_queue WHERE item_type = 'entity_match' AND item_id = $1)`,
    [itemId, title, JSON.stringify(evidence)]);
  return r.rowCount;
}

/**
 * @param {import("pg").Client} c — trong giao dịch của dung()
 * @param {{ noi?: Record<string,string>, noiS16?: Record<string,string>, log?: (s:string)=>void, taoKhoa?: (t:string)=>string }} o
 *   noi: dự án S09 đã nối bằng tay (mã dự án → slug nút) — cùng bảng NOI_KHU_S09 của DA31.
 */
export async function buocS09DanhBa(c, { noi = NOI_KHU_S09, noiS16 = NOI_DU_AN_S16, log = console.log, taoKhoa = (t) => moiKhoa(t) } = {}) {
  if (!(await c.query("SELECT to_regclass('public.stg_s09_danh_ba') AS t")).rows[0].t) {
    log("danh-ba-vat-the: S09 gói 1 bỏ qua — DB chưa áp 115 (không có stg_s09_danh_ba)");
    return { bo_qua: "chua-ap-115" };
  }
  const { rows: duAn } = await c.query(
    `SELECT d ->> 'id' AS du_an_id, d ->> 'name' AS ten,
            COALESCE(d -> 'project_locations' -> 0 ->> 'province_code', d -> 'project_locations' -> 0 -> 'province' ->> 'code') AS ma_tinh
       FROM (SELECT payload FROM v_s09_db_item_moi WHERE kind = 'danh-muc' ORDER BY fetched_at DESC NULLS LAST, snapshot_id DESC LIMIT 1) m
       CROSS JOIN LATERAL jsonb_array_elements(m.payload -> 'data') d
      WHERE NULLIF(btrim(d ->> 'id'), '') IS NOT NULL ORDER BY 1`);
  if (!duAn.length) { log("danh-ba-vat-the: S09 gói 1 bỏ qua — chưa có danh mục"); return { bo_qua: "chua-co-danh-muc" }; }
  const { rows: toaRows } = await c.query(
    `SELECT t.du_an_id, t.toa_id, t.toa_ten, t.thu_tu, (SELECT count(*)::int FROM v_s09_db_tang f WHERE f.toa_id = t.toa_id) AS so_tang
       FROM v_s09_db_toa t ORDER BY t.du_an_id, t.thu_tu`);
  const toaTheoDuAn = new Map();
  for (const r of toaRows) toaTheoDuAn.set(r.du_an_id, [...(toaTheoDuAn.get(r.du_an_id) ?? []), { toa_id: r.toa_id, ten: r.toa_ten, so_tang: r.so_tang }]);

  const { rows: iso } = await c.query("SELECT admin_code, iso_region FROM iso_regions").catch(() => ({ rows: [] }));
  const isoTheoMa = new Map(iso.map((r) => [r.admin_code, r.iso_region]));
  const { rows: nutRows } = await c.query("SELECT id::int AS id, name, aliases, slug FROM asset_nodes WHERE node_type = 'project'");
  const nutTheoSlug = new Map(nutRows.map((n) => [n.slug, n]));
  const noiCung = new Map(Object.entries(noi).filter(([, s]) => nutTheoSlug.has(s)).map(([p, s]) => [p, nutTheoSlug.get(s).id]));
  const { rows: linkRows } = await c.query(
    `SELECT l.source_project_id, l.status, l.asset_node_id::int AS asset_node_id,
            EXISTS (SELECT 1 FROM registry_aliases a WHERE a.object_key = 'node:' || l.asset_node_id AND a.source = $1
                      AND a.kind = 'ma_nguon' AND a.value = 'danh-ba-du-an/' || l.source_project_id AND a.retired_at IS NULL) AS la_ung_vien
       FROM project_links l WHERE l.source = $1`, [NGUON_S09]);
  const link = new Map(linkRows.map((r) => [r.source_project_id, r]));
  const ungVienS09 = new Set(linkRows.filter((r) => r.la_ung_vien).map((r) => r.asset_node_id));
  const nutSoKhop = nutRows.filter((n) => !ungVienS09.has(n.id));
  const { rows: luat } = await c.query(
    "SELECT id::int AS id FROM project_link_rules WHERE source = $1 AND dao_at IS NULL ORDER BY id DESC LIMIT 1", [NGUON_S09]);
  const luatId = luat[0]?.id ?? null;
  const { rows: theRows } = await c.query(
    "SELECT item_id, status, evidence, decision_note FROM review_queue WHERE item_type = 'entity_match' AND item_id LIKE 's09-du-an:%'");
  const theCap = new Map(theRows.map((r) => {
    const ung = r.evidence?.ung_vien_cua ?? [];
    const chon = /node:(\d+)/.exec(r.decision_note ?? "")?.[1];
    return [r.item_id.slice("s09-du-an:".length), { status: r.status, node_id: chon ? Number(chon) : (ung.length === 1 ? ung[0] : null) }];
  }));

  const ra = { du_an: { da_noi: 0, the_luat_cho: 0, the_luat_noi: 0, the_cap_cho: 0, the_cap_noi: 0, ung_vien_moi: 0, ung_vien_giu: 0 },
    toa: { da_noi: 0, bi_danh: 0, tao_moi: 0, the: 0, khong_so: 0, lech_tang_tao_rieng: 0, thuoc_du_an_chua_noi: 0, khong_iso: 0 },
    the_moi: 0, the_luat: [] };
  const datLink = async (pid, status, nodeId, lyDo, canCu) => c.query(
    `INSERT INTO project_links (source, source_project_id, asset_node_id, status, can_cu, ly_do, rule_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (source, source_project_id) DO UPDATE SET asset_node_id = EXCLUDED.asset_node_id, status = EXCLUDED.status,
       can_cu = EXCLUDED.can_cu, ly_do = EXCLUDED.ly_do, rule_id = EXCLUDED.rule_id, updated_at = now()
     WHERE (project_links.asset_node_id, project_links.status, project_links.ly_do, project_links.rule_id)
           IS DISTINCT FROM (EXCLUDED.asset_node_id, EXCLUDED.status, EXCLUDED.ly_do, EXCLUDED.rule_id)`,
    [NGUON_S09, pid, nodeId, status, canCu, lyDo, status === "noi" && canCu === "the-luat" ? luatId : null]);

  const daNoi = []; // { du_an_id, node_id, iso }
  for (const da of duAn) {
    const kq = phanLopDuAn(da, nutSoKhop, { noiCung, link: link.get(da.du_an_id) ?? null, luatDuyet: luatId != null, theCap: theCap.get(da.du_an_id) ?? null });
    const so = (toaTheoDuAn.get(da.du_an_id) ?? []).length;
    if (kq.duong === DUONG.daNoi) {
      ra.du_an.da_noi++;
      await datLink(da.du_an_id, "noi", kq.node_id, null, "noi-tay");
    } else if (kq.duong === DUONG.theLuat) {
      ra.the_luat.push({ du_an_id: da.du_an_id, node_id: kq.node_id });
      if (kq.noi) { ra.du_an.the_luat_noi++; await datLink(da.du_an_id, "noi", kq.node_id, null, "the-luat"); }
      else { ra.du_an.the_luat_cho++; ra.toa.thuoc_du_an_chua_noi += so; await datLink(da.du_an_id, "chua_noi", null, kq.ly_do, null); }
    } else if (kq.duong === DUONG.theCap) {
      if (kq.noi) { ra.du_an.the_cap_noi++; await datLink(da.du_an_id, "noi", kq.node_id, null, "the-cap"); }
      else {
        ra.du_an.the_cap_cho++; ra.toa.thuoc_du_an_chua_noi += so;
        ra.the_moi += await theMuc(c, `s09-du-an:${da.du_an_id}`, "S09: dự án gần giống dự án có sẵn",
          { loai: "du-an-gan-giong", ung_vien_cua: kq.ung_vien_cua, so_toa: so });
        await datLink(da.du_an_id, "chua_noi", null, kq.ly_do, null);
      }
    } else {
      let nodeId = kq.node_id;
      if (nodeId == null) {
        const { rows } = await c.query(
          `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, catalog_tier, meta)
           VALUES ('project', $1, $2, ARRAY[lower($1)], '{}', 'mot_loi_khai', $3::jsonb) RETURNING id::int AS id`,
          [String(da.ten).trim(), `s09-${slugify(da.ten)}-${da.du_an_id.slice(0, 8)}`, JSON.stringify({ nguon_ung_vien: NGUON_S09 })]);
        nodeId = rows[0].id;
        await c.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)",
          [`node:${nodeId}`, MA_DU_AN(da.du_an_id), NGUON_S09]);
        ra.du_an.ung_vien_moi++;
      } else ra.du_an.ung_vien_giu++;
      await datLink(da.du_an_id, "noi", nodeId, null, "ung-vien");
      kq.node_id = nodeId;
    }
    if (kq.noi) daNoi.push({ du_an_id: da.du_an_id, node_id: kq.node_id, iso: isoTheoMa.get(da.ma_tinh) ?? null });
  }
  // Thẻ luật theo nguồn (mục 44 Hỏi-1): một thẻ cho cả tập dự án trùng tên đúng một nút; băm mẫu đổi thì thẻ mới.
  if (ra.the_luat.length && luatId == null) {
    const mau = ra.the_luat.map((x) => `${x.du_an_id}>${x.node_id}`).sort().join("\n");
    const bam = createHash("sha256").update(mau).digest("hex");
    ra.the_moi += await theMuc(c, `s09-luat-du-an:${bam.slice(0, 16)}`, `S09: thẻ luật nối ${ra.the_luat.length} dự án trùng tên đúng một dự án có sẵn`,
      { loai: "the-luat-du-an", mau_bam: bam, so_ma: ra.the_luat.length, cap: ra.the_luat });
  }

  // ---- Toà ----
  const { rows: mn } = await c.query(
    "SELECT value, object_key FROM registry_aliases WHERE retired_at IS NULL AND kind = 'ma_nguon' AND source = $1 AND value LIKE 'danh-ba-toa/%'", [NGUON_S09]);
  const maMoi = new Map(mn.map((r) => [r.value, r.object_key]));
  const nutTheoId = new Map(nutRows.map((n) => [n.id, n]));
  for (const d of daNoi) {
    const ds = toaTheoDuAn.get(d.du_an_id) ?? [];
    if (!ds.length) continue;
    const { rows: toaKhu } = await c.query(
      `SELECT b.building_key,
              array_remove(array_agg(DISTINCT a.value) FILTER (WHERE a.kind = 'ten'), NULL) AS ten,
              bool_or(a.source = $2 AND a.kind = 'ma_nguon' AND a.value NOT LIKE 'danh-ba-toa/%') AS ma_cu,
              bool_or(a.source = 'S16' AND a.kind = 'ma_nguon') AS s16
         FROM buildings b
         JOIN asset_nodes n ON n.id = b.region_node_id
         LEFT JOIN asset_nodes p ON p.id = n.parent_id
         LEFT JOIN asset_nodes g ON g.id = p.parent_id
         LEFT JOIN registry_aliases a ON a.object_key = b.building_key AND a.retired_at IS NULL
        WHERE b.status = 'active' AND $1 IN (n.id, p.id, g.id)
        GROUP BY b.building_key`, [d.node_id, NGUON_S09]);
    const tangS16 = await soTangS16TheoTen(c, nutTheoId.get(d.node_id)?.slug, noiS16);
    const toaCo = toaKhu.map((b) => ({ building_key: b.building_key, ten: b.ten ?? [], ma_cu: !!b.ma_cu, s16: !!b.s16,
      so_tang_s16: b.s16 ? ((b.ten ?? []).map((t) => tangS16.get(chuanHoaTenToa(t))).find((x) => x != null) ?? null) : null }));
    for (const x of xetToa(ds, toaCo, maMoi)) {
      const t = ds.find((y) => y.toa_id === x.toa_id);
      if (x.loai === "da_noi") { ra.toa.da_noi++; continue; }
      if (x.loai === "bi_danh") {
        await c.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)", [x.building_key, MA_TOA(x.toa_id), NGUON_S09]);
        await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', $2, $3)
                       ON CONFLICT (object_key, kind, value) WHERE kind = 'ten' DO NOTHING`, [x.building_key, x.ten_chuan, NGUON_S09]);
        maMoi.set(MA_TOA(x.toa_id), x.building_key);
        ra.toa.bi_danh++; if (x.khong_so) ra.toa.khong_so++;
        continue;
      }
      let taoRieng = x.loai === "tao_moi";
      if (x.loai === "the") {
        if (x.ly_do === "lech-tang-s16") {
          ra.the_moi += await theMuc(c, theLechTangS16(x.toa_id), "S09: toà cùng tên với toà S16 nhưng lệch số tầng",
            { loai: "toa-lech-tang-s16", so_tang_s09: t.so_tang, building_keys: x.building_keys });
          ra.toa.lech_tang_tao_rieng++;
          taoRieng = true; // có thể là hai toà thật cùng tên: 0 bí danh, toà S09 đúc riêng (giống thứ tự S09 trước rồi S16)
        } else {
          ra.the_moi += await theMuc(c, `s09-toa-db:${d.du_an_id}/${x.ten_chuan || x.toa_id}`, `S09: toà ${x.ly_do}`,
            { loai: `toa-${x.ly_do}`, building_keys: x.building_keys ?? [], toa_ids: ds.filter((y) => khoaTen(y.ten) === x.ten_chuan).map((y) => y.toa_id) });
          ra.toa.the++;
          continue;
        }
      } else {
        // Toà mới trùng tên với toà S16 còn ở stg (chưa dựng): so tầng ngay, để thứ tự S09 trước hay S16 trước cho cùng thẻ.
        const lech = lechTangS16(t.so_tang, tangS16.get(chuanHoaTenToa(x.ten_chuan)) ?? null);
        if (lech === true) {
          ra.the_moi += await theMuc(c, theLechTangS16(x.toa_id), "S09: toà cùng tên với toà S16 nhưng lệch số tầng",
            { loai: "toa-lech-tang-s16", so_tang_s09: t.so_tang, building_keys: [] });
          ra.toa.lech_tang_tao_rieng++;
        }
      }
      if (taoRieng) {
        if (!d.iso) { ra.toa.khong_iso++; continue; }
        const key = taoKhoa("bld");
        await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier) VALUES ($1, $2, $3, $4, 'mot_loi_khai')`,
          [key, d.node_id, upiToa(d.iso, key), d.iso]);
        await c.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)", [key, MA_TOA(x.toa_id), NGUON_S09]);
        // Toà lệch tầng không mang tên làm bí danh: không để bước S16 hay lượt sau gắn nhầm theo tên.
        if (x.loai !== "the") {
          await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', $2, $3)
                         ON CONFLICT (object_key, kind, value) WHERE kind = 'ten' DO NOTHING`, [key, x.ten_chuan, NGUON_S09]);
        }
        maMoi.set(MA_TOA(x.toa_id), key);
        ra.toa.tao_moi++;
      }
    }
  }
  return ra;
}
