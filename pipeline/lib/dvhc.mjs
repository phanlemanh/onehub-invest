// lib/dvhc.mjs — PX1 danh-ba-phuong-xa-toan-quoc: danh bạ đơn vị hành chính (Cục Thống kê, QĐ 19/2025) và các hàm
// tra tên thuần, không DB. Dữ liệu chép kèm băm ở pipeline/data/dvhc (NGUON.json); bộ nạp ở pipeline/nap-dvhc.mjs.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { slugify } from "./osm.mjs";

export const DATA_DIR = join(import.meta.dirname, "../data/dvhc");
const TEP = ["xa.json", "xa-cu.json", "tinh-cu.json", "tinh.json"];

/**
 * Đọc danh bạ sau khi băm lại từng tệp; lệch NGUON.json → ném lỗi code BAM_LECH (bộ nạp thoát 2, không ghi gì).
 * @param {string} [dir]
 */
export function docDanhBa(dir = DATA_DIR) {
  const nguon = JSON.parse(readFileSync(join(dir, "NGUON.json"), "utf8"));
  const out = {};
  for (const f of TEP) {
    const buf = readFileSync(join(dir, f));
    const sha = createHash("sha256").update(buf).digest("hex");
    if (!nguon.sha256 || sha !== nguon.sha256[f]) {
      const e = new Error(`PX1 băm lệch: ${f}`);
      e.code = "BAM_LECH";
      throw e;
    }
    out[f] = JSON.parse(buf.toString("utf8"));
  }
  return { xa: out["xa.json"], xaCu: out["xa-cu.json"], tinhCu: out["tinh-cu.json"], tinh: out["tinh.json"], nguon };
}

/** Mã tỉnh mới (2 số) → thị trường. Bảng cố định: hai thị trường tự thu giữ mã cũ (064), còn lại vn-<slug tên>. */
export const MA_TINH_THI_TRUONG = Object.freeze({
  "01": "vn-hanoi", "04": "vn-cao-bang", "08": "vn-tuyen-quang", "11": "vn-dien-bien", "12": "vn-lai-chau",
  "14": "vn-son-la", "15": "vn-lao-cai", "19": "vn-thai-nguyen", "20": "vn-lang-son", "22": "vn-quang-ninh",
  "24": "vn-bac-ninh", "25": "vn-phu-tho", "31": "vn-hai-phong", "33": "vn-hung-yen", "37": "vn-ninh-binh",
  "38": "vn-thanh-hoa", "40": "vn-nghe-an", "42": "vn-ha-tinh", "44": "vn-quang-tri", "46": "vn-hue",
  "48": "vn-da-nang", "51": "vn-quang-ngai", "52": "vn-gia-lai", "56": "vn-khanh-hoa", "66": "vn-dak-lak",
  "68": "vn-lam-dong", "75": "vn-dong-nai", "79": "vn-hcmc", "80": "vn-tay-ninh", "82": "vn-dong-thap",
  "86": "vn-vinh-long", "91": "vn-an-giang", "92": "vn-can-tho", "96": "vn-ca-mau",
});

/** @param {string} maTinh @returns {string|null} */
export const thiTruongCuaTinh = (maTinh) => MA_TINH_THI_TRUONG[maTinh] ?? null;

// Chỉ bỏ tiền tố CẤP XÃ: «Quận Thanh Xuân» (khu tên quận cũ) không được trùng phường mới «Thanh Xuân».
const TIEN_TO_XA = /^(phường|xã|thị trấn|đặc khu)\s+/u;

/**
 * Tên chuẩn để so: NFC, thường hoá, gộp khoảng trắng, bỏ hậu tố « (…)» (phường OSM mang mã bưu chính), bỏ tiền tố cấp
 * xã; GIỮ dấu (Cẩm Giang ≠ Cẩm Giàng).
 * @param {string} s
 */
export function chuanTen(s) {
  return String(s ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*\([^)]*\)$/u, "")
    .replace(TIEN_TO_XA, "")
    .trim();
}

/**
 * Khu vực con có sẵn khớp một xã: ưu tiên phường OSM; không có phường OSM khớp thì đúng một khu khác; hai trở lên cùng
 * hạng → mơ hồ (bộ nạp dừng, không đoán).
 * @param {{ ten: string }} xa
 * @param {{ id: string, name: string, source?: string|null }[]} con
 * @returns {{ id: string } | { loi: "hai", ids: string[] } | null}
 */
export function khopXa(xa, con) {
  const k = chuanTen(xa.ten);
  const trung = con.filter((c) => chuanTen(c.name) === k);
  const osm = trung.filter((c) => c.source === "osm-phuong");
  const hang = osm.length ? osm : trung;
  if (hang.length === 1) return { id: hang[0].id };
  if (hang.length > 1) return { loi: "hai", ids: hang.map((c) => c.id) };
  return null;
}

/**
 * Id của xã chèn mới: <thị trường>-<slug>; slug chung với xã khác cùng tỉnh, hoặc id đã có, thì thêm -<mã>.
 * @param {{ ma: string, ten: string }} xa
 * @param {string} market
 * @param {Set<string>} slugTrung slug xuất hiện ≥ 2 lần trong danh bạ của tỉnh
 * @param {Set<string>} idDaCo
 */
export function idXa(xa, market, slugTrung, idDaCo) {
  const s = slugify(xa.ten);
  const id = `${market}-${s}`;
  return slugTrung.has(s) || idDaCo.has(id) ? `${id}-${xa.ma}` : id;
}

/** Slug xuất hiện từ hai xã trở lên trong cùng một tỉnh. @param {{ten:string}[]} xaCuaTinh */
export function slugTrungTrongTinh(xaCuaTinh) {
  const dem = new Map();
  for (const x of xaCuaTinh) dem.set(slugify(x.ten), (dem.get(slugify(x.ten)) ?? 0) + 1);
  return new Set([...dem].filter(([, n]) => n > 1).map(([s]) => s));
}

/** Nhóm xã cũ theo khoá (tỉnh mới, tên chuẩn). @param {{maTinh:string, ten:string, vao:string[]}[]} xaCu */
function nhomXaCu(xaCu) {
  const g = new Map();
  for (const r of xaCu) {
    const k = `${r.maTinh}|${chuanTen(r.ten)}`;
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(r);
  }
  return g;
}

/**
 * Bí danh AN TOÀN: xã cũ vào trọn một xã mới; mọi xã cũ cùng (tỉnh, tên) vào cùng một xã; tên không trùng tên một xã
 * hiện hành KHÁC cùng tỉnh. Mỗi dòng xã cũ rơi đúng một lớp: an-toan · tach · nhieu-dich · trung-ten-hien-hanh.
 * @param {{ma:string, maTinh:string, ten:string, vao:string[]}[]} xaCu
 * @param {{ ma: string, id: string, name: string, market: string }[]} xaHienHanh khu vực con mang admin_code
 * @returns {{ map: Map<string, Map<string, string>>, loai: Record<string, number> }}
 */
export function dungBiDanhAnToan(xaCu, xaHienHanh) {
  const theoMa = new Map(xaHienHanh.map((x) => [x.ma, x]));
  const tenHienHanh = new Map(); // `${market}|${tên chuẩn}` → id
  for (const x of xaHienHanh) tenHienHanh.set(`${x.market}|${chuanTen(x.name)}`, x.id);
  const map = new Map();
  const loai = { "an-toan": 0, tach: 0, "nhieu-dich": 0, "trung-ten-hien-hanh": 0 };
  for (const [k, rows] of nhomXaCu(xaCu)) {
    const dich = new Set(rows.flatMap((r) => r.vao));
    if (dich.size > 1) {
      for (const r of rows) loai[r.vao.length > 1 ? "tach" : "nhieu-dich"]++;
      continue;
    }
    const xa = theoMa.get([...dich][0]);
    if (!xa) continue; // đích chưa có trong areas (danh bạ chưa nạp đủ) — không có gì để gắn
    const market = thiTruongCuaTinh(rows[0].maTinh);
    const ten = k.slice(k.indexOf("|") + 1);
    const khac = tenHienHanh.get(`${market}|${ten}`);
    if (khac && khac !== xa.id) {
      loai["trung-ten-hien-hanh"] += rows.length;
      continue;
    }
    loai["an-toan"] += rows.length;
    if (!map.has(market)) map.set(market, new Map());
    map.get(market).set(ten, xa.id);
  }
  return { map, loai };
}

/**
 * Tra tên xã cũ theo khoá (tỉnh mới, tên): hợp đích đúng một mã → { xa }; hơn một (tách, hoặc cùng tên ở các huyện cũ
 * khác nhau) → { canChon } — không bao giờ chọn hộ.
 * @param {{maTinh:string, ten:string, vao:string[]}[]} xaCu
 * @param {string} maTinh @param {string} ten
 * @returns {{ xa: string } | { canChon: string[] } | null}
 */
export function traXaCu(xaCu, maTinh, ten) {
  const k = chuanTen(ten);
  const rows = xaCu.filter((r) => r.maTinh === maTinh && chuanTen(r.ten) === k);
  if (!rows.length) return null;
  const dich = [...new Set(rows.flatMap((r) => r.vao))].sort();
  return dich.length === 1 ? { xa: dich[0] } : { canChon: dich };
}

/** Số khoá (tỉnh, tên) theo ba lớp — báo cáo của bộ nạp in cạnh con số 441 dòng tách. */
export function demKhoaXaCu(xaCu) {
  const out = { motDich: 0, tach: 0, trungTen: 0 };
  for (const rows of nhomXaCu(xaCu).values()) {
    const dich = new Set(rows.flatMap((r) => r.vao));
    if (dich.size === 1) out.motDich++;
    else if (rows.some((r) => r.vao.length > 1)) out.tach++;
    else out.trungTen++;
  }
  return out;
}

const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * S03 chỉ nhận tên xã cũ khi bài gọi đích danh «phường/xã/thị trấn/P./X. <tên cũ>» (tên phường cũ hay trùng tên đường).
 * Khớp dài nhất; hai tên cùng độ dài trỏ hai xã khác nhau → null.
 * @param {string} text
 * @param {Map<string, string>|undefined} biDanh tên chuẩn → area_id
 * @returns {string|null}
 */
export function matchXaCuCoTienTo(text, biDanh) {
  if (!biDanh || !biDanh.size || !text) return null;
  const chu = text.normalize("NFC").toLowerCase();
  let best = null, bestLen = 0, tranh = false;
  for (const [ten, id] of biDanh) {
    if (ten.length < 2) continue;
    const re = new RegExp(`(?<![\\p{L}\\d])(?:phường|xã|thị trấn|p\\.|x\\.)\\s*${thoat(ten)}(?![\\p{L}\\d])`, "u");
    if (!re.test(chu)) continue;
    if (ten.length > bestLen) { best = id; bestLen = ten.length; tranh = false; }
    else if (ten.length === bestLen && id !== best) tranh = true;
  }
  return tranh ? null : best;
}

/**
 * So gán khu vực trước/sau theo tỉnh (thước AC-9).
 * @param {{ ma: string, tinh: string|null, truoc: string|null, sau: string|null, cachSau?: string|null }[]} dong
 * @param {{ laXa: (id: string|null) => boolean, khaiTruoc?: Set<string> }} o
 */
export function soSanhTruocSau(dong, { laXa, khaiTruoc = new Set() }) {
  const bang = new Map();
  const mau = { matXa: [], doiXa: [], moiTen: [], moiBiDanh: [] };
  for (const d of dong) {
    const t = d.tinh ?? "(không tỉnh)";
    if (!bang.has(t)) bang.set(t, { tinh: t, tin: 0, truoc: 0, sau: 0, matXa: 0, doiXa: 0, moiTen: 0, moiBiDanh: 0 });
    const b = bang.get(t);
    b.tin++;
    const xt = laXa(d.truoc), xs = laXa(d.sau);
    if (xt) b.truoc++;
    if (xs) b.sau++;
    if (xt && !xs) { b.matXa++; mau.matXa.push(d.ma); }
    if (xt && xs && d.truoc !== d.sau && !khaiTruoc.has(d.ma)) { b.doiXa++; mau.doiXa.push(d.ma); }
    if (!xt && xs) {
      if (d.cachSau === "bi-danh") { b.moiBiDanh++; mau.moiBiDanh.push(d.ma); } else { b.moiTen++; mau.moiTen.push(d.ma); }
    }
  }
  const rows = [...bang.values()].sort((a, b) => a.tinh.localeCompare(b.tinh));
  const loi = [];
  for (const r of rows) {
    if (r.sau < r.truoc) loi.push(`PX1-AC-9 tỉnh giảm: ${r.tinh}`);
    if (r.matXa) loi.push(`PX1-AC-9 mất xã: ${r.matXa} (${r.tinh})`);
    if (r.doiXa) loi.push(`PX1-AC-9 đổi xã: ${r.doiXa} (${r.tinh})`);
  }
  return { bang: rows, do: loi, mau };
}
