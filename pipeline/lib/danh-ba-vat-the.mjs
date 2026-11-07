// danh-ba-vat-the.mjs — lõi thuần của danh bạ vật thể toà · trục · căn (hồ sơ danh-ba-toa-truc-can, DB1; ADR-0016 §2–§7).
// Tính kế hoạch đúc từ trạng thái hiện có (bí danh) — không DB ở đây; lệnh pipeline/danh-ba-vat-the.mjs ghi.
// Luật: khoá đúc một lần, tra bí danh trước (dựng lại không đúc thêm); căn chỉ khi có mã căn tách được; toà chỉ thấy
// trên tin là ứng viên, không đúc (Hỏi-4); phường chỉ khi nút vùng có đúng một phường (Hỏi-5).
import { randomBytes } from "node:crypto";
import { tachMa } from "./ma-can-s08.mjs";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const NGUON_DANH_MUC = "S08";
export const BANG_VAT_THE = Object.freeze(["buildings", "stacks", "units"]);

/** Khoá vật thể mờ `<bld|stk|unt>_<ULID>` — cùng thuật toán khoá người (055): 10 ký tự thời gian + 16 ngẫu nhiên. */
export function moiKhoa(tienTo, now = Date.now(), rand = randomBytes) {
  if (!["bld", "stk", "unt"].includes(tienTo)) throw new Error(`tiền tố vật thể lạ: ${tienTo}`);
  let t = "";
  let ms = now;
  for (let i = 0; i < 10; i++) { t = CROCKFORD[ms % 32] + t; ms = Math.floor(ms / 32); }
  const b = rand(16);
  let r = "";
  for (let i = 0; i < 16; i++) r += CROCKFORD[b[i] % 32];
  return `${tienTo}_${t}${r}`;
}

/** UniversalPropertyId neo toà (ADR-0016 §4). */
export const upiToa = (iso, khoaToa) => `urn:onehub:upi:1:VN:${iso}:${khoaToa}`;

/** Tên toà để so: bỏ dấu, khoảng, gạch ngang, gạch dưới; viết hoa ("pr 6", "Pr-6" → "PR6"). Giữ dấu chấm ("S2.17"). */
export function chuanHoaTenToa(s) {
  if (typeof s !== "string") return "";
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").replace(/[\s\-_]+/g, "").toUpperCase();
}

/** Giá trị bí danh S08 (phạm vi dự án S08 nằm trong giá trị — 082 §2). */
export const biDanhToa = (p, toa) => `${p}/${toa}`;
export const biDanhTruc = (p, toa, truc) => `${p}/${toa}/${truc}`;
export const biDanhCan = (p, ma) => `${p}/${ma.trim().toUpperCase()}`;

/**
 * Nút vùng của toà: phân khu (asset_nodes node_type building, cùng khu) có tên/bí danh khớp phân khu S08 của toà; không
 * khớp hay khớp nhiều → khu.
 * @param {{ khu_id: number, phan_khu: Set<string> }} toa  — phan_khu: các subdivision S08 (viết thường) của dòng toà
 * @param {Map<number, Array<{ id: number, ten: string[] }>>} phanKhuTheoKhu
 */
export function nutVungCuaToa(toa, phanKhuTheoKhu) {
  const ds = phanKhuTheoKhu.get(toa.khu_id) ?? [];
  const khop = ds.filter((pk) => pk.ten.some((t) => toa.phan_khu.has(t.toLowerCase())));
  return khop.length === 1 ? khop[0].id : toa.khu_id;
}

/**
 * Kế hoạch đúc từ dòng S08 và bí danh đang có.
 * @param {{ dongS08: Array<{ project_id: string, product_code: string, khu_id: number, iso: 'VN-HN'|'VN-SG', subdivision?: string|null }>,
 *           biDanh: Map<string, string>, phanKhuTheoKhu?: Map<number, Array<{ id: number, ten: string[] }>>,
 *           taoKhoa?: (tienTo: string) => string }} vao
 */
export function keHoachDung({ dongS08, biDanh, phanKhuTheoKhu = new Map(), taoKhoa = (t) => moiKhoa(t) }) {
  const toa = new Map(); // value bí danh → bản ghi
  const truc = new Map();
  const can = new Map();
  const biDanhMoi = [];
  const lyDo = new Map(); // `${project}|${ly_do}` → số
  const tiLe = {}; // khu → { n, tach }
  const datKhoa = (value, tienTo) => {
    const co = biDanh.get(value);
    if (co) return { key: co, moi: false };
    const key = taoKhoa(tienTo);
    biDanh.set(value, key);
    biDanhMoi.push({ object_key: key, value });
    return { key, moi: true };
  };
  const daThay = new Set();
  for (const d of dongS08) {
    const ma = typeof d.product_code === "string" ? d.product_code.trim().toUpperCase() : "";
    const vCan = ma ? biDanhCan(d.project_id, ma) : null;
    if (vCan && daThay.has(vCan)) continue; // cùng mã ở nhiều lần chụp
    if (vCan) daThay.add(vCan);
    tiLe[d.khu_id] ??= { n: 0, tach: 0 };
    tiLe[d.khu_id].n++;
    const kq = tachMa(d.product_code);
    if (!kq.toa) {
      const k = `${d.project_id}|${kq.khong_tach}`;
      lyDo.set(k, (lyDo.get(k) ?? 0) + 1);
      continue;
    }
    tiLe[d.khu_id].tach++;
    const vToa = biDanhToa(d.project_id, kq.toa);
    let t = toa.get(vToa);
    if (!t) {
      t = { ...datKhoa(vToa, "bld"), project_id: d.project_id, ma_toa: kq.toa, khu_id: d.khu_id, iso: d.iso, phan_khu: new Set() };
      toa.set(vToa, t);
    }
    if (d.subdivision) t.phan_khu.add(String(d.subdivision).toLowerCase());
    const vTruc = biDanhTruc(d.project_id, kq.toa, kq.truc);
    let s = truc.get(vTruc);
    if (!s) {
      s = { ...datKhoa(vTruc, "stk"), toa_key: t.key, project_id: d.project_id };
      truc.set(vTruc, s);
    }
    can.set(vCan, { ...datKhoa(vCan, "unt"), toa_key: t.key, truc_key: s.key, tang: kq.tang, project_id: d.project_id });
  }
  for (const t of toa.values()) t.region_node_id = nutVungCuaToa(t, phanKhuTheoKhu);
  return {
    toa: [...toa.values()],
    truc: [...truc.values()],
    can: [...can.values()],
    biDanhMoi,
    soLyDo: [...lyDo].map(([k, so]) => {
      const [project_id, ly_do] = k.split("|");
      return { project_id, ly_do, so };
    }),
    tiLe,
  };
}

/**
 * Phát biểu toà trên tin → bí danh tên (khớp đúng một toà của khu) hoặc ứng viên. Không đúc toà (Hỏi-4).
 * @param {{ phatBieu: Array<{ subject_key: string, value: string, khu_id: number|null, nguoi: string|null, nhom: string|null }>,
 *           toaTheoKhu: Map<number, Map<string, string[]>> }} vao — toaTheoKhu: khu → tên chuẩn hoá → khoá toà
 */
export function ungVienTuTin({ phatBieu, toaTheoKhu }) {
  const biDanhTen = new Map();
  const ungVien = new Map();
  for (const p of phatBieu) {
    if (p.khu_id == null) continue;
    const ten = chuanHoaTenToa(p.value);
    if (!ten) continue;
    const keys = toaTheoKhu.get(p.khu_id)?.get(ten) ?? [];
    if (keys.length === 1) {
      // Bí danh giữ đúng cách viết trên tin (tên gọi khác); cách viết trùng tên đã có thì ràng buộc duy nhất bỏ qua.
      const source = p.subject_key.split(":")[0];
      const value = p.value.trim().replace(/\s+/g, " ");
      biDanhTen.set(`${keys[0]}|${value}|${source}`, { object_key: keys[0], value, source });
      continue;
    }
    const k = `${p.khu_id}|${ten}`;
    const u = ungVien.get(k) ?? { khu_id: p.khu_id, ten, nguoi: new Set(), nhom: new Set(), khop: keys.length };
    if (p.nguoi) u.nguoi.add(p.nguoi);
    if (p.nhom) u.nhom.add(p.nhom);
    ungVien.set(k, u);
  }
  return {
    biDanhTen: [...biDanhTen.values()],
    ungVien: [...ungVien.values()].map((u) => ({ khu_id: u.khu_id, ten: u.ten, khop: u.khop, so_nguoi_dang: u.nguoi.size, so_nhom: u.nhom.size })),
  };
}

/**
 * Phường của toà (Hỏi-5): nút vùng có area_ids thì dùng, không thì khu; đúng một phường (submarket) → phường đó.
 * @param {{ nutVung: { id: number, area_ids: string[] }, khu: { id: number, area_ids: string[] }, cap: Map<string, string> }} vao
 */
export function phuongCuaToa({ nutVung, khu, cap }) {
  const nut = (nutVung.area_ids ?? []).length ? nutVung : khu;
  const phuong = [...new Set(nut.area_ids ?? [])].filter((a) => cap.get(a) === "submarket");
  if (phuong.length === 1) return { area_id: phuong[0], nut_vung: nut.id };
  return { ly_do: phuong.length > 1 ? "khu-nhieu-phuong" : "khong-co-phuong", nut_vung: nut.id };
}

/**
 * Vật thể không lên cloud (ADR-0016 §9): ba bảng vật thể không trong FILL; hai bảng dùng chung mà vào FILL thì bộ chọn
 * dòng phải loại bí danh ma_nguon S08 và phát biểu vật thể.
 * @param {string[]} fill
 * @param {{ chonDong?: (bang: string, rows: object[]) => object[] }} [opts]
 * @returns {string[]} lỗi
 */
export function kiemFill(fill, { chonDong } = {}) {
  const loi = [];
  for (const b of BANG_VAT_THE) if (fill.includes(b)) loi.push(`DBV-AC-11 vật thể lên cloud: ${b}`);
  const mau = {
    registry_aliases: [
      { object_key: "bld_x", kind: "ma_nguon", source: NGUON_DANH_MUC, value: "q/QA1" },
      { object_key: "pty_x", kind: "ten", source: "S03", value: "q" },
    ],
    field_assertions: [
      { resource_name: "Building", subject_key: "bld_x", field: "builder_name" },
      { resource_name: "Property", subject_key: "S03:q", field: "block_raw" },
    ],
  };
  for (const [bang, rows] of Object.entries(mau)) {
    if (!fill.includes(bang)) continue;
    const giu = chonDong ? chonDong(bang, rows) : rows;
    const laVatThe = (r) => (r.kind === "ma_nguon" && r.source === NGUON_DANH_MUC) || /^(bld|stk|unt)_/.test(r.subject_key ?? r.object_key ?? "");
    if (giu.some(laVatThe)) loi.push(`DBV-AC-11 vật thể lên cloud: ${bang} ${bang === "registry_aliases" ? "ma_nguon" : "vật thể"}`);
    if (giu.filter((r) => !laVatThe(r)).length < rows.filter((r) => !laVatThe(r)).length) {
      loi.push(`DBV-AC-11 bộ chọn dòng bỏ cả dòng không phải vật thể: ${bang}`);
    }
  }
  return loi;
}
