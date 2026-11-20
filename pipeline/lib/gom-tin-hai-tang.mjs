// gom-tin-hai-tang.mjs — GT5 khoa-gom-hai-tang: gom bài S03 thành tin theo hai tầng (hàm thuần, không DB, không model — luật 7).
// Spec: docs/superpowers/specs/2026-11-19-khoa-gom-hai-tang-design.md §2. Mạnh duyệt Cổng Phạm vi + Gate 1.5 ngày 20/11.
//
// Tầng một — bản chữ: bài cùng người đăng và cùng chữ chuẩn hoá (normText sau gatSo) là một bản chữ. Người đăng = sender_id, không có
//   thì SĐT trong bài; không có cả hai thì mỗi bài một bản chữ.
// Tầng hai — tin: bản chữ ĐỦ bốn trường (số phòng, diện tích, phân khu, mã) chung tin khi khoá bằng nhau trên người · loại · giá ·
//   số phòng · diện tích · tập phân khu · tập mã. Bản chữ thiếu trường không khớp khoá với ai (ô trống không bằng ô trống).
// Gom bản chữ cùng thiếu (Hỏi-6 lối B, Mạnh «GT5 chọn B» 20/11): bản chữ thiếu trường gom với nhau khi cùng người, cùng loại, cùng
//   giá, thiếu ĐÚNG cùng các trường, các trường có mặt bằng nhau, có cặp bài trong cửa sổ `cuaSoNgay` ngày và chữ giống từ `nguongChu`
//   (gom theo thành phần liên thông của các cặp đạt). Cùng căn đăng lại có sửa lời thì về một tin; ô trống vẫn không bằng ô có giá trị.
// Nhập tin thiếu trường: tin có trường vắng nhập vào một tin cùng người khi trong cửa sổ `cuaSoNgay` ngày có ĐÚNG MỘT tin ứng viên
//   đủ hơn (mọi trường tin thiếu có cũng có ở ứng viên và bằng nhau, ứng viên có thêm ít nhất một trường) và chữ giống từ `nguongChu`.
//   Không bắc cầu: chỉ nhập vào tin dựng từ khoá đầy đủ hơn ở tầng hai, mỗi tin thiếu nhập vào nhiều nhất một tin, nên không làm hai
//   tin đầy đủ chung một tin. Hai tập phân khu khác nhau, cả hai không rỗng, không bao giờ chung tin.
// Dạng bài (GT8): `pr.dangBai` có mặt và khác "mot_can" thì bài thành tin riêng.
import { normText } from "./norm-text.mjs";
import { maMoi } from "./gom-tin-ma.mjs";
import { tapPhanKhu } from "./gom-tin-phan-khu.mjs";

const NGAY = 86_400_000;
const TRUONG = ["pn", "dt", "pk", "ma"]; // trường có thể vắng của khoá tầng hai

const thoiDiem = (p) => (p.posted_at == null ? Number.POSITIVE_INFINITY : new Date(p.posted_at).getTime());
const sapBai = (a, b) => thoiDiem(a.post) - thoiDiem(b.post) || String(a.post.post_id).localeCompare(String(b.post.post_id));

/**
 * Người đăng của một bài: `sender:<id>` (chuỗi rỗng coi như vắng) → `phone:<sđt đầu trong bài>` → null.
 * @param {{ phones?: string[]|null, phone?: string|null }} pr @param {{ sender_id?: string|null }} post
 */
export function nguoiDang(pr, post) {
  const s = post.sender_id == null ? "" : String(post.sender_id).trim();
  if (s) return `sender:${s}`;
  const p = pr.phones?.[0] ?? pr.phone ?? null;
  return p ? `phone:${p}` : null;
}

/** Tập 3-gram từ của chữ đã chuẩn hoá (chữ dưới 3 từ thì lấy chính chuỗi). */
function bo3(chu) {
  const w = chu.split(" ").filter(Boolean);
  if (w.length < 3) return new Set([w.join(" ")]);
  const s = new Set();
  for (let i = 0; i + 3 <= w.length; i++) s.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return s;
}

/** Độ giống Jaccard trên 3-gram từ, 0..1. */
export function doGiong(a, b) {
  const A = bo3(a), B = bo3(b);
  let chung = 0;
  for (const x of A) if (B.has(x)) chung++;
  const hop = A.size + B.size - chung;
  return hop === 0 ? 1 : chung / hop;
}

const giaCua = (pr) => pr.priceVnd ?? pr.pricePerm2Vnd ?? null;

/**
 * Gom bài đã đọc thành tin.
 * @param {Array<object>} baiDaDoc phần tử `{ ...pr, post }` như mảng `parsed` của transform-zalo bước 4 (đã bỏ bài confidence low);
 *   cần `kind`, `priceVnd`|`pricePerm2Vnd`, `bedrooms`, `areaM2`, `unit`, `phones`, `dangBai?`, và `post.{post_id, posted_at, sender_id, text}`.
 * @param {{ tuDien: Array<{cum: string, khoa: string}>, gatSo: (t: string) => string, cuaSoNgay?: number, nguongChu?: number }} opts — `nguongChu` mặc định 0,3 (Hỏi-6 B), dùng cho cả hai luật nhập
 * @returns {Array<{ items: object[], banChu: number }>} mỗi tin: các bài sắp theo posted_at rồi post_id; thứ tự tin theo bài neo.
 */
export function gomHaiTang(baiDaDoc, { tuDien, gatSo, cuaSoNgay = 7, nguongChu = 0.3 }) {
  if (typeof gatSo !== "function") throw new Error("gomHaiTang: thiếu gatSo");
  // ---- Tầng một: bản chữ ----
  const banChu = new Map(); // khoá tầng một → bản chữ
  const rieng = []; // bài dạng khác mot_can: mỗi bài một tin
  for (const it of [...baiDaDoc].sort(sapBai)) {
    if (it.dangBai != null && it.dangBai !== "mot_can") { rieng.push({ items: [it], banChu: 1 }); continue; }
    const chuGat = gatSo(it.post.text ?? "");
    const chu = normText(chuGat);
    const nguoi = nguoiDang(it, it.post);
    const k1 = nguoi ? `${nguoi}|${chu}` : `bai:${it.post.post_id}`;
    let b = banChu.get(k1);
    if (!b) {
      const ma = [...new Set([...maMoi(chuGat), ...(it.unit ? [String(it.unit).toUpperCase()] : [])])].sort();
      const pk = tapPhanKhu(it.post.text ?? "", tuDien);
      b = {
        nguoi: nguoi ?? `bai:${it.post.post_id}`, chu, items: [],
        f: { loai: it.kind ?? null, gia: giaCua(it), pn: it.bedrooms ?? null, dt: it.areaM2 ?? null, pk: pk.length ? pk : null, ma: ma.length ? ma : null },
      };
      banChu.set(k1, b);
    }
    b.items.push(it);
  }
  // ---- Tầng hai: khoá bằng nhau — CHỈ bản chữ đủ cả bốn trường (thiết kế §2) ----
  // Sửa 20/11 (lỗi hiện thực bắt ở mẫu giữ riêng một): bản cũ coi ô trống «?» = «?» là khớp, nên hai bản chữ cùng thiếu diện tích,
  // mã, phân khu của một môi giới gộp thành một tin. Thiết kế: bản chữ thiếu trường chỉ nhập vào tin ĐẦY ĐỦ qua luật bên dưới.
  const gt = (v) => (v == null ? "?" : Array.isArray(v) ? v.join(",") : String(v));
  const du = (f) => TRUONG.every((k) => f[k] != null);
  const tin = new Map();
  let soRieng = 0;
  for (const b of banChu.values()) {
    const k2 = du(b.f) ? [b.nguoi, gt(b.f.loai), gt(b.f.gia), gt(b.f.pn), gt(b.f.dt), gt(b.f.pk), gt(b.f.ma)].join("|") : `thieu:${soRieng++}`;
    let t = tin.get(k2);
    if (!t) { t = { k2, nguoi: b.nguoi, f: b.f, ban: [], vao: null }; tin.set(k2, t); }
    t.ban.push(b);
  }
  // ---- Gom bản chữ cùng thiếu đúng các trường (Hỏi-6 lối B) ----
  const tgBan = (t) => t.ban.flatMap((b) => b.items.map((it) => thoiDiem(it.post)));
  const ganNhau = (a, b) => { const A = tgBan(a), B = tgBan(b); return A.some((x) => B.some((y) => Math.abs(x - y) <= cuaSoNgay * NGAY)); };
  const giongCap = (a, b) => Math.max(...a.ban.flatMap((x) => b.ban.map((y) => doGiong(x.chu, y.chu))));
  {
    const mau = (t) => [t.nguoi, gt(t.f.loai), gt(t.f.gia), ...TRUONG.map((k) => gt(t.f[k]))].join("|");
    const theoMau = new Map();
    for (const t of tin.values()) if (!du(t.f) && !t.nguoi.startsWith("bai:")) theoMau.set(mau(t), [...(theoMau.get(mau(t)) ?? []), t]);
    for (const nhom of theoMau.values()) {
      if (nhom.length < 2) continue;
      const cha = new Map(nhom.map((t) => [t, t]));
      const goc = (x) => { while (cha.get(x) !== x) x = cha.get(x); return x; };
      for (let i = 0; i < nhom.length; i++) for (let j = i + 1; j < nhom.length; j++) {
        if (ganNhau(nhom[i], nhom[j]) && giongCap(nhom[i], nhom[j]) >= nguongChu) cha.set(goc(nhom[j]), goc(nhom[i]));
      }
      for (const t of nhom) { const g = goc(t); if (g !== t) { g.ban.push(...t.ban); tin.delete(t.k2); } }
    }
  }
  // ---- Nhập bản chữ thiếu trường vào đúng một tin đầy đủ ----
  const ds = [...tin.values()];
  const soCo = (f) => TRUONG.filter((k) => f[k] != null).length;
  const khop = (thieu, du) => {
    if (thieu.nguoi !== du.nguoi || thieu.f.loai !== du.f.loai || thieu.f.gia !== du.f.gia) return false;
    if (soCo(du.f) !== TRUONG.length) return false; // chỉ nhập vào tin đầy đủ
    for (const k of TRUONG) {
      if (thieu.f[k] == null) continue;
      if (du.f[k] == null || gt(du.f[k]) !== gt(thieu.f[k])) return false;
    }
    return true;
  };
  const theoNguoi = new Map();
  for (const t of ds) theoNguoi.set(t.nguoi, [...(theoNguoi.get(t.nguoi) ?? []), t]);
  for (const t of ds) {
    if (soCo(t.f) === TRUONG.length || t.nguoi.startsWith("bai:")) continue;
    const ung = (theoNguoi.get(t.nguoi) ?? []).filter((u) => u !== t && khop(t, u) && ganNhau(t, u) && giongCap(t, u) >= nguongChu);
    if (ung.length === 1) t.vao = ung[0];
  }
  // Tin đích không tự nhập tiếp (không bắc cầu): đích của một tin thiếu là tin chưa nhập vào đâu; đích đã nhập thì tin thiếu đứng riêng.
  const ra = [];
  const gop = new Map(); // tin đích → tin kết quả
  for (const t of ds) if (!t.vao || t.vao.vao) gop.set(t, { items: t.ban.flatMap((b) => b.items), banChu: t.ban.length });
  for (const t of ds) {
    if (!t.vao || t.vao.vao) continue;
    const dich = gop.get(t.vao);
    dich.items.push(...t.ban.flatMap((b) => b.items));
    dich.banChu += t.ban.length;
  }
  ra.push(...gop.values(), ...rieng);
  for (const t of ra) t.items.sort(sapBai);
  return ra.sort((a, b) => sapBai(a.items[0], b.items[0]));
}
