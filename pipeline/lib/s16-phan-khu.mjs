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
 * Kế hoạch nối nút do luật S16 đúc về nút đã có. Hàm thuần.
 * @param {{id:number, du_an_node_id:number, name:string, khoa:string[]}[]} nutLuat  nút chưa nghỉ do luật S16 đúc
 * @param {Map<string, {tong_toa:number, co_s09:number, nut:number[]}>} bangChung  theo khoá khu
 * @param {{id:number, du_an_node_id:number, name:string}[]} nutKhac  nút chưa nghỉ còn lại của các dự án
 */
export function keHoachNoi(nutLuat, bangChung, nutKhac) {
  const cap = [], khongNoi = [];
  const daLiet = new Set();
  const moiNut = [...nutLuat, ...nutKhac];
  const soKhuCuaNut = demBanGhiTheoNut(bangChung.values());
  for (const n of [...nutLuat].sort((a, b) => a.id - b.id)) {
    const ds = n.khoa.map((k) => bangChung.get(k)).filter(Boolean);
    const bc = { tong_toa: ds.reduce((t, x) => t + x.tong_toa, 0), co_s09: ds.reduce((t, x) => t + x.co_s09, 0), nut: ds.flatMap((x) => x.nut) };
    const xet = xetKhopTron(banGhiKhop(bc), soKhuCuaNut);
    if (xet?.ket === "khop") {
      cap.push({ moi_id: n.id, cu_id: xet.node_id, khoa: [...n.khoa].sort(), co_s09: bc.co_s09, tong_toa: bc.tong_toa });
      continue;
    }
    if (xet) { khongNoi.push({ moi_id: n.id, ly_do: xet.ly_do, voi_id: xet.nut.length === 1 ? xet.nut[0] : null }); continue; }
    const gan = moiNut.find((x) => x.id !== n.id && x.du_an_node_id === n.du_an_node_id && tenGan(x.name) === tenGan(n.name));
    if (!gan || daLiet.has(`${gan.id}:${n.id}`)) continue;
    daLiet.add(`${n.id}:${gan.id}`);
    khongNoi.push({ moi_id: n.id, ly_do: bc.tong_toa === 0 ? "khong-toa" : "gan-ten", voi_id: gan.id });
  }
  const bam = createHash("sha256").update(JSON.stringify({ cap, khongNoi })).digest("hex");
  return { cap, khong_noi: khongNoi, bam };
}

const LY_DO_KHONG_NOI = { "re-hai-nut": "toà rẽ từ hai nút trở lên, cần người chọn", "nhieu-ban-ghi": "nút này nhận toà từ nhiều khu", "it-chung": `chưa đủ ${SAN_PHAN_TU_CHUNG} toà chung`, "duoi-san": "dưới một nửa số toà có S09", "khong-toa": "chưa có toà làm bằng chứng", "gan-ten": "chỉ gần tên, không có bằng chứng toà" };

/** Thẻ nối dạng markdown: từng cặp, số toà làm bằng chứng, ca không nối. KHÔNG in khu_id hay toa_id. */
export function dungTheNoi({ cap, khong_noi: khongNoi, bam }, tenNut = new Map()) {
  const ten = (id) => `${id} ${tenNut.get(id) ?? ""}`.trim();
  const d = ["# Thẻ nối phân khu S16", "", "| Nút mới | Nút giữ lại | Toà có S09 / tổng toà |", "|---|---|---|"];
  for (const c of cap) d.push(`| ${ten(c.moi_id)} | ${ten(c.cu_id)} | ${c.co_s09}/${c.tong_toa} |`);
  d.push("", "## Không nối", "", "| Nút | Gần với | Vì sao |", "|---|---|---|");
  for (const k of khongNoi) d.push(`| ${ten(k.moi_id)} | ${k.voi_id == null ? "-" : ten(k.voi_id)} | ${LY_DO_KHONG_NOI[k.ly_do]} |`);
  d.push("", `Tổng: ${cap.length} cặp nối · ${khongNoi.length} ca không nối`, "", `băm: ${bam}`);
  return d.join("\n") + "\n";
}
