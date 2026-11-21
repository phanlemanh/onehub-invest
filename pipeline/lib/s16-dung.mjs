// s16-dung.mjs — DA33 nap-s16-vao-danh-ba: bước S16 của lệnh dựng danh bạ vật thể (pipeline/danh-ba-vat-the.mjs).
// Chạy trong giao dịch và khoá cố vấn của DB1, sau bước S08 và S09 (thiết kế §5):
//   1. dự án S16 chỉ vào danh bạ qua bảng nối NOI_DU_AN_S16 (Hỏi-1); dự án không nối chỉ được đếm;
//   2. toà S16 (theo toa_id): bí danh ma_nguon S16 trước; chưa có thì so tên với toà KHÔNG mang S16 của khu — khớp một →
//      bí danh, không khớp và có ≥1 căn → đúc toà xac_minh (Hỏi-2), toà 0 căn (nhãn gom) không đúc, khớp hai → thẻ;
//   3. căn (một mỗi mã, luật chọn toà của v_s16_can): bí danh S16 trước; căn S08 cùng mã cùng toà → thêm bí danh S16;
//      khác toà → thẻ; không có → đúc (có trục, tầng nếu tách được và toà tách ra khớp; không thì căn không trục).
// Không ghi asset_nodes. Thẻ chỉ mang khoá vật thể + s16_ref (không mã căn, khu_id, toa_id, tên toà). Không in mã nguồn.
import { chuanHoaTenToa, moiKhoa, upiToa } from "./danh-ba-vat-the.mjs";
import { tachMa } from "./ma-can-s08.mjs";
import { NGUON_S16, NOI_DU_AN_S16, duoiDuAn, khoaMa, s16Ref } from "./s16-danh-muc.mjs";
import { lechTangS16 } from "./s09-danh-ba-can.mjs";
import { soTangS09TheoToa, theLechTangS16, theMuc as theS09 } from "./s09-dung.mjs";

const thuong = (s) => String(s ?? "").normalize("NFC").trim().toLowerCase();
const TANG_HOP_LE = /^[0-9]+[A-Z]?$/;

export const biDanhToaS16 = (duAn, toaId) => `${duAn}/${toaId}`;
// Bí danh trục mang toa_id: hai toà S16 khác toa_id mà trùng tên (dữ liệu thật có 10 tên như vậy) có trục cùng số thì vẫn ra hai
// bí danh khác nhau — bí danh là duy nhất trên (source, kind, value), nên thiếu toa_id thì trục của toà thứ hai không có bí danh và
// căn của nó tra theo tên ra trục của toà thứ nhất (S4-r1 t6). Tên toà vẫn ở vị trí áp chót, trục ở cuối: hai bộ đọc (trucCo dưới
// đây và napS16TheoKhu) tách theo đúng hai vị trí ấy rồi ghép với building_key, nên không bộ đọc nào phải đổi.
export const biDanhTrucS16 = (duAn, toaId, toa, truc) => `${duAn}/${toaId}/${toa}/${truc}`;
export const biDanhCanS16 = (duAn, ma) => `${duAn}/${khoaMa(ma)}`;

/** Thẻ duyệt một lần mỗi mục (mọi trạng thái): chạy lại không nhân thẻ. Evidence không mang giá trị đăng nhập. */
export async function theDuyet(c, ref, title, evidence) {
  const itemId = `s16:${ref}`;
  const r = await c.query(
    `INSERT INTO review_queue (item_type, item_id, title, evidence)
     SELECT 'entity_match', $1, $2, $3::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM review_queue WHERE item_type = 'entity_match' AND item_id = $1)`,
    [itemId, title, JSON.stringify({ nguon: NGUON_S16, s16_ref: ref, ...evidence })]);
  return r.rowCount;
}

/** Q-B (DA37): thẻ lệch toà đang chờ của mã này cho nghỉ — S16 thắng cấu trúc; không đúc thẻ mới. Trả số thẻ đổi. */
export const GHI_CHU_NGHI = "S16 thắng cấu trúc (DA37)";
export async function choNghiTheLech(c, ref) {
  const r = await c.query(
    `UPDATE review_queue SET status = 'rejected', decision_note = $2, decided_by = 'may-da37', decided_at = now()
      WHERE item_type = 'entity_match' AND item_id = $1 AND status = 'pending' AND evidence ->> 'loai' = 'can-lech-toa'`,
    [`s16:${ref}`, GHI_CHU_NGHI]);
  return r.rowCount;
}

async function chenBiDanh(c, ds, kind) {
  if (!ds.length) return 0;
  const r = await c.query(
    `INSERT INTO registry_aliases (object_key, kind, value, source)
     SELECT k, $3, v, $4 FROM unnest($1::text[], $2::text[]) AS x(k, v)
     ${kind === "ten" ? "ON CONFLICT (object_key, kind, value) WHERE kind = 'ten' DO NOTHING" : ""}`,
    [ds.map((b) => b.k), ds.map((b) => b.v), kind, NGUON_S16]);
  return r.rowCount;
}

/**
 * Bước S16 cho các khu đang dựng.
 * @param {import("pg").Client} c — đang trong giao dịch của dung()
 * @param {{ khu: Map<number, {id:number, slug:string}>, isoKhu: Map<number,string>, noi?: Record<string,string>,
 *           log?: (s:string)=>void, taoKhoa?: (t:string)=>string }} o
 */
export async function buocS16(c, { khu, isoKhu, noi = NOI_DU_AN_S16, log = console.log, taoKhoa = (t) => moiKhoa(t) }) {
  if (!(await c.query("SELECT to_regclass('public.stg_s16_item') AS t")).rows[0].t) {
    log("danh-ba-vat-the: S16 bỏ qua — DB chưa áp 103 (không có stg_s16_item)");
    return { bo_qua: "chua-ap-103" };
  }
  const theoSlug = new Map([...khu.values()].map((k) => [k.slug, k]));
  const { rows: duAnRows } = await c.query("SELECT du_an, count(*)::int AS n FROM v_s16_can GROUP BY du_an");
  const ra = { khu: {}, bo_du_an: {}, toa_moi_so_can: [] };
  let nhan = 0;
  for (const { du_an, n } of duAnRows) {
    const slug = noi[duoiDuAn(du_an)];
    if (!slug) { ra.bo_du_an[`du-an#${++nhan}`] = n; continue; }
    const k = theoSlug.get(slug);
    if (!k) continue; // khu không nằm trong lượt --khu này
    ra.khu[slug] = await dungMotDuAn(c, { du_an, k, iso: isoKhu.get(k.id), taoKhoa, ra });
  }
  const tong = Object.values(ra.bo_du_an).reduce((a, b) => a + b, 0);
  if (tong) log(`danh-ba-vat-the: S16 bỏ ${Object.keys(ra.bo_du_an).length} dự án chưa nối (${tong} căn)`);
  for (const [slug, t] of Object.entries(ra.khu)) {
    log(`danh-ba-vat-the: S16 ${slug} toà nối ${t.toa_noi} mới ${t.toa_moi} 0-căn ${t.toa_0_can} · căn mới ${t.can_moi} S08→S16 ${t.can_s08_bi_danh} · thẻ ${t.the_moi} mơ hồ ${t.mo_ho}`);
  }
  ra.toa_moi_so_can.forEach((t, i) => log(`danh-ba-vat-the: S16 toà mới #${i + 1} (${t.khu}) ${t.so_can} căn`));
  // DA37 AC-8: mốc giao dịch (now() — mọi dòng lượt này chèn mang đúng mốc ấy) + số khoá mới, để lượt (cả lượt đêm) lùi được
  // bằng tệp khoá (_acceptance/danh-ba-s16-thang-cau-truc/lui/ghi-khoa.sh).
  ra.moc = (await c.query("SELECT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS t")).rows[0].t; // đủ micro giây
  ra.khoa_moi = Object.values(ra.khu).reduce((a, t) => a + (t.toa_moi ?? 0) + (t.can_moi ?? 0) + (t.truc_moi ?? 0), 0);
  return ra;
}

async function dungMotDuAn(c, { du_an, k, iso, taoKhoa, ra }) {
  const tk = { toa_noi: 0, toa_moi: 0, toa_0_can: 0, toa_the: 0, can_moi: 0, can_s08_bi_danh: 0, can_da_co: 0, can_lech_toa: 0,
    can_khong_toa: 0, the_moi: 0, mo_ho: 0, toa_trung_ten: 0, can_cho_trung_ten: 0 };
  // ---- Trạng thái hiện có của khu ----
  const { rows: toaKhu } = await c.query(
    `SELECT b.building_key FROM buildings b
       JOIN asset_nodes n ON n.id = b.region_node_id
       LEFT JOIN asset_nodes p ON p.id = n.parent_id
      WHERE b.status = 'active' AND (n.id = $1 OR p.id = $1 OR p.parent_id = $1)`, [k.id]);
  const khoaToaKhu = toaKhu.map((r) => r.building_key);
  const { rows: bd } = await c.query(
    `SELECT object_key, kind, value, source FROM registry_aliases
      WHERE retired_at IS NULL AND (object_key = ANY($1) OR (source = $2 AND kind = 'ma_nguon' AND value LIKE $3))`,
    [khoaToaKhu, NGUON_S16, `${du_an}/%`]);
  const s16 = new Map(bd.filter((r) => r.source === NGUON_S16 && r.kind === "ma_nguon").map((r) => [r.value, r.object_key]));
  const coS16 = new Set(bd.filter((r) => r.source === NGUON_S16 && r.kind === "ma_nguon").map((r) => r.object_key));
  const tenToa = new Map(); // tên chuẩn hoá → khoá toà KHÔNG mang S16
  for (const r of bd) {
    if (r.kind !== "ten" || coS16.has(r.object_key) || !khoaToaKhu.includes(r.object_key)) continue;
    const t = chuanHoaTenToa(r.value);
    tenToa.set(t, [...new Set([...(tenToa.get(t) ?? []), r.object_key])]);
  }
  const { rows: phanKhu } = await c.query(
    "SELECT id::int AS id, name, aliases FROM asset_nodes WHERE parent_id = $1 AND node_type = 'building'", [k.id]);
  // Căn S08 của khu: mã → { unit_key, building_key }.
  const { rows: s08 } = await c.query(
    `SELECT a.value, u.unit_key, u.building_key FROM registry_aliases a
       JOIN units u ON u.unit_key = a.object_key
       JOIN s08_project_links l ON l.status = 'noi' AND l.asset_node_id = $1 AND a.value LIKE l.project_id || '/%'
      WHERE a.retired_at IS NULL AND a.kind = 'ma_nguon' AND a.source = 'S08'`, [k.id]);
  const canS08 = new Map(s08.map((r) => [khoaMa(r.value.slice(r.value.indexOf("/") + 1)), r]));
  const { rows: trucS08 } = await c.query(
    `SELECT s.stack_key, s.building_key, a.value FROM stacks s
       JOIN registry_aliases a ON a.object_key = s.stack_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
      WHERE s.building_key = ANY($1)`, [khoaToaKhu]);

  // ---- Dữ liệu S16 của dự án ----
  const { rows: toaS16 } = await c.query(
    `SELECT t.toa_id, t.toa_ten, k.khu_ten FROM v_s16_toa t
       LEFT JOIN LATERAL (SELECT khu_ten FROM stg_s16_khu WHERE du_an = t.du_an AND khu_id = t.khu_id ORDER BY snapshot_id DESC LIMIT 1) k ON true
      WHERE t.du_an = $1`, [du_an]);
  const { rows: canS16 } = await c.query(
    "SELECT ma_can, toa_ten, mo_ho, toa_id, tang, toa_ds FROM v_s16_can WHERE du_an = $1 ORDER BY ma_can", [du_an]);
  const toaTheoTen = new Map(); // toa_ten → [toa_id] (căn pha 1 có thể thiếu toa_id)
  for (const t of toaS16) toaTheoTen.set(t.toa_ten, [...(toaTheoTen.get(t.toa_ten) ?? []), t.toa_id]);
  const toaCuaCan = (r) => r.toa_id ?? ((toaTheoTen.get(r.toa_ten) ?? []).length === 1 ? toaTheoTen.get(r.toa_ten)[0] : null);
  const soCan = new Map();
  for (const r of canS16) {
    if (r.mo_ho) continue;
    const t = toaCuaCan(r);
    if (t) soCan.set(t, (soCan.get(t) ?? 0) + 1);
  }

  // ---- Toà ----
  // DA42: tra bí danh S09 gói 1 trên toà có sẵn trước khi gắn toà S16 vào chúng; số tầng S16 = số tầng có căn của toà.
  const s09Toa = await soTangS09TheoToa(c, khoaToaKhu);
  const tangS16 = new Map();
  for (const r of canS16) {
    if (r.mo_ho || r.tang == null) continue;
    const id = toaCuaCan(r);
    if (id) tangS16.set(id, new Set([...(tangS16.get(id) ?? []), r.tang]));
  }
  const lechVoiS09 = (key, toaId) => s09Toa.has(key) && lechTangS16(s09Toa.get(key).so_tang, tangS16.get(toaId)?.size ?? null) === true;
  const nhomTen = new Map();
  for (const t of toaS16) { const n = chuanHoaTenToa(t.toa_ten); nhomTen.set(n, (nhomTen.get(n) ?? 0) + 1); }
  // Toà S16 trùng tên chuẩn hoá trong dự án (GS quyết 17/11 theo AC-7): máy không phân biệt được nên không đúc, không gắn,
  // không nạp căn của chúng; mỗi toa_id một thẻ «toà S16 trùng tên» kèm chỉ mục che của mọi ứng viên và số căn mỗi bên.
  // Xét TRƯỚC khớp-toà-có-sẵn: thứ tự S08-trước hay S16-trước đều ra đúng thẻ này (không thì một bên ra «khớp nhiều»).
  const ungVienTen = new Map(); // tên chuẩn → [toa_id] theo thứ tự xác định
  for (const t of [...toaS16].sort((a, b) => String(a.toa_id).localeCompare(String(b.toa_id)))) {
    const n = chuanHoaTenToa(t.toa_ten);
    if ((nhomTen.get(n) ?? 0) > 1) ungVienTen.set(n, [...(ungVienTen.get(n) ?? []), t.toa_id]);
  }
  const toaKey = new Map(); // toa_id → building_key
  const toaMoi = [], biDanhToa = [], tenMoi = [];
  for (const t of toaS16) {
    const v = biDanhToaS16(du_an, t.toa_id);
    if (s16.has(v)) { toaKey.set(t.toa_id, s16.get(v)); continue; }
    const so = soCan.get(t.toa_id) ?? 0;
    const ten = chuanHoaTenToa(t.toa_ten);
    const khop = tenToa.get(ten) ?? [];
    const trung = ungVienTen.get(ten);
    if (trung) {
      tk.the_moi += await theDuyet(c, s16Ref(du_an, t.toa_id), "S16: toà trùng tên với toà S16 khác trong dự án",
        { loai: "toa-trung-ten", ung_vien: trung.map((x) => s16Ref(du_an, x)), so_can: trung.map((x) => soCan.get(x) ?? 0),
          khoa_toa: [...khop].sort() });
      tk.toa_trung_ten++;
      tk.can_cho_trung_ten += so;
    } else if (khop.length === 1 && lechVoiS09(khop[0], t.toa_id)) {
      // DA42: toà có sẵn mang bí danh S09 gói 1 mà số tầng lệch quá ngưỡng — có thể là hai toà thật cùng tên: thẻ (cùng mã thẻ
      // bước S09 phát), 0 bí danh, toà S16 đúc riêng như khi S16 dựng trước.
      tk.the_moi += await theS09(c, theLechTangS16(s09Toa.get(khop[0]).toa_id), "S09: toà cùng tên với toà S16 nhưng lệch số tầng",
        { loai: "toa-lech-tang-s16", so_tang_s09: s09Toa.get(khop[0]).so_tang, building_keys: [] });
      if (so > 0) {
        const key = taoKhoa("bld");
        const pk = phanKhu.filter((p) => t.khu_ten && [p.name, ...(p.aliases ?? [])].some((x) => thuong(x) === thuong(t.khu_ten)));
        toaMoi.push({ key, region: pk.length === 1 ? pk[0].id : k.id });
        toaKey.set(t.toa_id, key);
        biDanhToa.push({ k: key, v });
        tenMoi.push({ k: key, v: ten });
        ra.toa_moi_so_can.push({ khu: k.slug, so_can: so });
        tk.toa_moi++;
      } else tk.toa_0_can++;
    } else if (khop.length === 1) {
      toaKey.set(t.toa_id, khop[0]);
      biDanhToa.push({ k: khop[0], v });
      tenMoi.push({ k: khop[0], v: ten });
      tk.toa_noi++;
    } else if (khop.length >= 1) {
      tk.the_moi += await theDuyet(c, s16Ref(du_an, t.toa_id), "S16: toà khớp nhiều toà có sẵn",
        { loai: "toa-khop-nhieu", khoa_toa: [...khop].sort() });
      tk.toa_the++;
    } else if (so === 0) {
      tk.toa_0_can++;
    } else {
      const key = taoKhoa("bld");
      const pk = phanKhu.filter((p) => t.khu_ten && [p.name, ...(p.aliases ?? [])].some((x) => thuong(x) === thuong(t.khu_ten)));
      toaMoi.push({ key, region: pk.length === 1 ? pk[0].id : k.id });
      toaKey.set(t.toa_id, key);
      biDanhToa.push({ k: key, v });
      tenMoi.push({ k: key, v: ten });
      ra.toa_moi_so_can.push({ khu: k.slug, so_can: so });
      tk.toa_moi++;
    }
  }
  if (toaMoi.length) {
    if (!iso) throw new Error(`khu ${k.slug} không suy được mã tỉnh cho toà S16`);
    await c.query(
      `INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
       SELECT k, r, $3 || k, $4, 'xac_minh' FROM unnest($1::text[], $2::bigint[]) AS x(k, r)`,
      [toaMoi.map((t) => t.key), toaMoi.map((t) => t.region), upiToa(iso, ""), iso]);
  }
  await chenBiDanh(c, biDanhToa, "ma_nguon");
  await chenBiDanh(c, tenMoi.filter((x) => x.v), "ten");

  // ---- Căn ----
  const trucCo = new Map(); // `${building}|${toa}|${truc}` → stack_key (S16 hay S08 cùng toà)
  for (const r of trucS08) {
    const p = r.value.split("/");
    if (p.length >= 3) trucCo.set(`${r.building_key}|${chuanHoaTenToa(p[p.length - 2])}|${p[p.length - 1]}`, r.stack_key);
  }
  const trucMoi = [], canMoi = [], biDanhCan = [], biDanhTruc = [], gop = [];
  for (const r of canS16) {
    const ma = khoaMa(r.ma_can);
    if (r.mo_ho) {
      tk.mo_ho++;
      tk.the_moi += await theDuyet(c, s16Ref(du_an, ma), "S16: căn có mã nằm dưới nhiều toà",
        { loai: "can-mo-ho", so_toa: (r.toa_ds ?? []).length });
      continue;
    }
    const vCan = biDanhCanS16(du_an, ma);
    if (s16.has(vCan)) { tk.can_da_co++; continue; }
    const bkey = toaKey.get(toaCuaCan(r));
    if (!bkey) { tk.can_khong_toa++; continue; }
    const cu = canS08.get(ma);
    if (cu) {
      if (cu.building_key === bkey) {
        biDanhCan.push({ k: cu.unit_key, v: vCan });
        s16.set(vCan, cu.unit_key);
        tk.can_s08_bi_danh++;
        continue;
      }
      // Q-B (DA37): S16 thắng về căn thuộc toà — đúc căn S16 ở toà S16 (dưới đây), căn S08 gộp vào sau khi chèn.
      tk.can_lech_toa++;
      gop.push({ cu: cu.unit_key, vCan, ref: s16Ref(du_an, ma) });
    }
    const key = taoKhoa("unt");
    const kq = tachMa(ma);
    const tang = kq.toa ? (r.tang && TANG_HOP_LE.test(String(r.tang).toUpperCase()) ? String(r.tang).toUpperCase() : kq.tang) : null;
    if (kq.toa && chuanHoaTenToa(kq.toa) === chuanHoaTenToa(r.toa_ten) && TANG_HOP_LE.test(tang ?? "")) {
      const kt = `${bkey}|${chuanHoaTenToa(kq.toa)}|${kq.truc}`;
      const vTruc = biDanhTrucS16(du_an, toaCuaCan(r), kq.toa, kq.truc);
      let skey = trucCo.get(kt) ?? s16.get(vTruc);
      if (!skey) {
        skey = taoKhoa("stk");
        trucMoi.push({ key: skey, b: bkey });
        biDanhTruc.push({ k: skey, v: vTruc });
        s16.set(vTruc, skey);
      }
      trucCo.set(kt, skey);
      canMoi.push({ key, b: bkey, s: skey, f: tang });
    } else {
      canMoi.push({ key, b: bkey, s: null, f: null });
    }
    biDanhCan.push({ k: key, v: vCan });
    s16.set(vCan, key);
    tk.can_moi++;
  }
  tk.truc_moi = trucMoi.length;
  if (trucMoi.length) {
    await c.query(`INSERT INTO stacks (stack_key, building_key, catalog_tier)
                   SELECT k, b, 'xac_minh' FROM unnest($1::text[], $2::text[]) AS x(k, b)`,
                  [trucMoi.map((s) => s.key), trucMoi.map((s) => s.b)]);
  }
  for (let i = 0; i < canMoi.length; i += 5000) {
    const lo = canMoi.slice(i, i + 5000);
    await c.query(`INSERT INTO units (unit_key, building_key, stack_key, floor, sub_id, catalog_tier)
                   SELECT k, b, s, f, CASE WHEN s IS NULL THEN k ELSE s || ':' || f END, 'xac_minh'
                     FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS x(k, b, s, f)`,
                  [lo.map((u) => u.key), lo.map((u) => u.b), lo.map((u) => u.s), lo.map((u) => u.f)]);
  }
  await chenBiDanh(c, biDanhTruc, "ma_nguon");
  for (let i = 0; i < biDanhCan.length; i += 5000) await chenBiDanh(c, biDanhCan.slice(i, i + 5000), "ma_nguon");
  // Q-B: căn S08 lệch toà gộp vào căn S16 vừa đúc (rào 082 cho đổi status, merged_into); thẻ lệch cũ cho nghỉ.
  tk.can_s08_gop = 0; tk.the_cho_nghi = 0;
  for (const g of gop) {
    const moi = s16.get(g.vCan);
    if (!moi) continue;
    const r = await c.query(`UPDATE units SET status = 'merged', merged_into = $2 WHERE unit_key = $1 AND status = 'active'`, [g.cu, moi]);
    tk.can_s08_gop += r.rowCount;
    tk.the_cho_nghi += await choNghiTheLech(c, g.ref);
  }
  return tk;
}

/**
 * Toà, trục, căn S16 đã có theo khu — đầu vào s16TheoKhu của keHoachDung (thiết kế §5.5). Khu = nút dự án của toà
 * (toà nằm ở khu, phân khu hay cụm). Chưa có bí danh S16 nào → Map rỗng, bước S08 chạy như cũ.
 * @param {import("pg").Client} c
 * @param {number[]} khuIds
 */
export async function napS16TheoKhu(c, khuIds) {
  const ra = new Map();
  const { rows } = await c.query(
    `WITH a AS (
       SELECT object_key, value FROM registry_aliases WHERE kind = 'ma_nguon' AND source = $1 AND retired_at IS NULL
     ), vt AS (
       SELECT a.object_key, a.value, coalesce(u.building_key, s.building_key, b0.building_key) AS building_key
         FROM a LEFT JOIN units u ON u.unit_key = a.object_key
                LEFT JOIN stacks s ON s.stack_key = a.object_key
                LEFT JOIN buildings b0 ON b0.building_key = a.object_key
     )
     SELECT vt.object_key, vt.value, vt.building_key,
            COALESCE(CASE WHEN n.node_type = 'project' THEN n.id END, CASE WHEN p.node_type = 'project' THEN p.id END, p.parent_id)::int AS khu,
            (SELECT min(t.value) FROM registry_aliases t WHERE t.object_key = vt.building_key AND t.kind = 'ten' AND t.source = $1) AS ten
       FROM vt JOIN buildings b ON b.building_key = vt.building_key
       JOIN asset_nodes n ON n.id = b.region_node_id LEFT JOIN asset_nodes p ON p.id = n.parent_id
      ORDER BY vt.object_key, vt.value`, [NGUON_S16]); // thứ tự xác định: các Map «theo tên» không đổi giữa hai lượt
  for (const r of rows) {
    if (!khuIds.includes(r.khu)) continue;
    const m = ra.get(r.khu) ?? { toa: new Map(), truc: new Map(), can: new Map() };
    ra.set(r.khu, m);
    const p = r.value.split("/");
    if (r.object_key.startsWith("bld_")) { if (r.ten) m.toa.set(chuanHoaTenToa(r.ten), r.building_key); }
    else if (r.object_key.startsWith("stk_") && p.length >= 3) m.truc.set(`${r.building_key}|${chuanHoaTenToa(p[p.length - 2])}|${p[p.length - 1]}`, r.object_key);
    else if (r.object_key.startsWith("unt_")) m.can.set(khoaMa(p.slice(1).join("/")), { unit_key: r.object_key, building_key: r.building_key, du_an: p[0] });
  }
  return ra;
}

/**
 * Bước S08 đi sau S16, căn S16 cùng mã nằm ở toà khác (Q-B, DA37): S16 thắng — căn S08 vừa đúc ở toà S08 (bí danh S08 trên
 * nó) gộp vào căn S16, thẻ lệch cũ cho nghỉ; không thẻ mới. Cùng trạng thái với thứ tự S08 trước (buocS16 gộp). Gọi SAU khi
 * ghi căn. Trả { gop, choNghi }.
 */
export async function ganLechS16(c, lech) {
  let gop = 0, choNghi = 0;
  for (const l of lech) {
    const r = await c.query("UPDATE units SET status = 'merged', merged_into = $2 WHERE unit_key = $1 AND status = 'active'",
      [l.khoa_s08, l.khoa_can]);
    gop += r.rowCount;
    choNghi += await choNghiTheLech(c, s16Ref(l.du_an, l.ma));
  }
  return { gop, choNghi };
}
