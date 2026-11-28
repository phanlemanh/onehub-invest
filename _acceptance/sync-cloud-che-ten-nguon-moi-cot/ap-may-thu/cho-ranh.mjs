// Chờ job cloud-sync rảnh trước mỗi lời gọi của sao-luu.mjs (hồ sơ áp HT26 mục 3) — có trần chờ, thoát rõ lý do (vòng 2, GS 26/11).
// Hai ca vòng 1 để hở: nhật ký vừa xoay vòng (không còn dòng «sync bắt đầu») thì ném TypeError; lượt cuối chết giữa chừng (không có dòng
// kết thúc) thì chờ mãi. Nay phán theo cả nhật ký lẫn tiến trình sync đang sống.

/** Phán từ chữ nhật ký + có tiến trình sync đang sống hay không. Trả { ranh, lyDo, batDau? }. Thuần. */
export function trangThaiLuot(logText, coTienTrinh) {
  const dong = logText.split("\n").filter((l) => /^sync bắt đầu|^sync xong|SYNC FAIL/.test(l));
  const iBd = dong.findLastIndex((l) => l.startsWith("sync bắt đầu"));
  if (iBd < 0) {
    return coTienTrinh
      ? { ranh: false, lyDo: "nhật ký không còn dòng «sync bắt đầu» (vừa xoay vòng?) nhưng tiến trình sync đang sống" }
      : { ranh: true, lyDo: "nhật ký không còn dòng «sync bắt đầu» và không có tiến trình sync — rảnh" };
  }
  const batDau = Date.parse(dong[iBd].split(" ")[3]);
  if (dong.slice(iBd + 1).some((l) => /^sync xong|SYNC FAIL/.test(l))) return { ranh: true, lyDo: "lượt cuối đã có dòng kết thúc", batDau };
  return coTienTrinh
    ? { ranh: false, lyDo: "lượt sync đang chạy", batDau }
    : { ranh: true, lyDo: "lượt cuối không có dòng kết thúc và không còn tiến trình sync (đã chết giữa chừng) — rảnh", batDau };
}

/**
 * Chờ tới khi rảnh, tối đa `tranPhut` phút (mặc định 40 — lượt prod 20–27′). Quá trần thì ném lỗi có tên, không chờ mãi.
 * `docLog()`, `coTienTrinh()`, `ngu(ms)`, `bayGio()`, `bao(chuoi)` thay được trong test.
 */
export async function choRanh({ docLog, coTienTrinh, ngu, bayGio = Date.now, bao = (s) => console.error(s), tranPhut = 40, nhipMs = 30_000 }) {
  const t0 = bayGio();
  for (;;) {
    let text;
    try {
      text = docLog();
    } catch (e) {
      if (e.code !== "ENOENT") throw new Error(`cho-ranh: không đọc được nhật ký sync: ${e.message}`);
      text = "";
    }
    const tt = trangThaiLuot(text, coTienTrinh());
    if (tt.ranh) return tt;
    const cho = (bayGio() - t0) / 60000;
    if (cho >= tranPhut) throw new Error(`cho-ranh: chờ ${cho.toFixed(1)}′ (trần ${tranPhut}′) mà ${tt.lyDo} — dừng, báo GS, không gọi cloud`);
    const phut = tt.batDau ? ` phút ${((bayGio() - tt.batDau) / 60000).toFixed(1)}` : "";
    bao(`  chờ: ${tt.lyDo}${phut}`);
    await ngu(nhipMs);
  }
}
