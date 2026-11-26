// Phán xét lượt khô E5 (HT26 AC-5): mọi quan hệ AC-5 thành mã thoát, không còn đối chiếu bằng tay. Thuần — đầu vào là chữ in của
// các lệnh (chỉ số, không giá trị) và số đo; bộ chạy ở `_acceptance/sync-cloud-che-ten-nguon-moi-cot/probes/kiem-kho.mjs`.

/** Trần thời gian của AC-5: pha đọc + che + soát mã mới ≤ 1,5 lần mã cũ, và phần thêm ≤ 2 phút (sửa 25/11 theo lời Mạnh). */
export const TRAN_TI_SO = 1.5;
export const TRAN_THEM_GIAY = 120;

/** Đọc chữ in của `sync-cloud.mjs --kho`. */
export function docKho(text) {
  const che = new Map();
  let tho = null;
  let pha = null;
  let xong = false;
  let fail = null;
  for (const l of text.split("\n")) {
    let m;
    if ((m = l.match(/^ {2}che (\S+): (\d+)$/))) che.set(m[1], Number(m[2]));
    else if ((m = l.match(/^kho đếm thô độc lập trên payload đã che: (\d+)$/))) tho = Number(m[1]);
    else if ((m = l.match(/^kho xong: .*?; (.*?); pha đọc\+che\+soát/))) {
      xong = true;
      pha = {};
      for (const [, k, v] of m[1].matchAll(/([\w-]+) ([\d.]+)s/g)) pha[k] = Number(v);
    } else if ((m = l.match(/^KHO FAIL \[([^\]]*)\]/))) fail = m[1];
  }
  return { che, tho, pha, xong, fail };
}

/** Đọc chữ in của `do-ten-nguon-cloud.mjs --chi-may-thu`: bảng.cột → { o, tho }, kèm dòng tổng. */
export function docChiMayThu(text) {
  const o = new Map();
  let tong = null;
  for (const l of text.split("\n")) {
    const m = l.match(/^(\S+) · (\d+) · (\d+)$/);
    if (!m) continue;
    if (m[1] === "tổng") tong = { o: Number(m[2]), tho: Number(m[3]) };
    else o.set(m[1], { o: Number(m[2]), tho: Number(m[3]) });
  }
  return { o, tong };
}

/** Một đầu socket (dạng lsof «a:p» hay «[::1]:p») là vòng lặp máy này? */
export const laLoopback = (ep) => /^(127\.\d+\.\d+\.\d+|\[::1\]|::1|localhost)(:|$)/.test(ep.trim());

/** Socket (chuỗi tên của lsof, «nguồn->đích» hoặc một đầu) có đầu nào ngoài vòng lặp. */
export const socketNgoai = (sockets) => [...sockets].filter((s) => s.split("->").some((ep) => !laLoopback(ep.replace(/ \(.*\)$/, ""))));

/**
 * Mọi điều kiện AC-5; trả danh sách lý do đỏ (rỗng = xanh). Đầu vào:
 * - `kho` { exit, text, sockets } của lượt khô mã mới; `chiMayThu` { exit, text, sockets } của lệnh đo phía máy thu;
 * - `khongKho` { exit, text, sockets } của cùng lệnh sync KHÔNG `--kho` với cùng môi trường cổng chết (chiều đỏ của đường cloud);
 * - `cu` { pha, dung } pha đọc + soát của mã cũ (giây; `dung` = pha mã cũ dừng: «scan» thì là cận dưới);
 * - `cayDo` { exit, text } lượt khô thật trên vài bảng khi bỏ bước che (ô bẩn thật) — phải đỏ.
 */
export function phanXet({ kho, chiMayThu, khongKho, cu, cayDo }) {
  const ly = [];
  const k = docKho(kho.text);
  if (kho.exit !== 0 || !k.xong || k.fail) ly.push(`lượt khô thoát ${kho.exit}${k.fail ? ` (KHO FAIL [${k.fail}])` : ""}${k.xong ? "" : ", thiếu dòng «kho xong»"} — bộ chặn chưa qua`);
  if (k.tho !== 0) ly.push(`đếm thô độc lập trên payload đã che = ${k.tho ?? "không in"} (phải 0)`);

  const c = docChiMayThu(chiMayThu.text);
  if (chiMayThu.exit !== 0) ly.push(`do-ten-nguon-cloud --chi-may-thu thoát ${chiMayThu.exit}`);
  if (!c.tong) ly.push("do-ten-nguon-cloud --chi-may-thu không in dòng tổng");
  for (const key of new Set([...k.che.keys(), ...c.o.keys()])) {
    const a = k.che.get(key) ?? 0;
    const b = c.o.get(key)?.o ?? 0;
    if (a !== b) ly.push(`số ô che ${key}: lượt khô ${a} ≠ máy thu ${b}`);
  }
  const tongChe = [...k.che.values()].reduce((s, n) => s + n, 0);
  if (c.tong && c.tong.o !== tongChe) ly.push(`tổng ô che ${tongChe} ≠ tổng máy thu ${c.tong.o}`);

  for (const [ten, r] of [["lượt khô", kho], ["--chi-may-thu", chiMayThu], ["không --kho", khongKho]]) {
    const ngoai = socketNgoai(r.sockets);
    if (ngoai.length) ly.push(`${ten}: socket ra ngoài máy: ${ngoai.join(", ")}`);
  }
  if (![...kho.sockets].length) ly.push("lượt khô: lsof không thấy socket nào (kể cả DB máy thu) — thước socket mù");

  if (khongKho.exit === 0) ly.push("không --kho với cổng chết vẫn thoát 0 — đường cloud không bị chặn");
  if (!/SYNC FAIL \[catalog\]/.test(khongKho.text)) ly.push("không --kho: không dừng ở pha catalog (SYNC FAIL [catalog])");
  if (/^sync xong|INSERT INTO sync_stage/m.test(khongKho.text)) ly.push("không --kho: lượt đi qua pha catalog");

  const p = k.pha ?? {};
  const moi = (p.read ?? NaN) + (p.che ?? NaN) + (p.scan ?? NaN);
  if (!Number.isFinite(moi)) ly.push("lượt khô không in đủ thời gian read, che, scan");
  if (!Number.isFinite(cu?.pha) || cu.pha <= 0) ly.push("mã cũ không đo được pha đọc + soát");
  if (Number.isFinite(moi) && Number.isFinite(cu?.pha) && cu.pha > 0) {
    if (moi > TRAN_TI_SO * cu.pha) ly.push(`pha mã mới ${moi.toFixed(1)}s > ${TRAN_TI_SO} × mã cũ ${cu.pha.toFixed(1)}s`);
    if (moi - cu.pha > TRAN_THEM_GIAY) ly.push(`phần mã mới thêm ${(moi - cu.pha).toFixed(1)}s > ${TRAN_THEM_GIAY}s`);
  }

  if (cayDo.exit === 0) ly.push("lượt khô cấy ô bẩn (bỏ che) vẫn thoát 0 — bộ chặn không bắt");
  return ly;
}

/** Chiều đỏ của chính thước: mỗi đột biến của một lượt xanh phải ra ít nhất một lý do. Trả tên đột biến KHÔNG làm đỏ. */
export function dotBienKhongDo(vao) {
  const sua = (fn) => {
    const v = structuredClone(vao);
    fn(v);
    return phanXet(v).length > 0;
  };
  const doiDong = (text, re, thay) => text.replace(re, thay);
  const DB = {
    "ô bẩn còn sau che (đếm thô 1)": (v) => (v.kho.text = doiDong(v.kho.text, /(đã che: )\d+/, "$11")),
    "số che lệch máy thu 1 ô": (v) => (v.kho.text = doiDong(v.kho.text, /^( {2}che \S+: )(\d+)$/m, (_, a, n) => a + (Number(n) + 1))),
    "lượt khô thoát 1": (v) => (v.kho.exit = 1),
    "lượt vượt trần tỉ số": (v) => (v.cu.pha = pha(v) / (TRAN_TI_SO + 0.1)),
    "lượt vượt trần 2 phút": (v) => (v.cu.pha = pha(v) - TRAN_THEM_GIAY - 1),
    "socket tới máy ngoài": (v) => v.kho.sockets.push("192.0.2.10:52000->203.0.113.5:443"),
    "không --kho thoát 0": (v) => (v.khongKho.exit = 0),
    "cấy ô bẩn thoát 0": (v) => (v.cayDo.exit = 0),
  };
  return Object.entries(DB).filter(([, fn]) => !sua(fn)).map(([ten]) => ten);
}

function pha(v) {
  const p = docKho(v.kho.text).pha ?? {};
  return (p.read ?? 0) + (p.che ?? 0) + (p.scan ?? 0);
}
