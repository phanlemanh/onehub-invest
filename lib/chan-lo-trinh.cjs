// chan-lo-trinh.cjs — MỘT bộ đọc cho luật «kho cam kết có lộ trình thì hồ sơ mới phải thuộc một hàng» (hồ sơ
// kho-cam-ket-co-lo-trinh, hàng RM5, nấc 4 + nấc 3 của ADR 0025). Ba bên gọi: hook ghi tệp (lúc MỞ hồ sơ), lưới
// trước-merge (lúc GỘP, chế độ dòng lệnh dưới đây), `lo-trinh.mjs --them-hang` (nấc 3). Thiết kế:
// docs/superpowers/specs/2026-10-16-kho-cam-ket-co-lo-trinh-design.md.
//
// BẬT = gói `road-map` bật ở `.claude/settings.json` của kho (tệp đội commit; local và phạm vi người dùng KHÔNG tính —
// cùng luật `docBat` của scripts/lo-trinh-khoi-tao.mjs, RM4) VÀ `lo_trinh.chan: true` trong `_acceptance/config.yaml`.
// Gói không bật → khoá không được đọc. Khoá vắng hay `false` → tắt. Giá trị khác → lỗi có tên, không đoán.
//
// NỐI = cùng phép nối của bản đồ lộ trình (`suyTrangThai` của scripts/lo-trinh.mjs): một hàng của tệp đã khai mang
// `slug` = hồ sơ, HOẶC ô cơ hội của hồ sơ ghi `lo_trinh_ma` trỏ một hàng có thật (trong `lo_trinh_tep` nếu ghi). Bộ
// kiểm của hồ sơ đối chiếu phán ở đây với `phanTichKho` trên cùng kho thử để hai bên không trôi.
//
// MỚI = hồ sơ chưa có `contract.md` lẫn `opportunity.md` (hook) · hồ sơ mà ở base chưa có tệp nào trong hai còn ở HEAD
// có (lưới trước-merge). Hồ sơ cũ không bao giờ bị chấm.
//
// CLI: node lib/chan-lo-trinh.cjs --root <kho> (--base <ref> | --khong-base)
//   kho không bật → không in gì, thoát 0 · bật → mỗi hồ sơ mới không nối một dòng VIOLATION, thoát 1 nếu có ·
//   khoá sai giá trị → một dòng VIOLATION, thoát 1 · --khong-base ở kho bật → một dòng NOTE, thoát 0 · sai tham số → 2.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GOI = path.resolve(__dirname, '..');
const GOI_ROAD_MAP = 'road-map';
const CAU_KHOA_SAI = 'lo_trinh.chan phải là true hoặc false';
const DONG_VIPHAM = slug => `VIOLATION [${slug}]: hồ sơ mới không thuộc hàng lộ trình nào (lo_trinh.chan)`;
const DONG_KHONG_BASE = 'NOTE: luật chặn lộ trình NOT ENFORCED — không có phạm vi diff (truyền --base cho lưới trước-merge)';

const docTho = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const tonTai = p => { try { return fs.statSync(p).isFile(); } catch { return false; } };

// Thư mục chứa `_acceptance/` gần nhất, đi lên từ `tuThuMuc` (kể cả khi chính nó là `_acceptance`).
function gocKho(tuThuMuc) {
  let cur = path.resolve(tuThuMuc);
  for (let i = 0; i < 40; i++) {
    if (path.basename(cur) === '_acceptance' && tonTai(path.join(cur, 'config.yaml'))) return path.dirname(cur);
    if (tonTai(path.join(cur, '_acceptance', 'config.yaml'))) return cur;
    const len = path.dirname(cur);
    if (len === cur) return null;
    cur = len;
  }
  return null;
}

// Khoá bật `road-map@<marketplace>` — rút từ marketplace.json của gói (cùng luật `khoaBat` của RM4).
function khoaBat(marketplacePath = path.join(GOI, '.claude-plugin', 'marketplace.json')) {
  let j;
  try { j = JSON.parse(fs.readFileSync(marketplacePath, 'utf8')); } catch { return null; }
  const p = (Array.isArray(j.plugins) ? j.plugins : []).find(x => x && x.name === GOI_ROAD_MAP);
  return p && j.name ? `${p.name}@${j.name}` : null;
}

// → { bat: bool } · ném { ma: 3 } khi .claude/settings.json không phải JSON. Chỉ settings.json (của đội).
// `khoa` null = bộ đọc chạy từ BẢN CHÉP CI trong kho tiêu thụ (không có marketplace.json của gói): nhận mọi khoá
// `road-map@<marketplace>` bật trong settings.json của chính kho — tệp ấy là lựa chọn của đội, không phải của một người.
function docBat(root, khoa) {
  const t = docTho(path.join(root, '.claude', 'settings.json'));
  if (t == null) return { bat: false };
  let s;
  try { s = JSON.parse(t); } catch { throw Object.assign(new Error('.claude/settings.json không phải JSON'), { ma: 3 }); }
  const ep = s && s.enabledPlugins && typeof s.enabledPlugins === 'object' ? s.enabledPlugins : {};
  if (khoa) return { bat: ep[khoa] === true };
  return { bat: Object.keys(ep).some(k => k.startsWith(`${GOI_ROAD_MAP}@`) && ep[k] === true) };
}

// Khối `lo_trinh:` ở cột 0 của config (cùng cách cắt của scripts/lo-trinh-khoa.cjs), rồi khoá `chan:` thụt hai dấu cách.
// → undefined (vắng) | chuỗi giá trị đã bỏ chú thích và nháy.
function giaTriChan(cfgText) {
  const dong = String(cfgText || '').replace(/\r\n?/g, '\n').split('\n');
  const i = dong.findIndex(l => /^lo_trinh:\s*(#.*)?$/.test(l));
  if (i < 0) return undefined;
  for (const l of dong.slice(i + 1)) {
    if (/^\s*(#.*)?$/.test(l)) continue;
    if (/^\S/.test(l)) break;
    const m = l.match(/^ {2}chan:(.*)$/);
    if (m) return m[1].replace(/\s+#.*$/, '').replace(/^\s*#.*$/, '').trim();
  }
  return undefined;
}

// → { bat: false } | { bat: true } | { loi: CAU_KHOA_SAI } | { loi: '<settings hỏng>' }
function trangThaiChan(root, { marketplacePath } = {}) {
  // Khoá chặn đọc TRƯỚC settings (S4 lượt 1, AC-6): kho chưa khai chặn thì .claude/settings.json hỏng không phải việc
  // của luật này — kho ấy phải giữ từng byte như trước. Chỉ kho đã khai khoá mới nghe lỗi settings.
  const v = giaTriChan(docTho(path.join(root, '_acceptance', 'config.yaml')));
  if (v === undefined || v === '' || v === 'false') return { bat: false };
  let b;
  try { b = docBat(root, khoaBat(marketplacePath)); } catch (e) { return { loi: `${e.message} (lo_trinh.chan đang khai)` }; }
  if (!b.bat) return { bat: false };
  if (v === 'true') return { bat: true };
  return { loi: CAU_KHOA_SAI };
}

function cacTepKhai(root) {
  const { cacTepTuConfig } = require(path.join(GOI, 'scripts', 'lo-trinh-khoa.cjs'));
  const v = cacTepTuConfig(docTho(path.join(root, '_acceptance', 'config.yaml')));
  return v ? v.tep : [];
}
// → { tep, hang: [] } cho mỗi tệp khai; tệp đọc lỗi mang `loi`.
function docCacLoTrinh(root) {
  return cacTepKhai(root).map(tep => {
    const t = docTho(path.join(root, tep));
    if (t == null) return { tep, loi: `không đọc được tệp lộ trình ${tep}`, hang: [] };
    try {
      const d = JSON.parse(t);
      return { tep, hang: Array.isArray(d && d.hang) ? d.hang.filter(r => r && typeof r === 'object') : [] };
    } catch { return { tep, loi: `tệp lộ trình ${tep} không phải JSON`, hang: [] }; }
  });
}

const chuoi = v => (v == null ? '' : String(v).trim());
// → { noi: true } | { noi: false, ly_do: 'khong-hang' | 'ma-sai' | 'tep-loi', ma?, tep?, loi? }
function noi(root, slug, { opportunityDangGhi = null } = {}) {
  const { frontmatterField } = require(path.join(GOI, 'lib', 'evidence-core.cjs'));
  const ds = docCacLoTrinh(root);
  const loiTep = ds.find(x => x.loi);
  if (ds.some(x => x.hang.some(r => chuoi(r.slug) === slug))) return { noi: true };
  const opp = opportunityDangGhi != null ? opportunityDangGhi : docTho(path.join(root, '_acceptance', slug, 'opportunity.md'));
  const boNhay = s => chuoi(s).replace(/^["']|["']$/g, '');
  const ma = opp ? boNhay(frontmatterField(opp, 'lo_trinh_ma')) : '';
  if (ma) {
    const tep = opp ? boNhay(frontmatterField(opp, 'lo_trinh_tep')) : '';
    if (tep && !ds.some(x => x.tep === tep)) return { noi: false, ly_do: 'ma-sai', ma, tep };
    const pham = ds.filter(x => !tep || x.tep === tep);
    if (pham.some(x => x.hang.some(r => chuoi(r.ma) === ma))) return { noi: true };
    if (loiTep) return { noi: false, ly_do: 'tep-loi', loi: loiTep.loi };
    return { noi: false, ly_do: 'ma-sai', ma, ...(tep ? { tep } : {}) };
  }
  if (loiTep) return { noi: false, ly_do: 'tep-loi', loi: loiTep.loi };
  return { noi: false, ly_do: 'khong-hang' };
}

function laHoSoMoi(root, slug) {
  const d = path.join(root, '_acceptance', slug);
  return !tonTai(path.join(d, 'contract.md')) && !tonTai(path.join(d, 'opportunity.md'));
}

// Hồ sơ mà ở base chưa có contract.md lẫn opportunity.md, còn ở HEAD có — đường dẫn tương đối gốc git.
function hoSoMoiTrongDiff(root, base) {
  const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const top = git('rev-parse', '--show-toplevel').trim();
  const tienTo = path.relative(top, root).split(path.sep).filter(Boolean).join('/');
  const tien = tienTo ? `${tienTo}/_acceptance/` : '_acceptance/';
  const cua = ref => {
    const s = new Set();
    for (const f of git('ls-tree', '-r', '--name-only', ref, '--', tien.replace(/\/$/, '')).split('\n')) {
      if (!f.startsWith(tien)) continue;
      const m = f.slice(tien.length).match(/^([^/]+)\/(contract|opportunity)\.md$/);
      if (m) s.add(m[1]);
    }
    return s;
  };
  const truoc = cua(base); const sau = cua('HEAD');
  return [...sau].filter(s => !truoc.has(s)).sort();
}

module.exports = {
  CAU_KHOA_SAI, DONG_VIPHAM, DONG_KHONG_BASE, gocKho, khoaBat, docBat, giaTriChan, trangThaiChan, docCacLoTrinh, noi,
  laHoSoMoi, hoSoMoiTrongDiff,
};

if (require.main === module) {
  const a = process.argv.slice(2);
  const thoat = (c, m) => { if (m) process.stderr.write(`chan-lo-trinh: ${m}\n`); process.exit(c); };
  let root = null; let base = null; let khongBase = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--root' || a[i] === '--base') {
      const v = a[i + 1]; if (v == null || v === '' || v.startsWith('--')) thoat(2, `${a[i]} cần một giá trị`);
      if (a[i] === '--root') root = v; else base = v; i++;
    } else if (a[i] === '--khong-base') khongBase = true;
    else thoat(2, `tham số lạ ${a[i]} — dùng --root <kho> (--base <ref> | --khong-base)`);
  }
  if (!root || (!base && !khongBase) || (base && khongBase)) thoat(2, 'dùng --root <kho> (--base <ref> | --khong-base)');
  root = path.resolve(root);
  const tt = trangThaiChan(root);
  if (tt.loi) { process.stdout.write(`VIOLATION [config]: ${tt.loi}\n`); process.exit(1); }
  if (!tt.bat) process.exit(0);
  if (khongBase) { process.stdout.write(DONG_KHONG_BASE + '\n'); process.exit(0); }
  let moi;
  try { moi = hoSoMoiTrongDiff(root, base); } catch (e) { thoat(2, `không đọc được diff với ${base}: ${String(e.message).split('\n')[0]}`); }
  const lot = moi.filter(s => !noi(root, s).noi);
  if (lot.length) process.stdout.write(lot.map(DONG_VIPHAM).join('\n') + '\n');
  process.exit(lot.length ? 1 : 0);
}
