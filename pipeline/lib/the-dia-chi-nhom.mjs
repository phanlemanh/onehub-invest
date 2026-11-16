// the-dia-chi-nhom.mjs — TG1 the-dia-chi-nhom-s03: hàm thuần dựng NHÁP thẻ địa chỉ cho một nhóm S03.
// Đầu vào đã đọc sẵn (sổ, nhãn bài của chính nhóm, danh bạ, phường của tin); đầu ra bốn ô + căn cứ từng ô. Không gọi model.
// Ngưỡng là quyết định Hỏi-3 ở Cổng Phạm vi (Mạnh 16/11) — đổi ngưỡng là đổi hợp đồng.
// Nhãn mang căn cứ «ngu_canh_nhom» (model đoán từ ngữ cảnh nhóm) KHÔNG tính: thẻ dựng từ chữ bài, không dựng từ chính thẻ nhóm.

export const NGUONG = Object.freeze({
  duAnSoBai: 3, // ô dự án: nút cần ≥ 3 bài
  duAnTiLe: 0.1, // … và ≥ 10% số bài nêu tên dự án
  duAnToiDa: 3, // tối đa 3 nút
  phuongTiLe: 0.6, // phường theo tin: ≥ 60% tin có phường
  phanKhuSoBai: 3, // phân khu: ≥ 3 bài
  phanKhuTiLe: 0.5, // … và ≥ 50% số bài nêu phân khu
  mucDichMotPhia: 0.8, // một phía ≥ 80%
  mucDichCaHai: 0.2, // cả hai: mỗi phía ≥ 20%
  baiDocToiThieu: 5, // dưới 5 bài đọc → ô bán/thuê trống
});

/** Căn cứ không tính: model đoán từ ngữ cảnh nhóm. */
export const CAN_CU_BO = Object.freeze(["ngu_canh_nhom"]);

export const chuan = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

/** Chỉ mục tên → nút cho danh bạ ({id, name, aliases}). Tên trùng hai nút thì bỏ (mơ hồ). */
export function chiMucTen(nut) {
  const m = new Map();
  const mo = new Set();
  for (const n of nut) {
    for (const t of [n.name, ...(n.aliases ?? [])]) {
      const k = chuan(t);
      if (!k) continue;
      if (m.has(k) && m.get(k) !== n.id) mo.add(k);
      else m.set(k, n.id);
    }
  }
  for (const k of mo) m.delete(k);
  return m;
}

/**
 * Dựng nháp cho một nhóm.
 * @param {object} p
 * @param {number[]} p.soDuAn      dự án sổ đang ghi cho nhóm (mọi dòng sổ của khoá thật)
 * @param {{project?: string, projectCc?: string, subzone?: string, subzoneCc?: string, kind?: string}[]} p.nhan  nhãn mỗi bài đã đọc của nhóm
 * @param {string[]} p.tinPhuong   phường (area_id cấp phường) của từng tin của nhóm có phường
 * @param {{id:number,name:string,aliases?:string[],area_ids?:string[]}[]} p.duAn  nút dự án
 * @param {{id:number,name:string,aliases?:string[],parent_id:number}[]} p.phanKhu  nút phân khu/toà
 * @param {Map<string,string>|Record<string,string>} p.tinhCua  phường → tỉnh (areas market)
 * @param {Set<string>|string[]} p.laPhuong  tập id phường hợp lệ (submarket)
 * @param {boolean} [p.boSo]       bỏ qua sổ (phép đo chất lượng AC-8)
 */
export function dungNhap({ soDuAn = [], nhan = [], tinPhuong = [], duAn = [], phanKhu = [], tinhCua = {}, laPhuong = [], boSo = false }) {
  const tinh = tinhCua instanceof Map ? (k) => tinhCua.get(k) : (k) => tinhCua[k];
  const phuongHopLe = new Set(laPhuong);
  const soBaiDoc = nhan.length;
  const ev = { so_bai_doc: soBaiDoc };

  // Ô dự án
  let duAnIds = [];
  const soDuy = [...new Set(soDuAn)];
  if (!boSo && soDuy.length === 1) {
    duAnIds = soDuy;
    ev.du_an = { nguon: "so", so_bai: 0 };
  } else {
    const idx = chiMucTen(duAn);
    const dem = new Map();
    let neuTen = 0;
    for (const n of nhan) {
      if (!n.project || CAN_CU_BO.includes(n.projectCc)) continue;
      neuTen++;
      const id = idx.get(chuan(n.project));
      if (id !== undefined) dem.set(id, (dem.get(id) ?? 0) + 1);
    }
    const giu = [...dem]
      .filter(([, c]) => c >= NGUONG.duAnSoBai && c >= NGUONG.duAnTiLe * neuTen)
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, NGUONG.duAnToiDa);
    duAnIds = giu.map(([id]) => id);
    ev.du_an = duAnIds.length
      ? { nguon: "nhan", so_bai: giu.reduce((s, [, c]) => s + c, 0), theo_nut: Object.fromEntries(giu), bai_neu_ten: neuTen }
      : { nguon: null, so_bai: 0, bai_neu_ten: neuTen };
  }

  // Ô phường + tỉnh
  let phuong = null;
  const nutChon = duAn.filter((n) => duAnIds.includes(n.id));
  const phuongDuAn = [...new Set(nutChon.flatMap((n) => (n.area_ids ?? []).filter((a) => phuongHopLe.has(a))))];
  if (nutChon.length && phuongDuAn.length === 1) {
    phuong = phuongDuAn[0];
    ev.phuong = { nguon: "du_an", so_bai: 0 };
  } else {
    const dem = new Map();
    for (const a of tinPhuong) if (phuongHopLe.has(a)) dem.set(a, (dem.get(a) ?? 0) + 1);
    const tong = [...dem.values()].reduce((s, c) => s + c, 0);
    const [top] = [...dem].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    if (top && tong && top[1] / tong >= NGUONG.phuongTiLe) {
      phuong = top[0];
      ev.phuong = { nguon: "tin", so_bai: top[1], tong_tin: tong };
    } else ev.phuong = { nguon: null, so_bai: 0, tong_tin: tong };
  }
  const tinhId = phuong ? tinh(phuong) ?? null : null;

  // Ô phân khu: chỉ nút con của dự án đã chọn (khi có đúng một dự án)
  let phanKhuId = null;
  if (duAnIds.length === 1) {
    const con = phanKhu.filter((n) => n.parent_id === duAnIds[0]);
    const idx = chiMucTen(con);
    const dem = new Map();
    let neu = 0;
    for (const n of nhan) {
      if (!n.subzone || CAN_CU_BO.includes(n.subzoneCc)) continue;
      neu++;
      const id = idx.get(chuan(n.subzone));
      if (id !== undefined) dem.set(id, (dem.get(id) ?? 0) + 1);
    }
    const [top] = [...dem].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    if (top && top[1] >= NGUONG.phanKhuSoBai && top[1] >= NGUONG.phanKhuTiLe * neu) {
      phanKhuId = top[0];
      ev.phan_khu = { nguon: "nhan", so_bai: top[1], bai_neu: neu };
    } else ev.phan_khu = { nguon: null, so_bai: 0, bai_neu: neu };
  } else ev.phan_khu = { nguon: null, so_bai: 0, bai_neu: 0 };

  // Ô bán/thuê
  let mucDich = null;
  const ban = nhan.filter((n) => n.kind === "sale").length;
  const thue = nhan.filter((n) => typeof n.kind === "string" && n.kind.startsWith("rent")).length;
  const coLoai = ban + thue;
  if (soBaiDoc >= NGUONG.baiDocToiThieu && coLoai) {
    if (ban / coLoai >= NGUONG.mucDichMotPhia) mucDich = "ban";
    else if (thue / coLoai >= NGUONG.mucDichMotPhia) mucDich = "thue";
    else if (ban / coLoai >= NGUONG.mucDichCaHai && thue / coLoai >= NGUONG.mucDichCaHai) mucDich = "ca_hai";
  }
  ev.muc_dich = { nguon: mucDich ? "nhan" : null, so_bai: mucDich === "ban" ? ban : mucDich === "thue" ? thue : mucDich ? coLoai : 0, ban, thue };

  return { du_an: duAnIds, phuong, tinh: tinhId, phan_khu: phanKhuId, muc_dich: mucDich, evidence: ev };
}
