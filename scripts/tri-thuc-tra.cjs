#!/usr/bin/env node
'use strict';
// tri-thuc-tra.cjs — dòng «đã tra tri thức» của bước thiết kế (hồ sơ thiet-ke-nap-tri-thuc, TT4, đợt tri-thuc-2410;
// thiết kế docs/superpowers/specs/2026-10-24-thiet-ke-nap-tri-thuc-design.md). CJS để thẻ Cổng Phạm vi và bộ xếp căn cứ
// nạp được. Kho không khai `tri_thuc` → mọi hàm trả null, bên gọi giữ nguyên hành vi trước vòng.
//
// Không có bộ so băm thứ hai: mỗi đường trỏ kiểm bằng `scripts/tri-thuc.mjs --con-tro` (0 khớp · 1 lệch/không có ·
// 2 sai khuôn · 3 không đọc được ở đây). Dòng «Nguồn:» của ô đọc bằng `docDongNguon` của tri-thuc-nguon.cjs.
//
//   node scripts/tri-thuc-tra.cjs --root <kho> --clone   0 đã clone / đã có / trong kho · 2 không chạy được · 3 không đọc được ở đây
//
// Hồ sơ vong-don-le-tra-tri-thuc (TT5, thiết kế docs/superpowers/specs/2026-10-25-vong-don-le-tra-tri-thuc-design.md):
// tra sổ quyết định của hồ sơ trước theo câu mô tả (`traSo`, lệnh `tri-thuc.mjs --tra`), khoá `so` của dòng tra và thẻ
// kiểm nó. Phép khớp chữ (`thuatNgu`, `diem`) dùng chung cho tra trang và tra sổ.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { docTriThuc, giaiGoc, dongKhongDoc, gocCheckoutChinh } = require('./tri-thuc-khoa.cjs');
const TN = require('./tri-thuc-nguon.cjs');

const KHOA_TRA = 'tri_thuc_tra';
const KHOA_SO = 'so';
// Ngưỡng của lệnh tra: điểm = số thuật ngữ khác nhau của câu có mặt; trần số trang, số dòng sổ (không tính trang nền).
const TRA = { diemToiThieu: 2, trangToiDa: 8, soToiDa: 8 };
const BIN_TT = path.join(__dirname, 'tri-thuc.mjs');
const KET = { 0: 'khop', 1: 'lech', 2: 'sai', 3: 'khong-doc' };
// Chữ trên thẻ — một nguồn cho thẻ và bộ kiểm.
const CO = {
  chuaTra: 'CHƯA vào được Cổng Phạm vi: chưa tra tri thức — kho đã khai tri_thuc mà sổ bước thiết kế không có dòng tra (khối DEC-TRI-THUC-TRA). Máy tra trang, ghi dòng rồi dựng lại thẻ.',
  chuaTraTrang: ds => `CHƯA vào được Cổng Phạm vi: chưa tra tri thức — chưa tra: ${ds.join(', ')} (trang ô đã nêu ở dòng «Nguồn:»). Máy tra trang, ghi dòng tra mới rồi dựng lại thẻ.`,
  chuaTraSo: 'CHƯA vào được Cổng Phạm vi: chưa tra sổ quyết định của hồ sơ trước — dòng tra thiếu mảng so (khối DEC-TRI-THUC-TRA). Máy chạy lệnh tra (khối TRI-THUC-TRA-MO-TA), ghi dòng tra mới rồi dựng lại thẻ.',
  soVang: r => `dòng sổ hồ sơ trước không có: ${r}`,
  khongLienQuan: 'đã tra, không có trang liên quan',
  lech: r => `trang tri thức không khớp bản đã tra: ${r}`,
  sai: r => `đường trỏ tri thức sai khuôn: ${r}`,
  khongDoc: d => d,
  khoiLoi: l => `khối tri_thuc lỗi — ${l.join('; ')}: chưa kiểm dòng tra tri thức.`,
  docCu: 'hồ sơ đã qua Cổng Phạm vi không có dòng tra tri thức — đọc như cũ, không chặn.',
};
const VANG = 'fwarn tri-thuc';

function docCfg(root) {
  const p = path.join(root, '_acceptance', 'config.yaml');
  return docTriThuc(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
}
// Một đường trỏ → mã thoát của --con-tro (mã lạ / tiến trình chết → 'sai' kèm dòng lỗi).
function kiemTro(root, ref) {
  const r = spawnSync(process.execPath, [BIN_TT, '--root', root, '--con-tro', String(ref)], { encoding: 'utf8' });
  const dong = String(r.stdout || r.stderr || '').trim().split('\n')[0] || '';
  return { ket: KET[r.status] || 'sai', thoat: r.status, dong };
}
const hopLe = o => !!o && typeof o === 'object' && !Array.isArray(o) && typeof o.tra === 'string' && o.tra.trim() !== '' && Array.isArray(o.trang) && o.trang.every(x => typeof x === 'string');
// Dòng tra còn hiệu lực cuối cùng: stage S1, khoá hợp lệ, không bị một dòng SAU nó thay.
function dongTra(entries) {
  const es = (entries || []).filter(e => e && typeof e === 'object');
  const biThay = new Set(); const viTri = new Map();
  es.forEach((e, i) => { if (typeof e.id === 'string' && !viTri.has(e.id)) viTri.set(e.id, i); });
  es.forEach((e, j) => { if (typeof e.supersedes === 'string' && viTri.has(e.supersedes) && viTri.get(e.supersedes) < j) biThay.add(e.supersedes); });
  let ra = null;
  for (const e of es) if (e.stage === 'S1' && hopLe(e[KHOA_TRA]) && !biThay.has(e.id)) ra = e;
  return ra;
}
// `<kho>:<đường>` của một đường trỏ (bỏ băm) — so trang ô đã nêu với trang đã tra.
const khoaTrang = (ref, re) => { const m = String(ref).match(re); return m ? `${m[1] ? `${m[1]}:` : ''}${m[2]}` : null; };

// Thẻ Cổng 1. → null (kho không khai) | { khoa, co: [[lớp, chữ]], chan, chuDo }
function theCong1({ root, entries, draft, oTxt }) {
  const cfg = docCfg(root);
  if (!cfg) return null;
  if (cfg.loi.length) return { khoa: { khai: true, loi: cfg.loi, chan: false }, co: draft ? [[VANG, CO.khoiLoi(cfg.loi)]] : [], chan: false, chuDo: null };
  const kh = TN.napKhuonNguon();
  const e = dongTra(entries);
  const o = TN.docDongNguon(oTxt || '', kh);
  const trang = e ? e[KHOA_TRA].trang.map(ref => ({ tro: ref, ...kiemTro(root, ref) })) : [];
  const daTra = new Set(trang.map(t => khoaTrang(t.tro, kh.conTro)).filter(Boolean));
  const chuaTra = e && !e[KHOA_TRA].khong_doc ? o.conTro.map(r => khoaTrang(r, kh.conTro)).filter(k => k && !daTra.has(k)) : [];
  const thieuSo = !!(e && !Array.isArray(e[KHOA_TRA][KHOA_SO]));
  const so = e && !thieuSo ? e[KHOA_TRA][KHOA_SO].map(ref => ({ tro: ref, ket: kiemSo(root, ref) })) : [];
  const chan = !!draft && (!e || chuaTra.length > 0 || thieuSo);
  const co = [];
  // Hồ sơ đã qua Cổng Phạm vi mà không dòng tra: đường đọc-cũ, một cờ vàng (luật kit: nhánh đọc bản cũ + cờ vàng).
  if (!draft && !e) co.push([VANG, CO.docCu]);
  if (draft && e) {
    if (typeof e[KHOA_TRA].khong_doc === 'string' && e[KHOA_TRA].khong_doc.trim()) co.push([VANG, CO.khongDoc(e[KHOA_TRA].khong_doc.trim())]);
    const kd = trang.find(t => t.ket === 'khong-doc');
    if (kd) co.push([VANG, CO.khongDoc(kd.dong)]);
    for (const t of trang) if (t.ket === 'lech') co.push([VANG, CO.lech(t.tro)]); else if (t.ket === 'sai') co.push([VANG, CO.sai(t.tro)]);
    for (const s of so) if (s.ket !== 'co') co.push([VANG, CO.soVang(s.tro)]);
  }
  const chuDo = !chan ? null : (!e ? CO.chuaTra : chuaTra.length ? CO.chuaTraTrang(chuaTra) : CO.chuaTraSo);
  return {
    khoa: { khai: true, dong: e ? (e.id || null) : null, tra: e ? e[KHOA_TRA].tra : null, trang: trang.map(t => ({ tro: t.tro, ket: t.ket })), nguon_o: o.conTro, chua_tra: chuaTra, so, thieu_so: thieuSo, khong_doc: !!(e && e[KHOA_TRA].khong_doc), chan },
    co, chan, chuDo,
  };
}

// Bộ xếp căn cứ (can-cu-s1.cjs): căn cứ nguồn mục tiêu mang khoá tri_thuc. → { lop, ma?, ghi_chu? }
// `base` (gốc nhánh) đã kiểm → trang trong kho phải có cùng băm ở gốc nhánh, không thì căn cứ sinh trong vòng.
function xetCanCu(c, { root, base }) {
  if (typeof c.tri_thuc !== 'string') return { lop: 'do', ma: 'tri-thuc-sai' };
  const cfg = docCfg(root);
  if (!cfg) return { lop: 'do', ma: 'tri-thuc-khong-khai' };
  const re = TN.napKhuonNguon().conTro;
  const m = c.tri_thuc.match(re);
  if (!m) return { lop: 'do', ma: 'tri-thuc-sai' };
  // Kho riêng theo kết quả giải đường, không theo tiền tố: ở kho khai kho riêng, đường trỏ không tiền tố cũng giải vào kho
  // riêng (hạt giống 2026-10-25-hat-giong-tro-kho-rieng-khong-tien-to, gộp ở TT5).
  const rieng = !giaiGoc(root, cfg).trongKho;
  if ((m[1] || rieng) && (c.trich !== undefined || c.tep !== undefined)) return { lop: 'do', ma: 'tri-thuc-kem-trich' };
  const k = kiemTro(root, c.tri_thuc);
  if (k.ket === 'khong-doc') return { lop: 'da-quyet', ghi_chu: k.dong };
  if (k.ket === 'lech') return { lop: 'do', ma: 'tri-thuc-lech' };
  if (k.ket !== 'khop') return { lop: 'do', ma: 'tri-thuc-sai' };
  if (base && !m[1] && !cfg.kho && cfg.noi) {
    const rel = path.posix.join(String(cfg.noi).replace(/\\/g, '/'), m[2]);
    const r = spawnSync('git', ['-C', root, 'rev-parse', '--verify', '--quiet', `${base}:${rel}`], { encoding: 'utf8' });
    if (r.status !== 0 || r.stdout.trim() !== m[3]) return { lop: 'do', ma: 'sinh-trong-vong' };
  }
  return { lop: 'da-quyet' };
}

// Phép khớp chữ của lệnh tra: NFC + chữ thường, tách âm tiết; thuật ngữ = cặp âm tiết liền nhau (1 điểm) + mã — chữ có cả
// chữ cái lẫn chữ số như `tt5`, `c2` (2 điểm: một mã khớp là đủ ngưỡng). Mỗi trường chấm riêng rồi hợp lại, để cặp âm
// tiết không bắc qua ranh hai trường.
const amTiet = s => String(s == null ? '' : s).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean);
const laMa = x => /\p{L}/u.test(x) && /\p{N}/u.test(x);
function thuatNgu(s) {
  const a = amTiet(s); const ra = new Set();
  for (let i = 0; i + 1 < a.length; i++) ra.add(`${a[i]} ${a[i + 1]}`);
  for (const x of a) if (laMa(x)) ra.add(x);
  return ra;
}
function diem(tn, ...truong) {
  const c = new Set(); for (const s of truong.flat()) for (const x of thuatNgu(s)) c.add(x);
  let n = 0; for (const t of tn) if (c.has(t)) n += t.includes(' ') ? 1 : 2;
  return n;
}

// Đường trỏ sổ `<hồ sơ>#<mã dòng>`.
const RE_SO = /^([A-Za-z0-9][A-Za-z0-9._-]*)#(\S+)$/;
const docSoTho = (root, hs) => { try { return fs.readFileSync(path.join(root, '_acceptance', hs, 'decisions.jsonl'), 'utf8'); } catch (_) { return null; } };
function dongCuaSo(txt) {
  const es = []; let hong = 0;
  for (const l of String(txt).split('\n')) {
    if (!l.trim()) continue;
    try { const e = JSON.parse(l); if (e && typeof e === 'object' && !Array.isArray(e)) es.push(e); else hong++; } catch (_) { hong++; }
  }
  return { es, hong };
}
// → 'co' | 'khong' | 'sai'
function kiemSo(root, ref) {
  const m = typeof ref === 'string' ? ref.match(RE_SO) : null;
  if (!m) return 'sai';
  const t = docSoTho(root, m[1]);
  if (t === null) return 'khong';
  return dongCuaSo(t).es.some(e => e.id === m[2]) ? 'co' : 'khong';
}
// Câu trích dựng sẵn cho căn cứ trỏ dòng sổ: đoạn dài nhất của `decision` mà dạng JSON trùng dạng chữ, có mặt nguyên văn
// trong chữ thô của tệp sổ (bộ xếp so `trich` với chữ thô).
function trichSo(decision, tho) {
  const { TRICH_MIN } = require('./can-cu-s1.cjs');
  const gom = s => String(s).replace(/\s+/g, ' ').trim();
  const ung = String(decision).split(/["\\\u0000-\u001f]/).map(gom).filter(x => x.length >= TRICH_MIN).sort((a, b) => b.length - a.length);
  return ung.find(x => gom(tho).includes(x)) || null;
}
// Tra sổ quyết định của mọi hồ sơ trừ `slug` (E1). → { so: [{tro, ho_so, id, stage, decision, nguoi, diem, can_cu?}], hong }
function traSo({ root, cau, slug = null }) {
  const tn = thuatNgu(cau); const ra = []; let hong = 0;
  let ds = [];
  try { ds = fs.readdirSync(path.join(root, '_acceptance'), { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.')).map(d => d.name).sort(); } catch (_) { ds = []; }
  for (const hs of ds) {
    if (hs === slug) continue;
    const tho = docSoTho(root, hs); if (tho === null) continue;
    const { es, hong: h } = dongCuaSo(tho); hong += h;
    const viTri = new Map(); es.forEach((e, i) => { if (typeof e.id === 'string' && !viTri.has(e.id)) viTri.set(e.id, i); });
    const biThay = new Set(); es.forEach((e, j) => { if (typeof e.supersedes === 'string' && viTri.has(e.supersedes) && viTri.get(e.supersedes) < j) biThay.add(e.supersedes); });
    for (const e of es) {
      if (typeof e.id !== 'string' || typeof e.decision !== 'string' || biThay.has(e.id)) continue;
      const d = diem(tn, e.decision, typeof e.why === 'string' ? e.why : '');
      if (d < TRA.diemToiThieu) continue;
      const nguoi = e.stage === 'gate1' || e.stage === 'gate2' || typeof e.decided_by === 'string';
      const trich = trichSo(e.decision, tho);
      ra.push({ tro: `${hs}#${e.id}`, ho_so: hs, id: e.id, stage: e.stage || null, decision: e.decision, nguoi, diem: d, at: typeof e.at === 'string' ? e.at : '',
        ...(trich ? { can_cu: { nguon: 'muc-tieu', kho_dao: false, tep: `_acceptance/${hs}/decisions.jsonl`, trich } } : {}) });
    }
  }
  ra.sort((a, b) => b.diem - a.diem || (b.nguoi - a.nguoi) || b.at.localeCompare(a.at) || a.tro.localeCompare(b.tro));
  return { so: ra.slice(0, TRA.soToiDa).map(({ at, ...x }) => x), hong };
}

// Tự clone kho riêng (C4). → { thoat, dong }
function clone(root) {
  const cfg = docCfg(root);
  if (!cfg) return { thoat: 2, dong: 'tri-thuc-tra: kho chưa khai tri_thuc trong _acceptance/config.yaml' };
  if (cfg.loi.length) return { thoat: 2, dong: `tri-thuc-tra: ${cfg.loi.join('; ')}` };
  const { goc, trongKho } = giaiGoc(root, cfg);
  if (trongKho) return { thoat: 0, dong: `kho tri thức nằm trong kho: ${goc}` };
  if (fs.existsSync(goc)) return { thoat: 0, dong: `đã có: ${goc}` };
  // Kho riêng giữ raw và trang nhạy cảm: clone vào cây của kho đang chạy (checkout chính hay worktree) là một lần git add
  // tới chỗ lộ không thu hồi được — từ chối.
  const trongCay = [gocCheckoutChinh(root), fs.realpathSync(root)].some(b => { const r = path.relative(b, goc); return !r.startsWith('..') && !path.isAbsolute(r); });
  if (trongCay) return { thoat: 3, dong: `không đọc được ở đây: ${cfg.kho.ten} — đường kho riêng ${goc} nằm trong cây kho; khai kho.duong ra ngoài cây (vd ../${cfg.kho.ten}) để máy clone hộ` };
  if (!cfg.kho.remote) return { thoat: 3, dong: dongKhongDoc(cfg) + goc };
  const r = spawnSync('git', ['clone', '-q', cfg.kho.remote, goc], { encoding: 'utf8' });
  if (r.status !== 0) return { thoat: 3, dong: `không đọc được ở đây: ${cfg.kho.ten} — clone thất bại: ${String(r.stderr || '').trim().split('\n')[0]}` };
  return { thoat: 0, dong: `đã clone ${cfg.kho.remote} → ${goc}` };
}

module.exports = { KHOA_TRA, KHOA_SO, TRA, CO, KET, RE_SO, dongTra, kiemTro, kiemSo, theCong1, xetCanCu, clone, docCfg, thuatNgu, diem, traSo };

if (require.main === module) {
  const a = process.argv.slice(2); const opt = n => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; };
  const root = path.resolve(opt('--root') || '.');
  if (!a.includes('--clone')) { process.stderr.write('tri-thuc-tra: cần --clone\n'); process.exit(2); }
  const kq = clone(root);
  (kq.thoat === 2 ? process.stderr : process.stdout).write(kq.dong + '\n');
  process.exit(kq.thoat);
}
