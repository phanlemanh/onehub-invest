// noi-du-an-s08-lop.mjs — DA55 soat-noi-s08-danh-ba: luật xác định xếp mỗi dự án S08 vào một ngả của thẻ luật S08, và dựng thẻ
// cho Mạnh xem trước khi áp (mô hình danh bạ §1.2: chặn cùng tỉnh; tên chuẩn trùng đi thẻ luật, tên trùng một phần đi thẻ từng cặp).
// Hàm thuần, không DB — lệnh pipeline/noi-du-an-s08-luat.mjs đọc DB. Thiết kế: docs/superpowers/specs/2026-11-22-soat-noi-s08-danh-ba-design.md §3–§4.
import { createHash } from "node:crypto";

import { chuanKhop, chuanTen, laTenRong } from "./noi-du-an-s06-lop.mjs";

export { chuanKhop, chuanTen };

/** Tên hay bí danh ngắn hơn ngưỡng này không tính là chạm khi so chứa (cùng ngưỡng DA32). */
export const DO_DAI_BI_DANH = 8;
export const NGUON = "S08";
export const CAN_CU = Object.freeze({ luat: "S08-danh-muc", tenChuan: "S08-ten-chuan-cung-tinh", duc: "S08-nut-ung-vien" });
export const LY_DO = Object.freeze({
  khongTen: "khong-ten", duAnCon: "du-an-con", khongTinh: "khong-tinh",
  nhieuUngVien: "nhieu-ung-vien", nutKhongTinh: "nut-khong-tinh", ganGiong: "gan-giong", daoLuat: "dao-luat",
});
/** Lý do của ngả thẻ từng cặp (không nối, không đúc, chờ người chọn). */
export const LY_DO_THE_CAP = new Set([LY_DO.nhieuUngVien, LY_DO.nutKhongTinh, LY_DO.ganGiong]);

/** Hậu tố khu của dự án con (quyết định 17/11 Q-A): «… (OCP1)», «… (GP)», «… OCP 2». */
const HAU_TO_KHU = /\((?:OCP|OP|GP|VOP|VGP)\s*\d*\)|\bOCP\s?\d\b/i;
export const laDuAnCon = (ten) => HAU_TO_KHU.test(String(ten ?? ""));

/** Tên gốc: bỏ «_TT» / « TT» (phần thấp tầng) ở cuối và «TMDV » (phần thương mại) ở đầu — S08 tách chúng thành dự án riêng. */
export function tenGoc(ten) {
  return String(ten ?? "").trim().replace(/(?:_|\s)TT$/i, "").replace(/^TMDV\s+/i, "").trim();
}

/** Khoá nhóm đúc: tên gốc chuẩn bỏ dấu + tỉnh — các dự án S08 cùng khoá nối cùng một nút ứng viên. */
export const khoaNhom = (ten, tinh) => `${chuanTen(tenGoc(ten))}|${tinh}`;

/**
 * Xếp một dự án S08 vào một ngả.
 * @param {{ma: string, ten: string, tinh: string|null, noiTay?: boolean}} d  tinh: thị trường phủ điểm bản đồ S08
 * @param {{id: number, name: string, aliases?: string[]|null, tinh: string|null, nguon?: string|null}[]} nut
 *   nút project; tinh null = chưa biết tỉnh (nút ứng viên S09 của DA42); nguon 'S08' = nút do luật S08 đúc
 * @param {{asset_node_id: number|null, laUngVienS08: boolean}|null} [daNoi]  dòng project_links S08 hiện có
 * @param {Map<string, number[]>} [nhomDaDuc]  khoá nhóm → id nút S08 đã đúc cho nhóm ở lượt trước (DA65: dự án mới cùng khoá nối
 *   nút cũ thay vì đúc nút thứ hai; nhóm đã có hai nút trở lên đi thẻ từng cặp)
 * @returns {{status: 'giu_tay'|'noi'|'duc'|'chua_noi', node_id?: number, ly_do?: string, ung_vien?: number[], nhom?: string, can_cu?: string}}
 */
export function phanLopS08(d, nut, daNoi = null, nhomDaDuc = null) {
  if (d.noiTay) return { status: "giu_tay" };
  // Dự án đã có nút ứng viên do chính luật S08 đúc (lần áp trước, kể cả đã đảo): giữ nút ấy, không xếp lại.
  if (daNoi?.laUngVienS08 && daNoi.asset_node_id != null) return { status: "duc", node_id: Number(daNoi.asset_node_id), can_cu: CAN_CU.duc };
  if (laTenRong(d.ten)) return { status: "chua_noi", ly_do: LY_DO.khongTen };
  if (laDuAnCon(d.ten)) return { status: "chua_noi", ly_do: LY_DO.duAnCon };
  if (!d.tinh) return { status: "chua_noi", ly_do: LY_DO.khongTinh };
  const k = chuanKhop(tenGoc(d.ten));
  const bao = ` ${k} `;
  const trungCungTinh = new Set(), trungKhongTinh = new Set(), chua = new Set();
  for (const n of nut) {
    if (n.nguon === NGUON) continue; // nút do luật S08 đúc không là ứng viên (dự án của nó đi đường daNoi)
    if (n.tinh != null && n.tinh !== d.tinh) continue; // khác tỉnh không bao giờ là ứng viên
    for (const t of [n.name, ...(n.aliases ?? [])]) {
      const q = chuanKhop(t);
      if (!q) continue;
      if (q === k) (n.tinh == null ? trungKhongTinh : trungCungTinh).add(Number(n.id));
      else if (q.length >= DO_DAI_BI_DANH && k.length >= DO_DAI_BI_DANH && (bao.includes(` ${q} `) || ` ${q} `.includes(bao))) chua.add(Number(n.id));
    }
  }
  const sap = (s) => [...s].sort((a, b) => a - b);
  const trung = new Set([...trungCungTinh, ...trungKhongTinh]);
  if (trungCungTinh.size === 1 && trungKhongTinh.size === 0) return { status: "noi", node_id: sap(trungCungTinh)[0], can_cu: CAN_CU.tenChuan };
  if (trung.size > 1) return { status: "chua_noi", ly_do: LY_DO.nhieuUngVien, ung_vien: sap(trung) };
  if (trungKhongTinh.size === 1) return { status: "chua_noi", ly_do: LY_DO.nutKhongTinh, ung_vien: sap(trungKhongTinh) };
  if (chua.size) return { status: "chua_noi", ly_do: LY_DO.ganGiong, ung_vien: sap(chua) };
  const nhom = khoaNhom(d.ten, d.tinh);
  const daDuc = sap(new Set(nhomDaDuc?.get(nhom) ?? []));
  if (daDuc.length === 1) return { status: "duc", node_id: daDuc[0], can_cu: CAN_CU.duc };
  if (daDuc.length > 1) return { status: "chua_noi", ly_do: LY_DO.nhieuUngVien, ung_vien: daDuc };
  return { status: "duc", nhom, can_cu: CAN_CU.duc };
}

/** Kết cục chuẩn cho băm — mang nút đích, khoá nhóm đúc, id ứng viên, để đổi đích giữa thẻ và áp làm lệch băm. */
export function ketCucChuan(kq) {
  if (kq.status === "giu_tay") return "giu_tay";
  if (kq.status === "noi") return `noi:${kq.node_id}`;
  if (kq.status === "duc") return kq.node_id != null ? `duc:#${kq.node_id}` : `duc:${kq.nhom}`;
  if (LY_DO_THE_CAP.has(kq.ly_do)) return `the-cap:${kq.ly_do}:${(kq.ung_vien ?? []).join(",")}`;
  return `chua_noi:${kq.ly_do}`;
}

const soChuoi = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** sha256 hex của JSON mảng [mã, kết cục chuẩn], sắp theo mã. */
export function bamKetCuc(ds) {
  const chuan = [...ds].map(([m, k]) => [String(m), String(k)]).sort((a, b) => soChuoi(a[0], b[0]));
  return createHash("sha256").update(JSON.stringify(chuan)).digest("hex");
}

/** Ngả hiển thị của một kết cục. */
export function nga(kq) {
  if (kq.status === "chua_noi") return LY_DO_THE_CAP.has(kq.ly_do) ? "the_cap" : "tu_choi";
  return kq.status;
}

const fmt = (n) => Number(n).toLocaleString("vi-VN");
const o = (s) => String(s ?? "").replace(/\|/g, "/").trim() || "(trống)";
const DUONG_TU_CHOI = {
  [LY_DO.khongTen]: "tên rỗng — chờ nguồn sửa tên",
  [LY_DO.duAnCon]: "dự án con có hậu tố khu — bước đúc nút con Q-A 17/11, hàng sau",
  [LY_DO.khongTinh]: "không có điểm bản đồ trong thị trường nào — chờ nguồn bổ sung điểm",
};

/**
 * Dựng thẻ luật: tổng theo ngả kèm loại căn cứ, bảng mẫu, dòng cuối «băm: <hex>». Không in mã dự án S08.
 * @param {{ma: string, ten: string, tinh: string, soCan: number, kq: ReturnType<typeof phanLopS08>, tenNut?: string, tenUngVien?: string[]}[]} ds
 */
export function dungTheS08(ds) {
  const tong = {};
  for (const d of ds) {
    const t = (tong[nga(d.kq)] ??= { du_an: 0, can: 0 });
    t.du_an += 1;
    t.can += Number(d.soCan);
  }
  const nhomDuc = new Map();
  for (const d of ds) if (d.kq.status === "duc") {
    const k = d.kq.node_id != null ? `#${d.kq.node_id}` : d.kq.nhom;
    nhomDuc.set(k, [...(nhomDuc.get(k) ?? []), d]);
  }
  const bam = bamKetCuc(ds.map((d) => [d.ma, ketCucChuan(d.kq)]));
  const theoCan = (a, b) => b.soCan - a.soCan || soChuoi(String(a.ten), String(b.ten));
  const duc = ds.filter((d) => d.kq.status === "duc").sort(theoCan);
  const giua = Math.max(0, Math.floor(duc.length / 2) - 5);
  const nhan = {
    giu_tay: "Giữ nối tay (DN1) — không ghi",
    noi: `Nối vào nút có sẵn — căn cứ «tên chuẩn trùng, cùng tỉnh» (${CAN_CU.tenChuan}), thẻ luật`,
    the_cap: "Cần người chọn — thẻ từng cặp, không nối, không đúc",
    duc: `Đúc nút ứng viên — không khớp nút nào (${CAN_CU.duc}), thẻ luật`,
    tu_choi: "Từ chối có lý do",
  };
  const dong = ["# Thẻ luật S08 — dự án danh mục vào danh bạ", "", "| Ngả | Dự án | Căn S08 |", "|---|---|---|"];
  for (const k of ["giu_tay", "noi", "the_cap", "duc", "tu_choi"]) if (tong[k]) dong.push(`| ${nhan[k]} | ${fmt(tong[k].du_an)} | ${fmt(tong[k].can)} |`);
  const tc = Object.values(tong).reduce((a, t) => ({ du_an: a.du_an + t.du_an, can: a.can + t.can }), { du_an: 0, can: 0 });
  dong.push(`| **Tổng** | **${fmt(tc.du_an)}** | **${fmt(tc.can)}** |`, "", `Nút ứng viên mới: ${fmt([...nhomDuc.keys()].filter((k) => !k.startsWith("#")).length)}.`);
  const bang = (tieuDe, hang, cot, o2) => {
    if (!hang.length) return;
    dong.push("", `## ${tieuDe} (${hang.length})`, "", `| Tên dự án | Tỉnh | Căn | ${cot} |`, "|---|---|---|---|");
    for (const d of hang) dong.push(`| ${o(d.ten)} | ${o(d.tinh)} | ${fmt(d.soCan)} | ${o(o2(d))} |`);
  };
  bang(nhan.noi, ds.filter((d) => d.kq.status === "noi").sort(theoCan), "Nút", (d) => d.tenNut ?? `#${d.kq.node_id}`);
  bang(nhan.the_cap, ds.filter((d) => nga(d.kq) === "the_cap").sort(theoCan), "Lý do · ứng viên", (d) => `${d.kq.ly_do} · ${(d.tenUngVien ?? d.kq.ung_vien ?? []).join(" / ")}`);
  bang(nhan.tu_choi, ds.filter((d) => nga(d.kq) === "tu_choi").sort(theoCan), "Lý do · đường đi", (d) => `${d.kq.ly_do} · ${DUONG_TU_CHOI[d.kq.ly_do] ?? ""}`);
  bang("Đúc nút ứng viên — 10 dự án nhiều căn nhất", duc.slice(0, 10), "Ghi chú", () => "");
  bang("Đúc nút ứng viên — 10 dự án giữa", duc.slice(giua, giua + 10), "Ghi chú", () => "");
  bang("Đúc nút ứng viên — 5 dự án ít căn nhất", duc.slice(-5), "Ghi chú", () => "");
  bang("Đúc nút ứng viên — nhóm gom từ hai dự án (chung một nút)", [...nhomDuc.values()].filter((g) => g.length > 1).flat(), "Nhóm", (d) => tenGoc(d.ten));
  dong.push("", `băm: ${bam}`);
  return { markdown: dong.join("\n") + "\n", bam, tong, soNutMoi: [...nhomDuc.keys()].filter((k) => !k.startsWith("#")).length };
}
