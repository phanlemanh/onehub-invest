// khop-tron.mjs — luật khớp trọn 1–1 dùng chung cho mọi nguồn danh mục (ROADMAP §3 mục 56). Hàm thuần, không DB, không gắn nguồn.
// Một bản ghi nguồn (khu, phân khu, toà…) có một tập phần tử con (toà, căn…). Bên gọi đếm xem bao nhiêu phần tử con đã có bằng chứng
// trỏ về nút danh bạ nào, rồi đưa số đếm vào đây. Máy chỉ tự nhận bản ghi là nút đó khi khớp trọn 1–1; ca khác là cảnh báo cho người.

/** Số phần tử con chung tối thiểu để máy tự nhận một bản ghi là nút đã có. */
export const SAN_PHAN_TU_CHUNG = 3;

/**
 * Số bản ghi có bằng chứng trỏ về mỗi nút. Một nút nhận từ hai bản ghi thì nguồn chia nhỏ hơn danh bạ, không phải cùng một nơi.
 * @param {Iterable<{nut:number[]}>} dsBangChung
 * @returns {Map<number, number>}
 */
export function demBanGhiTheoNut(dsBangChung) {
  const dem = new Map();
  for (const bc of dsBangChung) for (const id of new Set(bc.nut)) dem.set(id, (dem.get(id) ?? 0) + 1);
  return dem;
}

/**
 * Xét bằng chứng của một bản ghi.
 * @param {{tong:number, co_bang_chung:number, nut:number[]}|null|undefined} bc
 *   tong: số phần tử con của bản ghi · co_bang_chung: số phần tử con có bằng chứng · nut: nút mà các bằng chứng trỏ về
 * @param {Map<number, number>} [soBanGhiCuaNut]  kết quả demBanGhiTheoNut trên mọi bản ghi đang xét
 * @returns {{ket:'khop', node_id:number}
 *   |{ket:'canh-bao', ly_do:'re-hai-nut'|'nhieu-ban-ghi'|'it-chung'|'duoi-san', nut:number[], co_bang_chung:number, tong:number}
 *   |null}  null: không có bằng chứng nào
 */
export function xetKhopTron(bc, soBanGhiCuaNut = new Map()) {
  const nut = [...new Set(bc?.nut ?? [])].sort((a, b) => a - b);
  if (nut.length === 0) return null;
  const canhBao = (ly_do) => ({ ket: "canh-bao", ly_do, nut, co_bang_chung: bc.co_bang_chung, tong: bc.tong });
  if (nut.length > 1) return canhBao("re-hai-nut");
  if ((soBanGhiCuaNut.get(nut[0]) ?? 1) > 1) return canhBao("nhieu-ban-ghi");
  if (bc.co_bang_chung < SAN_PHAN_TU_CHUNG) return canhBao("it-chung");
  if (bc.co_bang_chung * 2 < bc.tong) return canhBao("duoi-san");
  return { ket: "khop", node_id: nut[0] };
}

/**
 * Phép đo «0 nút trùng nơi sau áp»: bản ghi đang nằm ở một nút mà bằng chứng khớp trọn trỏ về nút khác.
 * @param {{node_id:number, tong:number, co_bang_chung:number, nut:number[]}[]} dsBanGhi  node_id: nút bản ghi đang nằm
 * @returns {{node_id:number, trung_voi:number, co_bang_chung:number, tong:number}[]}
 */
export function timNutTrungNoi(dsBanGhi) {
  const soBanGhi = demBanGhiTheoNut(dsBanGhi);
  return dsBanGhi.flatMap((b) => {
    const xet = xetKhopTron(b, soBanGhi);
    return xet?.ket === "khop" && xet.node_id !== b.node_id
      ? [{ node_id: b.node_id, trung_voi: xet.node_id, co_bang_chung: b.co_bang_chung, tong: b.tong }] : [];
  });
}
