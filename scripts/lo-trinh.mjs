#!/usr/bin/env node
// lo-trinh.mjs — ổ cắm ĐỌC tệp ý định của kho (lộ trình) + suy trạng thái từ hồ sơ + vẽ trang.
// Hồ sơ: _acceptance/viec-ke-theo-plan/ · design: docs/superpowers/specs/2026-10-02-viec-ke-theo-plan-design.md
// Vòng sửa trên dữ liệu thật: _acceptance/lo-trinh-tren-du-lieu-that/ · design 2026-10-03-…-design.md —
// so lời khai theo NHÓM, nối hai chiều hàng ↔ hồ sơ (`lo_trinh_ma`), nhiều lộ trình mỗi kho, mở ô
// cơ hội từ hàng (`--mo-o`), dòng thẻ start dựng sẵn.
//
// Hai lớp, không gộp: Ý ĐỊNH do người ghi (tệp JSON trong kho, đổi bằng PR) và TRẠNG THÁI do máy
// suy từ `_acceptance/` bằng ĐÚNG hàm xếp ô của bản đồ sản phẩm (`classify` của product-map.mjs,
// nhận qua tham số — mô-đun này không import bản đồ, nên không có vòng import và kho chưa khai
// ổ cắm không bao giờ nạp nó). Kit KHÔNG BAO GIỜ ghi vào tệp ý định: mọi hàm ở đây chỉ đọc.
//
// Trang tất định: không ngày chạy, không «hôm nay» — `--check` so byte. Ngày chỉ vào `hangTre`,
// thứ chỉ thẻ start in; số ngày còn lại tới mốc do script nội tuyến của trang tính lúc xem.
import { readFileSync, readdirSync, existsSync, statSync, realpathSync, mkdirSync, writeFileSync, appendFileSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { frontmatterField } = require(path.join(__dirname, '..', 'lib', 'evidence-core.cjs'));
// Thư mục không tệp nào không vào «ngoài lộ trình» — cùng hàm với bản đồ (hồ sơ tep-sinh-khong-chan-gop, AC-6).
const { coTepTrongCay } = require(path.join(__dirname, '..', 'lib', 'workspace-record.cjs'));

const { KHOA: KHOA_, khoaTuConfig: khoaTuConfig_, cacTepTuConfig } = require(path.join(__dirname, 'lo-trinh-khoa.cjs'));
// Mô-đun đọc hồ sơ dùng chung với trang hồ sơ (hồ sơ trang-ho-so-mot-viec, hàng X2): dải tóm tắt của
// khối dữ liệu bản 2 và phép bỏ một cặp «» quanh câu giao đều rút từ ĐÂY — trang hồ sơ gọi cùng hàm.
const HS = require(path.join(__dirname, 'ho-so-tom-tat.cjs'));
// Giờ máy và % hạn mức tuần (hồ sơ lo-trinh-gio-may, hàng RM6): mọi phép tính ở mô-đun thuần gio-may.mjs.
import * as GM from './gio-may.mjs';
export const KHOA = KHOA_;
export const TEP_TRANG = 'LO-TRINH.html';
export const CHUA_MO = 'Chưa mở';
export const KHONG_SUY = 'Không suy được';
export const TIN_THEO_LOI = 'tin theo lời';
// Dòng «Hàng kế» của thẻ khởi động khi lộ trình chưa có việc nào — một nguồn cho thẻ và bước khởi tạo lộ trình.
export const CHUA_CO_VIEC = 'Lộ trình chưa có việc nào — thêm việc bằng skill cắt lượt (/acceptance-gate:cat-luot), rồi mở bằng /feature-loop:feature-loop <mã>';
// Ô bản đồ nào là «đã giao» và «chưa làm» — tra bằng KHOÁ ô, chữ rút từ SECTIONS của bản đồ.
export const DA_GIAO_O = ['cho-nghiem-thu', 'da-ship', 'da-nghiem-thu'];
export const DANG_LAM_O = ['cho-duyet', 'dang-dung'];
export const CHUA_LAM_O = ['can-nhac', 'sap-mo'];
// Ô bản đồ của một hồ sơ «đang mở» — đang làm hoặc chưa bắt đầu (hồ sơ moc-la-chien-dich, hai cờ nấc 1 ADR 0025).
export const NHOM_MO = [...DANG_LAM_O, ...CHUA_LAM_O];
// Nhóm của một tên trạng thái: lời khai so với hồ sơ theo NHÓM, không theo từng chữ tên ô (crm OKR
// 03/10: 11/18 cờ là «khai Đã giao, hồ sơ Đã giao — chờ phiên nghiệm thu»). Ô ngoài ba nhóm là
// nhóm riêng của chính nó.
function nhomBang(sections) {
  const TEN = Object.fromEntries(sections);
  const m = new Map([[CHUA_MO, 'chua-lam']]);
  for (const [ds, nh] of [[DA_GIAO_O, 'da-giao'], [DANG_LAM_O, 'dang-lam'], [CHUA_LAM_O, 'chua-lam']]) for (const k of ds) m.set(TEN[k], nh);
  return t => m.get(t) || `rieng:${t}`;
}
const BAT_BUOC = ['ma', 'cau_giao'];
// Luật 17/10 (hồ sơ road-map-de-dung, ADR 0026): việc của người không thành mục nào trên lộ trình — bốn chỗ đến. MỘT nguồn cho
// dòng lỗi của răng cắt lượt (cat-luot.mjs) và cờ của bộ đọc chung.
export const BON_CHO_DEN = [
  'sự kiện của người tạo hạn → ngày của mốc phát triển bị ràng buộc',
  'đo giá trị → ngưỡng và ngày đọc trong ô cơ hội của việc (kết quả ghi bằng lệnh observed)',
  'vận hành thuần → Ra khỏi kho: không chép vào bản phạm vi, liệt dưới «Ra khỏi kho» ở mô tả PR',
  'việc cần kết quả của việc ấy → Chờ điều kiện, kèm mo_lai_khi',
];
export const CAU_BON_CHO = `chuyển về một trong bốn chỗ: ${BON_CHO_DEN.join(' · ')}`;
// Nguồn dữ liệu của hàng (trường lượt cắt `du_lieu`, luật dữ liệu giả của cắt lượt) — một nguồn cho răng và bộ đọc chung.
export const DU_LIEU = ['sinh-gia', 'gia'];
// Luật «chỉ việc phát triển» trên MỌI lần đọc tệp (hồ sơ road-map-de-dung, AC-8): răng cắt lượt chỉ chạy lúc cắt, sửa tay
// tệp lộ trình đi vòng nó (crm #465, #466). Toàn tệp, không theo đợt, chỉ cờ — mỗi cờ tối đa MỘT dòng gom mỗi lộ trình,
// liệt ≤ 8 tên rồi «…». Câu thô mở bằng `cờ <tên>: ` — chữ sau dấu hai chấm là chữ người đọc, trang và bản xem chữ in y nguyên.
export const CO_PHAT_TRIEN = ['moc-ngoai-da-bo', 'moc-chua-khai-loai', 'dung-tren-moc', 'du-lieu-sai-gia-tri', 'thieu-hang-sinh-gia'];
const lietTen = ds => { const u = [...new Set(ds)]; return `${u.slice(0, 8).join(', ')}${u.length > 8 ? ', …' : ''}`; };
const nfcLT = v => chuoi(v).normalize('NFC');
export function luatChiPhatTrien(data) {
  const co = []; if (data == null || typeof data !== 'object') return co;
  const hang = (Array.isArray(data.hang) ? data.hang : []).filter(r => r && typeof r === 'object' && !Array.isArray(r));
  const moc = (Array.isArray(data.moc) ? data.moc : []).filter(m => m && typeof m === 'object' && !Array.isArray(m));
  const theoMa = new Map(); for (const r of hang) { const ma = chuoi(r.ma); if (ma && !theoMa.has(ma)) theoMa.set(ma, r); }
  const ngoai = moc.filter(m => chuoi(m.loai) === 'ngoai').map(tenNganMoc);
  if (ngoai.length) co.push(`cờ moc-ngoai-da-bo: ${new Set(ngoai).size} mốc là việc của người — không còn là mốc (luật 17/10): ${lietTen(ngoai)}; ${CAU_BON_CHO}`);
  const khongLoai = moc.filter(m => !chuoi(m.loai)).map(tenNganMoc);
  if (khongLoai.length) co.push(`cờ moc-chua-khai-loai: ${new Set(khongLoai).size} mốc chưa khai loại: ${lietTen(khongLoai)} — mốc phát triển khai loai (phat-hanh, han, han-cung, su-kien); việc của người không còn là mốc (luật 17/10)`);
  const laMoc = x => moc.find(m => chuoi(m.ma) === x || nfcLT(m.ten) === nfcLT(x));
  const cho = []; for (const r of hang) for (const x of (Array.isArray(r.dung_tren) ? r.dung_tren : []).map(chuoi)) { const m = !theoMa.has(x) && laMoc(x); if (m) cho.push(`${chuoi(r.ma) || '?'} → «${tenNganMoc(m)}»`); }
  if (cho.length) co.push(`cờ dung-tren-moc: ${new Set(cho).size} việc đứng chờ một mốc thay vì một việc: ${lietTen(cho)} — «cần xong trước» chỉ trỏ việc; việc của người không còn là mốc (luật 17/10)`);
  const saiDL = hang.filter(r => r.du_lieu !== undefined && !DU_LIEU.includes(r.du_lieu)).map(r => `${chuoi(r.ma) || '?'} (${JSON.stringify(r.du_lieu)})`);
  if (saiDL.length) co.push(`cờ du-lieu-sai-gia-tri: ${new Set(saiDL).size} việc khai du_lieu sai: ${lietTen(saiDL)} — chỉ nhận "sinh-gia" (việc sinh dữ liệu giả có nhãn) hoặc "gia" (việc đo trên dữ liệu giả)`);
  const thieu = hang.filter(r => r.du_lieu === 'gia' && !(Array.isArray(r.dung_tren) ? r.dung_tren : []).map(chuoi).some(x => (theoMa.get(x) || {}).du_lieu === 'sinh-gia')).map(r => chuoi(r.ma) || '?');
  if (thieu.length) co.push(`cờ thieu-hang-sinh-gia: ${new Set(thieu).size} việc đo trên dữ liệu giả mà không đứng trực tiếp trên việc sinh dữ liệu giả: ${lietTen(thieu)}`);
  return co;
}
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

const doc = p => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const chuoi = v => (v == null ? '' : String(v).trim());
const so = s => chuoi(s).toLowerCase();

// ── Khoá ổ cắm ────────────────────────────────────────────────────────────────
// MỘT hàm cho mọi bên đọc (scripts/lo-trinh-khoa.cjs). Rỗng / null của YAML → vắng.
export const khoaTuConfig = khoaTuConfig_;
export function docKhoa(root) {
  return khoaTuConfig(doc(path.join(root, '_acceptance', 'config.yaml')));
}
// Mọi tệp khai, theo thứ tự khai, kèm cờ tệp lặp — hoặc null khi ổ cắm vắng.
export function docCacTep(root) {
  return cacTepTuConfig(doc(path.join(root, '_acceptance', 'config.yaml')));
}

// ── Chiều hồ sơ → hàng ──────────────────────────────────────────────────────
// Ô cơ hội ghi `lo_trinh_ma` (và `lo_trinh_tep` khi mở từ hàng) là hồ sơ NHẬN hàng đó. Đọc một lần
// mỗi lần phân tích kho; hồ sơ không ghi trường thì không có mặt — kho cũ không phải sửa gì.
export function docNhan(root) {
  const acc = path.join(root, '_acceptance');
  if (!existsSync(acc)) return [];
  const ra = [];
  for (const e of readdirSync(acc, { withFileTypes: true }).filter(x => x.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const o = doc(path.join(acc, e.name, 'opportunity.md'));
    if (o == null) continue;
    const ma = chuoi(frontmatterField(o, 'lo_trinh_ma')).replace(/^["']|["']$/g, '');
    if (!ma) continue;
    const tep = chuoi(frontmatterField(o, 'lo_trinh_tep')).replace(/^["']|["']$/g, '');
    ra.push({ slug: e.name, ma, tep: tep || null });
  }
  return ra;
}

// ── Đọc tệp ───────────────────────────────────────────────────────────────────
// Mọi lỗi của TỆP KHO là một câu có tên, không bao giờ là stack trace: tệp hỏng của kho không
// được làm CI của kho đỏ, nhưng cũng không được im — trang và thẻ in đúng câu này.
export function docTep(root, tep) {
  const goc = path.resolve(root);
  const dich = path.resolve(goc, tep);
  const rel = path.relative(goc, dich);
  if (path.isAbsolute(tep) || rel.startsWith('..') || path.isAbsolute(rel))
    return { loi: `tệp ý định phải nằm trong kho: ${tep}`, data: null };
  if (!existsSync(dich) || !statSync(dich).isFile())
    return { loi: `tệp ý định không tồn tại: ${tep}`, data: null };
  let txt;
  try { txt = readFileSync(dich, 'utf8'); } catch (e) { return { loi: `tệp ý định không đọc được: ${tep} (${e.code || e.message})`, data: null }; }
  if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
  let data;
  try { data = JSON.parse(txt); } catch (e) { return { loi: `tệp ý định không phải JSON hợp lệ: ${e.message}`, data: null }; }
  if (data == null || typeof data !== 'object' || Array.isArray(data))
    return { loi: 'gốc tệp ý định phải là một object', data: null };
  return { loi: null, data };
}

// ── Kiểm khuôn ────────────────────────────────────────────────────────────────
// Bắt buộc: ma · cau_giao. Mọi trường khác tuỳ chọn hoặc tự do — giữ nguyên, không cờ.
export function kiemKhuon(data) {
  const co = [];
  const hangVao = Array.isArray(data.hang) ? data.hang : [];
  if (data.hang !== undefined && !Array.isArray(data.hang)) co.push('khối hang phải là một mảng');
  const hang = [];
  const daThay = new Set(); const trung = [];
  hangVao.forEach((r, i) => {
    if (r == null || typeof r !== 'object' || Array.isArray(r)) { co.push(`hàng #${i + 1} không phải object`); return; }
    const ma = chuoi(r.ma);
    const nhan = ma || `#${i + 1}`;
    for (const f of BAT_BUOC) if (!chuoi(r[f])) co.push(`hàng ${nhan} thiếu ${f}`);
    // Trường kit đọc lấy NGHĨA mà sai kiểu thì nói ra — coi như rỗng là để hàng còn chờ hiện thành hàng kế.
    if (r.dung_tren !== undefined && !Array.isArray(r.dung_tren)) co.push(`hàng ${nhan}: dung_tren phải là một mảng`);
    // `phu` (mã của bản phạm vi hàng gánh — skill cắt lượt ghi, răng cat-luot.mjs đọc).
    if (r.phu !== undefined && !Array.isArray(r.phu)) co.push(`hàng ${nhan}: phu phải là một mảng`);
    // `gio_may` (hồ sơ lo-trinh-gio-may): số giờ dương hoặc cặp [thấp, cao]. Sai → cờ khuôn, hàng coi như chưa khai (máy ước).
    if (r.gio_may !== undefined && !GM.kiemGioMay(r.gio_may)) co.push(`hàng ${nhan}: gio_may phải là số giờ dương hoặc cặp [thấp, cao]`);
    if (ma) { if (daThay.has(ma) && !trung.includes(ma)) trung.push(ma); daThay.add(ma); }
    // Câu giao là TIÊU ĐỀ: bỏ đúng một cặp «» bao trọn câu (hàng X2) — mọi chỗ in nó (trang, khối, thẻ
    // start, ô cơ hội của --mo-o) đi qua đây. Tệp kế hoạch của kho không bị ghi; vi_sao/bat_khi giữ nguyên.
    hang.push({ ...r, ...(typeof r.cau_giao === 'string' ? { cau_giao: HS.boNgoacNgoai(r.cau_giao), _cauGiaoGoc: r.cau_giao } : {}), _nhan: nhan, _ma: ma });
  });
  for (const m of trung) co.push(`mã trùng: ${m}`);
  const moc = (Array.isArray(data.moc) ? data.moc : []).filter(m => m && typeof m === 'object');
  for (const m of moc) if (m.hang !== undefined && !Array.isArray(m.hang)) co.push(`mốc ${chuoi(m.ten) || chuoi(m.ngay) || '?'}: hang phải là một mảng`);
  const daBac = (Array.isArray(data.da_bac) ? data.da_bac : []).filter(m => m && typeof m === 'object');
  // Chờ điều kiện — khoá `chan_troi` (luật 6 của cắt lượt): mã chưa cắt được thành câu giao, kèm lý do. Kit chỉ kiểm dạng.
  if (data.chan_troi !== undefined && !Array.isArray(data.chan_troi)) co.push('khối chan_troi phải là một mảng');
  else (data.chan_troi || []).forEach((c, i) => { if (c == null || typeof c !== 'object' || Array.isArray(c)) co.push(`chan_troi #${i + 1} không phải object`); });
  // Từ vựng tự khai của KHO: chữ riêng của kho → tên trạng thái của kit. Kho khai, kit chỉ đọc.
  const tuVung = {};
  if (data.tu_vung !== undefined) {
    if (data.tu_vung == null || typeof data.tu_vung !== 'object' || Array.isArray(data.tu_vung)) co.push('khối tu_vung phải là một object');
    else for (const [k, v] of Object.entries(data.tu_vung)) tuVung[so(k)] = chuoi(v);
  }
  // Chính sách rà soát (hồ sơ ra-soat-lo-trinh): khai ở đầu tệp, chủ kho viết. Sai kiểu → một cờ khuôn và KHÔNG luật
  // chính sách nào chạy (không đoán).
  let chinhSach = null;
  if (data.chinh_sach !== undefined) {
    const cs = data.chinh_sach;
    if (cs == null || typeof cs !== 'object' || Array.isArray(cs)) co.push('khối chinh_sach phải là một object');
    else {
      const t = cs.tuoi_ngay; const n = cs.tran_ke_tiep; let sai = false;
      if (t !== undefined && !(Number.isInteger(t) && t > 0)) { co.push('chinh_sach.tuoi_ngay phải là số nguyên dương'); sai = true; }
      if (n !== undefined && !(Number.isInteger(n) && n >= 0)) { co.push('chinh_sach.tran_ke_tiep phải là số nguyên không âm'); sai = true; }
      if (!sai) chinhSach = { tuoi_ngay: t ?? null, tran_ke_tiep: n ?? null };
    }
  }
  // Chính sách tự áp của CHIẾN DỊCH (hồ sơ ap-chinh-sach-lo-trinh): khối `chinh_sach` trên mốc `phat-hanh` — chủ kho chốt
  // một lần lúc cắt mốc. Sai → cờ khuôn và chính sách của mốc đó KHÔNG chạy (không đoán). Khoá theo chỉ số trong `moc`.
  const mocChinhSach = new Map();
  moc.forEach((m, i) => {
    if (m.chinh_sach === undefined) return;
    const tm = tenNganMoc(m) || `#${i + 1}`; const cs = m.chinh_sach;
    if (chuoi(m.loai) !== 'phat-hanh') { co.push(`chính sách chỉ khai ở mốc phát hành: ${tm}`); return; }
    if (cs == null || typeof cs !== 'object' || Array.isArray(cs)) { co.push(`mốc ${tm}: chinh_sach phải là một object`); return; }
    let sai = false;
    if (cs.tu_ap !== undefined && typeof cs.tu_ap !== 'boolean') { co.push(`mốc ${tm}: chinh_sach.tu_ap phải là true hoặc false`); sai = true; }
    for (const k of ['tuoi_ngay', 'nhip_ngay', 'tran_ap']) if (cs[k] !== undefined && !(Number.isInteger(cs[k]) && cs[k] > 0)) { co.push(`mốc ${tm}: chinh_sach.${k} phải là số nguyên dương`); sai = true; }
    if (cs.tran_ke_tiep !== undefined && !(Number.isInteger(cs.tran_ke_tiep) && cs.tran_ke_tiep >= 0)) { co.push(`mốc ${tm}: chinh_sach.tran_ke_tiep phải là số nguyên không âm`); sai = true; }
    if (!sai) mocChinhSach.set(i, { tu_ap: cs.tu_ap === true, tuoi_ngay: cs.tuoi_ngay ?? null, tran_ke_tiep: cs.tran_ke_tiep ?? null, nhip_ngay: cs.nhip_ngay ?? 1, tran_ap: cs.tran_ap ?? 5 });
  });
  return { ten: chuoi(data.ten), hang, moc, daBac, tuVung, co, chinhSach, mocChinhSach };
}

// ── Suy trạng thái ────────────────────────────────────────────────────────────
// `classify(dir, slug) → { key }` và `sections: [[key, title]…]` của bản đồ, nhận qua tham số.
export function suyTrangThai({ root, khuon, classify, sections, nhan = [] }) {
  const TEN = Object.fromEntries(sections);
  const tuVung = new Map([...sections.map(([, t]) => t), CHUA_MO].map(t => [so(t), t]));
  const daGiao = new Set(DA_GIAO_O.map(k => TEN[k]));
  const chuaLam = new Set([CHUA_MO, ...CHUA_LAM_O.map(k => TEN[k])]);
  const nhomCua = nhomBang(sections);
  const acc = path.join(root, '_acceptance');
  const cache = new Map();
  const xep = slug => {
    if (!cache.has(slug)) cache.set(slug, classify(path.join(acc, slug), slug));
    return cache.get(slug);
  };
  const coThuMuc = s => existsSync(path.join(acc, s)) && statSync(path.join(acc, s)).isDirectory();
  // `nhan` đã lọc về lộ trình này (bên gọi): mã → các hồ sơ nhận · hồ sơ → mã nó ghi.
  const nhanTheoMa = new Map(); const maCuaHoSo = new Map();
  for (const n of nhan) {
    if (!nhanTheoMa.has(n.ma)) nhanTheoMa.set(n.ma, []);
    nhanTheoMa.get(n.ma).push(n.slug);
    maCuaHoSo.set(n.slug, n.ma);
  }
  const co = [...khuon.co];
  const tuVungKho = khuon.tuVung || {};
  for (const [k, v] of Object.entries(tuVungKho)) if (!tuVung.has(so(v))) co.push(`tu_vung: «${k}» trỏ «${v}» — không phải tên trạng thái`);
  let tuKhaiNgoai = 0;
  const nguoiNhanCua = r => { const n = r._ma ? (nhanTheoMa.get(r._ma) || []) : []; return n.length > 1 ? n : []; };
  const dong = khuon.hang.map(r => {
    const coHang = [];
    const slug = chuoi(r.slug);
    const tuKhai = chuoi(r.trang_thai);
    const quyDoi = tuKhai && tuVungKho[so(tuKhai)] !== undefined ? tuVungKho[so(tuKhai)] : tuKhai;
    const khaiChuan = quyDoi ? tuVung.get(so(quyDoi)) : undefined;
    if (tuKhai && !khaiChuan) tuKhaiNgoai += 1;
    let chu; let tinTheoLoi = false; let coHoSo = false; let hoSo = null;
    if (slug && !SLUG_RE.test(slug)) {
      coHang.push(`hàng ${r._nhan}: slug không hợp lệ: ${slug}`);
      chu = CHUA_MO;
    } else {
      // Thứ tự ưu tiên (design §2): thư mục của slug → đúng MỘT hồ sơ nhận qua mã → lời khai.
      const coS = !!slug && coThuMuc(slug);
      const nguoiNhan = r._ma ? (nhanTheoMa.get(r._ma) || []) : [];
      const motNhan = nguoiNhan.length === 1 ? nguoiNhan[0] : null;
      if (nguoiNhan.length > 1) coHang.push(`hàng ${r._nhan} được nhiều hồ sơ nhận: ${nguoiNhan.join(', ')}`);
      if (motNhan && slug && motNhan !== slug) coHang.push(`hàng ${r._nhan} trỏ hồ sơ ${slug} nhưng hồ sơ ${motNhan} nhận hàng này`);
      if (coS && maCuaHoSo.has(slug) && maCuaHoSo.get(slug) !== r._ma) coHang.push(`hàng ${r._nhan} trỏ hồ sơ ${slug} nhưng hồ sơ ghi hàng ${maCuaHoSo.get(slug)}`);
      hoSo = coS ? slug : motNhan;
      if (hoSo) {
        coHoSo = true;
        chu = TEN[xep(hoSo).key];
      } else if (nguoiNhan.length > 1) {
        // Nhiều hồ sơ cùng nhận mà slug không chỉ ra hồ sơ nào: kit không chọn hộ, hàng không là
        // hàng kế, và lệnh mở không đẻ thêm hồ sơ (Cổng Bằng chứng lượt 1, Ngoài-6).
        chu = KHONG_SUY; // nhiều-người-nhận
      } else if (slug) {
        chu = CHUA_MO;
        // Slug khai mà không có hồ sơ, lời khai nói đã giao hoặc đang làm: kit không chứng được, và
        // «Chưa mở» biến nó thành hàng kế — đúng lỗi hàng «1» của crm OKR (03/10).
        if (khaiChuan && ['da-giao', 'dang-lam'].includes(nhomCua(khaiChuan))) {
          chu = KHONG_SUY;
          coHang.push(`hàng ${r._nhan}: tự khai ${tuKhai} mà không có hồ sơ ${slug}`);
        }
      } else {
        tinTheoLoi = true;
        // Tự khai không quy đổi được thì KHÔNG đoán: «Chưa mở» sẽ biến một hàng đã xong thành hàng
        // kế (đo trên crm OKR 02/10, hàng «0» khai «xong»).
        chu = khaiChuan || (tuKhai ? KHONG_SUY : CHUA_MO);
      }
    }
    // So theo NHÓM, chỉ khi có hồ sơ: slug dự kiến chưa có thư mục thì không có gì để «khác».
    if (coHoSo && khaiChuan && nhomCua(khaiChuan) !== nhomCua(chu))
      coHang.push(`hàng ${r._nhan}: tệp khai khác hồ sơ: khai ${tuKhai}${quyDoi !== tuKhai ? ` (${khaiChuan})` : ''}, hồ sơ ${chu}`);
    if (coHoSo && chuoi(r.hang)) {
      const c = doc(path.join(acc, hoSo, 'contract.md'));
      const t = c == null ? '' : chuoi(frontmatterField(c, 'risk_tier'));
      if (t && t !== chuoi(r.hang)) coHang.push(`hàng ${r._nhan}: hạng tệp ${chuoi(r.hang)}, hồ sơ ${t}`);
    }
    // Dải tóm tắt của hồ sơ (khối bản 2) — trạng thái truyền vào là CHỮ của hàng, nên dải và hàng không
    // nói hai chuyện. Hàng chưa có hồ sơ: null.
    const tomTat = coHoSo && hoSo ? HS.tomTatHoSo(path.join(acc, hoSo), { trangThai: chu }).dai : null;
    return { ...r, slug: slug || undefined, hoSo, nhieuNhan: hoSo ? [] : nguoiNhanCua(r), chu, tinTheoLoi, coHoSo, tuKhai: tuKhai || null, khaiNgoai: !!(tuKhai && !khaiChuan), coHang, tomTat };
  });
  const theoMa = new Map();
  for (const d of dong) if (d._ma && !theoMa.has(d._ma)) theoMa.set(d._ma, d);
  for (const d of dong) {
    for (const x of (Array.isArray(d.dung_tren) ? d.dung_tren : []).map(chuoi)) {
      // Mục trỏ một mốc thuộc cờ gom dung-tren-moc của luatChiPhatTrien — không in thêm «mã không có» cho cùng mục.
      if (!theoMa.has(x) && !khuon.moc.some(m => chuoi(m.ma) === x || chuoi(m.ten).normalize('NFC') === x.normalize('NFC'))) d.coHang.push(`hàng ${d._nhan}: đứng trên mã không có: ${x}`);
    }
  }
  // Vòng trong dung_tren: không treo, nêu một lần mỗi vòng.
  const trangThaiDfs = new Map(); const vongDaNeu = new Set();
  const dfs = (ma, duong) => {
    trangThaiDfs.set(ma, 1);
    const d = theoMa.get(ma);
    for (const x of (Array.isArray(d?.dung_tren) ? d.dung_tren : []).map(chuoi)) {
      if (!theoMa.has(x)) continue;
      if (trangThaiDfs.get(x) === 1) {
        const i = duong.indexOf(x); const vong = [...duong.slice(i), x];
        const khoaVong = [...vong.slice(0, -1)].sort().join('|');
        if (!vongDaNeu.has(khoaVong)) { vongDaNeu.add(khoaVong); co.push(`đứng trên tạo vòng: ${vong.join(' → ')}`); }
      } else if (!trangThaiDfs.get(x)) dfs(x, [...duong, x]);
    }
    trangThaiDfs.set(ma, 2);
  };
  for (const ma of theoMa.keys()) if (!trangThaiDfs.get(ma)) dfs(ma, [ma]);
  for (const d of dong) co.push(...d.coHang);

  const daGiaoMa = ma => { const d = theoMa.get(ma); return !!d && daGiao.has(d.chu); };
  const duDieuKien = d => {
    if (d.dung_tren !== undefined && !Array.isArray(d.dung_tren)) return false;
    return (Array.isArray(d.dung_tren) ? d.dung_tren : []).map(chuoi).every(x => theoMa.has(x) && daGiaoMa(x));
  };
  const ke = dong.find(d => chuaLam.has(d.chu) && duDieuKien(d)) || null;
  // Mã trùng trong tệp: hàng kế vẫn hiện, nhưng không ai mở nó bằng mã được (Ngoài-7).
  const keMaDon = !!ke && !!ke._ma && dong.filter(d => d._ma === ke._ma).length === 1;
  const hangKe = ke ? { ma: ke._nhan, cauGiao: chuoi(ke.cau_giao) || '(hàng chưa có câu giao)', dungTren: (Array.isArray(ke.dung_tren) ? ke.dung_tren : []).map(chuoi).map(x => ({ ma: x, chu: theoMa.get(x)?.chu || null })) } : null;

  // Vòng ngoài lộ trình: hồ sơ không hàng nào trỏ — đếm, không cờ.
  const troi = new Set(dong.flatMap(d => [d.slug, d.hoSo]).filter(Boolean));
  const ngoaiLoTrinh = existsSync(acc)
    ? readdirSync(acc, { withFileTypes: true }).filter(e => e.isDirectory() && !troi.has(e.name) && coTepTrongCay(path.join(acc, e.name))).map(e => e.name).sort()
    : [];
  // Hàng sống qua Cổng Đáng: mỗi slug một lần; n = hồ sơ có opportunity đã decided.
  let n = 0; let k = 0;
  for (const s of [...troi].sort()) {
    const o = doc(path.join(acc, s, 'opportunity.md'));
    if (o == null) continue;
    if (so(frontmatterField(o, 'stage')) !== 'decided') continue;
    n += 1;
    if (['build', 'iterate'].includes(so(frontmatterField(o, 'decision')))) k += 1;
  }
  const demTheoO = {};
  for (const d of dong) demTheoO[d.chu] = (demTheoO[d.chu] || 0) + 1;
  return {
    ten: khuon.ten, dong, co, hangKe, hangKeMaDon: keMaDon, ngoaiLoTrinh, songQuaCongDang: { k, n }, tuKhaiNgoai,
    tinTheoLoi: { n: dong.filter(d => d.tinTheoLoi).length, tong: dong.length },
    moc: khuon.moc, daBac: khuon.daBac, demTheoO, daGiao,
    // Chính sách rà soát (hồ sơ ra-soat-lo-trinh): khoá CHỈ có khi kho khai đúng — kho không khai giữ lớp phân tích từng byte.
    ...(khuon.chinhSach ? { chinhSach: khuon.chinhSach } : {}),
    // Chính sách tự áp trên mốc (hồ sơ ap-chinh-sach-lo-trinh): cùng luật — khoá CHỈ có khi có mốc khai đúng.
    ...(khuon.mocChinhSach && khuon.mocChinhSach.size ? { mocChinhSach: khuon.mocChinhSach } : {}),
  };
}

// Hàng trễ: mốc có ngày < hôm nay, hàng gắn mốc chưa giao. CHỈ thẻ start dùng (trang tất định).
export function hangTre(kq, today) {
  const ra = []; const daCo = new Set();
  const theoMa = new Map(kq.dong.filter(d => d._ma).map(d => [d._ma, d]));
  for (const m of kq.moc) {
    const ngay = chuoi(m.ngay);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !(ngay < today)) continue;
    for (const ma of (Array.isArray(m.hang) ? m.hang : []).map(chuoi)) {
      const d = theoMa.get(ma);
      if (!d || kq.daGiao.has(d.chu) || daCo.has(ma)) continue;
      daCo.add(ma); ra.push({ ma, moc: chuoi(m.ten), ngay });
    }
  }
  return ra;
}

// Mốc không gắn hàng nào: kit không tự gắn thay kho (khảo sát mục 6), chỉ đếm để «Hàng trễ: không
// có» khỏi bị đọc thành «không trễ».
export function mocKhongHang(kq) {
  const n = kq.moc.length;
  const k = kq.moc.filter(m => !Array.isArray(m.hang) || !m.hang.map(chuoi).filter(Boolean).length).length;
  return { k, n };
}

// ── Trang ─────────────────────────────────────────────────────────────────────
// Hồ sơ trang-lo-trinh-doc-mot-phut (design 2026-10-03-trang-lo-trinh-doc-mot-phut-design.md): màn
// đầu là một thẻ mỗi lộ trình (làm tiếp · cần sửa · mốc kế tiếp · tiến độ), rồi mỗi lộ trình một mục
// (chỗ lệch → việc còn mở → việc đã giao gập → dải mốc → đã bác), cuối trang MỘT khối hồ sơ không
// thuộc kế hoạch nào. Chữ trên trang là tiếng sản phẩm: câu cờ của lớp phân tích giữ nguyên (thẻ
// start và test đọc nó), lớp vẽ dịch bằng CO_DICH. Trang tất định: đoạn script nội tuyến duy nhất
// tính «còn N ngày» lúc xem; tắt script trang vẫn đủ.
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Bảng dịch câu cờ → tiếng sản phẩm. MỘT dòng cho mỗi chỗ phát cờ trong mã (lớp phân tích +
// lo-trinh-khoa.cjs); ca LT-97 đếm hai bên. `ma` là mã hàng để nối liên kết, `chu` là câu không mã.
// Câu không khớp dòng nào thì in nguyên văn — không mất thông tin.
export const CO_DICH = [
  { ten: 'thieu-truong', re: /^hàng (.+?) thiếu (cau_giao|ma)$/, ra: m => ({ ma: m[1], chu: m[2] === 'ma' ? 'chưa có mã' : 'chưa có câu mô tả việc giao' }) },
  { ten: 'dung-tren-mang', re: /^hàng (.+?): dung_tren phải là một mảng$/, ra: m => ({ ma: m[1], chu: 'ô «cần xong trước» phải là danh sách' }) },
  { ten: 'phu-mang', re: /^hàng (.+?): phu phải là một mảng$/, ra: m => ({ ma: m[1], chu: 'ô «mã đã phủ» phải là danh sách' }) },
  { ten: 'gio-may-sai', re: /^hàng (.+?): gio_may phải là số giờ dương hoặc cặp \[thấp, cao\]$/, ra: m => ({ ma: m[1], chu: 'ô «giờ máy» phải là số giờ dương hoặc cặp [thấp, cao]' }) },
  { ten: 'khoi-chan-troi', re: /^khối chan_troi phải là một mảng$/, ra: () => ({ ma: null, chu: 'danh sách chờ điều kiện phải là một mảng' }) },
  { ten: 'chan-troi-object', re: /^chan_troi #(\d+) không phải object$/, ra: m => ({ ma: null, chu: `mục chờ điều kiện thứ ${m[1]} không đúng dạng` }) },
  { ten: 'khong-object', re: /^hàng #(\d+) không phải object$/, ra: m => ({ ma: null, chu: `việc thứ ${m[1]} không đúng dạng` }) },
  { ten: 'khoi-hang', re: /^khối hang phải là một mảng$/, ra: () => ({ ma: null, chu: 'danh sách việc phải là một mảng' }) },
  { ten: 'ma-trung', re: /^mã trùng: (.+)$/, ra: m => ({ ma: null, chu: `hai việc cùng mã ${m[1]} — đổi mã một trong hai` }) },
  { ten: 'moc-mang', re: /^mốc (.+?): hang phải là một mảng$/, ra: m => ({ ma: null, chu: `mốc ${m[1]} — danh sách việc gắn mốc phải là một mảng` }) },
  { ten: 'khoi-tu-vung', re: /^khối tu_vung phải là một object$/, ra: () => ({ ma: null, chu: 'bảng từ trạng thái phải là một object' }) },
  { ten: 'tu-vung-tro', re: /^tu_vung: «(.+?)» trỏ «(.+?)» — không phải tên trạng thái$/, ra: m => ({ ma: null, chu: `từ «${m[1]}» trỏ «${m[2]}» — không phải tên trạng thái` }) },
  { ten: 'slug-sai', re: /^hàng (.+?): slug không hợp lệ: (.+)$/, ra: m => ({ ma: m[1], chu: `tên hồ sơ «${m[2]}» không hợp lệ` }) },
  { ten: 'nhieu-nhan', re: /^hàng (.+?) được nhiều hồ sơ nhận: (.+)$/, ra: m => ({ ma: m[1], chu: `nhiều hồ sơ cùng nhận việc này: ${m[2]}` }) },
  { ten: 'nhan-khac', re: /^hàng (.+?) trỏ hồ sơ (.+?) nhưng hồ sơ (.+?) nhận hàng này$/, ra: m => ({ ma: m[1], chu: `kế hoạch ghi hồ sơ ${m[2]} nhưng hồ sơ ${m[3]} nhận việc này` }) },
  { ten: 'ghi-hang-khac', re: /^hàng (.+?) trỏ hồ sơ (.+?) nhưng hồ sơ ghi hàng (.+)$/, ra: m => ({ ma: m[1], chu: `kế hoạch ghi hồ sơ ${m[2]} nhưng hồ sơ đó ghi việc ${m[3]}` }) },
  { ten: 'tu-khai-khong-ho-so', re: /^hàng (.+?): tự khai (.+?) mà không có hồ sơ (.+)$/, ra: m => ({ ma: m[1], chu: `kế hoạch ghi «${m[2]}» nhưng chưa có hồ sơ ${m[3]}` }) },
  { ten: 'khai-khac', re: /^hàng (.+?): tệp khai khác hồ sơ: khai (.+?)(?: \(([^()]*)\))?, hồ sơ (.+)$/, ra: m => ({ ma: m[1], chu: `kế hoạch ghi «${m[2]}», thực tế «${m[4]}»` }) },
  { ten: 'hang-khac', re: /^hàng (.+?): hạng tệp (.+?), hồ sơ (.+)$/, ra: m => ({ ma: m[1], chu: `kế hoạch ghi hạng ${m[2]}, thực tế hạng ${m[3]}` }) },
  ...CO_PHAT_TRIEN.map(ten => ({ ten, re: new RegExp(`^cờ ${ten}: (.+)$`), ra: m => ({ ma: null, chu: m[1] }) })),
  { ten: 'dung-tren-khong-co', re: /^hàng (.+?): đứng trên mã không có: (.+)$/, ra: m => ({ ma: m[1], chu: `cần xong trước ${m[2]} nhưng kế hoạch không có việc ${m[2]}` }) },
  { ten: 'vong', re: /^đứng trên tạo vòng: (.+)$/, ra: m => ({ ma: null, chu: `thứ tự «cần xong trước» tạo vòng: ${m[1]}` }) },
  { ten: 'ho-so-tep', re: /^hồ sơ (.+?) ghi lo_trinh_tep (.+?) — kho không khai tệp đó$/, ra: m => ({ ma: null, chu: `hồ sơ ${m[1]} ghi kế hoạch ${m[2]} — kho không khai kế hoạch đó` }) },
  { ten: 'ho-so-ma', re: /^hồ sơ (.+?) ghi lo_trinh_ma (.+?) — không có hàng (.+)$/, ra: m => ({ ma: null, chu: `hồ sơ ${m[1]} ghi việc ${m[2]} — kế hoạch không có việc ${m[3]}` }) },
  { ten: 'khai-hai-lan', re: /^tệp lộ trình khai hai lần: (.+)$/, ra: m => ({ ma: null, chu: `kế hoạch ${m[1]} được khai hai lần trong cấu hình` }) },
  { ten: 'ngoai-moc', re: /^hàng (.+?): đang mở vòng mà chưa thuộc mốc nào$/, ra: m => ({ ma: m[1], chu: 'đang làm mà chưa thuộc mốc nào — gắn việc này vào một mốc của kế hoạch' }) },
  { ten: 'chinh-sach-object', re: /^khối chinh_sach phải là một object$/, ra: () => ({ ma: null, chu: 'chính sách rà soát phải là một object' }) },
  { ten: 'chinh-sach-tuoi', re: /^chinh_sach\.tuoi_ngay phải là số nguyên dương$/, ra: () => ({ ma: null, chu: 'chính sách tuoi_ngay phải là số nguyên dương' }) },
  { ten: 'chinh-sach-tran', re: /^chinh_sach\.tran_ke_tiep phải là số nguyên không âm$/, ra: () => ({ ma: null, chu: 'chính sách tran_ke_tiep phải là số nguyên không âm' }) },
  { ten: 'cs-moc-loai', re: /^chính sách chỉ khai ở mốc phát hành: (.+)$/, ra: m => ({ ma: null, chu: `chính sách chỉ khai ở mốc phát hành: ${m[1]}` }) },
  { ten: 'cs-moc-object', re: /^mốc (.+?): chinh_sach phải là một object$/, ra: m => ({ ma: null, chu: `chính sách tự áp của mốc ${m[1]} phải là một object` }) },
  { ten: 'cs-moc-tu-ap', re: /^mốc (.+?): chinh_sach\.tu_ap phải là true hoặc false$/, ra: m => ({ ma: null, chu: `chính sách tu_ap phải là true hoặc false (mốc ${m[1]})` }) },
  { ten: 'cs-moc-duong', re: /^mốc (.+?): chinh_sach\.(tuoi_ngay|nhip_ngay|tran_ap) phải là số nguyên dương$/, ra: m => ({ ma: null, chu: `chính sách ${m[2]} phải là số nguyên dương (mốc ${m[1]})` }) },
  { ten: 'cs-moc-tran', re: /^mốc (.+?): chinh_sach\.tran_ke_tiep phải là số nguyên không âm$/, ra: m => ({ ma: null, chu: `chính sách tran_ke_tiep phải là số nguyên không âm (mốc ${m[1]})` }) },
  { ten: 'ho-so-ngoai-ke-hoach', re: /^hồ sơ (.+?) đang mở mà không thuộc việc nào trong kế hoạch$/, ra: m => ({ ma: null, chu: `hồ sơ ${m[1]} đang mở mà không thuộc việc nào trong kế hoạch — thêm việc cho nó, hoặc ghi mã việc vào hồ sơ` }) },
];
export function dichCo(c) {
  for (const d of CO_DICH) { const m = String(c).match(d.re); if (m) return { ten: d.ten, ...d.ra(m) }; }
  return { ten: null, ma: null, chu: String(c) };
}
export const dichLoi = loi => String(loi).replace(/tệp ý định/g, 'tệp kế hoạch');
// Tham số lệnh mở hàng kế — MỘT nguồn cho thẻ start và trang: `<tệp>:<mã>` khi kho khai nhiều tệp,
// null khi mã trùng trong tệp (không ai mở được bằng mã).
export const thamSoKe = (kq, tep, nhieu) => (kq.hangKe && kq.hangKeMaDon ? (nhieu ? `${tep}:${kq.hangKe.ma}` : kq.hangKe.ma) : null);

const CSS = `:root{--bg:#fbfaf7;--sf:#ffffff;--fg:#1d1d1b;--mu:#5f5c56;--ln:#e3e0d8;--ac:#245a8a;--acbg:#eaf1f8;--wa:#7a4f00;--wabg:#fff4dc;--ok:#256033;--okbg:#e8f3ea;--bar:#d9d5cb}
@media (prefers-color-scheme:dark){:root{--bg:#171715;--sf:#1f1f1c;--fg:#ecebe6;--mu:#a7a49c;--ln:#34332f;--ac:#9cc2e6;--acbg:#1d2a36;--wa:#f0c36a;--wabg:#33290f;--ok:#8fcf9a;--okbg:#1b2a1e;--bar:#3a3934}}
*{box-sizing:border-box}html{scroll-padding-top:16px}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:26px;line-height:1.2;margin:0 0 6px}h2{font-size:18px;line-height:1.3;margin:32px 0 10px}h3{font-size:16px;margin:24px 0 8px}
a{color:var(--ac)}a:visited{color:var(--ac)}code{font-size:13px}
.mu{color:var(--mu)}.nho{font-size:13px}
.the-dau{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin:16px 0 8px}
.the{background:var(--sf);border:1px solid var(--ln);border-radius:10px;padding:16px}
.the h2{margin:0 0 12px}.the h2 a{text-decoration:none;color:var(--fg)}
.o{margin:0 0 12px}.o:last-child{margin:0}.nhan{display:block;font-size:13px;color:var(--mu);margin-bottom:2px}
.ke{font-weight:600}.lenh{display:inline-block;margin-top:6px;padding:6px 8px;background:var(--acbg);border-radius:6px;user-select:all;-webkit-user-select:all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;word-break:break-all}
.thanh{height:8px;background:var(--bar);border-radius:4px;overflow:hidden;display:flex;margin-top:6px}.thanh i{display:block;height:100%}.thanh .g{background:var(--ok)}.thanh .l{background:var(--ac)}
.so-co a{display:inline-flex;align-items:center;min-height:44px;font-weight:600;color:var(--wa)}.so-co .khong{color:var(--ok);font-weight:600}
.co-ds{list-style:none;padding:0;margin:0}.co-ds li{background:var(--wabg);color:var(--wa);border-radius:8px;margin:6px 0}.co-ds li>*{display:block;min-height:44px;padding:11px 12px}.co-ds a{color:inherit;text-decoration:none}.co-ds a:hover{text-decoration:underline}
.loi{background:var(--wabg);color:var(--wa);border-radius:8px;padding:8px 12px}
.bang{border:1px solid var(--ln);border-radius:10px}
table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.4}th,td{text-align:left;vertical-align:top;padding:5px 8px;border-bottom:1px solid var(--ln)}
thead th{position:sticky;top:0;background:var(--sf);font-weight:600;color:var(--mu);font-size:13px;z-index:1}
tbody tr:target{outline:2px solid var(--ac);outline-offset:-2px}
@media (min-width:641px){td[data-nhan="Việc giao"]{width:40%}}
.tt{display:inline-block;font-weight:600;border-radius:999px;padding:1px 8px;font-size:13px;background:var(--acbg);color:var(--ac)}.tt.giao{background:var(--okbg);color:var(--ok)}.tt.chua{background:transparent;color:var(--mu);border:1px solid var(--ln)}
.co-o{display:block;margin-top:4px;font-size:13px;color:var(--wa)}
details{margin:8px 0}summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600;color:var(--ac)}
.moc{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(400px,100%),1fr));column-gap:24px}.moc li{position:relative;padding:4px 0 4px 16px;border-left:2px solid var(--ln)}.moc li::before{content:"";position:absolute;left:-6px;top:11px;width:10px;height:10px;border-radius:50%;background:var(--bar)}
.moc li.qua{color:var(--mu)}.moc li.tre{color:var(--wa)}.moc li.tre::before{background:var(--wa)}.moc li.ke-tiep::before{background:var(--ac)}.moc .ngay{font-variant-numeric:tabular-nums;font-weight:600;margin-right:6px}.moc .con{font-size:13px;color:var(--ac);margin-left:6px}.moc li.qua .con,.moc li.tre .con{color:inherit}.moc .trong{font-size:13px;color:var(--wa);margin-left:6px}
.moc .dau b{font-weight:600}.moc .dem{color:var(--fg);font-weight:600}.moc .dem.xong{color:var(--ok)}.viec{list-style:none;padding:0 4px 0 0;margin:4px 0 8px;min-width:0}.viec details{margin:0}.viec .dong{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:4px 0}.viec summary{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-weight:400;color:var(--fg);min-height:44px}.viec .ten{font-weight:600}.viec .ma{margin-left:auto;flex-shrink:0;padding:0 4px;font-size:13px;color:var(--mu);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.viec details p{margin:0 0 6px}details.chua-hen>summary{font-size:13px;color:var(--mu)}
@media (max-width:640px){main{padding:16px 12px 48px}.the-dau{gap:10px;margin:10px 0}.the{padding:12px}.the h2{margin:0 0 8px}.o{margin:0 0 6px}.the .nhan{display:inline;margin:0 4px 0 0}.the .nhan::after{content:':'}.lenh{margin-top:4px;padding:4px 6px}.thanh{display:none}.bang{border:0}table,thead,tbody,tr,td{display:block}thead{display:none}
tr{border:1px solid var(--ln);border-radius:10px;margin:10px 0;padding:6px 0;background:var(--sf)}td{border:0;padding:4px 12px}td[data-nhan]::before{content:attr(data-nhan);display:block;font-size:13px;color:var(--mu)}td:empty{display:none}}`;

// Script nội tuyến DUY NHẤT: tính «còn N ngày / hôm nay / đã qua» theo ngày của người xem, đánh dấu
// mốc kế tiếp và điền ô «Mốc kế tiếp» của thẻ. Không tải gì, không ghi gì.
const SCRIPT = `(function(){var d=new Date();var h=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
document.querySelectorAll('ol.moc').forEach(function(ol){var ke=null;var tre=[];var hong=0;ol.querySelectorAll('li[data-ngay]').forEach(function(li){var p=li.getAttribute('data-ngay').split('-');var t=Date.UTC(+p[0],+p[1]-1,+p[2]);var n=Math.round((t-h)/864e5);var s=li.querySelector('.con');if(p.length!==3||isNaN(n)){hong++;return;}if(n<0){if(li.hasAttribute('data-con-viec')){tre.push(li.getAttribute('data-ten'));li.classList.add('tre');if(s)s.textContent='đã qua — còn việc chưa giao';}else{li.classList.add('qua');if(s)s.textContent='đã qua';}}else{if(s)s.textContent=n===0?'hôm nay':'còn '+n+' ngày';if(!ke){ke=li;li.classList.add('ke-tiep');}}});
var o=document.getElementById(ol.getAttribute('data-the'));if(!o||(!ke&&hong))return;o.textContent=(ke?ke.getAttribute('data-ten')+' — '+ke.getAttribute('data-ngay').split('-').reverse().join('/')+' ('+ke.querySelector('.con').textContent+')':'Không còn mốc nào phía trước.')+(tre.length===1?' · mốc «'+tre[0]+'» đã qua, còn việc chưa giao':tre.length?' · '+tre.length+' mốc đã qua còn việc chưa giao (sớm nhất: «'+tre[0]+'»)':'');});})();`;

const neoHang = (i, ma) => `lt${i}-h-${String(ma).replace(/[^A-Za-z0-9_-]/g, '_')}`;
const ngayVN = s => chuoi(s).split('-').reverse().join('/');
const COT = [['ma', 'Mã'], ['cau_giao', 'Việc giao'], ['hang', 'Hạng'], ['dung_tren', 'Cần xong trước'], ['chu', 'Trạng thái'], ['bat_khi', 'Bật khi'], ['vi_sao', 'Vì sao']];
// Cột «Giờ máy» chỉ có khi lớp phân tích kho đã gắn ước (`_gm`, không liệt kê được — JSON của các lệnh khác không đổi).
const coDuLieu = (d, k) => (k === 'dung_tren' ? Array.isArray(d.dung_tren) && d.dung_tren.length > 0 : !!chuoi(d[k]));

// Neo mỗi hàng: mã (hoặc nhãn) — hàng trùng mã lấy hậu tố để mọi id trên trang là duy nhất. `theoNhan`
// trỏ nhãn → id của hàng ĐẦU mang nhãn đó (liên kết từ chỗ cần sửa, cần xong trước, mốc).
function neoCua(i, kq) {
  const idHang = new Map(); const ids = new Set(); const theoNhan = new Map();
  for (const d of kq.dong) {
    const goc = neoHang(i, d._ma || d._nhan); let id = goc;
    for (let n = 2; ids.has(id); n++) id = `${goc}-${n}`;
    idHang.set(d, id); ids.add(id); if (!theoNhan.has(String(d._nhan))) theoNhan.set(String(d._nhan), id);
  }
  return { idHang, ids, theoNhan };
}
const CHUA_CAU = '(chưa có câu mô tả việc giao)';
// Bước kế của hàng CÓ hồ sơ, suy từ ô bản đồ (hồ sơ lo-trinh-cat-luot, phần sửa lát 1): bảng viết sẵn,
// máy không soạn câu. Ô vắng khỏi bảng (đã giao, đã nghiệm thu, xếp lại, đã bác, ngoài phạm vi) không
// có bước kế. `buocKeCua` do veHtml đặt mỗi lượt vẽ từ `sections` của bản đồ — lớp phân tích không đổi.
export const BUOC_KE = {
  'can-nhac': 'quyết có làm hay không',
  'sap-mo': 'mở vòng',
  'cho-duyet': 'duyệt phạm vi',
  'dang-dung': 'làm và chấm',
  'cho-nghiem-thu': 'lái thử và phiên nghiệm thu',
  'hong': 'sửa hồ sơ',
};
let buocKeCua = () => null;
// Hàng mà lớp phân tích chọn làm hàng kế: cùng nhãn, trạng thái thuộc nhóm chưa làm (cùng luật lớp
// phân tích dùng để chọn), cùng câu giao — mã trùng thì không lấy nhầm hàng đầu đã giao hay đang làm.
function hangKeCua(kq, chuaLam) {
  const ke = kq.hangKe; if (!ke) return null;
  const cung = kq.dong.filter(d => String(d._nhan) === String(ke.ma) && (chuoi(d.cau_giao) || '(hàng chưa có câu giao)') === ke.cauGiao);
  return cung.find(d => d.chu === CHUA_MO || chuaLam.has(d.chu)) || cung[0] || null;
}
// Hàng ghi trạng thái ngoài bảng từ, gom theo TỪ đã ghi: mỗi từ là một chỗ cần sửa (thêm từ đó vào
// `tu_vung` là sửa xong mọi hàng mang nó).
const khaiLa = kq => { const g = new Map(); for (const d of kq.dong) if (d.khaiNgoai) { if (!g.has(d.tuKhai)) g.set(d.tuKhai, []); g.get(d.tuKhai).push(d); } return [...g]; };
// Nhóm tiến độ của một chữ trạng thái — MỘT hàm cho thanh tiến độ của thẻ và cho khối dữ liệu
// (hồ sơ xuat-du-lieu-lo-trinh): trang và dữ liệu không thể chia khác nhau.
const nhomTienDo = (chu, kq, nhom) => (kq.daGiao.has(chu) ? 'da-giao' : nhom.dangLam.has(chu) ? 'dang-lam'
  : (chu === CHUA_MO || nhom.chuaLam.has(chu)) ? 'chua-bat-dau' : 'khac');
// Việc gắn một mốc, và «mốc còn việc chưa giao» — dải mốc và khối dữ liệu cùng gọi.
const ganMoc = m => (Array.isArray(m.hang) ? m.hang.map(chuoi).filter(Boolean) : []);
const conViecMoc = (m, kq) => ganMoc(m).some(x => kq.dong.some(d => String(d._nhan) === x && !kq.daGiao.has(d.chu)));
// Mô hình hiển thị chung (hồ sơ road-map-de-dung, AC-11): luật hiển thị sống MỘT chỗ — trang, bản xem chữ và khối dữ liệu
// (mà trang trong sản phẩm kho tiêu thụ đọc) chỉ vẽ từ đây, không tự lọc. Chuẩn là luật trang Lộ trình crm (onehub
// viec.ts/xem-moc.tsx): việc thuộc mốc ĐẦU TIÊN liệt nó theo thứ tự ngày; mốc hiện khi có việc; việc không mốc nào hiện vào
// nhóm «chưa hẹn mốc». Tên việc = câu giao đầy đủ (chủ kho chốt 17/10), vắng thì tên ngắn → tên → mã.
export const tenHienThi = d => chuoi(d.cau_giao) || chuoi(d.ten_ngan) || chuoi(d.ten) || String(d._nhan);
export function moHinhHienThi(kq) {
  const theoNhan = new Map(); for (const d of kq.dong) if (!theoNhan.has(String(d._nhan))) theoNhan.set(String(d._nhan), d);
  const daCo = new Set(); const moc = new Map();
  for (const m of mocTheoNgay(kq)) {
    const viec = [];
    for (const x of ganMoc(m)) { const d = theoNhan.get(x); if (!d || daCo.has(x)) continue; daCo.add(x); viec.push(x); }
    moc.set(m, { hien: viec.length > 0, viec_hien: viec, con_lai: viec.filter(x => !kq.daGiao.has(theoNhan.get(x).chu)).length });
  }
  const chuaHen = [...theoNhan.keys()].filter(x => !daCo.has(x));
  return { moc, chua_hen_moc: chuaHen, viec: theoNhan };
}
const mocTheoNgay = kq => { const mocs = [...kq.moc].sort((a, b) => chuoi(a.ngay).localeCompare(chuoi(b.ngay))); return mocs; };
const cauKhaiLa = (w, ds) => `kế hoạch ghi «${w}» ở ${ds.length} việc — máy không hiểu trạng thái này, thêm từ này vào bảng từ trạng thái`;
const cauKhaiNgoai = d => `kế hoạch ghi «${d.tuKhai}» — máy không hiểu trạng thái này`;
const demTienDo = (kq, nhom) => {
  const n = { tong: kq.dong.length, da_giao: 0, dang_lam: 0, chua_bat_dau: 0, khac: 0 };
  for (const d of kq.dong) n[nhomTienDo(d.chu, kq, nhom).replace(/-/g, '_')] += 1;
  return n;
};

function theDau(i, t, nhieu, nhom) {
  const ten = esc((t.kq && t.kq.ten) || t.tep);
  if (t.loi) return `<section class="the"><h2><a href="#lt${i}">${ten}</a></h2><p class="loi">Không đọc được kế hoạch ${esc(t.tep)}: ${esc(dichLoi(t.loi))}</p></section>`;
  const kq = t.kq; const ke = hangKeCua(kq, nhom.chuaLam); const { idHang } = neoCua(i, kq);
  const lenh = thamSoKe(kq, t.tep, nhieu);
  const td = demTienDo(kq, nhom);
  const { tong, da_giao: giao, dang_lam: dang, chua_bat_dau: chua, khac } = td;
  const pt = n => (100 * n / tong).toFixed(1);
  const lamTiep = ke
    ? `<span class="ke"><a href="#${idHang.get(ke)}">${esc(ke._nhan)}</a> — ${esc(chuoi(ke.cau_giao) || CHUA_CAU)}</span><br>${lenh
      ? `<span class="mu nho">Dán vào Claude Code:</span> <span class="lenh">/feature-loop:feature-loop ${esc(lenh)}</span>`
      : `<span class="mu">${ke._ma ? 'Mã này trùng trong kế hoạch — đổi mã trước khi mở.' : 'Việc này chưa có mã — đặt mã trong kế hoạch trước khi mở.'}</span>`}`
    : '<span class="mu">Chưa có việc nào đủ điều kiện mở.</span>';
  const nSua = kq.co.length + khaiLa(kq).length;
  const canSua = nSua ? `<a href="#lt${i}-co">${nSua} chỗ cần sửa</a>` : '<span class="khong">Không có chỗ nào cần sửa</span>';
  const tienDo = tong
    ? `${giao}/${tong} đã giao · ${dang} đang làm · ${chua} chưa bắt đầu${khac ? ` · ${khac} việc khác (xếp lại, đã bác hoặc trạng thái chưa rõ)` : ''}<div class="thanh" aria-hidden="true"><i class="g" style="width:${pt(giao)}%"></i><i class="l" style="width:${pt(dang)}%"></i></div>`
    : 'Kế hoạch chưa có việc nào.';
  return `<section class="the"><h2><a href="#lt${i}">${ten}</a></h2>
<div class="o"><span class="nhan">Làm tiếp</span>${lamTiep}</div>
<div class="o so-co"><span class="nhan">Cần sửa trong kế hoạch</span>${canSua}</div>
<div class="o"><span class="nhan">Mốc kế tiếp</span><span id="lt${i}-moc-ke">${kq.moc.length ? 'Xem dải mốc bên dưới.' : 'Kế hoạch chưa có mốc.'}</span></div>
<div class="o"><span class="nhan">Tiến độ</span>${tienDo}</div>
</section>`;
}

function moCo(i, c, theoNhan) {
  const d = dichCo(c); const id = d.ma != null ? theoNhan.get(String(d.ma)) : null;
  return id ? `<li><a href="#${id}"><b>${esc(d.ma)}</b> — ${esc(d.chu)}</a></li>` : `<li><span>${d.ma != null ? `<b>${esc(d.ma)}</b> — ` : ''}${esc(d.chu)}</span></li>`;
}
// Phần giờ máy trong ô Hạng: «<khoảng> giờ máy (<nhãn nguồn>)», và % hạn mức tuần chỉ khi đã ước. Chữ thô dùng chung cho
// trang (thoát HTML) và khối dữ liệu (nguyên văn) — hồ sơ lo-trinh-du-lieu-ngay-du-kien, hàng RM6c.
function gioMayChu(u) {
  return `${GM.khoangVN(u.khoang)} giờ máy${u.nhan ? ` (${u.nhan})` : ''}${u.phanTram.gia != null ? ` · ${GM.oPhanTram(u)} hạn mức tuần` : ''}`;
}
function gioMayO(u) { return esc(gioMayChu(u)); }
// Ô giờ máy của một hàng trong khối dữ liệu: đúng chữ trang in + số. `co` = nhãn trang in khi ước theo bảng luật (chưa đủ
// số đo cùng hạng), null khi kho khai hay ước theo số đo.
const gioMayHangDuLieu = u => ({ thap: u.khoang[0], cao: u.khoang[1], nguon: u.nguon, chu: gioMayChu(u), co: u.nguon === 'luat' ? u.nhan || null : null, phan_tram_tuan: u.phanTram.gia, phan_tram_chu: GM.oPhanTram(u) });
function oHang(i, d, kq, theoNhan) {
  const tt = `<span class="tt${kq.daGiao.has(d.chu) ? ' giao' : (d.chu === CHUA_MO ? ' chua' : '')}">${esc(d.chu)}</span>`;
  return {
    ma: esc(d._nhan),
    // Giờ máy đi CÙNG dòng chữ nhỏ dưới câu giao (dòng tên hồ sơ có sẵn) — không thêm cột, không ép hẹp «Việc giao»
    // (ca LTT-san: trang hai lộ trình ≤ 1/3 trang 2.21.0, kể cả với phông rộng của máy CI).
    cau_giao: `${esc(chuoi(d.cau_giao))}${d.slug || kq._gm ? `<div class="mu nho">${d.slug ? `<code>${esc(d.slug)}</code>` : ''}${d.slug && kq._gm ? ' · ' : ''}${kq._gm ? `<span class="gm">${gioMayO(kq._gm.uoc(d))}</span>` : ''}</div>` : ''}`,
    // Giờ máy nằm TRONG ô Hạng (không thêm cột): thêm cột ép hẹp «Việc giao» và trang dài quá 1/3 (ca LTT-san).
    hang: esc(chuoi(d.hang)),
    dung_tren: (Array.isArray(d.dung_tren) ? d.dung_tren : []).map(chuoi).map(x => (theoNhan.has(x) ? `<a href="#${theoNhan.get(x)}">${esc(x)}</a>` : esc(x))).join(', '),
    chu: `${tt}${d.tinTheoLoi ? '<span class="mu nho"> theo ghi chép, chưa có hồ sơ</span>' : ''}${d.khaiNgoai ? `<span class="co-o">${esc(cauKhaiNgoai(d))}</span>` : ''}${d.coHang.map(c => `<span class="co-o">${esc(dichCo(c).chu)}</span>`).join('')}${buocKeCua(d) ? `<div class="mu nho">bước kế: ${esc(buocKeCua(d))}</div>` : ''}`,
    bat_khi: esc(chuoi(d.bat_khi)),
    vi_sao: esc(chuoi(d.vi_sao)),
  };
}
function bangViec(i, rows, kq, theoNhan, idHang) {
  const cot = COT.filter(([k]) => k === 'ma' || k === 'chu' || rows.some(d => coDuLieu(d, k)));
  return `<div class="bang"><table><thead><tr>${cot.map(([, n]) => `<th>${n}</th>`).join('')}</tr></thead><tbody>
${rows.map(d => { const o = oHang(i, d, kq, theoNhan); return `<tr id="${idHang.get(d)}">${cot.map(([k, n]) => `<td data-nhan="${n}">${o[k]}</td>`).join('')}</tr>`; }).join('\n')}
</tbody></table></div>`;
}
export function khoiNgoai(ds) {
  return ds.length ? `<details><summary>${ds.length} hồ sơ không thuộc kế hoạch nào</summary><p class="mu nho">Sửa lỗi, sự cố, việc giao thẳng — hợp lệ, liệt kê để đủ.</p><ul>${ds.map(s => `<li><code>${esc(s)}</code></li>`).join('')}</ul></details>` : '';
}
function mucLoTrinh(i, t) {
  const ten = esc((t.kq && t.kq.ten) || t.tep);
  if (t.loi) return `<section id="lt${i}"><h2>${ten}</h2><p class="loi">Không đọc được kế hoạch ${esc(t.tep)}: ${esc(dichLoi(t.loi))}</p></section>`;
  const kq = t.kq;
  const { idHang, theoNhan } = neoCua(i, kq);
  const mo = kq.dong.filter(d => !kq.daGiao.has(d.chu)); const xong = kq.dong.filter(d => kq.daGiao.has(d.chu));
  const P = [`<section id="lt${i}"><h2>${ten}</h2>`];
  // Chỗ cần sửa = cờ của lớp phân tích (đã dịch) + mỗi hàng ghi trạng thái ngoài bảng từ (không so được
  // với hồ sơ — thêm từ đó vào `tu_vung`).
  const la = khaiLa(kq);
  if (kq.co.length || la.length) P.push(`<h3 id="lt${i}-co">Cần sửa trong kế hoạch (${kq.co.length + la.length})</h3><ul class="co-ds">${kq.co.map(c => moCo(i, c, theoNhan)).join('')}${la.map(([w, ds]) => `<li><span>${esc(cauKhaiLa(w, ds))} (việc ${ds.map(d => `<a href="#${idHang.get(d)}">${esc(d._nhan)}</a>`).join(', ')})</span></li>`).join('')}</ul>`);
  // Dòng đếm máy ước nằm NGAY TRONG tiêu đề (không thêm dòng): trang giữ lời hứa «đọc một phút» về độ dài (ca LTT-san).
  const nUoc = kq._gm ? kq.dong.filter(d => d.gio_may === undefined || !GM.kiemGioMay(d.gio_may)).length : 0;
  const ptChua = kq._gm ? kq.dong.map(d => kq._gm.uoc(d)).find(u => !u.laCatBan && u.phanTram.gia == null) || null : null;
  P.push(`<h3>Việc còn mở (${mo.length})${nUoc ? ` <span class="mu nho">— ${nUoc}/${kq.dong.length} hàng máy tự ước giờ máy — khai gio_may trên hàng để ghi đè${ptChua ? ` · % hạn mức tuần ${GM.oPhanTram(ptChua)}` : ''}</span>` : ''}</h3>`);
  P.push(mo.length ? bangViec(i, mo, kq, theoNhan, idHang)
    : `<p class="mu">${kq.dong.length ? 'Mọi việc trong kế hoạch đã giao.' : `Kế hoạch chưa có việc nào — thêm hàng vào <code>${esc(t.tep)}</code>.`}</p>`);
  if (xong.length) P.push(`<details><summary>${xong.length} việc đã giao</summary>${bangViec(i, xong, kq, theoNhan, idHang)}</details>`);
  if (kq.moc.length) {
    // Khối Mốc vẽ TỪ mô hình hiển thị chung (AC-11) — không tự lọc: mốc hiện khi có việc; mỗi việc chưa giao một dòng
    // «tên — trạng thái», mã là chữ phụ (liên kết tới hàng); việc đã giao gập; mốc chưa gắn việc chỉ còn số đếm ở tiêu đề.
    const mh = moHinhHienThi(kq); const mocs = mocTheoNgay(kq).filter(m => mh.moc.get(m).hien);
    const an = kq.moc.length - mocs.length;
    const conViec = m => conViecMoc(m, kq);
    const viec = x => {
      const d = mh.viec.get(x); const giao = kq.daGiao.has(d.chu);
      const ma = theoNhan.has(x) ? `<a class="ma" href="#${theoNhan.get(x)}">${esc(x)}</a>` : `<span class="ma">${esc(x)}</span>`;
      // Việc có hồ sơ: dòng mở ra được (tên hồ sơ); chưa có hồ sơ: dòng chữ thường — không nút mở ra rỗng.
      const dau = `<span class="ten">${esc(tenHienThi(d))}</span> <span class="tt${giao ? ' giao' : (d.chu === CHUA_MO ? ' chua' : '')}">${esc(d.chu)}</span> ${ma}`;
      return d.slug ? `<details><summary>${dau}</summary><p class="mu nho">Hồ sơ <code>${esc(d.slug)}</code></p></details>` : `<div class="dong">${dau}</div>`;
    };
    // Việc đã giao chỉ còn số đếm trên dòng mốc (danh sách đủ ở bảng «việc đã giao») — giữ lời hứa độ dài của trang.
    const mocLi = m => {
      const o = mh.moc.get(m); const mo = o.viec_hien.filter(x => !kq.daGiao.has(mh.viec.get(x).chu)); const xong = o.viec_hien.length - mo.length;
      const dem = mo.length ? `<span class="dem">còn ${mo.length}/${o.viec_hien.length} việc</span>${xong ? ` · ${xong} đã giao` : ''}` : `<span class="dem xong">đã giao đủ ${xong} việc</span>`;
      return `<li data-ngay="${esc(chuoi(m.ngay))}" data-ten="${esc(chuoi(m.ten))}"${conViec(m) ? ' data-con-viec' : ''}><div class="dau"><span class="ngay">${esc(ngayVN(m.ngay))}</span><b>${esc(chuoi(m.ten))}</b><span class="con"></span></div><div class="mu nho">${dem}${gioMayMoc(kq, m)}</div>${mo.length ? `<div class="viec">${mo.map(viec).join('')}</div>` : ''}</li>`;
    };
    P.push(`<h3>Mốc${an ? ` <span class="mu nho">— ${an}/${kq.moc.length} mốc chưa gắn việc nào, không hiện</span>` : ''}</h3>${mocs.length ? `<ol class="moc" data-the="lt${i}-moc-ke">${mocs.map(mocLi).join('')}</ol>` : '<p class="mu">Chưa mốc nào gắn việc.</p>'}`);
    if (mh.chua_hen_moc.length) P.push(`<details class="chua-hen"><summary>${mh.chua_hen_moc.length} việc chưa hẹn mốc</summary><div class="viec">${mh.chua_hen_moc.map(viec).join('')}</div></details>`);
  }
  if (kq.daBac.length) P.push(`<h3>Đã bác</h3><ul>${kq.daBac.map(b => `<li>${esc(chuoi(b.ma))} — ${esc(chuoi(b.ly_do))}</li>`).join('')}</ul>`);
  P.push('</section>');
  return P.join('\n');
}

// Dòng giờ máy của một mốc trên trang (tất định — không «hôm nay»): tổng các hàng chưa giao, % hạn mức, dự báo đóng
// băng lúc mốc bắt đầu và cờ quá tải so với mục tiêu hiện tại. Mốc không còn hàng chưa giao: chỉ dự báo đóng băng (nếu có).
// Ba phần của dòng mốc — dùng chung cho trang và khối dữ liệu (RM6c) để hai bên không trôi khỏi nhau: `gio` (tổng hàng
// chưa giao, null khi mốc hết việc mở), `duKien` (dự báo đóng băng, null khi mốc chưa đóng băng), `quaTai` (chữ cờ).
// null cả cụm khi lộ trình không qua phân tích kho.
function mocGioMay(kq, m) {
  if (!kq._gm) return null;
  const ma = ganMoc(m); const mo = ma.map(x => kq.dong.find(d => String(d._nhan) === x)).filter(d => d && !kq.daGiao.has(d.chu));
  const kVong = kq._gm.doVong.filter(v => v.daGiao && typeof v.phan_tram_tuan === 'number').length;
  const tg = mo.length ? GM.tongMoc(m, mo, kq._gm.uoc) : null;
  const gio = tg ? { tg, kVong, chu: `~${GM.khoangVN(tg.khoang)} giờ máy${tg.phanTram.gia != null ? ` · ${GM.chuPhanTramMoc(tg, kVong)}` : ''}` } : null;
  const db = duBaoDongBang(kq, m);
  const duKien = db ? { ngay_tinh: db.ngay_tinh, hoan_tat: db.moc.hoan_tat, chu: `dự báo lúc bắt đầu (${GM.ngayVN(db.ngay_tinh)}): hoàn tất ${GM.ngayVN(db.moc.hoan_tat)}` } : null;
  const muc = chuoi(m.ngay);
  const quaTai = db && /^\d{4}-\d{2}-\d{2}$/.test(muc) && db.moc.hoan_tat > muc ? `mốc quá tải: dự kiến ${GM.ngayVN(db.moc.hoan_tat)}, mục tiêu ${GM.ngayVN(muc)}` : null;
  return { gio, duKien, quaTai };
}
function gioMayMoc(kq, m) {
  const x = mocGioMay(kq, m); if (!x) return '';
  const P = [x.gio && x.gio.chu, x.duKien && x.duKien.chu].filter(Boolean);
  return (P.length ? ` <span class="mu nho">· ${esc(P.join(' · '))}</span>` : '') + (x.quaTai ? `<span class="co-o">${esc(x.quaTai)}</span>` : '');
}

// ── Khối dữ liệu máy đọc (hồ sơ xuat-du-lieu-lo-trinh) ─────────────────────────
// Trang mang MỘT khối `<script type="application/json" id="lo-trinh-du-lieu">`, dựng trong cùng lần
// gọi `veHtml` từ cùng `cacTep` — bản chiếu ngoài kho (trang trong CRM, bản chiếu ReUI) đọc khối thay
// vì tự tính trạng thái. Khuôn sống ở ĐÂY; tài liệu cho kho tiêu thụ
// (skills/acceptance/references/lo-trinh-du-lieu.md) chép bảng khoá, ca LT-119 so hai bên.
export const ID_DU_LIEU = 'lo-trinh-du-lieu';
// Bản 2 (hàng X2): thêm khoá `tom_tat` ở cấp hàng. Bộ đọc bản 1 gặp bản 2 «đọc phần biết» + một cảnh báo.
// Cùng bản 2 (hàng RM6c, chủ kho chốt giữ số ở Cổng Phạm vi 16/10 — «kit chỉ THÊM khoá trong cùng phiên bản»):
// `hang.gio_may`, `moc.gio_may`, `moc.du_kien`, `moc.qua_tai` và ba cấp con. Bộ đọc nhận ra trang đời trước bằng khoá vắng.
export const PHIEN_BAN_DU_LIEU = 2;
export const KHUON_DU_LIEU = {
  goc: ['khuon', 'phien_ban', 'nguon', 'lo_trinh', 'ngoai_lo_trinh'],
  lo_trinh: ['tep', 'ten', 'loi', 'hang_ke', 'can_sua', 'tien_do', 'hang', 'moc', 'da_bac', 'chua_hen_moc'],
  hang_ke: ['ma', 'cau_giao', 'lenh'],
  can_sua: ['ma', 'chu'],
  tien_do: ['tong', 'da_giao', 'dang_lam', 'chua_bat_dau', 'khac'],
  hang: ['ma', 'cau_giao', 'hang', 'nhom', 'dung_tren', 'trang_thai', 'nhom_trang_thai', 'ho_so', 'theo_loi', 'co', 'bat_khi', 'vi_sao', 'tom_tat', 'gio_may', 'ten_hien_thi'],
  moc: ['ten', 'ngay', 'hang', 'con_viec', 'gio_may', 'du_kien', 'qua_tai', 'hien', 'viec_hien', 'con_lai'],
  da_bac: ['ma', 'ly_do'],
  tom_tat: ['moi_nguoi', 'chu_kho'],
  moi_nguoi: [...HS.O_MOI_NGUOI],
  chu_kho: [...HS.O_CHU_KHO],
  gio_may: ['thap', 'cao', 'nguon', 'chu', 'co', 'phan_tram_tuan', 'phan_tram_chu'],
  gio_may_moc: ['thap', 'cao', 'chu', 'phan_tram_tuan', 'phan_tram_chu'],
  du_kien: ['ngay_tinh', 'hoan_tat', 'chu'],
};
const nhomVe = sections => { const TEN = Object.fromEntries(sections || []); const ten = ds => new Set(ds.map(k => TEN[k]).filter(Boolean)); return { dangLam: ten(DANG_LAM_O), chuaLam: ten(CHUA_LAM_O) }; };
const tienDoRong = () => ({ tong: 0, da_giao: 0, dang_lam: 0, chua_bat_dau: 0, khac: 0 });
// Mỗi chữ trong khối là ĐÚNG chữ trang in (cờ đã dịch, câu gom từ trạng thái lạ, lệnh mở) — bản chiếu
// không phải dịch lại gì. Không ngày chạy: `--check` vẫn so byte.
// `tinHieu` (hồ sơ cua-tin-hieu-gom-nhom, hàng L3): mảng đường đi tín hiệu khi kho khai cửa tín hiệu —
// khoá gốc TUỲ CHỌN `tin_hieu`, chỉ có mặt khi khai (kho không khai giữ nguyên từng byte; bảng khoá chuẩn
// KHUON_DU_LIEU không đổi; trường bản ghi ở TRUONG_DUONG của scripts/tin-hieu.mjs).
export function duLieuTrang(cacTep, sections = null, tinHieu = null) {
  const nhom = nhomVe(sections); const nhieu = cacTep.length > 1;
  const ngoai = (cacTep.find(t => t.kq) || {}).kq?.ngoaiLoTrinh || [];
  const lo = cacTep.map(t => {
    if (t.loi) return { tep: t.tep, ten: null, loi: dichLoi(t.loi), hang_ke: null, can_sua: [], tien_do: tienDoRong(), hang: [], moc: [], da_bac: [], chua_hen_moc: [] };
    const kq = t.kq; const ke = hangKeCua(kq, nhom.chuaLam); const thamSo = thamSoKe(kq, t.tep, nhieu); const mh = moHinhHienThi(kq);
    return {
      tep: t.tep, ten: kq.ten || null, loi: null,
      hang_ke: ke ? { ma: String(ke._nhan), cau_giao: chuoi(ke.cau_giao) || CHUA_CAU, lenh: thamSo ? `/feature-loop:feature-loop ${thamSo}` : null } : null,
      can_sua: [...kq.co.map(c => { const d = dichCo(c); return { ma: d.ma != null ? String(d.ma) : null, chu: d.chu }; }),
        ...khaiLa(kq).map(([w, ds]) => ({ ma: null, chu: `${cauKhaiLa(w, ds)} (việc ${ds.map(d => d._nhan).join(', ')})` }))],
      tien_do: demTienDo(kq, nhom),
      hang: kq.dong.map(d => ({
        ma: String(d._nhan), cau_giao: chuoi(d.cau_giao), hang: chuoi(d.hang), nhom: chuoi(d.nhom),
        dung_tren: (Array.isArray(d.dung_tren) ? d.dung_tren : []).map(chuoi),
        trang_thai: d.chu, nhom_trang_thai: nhomTienDo(d.chu, kq, nhom), ho_so: d.hoSo || null, theo_loi: !!d.tinTheoLoi,
        co: [...(d.khaiNgoai ? [cauKhaiNgoai(d)] : []), ...d.coHang.map(c => dichCo(c).chu)],
        bat_khi: chuoi(d.bat_khi), vi_sao: chuoi(d.vi_sao), tom_tat: d.tomTat || null,
        gio_may: kq._gm ? gioMayHangDuLieu(kq._gm.uoc(d)) : null,
        ten_hien_thi: tenHienThi(d),
      })),
      moc: mocTheoNgay(kq).map(m => {
        const x = mocGioMay(kq, m) || {};
        return {
          ten: chuoi(m.ten), ngay: chuoi(m.ngay), hang: ganMoc(m), con_viec: conViecMoc(m, kq),
          gio_may: x.gio ? { thap: x.gio.tg.khoang[0], cao: x.gio.tg.khoang[1], chu: x.gio.chu, phan_tram_tuan: x.gio.tg.phanTram.gia, phan_tram_chu: GM.chuPhanTramMoc(x.gio.tg, x.gio.kVong) } : null,
          du_kien: x.duKien || null,
          qua_tai: x.quaTai || null,
          ...mh.moc.get(m),
        };
      }),
      da_bac: kq.daBac.map(b => ({ ma: chuoi(b.ma), ly_do: chuoi(b.ly_do) })),
      chua_hen_moc: mh.chua_hen_moc,
    };
  });
  return { khuon: ID_DU_LIEU, phien_ban: PHIEN_BAN_DU_LIEU, nguon: cacTep.map(t => t.tep), lo_trinh: lo, ngoai_lo_trinh: [...ngoai], ...(tinHieu != null ? { tin_hieu: tinHieu } : {}) };
}
// JSON trong thẻ script: mọi `<` thoát thành \u003c (không chuỗi nào trong khối đóng được thẻ, bất
// kể hoa thường), U+2028/2029 thoát để khối vẫn là JS hợp lệ với bộ đọc cũ.
const khoiDuLieu = o => `<script type="application/json" id="${ID_DU_LIEU}">${JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')}</script>`;

// Phép so của `product-map.mjs --check` (hàng X2): trang trong cây «khớp» bản vẽ lại khi giống từng byte,
// HOẶC khi chỉ khác ở `tom_tat` của khối dữ liệu. Dải tóm tắt đọc nội dung hồ sơ (dòng sổ, báo cáo token,
// mã đã chấm) — đòi nó khớp từng byte là bắt mọi commit chạm hồ sơ (một dòng sổ, một lượt ghim lại) vẽ lại
// trang ở MỌI kho. Dải đúng tới lần vẽ gần nhất (mỗi cổng đóng); phần người nhìn thấy và mọi khoá khác
// vẫn so từng byte.
const RE_KHOI = /<script type="application\/json" id="lo-trinh-du-lieu">([\s\S]*?)<\/script>/;
const boTomTat = html => {
  const m = String(html ?? '').match(RE_KHOI); if (!m) return html;
  let o; try { o = JSON.parse(m[1]); } catch (_) { return html; }
  for (const t of Array.isArray(o.lo_trinh) ? o.lo_trinh : []) for (const h of Array.isArray(t && t.hang) ? t.hang : []) if (h && typeof h === 'object' && 'tom_tat' in h) h.tom_tat = null;
  return String(html).replace(RE_KHOI, () => khoiDuLieu(o));
};
export const trangKhop = (coSan, veLai) => coSan === veLai || (coSan != null && veLai != null && boTomTat(coSan) === boTomTat(veLai));

// Bộ đọc mẫu, KHOAN DUNG (đường đọc-cũ): không bao giờ ném. Trang đời trước không có khối, JSON hỏng,
// khuôn lạ → `duLieu: null` + câu cảnh báo; phiên bản mới hơn → vẫn đọc phần biết + một cảnh báo;
// khoá thiếu → giá trị rỗng theo kiểu; khoá lạ giữ nguyên. Hàm TỰ ĐỦ — không gọi ký hiệu nào khác của
// mô-đun — để kho tiêu thụ chép nguyên văn hàm này (tài liệu lo-trinh-du-lieu.md bảo vậy); bảng khoá
// bên trong phải bằng KHUON_DU_LIEU, ca LT-118 chạy bản chép rời của hàm và so hai bảng.
export function docDuLieu(html) {
  const ID = 'lo-trinh-du-lieu'; const PHIEN_BAN = 2;
  const KHUON = {
    goc: ['khuon', 'phien_ban', 'nguon', 'lo_trinh', 'ngoai_lo_trinh'],
    lo_trinh: ['tep', 'ten', 'loi', 'hang_ke', 'can_sua', 'tien_do', 'hang', 'moc', 'da_bac', 'chua_hen_moc'],
    hang_ke: ['ma', 'cau_giao', 'lenh'],
    can_sua: ['ma', 'chu'],
    tien_do: ['tong', 'da_giao', 'dang_lam', 'chua_bat_dau', 'khac'],
    hang: ['ma', 'cau_giao', 'hang', 'nhom', 'dung_tren', 'trang_thai', 'nhom_trang_thai', 'ho_so', 'theo_loi', 'co', 'bat_khi', 'vi_sao', 'tom_tat', 'gio_may', 'ten_hien_thi'],
    moc: ['ten', 'ngay', 'hang', 'con_viec', 'gio_may', 'du_kien', 'qua_tai', 'hien', 'viec_hien', 'con_lai'],
    da_bac: ['ma', 'ly_do'],
    tom_tat: ['moi_nguoi', 'chu_kho'],
    moi_nguoi: ['da_giao', 'vi_sao', 'trang_thai', 'ngay', 'production', 'do_gi', 'ket_qua', 'chua_lam', 'ai_quyet'],
    chu_kho: ['tieu_chi', 'phep_do', 'luot_cham', 'token', 'quyet_dinh_may', 'quyet_dinh_nguoi', 'ma'],
    gio_may: ['thap', 'cao', 'nguon', 'chu', 'co', 'phan_tram_tuan', 'phan_tram_chu'],
    gio_may_moc: ['thap', 'cao', 'chu', 'phan_tram_tuan', 'phan_tram_chu'],
    du_kien: ['ngay_tinh', 'hoan_tat', 'chu'],
  };
  const MANG = ['nguon', 'lo_trinh', 'ngoai_lo_trinh', 'can_sua', 'hang', 'moc', 'da_bac', 'dung_tren', 'co', 'viec_hien', 'chua_hen_moc'];
  const BOOL = ['theo_loi', 'con_viec']; const SO = ['phien_ban', 'tong', 'da_giao', 'dang_lam', 'chua_bat_dau', 'khac'];
  const NUL = ['ten', 'loi', 'hang_ke', 'lenh', 'ho_so', 'tom_tat', 'moi_nguoi', 'chu_kho', 'gio_may', 'du_kien', 'qua_tai', 'ten_hien_thi', 'hien', 'con_lai'];
  // Ô của dải vắng → null («chưa có»), xét theo CẤP chứ không theo tên: tên ô trùng tên trường ở cấp khác
  // (da_giao của tien_do, ma, trang_thai, vi_sao của hang) vẫn rỗng theo kiểu như bản 1. Ô vắng của giờ máy / dự kiến
  // cũng null — «chưa có», không phải 0 giờ.
  const ODON = ['moi_nguoi', 'chu_kho', 'gio_may', 'gio_may_moc', 'du_kien'];
  const rong = (k, cap) => (ODON.includes(cap) ? null : MANG.includes(k) ? [] : BOOL.includes(k) ? false : SO.includes(k) ? 0 : NUL.includes(k) ? null
    : k === 'tien_do' ? { tong: 0, da_giao: 0, dang_lam: 0, chua_bat_dau: 0, khac: 0 } : '');
  const va = (o, cap) => {
    if (o == null || typeof o !== 'object' || Array.isArray(o)) return o;
    const ra = { ...o };
    for (const k of KHUON[cap] || []) if (!(k in ra)) ra[k] = rong(k, cap);
    return ra;
  };
  const m = String(html ?? '').match(new RegExp(`<script type="application/json" id="${ID}">([\\s\\S]*?)</script>`));
  if (!m) return { duLieu: null, canhBao: ['trang chưa mang dữ liệu lộ trình — vẽ lại bằng bộ kit từ 2.27'] };
  let o;
  try { o = JSON.parse(m[1]); } catch (e) { return { duLieu: null, canhBao: [`khối dữ liệu lộ trình không phải JSON hợp lệ: ${e.message}`] }; }
  if (o == null || typeof o !== 'object' || Array.isArray(o) || o.khuon !== ID) return { duLieu: null, canhBao: [`khối mang khuôn «${o && o.khuon}», không phải ${ID}`] };
  const canhBao = [];
  if (Number(o.phien_ban) > PHIEN_BAN) canhBao.push(`khuôn phiên bản ${o.phien_ban} mới hơn bộ đọc (${PHIEN_BAN}) — đọc phần biết`);
  if (Number(o.phien_ban) === 1) canhBao.push('trang vẽ bằng khuôn bản 1 — chưa có tóm tắt hồ sơ (tom_tat null); vẽ lại bằng bộ kit mới');
  // Trang đời trước khi khối mang giờ máy (kit trước RM6c, cùng phiên bản 2): nhận ra bằng khoá vắng ở việc nào đó.
  // Trang khuôn bản 1 đã có cờ «vẽ lại bằng bộ kit mới» — không thêm cờ thứ hai cho cùng một việc vẽ lại.
  const thieuGio = Number(o.phien_ban) !== 1 && (Array.isArray(o.lo_trinh) ? o.lo_trinh : []).some(t => t && Array.isArray(t.hang) && t.hang.some(h => h && typeof h === 'object' && !('gio_may' in h)));
  if (thieuGio) canhBao.push('trang vẽ bằng bộ kit chưa có giờ máy trong khối — chưa có giờ máy và ngày dự kiến (gio_may, du_kien null); vẽ lại bằng bộ kit mới');
  // Mô hình hiển thị chung (hồ sơ road-map-de-dung, cùng phiên bản 2): trang đời trước nhận ra bằng khoá `chua_hen_moc` vắng ở
  // một lộ trình đọc được. Bộ đọc của kho tiêu thụ giữ luật lọc riêng của mình tới khi trang được vẽ lại.
  const thieuMoHinh = Number(o.phien_ban) !== 1 && (Array.isArray(o.lo_trinh) ? o.lo_trinh : []).some(t => t && typeof t === 'object' && !t.loi && !('chua_hen_moc' in t));
  if (thieuMoHinh) canhBao.push('trang vẽ bằng bộ kit chưa có luật hiển thị trong khối — khối chưa mang mô hình hiển thị (ten_hien_thi, hien, con_lai null; viec_hien, chua_hen_moc rỗng); vẽ lại bằng bộ kit mới');
  const g = va(o, 'goc');
  g.lo_trinh = (Array.isArray(g.lo_trinh) ? g.lo_trinh : []).map(t => {
    const x = va(t, 'lo_trinh');
    if (x == null || typeof x !== 'object') return x;
    if (x.hang_ke != null) x.hang_ke = va(x.hang_ke, 'hang_ke');
    x.tien_do = va(x.tien_do, 'tien_do');
    for (const cap of ['can_sua', 'hang', 'moc', 'da_bac']) x[cap] = (Array.isArray(x[cap]) ? x[cap] : []).map(v => va(v, cap));
    for (const h of x.hang) if (h && typeof h === 'object' && h.tom_tat != null && typeof h.tom_tat === 'object') {
      h.tom_tat = va(h.tom_tat, 'tom_tat');
      for (const cap of ['moi_nguoi', 'chu_kho']) h.tom_tat[cap] = va(h.tom_tat[cap] == null || typeof h.tom_tat[cap] !== 'object' ? {} : h.tom_tat[cap], cap);
    }
    for (const h of x.hang) if (h && typeof h === 'object' && h.gio_may != null && typeof h.gio_may === 'object') h.gio_may = va(h.gio_may, 'gio_may');
    for (const m of x.moc) if (m && typeof m === 'object') {
      if (m.gio_may != null && typeof m.gio_may === 'object') m.gio_may = va(m.gio_may, 'gio_may_moc');
      if (m.du_kien != null && typeof m.du_kien === 'object') m.du_kien = va(m.du_kien, 'du_kien');
    }
    return x;
  });
  return { duLieu: g, canhBao };
}

// Một trang cho mọi lộ trình của kho (`cacTep` = [{tep, loi, kq}] theo thứ tự khai). `sections` của
// bản đồ cho tên các ô đang làm / chưa làm (số tiến độ); vắng thì chỉ «Chưa mở» tính là chưa bắt đầu.
export function veHtml(cacTep, sections = null, tinHieu = null) {
  const TEN = Object.fromEntries(sections || []); const ten = ds => new Set(ds.map(k => TEN[k]).filter(Boolean));
  const nhom = { dangLam: ten(DANG_LAM_O), chuaLam: ten(CHUA_LAM_O) };
  const khoaO = new Map((sections || []).map(([k, t]) => [t, k]));
  buocKeCua = d => (d.coHoSo ? BUOC_KE[khoaO.get(d.chu)] || null : null);
  const nhieu = cacTep.length > 1;
  const tieuDe = nhieu ? 'Lộ trình' : esc((cacTep[0].kq && cacTep[0].kq.ten) || 'Lộ trình');
  const ngoai = (cacTep.find(t => t.kq) || {}).kq?.ngoaiLoTrinh || [];
  const than = [`<h1>${tieuDe}</h1>`,
    `<div class="the-dau">${cacTep.map((t, i) => theDau(i + 1, t, nhieu, nhom)).join('\n')}</div>`,
    ...cacTep.map((t, i) => mucLoTrinh(i + 1, t)),
    `<p class="mu nho">Vẽ từ ${cacTep.map(t => `<code>${esc(t.tep)}</code>`).join(', ')} và hồ sơ nghiệm thu; máy vẽ lại mỗi lần một cổng nghiệm thu đóng, trạng thái từng hàng lấy từ hồ sơ, không gõ tay. Đổi kế hoạch bằng PR vào tệp kế hoạch.</p>`,
    khoiNgoai(ngoai)].filter(Boolean);
  return `<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${tieuDe}</title>\n<style>\n${CSS}\n</style>\n</head>\n<body>\n<main>\n${than.join('\n')}\n</main>\n${khoiDuLieu(duLieuTrang(cacTep, sections, tinHieu))}\n<script>${SCRIPT}</script>\n</body>\n</html>\n`;
}
// Ba lối cũ giữ tên (test và bộ đọc đời trước gọi chúng), cùng một bộ vẽ.
export const renderTrang = (kq, tep, sections = null) => veHtml([{ tep, loi: null, kq }], sections);
export const renderLoi = (tep, loi) => veHtml([{ tep, loi, kq: null }]);
export const renderNhieu = (cacTep, sections = null) => veHtml(cacTep, sections);

// ── Hai lối vào cho hai bên đọc ───────────────────────────────────────────────
// Phân tích cả kho: mọi tệp khai, và cờ không gắn được vào một hàng (tệp lặp, hồ sơ ghi tệp không
// khai, hồ sơ ghi mã không có hàng) — cờ ấy vào lộ trình của tệp nó ghi, không ghi tệp thì vào lộ
// trình đọc được ĐẦU theo thứ tự khai. null khi ổ cắm vắng.
export function phanTichKho({ root, classify, sections }) {
  const khai = docCacTep(root);
  if (khai == null) return null;
  const nhan = docNhan(root);
  const cacTep = khai.tep.map(tep => {
    const { loi, data } = docTep(root, tep);
    if (loi) return { tep, loi, kq: null };
    const kq = suyTrangThai({ root, khuon: kiemKhuon(data), classify, sections, nhan: nhan.filter(n => !n.tep || n.tep === tep) });
    kq.co.push(...luatChiPhatTrien(data));
    return { tep, loi: null, kq };
  });
  const docDuoc = cacTep.filter(t => t.kq);
  const dat = (tep, c) => { const t = (tep && docDuoc.find(x => x.tep === tep)) || docDuoc[0]; if (t) t.kq.co.push(c); };
  for (const c of khai.co) dat(null, c);
  for (const n of nhan) {
    if (n.tep && !khai.tep.includes(n.tep)) { dat(null, `hồ sơ ${n.slug} ghi lo_trinh_tep ${n.tep} — kho không khai tệp đó`); continue; }
    const pham = docDuoc.filter(t => !n.tep || n.tep === t.tep);
    if (pham.length && !pham.some(t => t.kq.dong.some(d => d._ma === n.ma))) dat(n.tep, `hồ sơ ${n.slug} ghi lo_trinh_ma ${n.ma} — không có hàng ${n.ma}`);
  }
  // Vòng ngoài lộ trình tính trên CẢ kho: hồ sơ một lộ trình trỏ không phải «ngoài» ở lộ trình kia.
  if (docDuoc.length > 1) {
    const troi = new Set(docDuoc.flatMap(t => t.kq.dong.flatMap(d => [d.slug, d.hoSo])).filter(Boolean));
    for (const t of docDuoc) t.kq.ngoaiLoTrinh = t.kq.ngoaiLoTrinh.filter(x => !troi.has(x));
  }
  // Nấc 1 của ADR 0025 (hồ sơ moc-la-chien-dich): hai cờ vàng, chỉ cảnh báo. «Đang mở» = ô bản đồ thuộc nhóm
  // đang làm hoặc chưa bắt đầu (NHOM_MO). Cờ việc-ngoài-mốc xét «kho dùng mốc» ở cấp KHO: một lộ trình có mốc là
  // mọi lộ trình của kho được xét (Hỏi-1, chủ kho duyệt 14/10). Cờ hồ-sơ-ngoài-kế-hoạch áp mọi kho khai lộ trình,
  // đặt một lần ở lộ trình đầu như các cờ cấp kho khác.
  const TEN = Object.fromEntries(sections || []); const tenMo = new Set(NHOM_MO.map(k => TEN[k]).filter(Boolean));
  if (docDuoc.some(t => t.kq.moc.length)) {
    for (const t of docDuoc) {
      const ganMa = new Set(t.kq.moc.flatMap(ganMoc));
      for (const d of t.kq.dong) {
        if (!d.coHoSo || !tenMo.has(d.chu) || ganMa.has(String(d._nhan))) continue;
        d.coHang.push(`hàng ${d._nhan}: đang mở vòng mà chưa thuộc mốc nào`);
        t.kq.co.push(d.coHang[d.coHang.length - 1]);
      }
    }
  }
  // Hồ sơ đã tự ghi mã việc (`lo_trinh_ma`) là đã nối — mã sai hay trùng có cờ riêng ở trên, không cờ chồng.
  const daNoi = new Set(nhan.map(n => n.slug));
  if (docDuoc.length) {
    for (const s of docDuoc[0].kq.ngoaiLoTrinh) {
      if (!daNoi.has(s) && NHOM_MO.includes(classify(path.join(root, '_acceptance', s), s).key)) dat(null, `hồ sơ ${s} đang mở mà không thuộc việc nào trong kế hoạch`);
    }
  }
  // Giờ máy (hồ sơ lo-trinh-gio-may): số đo các vòng + dự báo đóng băng đọc MỘT lần cho cả kho, gắn vào từng lộ trình bằng
  // thuộc tính KHÔNG liệt kê — JSON của --ra-soat / --ap / --mo-o không đổi byte.
  if (docDuoc.length) {
    const daGiaoKey = new Set(DA_GIAO_O);
    const doVong = GM.docDoVong(root, s => daGiaoKey.has(classify(path.join(root, '_acceptance', s), s).key));
    const duBaoDs = GM.docDuBao(root);
    for (const t of docDuoc) gangGioMay(t.kq, doVong, duBaoDs);
  }
  return { cacTep, nhan };
}
// Gắn `_gm` (không liệt kê) cho một lộ trình: ước mỗi hàng (nhớ theo hàng), số đo, dự báo đóng băng.
function gangGioMay(kq, doVong, duBaoDs) {
  const nho = new Map();
  const uoc = d => { if (!nho.has(d)) nho.set(d, GM.uocHang(d, doVong)); return nho.get(d); };
  const doCua = slug => doVong.find(v => v.slug === slug) || null;
  Object.defineProperty(kq, '_gm', { value: { doVong, duBao: duBaoDs, uoc, doCua }, enumerable: false, configurable: true });
}
// Dự báo đóng băng theo mốc của MỘT lộ trình (hồ sơ du-bao-dong-bang-theo-ma-moc): mỗi du-bao.json về đúng một mốc. Ứng
// viên: tên ngắn khớp nguyên văn `moc.ten` (đường RM6), hoặc mốc chung ≥ 1 mã với `moc.hang` lúc đóng băng — chỉ khi hồ sơ
// là hồ sơ của một hàng trong chính lộ trình này (cùng phép gắn hàng ↔ hồ sơ của cột trạng thái). Nhiều ứng viên: tên khớp
// nguyên văn > chung nhiều mã nhất > tên bỏ ngày khớp > đứng trước trong tệp. Dời / ghi đè ngày mục tiêu không làm mất dự
// báo. Nhớ bên trong `kq._gm` (không liệt kê) — JSON các lệnh khác không đổi byte.
const boNgayTen = t => chuoi(t).replace(/ \d{2}\/\d{2}$/, '');
function ganDuBao(kq) {
  if (kq._gm.theoMoc) return kq._gm.theoMoc;
  const cua = new Set(kq.dong.map(d => d.hoSo).filter(Boolean));
  const ten = kq.moc.map(m => tenNganMoc(m)); const tenBoNgay = kq.moc.map(m => tenMocTran(m));
  const maMoc = kq.moc.map(m => new Set(ganMoc(m)));
  const theoMoc = kq.moc.map(() => []);
  for (const x of kq._gm.duBao) {
    if (!x.moc) continue;
    const dongBang = (Array.isArray(x.moc.hang) ? x.moc.hang : []).map(String);
    const ung = [];
    kq.moc.forEach((m, i) => {
      const khop = x.moc.ten === ten[i];
      const giao = cua.has(x.slug) ? dongBang.filter(c => maMoc[i].has(c)).length : 0;
      if (khop || giao) ung.push({ i, khop: khop ? 1 : 0, giao, boNgay: boNgayTen(x.moc.ten) === tenBoNgay[i] ? 1 : 0 });
    });
    ung.sort((a, b) => b.khop - a.khop || b.giao - a.giao || b.boNgay - a.boNgay || a.i - b.i);
    if (ung.length) theoMoc[ung[0].i].push(x);
  }
  for (const ds of theoMoc) ds.sort((a, b) => a.ngay_tinh.localeCompare(b.ngay_tinh) || a.slug.localeCompare(b.slug));
  kq._gm.theoMoc = theoMoc;
  return theoMoc;
}
// Dự báo đóng băng sớm nhất của một mốc; không có → null.
function duBaoDongBang(kq, m) {
  const i = kq.moc.indexOf(m);
  return i < 0 ? null : (ganDuBao(kq)[i][0] || null);
}
// Hàng của lộ trình theo dạng lớp ngày cần: đã giao / đang dở do bên vẽ phân nhóm.
const hangGioMay = (kq, nhom) => kq.dong.map(d => Object.assign(Object.create(d), { daGiao: kq.daGiao.has(d.chu), dangDo: nhomTienDo(d.chu, kq, nhom) === 'dang-lam' }));
// Lối cũ của lát 1 (một lộ trình): phần tử đầu.
export function phanTich(opts) {
  const k = phanTichKho(opts);
  return k == null ? null : k.cacTep[0];
}
export function veTrang(opts) {
  const k = phanTichKho(opts);
  if (k == null) return null;
  return veHtml(k.cacTep, opts.sections, opts.tinHieu ?? null);
}
// Thẻ start: dữ liệu từng lộ trình (`ds`) và CÁC DÒNG THẺ dựng sẵn (`dong`) — thân /start in nguyên,
// không tự soạn (kit render, không soạn; phép đo đo đầu ra thay vì đo chữ chỉ dẫn).
// `slugGiu`: slug các hàng một đợt Điều phối – Thợ đang giữ — hàng kế thuộc đó vẫn hiện chữ, nhưng
// `thamSo` null nên thẻ không mời mở nó lần thứ hai.
export function loTrinhThe({ root, classify, sections, today, banDoBat = null, lenhVe = null, slugGiu = null }) {
  const k = phanTichKho({ root, classify, sections });
  if (k == null) return null;
  const nhieu = k.cacTep.length > 1;
  const giu = new Set(slugGiu || []);
  const slugKe = kq => {
    const d = kq.hangKe ? kq.dong.find(x => x._nhan === kq.hangKe.ma) : null;
    return d ? (chuoi(d.slug) || suySlug(d.cau_giao)) : null;
  };
  const ds = k.cacTep.map(p => {
    if (p.loi) return { tep: p.tep, ten: null, loi: p.loi, hangKe: null, hangTre: [], mocKhongHang: { k: 0, n: 0 }, tinTheoLoi: { n: 0, tong: 0 }, tuKhaiNgoai: 0, co: [] };
    const kq = p.kq;
    return {
      tep: p.tep, ten: kq.ten || null, loi: null,
      hangKe: kq.hangKe ? { ma: kq.hangKe.ma, cauGiao: kq.hangKe.cauGiao, thamSo: giu.has(slugKe(kq)) ? null : thamSoKe(kq, p.tep, nhieu) } : null,
      hangTre: hangTre(kq, today), mocKhongHang: mocKhongHang(kq), tinTheoLoi: kq.tinTheoLoi, tuKhaiNgoai: kq.tuKhaiNgoai, co: kq.co,
    };
  });
  // Rà soát (hồ sơ ra-soat-lo-trinh): khoá `raSoat` CHỈ có khi khác rỗng — kho không có đề xuất giữ thẻ từng byte.
  const rs = raSoat({ root, cacTep: k.cacTep, sections, today });
  ds.forEach((t, i) => { if (rs[i] && rs[i].de_xuat.length) t.raSoat = rs[i].de_xuat; if (rs[i] && rs[i].canh_bao) t.raSoatCanh = rs[i].canh_bao; });
  // Tự áp (hồ sơ ap-chinh-sach-lo-trinh): khoá `tuAp` CHỈ có khi chiến dịch đang chạy bật tự áp và có việc báo trước hay
  // vừa áp; `nhacChinhSach` CHỈ có khi có chiến dịch đang chạy chưa bật mà rà soát có đề xuất — kho khác giữ thẻ từng byte.
  const ap = apChinhSach({ root, cacTep: k.cacTep, sections, today, ghi: false });
  ds.forEach((t, i) => {
    const a = ap[i]; const kq = k.cacTep[i].kq; if (!a || !kq) return;
    if (a.chinh_sach && a.chinh_sach.tu_ap) { if (a.bao_truoc.length || a.da_ap.length) t.tuAp = { bao_truoc: a.bao_truoc, da_ap: a.da_ap }; }
    else if (t.raSoat) { const cd = chienDichDangChay(kq.moc, today); if (cd) t.nhacChinhSach = tenNganMoc(cd.m); }
  });
  const dongTu = t => {
    if (!t.tuAp) return t.nhacChinhSach ? [`  ! chiến dịch ${t.nhacChinhSach} chưa khai chính sách tự áp — chỉ cờ`] : [];
    const sm = t.tuAp.bao_truoc.map(m => m.ap_tu).sort()[0];
    return [`Tự áp: ${t.tuAp.bao_truoc.length} báo trước${sm ? ` (áp từ ${ddmmyyyy(sm)})` : ''} · ${t.tuAp.da_ap.length} đã áp 7 ngày qua`,
      ...dongTuAp(t.tuAp).slice(0, 3)];
  };
  const dongRs = t => {
    if (!t.raSoat) return [];
    const dem = x => t.raSoat.filter(m => m.de_xuat === x).length;
    const ra = [`Rà soát: ${t.raSoat.length} đề xuất — ${dem('doi-moc')} dời mốc · ${dem('cho-dieu-kien')} chờ điều kiện · ${dem('bac')} bác`];
    ra.push(...t.raSoat.slice(0, 5).map(dongRaSoat));
    if (t.raSoat.length > 5) ra.push(`  … còn ${t.raSoat.length - 5} — xem: ${LENH_RA_SOAT}`);
    return ra;
  };
  const dong = [];
  for (const t of ds) {
    if (nhieu) dong.push(`Lộ trình ${t.ten || t.tep}:`);
    if (t.loi) { dong.push(`${nhieu ? 'K' : 'Lộ trình: k'}hông đọc được tệp ý định — ${t.loi}`); continue; }
    // Lộ trình 0 việc (hồ sơ kho-moi-cai-goi-road-map — tệp vừa khởi tạo): chỉ việc kế thay vì «chưa đủ điều kiện».
    const rong = (k.cacTep[ds.indexOf(t)]?.kq?.dong || [null]).length === 0;
    dong.push(t.hangKe ? `Hàng kế: ${t.hangKe.ma} — ${t.hangKe.cauGiao}` : rong ? `Hàng kế: ${CHUA_CO_VIEC}` : 'Hàng kế: chưa có hàng đủ điều kiện mở');
    const tre = t.hangTre.length ? `Hàng trễ: ${t.hangTre.map(h => `${h.ma} (mốc ${h.moc}, ${h.ngay})`).join(' · ')}` : 'Hàng trễ: không có';
    dong.push(t.mocKhongHang.k > 0 ? `${tre} (${t.mocKhongHang.k}/${t.mocKhongHang.n} mốc không gắn hàng nào)` : tre);
    dong.push(`Tin theo lời: ${t.tinTheoLoi.n}/${t.tinTheoLoi.tong} hàng${t.tuKhaiNgoai > 0 ? ` · ${t.tuKhaiNgoai} hàng tự khai ngoài từ vựng — không so được với hồ sơ` : ''}`);
    dong.push(...dongRs(t), ...(t.raSoatCanh || []).map(c => (t.raSoat ? `  ! ${c}` : `Rà soát: ${c}`)), ...dongTu(t));
    if (t.co.length) dong.push(`Lộ trình có ${t.co.length} cờ — xem trang lộ trình`);
    for (const c of t.co) { const d = dichCo(c); if (CO_PHAT_TRIEN.includes(d.ten)) dong.push(`  ! ${d.chu}`); }
  }
  const trang = path.join(root, TEP_TRANG);
  const trangCo = existsSync(trang);
  dong.push(trangCo ? `Trang lộ trình: [${TEP_TRANG}](${trang})` : `Trang lộ trình chưa được vẽ — vẽ bằng: \`${lenhVe || 'node scripts/product-map.mjs --root .'}\``);
  if (banDoBat === false) dong.push('⚠ Lộ trình đã khai nhưng bản đồ sản phẩm chưa bật — bốn lệnh đóng cổng sẽ không vẽ lại trang; bật bằng hai dòng trong `_acceptance/config.yaml`');
  // Đường đọc-cũ: khoá phẳng của lát 1 mang lộ trình ĐẦU, nguyên hình dạng cũ — bộ đọc đời trước
  // không phải đổi; khoá mới (`trang`, `trangCo`, `ds`, `dong`) nằm cạnh.
  const d0 = ds[0];
  const cu = { tep: d0.tep, ten: d0.ten, loi: d0.loi, hangKe: d0.hangKe ? { ma: d0.hangKe.ma, cauGiao: d0.hangKe.cauGiao } : null, hangTre: d0.hangTre, tinTheoLoi: d0.tinTheoLoi, tuKhaiNgoai: d0.tuKhaiNgoai, co: d0.co };
  return { ...cu, trang, trangCo, ds, dong };
}

// ── Tên phiên và nhóm thanh bên theo mốc (hồ sơ moc-la-chien-dich) ──────────────
// Mốc là chiến dịch: một vòng = một hàng = một mốc; thanh bên là mỏ neo của chiến dịch đang chạy. MỘT hàm sinh
// tên — lệnh mở việc (`--mo-o`) in nó, phiên trên app đặt tên + xếp nhóm bằng nó (SKILL feature-loop, khối
// S0-TEN-CHIEN-DICH). Chỗ nối cho gói dieu-phoi (M5): chip gọi `tenChienDich` + `tenKho` thay vì đặt tên tay.
// Tên kho = thư mục của bản checkout CHÍNH (cha của git-common-dir) — phiên trong worktree tên ngẫu nhiên vẫn ra
// đúng kho; không phải kho git → tên thư mục gốc.
export function tenKho(root) {
  try {
    const d = execFileSync('git', ['-C', root, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).trim();
    if (d) return path.basename(path.dirname(d));
  } catch { /* không phải kho git */ }
  return path.basename(path.resolve(root));
}
const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAU_TACH_MOC = [' — ', ' (', '; ', ': '];
export function tenNganMoc(m) {
  let t = chuoi(m && m.ten_ngan);
  if (!t) {
    t = chuoi(m && m.ten);
    const cat = DAU_TACH_MOC.map(x => t.indexOf(x)).filter(i => i > 0);
    if (cat.length) t = t.slice(0, Math.min(...cat)).trim();
  }
  const ngay = chuoi(m && m.ngay);
  return NGAY_RE.test(ngay) ? `${t} ${ngay.slice(8, 10)}/${ngay.slice(5, 7)}` : t;
}
const tenNganHang = h => {
  const n = chuoi(h.ten_ngan) || chuoi(h.ten); if (n) return n;
  const tu = HS.boNgoacNgoai(chuoi(h.cau_giao)).split(/\s+/).filter(Boolean);
  return tu.length > 6 ? `${tu.slice(0, 6).join(' ')}…` : tu.join(' ');
};
const tenNganLoTrinh = (data, tep) => chuoi(data && data.ten_ngan) || chuoi(data && data.ten)
  || path.basename(String(tep || '')).replace(/\.json$/, '').replace(/^lo-trinh-/, '');
// Mốc của hàng: các mốc của CHÍNH lộ trình có mã hàng; nhiều mốc → ngày sớm nhất, cùng ngày → đứng trước trong tệp.
export function mocCuaHang(ma, moc) {
  const co = (Array.isArray(moc) ? moc : []).map((m, i) => ({ m, i })).filter(({ m }) => ganMoc(m).includes(chuoi(ma)));
  co.sort((a, b) => chuoi(a.m.ngay).localeCompare(chuoi(b.m.ngay)) || a.i - b.i);
  return co.length ? co[0].m : null;
}
// `hang`: hàng của tệp lộ trình · `moc`: mốc của CÙNG tệp · `loTrinh`: object gốc của tệp (đọc ten_ngan/ten) ·
// `tep`: đường tệp · `nhieuLoTrinh`: kho khai ≥2 tệp · `kho`: tên kho (tenKho). Thuần — không đọc đĩa.
export function tenChienDich({ hang, moc, loTrinh = null, tep = '', nhieuLoTrinh = false, kho }) {
  const m = mocCuaHang(hang.ma, moc);
  const mocNgan = m ? tenNganMoc(m) : null;
  return {
    moc: m ? { ten: chuoi(m.ten), ngay: chuoi(m.ngay), ten_ngan: mocNgan } : null,
    ten_phien: `${chuoi(hang.ma)} · ${tenNganHang(hang)} (${kho})`,
    nhom: m ? (nhieuLoTrinh ? `${tenNganLoTrinh(loTrinh, tep)} · ${mocNgan}` : mocNgan) : null,
  };
}

// ── Mở ô cơ hội từ hàng (feature-loop S0) ─────────────────────────────────────
// Slug suy TẤT ĐỊNH từ câu giao: bỏ dấu, đ→d, chữ thường, ký tự khác chữ-số thành «-», sáu từ đầu.
export function suySlug(cauGiao) {
  const tu = String(cauGiao || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  return tu.slice(0, 6).join('-');
}
const KHUON_OPP = path.join(__dirname, '..', 'skills', 'acceptance', 'references', 'opportunity-template.md');
const khoiKhuon = (txt, ten) => { const m = String(txt).match(new RegExp(`<!-- <<<${ten} -->\\n([\\s\\S]*?)<!-- ${ten}>>> -->`)); return m ? m[1] : null; };
const giaTriYaml = v => { const t = String(v ?? '').replace(/\s+/g, ' ').trim(); return /(^[\[{>|&*!%@`"'#-])|(\s#)|(: )/.test(t) ? JSON.stringify(t) : t; };
// Dựng ô cơ hội từ khuôn đọc LÚC CHẠY (khối OPP-FRONTMATTER-TEMPLATE + OPP-DE-XUAT-PREFIX): bên ghi và
// bộ phân loại ngưỡng rút từ cùng một khuôn. Ngưỡng chỉ đề xuất từ dữ liệu của hàng: SỐNG = bat_khi,
// Timebox = ngày mốc có ngày đầu tiên chứa hàng; thiếu căn cứ thì «…» — máy không bịa hạn.
// `dongNguon` (hồ sơ o-mo-viec-mang-nguon): dòng «Nguồn:» bên CLI dựng sẵn, chèn ngay sau dòng «Mở từ hàng …»; null → như cũ.
export function dungCoHoi({ khuon, hang, tep, tenLoTrinh, slug, owner, moc = [], khoDungMoc = false, dongNguon = null }) {
  // Luật ô ngưỡng (tiêu đề section, nhãn bốn dòng, tiền tố đề xuất) chỉ sống ở lib — nạp LƯỜI ở
  // đây: bộ vẽ ở kho tiêu thụ chép mô-đun này mà không chép lib đó, và chỉ lối CLI dùng tới nó.
  const NG = require(path.join(__dirname, '..', 'lib', 'nguong-o-co-hoi.cjs'));
  const fm = khoiKhuon(khuon, 'OPP-FRONTMATTER-TEMPLATE');
  if (fm == null) throw new Error('khuôn ô cơ hội thiếu khối OPP-FRONTMATTER-TEMPLATE');
  const dx = NG.prefixFromTemplate(khuon, 'OPP-DE-XUAT-PREFIX');
  const nhan = NG.thresholdLabels(khuon);
  const tim = re => nhan.find(l => re.test(l));
  const [lHoi, lSong, lChet, lHan] = [tim(/Câu hỏi/), tim(/SỐNG/), tim(/CHẾT/), tim(/Timebox/)];
  if (!lHoi || !lSong || !lChet || !lHan || nhan.length !== 4) throw new Error(`khuôn ô cơ hội có nhãn ngưỡng lạ: ${JSON.stringify(nhan)}`);
  const dien = { slug, feature: giaTriYaml(hang.cau_giao), owner: giaTriYaml(owner || ''), stage: 'discovery', decision: '', decided_by: '', decided_at: '', base_commit: '', disposition: '' };
  let yaml = fm.replace(/^```yaml\n/, '').replace(/```\s*$/, '');
  yaml = yaml.replace(/\{(\w+)\}/g, (m, k) => (k in dien ? dien[k] : m));
  yaml = yaml.replace(/\n---\n?$/, `\nlo_trinh_ma: ${giaTriYaml(hang.ma)}\nlo_trinh_tep: ${giaTriYaml(tep)}\n---\n`);
  const batKhi = chuoi(hang.bat_khi);
  const m = moc.find(x => /^\d{4}-\d{2}-\d{2}$/.test(chuoi(x.ngay)) && Array.isArray(x.hang) && x.hang.map(chuoi).includes(chuoi(hang.ma)));
  const coMoc = !!(batKhi && m);
  const giaTri = {
    [lHoi]: batKhi ? `${dx} đã đạt «${batKhi}» chưa?` : '…',
    [lSong]: batKhi ? `${dx} ${batKhi}` : '…',
    [lChet]: batKhi ? `${dx} chưa đạt «${batKhi}» khi hết timebox` : '…',
    [lHan]: coMoc ? `${dx} ${chuoi(m.ngay)} (mốc ${chuoi(m.ten) || chuoi(m.ngay)})` : '…',
  };
  const nguong = nhan.map(l => `- ${l}: ${giaTri[l]}`);
  const than = [
    '', '## Vấn đề & ai gặp', '',
    `Mở từ hàng ${chuoi(hang.ma)} của «${tenLoTrinh || 'lộ trình'}» (\`${tep}\`).`,
    ...(dongNguon ? [dongNguon] : []),
    // moc-la-chien-dich AC-8: kho dùng mốc → một dòng mốc cho người đọc ô ở Cổng Đáng; kho không mốc → như cũ.
    ...(khoDungMoc ? [(() => { const mm = mocCuaHang(hang.ma, moc); return mm
      ? `Mốc: ${chuoi(mm.ten) || chuoi(mm.ngay)} — ${NGAY_RE.test(chuoi(mm.ngay)) ? ngayVN(mm.ngay) : chuoi(mm.ngay) || 'chưa có ngày'}.`
      : 'Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.'; })()] : []), '',
    chuoi(hang.cau_giao), ...(chuoi(hang.vi_sao) ? ['', `Vì sao: ${chuoi(hang.vi_sao)}`] : []), '',
    `## ${NG.UAT_THRESHOLD_HEADING}`, '', ...nguong, '',
  ];
  return yaml + than.join('\n');
}

// ── CLI: feature-loop S0 nhận một hàng ────────────────────────────────────────
// ── Rà soát (hồ sơ ra-soat-lo-trinh, hàng RM1 — vòng 1 của gói road-map) ─────────────────────────
// Chỉ đọc, chỉ cờ: máy đề xuất (dời mốc · chờ điều kiện · bác) kèm căn cứ, không ghi tệp lộ trình. Phụ thuộc HÔM NAY
// (mốc qua ngày, tuổi hàng) nên chỉ ra thẻ start và lệnh --ra-soat, KHÔNG vào trang (trang tất định — --check so byte).
// Thứ tự luật cố định, luật đầu khớp thắng: xếp lại → đã bác → mốc qua ngày → tuổi → trần. Mốc chiến dịch CHỈ là
// `loai: phat-hanh` — mốc của người (ngoai, han, han-cung, su-kien, không khai loai) không kích hoạt.
// Lệnh «xem» trên thẻ: đường suy từ vị trí bộ máy (cùng nếp lệnh vẽ trang của start-scan) — kho tiêu thụ không có scripts/.
export const LENH_RA_SOAT = `node "${path.join(__dirname, 'lo-trinh.mjs')}" --root . --ra-soat`;
// Rà soát không bao giờ im khi không đọc được (Cổng Bằng chứng 15/10): hai câu cảnh báo dùng chung cho JSON, lệnh, thẻ.
export const CANH_TUOI = 'không đọc được tuổi hàng — luật tuổi không chạy';
export const CANH_CUT = 'lịch sử cụt — tuổi hàng là tuổi tối thiểu';
export const LUAT_RA_SOAT = ['xep-lai', 'ho-so-bac', 'moc-qua-ngay', 'tuoi', 'tran'];
const DE_XUAT_CHU = { 'doi-moc': 'dời mốc', 'cho-dieu-kien': 'chờ điều kiện', bac: 'bác' };
const MOC_CHIEN_DICH = m => chuoi(m.loai) === 'phat-hanh';
const ddmmyyyy = s => (NGAY_RE.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s);
const tenMocTran = m => tenNganMoc({ ...m, ngay: '' });
// Câu căn cứ của một đề xuất — MỘT nguồn cho dòng rà soát và cho lý do máy ghi khi tự áp.
export function cauCanCu(m) {
  const c = m.can_cu;
  return m.luat === 'moc-qua-ngay' ? `mốc «${c.moc}» đã qua ngày ${ddmmyyyy(c.ngay)}`
    : m.luat === 'xep-lai' ? (c.nguon === 'ho-so' ? `hồ sơ ${c.ho_so} đã xếp lại` : `kế hoạch tự khai «${c.chu}»`)
      : m.luat === 'ho-so-bac' ? `hồ sơ ${c.ho_so} đã bác`
        : m.luat === 'tuoi' ? `${c.tuoi} ngày chưa ai sửa (lần cuối ${ddmmyyyy(c.cham_cuoi.ngay)})`
          : `«Kế tiếp» có ${c.k} việc, trần ${c.tran}`;
}
export function dongRaSoat(m) {
  return `  · ${m.ma} — ${DE_XUAT_CHU[m.de_xuat]}: ${cauCanCu(m)}`;
}
// Tuổi hàng: lần cuối hàng được CHẠM trong lịch sử git của tệp lộ trình (tới HEAD). Chạm = đổi trường nào trừ `ma`, hoặc
// đổi tập mốc chứa hàng. Danh tính đi theo câu giao: đổi mã đơn thuần không chạm (crm V0–V8 → DA0–DA8). Đổi CẢ mã lẫn câu
// giao trong một commit = hàng mới. Tín hiệu nối vào hàng CHƯA tính là chạm (giới hạn khai). Clone nông → `cut`.
const khopHang = (p, r) => (p.ma === r.ma && p.cau === r.cau) ? 3 : (p.cau === r.cau ? 2 : (p.ma === r.ma ? 1 : 0));
// `hong`: lý do không đọc được tuổi (không phải kho git · có commit mà không đọc được phiên bản nào) — bên gọi cảnh báo.
export function tuoiHang(root, tep) {
  const theoMa = new Map(); let cut = false; let log = '';
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
  try {
    cut = g('rev-parse', '--is-shallow-repository').trim() === 'true';
    log = g('log', '--reverse', '--format=%H %cI', '--', tep);
  } catch { return { cut, theoMa, hong: 'không phải kho git' }; }
  let truoc = []; let docDuoc = 0; let soCommit = 0;
  for (const dong of log.split('\n').filter(Boolean)) {
    const [sha, iso] = dong.split(' '); const ngay = new Date(iso).toISOString().slice(0, 10); soCommit += 1;
    // `./` — đường tính từ `--root` như `git log` ở trên, không từ gốc kho (lộ trình trong thư mục con).
    let data; try { data = JSON.parse(g('show', `${sha}:./${tep}`).replace(/^﻿/, ''));  docDuoc += 1; } catch { continue; }
    if (data == null || typeof data !== 'object') continue;
    const moc = (Array.isArray(data.moc) ? data.moc : []).filter(m => m && typeof m === 'object');
    const mocCua = ma => moc.filter(m => ganMoc(m).includes(ma)).map(m => chuoi(m.ten)).sort().join('|');
    const conLai = [...truoc]; const nay = [];
    for (const r of (Array.isArray(data.hang) ? data.hang : []).filter(x => x && typeof x === 'object' && !Array.isArray(x))) {
      const { ma: _ma, ...than } = r; const ma = chuoi(r.ma); const cau = chuoi(r.cau_giao);
      const sig = JSON.stringify(Object.keys(than).sort().map(k => [k, than[k]])); const ms = mocCua(ma);
      let best = -1; let diem = 0;
      conLai.forEach((p, i) => { const d = khopHang(p, { ma, cau }); if (d > diem) { diem = d; best = i; } });
      const p = best >= 0 ? conLai.splice(best, 1)[0] : null;
      nay.push({ ma, cau, sig, ms, cham: !p || p.sig !== sig || p.ms !== ms ? { ngay, sha } : p.cham });
    }
    truoc = nay;
  }
  for (const p of truoc) if (p.ma) theoMa.set(p.ma, p.cham);
  // RM1 Ngoài-3 (hồ sơ ap-chinh-sach-lo-trinh): tệp có trên đĩa mà chưa từng vào lịch sử git → nói ra, không im.
  if (!soCommit && existsSync(path.join(root, tep))) return { cut, theoMa, hong: 'tệp lộ trình chưa từng commit' };
  return { cut, theoMa, ...(soCommit && !docDuoc ? { hong: 'không đọc được phiên bản nào trong lịch sử git' } : {}) };
}
const soNgay = (tu, den) => Math.round((Date.UTC(+den.slice(0, 4), +den.slice(5, 7) - 1, +den.slice(8, 10)) - Date.UTC(+tu.slice(0, 4), +tu.slice(5, 7) - 1, +tu.slice(8, 10))) / 864e5);
// Chiến dịch đang chạy (hồ sơ ap-chinh-sach-lo-trinh): mốc `phat-hanh` có ngày ≥ hôm nay gần nhất; cùng ngày → đứng trước.
export function chienDichDangChay(moc, today) {
  let best = null;
  (Array.isArray(moc) ? moc : []).forEach((m, i) => {
    const ngay = chuoi(m && m.ngay);
    if (!MOC_CHIEN_DICH(m) || !NGAY_RE.test(ngay) || ngay < today) return;
    if (!best || ngay < best.ngay) best = { m, i, ngay };
  });
  return best ? { m: best.m, i: best.i } : null;
}
// Chính sách hiệu lực: lớp tệp (RM1, chỉ cờ) dưới, lớp chiến dịch đang chạy trên. `tu_ap` CHỈ từ mốc. null = không lớp nào.
export function chinhSachHieuLuc(kq, today) {
  const cd = chienDichDangChay(kq.moc, today);
  const csM = cd && kq.mocChinhSach ? kq.mocChinhSach.get(cd.i) || null : null;
  const csT = kq.chinhSach || null;
  if (!csM && !csT) return null;
  return {
    tu_ap: !!(csM && csM.tu_ap), tuoi_ngay: csM?.tuoi_ngay ?? csT?.tuoi_ngay ?? null, tran_ke_tiep: csM?.tran_ke_tiep ?? csT?.tran_ke_tiep ?? null,
    nhip_ngay: csM?.nhip_ngay ?? 1, tran_ap: csM?.tran_ap ?? 5, moc: cd ? tenNganMoc(cd.m) : null,
  };
}
// `cacTep` = phanTichKho(...).cacTep. Trả mỗi lộ trình { tep, ten, de_xuat, lich_su_cut? } theo thứ tự hàng trong tệp.
export function raSoat({ root, cacTep, sections, today }) {
  const TEN = Object.fromEntries(sections || []);
  const daGiao = new Set(DA_GIAO_O.map(k => TEN[k]));
  const chuaLam = new Set([CHUA_MO, ...CHUA_LAM_O.map(k => TEN[k])]);
  return cacTep.map(t => {
    if (!t.kq) return { tep: t.tep, ten: null, de_xuat: [], loi: t.loi || 'không đọc được' };
    const kq = t.kq; const out = []; const keTiep = [];
    const mocCD = kq.moc.filter(MOC_CHIEN_DICH);
    const qua = mocCD.filter(m => NGAY_RE.test(chuoi(m.ngay)) && chuoi(m.ngay) < today);
    const trongCD = new Set(mocCD.flatMap(ganMoc));
    for (const d of kq.dong) {
      const ma = String(d._nhan);
      if (d.chu === KHONG_SUY) continue;
      const da = daGiao.has(d.chu);
      const g = { ma, cau_giao: chuoi(d.cau_giao) };
      if (d.chu === TEN['xep-lai']) { out.push({ ...g, de_xuat: 'cho-dieu-kien', luat: 'xep-lai', can_cu: d.coHoSo ? { nguon: 'ho-so', ho_so: d.hoSo } : { nguon: 'tu-khai', chu: d.tuKhai } }); continue; }
      if (d.chu === TEN['da-bac'] && d.coHoSo) { out.push({ ...g, de_xuat: 'bac', luat: 'ho-so-bac', can_cu: { ho_so: d.hoSo, o: d.chu } }); continue; }
      // Hồ sơ nào khác (đang mở, hỏng, đã giao) — không đụng: hàng có hồ sơ đang mở đã hiện ở dòng «Hàng trễ».
      if (d.coHoSo) continue;
      const m = !da && chuaLam.has(d.chu) ? qua.find(x => ganMoc(x).includes(ma)) : null;
      if (m) { out.push({ ...g, de_xuat: 'doi-moc', luat: 'moc-qua-ngay', can_cu: { moc: tenMocTran(m), ngay: chuoi(m.ngay) } }); continue; }
      // «Kế tiếp» = việc CHƯA BẮT ĐẦU (chưa mở · cân nhắc · sắp mở) — hàng tự khai bác/đang làm/ngoài phạm vi không đếm.
      if (!trongCD.has(ma) && chuaLam.has(d.chu)) keTiep.push(g);
    }
    const cs = chinhSachHieuLuc(kq, today); let cut = false; const canh = [];
    // Luật tuổi/trần chạy khi tệp khai chính sách (như RM1) hoặc chiến dịch đang chạy khai một trong hai ngưỡng.
    if (cs && keTiep.length && (kq.chinhSach || cs.tuoi_ngay != null || cs.tran_ke_tiep != null)) {
      const th = tuoiHang(root, t.tep); cut = th.cut;
      if (th.hong) canh.push(`${CANH_TUOI} (${th.hong})`);
      const conLai = [];
      for (const g of keTiep) {
        const ch = th.theoMa.get(g.ma) || null; const tuoi = ch ? soNgay(ch.ngay, today) : null;
        if (cs.tuoi_ngay != null && tuoi != null && tuoi >= cs.tuoi_ngay) out.push({ ...g, de_xuat: 'cho-dieu-kien', luat: 'tuoi', can_cu: { tuoi, cham_cuoi: ch } });
        else conLai.push({ g, tuoi });
      }
      if (cs.tran_ke_tiep != null && conLai.length > cs.tran_ke_tiep) {
        const thu = new Map(keTiep.map((g, i) => [g.ma, i]));
        conLai.sort((a, b) => (b.tuoi ?? -1) - (a.tuoi ?? -1) || thu.get(a.g.ma) - thu.get(b.g.ma));
        for (const { g } of conLai.slice(0, conLai.length - cs.tran_ke_tiep)) out.push({ ...g, de_xuat: 'cho-dieu-kien', luat: 'tran', can_cu: { k: keTiep.length, tran: cs.tran_ke_tiep } });
      }
    }
    if (cut) canh.push(CANH_CUT);
    // Luật moc-chua-khep (hồ sơ road-map-de-dung, AC-9; hạt giống 2026-10-17-hat-giong-ra-soat-khong-xet-moc-qua-ngay): mốc có
    // ngày hợp lệ đã qua, chưa ghi ngày khép (`that`), và không còn việc mở (không gắn việc, hoặc mọi việc đã giao) → MỘT dòng
    // gom, ≤ 5 tên rồi «…». Mốc còn việc mở giữ luật moc-qua-ngay; mốc ngoài đã có cờ của bộ đọc chung. Phụ thuộc hôm nay nên
    // chỉ ở bản xem chữ và thẻ khởi động, không lên trang.
    const theoNhanRs = new Map(kq.dong.map(d => [String(d._nhan), d]));
    const khep = kq.moc.filter(m => chuoi(m.loai) !== 'ngoai' && NGAY_RE.test(chuoi(m.ngay)) && chuoi(m.ngay) < today && !chuoi(m.that)
      && ganMoc(m).map(x => theoNhanRs.get(x)).filter(Boolean).every(d => daGiao.has(d.chu))).map(tenNganMoc);
    // Tên ngắn (AC-5, chủ kho «Rà soát cảnh báo hàng thiếu ten_ngan»): tên phiên và nhóm thanh bên rút từ `ten_ngan`; vắng thì
    // rút gọn câu giao — một dòng gom ở khối Rà soát (≤ 8 mã rồi «…»), không lên trang. Chỉ nhắc kho ĐÃ dùng tên ngắn (≥ 1 việc
    // có) mà còn sót — kho chưa từng dùng không bị nhắc (luật cân trên mọi kho).
    const thieuTen = kq.dong.some(d => chuoi(d.ten_ngan)) ? kq.dong.filter(d => !chuoi(d.ten_ngan)).map(d => String(d._nhan)) : [];
    if (thieuTen.length) { const u = [...new Set(thieuTen)]; canh.push(`${u.length} việc chưa có tên ngắn — tên phiên đang rút gọn tên việc: ${u.slice(0, 8).join(', ')}${u.length > 8 ? ', …' : ''}`); }
    if (khep.length) { const u = [...new Set(khep)]; canh.push(`${u.length} mốc đã qua ngày, chưa ghi ngày khép: ${u.slice(0, 5).join(', ')}${u.length > 5 ? ', …' : ''}`); }
    const thuTu = new Map(kq.dong.map((d, i) => [String(d._nhan), i]));
    out.sort((a, b) => thuTu.get(a.ma) - thuTu.get(b.ma));
    return { tep: t.tep, ten: kq.ten || null, de_xuat: out, ...(cut ? { lich_su_cut: true } : {}), ...(canh.length ? { canh_bao: canh } : {}) };
  });
}

// ── Tự áp chính sách (hồ sơ ap-chinh-sach-lo-trinh) ────────────────────────────────────────────────────────────────
// Bộ ghi CÙNG tệp với bộ đọc (B′ §11 ràng buộc (i)). Chỉ ghi khi tệp đúng từng byte dạng `JSON.stringify(…, null, 2)` + xuống
// dòng — điều kiện ấy bắt mọi ca JS đổi byte (thụt khác, BOM, khoá dạng số đổi thứ tự). Thao tác chỉ gỡ/chèn phần tử mảng
// nên thứ tự khoá và khoá lạ giữ nguyên. Ghi tệp tạm rồi đổi tên.
export const LOI_DANG = tep => `tệp lộ trình không ở dạng chuẩn — máy không ghi: ${tep}`;
export function dangChuan(txt) { try { return JSON.stringify(JSON.parse(txt), null, 2) + '\n' === txt; } catch { return false; } }
export function ghiLoTrinh(p, data) { const t = `${p}.tam-${process.pid}`; writeFileSync(t, JSON.stringify(data, null, 2) + '\n'); renameSync(t, p); }

// Sổ tự áp: `<tệp>.so.jsonl` cạnh tệp lộ trình, chỉ thêm dòng. Dòng TẤT ĐỊNH (ngày không giờ, khoá theo thứ tự cố định,
// không đường dẫn) — hai máy áp cùng ngày trên cùng nội dung ra cùng byte nên gộp nhánh không xung đột.
export const tepSo = tep => String(tep).replace(/\.json$/, '') + '.so.jsonl';
const KHOA_SO = ['ngay', 'loai', 'ma', 'de_xuat', 'luat', 'can_cu', 'ap_tu', 'vi_tri', 'dich', 'tao_khoi', 'hang_goc', 'tep_truoc', 'lenh_tra_lai', 'boi'];
const dongSo = d => JSON.stringify(Object.fromEntries(KHOA_SO.filter(k => d[k] !== undefined).map(k => [k, d[k]])));
export function docSo(root, tep) {
  const txt = doc(path.join(root, tepSo(tep))); if (txt == null) return { dong: [], hong: 0 };
  const dong = []; let hong = 0;
  for (const l of txt.split('\n')) {
    if (!l.trim()) continue;
    try { const o = JSON.parse(l); if (o && typeof o === 'object' && !Array.isArray(o)) dong.push(o); else hong += 1; } catch { hong += 1; }
  }
  return { dong, hong };
}
export function ghiSo(root, tep, moi) { if (moi.length) appendFileSync(path.join(root, tepSo(tep)), moi.map(d => dongSo(d) + '\n').join('')); }
// Phát lại sổ theo thứ tự dòng: báo trước đang chờ · lần áp cuối chưa trả · đề xuất vừa bị trả (chặn tới khi đổi) · ghim.
export function phatLai(dong) {
  const cho = new Map(); const daAp = new Map(); const traLai = new Map(); const ghim = new Set();
  for (const d of dong) {
    const ma = chuoi(d.ma);
    if (d.loai === 'bao-truoc') { cho.set(ma, d); traLai.delete(ma); }
    else if (d.loai === 'huy') cho.delete(ma);
    else if (d.loai === 'ap') { cho.delete(ma); daAp.set(ma, d); }
    else if (d.loai === 'tra-lai') { daAp.delete(ma); traLai.set(ma, { de_xuat: d.de_xuat, luat: d.luat }); }
    else if (d.loai === 'ghim') ghim.add(ma);
    else if (d.loai === 'bo-ghim') ghim.delete(ma);
  }
  return { cho, daAp, traLai, ghim };
}
const congNgay = (d, n) => new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10) + n)).toISOString().slice(0, 10);
const laObj = m => (m && typeof m === 'object' && !Array.isArray(m) ? m : {});
const KHOI_DICH = { 'cho-dieu-kien': 'chan_troi', bac: 'da_bac' };
export const LENH_TRA_LAI = ma => `/road-map:tra-lai ${ma}`;
// Mục máy chuyển vào `chan_troi` / `da_bac`: hàng gốc + lý do (câu căn cứ) + mở lại khi + dấu `tu_ap`. MỘT hàm dựng cho lúc áp
// và lúc trả lại kiểm «mục đã bị sửa chưa».
function mucMay(hangGoc, e, ngay, khoi) {
  const cau = cauCanCu(e); const muc = { ...hangGoc };
  if (muc.ly_do === undefined) muc.ly_do = cau; else muc.ly_do_may = cau;
  if (khoi === 'chan_troi' && muc.mo_lai_khi === undefined) muc.mo_lai_khi = 'chủ kho trả lại, hoặc căn cứ đổi';
  muc.tu_ap = { ngay };
  return muc;
}
// Áp MỘT đề xuất lên `data` (object vừa đọc từ tệp). Trả phần sổ cần để trả lại: vị trí cũ, đích, hàng gốc. Hàng không có
// mã thật hay không còn trong `hang` → null, KHÔNG đụng tệp (S4-r1: splice(-1) từng xoá nhầm hàng cuối).
const viTriHang = (data, ma) => (Array.isArray(data.hang) ? data.hang : []).findIndex(h => laObj(h).ma !== undefined && chuoi(laObj(h).ma) === ma);
function apMot(data, e, cdI, ngay) {
  const ma = e.ma; const moc = Array.isArray(data.moc) ? data.moc : [];
  const idx = viTriHang(data, ma);
  if (idx < 0) return null;
  const hangGoc = data.hang[idx];
  const viTriMoc = []; moc.forEach((m, mi) => { const ds = Array.isArray(laObj(m).hang) ? m.hang : null; const k = ds ? ds.map(chuoi).indexOf(ma) : -1; if (k >= 0) viTriMoc.push({ moc: chuoi(m.ten), chi_so: mi, vt: k }); });
  if (e.de_xuat === 'doi-moc') {
    const go = viTriMoc.filter(v => v.chi_so !== cdI && MOC_CHIEN_DICH(laObj(moc[v.chi_so])) && chuoi(moc[v.chi_so].ngay) < ngay);
    for (const v of go) moc[v.chi_so].hang.splice(moc[v.chi_so].hang.map(chuoi).indexOf(ma), 1);
    if (!Array.isArray(moc[cdI].hang)) moc[cdI].hang = [];
    moc[cdI].hang.push(ma);
    return { vi_tri: { chi_so: idx, moc: go }, dich: { khoi: 'moc', moc: chuoi(moc[cdI].ten), chi_so: cdI }, hang_goc: hangGoc };
  }
  const khoi = KHOI_DICH[e.de_xuat];
  for (const v of [...viTriMoc].reverse()) moc[v.chi_so].hang.splice(v.vt, 1);
  data.hang.splice(idx, 1);
  const tao = !Array.isArray(data[khoi]);
  if (tao) data[khoi] = [];
  data[khoi].push(mucMay(hangGoc, e, ngay, khoi));
  return { vi_tri: { chi_so: idx, moc: viTriMoc }, dich: { khoi }, ...(tao ? { tao_khoi: true } : {}), hang_goc: hangGoc };
}
const bamTxt = t => createHash('sha256').update(t).digest('hex');

// Dòng chữ của một lộ trình đã tự áp — cùng câu cho lệnh `--ap`, lệnh xem và thẻ khởi động.
export function dongTuAp(t) {
  const ra = [];
  for (const m of t.bao_truoc || []) ra.push(`  · ${m.ma} — sẽ ${DE_XUAT_CHU[m.de_xuat]} từ ${ddmmyyyy(m.ap_tu)}: ${cauCanCu(m)}`);
  for (const m of t.da_ap || []) ra.push(`  · ${m.ma} — đã ${DE_XUAT_CHU[m.de_xuat]} ${ddmmyyyy(m.ngay)} — trả lại: ${m.lenh_tra_lai}`);
  return ra;
}

// Mỗi lộ trình: { tep, chien_dich, chinh_sach, bao_truoc, da_ap, huy, moi, ghim, canh_bao? } — `chinh_sach` là chính sách hiệu
// lực (không kèm tên mốc), null khi tệp không khai lớp nào; `bao_truoc` = mọi báo trước đang chờ; `da_ap` = lần áp 7 ngày qua
// chưa trả; `huy` = dòng huỷ của lượt này; `moi` = đếm dòng mới {bao_truoc, da_ap, huy}. CHỈ tệp có `tu_ap` của chiến dịch đang
// chạy được áp. `hangMo` = mã đang được mở (lệnh mở việc) — coi như có hồ sơ đang mở, không áp. Nhịp: báo trước ở lần chạy đầu;
// áp khi qua `nhip_ngay` mà đề xuất còn nguyên (cùng đề xuất, cùng luật), trong trần `tran_ap` mỗi ngày; đổi → huỷ + báo trước
// lại; biến mất → huỷ. `ghi`: kiểm dạng chuẩn → ghi sổ (TRƯỚC) → ghi tệp. Tệp không chuẩn khi ghi → { thoat: 2, thong_diep }.
export function apChinhSach({ root, cacTep, sections, today, ghi = false, hangMo = null }) {
  return cacTep.map(t => {
    const rong = { bao_truoc: [], da_ap: [], huy: [], moi: { bao_truoc: 0, da_ap: 0, huy: 0 } };
    if (!t.kq) return { tep: t.tep, loi: t.loi || 'không đọc được', ...rong };
    const cs = chinhSachHieuLuc(t.kq, today);
    const { moc: tenMoc, ...csRa } = cs || {};
    const dau = { tep: t.tep, chien_dich: cs ? tenMoc : null, chinh_sach: cs ? csRa : null };
    if (!cs || !cs.tu_ap) {
      // Chiến dịch cũ đã bật tự áp mà chưa có chiến dịch mới phía trước: tự áp dừng — nói ra, không im.
      const cu = !chienDichDangChay(t.kq.moc, today) && t.kq.mocChinhSach && [...t.kq.mocChinhSach.values()].some(x => x.tu_ap);
      return { ...dau, ...rong, ...(cu ? { canh_bao: ['không có mốc chiến dịch phía trước — tự áp dừng tới khi cắt mốc mới có chính sách'] } : {}) };
    }
    const canh = [];
    const p = path.join(root, t.tep); const goc = readFileSync(p, 'utf8');
    const chuan = dangChuan(goc);
    if (!chuan && ghi) return { ...dau, ...rong, thoat: 2, thong_diep: LOI_DANG(t.tep) };
    if (!chuan) canh.push(LOI_DANG(t.tep));
    const { dong, hong } = docSo(root, t.tep);
    if (hong) return { ...dau, ...rong, canh_bao: [...canh, `sổ tự áp có ${hong} dòng không đọc được — máy không áp tệp này`] };
    const P = phatLai(dong);
    const data = JSON.parse(goc);
    const cdI = chienDichDangChay((Array.isArray(data.moc) ? data.moc : []).map(laObj), today)?.i ?? null;
    const rs = raSoat({ root, cacTep: [t], sections, today })[0];
    for (const c of rs.canh_bao || []) canh.push(c);
    let doi = false; const moi = []; const xong = new Set();
    // Đứt giữa chừng hôm nay: dòng `ap` mang băm tệp TRƯỚC lần ghi (`tep_truoc`). Tệp còn đúng byte ấy = tệp chưa kịp ghi →
    // làm lại các lần áp đó theo thứ tự sổ, không thêm dòng. Tệp khác = người đã sửa sau khi ghi → máy KHÔNG làm lại (không đè).
    const bamGoc = bamTxt(goc);
    for (const d of dong) if (d.loai === 'ap' && d.ngay === today && d.tep_truoc === bamGoc && P.daAp.get(chuoi(d.ma)) === d) {
      if (apMot(data, d, d.dich.khoi === 'moc' ? d.dich.chi_so : cdI, today)) { doi = true; xong.add(chuoi(d.ma)); }
    }
    let soAp = dong.filter(d => d.loai === 'ap' && d.ngay === today).length;
    const huy = c => moi.push({ ngay: today, loai: 'huy', ma: c.ma, de_xuat: c.de_xuat, luat: c.luat, can_cu: c.can_cu });
    const baoTruoc = e => moi.push({ ngay: today, loai: 'bao-truoc', ma: e.ma, de_xuat: e.de_xuat, luat: e.luat, can_cu: e.can_cu, ap_tu: congNgay(today, cs.nhip_ngay) });
    const coDeXuat = new Set();
    for (const e of rs.de_xuat) {
      const ma = e.ma; coDeXuat.add(ma); if (xong.has(ma)) continue;
      const cho = P.cho.get(ma);
      if (ma === hangMo || P.ghim.has(ma)) { if (cho) huy(cho); continue; }
      const tl = P.traLai.get(ma);
      if (!cho && tl && tl.de_xuat === e.de_xuat && tl.luat === e.luat) continue;
      if (viTriHang(data, ma) < 0) { canh.push(`hàng ${ma} không có mã trong danh sách việc — máy không tự áp hàng này`); if (cho) huy(cho); continue; }
      if (e.de_xuat === 'doi-moc' && cdI == null) { canh.push(`không có mốc chiến dịch phía trước — ${ma} không dời được`); if (cho) huy(cho); continue; }
      if (!cho) { baoTruoc(e); continue; }
      if (cho.de_xuat !== e.de_xuat || cho.luat !== e.luat) { huy(cho); baoTruoc(e); continue; }
      if (today < cho.ap_tu || soAp >= cs.tran_ap) continue;
      const ket = apMot(data, e, cdI, today); doi = true; soAp += 1;
      moi.push({ ngay: today, loai: 'ap', ma, de_xuat: e.de_xuat, luat: e.luat, can_cu: e.can_cu, ...ket, tep_truoc: bamGoc, lenh_tra_lai: LENH_TRA_LAI(ma) });
    }
    for (const [ma, c] of P.cho) if (!coDeXuat.has(ma)) huy(c);
    // Thứ tự dòng mới theo thứ tự hàng trong tệp (ổn định: huỷ trước báo trước lại của cùng mã).
    const thu = new Map((Array.isArray(JSON.parse(goc).hang) ? JSON.parse(goc).hang : []).map((h, i) => [chuoi(laObj(h).ma), i]));
    moi.sort((x, y) => (thu.get(x.ma) ?? 1e9) - (thu.get(y.ma) ?? 1e9));
    if (ghi) {
      ghiSo(root, t.tep, moi);
      if (doi) ghiLoTrinh(p, data);
    }
    const P2 = phatLai([...dong, ...moi]); const tu = congNgay(today, -6);
    return {
      ...dau, bao_truoc: [...P2.cho.values()], da_ap: [...P2.daAp.values()].filter(d => d.ngay >= tu),
      huy: moi.filter(d => d.loai === 'huy'), ghim: [...P2.ghim],
      moi: { bao_truoc: moi.filter(d => d.loai === 'bao-truoc').length, da_ap: moi.filter(d => d.loai === 'ap').length, huy: moi.filter(d => d.loai === 'huy').length },
      ...(canh.length ? { canh_bao: canh } : {}),
    };
  });
}

// Bản đồ của lệnh xem (/road-map:xem): xong · đang dở · kế, rà soát, tự áp. Chỉ đọc — không ghi tệp nào.
const soHoac = v => (v == null ? '—' : String(v));
// Khối «Giờ máy theo mốc» của /road-map:xem (hồ sơ lo-trinh-gio-may): mỗi mốc còn hàng chưa giao một dòng khuôn luật 15/10,
// xếp theo ngày mục tiêu. Kho không mốc nào còn việc → không in gì.
export function duBaoLoTrinh(kq, nhom, today) {
  const dong = hangGioMay(kq, nhom);
  return GM.duBao({ dong, moc: kq.moc, uoc: kq._gm.uoc, doCua: kq._gm.doCua, doVong: kq._gm.doVong, today });
}
// Đo lệch (hồ sơ lo-trinh-gio-may, đường đo của ngưỡng Cổng Đáng): mỗi mốc mà mọi hàng gắn đã giao — dự báo ĐÓNG BĂNG
// sớm nhất so với ngày khép thật (ngày ký Cổng Bằng chứng muộn nhất của các hàng), giờ chờ ước so với đo, từng hàng ước so
// với đo; hàng thiếu số đo gọi tên. Chỉ đọc.
const ngayKyHoSo = (root, slug) => {
  const ev = doc(path.join(root, '_acceptance', slug, 'evidence-report.md')) || '';
  return HS.ngayChuKy(frontmatterField(ev, 'human_signoff')) || HS.ngayChuKy(frontmatterField(ev, 'verified_at'));
};
export function doLech({ root, cacTep, sections }) {
  const nhom = nhomVe(sections); const nhieu = cacTep.length > 1; const ra = [];
  for (const t of cacTep) {
    if (!t.kq || !t.kq._gm) continue;
    const kq = t.kq; const tien = nhieu ? `${t.tep}: ` : '';
    for (const m of mocTheoNgay(kq)) {
      const ma = ganMoc(m); const ds = ma.map(x => kq.dong.find(d => String(d._nhan) === x)).filter(Boolean);
      if (!ds.length || ds.some(d => !kq.daGiao.has(d.chu))) continue;
      const ten = tenNganMoc(m); const db = duBaoDongBang(kq, m);
      if (!db) { ra.push(`${tien}${ten}: chưa đóng băng dự báo — không đo được lệch`); continue; }
      const khep = ds.map(d => (d.hoSo ? ngayKyHoSo(root, d.hoSo) : null)).filter(Boolean).sort().pop() || null;
      const lech = khep ? Math.round(Math.abs(Date.parse(khep) - Date.parse(db.moc.hoan_tat)) / 864e5) : null;
      const them = ma.filter(x => !(Array.isArray(db.moc.hang) ? db.moc.hang : []).map(String).includes(x)).length;
      ra.push(`${tien}${ten}: dự báo ${GM.ngayVN(db.moc.hoan_tat)} (đóng băng ${GM.ngayVN(db.ngay_tinh)}) · khép thật ${khep ? GM.ngayVN(khep) : '?'} · lệch ${lech == null ? '?' : lech} ngày${them ? ` · ${them} hàng thêm sau đóng băng` : ''}`);
      const doCua = d => (d.hoSo ? kq._gm.doCua(d.hoSo) : null);
      const choDo = ds.map(doCua).filter(v => v && typeof v.gio_cho === 'number').reduce((a, v) => a + v.gio_cho, 0);
      ra.push(`  giờ chờ: ước ${GM.soVN(db.moc.gio_cho || 0)} (đo được lúc đóng băng: ${db.moc.gio_cho_do ? 'có' : 'không'}) · đo ${GM.soVN(choDo)}`);
      let k = 0;
      for (const d of ds) {
        const v = doCua(d);
        if (!v || typeof v.gio_may !== 'number') { ra.push(`  ${d._nhan}: thiếu số đo`); continue; }
        k += 1;
        const rieng = kq._gm.duBao.find(x => x.slug === d.hoSo && x.hang && Array.isArray(x.hang.gio_may));
        const uoc = rieng ? rieng.hang.gio_may : kq._gm.uoc(d).khoang;
        ra.push(`  ${d._nhan}: ước ${GM.khoangVN(uoc)} giờ máy · đo ${GM.soVN(v.gio_may)} giờ máy · ${typeof v.phan_tram_tuan === 'number' ? `~${GM.soVN(v.phan_tram_tuan)} % hạn mức tuần` : '% hạn mức tuần chưa đo'}`);
      }
      ra.push(`  ${k}/${ds.length} vòng có số đo`);
    }
  }
  return ra;
}
function dongGioMayXem(kq, nhom, today, nhieu = false) {
  if (!kq._gm || !kq.moc.length) return [];
  const db = duBaoLoTrinh(kq, nhom, today);
  const kVong = kq._gm.doVong.filter(v => v.daGiao && typeof v.phan_tram_tuan === 'number').length;
  // Cùng thứ tự với làn của gio-may.duBao: mốc có ngày theo ngày, mốc không ngày đứng cuối, cùng ngày giữ thứ tự tệp.
  const coNgay = i => NGAY_RE.test(chuoi(kq.moc[i].ngay));
  const thuTu = kq.moc.map((m, i) => i).sort((a, b) => (coNgay(a) ? 0 : 1) - (coNgay(b) ? 0 : 1) || chuoi(kq.moc[a].ngay).localeCompare(chuoi(kq.moc[b].ngay)) || a - b);
  const dong = thuTu.filter(i => db.get(i).mo > 0).map(i => `  · ${GM.dongMoc(tenNganMoc(kq.moc[i]), db.get(i), kVong)}`);
  // Nhiều lộ trình cùng kho: mỗi lộ trình một làn, tính riêng (hồ sơ road-map-de-dung, AC-10) — nói ra ở tiêu đề khối.
  return dong.length ? [nhieu ? 'Giờ máy theo mốc (mỗi lộ trình một làn, tính riêng):' : 'Giờ máy theo mốc:', ...dong] : [];
}
export function xemBanDo({ root, cacTep, sections, today }) {
  const nhom = nhomVe(sections); const nhieu = cacTep.length > 1; const ra = [];
  const rs = raSoat({ root, cacTep, sections, today }); const ap = apChinhSach({ root, cacTep, sections, today, ghi: false });
  cacTep.forEach((t, i) => {
    if (nhieu) ra.push(`Lộ trình ${(t.kq && t.kq.ten) || t.tep} (${t.tep}):`);
    if (!t.kq) { ra.push(`Không đọc được tệp kế hoạch — ${dichLoi(t.loi || 'không đọc được')}`); return; }
    const kq = t.kq; const d = demTienDo(kq, nhom);
    ra.push(`Xong ${d.da_giao} · Đang dở ${d.dang_lam} · Kế ${d.chua_bat_dau}`);
    const dang = kq.dong.filter(x => nhomTienDo(x.chu, kq, nhom) === 'dang-lam');
    ra.push(dang.length ? 'Đang dở:' : 'Đang dở: không có');
    for (const x of dang) ra.push(`  · ${x._nhan} — ${chuoi(x.cau_giao) || CHUA_CAU} (${x.chu})`);
    const ke = hangKeCua(kq, nhom.chuaLam);
    ra.push(ke ? `Kế: ${ke._nhan} — ${chuoi(ke.cau_giao) || CHUA_CAU}` : 'Kế: chưa có việc đủ điều kiện mở');
    for (const x of kq.dong.filter(y => y !== ke && nhomTienDo(y.chu, kq, nhom) === 'chua-bat-dau').slice(0, 3)) ra.push(`  · ${x._nhan} — ${chuoi(x.cau_giao) || CHUA_CAU}`);
    // Luật «chỉ việc phát triển» (AC-8): cờ của bộ đọc chung đứng TRƯỚC khối Rà soát — khối Rà soát và Tự áp liền nhau.
    for (const c of kq.co) { const d = dichCo(c); if (CO_PHAT_TRIEN.includes(d.ten)) ra.push(`  ! ${d.chu}`); }
    const ghim = new Set(phatLai(docSo(root, t.tep).dong).ghim);
    const dx = rs[i].de_xuat; const dem = k => dx.filter(m => m.de_xuat === k).length;
    ra.push(dx.length ? `Rà soát: ${dx.length} đề xuất — ${dem('doi-moc')} dời mốc · ${dem('cho-dieu-kien')} chờ điều kiện · ${dem('bac')} bác` : 'Rà soát: không có đề xuất');
    for (const m of dx) ra.push(dongRaSoat(m) + (ghim.has(m.ma) ? ' (ghim — máy không tự áp)' : ''));
    for (const c of rs[i].canh_bao || []) ra.push(`  ! ${c}`);
    const a = ap[i];
    if (a.chinh_sach && a.chinh_sach.tu_ap) {
      const c = a.chinh_sach;
      ra.push(`Tự áp — chiến dịch ${a.chien_dich}: tuổi ${soHoac(c.tuoi_ngay)} · trần kế tiếp ${soHoac(c.tran_ke_tiep)} · nhịp ${c.nhip_ngay} ngày · trần áp ${c.tran_ap}/ngày`);
      ra.push(...dongTuAp(a));
      for (const x of (a.canh_bao || []).filter(x => !(rs[i].canh_bao || []).includes(x))) ra.push(`  ! ${x}`);
    } else for (const x of a.canh_bao || []) ra.push(`  ! ${x}`);
    ra.push(...dongGioMayXem(kq, nhom, today, nhieu));
    ra.push(...dongMocXem(kq));
  });
  return ra;
}
// Khối «Mốc:» của bản xem chữ (hồ sơ road-map-de-dung, AC-11): CÙNG mô hình hiển thị với trang và khối dữ liệu — mốc hiện,
// còn k/n, từng việc chưa giao «tên (trạng thái) [mã]», số việc chưa hẹn mốc. Không tự lọc.
export function dongMocXem(kq) {
  if (!kq.moc.length && !kq.dong.length) return [];
  const mh = moHinhHienThi(kq); const ra = [];
  for (const m of mocTheoNgay(kq)) {
    const o = mh.moc.get(m); if (!o.hien) continue;
    const mo = o.viec_hien.filter(x => !kq.daGiao.has(mh.viec.get(x).chu));
    ra.push(`  · ${tenNganMoc(m)} — ${mo.length ? `còn ${mo.length}/${o.viec_hien.length} việc` : `đã giao đủ ${o.viec_hien.length} việc`}`);
    for (const x of mo) { const d = mh.viec.get(x); ra.push(`      – ${tenHienThi(d)} (${d.chu}) [${x}]`); }
  }
  if (mh.chua_hen_moc.length) ra.push(`  · ${mh.chua_hen_moc.length} việc chưa hẹn mốc`);
  return ra.length ? ['Mốc:', ...ra] : [];
}

// Trả lại MỘT lần áp (lệnh khoá /road-map:tra-lai): hoàn tác đúng lần áp cuối của mã về vị trí cũ, ghi dòng `tra-lai`.
// Chỉ chặn ĐÚNG đề xuất ấy tới khi đề xuất đổi (B′ §11 «Veto một lần tự áp») — hàng không bị ghim.
export function traLai({ root, tep, ma, today, boi }) {
  const p = path.join(root, tep); const goc = readFileSync(p, 'utf8');
  if (!dangChuan(goc)) return { thoat: 2, thong_diep: LOI_DANG(tep) };
  const { dong, hong } = docSo(root, tep);
  if (hong) return { thoat: 2, thong_diep: `sổ tự áp có ${hong} dòng không đọc được — máy không trả lại` };
  const d = phatLai(dong).daAp.get(ma);
  if (!d) return { thoat: 2, thong_diep: `không có lần áp nào của ${ma} để trả lại` };
  const data = JSON.parse(goc); const moc = Array.isArray(data.moc) ? data.moc : [];
  const doiTay = { thoat: 2, thong_diep: 'hàng đã đổi sau khi máy áp — trả lại bằng tay' };
  if (d.dich.khoi === 'moc') {
    const m = laObj(moc[d.dich.chi_so]); const k = Array.isArray(m.hang) ? m.hang.map(chuoi).lastIndexOf(ma) : -1;
    if (chuoi(m.ten) !== d.dich.moc || k < 0) return doiTay;
    m.hang.splice(k, 1);
  } else {
    const ds = Array.isArray(data[d.dich.khoi]) ? data[d.dich.khoi] : [];
    const j = ds.findIndex(x => chuoi(laObj(x).ma) === ma && laObj(laObj(x).tu_ap).ngay === d.ngay);
    if (j < 0 || JSON.stringify(ds[j]) !== JSON.stringify(mucMay(d.hang_goc, d, d.ngay, d.dich.khoi))) return doiTay;
    ds.splice(j, 1);
    if (d.tao_khoi && !ds.length) delete data[d.dich.khoi];
    data.hang.splice(Math.min(d.vi_tri.chi_so, data.hang.length), 0, d.hang_goc);
  }
  for (const v of d.vi_tri.moc) { const m = laObj(moc[v.chi_so]); if (Array.isArray(m.hang)) m.hang.splice(Math.min(v.vt, m.hang.length), 0, ma); }
  ghiSo(root, tep, [{ ngay: today, loai: 'tra-lai', ma, de_xuat: d.de_xuat, luat: d.luat, boi }]);
  ghiLoTrinh(p, data);
  return { thoat: 0, thong_diep: `đã trả lại ${ma} — máy không đề xuất lại «${DE_XUAT_CHU[d.de_xuat]}» cho tới khi căn cứ đổi` };
}
// Ghim / bỏ ghim (lệnh khoá /road-map:ghim, /road-map:bo-ghim): CHỈ ghi sổ — tệp lộ trình không đổi, nên tuổi hàng không bị
// đặt lại (luật tuổi coi mọi lần sửa hàng là một lần chạm).
export function ghimHang({ root, tep, ma, today, boi, bo = false }) {
  const { dong, hong } = docSo(root, tep);
  if (hong) return { thoat: 2, thong_diep: `sổ tự áp có ${hong} dòng không đọc được — máy không ghi` };
  const dang = phatLai(dong).ghim.has(ma);
  if (bo && !dang) return { thoat: 2, thong_diep: `hàng ${ma} chưa ghim` };
  if (!bo && dang) return { thoat: 0, thong_diep: `hàng ${ma} đã ghim từ trước` };
  ghiSo(root, tep, [{ ngay: today, loai: bo ? 'bo-ghim' : 'ghim', ma, boi }]);
  return { thoat: 0, thong_diep: bo ? `đã bỏ ghim ${ma} — máy lại được tự áp lên hàng này` : `đã ghim ${ma} — máy không tự áp lên hàng này cho tới khi bỏ ghim` };
}

// Mã thoát là HỢP ĐỒNG với bảng S0-MO-O-THOAT của SKILL feature-loop: 0 = hàng (JSON) · 1 = không
// phải hàng (kho chưa khai, không có mã) · 2 = lỗi dùng/ghi · 3 = mã ở nhiều lộ trình.
const isMain = (() => {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(__filename); } catch { return path.resolve(process.argv[1]) === __filename; }
})();
if (isMain) {
  const a = process.argv.slice(2);
  const bail = m => { process.stderr.write(`lo-trinh: ${m}\n`); process.exit(2); };
  const thoat = (c, m) => { process.stderr.write(`lo-trinh: ${m}\n`); process.exit(c); };
  let root = '.'; let ref = null; let moO = false; let slugMoi = null; let owner = ''; let raSoatCo = false; let jsonCo = false;
  let apCo = false; let ghiCo = false; let lenhNguoi = null; let xemCo = false; let doLechCo = false; let themHang = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--mo-o') { moO = true; continue; }
    if (a[i] === '--them-hang') { themHang = true; continue; }
    if (a[i] === '--ra-soat') { raSoatCo = true; continue; }
    if (a[i] === '--json') { jsonCo = true; continue; }
    if (a[i] === '--ap') { apCo = true; continue; }
    if (a[i] === '--xem') { xemCo = true; continue; }
    if (a[i] === '--do-lech') { doLechCo = true; continue; }
    if (a[i] === '--write') { ghiCo = true; continue; }
    if (['--tra-lai', '--ghim', '--bo-ghim'].includes(a[i])) {
      const v = a[i + 1]; if (v == null || v === '' || v.startsWith('--')) bail(`${a[i]} cần một mã ngay sau nó`);
      if (lenhNguoi) bail('mỗi lần chỉ một trong --tra-lai, --ghim, --bo-ghim');
      lenhNguoi = { lenh: a[i].slice(2), ref: v }; i++; continue;
    }
    if (['--root', '--hang', '--slug', '--owner'].includes(a[i])) {
      const v = a[i + 1];
      // `--owner` nhận chuỗi rỗng: máy không khai email git vẫn mở được việc (Ngoài-9).
      if (v == null || (v === '' && a[i] !== '--owner') || v.startsWith('--')) bail(`${a[i]} cần một giá trị ngay sau nó`);
      if (a[i] === '--root') root = v; else if (a[i] === '--hang') ref = v; else if (a[i] === '--slug') slugMoi = v; else owner = v;
      i++;
    } else bail(`tham số lạ ${a[i]} — chỉ nhận --root <thư-mục> (--hang <mã|tệp:mã> [--mo-o [--slug <s>] [--owner <o>]] | --ra-soat [--json] | --ap [--json] [--write] | --xem | --do-lech | --tra-lai|--ghim|--bo-ghim <mã> --write | --them-hang --slug <s> (câu giao qua stdin))`);
  }
  // Nấc 3 của ADR 0025 (hồ sơ kho-cam-ket-co-lo-trinh, hàng RM5): mở vòng từ mô tả ở kho BẬT CHẶN → máy thêm một hàng
  // mã = slug vào tệp lộ trình đầu tiên đã khai, rồi tạo thư mục hồ sơ (mở lại bằng slug đi đường tiếp tục, không sinh ô
  // cơ hội). Câu giao chỉ đi qua stdin. 0 = đã thêm · 1 = kho không bật chặn (0 byte) · 2 = từ chối, tệp nguyên byte.
  if (themHang) {
    if (ref != null || moO || raSoatCo || apCo || jsonCo || ghiCo || lenhNguoi || xemCo || doLechCo) bail('--them-hang chỉ đi với --root và --slug');
    if (!slugMoi) bail('--them-hang cần --slug <slug>');
    if (!SLUG_RE.test(slugMoi)) bail(`slug không hợp lệ: «${slugMoi}»`);
    root = path.resolve(root);
    const CL = require(path.join(__dirname, '..', 'lib', 'chan-lo-trinh.cjs'));
    const tt = CL.trangThaiChan(root);
    if (tt.loi) bail(tt.loi);
    if (!tt.bat) thoat(1, 'kho không bật chặn lộ trình — không thêm hàng');
    let cau = '';
    try { cau = readFileSync(0, 'utf8').trim(); } catch { cau = ''; }
    if (!cau) bail('câu giao rỗng — đưa câu mô tả qua stdin');
    const khai = docCacTep(root);
    if (khai == null) bail(`kho chưa khai ${KHOA} trong _acceptance/config.yaml`);
    const tep = khai.tep[0]; const p = path.join(root, tep);
    let txt = null;
    try { txt = readFileSync(p, 'utf8'); } catch { bail(`không đọc được tệp lộ trình ${tep}`); }
    if (!dangChuan(txt)) bail(`tệp lộ trình ${tep} không ở dạng chuẩn — không ghi; thêm hàng bằng tay hoặc bằng skill cắt lượt`);
    const data = JSON.parse(txt);
    if (!Array.isArray(data.hang)) data.hang = [];
    if (data.hang.some(r => r && (chuoi(r.ma) === slugMoi || chuoi(r.slug) === slugMoi))) bail(`đã có hàng mang mã hay slug ${slugMoi} trong ${tep} — không thêm`);
    const dich = path.join(root, '_acceptance', slugMoi);
    if (existsSync(path.join(dich, 'contract.md')) || existsSync(path.join(dich, 'opportunity.md'))) bail(`hồ sơ ${slugMoi} đã có — không thêm hàng`);
    const today = process.env.ACCEPTANCE_TODAY || new Date().toISOString().slice(0, 10);
    if (!NGAY_RE.test(today)) bail(`ACCEPTANCE_TODAY phải dạng YYYY-MM-DD (đang là «${today}»)`);
    data.hang.push({ ma: slugMoi, cau_giao: cau, slug: slugMoi, vi_sao: `Máy thêm khi mở vòng từ mô tả, ${today}` });
    ghiLoTrinh(p, data);
    mkdirSync(dich, { recursive: true });
    process.stdout.write(JSON.stringify({ hang: slugMoi, tep }) + '\n');
    process.exit(0);
  }
  // Rà soát (hồ sơ ra-soat-lo-trinh): chỉ đọc — 0 = in đề xuất · 1 = kho chưa khai · 2 = lỗi dùng.
  if (raSoatCo) {
    if (ref != null || moO) bail('--ra-soat không đi cùng --hang hay --mo-o');
    const today = process.env.ACCEPTANCE_TODAY || new Date().toISOString().slice(0, 10);
    if (!NGAY_RE.test(today)) bail(`ACCEPTANCE_TODAY phải dạng YYYY-MM-DD (đang là «${today}»)`);
    root = path.resolve(root);
    if (docCacTep(root) == null) thoat(1, `kho chưa khai ${KHOA} trong _acceptance/config.yaml`);
    const PM = await import(pathToFileURL(path.join(__dirname, 'product-map.mjs')).href);
    const kho = phanTichKho({ root, classify: PM.classify, sections: PM.SECTIONS });
    const rs = raSoat({ root, cacTep: kho.cacTep, sections: PM.SECTIONS, today });
    if (jsonCo) process.stdout.write(JSON.stringify(rs) + '\n');
    else {
      const nhieu = rs.length > 1; const tien = t => (nhieu ? `${t.tep}: ` : '');
      const dong = rs.flatMap(t => [...t.de_xuat.map(m => tien(t) + dongRaSoat(m)), ...(t.canh_bao || []).map(c => `${tien(t)}  ! ${c}`)]);
      if (dong.length) process.stdout.write(dong.join('\n') + '\n');
    }
    // Tệp không đọc được: một dòng có tên tệp ra stderr, thoát 1 — không bao giờ trông như «không có đề xuất».
    for (const t of rs) if (t.loi) process.stderr.write(`lo-trinh: không đọc được tệp ý định — ${t.tep}: ${t.loi}\n`);
    process.exit(rs.some(t => t.loi) ? 1 : 0);
  }
  // Đo lệch (hồ sơ lo-trinh-gio-may): chỉ đọc — 0 = in · 1 = kho chưa khai · 2 = lỗi dùng.
  if (doLechCo) {
    if (ref != null || moO || raSoatCo || apCo || jsonCo || ghiCo || lenhNguoi || xemCo) bail('--do-lech chỉ đi với --root');
    root = path.resolve(root);
    if (docCacTep(root) == null) thoat(1, `kho chưa khai ${KHOA} trong _acceptance/config.yaml`);
    const PM = await import(pathToFileURL(path.join(__dirname, 'product-map.mjs')).href);
    const kho = phanTichKho({ root, classify: PM.classify, sections: PM.SECTIONS });
    const dong = doLech({ root, cacTep: kho.cacTep, sections: PM.SECTIONS });
    process.stdout.write((dong.length ? dong : ['Chưa có mốc nào khép — chưa có gì để đo lệch.']).join('\n') + '\n');
    process.exit(0);
  }
  // Bản đồ của /road-map:xem: chỉ đọc — 0 = in · 1 = kho chưa khai / tệp không đọc được · 2 = lỗi dùng.
  if (xemCo) {
    if (ref != null || moO || raSoatCo || apCo || jsonCo || ghiCo || lenhNguoi) bail('--xem chỉ đi với --root');
    const today = process.env.ACCEPTANCE_TODAY || new Date().toISOString().slice(0, 10);
    if (!NGAY_RE.test(today)) bail(`ACCEPTANCE_TODAY phải dạng YYYY-MM-DD (đang là «${today}»)`);
    root = path.resolve(root);
    if (docCacTep(root) == null) thoat(1, `kho chưa khai ${KHOA} trong _acceptance/config.yaml`);
    const PM = await import(pathToFileURL(path.join(__dirname, 'product-map.mjs')).href);
    const kho = phanTichKho({ root, classify: PM.classify, sections: PM.SECTIONS });
    process.stdout.write(xemBanDo({ root, cacTep: kho.cacTep, sections: PM.SECTIONS, today }).join('\n') + '\n');
    for (const t of kho.cacTep) if (t.loi) process.stderr.write(`lo-trinh: không đọc được tệp ý định — ${t.tep}: ${t.loi}\n`);
    process.exit(kho.cacTep.some(t => t.loi) ? 1 : 0);
  }
  // Tự áp (hồ sơ ap-chinh-sach-lo-trinh): 0 = xong · 1 = kho chưa khai / tệp không đọc được · 2 = lỗi dùng, tệp không chuẩn.
  if (apCo) {
    if (ref != null || moO || raSoatCo) bail('--ap không đi cùng --hang, --mo-o hay --ra-soat');
    const today = process.env.ACCEPTANCE_TODAY || new Date().toISOString().slice(0, 10);
    if (!NGAY_RE.test(today)) bail(`ACCEPTANCE_TODAY phải dạng YYYY-MM-DD (đang là «${today}»)`);
    root = path.resolve(root);
    if (docCacTep(root) == null) thoat(1, `kho chưa khai ${KHOA} trong _acceptance/config.yaml`);
    const PM = await import(pathToFileURL(path.join(__dirname, 'product-map.mjs')).href);
    const kho = phanTichKho({ root, classify: PM.classify, sections: PM.SECTIONS });
    const kq = apChinhSach({ root, cacTep: kho.cacTep, sections: PM.SECTIONS, today, ghi: ghiCo });
    for (const t of kq) if (t.thoat === 2) bail(t.thong_diep);
    if (jsonCo) process.stdout.write(JSON.stringify(kq) + '\n');
    else {
      const nhieu = kq.length > 1; const tien = t => (nhieu ? `${t.tep}: ` : '');
      const dong = kq.flatMap(t => [...dongTuAp(t, today).map(x => tien(t) + x), ...(t.canh_bao || []).map(c => `${tien(t)}  ! ${c}`)]);
      if (dong.length) process.stdout.write(dong.join('\n') + '\n');
    }
    for (const t of kq) if (t.loi) process.stderr.write(`lo-trinh: không đọc được tệp ý định — ${t.tep}: ${t.loi}\n`);
    process.exit(kq.some(t => t.loi) ? 1 : 0);
  }
  // Ba lệnh người (khoá model-invocation ở gói road-map): trả lại · ghim · bỏ ghim. 0 = xong · 1 = không có hàng ·
  // 2 = lỗi dùng / từ chối có tên · 3 = mã ở nhiều lộ trình (gọi lại bằng <tệp>:<mã>).
  if (lenhNguoi) {
    if (!ghiCo) bail(`--${lenhNguoi.lenh} cần --write`);
    if (ref != null || moO || raSoatCo || apCo || jsonCo) bail(`--${lenhNguoi.lenh} không đi cùng tham số khác ngoài --root và --write`);
    const today = process.env.ACCEPTANCE_TODAY || new Date().toISOString().slice(0, 10);
    if (!NGAY_RE.test(today)) bail(`ACCEPTANCE_TODAY phải dạng YYYY-MM-DD (đang là «${today}»)`);
    root = path.resolve(root);
    const khai = docCacTep(root);
    if (khai == null) thoat(1, `kho chưa khai ${KHOA} trong _acceptance/config.yaml`);
    const hai = lenhNguoi.ref.lastIndexOf(':');
    const tepChon = hai > 0 ? lenhNguoi.ref.slice(0, hai) : null; const ma = hai > 0 ? lenhNguoi.ref.slice(hai + 1) : lenhNguoi.ref;
    if (tepChon != null && !khai.tep.includes(tepChon)) thoat(1, `kho không khai lộ trình ${tepChon}`);
    const coMa = tep => { const { data } = docTep(root, tep); if (!data) return false;
      return ['hang', 'chan_troi', 'da_bac'].some(k => (Array.isArray(data[k]) ? data[k] : []).some(x => chuoi(laObj(x).ma) === ma)); };
    const thay = (tepChon != null ? [tepChon] : khai.tep).filter(coMa);
    if (thay.length > 1) thoat(3, `mã ${ma} có ở nhiều lộ trình: ${thay.join(', ')} — gọi ${thay.map(t => `${t}:${ma}`).join(' hoặc ')}`);
    if (!thay.length) thoat(1, `không có hàng ${ma} trong ${(tepChon != null ? [tepChon] : khai.tep).join(', ')}`);
    let boi = ''; try { boi = execFileSync('git', ['-C', root, 'config', 'user.name'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* không có tên git */ }
    const kq = lenhNguoi.lenh === 'tra-lai' ? traLai({ root, tep: thay[0], ma, today, boi })
      : ghimHang({ root, tep: thay[0], ma, today, boi, bo: lenhNguoi.lenh === 'bo-ghim' });
    if (kq.thoat) thoat(kq.thoat, kq.thong_diep);
    process.stdout.write(kq.thong_diep + '\n'); process.exit(0);
  }
  if (ghiCo) bail('--write chỉ đi với --ap, --tra-lai, --ghim hoặc --bo-ghim');
  if (jsonCo) bail('--json chỉ đi với --ra-soat hoặc --ap');
  if (ref == null) bail('thiếu --hang <mã>');
  root = path.resolve(root);
  const khai = docCacTep(root);
  if (khai == null) thoat(1, `kho chưa khai ${KHOA} trong _acceptance/config.yaml`);
  const hai = ref.lastIndexOf(':');
  const tepChon = hai > 0 ? ref.slice(0, hai) : null; const ma = hai > 0 ? ref.slice(hai + 1) : ref;
  if (tepChon != null && !khai.tep.includes(tepChon)) thoat(1, `kho không khai lộ trình ${tepChon}`);
  const thay = []; const loiTep = [];
  for (const tep of tepChon != null ? [tepChon] : khai.tep) {
    const { loi, data } = docTep(root, tep);
    if (loi) { loiTep.push(loi); continue; }
    const k = kiemKhuon(data); const cung = k.hang.filter(h => h._ma === ma);
    // Mã trùng TRONG một tệp: kit không chọn hộ hàng nào (Ngoài-7) — tra hay mở đều dừng.
    if (cung.length > 1) thoat(3, `mã ${ma} trùng trong ${tep} — sửa tệp ý định cho mỗi hàng một mã`);
    if (cung.length) thay.push({ tep, r: cung[0], k });
  }
  if (thay.length > 1) thoat(3, `mã ${ma} có ở nhiều lộ trình: ${thay.map(t => t.tep).join(', ')} — gọi ${thay.map(t => `${t.tep}:${ma}`).join(' hoặc ')}`);
  if (!thay.length) thoat(1, loiTep.length ? loiTep[0] : `không có hàng ${ma} trong ${(tepChon != null ? [tepChon] : khai.tep).join(', ')}`);
  const { tep, r, k } = thay[0];
  const { _nhan, _ma, _cauGiaoGoc, ...hang } = r;
  // moc-la-chien-dich: «kho dùng mốc» đọc mọi tệp khai (cấp kho, như cờ của bộ vẽ); tên phiên/nhóm cùng một hàm.
  const khoDungMoc = khai.tep.some(t => { const x = docTep(root, t); return !x.loi && kiemKhuon(x.data).moc.length > 0; });
  const ten = () => tenChienDich({ hang: { ...hang, cau_giao: r.cau_giao }, moc: k.moc, loTrinh: docTep(root, tep).data, tep, nhieuLoTrinh: khai.tep.length > 1, kho: tenKho(root) });
  // Lối đọc một hàng in DỮ LIỆU của tệp kế hoạch nguyên văn (câu giao như kho viết); chỉ chỗ in tiêu đề bỏ «».
  if (!moO) { process.stdout.write(JSON.stringify(_cauGiaoGoc !== undefined ? { ...hang, cau_giao: _cauGiaoGoc } : hang) + '\n'); process.exit(0); }
  // «Hàng đã có hồ sơ chưa» đọc từ CÙNG hàm của bộ vẽ — hai bên không thể nói khác nhau.
  const PM = await import(pathToFileURL(path.join(__dirname, 'product-map.mjs')).href);
  const kho = phanTichKho({ root, classify: PM.classify, sections: PM.SECTIONS });
  // Tự áp ở điểm mở việc (hồ sơ ap-chinh-sach-lo-trinh, Hỏi-1 chủ kho duyệt 15/10): tệp của hàng có chiến dịch đang chạy bật
  // tự áp → áp TRƯỚC khi mở ô; hàng đang mở coi như có hồ sơ đang mở — không bị đụng. Tệp không chuẩn → bỏ qua tự áp, vẫn mở
  // việc (mở việc không bị chặn vì tự áp). JSON mang `ap` CHỈ khi có dòng sổ mới — kho không bật giữ đầu ra từng byte.
  let apDem = null;
  {
    const today = process.env.ACCEPTANCE_TODAY || new Date().toISOString().slice(0, 10);
    const tAp = kho.cacTep.find(t => t.tep === tep);
    const cs = NGAY_RE.test(today) && tAp && tAp.kq ? chinhSachHieuLuc(tAp.kq, today) : null;
    if (cs && cs.tu_ap) {
      const k1 = apChinhSach({ root, cacTep: [tAp], sections: PM.SECTIONS, today, ghi: true, hangMo: ma })[0];
      if (k1.thoat) process.stderr.write(`lo-trinh: ${k1.thong_diep} — bỏ qua tự áp, vẫn mở việc\n`);
      else if (k1.moi.bao_truoc || k1.moi.da_ap || k1.moi.huy) apDem = k1.moi;
    }
  }
  const apRa = apDem ? { ap: apDem } : {};
  const d = kho.cacTep.find(t => t.tep === tep)?.kq?.dong.find(x => x._ma === ma);
  if (d && d.hoSo) { process.stdout.write(JSON.stringify({ hoSo: d.hoSo, moi: false, ...ten(), ...apRa }) + '\n'); process.exit(0); }
  if (d && d.nhieuNhan.length) bail(`hàng ${ma} được nhiều hồ sơ nhận: ${d.nhieuNhan.join(', ')} — không mở thêm hồ sơ; sửa lo_trinh_ma của các hồ sơ đó`);
  const slug = slugMoi || chuoi(hang.slug) || suySlug(hang.cau_giao);
  if (!slug || !SLUG_RE.test(slug)) bail(`slug không hợp lệ: «${slug}» — truyền --slug`);
  const dich = path.join(root, '_acceptance', slug);
  if (existsSync(dich)) bail(`thư mục đã có: ${path.join('_acceptance', slug)} — không ghi`);
  let khuon;
  try { khuon = readFileSync(KHUON_OPP, 'utf8'); } catch { bail(`không đọc được khuôn ô cơ hội: ${KHUON_OPP}`); }
  // Dòng «Nguồn:» (hồ sơ o-mo-viec-mang-nguon, TT3): CHỈ khi hàng có dot VÀ kho khai tri_thuc — thiếu một trong hai thì
  // không nạp mô-đun tri thức nào, ô giống từng byte bộ máy trước vòng. Chọn trang lỗi không chặn mở việc.
  let dongNguon = null;
  if (chuoi(hang.dot)) {
    const { docTriThuc } = require(path.join(__dirname, 'tri-thuc-khoa.cjs'));
    const pCfg = path.join(root, '_acceptance', 'config.yaml');
    const tt = docTriThuc(existsSync(pCfg) ? readFileSync(pCfg, 'utf8') : '');
    if (tt) {
      const TN = require(path.join(__dirname, 'tri-thuc-nguon.cjs'));
      let tienTo; try { tienTo = TN.tienTo(khuon); } catch (e) { bail(e.message); }
      try {
        const TT = await import(pathToFileURL(path.join(__dirname, 'tri-thuc.mjs')).href);
        const phu = (Array.isArray(hang.phu) ? hang.phu : []).map(chuoi).filter(Boolean);
        dongNguon = TN.dungDongNguon({ tienTo, ...TT.chonTrang({ root, cfg: tt, dot: chuoi(hang.dot), phu }) });
      } catch (e) { dongNguon = `${tienTo} không chọn được trang — ${e.message}`; }
    }
  }
  let noiDung;
  try { noiDung = dungCoHoi({ khuon, hang, tep, tenLoTrinh: k.ten, slug, owner, moc: k.moc, khoDungMoc, dongNguon }); } catch (e) { bail(e.message); }
  mkdirSync(dich, { recursive: true });
  writeFileSync(path.join(dich, 'opportunity.md'), noiDung);
  // Đóng băng dự báo (hồ sơ lo-trinh-gio-may): ước của hàng + dự báo của mốc chứa nó TẠI ngày mở, ghi một lần, không bao giờ
  // ghi đè. Tệp riêng — ô cơ hội và stdout giữ nguyên byte. Lỗi tính dự báo không chặn việc mở.
  try {
    const tK = kho.cacTep.find(x => x.tep === tep); const dK = tK?.kq?.dong.find(x => x._ma === ma);
    const pDb = path.join(dich, GM.DU_BAO_TEP);
    if (tK && tK.kq._gm && dK && !existsSync(pDb)) {
      const today = process.env.ACCEPTANCE_TODAY || new Date().toISOString().slice(0, 10);
      const nhomV = nhomVe(PM.SECTIONS); const mocI = tK.kq.moc.findIndex(m => ganMoc(m).includes(String(dK._nhan)));
      const r = mocI >= 0 && NGAY_RE.test(today) ? duBaoLoTrinh(tK.kq, nhomV, today).get(mocI) : null;
      const o = GM.duBaoHoSo({ d: dK, u: tK.kq._gm.uoc(dK), mocI: mocI >= 0 ? mocI : null, r, ten: mocI >= 0 ? tenNganMoc(tK.kq.moc[mocI]) : null, today });
      writeFileSync(pDb, JSON.stringify(o, null, 2) + '\n');
    }
  } catch (e) { process.stderr.write(`lo-trinh: không đóng băng được dự báo — ${e.message}\n`); }
  process.stdout.write(JSON.stringify({ hoSo: slug, moi: true, ...ten(), ...apRa }) + '\n');
}
