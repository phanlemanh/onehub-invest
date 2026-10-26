// tri-thuc-khoa.cjs — MỘT hàm đọc khối `tri_thuc` của _acceptance/config.yaml cho mọi bên đọc tầng tri thức. Tách riêng
// theo nếp lo-trinh-khoa.cjs: bên đọc biết khối vắng mà không nạp scripts/tri-thuc.mjs. Hồ sơ kho-tri-thuc-va-lint (TT1).
const { spawnSync } = require('node:child_process');
const { realpathSync } = require('node:fs');
const path = require('node:path');
const KHOA = 'tri_thuc';
const KHOA_BIET = ['noi', 'cong_khai', 'kho'];
const KHOA_KHO = ['ten', 'duong', 'remote'];
const boNhay = s => String(s).trim().replace(/^["']|["']$/g, '').trim();
const boChuThich = s => String(s).replace(/\s+#.*$/, '').trim();

function khoiTriThuc(cfgText) {
  const dong = String(cfgText || '').replace(/\r\n?/g, '\n').split('\n');
  const i = dong.findIndex(l => /^tri_thuc:\s*(#.*)?$/.test(l));
  if (i < 0) return null;
  const ra = [];
  for (const l of dong.slice(i + 1)) {
    if (/^\s*(#.*)?$/.test(l)) continue;
    if (/^\S/.test(l)) break;
    ra.push(l);
  }
  return ra;
}

// → null (khối vắng) | { noi, congKhai, kho: {ten, duong, remote}|null, loi: string[], canhBao: string[] }
function docTriThuc(cfgText) {
  const khoi = khoiTriThuc(cfgText);
  if (!khoi) return null;
  const ra = { noi: null, congKhai: false, kho: null, loi: [], canhBao: [] };
  let trongKho = false; let coKho = false; const kho = {};
  for (const l of khoi) {
    const m2 = l.match(/^ {2}([A-Za-z_]+):\s*(.*)$/);
    if (m2) {
      trongKho = false;
      const k = m2[1]; const v = boNhay(boChuThich(m2[2]));
      if (!KHOA_BIET.includes(k)) { ra.canhBao.push(`khoá lạ trong ${KHOA}: ${k}`); continue; }
      if (k === 'noi') ra.noi = v || null;
      else if (k === 'cong_khai') {
        if (v === 'true') ra.congKhai = true;
        else if (v === 'false') ra.congKhai = false;
        else ra.loi.push('cong_khai phải là true hoặc false');
      } else { coKho = true; trongKho = true; }
      continue;
    }
    const m4 = l.match(/^ {4}([A-Za-z_]+):\s*(.*)$/);
    if (m4 && trongKho) {
      if (!KHOA_KHO.includes(m4[1])) { ra.canhBao.push(`khoá lạ trong ${KHOA}.kho: ${m4[1]}`); continue; }
      kho[m4[1]] = boNhay(boChuThich(m4[2]));
    }
  }
  if (coKho) {
    if (!kho.ten) ra.loi.push('kho thiếu ten');
    if (!kho.duong) ra.loi.push('kho thiếu duong');
    ra.kho = { ten: kho.ten || null, duong: kho.duong || null, remote: kho.remote || null };
  }
  if (!ra.noi && !(ra.kho && ra.kho.duong)) ra.loi.unshift('khối tri_thuc thiếu noi hoặc kho.duong');
  return ra;
}

// Gốc checkout chính = cha của git-common-dir: giống nhau ở checkout chính và mọi worktree. Ba hàm dưới dời từ
// tri-thuc.mjs (hồ sơ thiet-ke-nap-tri-thuc) để bên đọc CJS dùng chung một luật giải đường kho riêng.
function gocCheckoutChinh(root) {
  const r = spawnSync('git', ['-C', root, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
  if (r.status !== 0) return realpathSync(root);
  return path.dirname(realpathSync(r.stdout.trim()));
}
// → { goc, trongKho, cfg } ; goc tuyệt đối.
function giaiGoc(root, cfg) {
  if (cfg.kho && cfg.kho.duong) return { goc: path.resolve(gocCheckoutChinh(root), cfg.kho.duong), trongKho: false, cfg };
  return { goc: path.resolve(root, cfg.noi), trongKho: true, cfg };
}
const dongKhongDoc = cfg => `không đọc được ở đây: ${cfg.kho.ten} — ` +
  (cfg.kho.remote ? `git clone ${cfg.kho.remote} ` : 'khai kho.remote để có lệnh clone; đường cần có: ');

module.exports = { KHOA, docTriThuc, khoiTriThuc, gocCheckoutChinh, giaiGoc, dongKhongDoc };
