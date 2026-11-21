// bao-cao.ts — NB1 cham-bong-bo-sung-tin: bảng báo cáo của một lượt, đọc từ tệp kết quả của lượt (không gọi model, không đọc DB)
// (AC-9). Đếm theo ĐỀ XUẤT: ô × kết cục × nguồn E1/E2, cột riêng «chưa đủ hai kết quả» cho đề xuất của thẻ có lời gọi lỗi hay chưa
// chạy (không cộng vào bo_trong), số ca biên, số o_da_co, số thẻ đủ hai kết quả trên số thẻ chờ còn đề xuất lúc chạy, lời gọi, token, chi phí.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DongKetCuc, TongKet } from "./chay.js";
import { KET_CUC, THU_TU_O, type KetCuc } from "./ket-cuc.js";

export type Cot = KetCuc | "chua_du";
export const COT: readonly Cot[] = [...KET_CUC, "chua_du"];
type TheoNguon = { e1_rule: number; e2_llm: number };
export type BangBaoCao = {
  o: Record<string, Record<Cot, TheoNguon>>; ca_bien: Record<string, number>; lech_tren_the: number; o_da_co: number;
  so_de_xuat: number; tong: TongKet;
};

export function baoCao(thuMucLuot: string): BangBaoCao {
  const tong = JSON.parse(readFileSync(join(thuMucLuot, "tong-ket.json"), "utf8")) as TongKet;
  const tep = join(thuMucLuot, "ket-qua.jsonl");
  const dong = existsSync(tep) ? readFileSync(tep, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  const kc = dong.filter((d): d is DongKetCuc => d.loai === "ket-cuc");
  const o = Object.fromEntries(THU_TU_O.map((f) => [f, Object.fromEntries(COT.map((c) => [c, { e1_rule: 0, e2_llm: 0 }]))])) as BangBaoCao["o"];
  const ca_bien = Object.fromEntries(THU_TU_O.map((f) => [f, 0]));
  let lech = 0, daCo = 0;
  for (const d of kc) {
    const cot: Cot = d.du_hai && d.ket_cuc ? d.ket_cuc : "chua_du";
    o[d.field][cot][d.source as keyof TheoNguon]++;
    if (d.ca_bien) ca_bien[d.field]++;
    if (d.lech_tren_the) lech++;
    if (d.o_da_co) daCo++;
  }
  return { o, ca_bien, lech_tren_the: lech, o_da_co: daCo, so_de_xuat: kc.length, tong };
}

export function inBaoCao(b: BangBaoCao): string {
  const t = b.tong;
  const hang = ["ô | nguồn | " + COT.join(" | ")];
  for (const f of THU_TU_O) {
    for (const n of ["e1_rule", "e2_llm"] as const) {
      const so = COT.map((c) => b.o[f][c][n]);
      if (so.some(Boolean)) hang.push(`${f} | ${n} | ${so.join(" | ")}`);
    }
  }
  return [
    `Lượt ${t.run_id} (${t.che_do}), lời nhắc ${t.prompt_version}, model ${t.models.join(" + ")}`,
    ...hang,
    `Ca biên theo ô: ${THU_TU_O.map((f) => `${f} ${b.ca_bien[f]}`).join(" · ")}`,
    `Đề xuất: ${b.so_de_xuat} · lệch trên thẻ: ${b.lech_tren_the} · ô đã có (observed): ${b.o_da_co}`,
    `Thẻ đủ hai kết quả / thẻ chờ còn đề xuất: ${t.the_du}/${t.so_the}`,
    `Lời gọi mới ${t.goi_moi} (lỗi ${t.loi_goi}), dùng lại ${t.dung_lai} · token vào ${t.vao}, ra ${t.ra} · chi phí ${t.usd.toFixed(4)} USD${t.dung_vi_tran ? " · DỪNG VÌ TRẦN" : ""}`,
    `Bỏ qua: ${t.bo_qua.length} thẻ (${t.bo_qua.map((x) => `${x.review_id}:${x.ly_do}`).join(", ") || "không"})`,
  ].join("\n");
}
