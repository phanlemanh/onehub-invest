// danh-ba-vat-the.mjs — lõi thuần của danh bạ vật thể toà · trục · căn (hồ sơ danh-ba-toa-truc-can, DB1; ADR-0016 §2–§7).
// Tính kế hoạch đúc từ trạng thái hiện có (bí danh) — không DB ở đây; lệnh pipeline/danh-ba-vat-the.mjs ghi.
// Luật: khoá đúc một lần, tra bí danh trước (dựng lại không đúc thêm); căn chỉ khi có mã căn tách được; toà chỉ thấy
// trên tin là ứng viên, không đúc (Hỏi-4); phường chỉ khi nút vùng có đúng một phường (Hỏi-5).
import { randomBytes } from "node:crypto";
import pg from "pg";
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
  // Mã vùng không có trong areas (mã cũ, đã đổi sau sáp nhập) → không biết khu có mấy phường: không đoán.
  if ((nut.area_ids ?? []).some((a) => !cap.has(a))) return { ly_do: "vung-khong-ro", nut_vung: nut.id };
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

// ---------------- DB1b dung-danh-ba-may-thu: đích ghi, đếm độc lập, so bản chép ----------------

const MAY_NAY = new Set(["localhost", "127.0.0.1", "::1"]);
export const THONG_DIEP = Object.freeze({
  ngoai: "đích ngoài máy này — lệnh dựng chỉ ghi DB trên máy này (không cờ nào mở)",
  hong: "URL không đọc được — cần postgres://…/<tên DB>",
  thieuCo: "đích không phải DB thử — khai --db-that nếu chủ ý ghi DB máy thu",
});

/**
 * Tham số kết nối mà pg.Client THẬT sẽ dùng (chưa connect): máy chủ đọc từ connectionParameters, nên ?host= và PGHOST
 * được tính như pg tính. URL không mở đầu postgres:// hay thiếu tên DB → null (pg tự điền tên người dùng làm tên DB).
 * @param {string} url
 * @returns {{ host: string, database: string } | null}
 */
export function thamSoTuUrl(url) {
  if (typeof url !== "string" || !/^postgres(ql)?:\/\//i.test(url)) return null;
  let ten;
  try {
    ten = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
  if (!ten) return null;
  try {
    const p = new pg.Client({ connectionString: url }).connectionParameters;
    return { host: String(p.host ?? ""), database: String(p.database ?? "") };
  } catch {
    return null;
  }
}

/**
 * Đích ghi có được phép không. Máy này = localhost/127.0.0.1/::1 hoặc đường socket (mở đầu «/»); DB thử = máy này và tên
 * `oneinvest_<việc>`. Đích ngoài máy luôn bị từ chối, kể cả dbThat. Thông điệp không mang URL hay mật khẩu.
 * @param {{ host?: string, database?: string } | null} thamSo
 * @param {{ dbThat?: boolean }} [opts]
 * @returns {{ ok: true, loai: "thu" | "that" } | { ok: false, ly_do: string }}
 */
export function kiemDich(thamSo, { dbThat = false } = {}) {
  if (!thamSo || !thamSo.database) return { ok: false, ly_do: THONG_DIEP.hong };
  const host = String(thamSo.host ?? "").replace(/^\[|\]$/g, "");
  if (!(MAY_NAY.has(host) || host.startsWith("/"))) return { ok: false, ly_do: THONG_DIEP.ngoai };
  if (/^oneinvest_\w+$/.test(thamSo.database)) return { ok: true, loai: "thu" };
  return dbThat ? { ok: true, loai: "that" } : { ok: false, ly_do: THONG_DIEP.thieuCo };
}

/** Khu của một toà: project của region_node_id, hoặc cha (project) của phân khu. */
const SQL_KHU_CUA_TOA = `
  SELECT b.building_key, COALESCE(CASE WHEN n.node_type = 'project' THEN n.slug END, p.slug) AS khu
    FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id
    LEFT JOIN asset_nodes p ON p.id = n.parent_id AND p.node_type = 'project'`;

/**
 * Đếm độc lập toà, trục, căn theo khu bằng SQL trên ba bảng (không đọc tổng kết bộ dựng).
 * @param {import("pg").Client} c
 * @returns {Promise<Map<string, { toa: number, truc: number, can: number }>>}
 */
export async function demTheoKhu(c) {
  const { rows } = await c.query(`
    WITH k AS (${SQL_KHU_CUA_TOA})
    SELECT k.khu,
           count(DISTINCT k.building_key)::int AS toa,
           (SELECT count(*)::int FROM stacks s JOIN k k2 ON k2.building_key = s.building_key WHERE k2.khu = k.khu) AS truc,
           (SELECT count(*)::int FROM units u JOIN k k3 ON k3.building_key = u.building_key WHERE k3.khu = k.khu) AS can
      FROM k WHERE k.khu IS NOT NULL GROUP BY k.khu ORDER BY k.khu`);
  return new Map(rows.map((r) => [r.khu, { toa: r.toa, truc: r.truc, can: r.can }]));
}

/** Khu đã dựng (có ít nhất một toà) — tập khu của bước đêm. */
export async function khuDaDung(c) {
  const { rows } = await c.query(`SELECT DISTINCT khu FROM (${SQL_KHU_CUA_TOA}) k WHERE khu IS NOT NULL ORDER BY 1`);
  return rows.map((r) => r.khu);
}

/**
 * So hai bảng đếm (máy thu · bản chép) trên mọi khu của máy thu; lệch trả từng (khu, cấp).
 * @param {Map<string, {toa:number,truc:number,can:number}>} may @param {Map<string, {toa:number,truc:number,can:number}>} ban
 */
export function soDem(may, ban) {
  const lech = [];
  for (const [khu, a] of may) {
    const b = ban.get(khu) ?? { toa: 0, truc: 0, can: 0 };
    for (const cap of ["toa", "truc", "can"]) if (a[cap] !== b[cap]) lech.push({ khu, cap, may: a[cap], ban: b[cap] });
  }
  return lech;
}

/** Nhánh của phép so dữ liệu thật: máy thu đã có toà thì so, chưa thì «chưa so». */
export const nhanSo = (demMay) => ([...demMay.values()].some((d) => d.toa > 0) ? "so" : "chua-so");

// ---- DV1 nut-du-an-tro-xa-moi: mã xã của nút dự án suy từ xã cũ có nguồn ----

/** Mã lỗi của một mục tệp xã (thiết kế §2). */
export const LOI_XA = Object.freeze([
  "thieu-nguon", "thieu-ly-do", "xa-cu-khong-co", "can-chon-xa", "chon-ngoai-dich", "ma-khong-co", "tinh-khong-co",
]);

const nguonDung = (n) => Boolean(n && typeof n.ten === "string" && n.ten.trim() && /^https?:\/\/\S+$/.test(n.url ?? ""));

/**
 * Lỗi khuôn của một mục (không cần bảng): xã cũ có mã 5 số và nguồn; chọn khi tách có nguồn; cấp tỉnh có mã và lý do.
 * @param {string} slug @param {object} muc @returns {string[]} mã lỗi
 */
export function kiemMucXa(slug, muc) {
  const loi = new Set();
  if (!muc || typeof muc !== "object") return ["xa-cu-khong-co"];
  if (muc.cap === "tinh") {
    if (!muc.tinh) loi.add("tinh-khong-co");
    if (!String(muc.ly_do ?? "").trim()) loi.add("thieu-ly-do");
    return [...loi];
  }
  const xaCu = Array.isArray(muc.xa_cu) ? muc.xa_cu : [];
  if (!xaCu.length) loi.add("xa-cu-khong-co");
  for (const x of xaCu) {
    if (!/^\d{5}$/.test(x?.old_code ?? "")) loi.add("xa-cu-khong-co");
    if (!nguonDung(x?.nguon)) loi.add("thieu-nguon");
  }
  if (muc.chon !== undefined && !nguonDung(muc.nguon_chon)) loi.add("thieu-nguon");
  return [...loi];
}

/**
 * Mã mới của một nút: hợp đích của các xã cũ (theo MÃ, không theo tên); xã cũ tách thì phải có `chon` ⊂ đích; có `chon`
 * thì dùng `chon`. Mã xã mới → id khu vực qua bảng mã xã; cấp tỉnh → mã thị trường.
 * @param {object} muc
 * @param {{ biDanh: Map<string, {targets: string[], split: boolean}>, maXa: Map<string, {id: string, region_type: string}>, thiTruong: Set<string> }} bang
 * @returns {{ area_ids: string[] } | { loi: string }}
 */
export function xaMoiCuaNut(muc, { biDanh, maXa, thiTruong }) {
  const khuon = kiemMucXa("", muc);
  if (khuon.length) return { loi: khuon[0] };
  if (muc.cap === "tinh") return thiTruong.has(muc.tinh) ? { area_ids: [muc.tinh] } : { loi: "tinh-khong-co" };
  const dich = new Set();
  let tach = false;
  for (const x of muc.xa_cu) {
    const b = biDanh.get(x.old_code);
    if (!b) return { loi: "xa-cu-khong-co" };
    for (const t of b.targets) dich.add(t);
    tach ||= b.split;
  }
  let ma = [...dich];
  if (muc.chon !== undefined) {
    if (!Array.isArray(muc.chon) || !muc.chon.length || muc.chon.some((m) => !dich.has(m))) return { loi: "chon-ngoai-dich" };
    ma = [...new Set(muc.chon)];
  } else if (tach) return { loi: "can-chon-xa" };
  const ids = [];
  for (const m of ma) {
    const a = maXa.get(m);
    if (!a || a.region_type !== "submarket") return { loi: "ma-khong-co" };
    ids.push(a.id);
  }
  return { area_ids: [...new Set(ids)].sort() };
}

/**
 * Lỗi cấp tệp: đủ một-một với slug nút dự án, mỗi mục đúng khuôn. Khoá mở đầu «_» là ghi chú.
 * @param {{ nut?: Record<string, object> }} tep @param {string[]} slugs @returns {string[]}
 */
export function kiemTepXa(tep, slugs) {
  const nut = Object.fromEntries(Object.entries(tep?.nut ?? {}).filter(([k]) => !k.startsWith("_")));
  const loi = [];
  for (const s of slugs) if (!(s in nut)) loi.push(`thiếu nút ${s}`);
  for (const s of Object.keys(nut)) if (!slugs.includes(s)) loi.push(`slug lạ ${s}`);
  for (const [s, m] of Object.entries(nut)) for (const l of kiemMucXa(s, m)) loi.push(`${s}: ${l}`);
  return loi;
}

/** Slug nút project trong câu INSERT asset_nodes của một migration seed (026). @param {string} sql @returns {string[]} */
export function slugNutTuSeed(sql) {
  // Chỉ dòng giá trị mở đầu dòng «('project', '<tên>', '<slug>'» — bỏ CHECK (node_type IN ('project', …)) của CREATE TABLE.
  return [...sql.matchAll(/^\s*\(\s*'project'\s*,\s*'(?:[^']|'')*'\s*,\s*'([a-z0-9-]+)'/gm)].map((m) => m[1]);
}

/**
 * Đường tra SAI để đối chứng (DV1-AC-5): mọi đích của xã cũ cùng tên trong một tỉnh mới — đúng cái bẫy cùng tên mà
 * xaMoiCuaNut tránh bằng cách tra theo mã. Không dùng ở đường ghi.
 * @param {{ maTinh: string, ten: string, vao: string[] }[]} xaCu @param {string} maTinh @param {string} ten @returns {string[]}
 */
export function traXaCuTheoTen(xaCu, maTinh, ten) {
  return [...new Set(xaCu.filter((r) => r.maTinh === maTinh && r.ten === ten).flatMap((r) => r.vao))].sort();
}

// ---- DA1 danh-ba-vat-the-toan-quoc: mã tỉnh ISO của khu suy từ khu vực ----

/**
 * ISO của khu: thị trường của mỗi mã khu vực trong area_ids (market → chính nó, submarket → parent_id; mã không có trong
 * areas bỏ qua); đúng một thị trường có ISO → ISO đó. Không đọc meta.city (ghi sai cho khu Hưng Yên).
 * @param {{ slug?: string, area_ids?: string[] }} khu
 * @param {{ vung: Map<string, {region_type: string, parent_id: string|null}>, isoCuaThiTruong: Map<string, string> }} bang
 * @returns {{ iso: string } | { loi: "khong-co-tinh" | "nhieu-tinh" | "tinh-khong-co-iso" }}
 */
export function isoCuaKhu(khu, { vung, isoCuaThiTruong }) {
  const thiTruong = new Set();
  for (const id of khu.area_ids ?? []) {
    const v = vung.get(id);
    if (!v) continue;
    thiTruong.add(v.region_type === "market" ? id : v.parent_id);
  }
  if (thiTruong.size === 0) return { loi: "khong-co-tinh" };
  if (thiTruong.size > 1) return { loi: "nhieu-tinh" };
  const iso = isoCuaThiTruong.get([...thiTruong][0]);
  return iso ? { iso } : { loi: "tinh-khong-co-iso" };
}
