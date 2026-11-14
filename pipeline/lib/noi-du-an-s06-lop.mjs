// noi-du-an-s06-lop.mjs — DA32 ma-du-an-s06-thanh-nut: luật xác định xếp mỗi mã dự án S06 (≥10 tin căn hộ đang rao) vào một
// ngả, và dựng thẻ luật cho người xem mẫu trước khi áp (mục 44 Hỏi-1). Hàm thuần, không DB — lệnh noi-du-an-s06.mjs đọc DB.
// Thiết kế: docs/superpowers/specs/2026-11-14-ma-du-an-s06-thanh-nut-design.md §1–§3.
import { createHash } from "node:crypto";

/** Bí danh ngắn hơn ngưỡng này không tính là chạm (tránh «abc», «celadon» chạm bừa). */
export const DO_DAI_BI_DANH = 8;
/** Mã có tin tản quá khoảng này (mét) gắn cờ trên thẻ — nút không mang toạ độ nên không đổi kết cục. */
export const DIEM_TAN_M = 2000;
export const LY_DO = Object.freeze({ khongTen: "khong-ten", khongXa: "khong-xa", lechTinh: "lech-tinh", nhieuUngVien: "nhieu-ung-vien", daoLuat: "dao-luat" });

/** Bỏ dấu, «đ» → «d», viết thường, mọi ký tự không chữ-số thành một khoảng trắng. */
export function chuanTen(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Chuẩn để SO KHỚP tên: GIỮ DẤU (chỉ NFC, viết thường, mọi ký tự không chữ-số thành một khoảng trắng). Giữ dấu để bí danh địa
 * danh viết không dấu của nút có sẵn («thu thiem», «phu my hung», «thao dien») không khớp mọi dự án mang địa danh đó — đúng
 * cách đo tập mẫu 17 mã Mạnh duyệt ở Cổng Phạm vi (lower giữ dấu).
 */
export function chuanKhop(s) {
  return String(s ?? "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// Quy ước giá trị rỗng giả (mục 45): so sau chuẩn hoá.
const RONG_GIA = new Set(["", "Đang cập nhật", "--", "-", "0", "N/A"].map(chuanTen));
export const laTenRong = (s) => RONG_GIA.has(chuanTen(s));

/**
 * Xếp một mã vào một ngả.
 * @param {{ma: string, ten: string, tinh: string[], xaNhieu: string, soTin: number, dlatM: number}} m
 *   tinh: các thị trường có tin của mã (khác 1 phần tử → lệch tỉnh).
 * @param {{id: number, name: string, aliases?: string[]|null, tinh: string|null, catalog_tier?: string}[]} nut  nút project
 * @param {{asset_node_id: number, laUngVien: boolean}|null} [daNoi]  dòng project_links hiện có của mã
 * @returns {{status: 'noi'|'duc'|'chua_noi', node_id?: number, ly_do?: string, co_diem_tan: boolean}}
 */
export function phanLop(m, nut, daNoi = null) {
  const co_diem_tan = Number(m.dlatM ?? 0) > DIEM_TAN_M;
  // Mã đã có nút ứng viên của chính nó (lần áp trước, kể cả đã đảo) thì giữ nút ấy — không phân lớp lại (phản biện F1).
  if (daNoi?.laUngVien && daNoi.asset_node_id != null) return { status: "duc", node_id: Number(daNoi.asset_node_id), co_diem_tan };
  if (laTenRong(m.ten)) return { status: "chua_noi", ly_do: LY_DO.khongTen, co_diem_tan };
  const tinh = [...new Set(m.tinh ?? [])];
  // Tin của mã chưa gắn xã nào → không biết tỉnh, không so được; khác với lệch tỉnh (tin ở hai tỉnh).
  if (tinh.length === 0) return { status: "chua_noi", ly_do: LY_DO.khongXa, co_diem_tan };
  if (tinh.length !== 1) return { status: "chua_noi", ly_do: LY_DO.lechTinh, co_diem_tan };
  const ten = ` ${chuanKhop(m.ten)} `;
  const cham = new Set();
  for (const n of nut) {
    // Chỉ nút không do luật S06 đúc, cùng tỉnh với mã.
    if (n.catalog_tier === "mot_loi_khai" || n.tinh !== tinh[0]) continue;
    for (const t of [n.name, ...(n.aliases ?? [])]) {
      const k = chuanKhop(t);
      if (k.length >= DO_DAI_BI_DANH && ten.includes(` ${k} `)) { cham.add(Number(n.id)); break; }
    }
  }
  if (cham.size === 1) return { status: "noi", node_id: [...cham][0], co_diem_tan };
  if (cham.size > 1) return { status: "chua_noi", ly_do: LY_DO.nhieuUngVien, co_diem_tan };
  return { status: "duc", co_diem_tan };
}

/** Kết cục chuẩn cho băm: noi:<id nút có sẵn> · duc · chua_noi:<lý do>. */
export function ketCucChuan(kq) {
  if (kq.status === "noi") return `noi:${kq.node_id}`;
  if (kq.status === "chua_noi") return `chua_noi:${kq.ly_do}`;
  return "duc";
}

const soChuoi = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** sha256 hex của JSON mảng [mã, kết cục] (người gọi đã sắp theo mã hoặc chưa — hàm tự sắp). */
export function bamKetCuc(ds) {
  const chuan = [...ds].map(([m, k]) => [String(m), String(k)]).sort((a, b) => soChuoi(a[0], b[0]));
  return createHash("sha256").update(JSON.stringify(chuan)).digest("hex");
}

const fmt = (n) => Number(n).toLocaleString("vi-VN");
const o = (s) => String(s ?? "").replace(/\|/g, "/").trim() || "(trống)";

/**
 * Dựng thẻ luật: tổng theo ngả, bảng mẫu, dòng cuối «băm: <hex>». Thẻ chỉ in tên dự án, tỉnh, xã, số tin — không mã nguồn.
 * @param {{ma: string, ten: string, tinh: string, xa: string, soTin: number, kq: ReturnType<typeof phanLop>, tenNut?: string}[]} ds
 */
export function dungThe(ds) {
  const tong = {};
  for (const d of ds) {
    const t = (tong[d.kq.status] ??= { ma: 0, tin: 0 });
    t.ma += 1;
    t.tin += Number(d.soTin);
  }
  const bam = bamKetCuc(ds.map((d) => [d.ma, ketCucChuan(d.kq)]));
  const theoTin = (a, b) => b.soTin - a.soTin || soChuoi(a.ma, b.ma);
  const duc = ds.filter((d) => d.kq.status === "duc").sort(theoTin);
  const giua = Math.max(0, Math.floor(duc.length / 2) - 5);
  const tang = [
    ["Nối vào nút có sẵn", ds.filter((d) => d.kq.status === "noi").sort(theoTin), true],
    ["Từ chối có lý do", ds.filter((d) => d.kq.status === "chua_noi").sort(theoTin), false],
    ["Đúc nút ứng viên — 10 mã nhiều tin nhất", duc.slice(0, 10), false],
    ["Đúc nút ứng viên — 10 mã giữa", duc.slice(giua, giua + 10), false],
    ["Đúc nút ứng viên — 5 mã sát ngưỡng", duc.slice(-5), false],
    ["Đúc nút ứng viên — tin tản hơn 2 km (nút không mang toạ độ)", duc.filter((d) => d.kq.co_diem_tan), false],
  ];
  const nhan = { noi: "Nối vào nút có sẵn", duc: "Đúc nút ứng viên", chua_noi: "Từ chối có lý do" };
  const dong = ["# Thẻ luật S06 — mã dự án thành nút", "", "| Ngả | Mã | Tin |", "|---|---|---|"];
  for (const k of ["noi", "duc", "chua_noi"]) if (tong[k]) dong.push(`| ${nhan[k]} | ${fmt(tong[k].ma)} | ${fmt(tong[k].tin)} |`);
  const tc = Object.values(tong).reduce((a, t) => ({ ma: a.ma + t.ma, tin: a.tin + t.tin }), { ma: 0, tin: 0 });
  dong.push(`| **Tổng** | **${fmt(tc.ma)}** | **${fmt(tc.tin)}** |`);
  for (const [tieuDe, hang, coNut] of tang) {
    if (!hang.length) continue;
    dong.push("", `## ${tieuDe} (${hang.length})`, "",
      `| Tên dự án | Tỉnh | Xã | Tin |${coNut ? " Nút |" : " Ghi chú |"}`, `|---|---|---|---|---|`);
    for (const d of hang) {
      const ghi = coNut ? o(d.tenNut ?? `#${d.kq.node_id}`) : d.kq.ly_do ? d.kq.ly_do : d.kq.co_diem_tan ? "điểm tản" : "";
      dong.push(`| ${o(d.ten)} | ${o(d.tinh)} | ${o(d.xa)} | ${fmt(d.soTin)} | ${ghi} |`);
    }
  }
  dong.push("", `băm: ${bam}`);
  return { markdown: dong.join("\n") + "\n", bam, tong };
}
