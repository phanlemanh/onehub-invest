// do-san-tren-nen.cjs — MỘT nguồn luật của nhãn trạng thái «đỏ sẵn trên nền» (hồ sơ ho-so-da-ky-giu-tuoi,
// hàng K-A). Bên viết nhãn (feature-loop/scripts/repin-lane.mjs) và bên đọc (checkRepinEvals trong
// evidence-core.cjs — lưới trước-gộp và recheck-evidence.cjs cùng gọi) dùng CHÍNH các hàm dưới; ai thêm bên
// đọc thứ ba thì gọi hàm này — hai bản luật là hai khuôn sẽ trôi.
//
// Nhãn KHÔNG phải ĐẠT: eval vẫn mang mã khác 0 trong dòng ghim; nhãn chỉ thôi chặn một vòng KHÁC khi cái đỏ ấy
// đã được ghi trên nhánh chính (dòng `kind: "nen-do"` do lệnh giữ tươi ghi) với ĐÚNG eval, ĐÚNG ca và thông
// điệp lỗi, ĐÚNG định nghĩa eval, dòng nền có ở ĐIỂM TÁCH của cây đang xét với nhánh chính (không đọc trong cây
// đang xét — nhánh vòng tự ghi dòng nền thì không tính), và dòng nền không phải đỏ hạ tầng. Thiếu bất kỳ vế nào
// → đỏ như cũ.
// Khoá `feature_loop.do_san_tren_nen` vắng/false → tắt: mọi bên đọc cư xử như trước vòng.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const KHOA = 'feature_loop.do_san_tren_nen';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ── khoá ────────────────────────────────────────────────────────────────────────
// Nạp muộn: evidence-core.cjs nạp lib này, nên nạp ngược lúc gọi để khỏi vòng nạp lúc khởi động.
function khoaTuText(configText) {
  const core = require('./evidence-core.cjs');
  const v = configText == null ? null : core.resolveConfigKey(configText, KHOA);
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  const e = new Error(`${KHOA}: "${v}" không hợp lệ — dùng true | false`);
  e.khoa = KHOA;
  throw e;
}
function docKhoaDoSan(root) {
  const p = path.join(root, '_acceptance', 'config.yaml');
  return khoaTuText(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
}

// ── thông điệp đỏ ───────────────────────────────────────────────────────────────
// Chuẩn hoá: bỏ thứ đổi giữa hai lần chạy cùng một lỗi — dấu giờ, thời lượng, đường dẫn tuyệt đối, số
// dòng:cột, chuỗi hex dài (sha, id tạm), số cổng/pid. Thông điệp lỗi giữ nguyên chữ.
function chuanHoa(dong) {
  return String(dong)
    .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z?/g, '<gio>')
    .replace(/\[?\d+(\.\d+)?\s?(ms|s)\]?(?![a-z])/gi, '<tg>')
    .replace(/(^|[\s(=:'"])\/[^\s:'")]+/g, '$1<duong>')
    .replace(/:\d+(:\d+)?\b/g, ':<so>')
    .replace(/\b[0-9a-f]{7,}\b/gi, '<hex>')
    .replace(/\bpid\s*\d+/gi, 'pid <so>')
    .replace(/\s+/g, ' ')
    .trim();
}
const laDongCa = (dong, tenCa) => tenCa.some(t => dong.includes(t));
// Đoạn lỗi của một ca = các dòng nằm giữa dòng ca trước và dòng ca sau (tối đa 6 dòng mỗi phía), cộng chính
// dòng ca. Bộ chạy in lỗi TRƯỚC dòng «(fail)» (bun) hoặc SAU dòng «not ok» (node) — lấy cả hai phía.
function doanCa(dongs, i, moc) {
  const truoc = moc.filter(j => j < i).pop();
  const sau = moc.find(j => j > i);
  const tu = Math.max(truoc === undefined ? 0 : truoc + 1, i - 6);
  const den = Math.min(sau === undefined ? dongs.length - 1 : sau - 1, i + 6);
  return dongs.slice(tu, den + 1);
}
function catDongs(logText) { return String(logText || '').split('\n').map(s => s.replace(/\r$/, '')).filter(s => s.trim()); }
function cacMocCa(dongs, tenCa) {
  const moc = [];
  dongs.forEach((d, i) => { if (/\((pass|fail|skip)\)|^\s*(not )?ok \d+|✓|✗|PASS|FAIL/.test(d) || laDongCa(d, tenCa)) moc.push(i); });
  return moc;
}
// Mọi dòng BÁO HỎNG của nhật ký (dòng ca đỏ của bun/node/kit, dòng tổng kết «N fail»), chuẩn hoá và khử trùng — vào băm ở MỌI
// nhánh. Vì sao (S4 lượt 1, finding trong AC-6): tên ca do bộ rút tên trả về có trần 10 dòng, bun in mỗi ca đỏ hai lần, và nhánh
// không tên ca chỉ nhìn 20 dòng cuối — một ca đỏ MỚI ngoài các cửa sổ ấy cho cùng băm và lọt nhờ nhãn. Tập dòng báo hỏng
// không có trần: thêm một ca đỏ hay đổi số đếm tổng kết là đổi băm.
const DONG_HONG = /\(fail\)|^\s*not ok\b|\bFAIL\b|✗|✖|\b\d+\s+fail(ed|ures?)?\b/i;
function tapDongHong(dongs) { return [...new Set(dongs.filter(d => DONG_HONG.test(d)).map(chuanHoa))].sort(); }
function bamThongDiep(logText, tenCa) {
  const dongs = catDongs(logText);
  const hong = tapDongHong(dongs).join('\n');
  const ca = Array.isArray(tenCa) ? tenCa.filter(t => t && t !== 'không rút được tên ca') : [];
  if (!ca.length) return sha256(`${hong}\n--\n${dongs.slice(-20).map(chuanHoa).join('\n')}`);
  const moc = cacMocCa(dongs, ca);
  const cap = [];
  for (const t of ca) {
    const i = dongs.findIndex(d => d.includes(t));
    const doan = i < 0 ? [] : doanCa(dongs, i, moc).filter(d => !laDongCa(d, ca));
    cap.push(`${t}\t${doan.map(chuanHoa).join(' | ')}`);
  }
  return sha256(`${hong}\n--\n${cap.sort().join('\n')}`);
}
function trichThongDiep(logText, tenCa) {
  const dongs = catDongs(logText);
  const ca = Array.isArray(tenCa) ? tenCa.filter(t => t && t !== 'không rút được tên ca') : [];
  const lay = ca.length ? dongs.filter(d => laDongCa(d, ca)).slice(0, 2) : [];
  if (ca.length) {
    const i = dongs.findIndex(d => d.includes(ca[0]));
    const loi = i < 0 ? [] : doanCa(dongs, i, cacMocCa(dongs, ca)).filter(d => !laDongCa(d, ca));
    if (loi.length) lay.push(loi[0]);
  } else lay.push(...dongs.slice(-3));
  return lay.slice(0, 3).map(d => d.trim().slice(0, 200)).join('\n');
}

// ── định nghĩa eval ─────────────────────────────────────────────────────────────
// Băm khối `- id: <E>` của evals.yaml (tới khối eval kế, bỏ dòng chú thích và khoảng trắng cuối dòng).
function bamDinhNghia(evalsText, evalId) {
  const dongs = String(evalsText || '').split('\n');
  const dau = dongs.findIndex(d => new RegExp(`^(\\s*)- id:\\s*${evalId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`).test(d));
  if (dau < 0) return null;
  const thut = dongs[dau].match(/^(\s*)/)[1].length;
  const khoi = [dongs[dau]];
  for (let i = dau + 1; i < dongs.length; i++) {
    const d = dongs[i];
    if (d.trim() && d.match(/^(\s*)/)[1].length <= thut) break;
    khoi.push(d);
  }
  return sha256(khoi.filter(d => !/^\s*#/.test(d)).map(d => d.replace(/\s+$/, '')).filter(Boolean).join('\n'));
}

// ── dòng nền ────────────────────────────────────────────────────────────────────
function docDongNen(root, slug, ref) {
  const rel = `_acceptance/${slug}/run-log.jsonl`;
  let text = '';
  try {
    text = ref
      ? execFileSync('git', ['-C', root, 'show', `${ref}:${rel}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 })
      : fs.readFileSync(path.join(root, rel), 'utf8');
  } catch (_) { return []; }
  const ra = [];
  for (const l of text.split('\n')) {
    if (!l.trim()) continue;
    try { const e = JSON.parse(l); if (e && e.kind === 'nen-do' && Array.isArray(e.lenh_do)) ra.push(e); } catch (_) { /* dòng hỏng: bỏ qua */ }
  }
  return ra;
}
// ── điểm tách với nhánh chính ───────────────────────────────────────────────────────────────────────────
// MỘT chỗ dò nhánh chính cho cả bên viết (repin-lane) lẫn bên đọc (checkRepinEvals). Chỉ đọc ref cục bộ — không
// gọi mạng. Thứ tự: origin/HEAD (remote khai) → origin/<tên quen> → <tên quen> cục bộ. origin/HEAD có mà không giải
// được → KHÔNG đoán sang tên khác (cùng luật với s4-args.mjs PROBE-REGION). HEAD đang đứng trên chính nhánh chính
// (tên nhánh hiện tại là nhánh dò ra, hay HEAD trùng commit của nó) → điểm tách = HEAD. Không dò được → sha null
// kèm lý do; bên gọi KHÔNG gắn nhãn (đóng về phía đỏ).
const TEN_NHANH_CHINH = ['main', 'master', 'develop', 'trunk'];
// Không đệm kết quả: HEAD có thể đổi giữa hai lời gọi trong cùng tiến trình; năm lời git rẻ hơn một điểm tách cũ.
function diemTachNhanhChinh(root, headRef = 'HEAD') {
  const gt = (...a) => { try { return execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }).trim(); } catch (_) { return null; } };
  const coRef = (r) => gt('rev-parse', '--verify', '--quiet', `${r}^{commit}`);
  let nhanh = null, lyDo = null;
  const khai = gt('symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD');
  if (khai) {
    const ten = khai.replace(/^refs\/remotes\//, '');
    if (coRef(ten)) nhanh = ten;
    else lyDo = `remote khai nhánh chính «${ten}» nhưng cây này không giải được — không đoán sang tên khác`;
  } else {
    for (const c of [...TEN_NHANH_CHINH.map(b => `origin/${b}`), ...TEN_NHANH_CHINH]) if (coRef(c)) { nhanh = c; break; }
    if (!nhanh) lyDo = `không dò được nhánh chính (không origin/HEAD, không ${TEN_NHANH_CHINH.join('/')} ở origin hay cục bộ)`;
  }
  if (!nhanh) return { sha: null, nhanh: null, lyDo };
  const head = coRef(headRef);
  const hienTai = gt('symbolic-ref', '--quiet', '--short', 'HEAD');
  const tenNgan = nhanh.replace(/^origin\//, '');
  const trenNhanhChinh = head && headRef === 'HEAD' && (hienTai === tenNgan || head === coRef(nhanh));
  const sha = trenNhanhChinh ? head : (head ? gt('merge-base', nhanh, head) : null);
  return sha ? { sha, nhanh, lyDo: null } : { sha: null, nhanh, lyDo: `không tính được điểm tách giữa ${nhanh} và ${headRef}` };
}
function laToTien(root, a, b) {
  try { execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', a, b], { stdio: 'ignore' }); return true; } catch (_) { return false; }
}

const CAU = {
  'khoa-tat': `khoá ${KHOA} tắt — nhãn không áp`,
  'khong-co-dong-nen': 'không có dòng nền đỏ nào ghi eval này (đúng lượt nền được trỏ) trên nhánh chính',
  'khac-ca-hoac-thong-diep': 'eval đỏ ở ca khác hoặc với thông điệp lỗi khác dòng nền — một cái đỏ mới',
  'doi-dinh-nghia': 'định nghĩa eval trong evals.yaml đã đổi so với lúc ghi dòng nền',
  'nen-khong-tren-nhanh-chinh': 'dòng nền đỏ không nằm trên lịch sử nhánh chính của cây đang xét (đọc ở điểm tách với nhánh chính — dòng do chính nhánh vòng ghi không tính)',
  'nen-la-ha-tang': 'dòng nền là đỏ hạ tầng — không làm nền',
};
const cauVeHong = (ve) => CAU[ve] || ve;

// Kết cục của lệnh giữ tươi được làm nền. `ha-tang` (lệnh không chạy được, bị ngắt, chập chờn) KHÔNG bao giờ làm
// nền: cái đỏ ấy không phải một sự thật về vật trên nhánh chính. Thiếu `ket_cuc` cũng không (đóng về phía đỏ).
const KET_CUC_LAM_NEN = new Set(['do-khoang', 'nhieu-pr', 'do-san-truoc-khoang']);

// Kiểm một eval đỏ có được nhãn không. Đọc dòng nền ở `baseRef`:
//   · vắng (mặc định, mọi bên đọc) → điểm tách của `headRef` với nhánh chính (diemTachNhanhChinh); không dò được →
//     vế `nen-khong-tren-nhanh-chinh`, không gắn nhãn;
//   · một ref (bên viết truyền chính điểm tách nó đã dò) → đọc ở ref ấy;
//   · null → đọc cây làm việc — CHỈ cho ca đơn vị của luật, không bên viết/đọc thật nào dùng.
// Dòng khớp có trong cây làm việc mà không có ở điểm tách → `nen-khong-tren-nhanh-chinh` (nhánh vòng tự ghi nền).
// `runId` có → khớp đúng lượt nền ấy (bên đọc trích từ `do_san`).
function kiemDoSan({ root, slug, evalId, bam, dinhNghia, headRef = 'HEAD', baseRef, runId = null, khoa }) {
  if (!khoa) return { dat: false, veHong: 'khoa-tat' };
  let ref = baseRef;
  if (ref === undefined) {
    const d = diemTachNhanhChinh(root, headRef);
    if (!d.sha) return { dat: false, veHong: 'nen-khong-tren-nhanh-chinh', lyDo: d.lyDo };
    ref = d.sha;
  }
  const khop = (e) => (!runId || e.run_id === runId) && e.lenh_do.some(x => x && x.eval === evalId);
  const dongs = docDongNen(root, slug, ref).filter(khop);
  if (!dongs.length) {
    if (ref !== null && docDongNen(root, slug, null).some(khop)) return { dat: false, veHong: 'nen-khong-tren-nhanh-chinh' };
    return { dat: false, veHong: 'khong-co-dong-nen' };
  }
  const nen = dongs[dongs.length - 1];
  if (!KET_CUC_LAM_NEN.has(nen.ket_cuc)) return { dat: false, veHong: 'nen-la-ha-tang' };
  const muc = nen.lenh_do.filter(x => x && x.eval === evalId).pop();
  if (!bam || muc.thong_diep_bam !== bam) return { dat: false, veHong: 'khac-ca-hoac-thong-diep' };
  const dnNen = nen.dinh_nghia && nen.dinh_nghia[evalId];
  if (!dinhNghia || !dnNen || dnNen !== dinhNghia) return { dat: false, veHong: 'doi-dinh-nghia' };
  if (typeof nen.sha !== 'string' || !laToTien(root, nen.sha, headRef)) return { dat: false, veHong: 'nen-khong-tren-nhanh-chinh' };
  return { dat: true, veHong: null, runId: nen.run_id, pr: (nen.quy_ve || []).map(q => q && q.pr).filter(n => n != null) };
}

// Nhãn của MỘT hồ sơ cho mặt người (thẻ Cổng Bằng chứng, bản đồ sản phẩm). Dòng ghim CHỐNG LƯNG pin hiện tại
// (sha == verified_commit) mang `do_san` → hỏi CHÍNH checkRepinEvals (bên đọc của lưới trước-gộp và kiểm lại),
// nên thẻ và bản đồ không giữ bản luật thứ ba. → { note, ids } khi nhãn đạt; null mọi ca khác (không dòng mang
// `do_san`, khoá tắt, vế hỏng, tệp không đọc được) — mặt người khi ấy như trước vòng.
function nhanHoSo(dir) {
  const doc = (ten) => { try { return fs.readFileSync(path.join(dir, ten), 'utf8'); } catch (_) { return null; } };
  const report = doc('evidence-report.md');
  const vc = report == null ? null : (report.match(/^verified_commit\s*:\s*(\S+)/m) || [])[1];
  if (!vc) return null;
  const log = doc('run-log.jsonl');
  if (!log || !log.includes('"do_san"')) return null;
  const pin = log.split('\n').filter(l => /"kind"\s*:\s*"repin"/.test(l))
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(o => o && o.sha === vc).pop();
  if (!pin || !pin.do_san || typeof pin.do_san !== 'object' || Array.isArray(pin.do_san)) return null;
  let r;
  try { r = require('./evidence-core.cjs').checkRepinEvals(pin, doc('evals.yaml'), path.basename(dir), report, { root: path.resolve(dir, '..', '..') }); } catch (_) { return null; }
  if (!r || !r.note) return null;
  return { note: r.note, ids: Object.keys(pin.do_san).filter(id => r.note.includes(`— ${id} (`)) };
}

module.exports = { nhanHoSo, KHOA, KET_CUC_LAM_NEN, diemTachNhanhChinh, khoaTuText, docKhoaDoSan, chuanHoa, bamThongDiep, trichThongDiep, bamDinhNghia, docDongNen, kiemDoSan, cauVeHong };
