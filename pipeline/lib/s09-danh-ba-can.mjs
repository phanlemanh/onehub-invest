// s09-danh-ba-can.mjs — DA42 nap-s09-toa-tang-vao-danh-ba: luật xác định đưa dự án, toà, tầng của gói 1 S09 (nguồn
// s09-danh-ba, bảng stg_s09_danh_ba của 115) vào danh bạ. Hàm thuần, không DB — bước dựng (s09-dung.mjs) đọc DB rồi gọi vào đây.
// Thiết kế: docs/superpowers/specs/2026-11-18-nap-s09-toa-tang-vao-danh-ba-design.md §5 · kế hoạch 2026-11-21 §2.
// Không chứa tên nguồn hay tên miền thật. Không ghi gì: mọi kết cục là một hành động để bên gọi thực thi.
import { chuanKhop, chuanTen } from "./noi-du-an-s06-lop.mjs";
import { khoaTenS09 } from "./s09-du-an.mjs";

export const NGUON_S09 = "S09";

/**
 * Kind của gói 1 mà DA42 đọc — danh sách DƯƠNG (giám sát 22/11). Bảng stg_s09_danh_ba không CHECK kind: bản thu S09 ngoài Hà Nội
 * và quỹ căn có giá nạp chung bảng với kind mới, là phạm vi hàng sau. View của 115/125 lọc bằng đẳng thức theo đúng các giá trị
 * này; danh mục gói 1 ghim thêm source_id. Ca test «kind lạ» ở pipeline/scripts/danh-ba-s09-toa.itest.mjs.
 */
export const KIND_GOI_1 = Object.freeze({ danhMuc: "danh-muc", toa: "toa", tang: "tang" });
export const SOURCE_ID_DANH_MUC_GOI_1 = "danh-muc";

/** Bí danh ma_nguon của gói 1: namespace riêng, khác `<pid>/<block_id>` của DA31 (chỉ mục duy nhất source+kind+value). */
export const MA_DU_AN = (duAnId) => `danh-ba-du-an/${duAnId}`;
export const MA_TOA = (toaId) => `danh-ba-toa/${toaId}`;

/** Lệch số tầng cho phép giữa S09 và S16 trước khi coi là hai toà khác nhau (AC-5). */
export const NGUONG_TANG = 2;
/** Tên gần giống: hai tên bỏ dấu dài ít nhất ngần này ký tự và bằng nhau hoặc chứa nhau. */
export const DO_DAI_GAN = 8;

/** Bốn đường của dự án (AC-3). */
export const DUONG = Object.freeze({ daNoi: "da_noi", theLuat: "the_luat", theCap: "the_cap", ungVien: "ung_vien" });

const tenCua = (n) => [n.name, ...(n.aliases ?? [])].filter((t) => typeof t === "string" && t.trim() !== "");

/**
 * Xếp một dự án S09 vào một trong bốn đường.
 * @param {{du_an_id:string, ten:string}} da
 * @param {{id:number, name:string, aliases?:string[]|null}[]} nut  nút project của danh bạ (không gồm nút ứng viên S09 của chính lượt)
 * @param {{ noiCung?: Map<string, number>, link?: {status:string, asset_node_id:number|null, la_ung_vien?:boolean}|null,
 *           luatDuyet?: boolean, theCap?: {status:'approved'|'rejected'|string, node_id?:number|null}|null }} [o]
 *   noiCung: dự án đã nối bằng tay (NOI_KHU_S09) → id nút · link: dòng project_links S09 hiện có · luatDuyet: thẻ luật nguồn S09
 *   đang hiệu lực (project_link_rules chưa đảo) · theCap: thẻ từng cặp của dự án này nếu có.
 * @returns {{duong:string, node_id?:number, ung_vien_cua?:number[], ly_do?:string, noi:boolean}}
 */
export function phanLopDuAn(da, nut, { noiCung = new Map(), link = null, luatDuyet = false, theCap = null } = {}) {
  // Nút ứng viên đã đúc cho chính dự án này ở lượt trước: giữ, không xét lại (chạy lại không đúc nút thứ hai).
  if (link?.la_ung_vien && link.asset_node_id != null) return { duong: DUONG.ungVien, node_id: Number(link.asset_node_id), noi: true };
  if (noiCung.has(da.du_an_id)) return { duong: DUONG.daNoi, node_id: noiCung.get(da.du_an_id), noi: true };
  const k = chuanKhop(da.ten);
  const trung = k ? nut.filter((n) => tenCua(n).some((t) => chuanKhop(t) === k)).map((n) => n.id) : [];
  const uniq = [...new Set(trung)].sort((a, b) => a - b);
  if (uniq.length === 1) {
    return luatDuyet
      ? { duong: DUONG.theLuat, node_id: uniq[0], noi: true }
      : { duong: DUONG.theLuat, node_id: uniq[0], ly_do: "cho-the-luat", noi: false };
  }
  let ung = uniq;
  if (ung.length === 0) {
    const kt = chuanTen(da.ten);
    if (kt.length >= DO_DAI_GAN) {
      ung = [...new Set(nut.filter((n) => tenCua(n).some((t) => {
        const x = chuanTen(t);
        return x.length >= DO_DAI_GAN && (x === kt || x.includes(kt) || kt.includes(x));
      })).map((n) => n.id))].sort((a, b) => a - b);
    }
  }
  if (ung.length) {
    // Thẻ từng cặp: người chọn đúng một nút thì nối; từ chối hay chưa duyệt thì chưa nối.
    if (theCap?.status === "approved" && theCap.node_id != null && ung.includes(Number(theCap.node_id))) {
      return { duong: DUONG.theCap, node_id: Number(theCap.node_id), ung_vien_cua: ung, noi: true };
    }
    return { duong: DUONG.theCap, ung_vien_cua: ung, ly_do: theCap?.status === "rejected" ? "the-tu-choi" : "cho-the-cap", noi: false };
  }
  return { duong: DUONG.ungVien, noi: true };
}

/** Tầng không đem so ở vế tên tầng: S09 kê từ tầng 2, S16 có căn tầng 1 (ki-ốt, shophouse) — Q1 Cổng 1.5, Mạnh duyệt 22/11. */
export const TANG_KHONG_SO = new Set(["1"]);

/** Chuẩn tên tầng để so giữa hai nguồn: bỏ khoảng trắng, viết hoa, bỏ số 0 đứng đầu («02» → «2», «12b» → «12B»). */
export const chuanTenTang = (t) => {
  const s = String(t ?? "").replace(/\s+/g, "").toUpperCase();
  return s === "" ? null : s.replace(/^0+(?=[0-9A-Z])/, "");
};

const tapTang = (ds) => new Set([...(ds ?? [])].map(chuanTenTang).filter((x) => x != null));
const veTang = (x) => (typeof x === "number" || x == null ? { so: x ?? null, ten: null } : x);

/**
 * Toà S09 và toà S16 cùng tên có lệch tầng không (AC-5, Q1 Cổng 1.5 22/11). Lệch MỘT CHIỀU: S09 kê mọi tầng, S16 chỉ có tầng có
 * căn, nên S09 nhiều tầng hơn (tầng đế, kỹ thuật) KHÔNG là tín hiệu khác toà. Lệch khi:
 *   (a) S09 ít hơn số tầng có căn của S16 quá NGUONG_TANG; hoặc
 *   (b) S16 có căn ở một tầng mà danh sách tầng S09 không kê, sau chuẩn tên, không so các tầng trong TANG_KHONG_SO.
 * Mỗi bên là `{ so, ten }` (ten: danh sách tên tầng) hoặc một số (chỉ có số tầng). null khi không có gì để so.
 * @param {{so?:number|null, ten?:Iterable<string>|null}|number|null} s09
 * @param {{so?:number|null, ten?:Iterable<string>|null}|number|null} s16
 * @returns {boolean|null}
 */
export function lechTangS16(s09, s16) {
  const a = veTang(s09), b = veTang(s16);
  const soA = Number.isFinite(a.so) && a.so > 0 ? a.so : null;
  const soB = Number.isFinite(b.so) && b.so > 0 ? b.so : null;
  const tenA = tapTang(a.ten), tenB = tapTang(b.ten);
  const soDuoc = soA != null && soB != null;
  const tenDuoc = tenA.size > 0 && tenB.size > 0;
  if (!soDuoc && !tenDuoc) return null;
  if (soDuoc && soB - soA > NGUONG_TANG) return true;
  if (tenDuoc && [...tenB].some((f) => !TANG_KHONG_SO.has(f) && !tenA.has(f))) return true;
  return false;
}

/**
 * Xét các toà S09 của một dự án đã nối (AC-4, AC-5).
 * @param {{toa_id:string, ten:string, so_tang:number, tang?:string[]}[]} toaS09  tang: tên các tầng S09 kê
 * @param {{building_key:string, ten:string[], ma_cu:boolean, ma_cu_ds?:string[], s16:boolean, so_tang_s16:number|null, tang_s16?:string[]|null}[]} toaCo
 *   toà active của nút dự án; ma_cu: mang bí danh `<pid>/<block_id>` của DA31 · ma_cu_ds: các giá trị mã cũ đó · s16: mang bí danh
 *   S16 · so_tang_s16: số tầng có căn · tang_s16: tên các tầng có căn
 * @param {Map<string,string>} maMoi  `danh-ba-toa/<id>` đã có → building_key
 * @returns {{toa_id:string, ten:string, ten_chuan:string, loai:'da_noi'|'bi_danh'|'tao_moi'|'the', ly_do?:string,
 *            building_key?:string, building_keys?:string[], khong_so?:boolean, theo_ma_cu?:boolean}[]}
 *
 * Mã cũ trước tên (giám sát duyệt 22/11, lệch kế hoạch §2 có lý do): mã toà gói 1 trùng đúng phần block của mã cũ DA31
 * `<du_an>/<block_id>` (cùng một nguồn) là căn cứ mạnh hơn trùng tên. Toà gói 1 mà đúng một toà có sẵn mang mã cũ ấy thì nhận bí
 * danh MÃ trên toà đó (không gắn bí danh tên), kể cả khi hai toà gói 1 cùng tên — ca luật tên ra thẻ «trùng tên trong dự án» (ca
 * gốc: toà mang hai mã block cùng tên, 22/11). Mã cũ trỏ toà A mà tên khớp duy nhất toà B ≠ A → thẻ «xung đột mã cũ – tên», không
 * tự nối theo bên nào. Luật lệch tầng S16 vẫn áp.
 */
export function xetToa(toaS09, toaCo, maMoi = new Map()) {
  const demTen = new Map();
  for (const t of toaS09) { const k = khoaTenS09(t.ten); if (k) demTen.set(k, (demTen.get(k) ?? 0) + 1); }
  const theoTen = new Map();
  for (const b of toaCo) {
    for (const t of b.ten) {
      const k = khoaTenS09(t);
      if (!k) continue;
      const s = theoTen.get(k) ?? new Map();
      s.set(b.building_key, b);
      theoTen.set(k, s);
    }
  }
  // Toà có sẵn theo phần block của mã cũ DA31 (`<du_an>/<block_id>` → block_id).
  const theoMaCu = new Map();
  for (const b of toaCo) {
    for (const v of b.ma_cu_ds ?? []) {
      const blk = String(v).split("/").pop();
      if (!blk) continue;
      const s = theoMaCu.get(blk) ?? new Map();
      s.set(b.building_key, b);
      theoMaCu.set(blk, s);
    }
  }
  const soTang = (t, b) => lechTangS16({ so: t.so_tang, ten: t.tang }, { so: b.so_tang_s16, ten: b.tang_s16 });
  return toaS09.map((t) => {
    const ten_chuan = khoaTenS09(t.ten);
    const co = { toa_id: t.toa_id, ten: t.ten, ten_chuan };
    const daCo = maMoi.get(MA_TOA(t.toa_id));
    if (daCo) return { ...co, loai: "da_noi", building_key: daCo };
    const cu = [...(theoMaCu.get(t.toa_id)?.values() ?? [])];
    if (cu.length > 1) return { ...co, loai: "the", ly_do: "ma-cu-hai-toa", building_keys: cu.map((b) => b.building_key).sort() };
    if (cu.length === 1) {
      const a = cu[0];
      const theoTenDuyNhat = ten_chuan ? [...(theoTen.get(ten_chuan)?.values() ?? [])] : [];
      if (theoTenDuyNhat.length === 1 && theoTenDuyNhat[0].building_key !== a.building_key) {
        return { ...co, loai: "the", ly_do: "xung-dot-ma-cu-ten", building_keys: [a.building_key, theoTenDuyNhat[0].building_key].sort() };
      }
      const lech = soTang(t, a);
      if (lech === true) return { ...co, loai: "the", ly_do: "lech-tang-s16", building_keys: [a.building_key] };
      return { ...co, loai: "bi_danh", building_key: a.building_key, theo_ma_cu: true, ...(a.s16 && lech === null ? { khong_so: true } : {}) };
    }
    if (!ten_chuan) return { ...co, loai: "the", ly_do: "khong-ten" };
    if (demTen.get(ten_chuan) > 1) return { ...co, loai: "the", ly_do: "trung-ten-trong-du-an" };
    const khop = [...(theoTen.get(ten_chuan)?.values() ?? [])].sort((a, b) => a.building_key.localeCompare(b.building_key));
    if (khop.length === 0) return { ...co, loai: "tao_moi" };
    if (khop.length > 1) return { ...co, loai: "the", ly_do: "khop-hai", building_keys: khop.map((b) => b.building_key) };
    const b = khop[0];
    const lech = soTang(t, b);
    if (lech === true) return { ...co, loai: "the", ly_do: "lech-tang-s16", building_keys: [b.building_key] };
    return { ...co, loai: "bi_danh", building_key: b.building_key, ...(b.s16 && lech === null ? { khong_so: true } : {}) };
  });
}

/** Gom kết cục xetToa thành bộ đếm (AC-10 phép cộng phần). */
export function demToa(kq) {
  const d = { da_noi: 0, bi_danh: 0, tao_moi: 0, the: 0, khong_so: 0, theo_ma_cu: 0, the_theo_ly_do: {} };
  for (const x of kq) {
    d[x.loai]++;
    if (x.khong_so) d.khong_so++;
    if (x.theo_ma_cu) d.theo_ma_cu++;
    if (x.loai === "the") d.the_theo_ly_do[x.ly_do] = (d.the_theo_ly_do[x.ly_do] ?? 0) + 1;
  }
  return d;
}
