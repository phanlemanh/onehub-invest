// gio-may.mjs — ước giờ máy và % hạn mức tuần cho lộ trình (hồ sơ lo-trinh-gio-may, hàng RM6).
// Design: docs/superpowers/specs/2026-10-15-lo-trinh-gio-may-design.md.
//
// Mô-đun THUẦN: không đọc «hôm nay», không gọi git. Bên gọi (scripts/lo-trinh.mjs) đưa vào hàng đã suy trạng thái,
// danh sách vòng đã đo (`docDoVong`) và — chỉ cho lớp ngày — ngày hôm nay. Ba lớp:
//   ước  — `uocHang`, `tongMoc`: tất định, lên trang lộ trình;
//   ngày — `duBao`, `dongMoc`: theo hôm nay, lên `--xem`, đóng băng ở `--mo-o`;
//   đo   — `docDoVong`, `docDuBao`: đọc dòng `gio-may` của sổ chạy và tệp `du-bao.json` của các hồ sơ.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

// Luật ước 15/10 (ô cơ hội đã ký): T2 4–7 · T3 7–10 · gộp 1–1,5 mỗi hàng vòng · cắt bản 1,5–2 mỗi lần phát hành.
export const BANG_LUAT = { T2: [4, 7], T3: [7, 10], gop: [1, 1.5], catBan: [1.5, 2] };
// Ngưỡng «đo trước ước sau» (hạt giống 15/10 phần 4b): số đo thay luật khi đủ chừng này vòng đã giao.
export const NGUONG_VONG = 5;
export const NHOM_CAT_BAN = 'phat-hanh';
export const DU_BAO_TEP = 'du-bao.json';

const chuoi = v => (v == null ? '' : String(v).trim());
const so = x => typeof x === 'number' && Number.isFinite(x);
const doc = p => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

// Khoá `gio_may` trên hàng: số giờ dương, hoặc cặp [thấp, cao] với 0 < thấp ≤ cao. Khác → null (cờ khuôn, coi như vắng).
export function kiemGioMay(v) {
  if (so(v) && v > 0) return [v, v];
  if (Array.isArray(v) && v.length === 2 && v.every(x => so(x) && x > 0) && v[0] <= v[1]) return [v[0], v[1]];
  return null;
}

// In số cho người: tối đa một chữ số lẻ, dấu phẩy thập phân. Khoảng dùng gạch ngang «–»; khoảng một điểm in một số.
export const soVN = x => String(Math.round(x * 10) / 10).replace('.', ',');
export const khoangVN = k => (k[0] === k[1] ? soVN(k[0]) : `${soVN(k[0])}–${soVN(k[1])}`);
export const ngayVN = s => chuoi(s).split('-').reverse().slice(0, 2).join('/');
const giua = k => (k[0] + k[1]) / 2;
const cong = (a, b) => [a[0] + b[0], a[1] + b[1]];

// Thứ hạng gần nhất, không nội suy: p của n giá trị đã sắp = phần tử thứ ceil(p·n).
const phanVi = (ds, p) => ds[Math.max(0, Math.ceil(p * ds.length) - 1)];
const trungVi = ds => { const s = [...ds].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

// ── Lớp đo: đọc dòng `gio-may` MỚI NHẤT của mỗi hồ sơ ─────────────────────────────────────────────────────────────
// `laDaGiao(slug)` do bên gọi đưa (ô bản đồ thuộc nhóm đã giao). Dòng hỏng / thiếu khoá thì bỏ dòng, không ném.
export function docDoVong(root, laDaGiao = () => false) {
  const acc = path.join(root, '_acceptance');
  if (!existsSync(acc)) return [];
  const ra = [];
  for (const slug of readdirSync(acc).sort()) {
    const d = path.join(acc, slug);
    try { if (!statSync(d).isDirectory()) continue; } catch { continue; }
    const log = doc(path.join(d, 'run-log.jsonl')); if (log == null) continue;
    let moi = null;
    for (const l of log.split('\n')) {
      if (!l.includes('"gio-may"')) continue;
      try { const o = JSON.parse(l); if (o && o.kind === 'gio-may') moi = o; } catch { /* dòng hỏng — bỏ */ }
    }
    if (!moi) continue;
    const hd = doc(path.join(d, 'contract.md')) || '';
    const hang = (hd.match(/^risk_tier:\s*([A-Za-z0-9]+)/m) || [])[1] || '';
    ra.push({
      slug, hang, daGiao: !!laDaGiao(slug),
      gio_may: so(moi.gio_may) ? moi.gio_may : null, gio_cho: so(moi.gio_cho) ? moi.gio_cho : null,
      phan_tram_tuan: so(moi.phan_tram_tuan) ? moi.phan_tram_tuan : null, nguon: moi.nguon,
    });
  }
  return ra;
}

// Tệp dự báo đóng băng của mọi hồ sơ: { slug, ngay_tinh, hang, moc? }. Tệp hỏng → bỏ.
export function docDuBao(root) {
  const acc = path.join(root, '_acceptance');
  if (!existsSync(acc)) return [];
  const ra = [];
  for (const slug of readdirSync(acc).sort()) {
    const t = doc(path.join(acc, slug, DU_BAO_TEP)); if (t == null) continue;
    try { const o = JSON.parse(t); if (o && typeof o === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(chuoi(o.ngay_tinh))) ra.push({ slug, ...o }); } catch { /* bỏ */ }
  }
  return ra;
}

// ── Lớp ước ───────────────────────────────────────────────────────────────────────────────────────────────────────
const laCatBan = r => chuoi(r.nhom) === NHOM_CAT_BAN;
// Một hàng: { khoang, nguon: khai|luat|do, nhan, phanTram: { gia, k }, laCatBan }.
export function uocHang(r, doVong = []) {
  const catBan = laCatBan(r);
  const khai = r.gio_may !== undefined ? kiemGioMay(r.gio_may) : null;
  const hangR = chuoi(r.hang);
  const xet = hangR || 'T2';
  const giao = doVong.filter(v => v.daGiao);
  const cungHang = giao.filter(v => v.hang === xet);
  const gioCung = cungHang.map(v => v.gio_may).filter(so).sort((a, b) => a - b);
  // %: theo hạng nếu hạng đủ năm vòng, không thì chung; chưa đủ → null kèm số vòng đang có.
  const ptCung = cungHang.map(v => v.phan_tram_tuan).filter(so);
  const ptChung = giao.map(v => v.phan_tram_tuan).filter(so);
  const phanTram = catBan ? { gia: null, k: ptChung.length } : ptCung.length >= NGUONG_VONG ? { gia: trungVi(ptCung), k: ptCung.length }
    : ptChung.length >= NGUONG_VONG ? { gia: trungVi(ptChung), k: ptChung.length } : { gia: null, k: ptChung.length };
  if (khai) return { khoang: khai, nguon: 'khai', nhan: '', phanTram, laCatBan: catBan };
  if (catBan) return { khoang: [...BANG_LUAT.catBan], nguon: 'luat', nhan: 'máy ước', phanTram, laCatBan: true };
  if (gioCung.length >= NGUONG_VONG) {
    return { khoang: [phanVi(gioCung, 0.25), phanVi(gioCung, 0.75)], nguon: 'do', nhan: `theo ${gioCung.length} vòng đo`, phanTram, laCatBan: false };
  }
  const luat = BANG_LUAT[hangR];
  if (luat && (hangR === 'T2' || hangR === 'T3')) return { khoang: [...luat], nguon: 'luat', nhan: 'máy ước', phanTram, laCatBan: false };
  return { khoang: [...BANG_LUAT.T2], nguon: 'luat', nhan: hangR ? 'máy ước, hạng ngoài bảng luật' : 'máy ước, chưa khai hạng', phanTram, laCatBan: false };
}
export const oGioMay = u => `${khoangVN(u.khoang)}${u.nhan ? ` (${u.nhan})` : ''}`;
export const oPhanTram = u => (u.phanTram.gia != null ? `~${soVN(u.phanTram.gia)} %` : `chưa ước (${u.phanTram.k}/${NGUONG_VONG} vòng đo)`);

// Tổng một mốc trên các hàng CHƯA giao gắn mốc: hàng vòng = ước + gộp; hàng cắt bản = phần cắt bản; mốc phát hành
// không có hàng cắt bản thì cộng cắt bản cấp mốc. `conLai(d)` (tuỳ chọn) trả khoảng còn lại của hàng đang dở.
export function tongMoc(m, hangMo, uoc, conLai = null) {
  let k = [0, 0]; let pt = 0; let thieu = 0; let coCatBan = false;
  for (const d of hangMo) {
    const u = uoc(d);
    const kd = conLai ? conLai(d, u) : u.khoang;
    if (u.laCatBan) { coCatBan = true; k = cong(k, kd); continue; }
    k = cong(cong(k, kd), BANG_LUAT.gop);
    if (u.phanTram.gia != null) pt += u.phanTram.gia; else thieu += 1;
  }
  if (chuoi(m.loai) === 'phat-hanh' && !coCatBan && hangMo.length) k = cong(k, BANG_LUAT.catBan);
  return { khoang: k, phanTram: { gia: thieu === hangMo.filter(d => !uoc(d).laCatBan).length && thieu ? null : pt, thieu }, coCatBan };
}
export const chuPhanTramMoc = (t, k) => (t.phanTram.gia == null ? `% hạn mức tuần chưa ước (${k}/${NGUONG_VONG} vòng đo)`
  : `~${soVN(t.phanTram.gia)} % hạn mức tuần${t.phanTram.thieu ? ` (thiếu ${t.phanTram.thieu} hàng)` : ''}`);

// ── Lớp ngày ──────────────────────────────────────────────────────────────────────────────────────────────────────
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const gioTuNgay = s => Date.parse(`${s}T00:00:00Z`) / 3600e3;
const ngayTuGio = h => new Date(h * 3600e3).toISOString().slice(0, 10);
// Giờ chờ mỗi vòng = trung vị giờ chờ ĐO của vòng đã giao; chưa vòng nào → 0 và `do: false`.
export function gioChoVong(doVong) {
  const ds = doVong.filter(v => v.daGiao && so(v.gio_cho)).map(v => v.gio_cho);
  return ds.length ? { gio: trungVi(ds), do: true } : { gio: 0, do: false };
}
// Dự báo mọi mốc còn hàng chưa giao của một lộ trình. `dong`: hàng đã suy trạng thái (`_nhan`, `dung_tren`, `daGiao`,
// `dangDo`, `hoSo`), `moc`: mốc của tệp, `uoc(d)`: ước của hàng, `doCua(slug)`: dòng đo của hồ sơ (để trừ phần đã làm).
// Trả Map<chỉ số mốc, dự báo>. Phụ thuộc vòng → `vong: true`, không treo.
export function duBao({ dong, moc, uoc, doCua = () => null, doVong = [], today }) {
  const cho = gioChoVong(doVong);
  const theoMa = new Map(dong.map(d => [String(d._nhan), d]));
  const mocCua = new Map(); moc.forEach((m, i) => { for (const x of (Array.isArray(m.hang) ? m.hang : []).map(chuoi)) if (!mocCua.has(x)) mocCua.set(x, i); });
  const kq = new Map(); const dang = new Set();
  const conLai = (d, u) => {
    if (!d.dangDo || !d.hoSo) return u.khoang;
    const v = doCua(d.hoSo); const g = v && so(v.gio_may) ? v.gio_may : 0;
    return [Math.max(0, u.khoang[0] - g), Math.max(0, u.khoang[1] - g)];
  };
  const tinh = i => {
    if (kq.has(i)) return kq.get(i);
    if (dang.has(i)) return { vong: true };
    dang.add(i);
    const m = moc[i]; const ma = (Array.isArray(m.hang) ? m.hang : []).map(chuoi);
    const mo = ma.map(x => theoMa.get(x)).filter(d => d && !d.daGiao);
    let batDau = gioTuNgay(today); let vong = false; const phu = new Set();
    for (const d of mo) for (const x of (Array.isArray(d.dung_tren) ? d.dung_tren : []).map(chuoi)) {
      if (ma.includes(x)) continue;
      const dx = theoMa.get(x); if (!dx || dx.daGiao) continue;
      const j = mocCua.get(x); if (j === undefined) continue;
      const t = tinh(j); if (t.vong) { vong = true; continue; }
      phu.add(j);
      if (t.hoanTatGio > batDau) batDau = t.hoanTatGio;
    }
    const tong = tongMoc(m, mo, uoc, conLai);
    const soVong = mo.filter(d => !uoc(d).laCatBan).length;
    const gioCho = cho.gio * soVong;
    const hoanTatGio = batDau + giua(tong.khoang) + gioCho;
    const mucTieu = NGAY.test(chuoi(m.ngay)) ? chuoi(m.ngay) : null;
    const r = {
      vong, mo: mo.length, batDau: ngayTuGio(batDau), hoanTat: ngayTuGio(hoanTatGio), hoanTatGio, khoang: tong.khoang,
      phanTram: tong.phanTram, gioCho, gioChoDo: cho.do, mucTieu, hang: ma, _bd: batDau, _dai: giua(tong.khoang) + gioCho, _phu: [...phu],
    };
    r.quaTai = !!(mucTieu && !vong && r.hoanTat > mucTieu);
    dang.delete(i); kq.set(i, r); return r;
  };
  moc.forEach((m, i) => tinh(i));
  // Một lộ trình là MỘT làn (hồ sơ road-map-de-dung, AC-10; hạt giống 2026-10-17-hat-giong-gio-may-theo-moc-khong-xep-noi-tiep):
  // mốc còn việc sắp theo ngày (mốc không ngày đứng cuối, cùng ngày giữ thứ tự tệp); bắt đầu của mốc k = max(hôm nay, hoàn tất
  // mốc trước trong làn, ràng buộc dung_tren). Máy coi như chạy 24/24 — nhịp ngày chưa đo (nhãn ở dòng mốc).
  // Thứ tự làn theo PHỤ THUỘC trước, ngày sau: mốc chỉ vào làn khi mọi mốc nó đứng trên (`_phu`) đã vào — mốc sớm đứng trên
  // việc của mốc muộn thì mốc muộn chạy trước (lượt chấm 1 của hồ sơ, AC-10). `_phu` của mốc không vòng chỉ chứa mốc không vòng
  // nên đồ thị không có chu trình; vẫn giữ lối thoát: không mốc nào sẵn thì lấy mốc kế theo ngày.
  const coNgay = i => NGAY.test(chuoi(moc[i].ngay));
  const theoNgay = moc.map((m, i) => i).sort((a, b) => (coNgay(a) ? 0 : 1) - (coNgay(b) ? 0 : 1) || chuoi(moc[a].ngay).localeCompare(chuoi(moc[b].ngay)) || a - b);
  const thuTu = []; const daXep = new Set(); const conLaiMoc = [...theoNgay];
  while (conLaiMoc.length) {
    const k = conLaiMoc.findIndex(i => { const r = kq.get(i); return !r || r.vong || r._phu.every(j => daXep.has(j) || !conLaiMoc.includes(j)); });
    const [i] = conLaiMoc.splice(k < 0 ? 0 : k, 1); thuTu.push(i); daXep.add(i);
  }
  let lan = gioTuNgay(today);
  for (const i of thuTu) {
    const r = kq.get(i); if (!r || r.vong || !r.mo) continue;
    let bd = Math.max(r._bd, lan);
    for (const j of r._phu) { const t = kq.get(j); if (t && !t.vong && t.hoanTatGio > bd) bd = t.hoanTatGio; }
    r.hoanTatGio = bd + r._dai; r.batDau = ngayTuGio(bd); r.hoanTat = ngayTuGio(r.hoanTatGio);
    r.quaTai = !!(r.mucTieu && r.hoanTat > r.mucTieu); lan = r.hoanTatGio;
  }
  for (const r of kq.values()) { delete r._bd; delete r._dai; delete r._phu; }
  return kq;
}
// Nhịp ngày của máy chưa đo (vế 2 của hạt giống giờ máy, để vòng sau) — dòng mốc nói ra giả định 24/24 thay vì im.
export const NHAN_24 = ' (máy chạy 24/24 — chưa đo nhịp ngày)';
// Dòng khuôn luật 15/10 cho một mốc (tên ngắn do bên gọi đưa).
export function dongMoc(ten, r, kVong) {
  if (r.vong) return `${ten}: không tính được (phụ thuộc vòng)`;
  const pt = chuPhanTramMoc({ phanTram: r.phanTram }, kVong);
  return `${ten}: bắt đầu ~${ngayVN(r.batDau)} · ~${khoangVN(r.khoang)} giờ máy · ${pt} · hoàn tất dự kiến ${ngayVN(r.hoanTat)}`
    + (r.mucTieu ? ` · mục tiêu ${ngayVN(r.mucTieu)}` : '')
    + (r.quaTai ? ` (quá tải — dự kiến ${ngayVN(r.hoanTat)}, mục tiêu ${ngayVN(r.mucTieu)})` : '')
    + (r.gioChoDo ? '' : ' (chưa có giờ chờ đo)') + NHAN_24;
}
// Tệp đóng băng của một hàng sắp mở: ước của hàng + dự báo của mốc chứa nó (nếu có) tại `today`.
export function duBaoHoSo({ d, u, mocI, r, ten, today }) {
  const o = { ngay_tinh: today, hang: { ma: String(d._nhan), gio_may: u.khoang, phan_tram: u.phanTram.gia } };
  if (mocI != null && r && !r.vong) {
    o.moc = { ten, bat_dau: r.batDau, hoan_tat: r.hoanTat, gio_may: r.khoang, gio_cho: r.gioCho, gio_cho_do: r.gioChoDo, muc_tieu: r.mucTieu, hang: r.hang };
  }
  return o;
}
