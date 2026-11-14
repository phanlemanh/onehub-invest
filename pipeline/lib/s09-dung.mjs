// s09-dung.mjs — DA31 toa-s09-hai-khu-vao-danh-ba: bước S09 của lệnh dựng danh bạ vật thể (pipeline/danh-ba-vat-the.mjs).
// Chạy trong giao dịch và khoá cố vấn của DB1, sau bước S08 (thiết kế §4.3):
//   1. phân khu S09 → nút subzone con của khu; nút cùng tên có sẵn thì dùng lại (gắn meta.s09_sector_ids);
//   2. cụm (Hỏi-1): tiền tố «S10» từ hai toà cùng phân khu → nút subzone con của phân khu (meta.s09_cum);
//   3. toà: bí danh ma_nguon S09 trước; chưa có thì so tên với toà của khu — khớp một → bí danh, không khớp → đúc toà
//      `mot_loi_khai` (Hỏi-3) với nút vùng = cụm/phân khu, khớp từ hai → thẻ review_queue entity_match, không ghi toà nào.
// Toà S08 giữ region_node_id (082 chỉ thêm); nút vùng hiệu lực qua view v_toa_nut_vung (097). DB chưa áp 097 hay khu không
// có dòng S09 → bỏ qua có in lý do. Không in mã nguồn ra stdout.
import { moiKhoa, upiToa } from "./danh-ba-vat-the.mjs";
import { NGUON_S09, NOI_KHU_S09, cumS09, khoaTenS09, tienToCum, toaS09 } from "./s09-du-an.mjs";

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
