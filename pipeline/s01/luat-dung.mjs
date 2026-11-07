// luat-dung.mjs — 0711-11 dựng, 0711-29 sửa: luật dừng theo TỪNG CĂN của S01
// (export để test import CHÍNH module — không còn bản sao trong test). Luật:
//   5 căn LIỀN FAIL · tỉ lệ có giá 20 căn đầu < 40% → dừng · nhịp < 12s/căn (10 căn đầu).
// (0711-29(1): BỎ «3 căn LIỀN mất giá» — thay bằng luật tỉ lệ; nhịp sàn nâng
// theo nhịp nghỉ mới 12–20 giây của 0711-29(2).)
// Cách dùng: const bd = taoBoDem(); mỗi dòng log collector → bd.can(dong);
// bd.state.vungDung !== null → dừng; bd.state.nhip10 cho in [nhịp].
export function taoBoDem({ now = Date.now } = {}) {
  let lienFail = 0;
  let mocTruoc = null;
  let canDem = 0;
  let tongGiay = 0;
  let canCoGia = 0; // trong cửa sổ 20 căn đầu
  const state = { vungDung: null };
  function can(dong) {
    if (state.vungDung) return state;
    const laDongCan = /^\s*\[\d+\/\d+\]/.test(dong);
    if (/FAIL/.test(dong)) lienFail++;
    else if (laDongCan) lienFail = 0;
    if (laDongCan) {
      // «có giá» = dòng căn KHÔNG phải FAIL và KHÔNG phải price=—
      if (!/FAIL/.test(dong) && !/price=—/.test(dong)) canCoGia++;
      const t = now();
      if (mocTruoc !== null) {
        const giay = (t - mocTruoc) / 1000;
        tongGiay += giay;
      }
      mocTruoc = t;
      canDem++;
      if (canDem === 10) {
        const tb = tongGiay / 9;
        state.nhip10 = +(tb.toFixed(1));
        if (tb < 12) state.vungDung = "nhip-duoi-12s";
      }
      // 0711-29(1): 20 căn đầu mà < 40% có giá (tức < 8 căn) → nguồn bỏ trả giá
      if (canDem === 20 && canCoGia < 8) {
        state.vungDung = `ti-le-co-gia-${canCoGia}-tren-20-duoi-40phan-tram`;
      }
    }
    if (lienFail >= 5) state.vungDung = "5-lien-FAIL";
    return state;
  }
  return { can, state };
}
