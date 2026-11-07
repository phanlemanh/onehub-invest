// luat-dung.mjs — 0711-11: luật dừng theo TỪNG CĂN của S01 (export để test
// import CHÍNH module — không còn bản sao trong test). Ba luật:
//   5 căn LIỀN FAIL · 3 căn LIỀN mất giá (price=—) · nhịp < 8s/căn (10 căn đầu).
// Cách dùng: const bd = taoBoDem(); mỗi dòng log collector → bd.can(dong);
// bd.vungDung !== null → dừng; bd.nhipTrungBinh() cho in.
export function taoBoDem() {
  let lienFail = 0;
  let lienMatGia = 0;
  let mocTruoc = null;
  let canDem = 0;
  let tongGiay = 0;
  const state = { vungDung: null };
  function can(dong) {
    if (state.vungDung) return state;
    if (/FAIL/.test(dong)) { lienFail++; lienMatGia = 0; }
    else if (/price=—/.test(dong)) { lienMatGia++; lienFail = 0; }
    else if (/^\s*\[\d+\/\d+\]/.test(dong)) { lienFail = 0; lienMatGia = 0; }
    // nhịp chỉ đo trên dòng có số thứ tự căn [i/n] (bỏ dòng log khác)
    if (/^\s*\[\d+\/\d+\]/.test(dong)) {
      const t = Date.now();
      if (mocTruoc !== null) {
        const giay = (t - mocTruoc) / 1000;
        tongGiay += giay;
      }
      mocTruoc = t;
      canDem++;
      if (canDem === 10) {
        const tb = tongGiay / 9;
        state.nhip10 = +(tb.toFixed(1));
        if (tb < 8) state.vungDung = "nhip-duoi-8s";
      }
    }
    if (lienFail >= 5) state.vungDung = "5-lien-FAIL";
    else if (lienMatGia >= 3) state.vungDung = "3-lien-mat-gia";
    return state;
  }
  return { can, state };
}
