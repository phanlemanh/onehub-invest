// label-cases.mjs — GC0 `gan-nhan-theo-nhom-s03` (AC-8): gom lý do, trường hợp, trả lời thẻ và giá trị căn cứ ngữ cảnh theo
// từng nhóm cho `GCQ1`. Đây là nơi duy nhất đọc chữ lý do. Không mang định danh người gắn, không mang giờ ghi, sắp xếp ổn định
// để chạy lại ra y nguyên.

const soChuoi = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const xep = (ds, khoa) => [...ds].sort((a, b) => {
  for (const k of khoa) {
    const c = soChuoi(a[k] ?? "", b[k] ?? "");
    if (c) return c;
  }
  return 0;
});

/** Hàm thuần: dòng đọc từ DB → danh sách nhóm. Dòng không có `stratum` (lát đời trước) gom vào nhóm `null`. */
export function gomTruongHop({ lat, items, reasons, cases, values }) {
  const nhom = new Map();
  const cuaNhom = (ma, ten) => {
    if (!nhom.has(ma)) nhom.set(ma, { unit_code: ma, ten: ten ?? ma, ly_do: [], truong_hop: [], the_nhom: [], gia_tri_ngu_canh: [] });
    return nhom.get(ma);
  };
  const theoItem = new Map();
  for (const i of items) {
    theoItem.set(i.item_id, i);
    cuaNhom(i.stratum, i.group_name);
  }
  const vao = (r) => {
    const i = theoItem.get(r.item_id);
    return i ? [cuaNhom(i.stratum, i.group_name), i.ref_id] : null;
  };
  for (const r of reasons) {
    const v = vao(r);
    if (v) v[0].ly_do.push({ ref_id: v[1], ly_do: r.reason });
  }
  for (const r of cases) {
    const v = vao(r);
    if (!v) continue;
    if (r.case_kind || r.note) v[0].truong_hop.push({ ref_id: v[1], loai: r.case_kind ?? null, dien_giai: r.note ?? null });
    if (r.the_nhom_dung) v[0].the_nhom.push({ ref_id: v[1], tra_loi: r.the_nhom_dung });
  }
  for (const r of values) {
    const v = vao(r);
    if (v) v[0].gia_tri_ngu_canh.push({ ref_id: v[1], truong: r.field, gia_tri: r.value, can_cu: r.basis });
  }
  const ds = [...nhom.values()].sort((a, b) => soChuoi(a.unit_code ?? "", b.unit_code ?? ""));
  for (const n of ds) {
    n.ly_do = xep(n.ly_do, ["ref_id", "ly_do"]);
    n.truong_hop = xep(n.truong_hop, ["ref_id", "loai", "dien_giai"]);
    n.the_nhom = xep(n.the_nhom, ["ref_id", "tra_loi"]);
    n.gia_tri_ngu_canh = xep(n.gia_tri_ngu_canh, ["ref_id", "truong", "gia_tri", "can_cu"]);
  }
  return { lat, nhom: ds };
}

/** Đọc một lát (chỉ đọc). Lát không có mẫu thì ném lỗi; `nhom` là `unit_code` để lọc một nhóm. */
export async function xuatTruongHop(client, lat, nhom = null) {
  const { rows: items } = await client.query(
    `SELECT i.item_id::text AS item_id, i.ref_id, i.stratum, p.group_name
     FROM eval_label_items i
     LEFT JOIN LATERAL (SELECT group_name FROM stg_zalo_posts WHERE post_id = i.ref_id ORDER BY captured_at DESC LIMIT 1) p ON true
     WHERE i.lat = $1 AND ($2::text IS NULL OR i.stratum = $2)`, [lat, nhom]);
  if (items.length === 0) throw new Error(`label-cases: lát không có mẫu: ${lat}${nhom ? ` · nhóm ${nhom}` : ""}`);
  const ma = items.map((i) => i.item_id);
  const doc = async (sql) => (await client.query(sql, [ma])).rows;
  const [reasons, cases, values] = await Promise.all([
    doc(`SELECT item_id::text AS item_id, reason FROM eval_label_reasons WHERE item_id = ANY ($1::bigint[])`),
    doc(`SELECT item_id::text AS item_id, case_kind, note, the_nhom_dung FROM eval_label_cases WHERE item_id = ANY ($1::bigint[])`),
    doc(`SELECT item_id::text AS item_id, field, value, basis FROM eval_labels
         WHERE item_id = ANY ($1::bigint[]) AND basis IN ('ngu_canh_nhom', 'kien_thuc_nghe')`),
  ]);
  return gomTruongHop({ lat, items, reasons, cases, values });
}
