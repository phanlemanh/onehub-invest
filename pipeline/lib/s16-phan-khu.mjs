// s16-phan-khu.mjs — DA37: kế hoạch thẻ luật phân khu S16 (Q-C, mô hình danh bạ §1.3a). Hàm thuần, không DB — lệnh
// pipeline/phan-khu-s16.mjs đọc DB rồi gọi. Mỗi khu S16 của dự án đã nối → một nút phân khu: nút đã mang khu này, nút sẵn
// trùng tên chuẩn hoá (một), mơ hồ (≥ hai nút trùng tên — không gán, không đúc), hay đúc mới.
import { createHash } from "node:crypto";
import { chuanHoaTenToa } from "./danh-ba-vat-the.mjs";

/** Khoá khu S16 ghi vào asset_nodes.meta.s16_khu_ids — cùng khuôn view 111 đọc. */
export const khoaKhu = (duAn, khuId) => `${duAn}/${khuId}`;

/**
 * @param {{du_an:string, khu_id:string, khu_ten:string|null, so_toa:number, du_an_node_id:number}[]} khuS16
 * @param {{id:number, parent_id:number, name:string, s16_khu_ids?:string[]}[]} nutSan  nút subzone dưới các dự án đã nối
 * @returns {{dong: {du_an:string, khu_id:string, khu_ten:string, so_toa:number, du_an_node_id:number,
 *            nut:'da-co'|'san'|'mo-ho'|'moi', node_id:number|null}[], bam:string}}
 */
export function keHoachPhanKhu(khuS16, nutSan) {
  const dong = [...khuS16]
    .sort((a, b) => a.du_an.localeCompare(b.du_an) || a.khu_id.localeCompare(b.khu_id))
    .map((k) => {
      const khoa = khoaKhu(k.du_an, k.khu_id);
      const con = nutSan.filter((n) => n.parent_id === k.du_an_node_id);
      const daCo = con.find((n) => (n.s16_khu_ids ?? []).includes(khoa));
      const base = { du_an: k.du_an, khu_id: k.khu_id, khu_ten: String(k.khu_ten ?? k.khu_id), so_toa: k.so_toa, du_an_node_id: k.du_an_node_id };
      if (daCo) return { ...base, nut: "da-co", node_id: daCo.id };
      const trung = con.filter((n) => chuanHoaTenToa(n.name) === chuanHoaTenToa(base.khu_ten));
      if (trung.length === 1) return { ...base, nut: "san", node_id: trung[0].id };
      if (trung.length > 1) return { ...base, nut: "mo-ho", node_id: null };
      return { ...base, nut: "moi", node_id: null };
    });
  return { dong, bam: bamKeHoach(dong) };
}

/** Băm kế hoạch: mọi trường quyết định (khoá khu, nút, số toà). Một dòng đổi → băm đổi. */
export function bamKeHoach(dong) {
  const rut = dong.map((d) => [d.du_an, d.khu_id, d.khu_ten, d.so_toa, d.nut, d.node_id]);
  return createHash("sha256").update(JSON.stringify(rut)).digest("hex");
}

const NHAN = { "da-co": "đã gán", san: "nút sẵn", "mo-ho": "mơ hồ — không gán", moi: "nút mới" };

/** Thẻ luật dạng markdown: theo dự án, tên khu (công khai — ROADMAP §3 mục 38), nút, số toà. KHÔNG in khu_id hay toa_id. */
export function dungThe(dong, bam, tenNut = new Map(), tenDuAn = new Map()) {
  const dong2 = ["# Thẻ luật phân khu S16", "", "| Dự án | Khu | Nút | Số toà |", "|---|---|---|---|"];
  for (const d of dong) {
    const nut = d.node_id != null ? `${NHAN[d.nut]} «${tenNut.get(d.node_id) ?? d.node_id}»` : NHAN[d.nut];
    dong2.push(`| ${tenDuAn.get(d.du_an_node_id) ?? d.du_an_node_id} | ${d.khu_ten} | ${nut} | ${d.so_toa} |`);
  }
  const dem = (k) => dong.filter((d) => d.nut === k).length;
  dong2.push("", `Tổng: ${dong.length} khu · nút mới ${dem("moi")} · nút sẵn ${dem("san")} · đã gán ${dem("da-co")} · mơ hồ ${dem("mo-ho")}`, "", `băm: ${bam}`);
  return dong2.join("\n") + "\n";
}
