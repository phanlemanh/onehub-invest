// s10-bang-hang.mjs — bóc bảng hàng S10 (payload.html của kind `stock_table`) thành dòng stg_s10_stock (089).
// Làn thu (liên làn làm thay ZCode, 10/11). Hàm thuần, không DB. Hợp đồng: collector/docs/DATA-CONTRACT.md mục S10.
//
// Bảng KHÔNG có hàng tiêu đề — cột theo VỊ TRÍ, gồm cả ô nằm trong chú thích HTML (`<!-- <td>…</td> -->`): giá
// chủ đầu tư chỉ nằm ở đó. Hai khuôn theo `block_type` (177 · 178), mỗi khuôn khai đúng số ô; dòng có số ô khác khuôn
// là «lệch khuôn» — giữ `raw_row`, mọi trường bóc để NULL (không đoán vị trí), đếm để bộ nạp báo.

/** Khuôn cột theo block_type: chỉ số ô (đếm cả ô trong chú thích) → trường. */
export const KHUON_S10 = {
  // 1211-22 (đo 1.078 dòng 177 snapshot 014105012): 9 = giá «N tỷ»; 13 = ngày bàn giao («d/m/yyyy»
  // hoặc «CSBH…»); 18 = văn bản hợp đồng (HĐMB-VHM-VPB…); 20 = ngân hàng. KHÔNG có cột trạng thái
  // thật trong bảng 177 (ô 8 thường trống, đôi khi chứa giá niêm yết khác — nằm nguyên trong raw_row).
  177: { soO: 29, ma: 0, phanKhu: 1, day: 2, loai: 3, dtDat: 4, dtXay: 5, hienTrang: 6, huong: 7, gia: 9, trangThai: null, ghiChu: [18, 20], ngay: 13 },
  178: { soO: 16, ma: 0, phanKhu: 1, day: 2, loai: 3, dtDat: 5, dtXay: 6, huong: 7, hienTrang: 8, gia: null, trangThai: 10, ghiChu: [13], ngay: null },
};

/** Đủ bộ lọc rộng (DATA-CONTRACT S10 luật 1): thiếu `meta.request.area_max` = snapshot bị máy chủ lọc, không nạp. */
export function duBoLoc(item) {
  const r = item?.meta?.request;
  return r != null && r.area_max != null && String(r.area_max) !== "" && r.price_max != null && String(r.price_max) !== "";
}

const RE_DONG = /<tr\b[^>]*class="[^"]*\bp_row\b[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
const RE_O = /<td\b[^>]*>([\s\S]*?)<\/td>/g;

function chuTho(html) {
  return html
    .replace(/<!--|-->/g, " ")
    .replace(/<sup>[\s\S]*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function rongThanhNull(s) {
  return s === "" || s === "---" ? null : s;
}
/** «100 m²», «333.3», «1,234.5» → số; khác → null. */
export function soM2(s) {
  if (s == null) return null;
  const m = String(s).replace(/m\s*$/i, "").replace(/,/g, "").trim().match(/^\d+(\.\d+)?$/);
  return m ? Number(m[0]) : null;
}
/** Giá VND thô: chỉ chữ số (có thể có dấu chấm/phẩy nhóm nghìn) → bigint dạng chuỗi; 0 hoặc rỗng → null. */
export function giaVnd(s) {
  if (s == null) return null;
  const t = String(s).replace(/[.,\s]/g, "").replace(/t[ỷi]$/i, "");
  if (!/^\d+$/.test(t)) return null;
  return /^0+$/.test(t) ? null : t.replace(/^0+/, "");
}
/** «6/10/2026» (d/m/yyyy) → «2026-10-06»; sai → null. */
export function ngayDmy(s) {
  const m = String(s ?? "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Bóc mọi `tr.p_row` của một item `stock_table`.
 * @returns {{ dong: object[], lechKhuon: number, khongStockId: number, khongProjectId: number }}
 */
export function bocS10(item) {
  const html = String(item?.payload?.html ?? "");
  const bt = Number(item?.meta?.request?.block_type);
  const projectId = Number(item?.meta?.request?.project_id);
  const k = KHUON_S10[bt];
  const dong = [];
  let lechKhuon = 0, khongStockId = 0, khongProjectId = 0;
  for (const m of html.matchAll(RE_DONG)) {
    const raw = m[0];
    const stock = raw.match(/[?&]stock_id=(\d+)/);
    if (!stock) { khongStockId++; continue; }
    if (!Number.isFinite(projectId)) { khongProjectId++; continue; } // 1211-31(b): fail-closed — không ghi project_id NaN
    const o = [...m[1].matchAll(RE_O)].map((x) => chuTho(x[1]));
    const d = { stock_id: stock[1], source_id: `s10:${stock[1]}`, project_id: projectId, block_type: bt, raw_row: raw };
    if (!k || o.length !== k.soO) {
      lechKhuon++;
      Object.assign(d, { unit_number: null, subdivision_name: null, block_raw: null, property_sub_type_raw: null,
        lot_size_m2: null, building_area_m2: null, handover_condition_raw: null, direction_faces_raw: null,
        list_price_vnd: null, status_raw: null, remarks_raw: null, source_modified_on: null, lech_khuon: true });
    } else {
      const ghi = k.ghiChu.map((i) => rongThanhNull(o[i])).filter(Boolean);
      Object.assign(d, {
        unit_number: rongThanhNull(o[k.ma]),
        subdivision_name: rongThanhNull(o[k.phanKhu]),
        block_raw: rongThanhNull(o[k.day]),
        property_sub_type_raw: rongThanhNull(o[k.loai]),
        lot_size_m2: soM2(o[k.dtDat]),
        building_area_m2: soM2(o[k.dtXay]),
        handover_condition_raw: rongThanhNull(o[k.hienTrang]),
        direction_faces_raw: rongThanhNull(o[k.huong]),
        list_price_vnd: k.gia == null ? null : giaVnd(o[k.gia]),
        status_raw: k.trangThai == null ? null : rongThanhNull(o[k.trangThai]),
        remarks_raw: ghi.length ? ghi.join(" · ") : null,
        source_modified_on: k.ngay == null ? null : ngayDmy(o[k.ngay]),
        lech_khuon: false,
      });
    }
    dong.push(d);
  }
  return { dong, lechKhuon, khongStockId };
}
