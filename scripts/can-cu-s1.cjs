#!/usr/bin/env node
'use strict';
// can-cu-s1.cjs — bộ xếp lớp căn cứ cho dòng sổ bước thiết kế (hồ sơ buoc-len-thiet-ke-khong-hoi, ADR 0022).
// Mỗi dòng `stage: "S1"` của decisions.jsonl ra đúng một lớp: da-quyet · cau-hoi · do · doi-truoc · bi-thay.
// Kiểm VẬT (nguồn, con trỏ, khó-đảo) — không đọc nghĩa câu; nghĩa do phản biện context sạch soi (S1#7).
// Ba người dùng: thẻ Cổng Phạm vi (gate-card.js) · lệnh đếm của đường đo (--dem) · bộ kiểm (can-cu-s1.ca.mjs).
// Khuôn bên viết: khối marker DEC-CAN-CU-SLOT + DEC-LAT-GATE1 trong SKILL feature-loop, mục «Sổ quyết định».
//
// Dùng:
//   node scripts/can-cu-s1.cjs --root <kho> --slug <hồ sơ> [--base <ref>] [--json]   (thoát 1 khi có dòng đỏ)
//   node scripts/can-cu-s1.cjs --root <kho> --dem [--json]                            (đường đo: lật ở Cổng Phạm vi)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const NGUON = ['muc-tieu', 'mot-loi', 'chi-nguoi'];
const LY_DO = {
  'nguon-la': 'nguồn căn cứ lạ',
  'kho-dao': 'khó-đảo luôn là câu hỏi cho người',
  'thieu-con-tro': 'thiếu con trỏ căn cứ (tệp + câu trích)',
  'tep-vang': 'tệp căn cứ không có',
  'trich-ngan': 'câu trích quá ngắn để làm căn cứ',
  'trich-vang': 'câu trích không có trong tệp căn cứ',
  'tu-bien-minh': 'căn cứ trỏ vào vật của chính vòng',
  'o-chua-ky': 'căn cứ là ô cơ hội chưa ký',
  'sinh-trong-vong': 'câu trích không có ở gốc nhánh — căn cứ sinh trong vòng',
  'thieu-loi-chet': 'một lối ra nhưng không nói lối khác chết vì sao',
  'thieu-khuyen': 'câu chỉ-người-biết thiếu khuyến nghị hoặc lối khác',
  'tri-thuc-sai': 'con trỏ tri thức sai khuôn <kho>:<trang>#<băm>',
  'tri-thuc-lech': 'trang tri thức không khớp băm đã trỏ (đã đổi hoặc không còn)',
  'tri-thuc-khong-khai': 'căn cứ trỏ tri thức mà kho chưa khai tri_thuc',
  'tri-thuc-kem-trich': 'căn cứ trỏ kho tri thức riêng không được chở câu trích hay tệp',
  'tri-thuc-vang': 'không nạp được bộ đọc tri thức (scripts/tri-thuc-tra.cjs)',
};
// Căn cứ trỏ trang tri thức (hồ sơ thiet-ke-nap-tri-thuc): khoá `tri_thuc` thay cặp tep + trich. Vắng mô-đun → dòng mang
// khoá ĐỎ tri-thuc-vang (đóng an toàn), mọi dòng khác xếp như cũ.
let TTT = null; try { TTT = require('./tri-thuc-tra.cjs'); } catch (_) { TTT = null; }
// Luật sản phẩm của kho (bat-bien-san-pham): ba luật đỏ của pham_luat. Vắng mô-đun (bản sao đứng một mình) →
// dòng mang pham_luat ĐỎ luat-vang (đóng an toàn), mọi dòng khác xếp như cũ.
let luatSP = null; try { luatSP = require('./luat-san-pham.cjs'); Object.assign(LY_DO, luatSP.LY_DO_LUAT); } catch (_) { LY_DO['luat-vang'] = 'mã luật không có trong tệp luật sản phẩm'; }
const GHI_CHU = { 'chua-kiem-goc': 'chưa kiểm câu trích có từ trước vòng' };
// Chữ cờ trên thẻ Cổng Phạm vi — một nguồn cho thẻ và bộ kiểm.
const CO = {
  doiTruoc: n => `${n} dòng sổ đời trước ở bước thiết kế chưa ghi nguồn căn cứ — thẻ đọc chúng như cũ.`,
  chuaKiemGoc: 'Có lựa chọn máy đã quyết theo căn cứ nhưng thẻ chưa nhận gốc nhánh — chưa kiểm câu trích có từ trước vòng; dựng lại thẻ với --glossary-base <gốc nhánh>.',
  gocLoi: b => `Không đọc được gốc nhánh «${b}» — chưa kiểm câu trích có từ trước vòng.`,
  dong: (key, td) => `Sổ bước thiết kế — ${key}: ${td}`,
};
const TRICH_MIN = 20;
const gom = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const chuoi = v => (typeof v === 'string' ? v.trim() : '');

function docSo(text) {
  const entries = []; let broken = 0;
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e && typeof e === 'object' && !Array.isArray(e)) entries.push(e); else broken++;
    } catch (_) { broken++; }
  }
  return { entries, broken };
}
function frontmatter(t) {
  const m = String(t || '').match(/^---\r?\n([\s\S]*?)\r?\n---/); const o = {};
  if (m) for (const l of m[1].split('\n')) { const mm = l.match(/^(\w+)\s*:\s*(.*)$/); if (mm) o[mm[1]] = mm[2].replace(/\s+#.*$/, '').trim(); }
  return o;
}
// Đường dẫn tương đối gốc kho; tuyệt đối hoặc thoát gốc → null.
function chuanTep(tep) {
  const t = chuoi(tep).replace(/\\/g, '/');
  if (!t || path.posix.isAbsolute(t)) return null;
  const n = path.posix.normalize(t);
  return n === '..' || n.startsWith('../') ? null : n;
}
const docDia = root => rel => { try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch (_) { return null; } };
function taoNguCanh(ctx) {
  const root = ctx.root || '.'; const slug = ctx.slug; const hoSo = `_acceptance/${slug}/`;
  const doc = ctx.docTep || docDia(root);
  const designDoc = chuanTep(frontmatter(doc(`${hoSo}contract.md`)).design_doc || '');
  const oFm = frontmatter(doc(`${hoSo}opportunity.md`));
  let goc = 'chua-kiem';
  if (ctx.base) goc = spawnSync('git', ['-C', root, 'rev-parse', '--verify', '--quiet', `${ctx.base}^{commit}`]).status === 0 ? 'da-kiem' : 'loi';
  return { root, slug, hoSo, doc, designDoc, oDaKy: !!(chuoi(oFm.decision) && chuoi(oFm.decided_by)), base: ctx.base || null, goc, memo: new Map() };
}
function tepOGoc(nc, rel) {
  if (!nc.memo.has(rel)) {
    const r = spawnSync('git', ['-C', nc.root, 'show', `${nc.base}:${rel}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    nc.memo.set(rel, r.status === 0 ? r.stdout : null);
  }
  return nc.memo.get(rel);
}
// Vật của chính vòng = mọi tệp của hồ sơ trừ ô cơ hội, design doc của hợp đồng, spec/plan mang tên hồ sơ.
function laVatCuaVong(nc, rel) {
  if (rel.startsWith(nc.hoSo)) return rel !== `${nc.hoSo}opportunity.md`;
  if (nc.designDoc && rel === nc.designDoc) return true;
  return /^docs\/superpowers\/(specs|plans)\//.test(rel) && path.posix.basename(rel).includes(nc.slug);
}
const ra = (lop, ma, them) => Object.assign({ lop }, ma ? { ma, thong_diep: LY_DO[ma] } : {}, them || {});

function phanLoaiDong(e, nc) {
  if (!e || e.stage !== 'S1') return null;
  const c = e.can_cu;
  if (c === undefined) return ra('doi-truoc');
  if (!c || typeof c !== 'object' || Array.isArray(c) || !NGUON.includes(c.nguon)) return ra('do', 'nguon-la');
  const pl = luatSP ? luatSP.xetPhamLuat(c, () => nc.luatSP || (nc.luatSP = luatSP.docTepLuat(nc.root))) : (typeof c.pham_luat === 'string' ? { lop: 'do', ma: 'luat-vang' } : null);
  if (pl) return ra(pl.lop, pl.ma, pl.them);
  if (c.nguon === 'chi-nguoi') return chuoi(c.khuyen) && chuoi(c.loi_khac) ? ra('cau-hoi') : ra('do', 'thieu-khuyen');
  if (c.kho_dao === true) return ra('do', 'kho-dao');
  if (c.nguon === 'mot-loi') return chuoi(c.loi_chet) ? ra('da-quyet') : ra('do', 'thieu-loi-chet');
  if (c.tri_thuc !== undefined) {
    const x = TTT ? TTT.xetCanCu(c, { root: nc.root, base: nc.goc === 'da-kiem' ? nc.base : null }) : { lop: 'do', ma: 'tri-thuc-vang' };
    return ra(x.lop, x.ma, x.ghi_chu ? { ghi_chu: x.ghi_chu } : undefined);
  }
  const trich = gom(c.trich);
  if (!chuoi(c.tep) || !trich) return ra('do', 'thieu-con-tro');
  const rel = chuanTep(c.tep);
  if (rel === null) return ra('do', 'tep-vang');
  if (laVatCuaVong(nc, rel)) return ra('do', 'tu-bien-minh');
  const noiDung = nc.doc(rel);
  if (noiDung === null) return ra('do', 'tep-vang');
  if (trich.length < TRICH_MIN) return ra('do', 'trich-ngan');
  if (!gom(noiDung).includes(trich)) return ra('do', 'trich-vang');
  const laO = rel === `${nc.hoSo}opportunity.md`;
  if (laO && !nc.oDaKy) return ra('do', 'o-chua-ky');
  if (nc.goc === 'da-kiem' && !laO) {
    const cu = tepOGoc(nc, rel);
    if (cu === null || !gom(cu).includes(trich)) return ra('do', 'sinh-trong-vong');
  }
  return nc.goc === 'da-kiem' ? ra('da-quyet') : ra('da-quyet', null, { ghi_chu: GHI_CHU['chua-kiem-goc'] });
}
// ctx = { root, slug, base?, docTep?(rel) → string|null }. Dòng MANG can_cu bị một dòng SAU nó thay (supersedes)
// ra bi-thay; dòng đời trước giữ doi-truoc dù bị thay — thẻ của hồ sơ cũ in nó như trước vòng này.
function phanLoaiSo(entries, ctx) {
  const nc = taoNguCanh(ctx); const viTri = new Map();
  entries.forEach((e, i) => { if (e && typeof e.id === 'string' && !viTri.has(e.id)) viTri.set(e.id, i); });
  const biThay = new Set();
  entries.forEach((e, j) => { if (e && typeof e.supersedes === 'string' && viTri.has(e.supersedes) && viTri.get(e.supersedes) < j) biThay.add(e.supersedes); });
  const out = { cau_hoi: [], da_quyet: [], do: [], doi_truoc: 0, bi_thay: 0, goc: nc.goc, dong: [] };
  entries.forEach((e, i) => {
    const r = phanLoaiDong(e, nc); if (!r) return;
    const id = typeof e.id === 'string' ? e.id : `dong-${i + 1}`;
    const d = Object.assign({ id, i, e, lop_goc: r.lop }, r, { lop: biThay.has(id) && r.lop !== 'doi-truoc' ? 'bi-thay' : r.lop });
    out.dong.push(d);
    if (d.lop === 'bi-thay') out.bi_thay++;
    else if (d.lop === 'doi-truoc') out.doi_truoc++;
    else if (d.lop === 'cau-hoi') out.cau_hoi.push(d);
    else if (d.lop === 'da-quyet') out.da_quyet.push(d);
    else out.do.push(d);
  });
  out.cau_hoi.forEach((d, k) => { d.nhan = `Hỏi-${k + 1}`; });
  return out;
}
// Đường đo tầng tri thức (hồ sơ vong-don-le-tra-tri-thuc): căn cứ máy đã quyết trỏ trang tri thức hay sổ của hồ sơ KHÁC.
const RE_SO_TEP = /^_acceptance\/([^/]+)\/decisions\.jsonl$/;
const troTriThuc = (c, slug) => !!c && (c.tri_thuc !== undefined || (m => !!m && m[1] !== slug)(chuoi(c.tep).match(RE_SO_TEP)));
const tinhTriThuc = (d, slug) => d.lop === 'da-quyet' && troTriThuc(d.e.can_cu, slug);
const CHU_DO_TRI_THUC = (k, n) => `đường đo tri thức: ${k}/${n} hồ sơ có dòng tra có căn cứ trỏ trang hay sổ trước`;
// Đường đo: mỗi hồ sơ có sổ — số theo lớp, và số dòng `stage: gate1` lật một dòng S1 (theo lớp gốc của dòng bị lật).
// Kho khai tri_thuc → mỗi hàng thêm dong_tra, can_cu_tri_thuc; kho không khai → hàng như trước từng byte.
function dem(root) {
  const khai = !!(TTT && TTT.docCfg(root));
  let ds = [];
  try { ds = fs.readdirSync(path.join(root, '_acceptance')).filter(n => !n.startsWith('.')).sort(); } catch (_) { return []; }
  const doc = docDia(root); const rows = [];
  for (const slug of ds) {
    const t = doc(`_acceptance/${slug}/decisions.jsonl`); if (t === null) continue;
    const { entries } = docSo(t);
    const kq = phanLoaiSo(entries, { root, slug });
    const lopGoc = new Map(kq.dong.map(x => [x.id, x.lop_goc]));
    let latMay = 0, latHoi = 0;
    for (const e of entries) {
      if (!e || e.stage !== 'gate1' || typeof e.supersedes !== 'string') continue;
      const l = lopGoc.get(e.supersedes);
      if (l === 'da-quyet') latMay++; else if (l === 'cau-hoi') latHoi++;
    }
    rows.push({ slug, cau_hoi: kq.cau_hoi.length, da_quyet: kq.da_quyet.length, do: kq.do.length, doi_truoc: kq.doi_truoc, bi_thay: kq.bi_thay, lat_may_quyet: latMay, lat_cau_hoi: latHoi,
      ...(khai ? { dong_tra: !!TTT.dongTra(entries), can_cu_tri_thuc: kq.dong.filter(d => tinhTriThuc(d, slug)).length } : {}) });
  }
  return rows;
}

if (require.main === module) {
  const a = process.argv.slice(2); const opt = n => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; };
  const root = opt('--root') || '.'; const json = a.includes('--json');
  if (a.includes('--dem')) {
    const rows = dem(root);
    if (json) process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    else {
      for (const r of rows) process.stdout.write(`${r.slug} · câu hỏi ${r.cau_hoi} · máy đã quyết ${r.da_quyet} · đỏ ${r.do} · đời trước ${r.doi_truoc} · bị thay ${r.bi_thay} · máy quyết bị lật ${r.lat_may_quyet} · câu hỏi chọn khác ${r.lat_cau_hoi}${'dong_tra' in r ? ` · dòng tra ${r.dong_tra ? 'có' : 'không'} · căn cứ trỏ trang hay sổ trước ${r.can_cu_tri_thuc}` : ''}\n`);
      if (TTT && TTT.docCfg(root)) { const co = rows.filter(r => r.dong_tra); process.stdout.write(CHU_DO_TRI_THUC(co.filter(r => r.can_cu_tri_thuc > 0).length, co.length) + '\n'); }
    }
    process.exit(0);
  }
  const slug = opt('--slug');
  if (!slug || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug)) { process.stderr.write('can-cu-s1: cần --slug <tên hồ sơ> hoặc --dem\n'); process.exit(2); }
  const t = docDia(root)(`_acceptance/${slug}/decisions.jsonl`);
  if (t === null) { process.stderr.write(`can-cu-s1: hồ sơ «${slug}» không có decisions.jsonl\n`); process.exit(2); }
  const kq = phanLoaiSo(docSo(t).entries, { root, slug, base: opt('--base') });
  const tom = { cau_hoi: kq.cau_hoi.length, da_quyet: kq.da_quyet.length, do: kq.do.length, doi_truoc: kq.doi_truoc, bi_thay: kq.bi_thay, goc: kq.goc };
  if (json) process.stdout.write(JSON.stringify(Object.assign({}, tom, { dong: kq.dong.map(({ e, ...r }) => r) }), null, 2) + '\n');
  else {
    process.stdout.write(`${slug} · câu hỏi ${tom.cau_hoi} · máy đã quyết ${tom.da_quyet} · đỏ ${tom.do} · đời trước ${tom.doi_truoc} · bị thay ${tom.bi_thay} · gốc ${tom.goc}\n`);
    for (const d of kq.do) process.stdout.write(`  đỏ ${d.id}: ${d.thong_diep}\n`);
  }
  process.exit(kq.do.length ? 1 : 0);
}
module.exports = { NGUON, LY_DO, GHI_CHU, CO, TRICH_MIN, docSo, phanLoaiDong, phanLoaiSo, dem, chuanTep, troTriThuc, CHU_DO_TRI_THUC };
