// s16-phan-khu.mjs — DA37: kế hoạch thẻ luật phân khu S16 (Q-C, mô hình danh bạ §1.3a). Hàm thuần, không DB — lệnh
// pipeline/phan-khu-s16.mjs đọc DB rồi gọi. Mỗi khu S16 của dự án đã nối → một nút phân khu: nút đã mang khu này, nút sẵn
// trùng tên chuẩn hoá (một), mơ hồ (≥ hai nút trùng tên — không gán, không đúc), hay đúc mới.
import { createHash } from "node:crypto";
import { chuanHoaTenToa } from "./danh-ba-vat-the.mjs";
import { SAN_PHAN_TU_CHUNG, demBanGhiTheoNut, xetKhopTron } from "./khop-tron.mjs";
import { s16Ref } from "./s16-danh-muc.mjs";

/** Khoá khu S16 ghi vào asset_nodes.meta.s16_khu_ids: BĂM, không mã thô — asset_nodes đi cloud, mã khu S16 lấy bằng đăng nhập
 *  (S4-r1 t1, GS 18/11). View 114 tính cùng băm từ stg_s16_khu (chỉ máy thu). */
export const khoaKhu = (duAn, khuId) => s16Ref("khu", duAn, khuId);

// Bằng chứng S09 của một khu theo khuôn của luật khớp trọn dùng chung.
const banGhiKhop = (bc) => bc && { tong: bc.tong_toa, co_bang_chung: bc.co_s09, nut: bc.nut };

/**
 * @param {{du_an:string, khu_id:string, khu_ten:string|null, so_toa:number, du_an_node_id:number}[]} khuS16
 * @param {{id:number, parent_id:number, du_an_node_id?:number, node_type?:string, name:string, s16_khu_ids?:string[]}[]} nutSan
 *   mọi nút chưa nghỉ trên cây của các dự án đã nối
 * @param {Map<string, {tong_toa:number, co_s09:number, nut:number[]}>} [bangChung]  bằng chứng S09 theo khoá khu
 * @returns {{dong: {du_an:string, khu_id:string, khu_ten:string, so_toa:number, du_an_node_id:number,
 *            nut:'da-co'|'san'|'mo-ho'|'moi', node_id:number|null,
 *            canh_bao?:{ly_do:string, nut:number[], co_s09:number, tong_toa:number}}[], bam:string}}
 */
export function keHoachPhanKhu(khuS16, nutSan, bangChung = new Map()) {
  const soKhuCuaNut = demBanGhiTheoNut(bangChung.values());
  const dong = [...khuS16]
    .sort((a, b) => a.du_an.localeCompare(b.du_an) || a.khu_id.localeCompare(b.khu_id))
    .map((k) => {
      const khoa = khoaKhu(k.du_an, k.khu_id);
      // Khoá khu có thể nằm ở bất kỳ tầng nào của cây dự án (cụm cháu, nút building); so tên vẫn chỉ với phân khu con trực tiếp.
      const cay = nutSan.filter((n) => (n.du_an_node_id ?? n.parent_id) === k.du_an_node_id);
      const con = cay.filter((n) => n.parent_id === k.du_an_node_id && (n.node_type ?? "subzone") === "subzone");
      const daCo = cay.find((n) => (n.s16_khu_ids ?? []).includes(khoa));
      const ten = String(k.khu_ten ?? "").trim();
      const base = { du_an: k.du_an, khu_id: k.khu_id, khu_ten: ten, so_toa: k.so_toa, du_an_node_id: k.du_an_node_id };
      if (daCo) return { ...base, nut: "da-co", node_id: daCo.id };
      // Khu không có tên công bố: không đúc nút (tên nút đi cloud — không lấy mã khu làm tên), để người xem.
      if (!ten) return { ...base, nut: "mo-ho", node_id: null };
      const xet = xetKhopTron(banGhiKhop(bangChung.get(khoa)), soKhuCuaNut);
      if (xet?.ket === "khop") return { ...base, nut: "san", node_id: xet.node_id };
      if (xet) base.canh_bao = { ly_do: xet.ly_do, nut: xet.nut, co_s09: xet.co_bang_chung, tong_toa: xet.tong };
      const trung = con.filter((n) => chuanHoaTenToa(n.name) === chuanHoaTenToa(base.khu_ten));
      if (trung.length === 1) return { ...base, nut: "san", node_id: trung[0].id };
      if (trung.length > 1) return { ...base, nut: "mo-ho", node_id: null };
      return { ...base, nut: "moi", node_id: null };
    });
  return { dong, bam: bamKeHoach(dong) };
}

/** Băm kế hoạch: mọi trường quyết định (khoá khu, nút, số toà). Một dòng đổi → băm đổi. */
export function bamKeHoach(dong) {
  const rut = dong.map((d) => [d.du_an, d.khu_id, d.khu_ten, d.so_toa, d.nut, d.node_id, ...(d.canh_bao ? [d.canh_bao] : [])]);
  return createHash("sha256").update(JSON.stringify(rut)).digest("hex");
}

const LY_DO_CANH_BAO = {
  "re-hai-nut": "toà rẽ từ hai phân khu trở lên",
  "nhieu-ban-ghi": "phân khu này nhận toà từ nhiều khu",
  "it-chung": `chưa đủ ${SAN_PHAN_TU_CHUNG} toà chung`,
  "duoi-san": "dưới một nửa số toà có S09",
};

const NHAN = { "da-co": "đã gán", san: "nút sẵn", "mo-ho": "mơ hồ — không gán", moi: "nút mới" };

/** Thẻ luật dạng markdown: theo dự án, tên khu (công khai — ROADMAP §3 mục 38), nút, số toà. KHÔNG in khu_id hay toa_id. */
export function dungThe(dong, bam, tenNut = new Map(), tenDuAn = new Map()) {
  const dong2 = ["# Thẻ luật phân khu S16", "", "| Dự án | Khu | Nút | Số toà |", "|---|---|---|---|"];
  for (const d of dong) {
    const nut = d.node_id != null ? `${NHAN[d.nut]} «${tenNut.get(d.node_id) ?? d.node_id}»` : NHAN[d.nut];
    dong2.push(`| ${tenDuAn.get(d.du_an_node_id) ?? d.du_an_node_id} | ${d.khu_ten} | ${nut} | ${d.so_toa} |`);
  }
  const canhBao = dong.filter((d) => d.canh_bao);
  if (canhBao.length) {
    dong2.push("", "## Cảnh báo: khu có toà trùng phân khu đã có", "", "| Dự án | Khu | Phân khu đã có | Toà có S09 / tổng toà | Vì sao máy chưa tự nhận |", "|---|---|---|---|---|");
    for (const d of canhBao) {
      const c = d.canh_bao;
      dong2.push(`| ${tenDuAn.get(d.du_an_node_id) ?? d.du_an_node_id} | ${d.khu_ten} | ${c.nut.map((id) => tenNut.get(id) ?? id).join(", ")} | ${c.co_s09}/${c.tong_toa} | ${LY_DO_CANH_BAO[c.ly_do]} |`);
    }
  }
  const dem = (k) => dong.filter((d) => d.nut === k).length;
  dong2.push("", `Tổng: ${dong.length} khu · nút mới ${dem("moi")} · nút sẵn ${dem("san")} · đã gán ${dem("da-co")} · mơ hồ ${dem("mo-ho")}`, "", `băm: ${bam}`);
  return dong2.join("\n") + "\n";
}

// Tên để nhận ra hai nút gần trùng: bỏ dấu, tiền tố «the», ký tự ngoài chữ số. Chỉ để liệt ca cho người xem, không tự nối.
const tenGan = (t) => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase()
  .replace(/^the\s+/, "").replace(/[^a-z0-9]/g, "");

/**
 * Mã căn `ma` có «mang tiền tố» một toà trong `toa` không: bắt đầu bằng tên toà và ngay sau là dấu chấm, hoặc tên toà có dấu chấm
 * và ngay sau là chữ số (toà «S1» không nhận «S10.01»; toà «S1.01» nhận «S1.0105»). DA53 AC-1.
 */
export function mangTienTo(ma, toa, { ranhGioi = true } = {}) {
  for (const t of toa) {
    if (!t || !ma.startsWith(t)) continue;
    if (!ranhGioi) return true;
    const r = ma.slice(t.length);
    if (r.startsWith(".") || (t.includes(".") && /^[0-9]/.test(r))) return true;
  }
  return false;
}

/**
 * Bằng chứng mã căn S16 của một nút luật (DA53). Hàm thuần; mã căn chỉ nằm trong bộ nhớ, kết quả chỉ mang số đếm.
 * @param {Set<string>} ma  mã căn của mọi khu nút luật mang
 * @param {{id:number, ma:Set<string>, toa:Set<string>}[]} ungVien  nút cùng dự án, không do luật đúc, chưa nghỉ, có mã căn
 * @param {{san?:number, duTienTo?:boolean, motUngVien?:boolean, ranhGioi?:boolean}} [tuy]  tham số chỉ để đối chứng đỏ của test
 * @returns {null|{ket:'khop'|'can-nguoi'|'duoi-nguong', nut:number[], ly_do?:string, trung:number, tien_to:number, tong:number}}
 *   null: không ứng viên nào có mã trùng hay mang tiền tố
 */
export function xetMaCan(ma, ungVien, { san = SAN_PHAN_TU_CHUNG, duTienTo = true, motUngVien = true, ranhGioi = true } = {}) {
  const tong = ma.size;
  if (!tong) return null;
  const dem = ungVien.map((u) => {
    let trung = 0, tienTo = 0;
    for (const m of ma) { if (u.ma.has(m)) trung++; if (mangTienTo(m, u.toa, { ranhGioi })) tienTo++; }
    return { id: u.id, trung, tien_to: tienTo };
  }).filter((d) => d.trung || d.tien_to).sort((a, b) => b.tien_to - a.tien_to || b.trung - a.trung || a.id - b.id);
  if (!dem.length) return null;
  const du = duTienTo ? dem.filter((d) => d.tien_to === tong) : dem;
  const kq = (ket, ds, ly_do) => ({ ket, nut: ds.map((d) => d.id).sort((a, b) => a - b), ...(ly_do ? { ly_do } : {}),
    trung: ds[0].trung, tien_to: ds[0].tien_to, tong });
  if (!du.length) return kq("duoi-nguong", [dem[0]], "duoi-nguong-ma-can");
  if (du.length > 1 && motUngVien) return kq("can-nguoi", du, "nhieu-ung-vien");
  if (du[0].trung < san) return kq("can-nguoi", [du[0]], "it-trung");
  return kq("khop", [du[0]]);
}

/**
 * Kế hoạch nối nút do luật S16 đúc về nút đã có. Hàm thuần. Bằng chứng S09 xét trước (luật DA46); khớp thì mã căn không đổi
 * được kết quả. Không khớp thì xét mã căn S16 (DA53): khớp → nối, căn cứ `ma-can-s16`; đủ tiền tố mà ít trùng hay nhiều ứng
 * viên → `can_nguoi`, không nối.
 * @param {{id:number, du_an_node_id:number, name:string, khoa:string[]}[]} nutLuat  nút chưa nghỉ do luật S16 đúc
 * @param {Map<string, {tong_toa:number, co_s09:number, nut:number[]}>} bangChung  theo khoá khu
 * @param {{id:number, du_an_node_id:number, name:string, node_type?:string, khoa?:string[]}[]} nutKhac  nút chưa nghỉ còn lại
 *   của các dự án; chỉ nút phân khu (subzone) mang khoá khu làm ứng viên mã căn
 * @param {Map<string, {ma:Set<string>, toa:Set<string>}>} [maCan]  mã căn và tên toà theo khoá khu
 * @param {{xetMa?:Function, s09Truoc?:boolean}} [tuy]  chỉ để đối chứng đỏ của test
 */
export function keHoachNoi(nutLuat, bangChung, nutKhac, maCan = new Map(), { xetMa = xetMaCan, s09Truoc = true } = {}) {
  const cap = [], khongNoi = [], canNguoi = [];
  const daLiet = new Set();
  const moiNut = [...nutLuat, ...nutKhac];
  const soKhuCuaNut = demBanGhiTheoNut(bangChung.values());
  const gom = (khoa) => {
    const ma = new Set(), toa = new Set();
    for (const k of khoa ?? []) { const x = maCan.get(k); if (x) { x.ma.forEach((m) => ma.add(m)); x.toa.forEach((t) => toa.add(t)); } }
    return { ma, toa };
  };
  const ungVienCua = (n) => nutKhac.filter((x) => x.du_an_node_id === n.du_an_node_id && x.khoa?.length && (x.node_type ?? "subzone") === "subzone")
    .map((x) => ({ id: x.id, ...gom(x.khoa) })).filter((x) => x.ma.size);
  for (const n of [...nutLuat].sort((a, b) => a.id - b.id)) {
    const ds = n.khoa.map((k) => bangChung.get(k)).filter(Boolean);
    const bc = { tong_toa: ds.reduce((t, x) => t + x.tong_toa, 0), co_s09: ds.reduce((t, x) => t + x.co_s09, 0), nut: ds.flatMap((x) => x.nut) };
    const xet = xetKhopTron(banGhiKhop(bc), soKhuCuaNut);
    const maXet = maCan.size ? xetMa(gom(n.khoa).ma, ungVienCua(n)) : null;
    const khoa = [...n.khoa].sort();
    const noiMa = () => cap.push({ moi_id: n.id, cu_id: maXet.nut[0], khoa, can_cu: "ma-can-s16", trung: maXet.trung, tien_to: maXet.tien_to, tong: maXet.tong });
    if (!s09Truoc && maXet?.ket === "khop") { noiMa(); continue; }
    if (xet?.ket === "khop") {
      cap.push({ moi_id: n.id, cu_id: xet.node_id, khoa, can_cu: "toa-s09", co_s09: bc.co_s09, tong_toa: bc.tong_toa });
      continue;
    }
    // S09 cảnh báo chỉ về nút khác nút mã căn chọn: hai căn cứ lệch nhau, để người chọn.
    if (maXet?.ket === "khop" && xet && !xet.nut.includes(maXet.nut[0])) {
      canNguoi.push({ moi_id: n.id, nut: [...new Set([...xet.nut, ...maXet.nut])].sort((a, b) => a - b), ly_do: "lech-can-cu", trung: maXet.trung, tien_to: maXet.tien_to, tong: maXet.tong });
      continue;
    }
    if (maXet?.ket === "khop") { noiMa(); continue; }
    if (maXet?.ket === "can-nguoi") {
      canNguoi.push({ moi_id: n.id, nut: maXet.nut, ly_do: maXet.ly_do, trung: maXet.trung, tien_to: maXet.tien_to, tong: maXet.tong });
      continue;
    }
    if (xet) { khongNoi.push({ moi_id: n.id, ly_do: xet.ly_do, voi_id: xet.nut.length === 1 ? xet.nut[0] : null }); continue; }
    if (maXet?.ket === "duoi-nguong") {
      khongNoi.push({ moi_id: n.id, ly_do: maXet.ly_do, voi_id: maXet.nut[0], trung: maXet.trung, tien_to: maXet.tien_to, tong: maXet.tong });
      continue;
    }
    const gan = moiNut.find((x) => x.id !== n.id && x.du_an_node_id === n.du_an_node_id && tenGan(x.name) === tenGan(n.name));
    if (!gan || daLiet.has(`${gan.id}:${n.id}`)) continue;
    daLiet.add(`${n.id}:${gan.id}`);
    khongNoi.push({ moi_id: n.id, ly_do: bc.tong_toa === 0 ? "khong-toa" : "gan-ten", voi_id: gan.id });
  }
  const bam = createHash("sha256").update(JSON.stringify({ cap, khongNoi, canNguoi })).digest("hex");
  return { cap, khong_noi: khongNoi, can_nguoi: canNguoi, bam };
}

const LY_DO_KHONG_NOI = { "re-hai-nut": "toà rẽ từ hai nút trở lên, cần người chọn", "nhieu-ban-ghi": "nút này nhận toà từ nhiều khu", "it-chung": `chưa đủ ${SAN_PHAN_TU_CHUNG} toà chung`, "duoi-san": "dưới một nửa số toà có S09", "khong-toa": "chưa có toà làm bằng chứng", "gan-ten": "chỉ gần tên, không có bằng chứng toà", "duoi-nguong-ma-can": "dưới ngưỡng mã căn: chỉ một phần mã căn mang tiền tố toà của nút kia" };
const LY_DO_CAN_NGUOI = { "it-trung": `mọi mã căn mang tiền tố toà của một nút nhưng dưới ${SAN_PHAN_TU_CHUNG} mã trùng hẳn`, "nhieu-ung-vien": "mã căn khớp từ hai nút trở lên", "lech-can-cu": "toà S09 chỉ về nút khác nút mã căn chọn" };
const CAN_CU = { "toa-s09": "toà S09", "ma-can-s16": "mã căn S16" };
const soMa = (x) => `${x.trung} trùng / ${x.tien_to} tiền tố / ${x.tong}`;

/** Thẻ nối dạng markdown: từng cặp kèm căn cứ và số đếm, ca cần người chọn, ca không nối. KHÔNG in khu_id, toa_id hay mã căn. */
export function dungTheNoi({ cap, khong_noi: khongNoi, can_nguoi: canNguoi = [], bam }, tenNut = new Map()) {
  const ten = (id) => `${id} ${tenNut.get(id) ?? ""}`.trim();
  const d = ["# Thẻ nối phân khu S16", "", "| Nút mới | Nút giữ lại | Căn cứ | Toà có S09 / tổng toà · mã căn trùng / tiền tố / tổng |", "|---|---|---|---|"];
  for (const c of cap) {
    const so = c.can_cu === "ma-can-s16" ? `mã căn ${soMa(c)}` : `${c.co_s09}/${c.tong_toa}`;
    d.push(`| ${ten(c.moi_id)} | ${ten(c.cu_id)} | ${CAN_CU[c.can_cu] ?? c.can_cu} | ${so} |`);
  }
  d.push("", "## Cần người chọn", "", "| Nút | Ứng viên | Mã căn | Vì sao |", "|---|---|---|---|");
  for (const k of canNguoi) d.push(`| ${ten(k.moi_id)} | ${k.nut.map(ten).join(", ")} | ${soMa(k)} | ${LY_DO_CAN_NGUOI[k.ly_do] ?? k.ly_do} |`);
  d.push("", "## Không nối", "", "| Nút | Gần với | Vì sao |", "|---|---|---|");
  for (const k of khongNoi) d.push(`| ${ten(k.moi_id)} | ${k.voi_id == null ? "-" : ten(k.voi_id)} | ${LY_DO_KHONG_NOI[k.ly_do] ?? k.ly_do}${k.tong ? ` (${soMa(k)})` : ""} |`);
  d.push("", `Tổng: ${cap.length} cặp nối · ${canNguoi.length} ca cần người chọn · ${khongNoi.length} ca không nối`, "", `băm: ${bam}`);
  return d.join("\n") + "\n";
}
