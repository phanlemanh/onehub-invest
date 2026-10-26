#!/usr/bin/env node
// tri-thuc.mjs — lint và đường trỏ của kho tri thức (tầng tri thức theo LLM Wiki). Hồ sơ kho-tri-thuc-va-lint (TT1),
// thiết kế docs/superpowers/specs/2026-10-24-kho-tri-thuc-va-lint-design.md. CHỈ ĐỌC: không ghi tệp nào.
//
// Khuôn một nguồn: skills/acceptance/references/tri-thuc-template.md (khối TRI-THUC-TRANG, -LOAI, -RAW-DONG, -CON-TRO)
// rút LÚC CHẠY, suy từ vị trí script. Bản phạm vi đọc bằng docPhamVi của scripts/cat-luot.mjs — không bộ đọc thứ hai.
//
//   node scripts/tri-thuc.mjs --root . --kiem [--pham-vi <tệp>]   0 xanh · 1 đỏ · 2 không chạy được · 3 không đọc được ở đây
//   node scripts/tri-thuc.mjs --root . --con-tro '<ref>'          0 khớp · 1 lệch/không có · 2 sai · 3 không đọc được ở đây
//
// Hồ sơ o-mo-viec-mang-nguon (TT3) thêm hai hàm cho bên gọi khác: `chonTrang` (dòng «Nguồn:» của ô mở từ hàng) và
// `kiemNguonPhamVi` (răng phủ đòi nguồn của bản phạm vi là trang tri thức có đường trỏ băm).
import { readFileSync, readdirSync, existsSync, statSync, realpathSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { docTriThuc } = require(path.join(__dirname, 'tri-thuc-khoa.cjs'));
export const TEP_KHUON = path.join(__dirname, '..', 'skills', 'acceptance', 'references', 'tri-thuc-template.md');
export const CO = {
  THIEU_NGUON: 'trang-thieu-nguon', NGUON_KHONG_CO: 'nguon-khong-co', RAW_SUA: 'raw-bi-sua',
  MA_KHONG_TRANG: 'ma-khong-co-trang', KHO_CHUA_DAY: 'kho-rieng-chua-day', RAW_CONG_KHAI: 'raw-trong-kho-cong-khai',
};

export const khoi = (txt, ten) => {
  const m = String(txt).match(new RegExp(`<!-- <<<${ten} -->\\n\`\`\`\\n([\\s\\S]*?)\\n\`\`\`\\n<!-- ${ten}>>> -->`));
  if (!m) throw new Error(`khuôn tri thức thiếu khối ${ten}`);
  return m[1];
};
export function napKhuon(tep = TEP_KHUON) {
  const t = readFileSync(tep, 'utf8');
  const trang = khoi(t, 'TRI-THUC-TRANG');
  const khoa = [...trang.matchAll(/^([A-Za-z_]+):/gm)].map(m => m[1]);
  const [kLoai, kMa, kNguon, kCapNhat] = khoa;
  return {
    khoa: { loai: kLoai, ma: kMa, nguon: kNguon, capNhat: kCapNhat },
    loai: khoi(t, 'TRI-THUC-LOAI').trim().split(/\s+/),
    rawDong: new RegExp(khoi(t, 'TRI-THUC-RAW-DONG').trim()),
    conTro: new RegExp(khoi(t, 'TRI-THUC-CON-TRO').trim()),
  };
}

const git = (cwd, a) => spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8' });
export function bamTep(p) { return execFileSync('git', ['hash-object', '--', p], { encoding: 'utf8' }).trim(); }

export function docCauHinh(root) {
  const p = path.join(root, '_acceptance', 'config.yaml');
  return docTriThuc(existsSync(p) ? readFileSync(p, 'utf8') : '');
}
// Luật giải đường kho riêng theo checkout chính sống ở tri-thuc-khoa.cjs (hồ sơ thiet-ke-nap-tri-thuc): thẻ và bộ xếp căn
// cứ là CJS, không nạp được tệp này (await cấp cao) — một bản luật cho cả hai phía.
export const { gocCheckoutChinh, giaiGoc, dongKhongDoc } = require(path.join(__dirname, 'tri-thuc-khoa.cjs'));

function moiTep(thuMuc) {
  const ra = [];
  const di = d => { for (const e of readdirSync(d, { withFileTypes: true })) { if (e.name === '.git') continue; const p = path.join(d, e.name); if (e.isDirectory()) di(p); else ra.push(p); } };
  if (existsSync(thuMuc)) di(thuMuc);
  return ra.sort();
}
export function docFrontmatter(txt) {
  const dong = String(txt).replace(/\r\n?/g, '\n').split('\n');
  if (dong[0] !== '---') return null;
  const het = dong.indexOf('---', 1);
  if (het < 0) return null;
  const o = {};
  for (const l of dong.slice(1, het)) { const m = l.match(/^([A-Za-z_]+):\s*(.*)$/); if (m) o[m[1]] = m[2].trim(); }
  return o;
}
export const danhSach = v => { const t = String(v ?? '').trim(); if (!t.startsWith('[') || !t.endsWith(']')) return null; return t.slice(1, -1).split(',').map(x => x.trim()).filter(Boolean); };

export async function kiem({ root, phamVi = null, khuon = napKhuon() }) {
  const cfg = docCauHinh(root);
  if (!cfg) return { thoat: 2, loiChay: ['kho chưa khai tri_thuc trong _acceptance/config.yaml'] };
  if (cfg.loi.length) return { thoat: 2, loiChay: cfg.loi, canhBao: cfg.canhBao };
  const { goc, trongKho } = giaiGoc(root, cfg);
  if (!trongKho && !existsSync(goc)) return { thoat: 3, ra: [dongKhongDoc(cfg) + goc], canhBao: cfg.canhBao };
  const loi = []; const dat = (co, tep, cau) => loi.push(`lỗi: [${co}] ${tep}: ${cau}`);
  const rel = p => path.relative(goc, p).split(path.sep).join('/');
  const K = khuon.khoa;
  // Trang wiki.
  const trang = moiTep(path.join(goc, 'wiki')).filter(p => p.endsWith('.md'));
  const maCo = new Set();
  for (const p of trang) {
    const fm = docFrontmatter(readFileSync(p, 'utf8'));
    if (!fm) { dat(CO.THIEU_NGUON, rel(p), 'frontmatter sai khuôn (thiếu dòng --- mở hay đóng)'); continue; }
    for (const m of danhSach(fm[K.ma]) || []) maCo.add(m);
    const ng = danhSach(fm[K.nguon]);
    if (!(K.nguon in fm)) { dat(CO.THIEU_NGUON, rel(p), `thiếu khoá ${K.nguon}`); continue; }
    if (!ng || !ng.length) { dat(CO.THIEU_NGUON, rel(p), `${K.nguon} rỗng`); continue; }
    for (const n of ng) if (!existsSync(path.join(goc, n))) dat(CO.NGUON_KHONG_CO, rel(p), `trỏ ${n} — không có dưới gốc tri thức`);
  }
  // Raw: mỗi thư mục raw/<x>/ một nguon.md liệt mọi tệp kèm băm.
  const rawGoc = path.join(goc, 'raw');
  const thuMucRaw = existsSync(rawGoc) ? readdirSync(rawGoc, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => path.join(rawGoc, e.name)).sort() : [];
  for (const d of thuMucRaw) {
    const tepRaw = moiTep(d).filter(p => path.basename(p) !== 'nguon.md' || path.dirname(p) !== d);
    if (cfg.congKhai && trongKho && tepRaw.length) dat(CO.RAW_CONG_KHAI, rel(d), 'kho công khai không giữ tài liệu thô — chuyển sang kho riêng (khai tri_thuc.kho)');
    const pN = path.join(d, 'nguon.md');
    if (!existsSync(pN)) { dat(CO.RAW_SUA, rel(d), 'thiếu nguon.md'); continue; }
    const khai = new Map();
    for (const l of readFileSync(pN, 'utf8').split('\n')) { const m = l.match(khuon.rawDong); if (m) khai.set(m[1], m[2]); }
    for (const p of tepRaw) {
      const r = path.relative(d, p).split(path.sep).join('/');
      if (!khai.has(r)) { dat(CO.RAW_SUA, rel(p), 'tệp không có dòng trong nguon.md'); continue; }
      if (bamTep(p) !== khai.get(r)) dat(CO.RAW_SUA, rel(p), 'băm khác dòng trong nguon.md');
    }
    for (const r of khai.keys()) if (!existsSync(path.join(d, r))) dat(CO.RAW_SUA, `${rel(d)}/${r}`, 'nguon.md liệt tệp không có');
  }
  // Mã của bản phạm vi phải có trang mang mã.
  const { docPhamVi } = await import(new URL('./cat-luot.mjs', import.meta.url).href);
  const cacPv = [];
  if (phamVi) cacPv.push(phamVi);
  else {
    const r = git(root, ['ls-files', '-z', '--', '*.md']);
    if (r.status === 0) for (const t of r.stdout.split('\0').filter(Boolean)) cacPv.push(t);
  }
  for (const t of cacPv) {
    const p = path.resolve(root, t); if (!existsSync(p)) { if (phamVi) return { thoat: 2, loiChay: [`không có bản phạm vi: ${t}`] }; continue; }
    const pv = docPhamVi(readFileSync(p, 'utf8'));
    if (!pv.dot || !pv.ma.length) { if (phamVi) return { thoat: 2, loiChay: [`không đọc ra dot hay mã nào: ${t}`] }; continue; }
    if (!phamVi && !existsSync(path.join(goc, 'wiki', 'dot', `${pv.dot}.md`))) continue;
    for (const { ma } of pv.ma) if (!maCo.has(ma)) dat(CO.MA_KHONG_TRANG, t, `mã ${ma} của đợt ${pv.dot} không nằm trong ${K.ma} của trang nào`);
  }
  // Kho riêng: commit chưa có ở remote.
  if (!trongKho) {
    const u = git(goc, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    if (u.status !== 0) dat(CO.KHO_CHUA_DAY, cfg.kho.ten, 'nhánh của kho riêng không theo dõi remote');
    else { const l = git(goc, ['log', '--oneline', '@{u}..HEAD']); if (l.stdout.trim()) dat(CO.KHO_CHUA_DAY, cfg.kho.ten, `${l.stdout.trim().split('\n').length} commit chưa đẩy lên ${u.stdout.trim()}`); }
  }
  const ra = [...loi, `tri thức: ${trang.length} trang, ${thuMucRaw.length} raw, ${loi.length} lỗi`];
  return { thoat: loi.length ? 1 : 0, ra, canhBao: cfg.canhBao };
}

export function conTro({ root, ref, khuon = napKhuon() }) {
  const cfg = docCauHinh(root);
  if (!cfg) return { thoat: 2, loiChay: ['kho chưa khai tri_thuc trong _acceptance/config.yaml'] };
  if (cfg.loi.length) return { thoat: 2, loiChay: cfg.loi };
  const m = String(ref).match(khuon.conTro);
  if (!m) return { thoat: 2, loiChay: [`đường trỏ sai khuôn: ${ref}`] };
  const [, tenKho, duong, bam] = m;
  if (tenKho && (!cfg.kho || cfg.kho.ten !== tenKho)) return { thoat: 1, ra: [`kho không khai: ${tenKho}`] };
  const { goc, trongKho } = giaiGoc(root, cfg);
  if (!trongKho && !existsSync(goc)) return { thoat: 3, ra: [dongKhongDoc(cfg) + goc] };
  const p = path.join(goc, duong);
  if (!existsSync(p) || !statSync(p).isFile()) return { thoat: 1, ra: [`không có tệp: ${duong}`] };
  if (bamTep(p) !== bam) return { thoat: 1, ra: [`băm lệch: ${duong}`] };
  return { thoat: 0, ra: [p] };
}

// ── Chọn trang cho một hàng (hồ sơ o-mo-viec-mang-nguon, TT3 — C1) ─────────────────────────────────────────────────────
// Trang nền (`loai: nen`) theo đường · trang đợt `wiki/dot/<dot>.md` (cùng luật nối đợt của ma-khong-co-trang) · trang có
// `ma` giao `phu` của hàng, trừ nền và đợt, theo đường. Mỗi trang thành một đường trỏ băm theo khuôn TRI-THUC-CON-TRO.
// → null (kho không khai) | { loiKhai } | { khongDoc } | { conTro, thieu }
export function chonTrang({ root, dot, phu = [], cfg = docCauHinh(root), khuon = napKhuon() }) {
  if (!cfg) return null;
  if (cfg.loi.length) return { loiKhai: cfg.loi };
  const { goc, trongKho } = giaiGoc(root, cfg);
  if (!trongKho && !existsSync(goc)) return { khongDoc: dongKhongDoc(cfg) + goc };
  const K = khuon.khoa;
  const tro = p => `${trongKho ? '' : `${cfg.kho.ten}:`}${path.relative(goc, p).split(path.sep).join('/')}#${bamTep(p)}`;
  const tepDot = path.join(goc, 'wiki', 'dot', `${dot}.md`);
  const nen = []; const theoMa = []; const coMa = new Set();
  for (const p of moiTep(path.join(goc, 'wiki')).filter(x => x.endsWith('.md') && x !== tepDot)) {
    const fm = docFrontmatter(readFileSync(p, 'utf8'));
    if (!fm) continue;
    if (fm[K.loai] === 'nen') { nen.push(p); continue; }
    const ma = (danhSach(fm[K.ma]) || []).filter(m => phu.includes(m));
    if (ma.length) { theoMa.push(p); for (const m of ma) coMa.add(m); }
  }
  const coDot = existsSync(tepDot);
  const thieu = [...(nen.length ? [] : ['trang nền']), ...(coDot ? [] : [`trang đợt ${dot}`]), ...phu.filter(m => !coMa.has(m)).map(m => `mã ${m}`)];
  return { conTro: [...nen, ...(coDot ? [tepDot] : []), ...theoMa].map(tro), thieu };
}

// ── Nguồn của bản phạm vi (hồ sơ o-mo-viec-mang-nguon, TT3 — D1) ──────────────────────────────────────────────────────
// Khoá `nguon` tách theo dấu phẩy; mỗi mục phải là đường trỏ băm tới trang dưới wiki/, khớp băm, đã vào git của kho chứa
// nó. Vế hình dạng không cần kho nên đỏ trên mọi máy; kho riêng không có ở máy → vế băm và git thành cảnh báo.
// → null (kho không khai) | { loi, canhBao }
export function kiemNguonPhamVi({ root, nguon, khuon = napKhuon() }) {
  const cfg = docCauHinh(root);
  if (!cfg) return null;
  const loi = []; const canhBao = [];
  if (cfg.loi.length) return { loi: [`khối tri_thuc lỗi: ${cfg.loi.join('; ')}`], canhBao };
  const muc = String(nguon ?? '').split(',').map(x => x.trim()).filter(Boolean);
  if (!muc.length) return { loi: ['bản phạm vi thiếu nguon — kho đã khai tri_thuc: ghi đường trỏ băm tới trang tri thức [nguon-khong-phai-trang]'], canhBao };
  const { goc } = giaiGoc(root, cfg);
  for (const x of muc) {
    const m = x.match(khuon.conTro);
    if (!m) { loi.push(`nguồn «${x}» không phải đường trỏ băm tới trang tri thức [nguon-khong-phai-trang]`); continue; }
    if (!path.posix.normalize(m[2]).startsWith('wiki/')) { loi.push(`nguồn «${x}»: không phải trang wiki — phải nằm dưới wiki/ [nguon-khong-phai-trang]`); continue; }
    const r = conTro({ root, ref: x, khuon });
    if (r.thoat === 3) { canhBao.push(`nguồn «${x}»: ${r.ra[0]}`); continue; }
    if (r.thoat !== 0) { loi.push(`nguồn «${x}»: ${[...(r.ra || []), ...(r.loiChay || [])][0]} [nguon-lech]`); continue; }
    if (git(goc, ['ls-files', '--error-unmatch', '--', m[2]]).status !== 0) loi.push(`nguồn «${x}»: tệp chưa vào git của kho tri thức [nguon-chua-vao-kho]`);
  }
  return { loi, canhBao };
}

// Tra theo câu mô tả (hồ sơ vong-don-le-tra-tri-thuc, TT5): mọi trang nền + trang khớp chữ ở tiêu đề, giá trị frontmatter,
// tiêu đề mục; có `slug` thì cộng đường trỏ dòng «Nguồn:» của ô và loại sổ của chính hồ sơ; cộng dòng sổ hồ sơ trước khớp.
// → { thoat, loiChay? } | { thoat: 0, tra, trang: [{tro, tieu_de, diem|null}], so, hong, khongDoc, dongTra }
export function traMoTa({ root, cau, slug = null, khuon = napKhuon() }) {
  const TTT = require(path.join(__dirname, 'tri-thuc-tra.cjs'));
  const cfg = docCauHinh(root);
  if (!cfg) return { thoat: 2, loiChay: ['kho chưa khai tri_thuc trong _acceptance/config.yaml'] };
  if (cfg.loi.length) return { thoat: 2, loiChay: cfg.loi };
  if (!String(cau ?? '').trim()) return { thoat: 2, loiChay: ['câu tra rỗng — đưa câu mô tả qua stdin'] };
  const { so, hong } = TTT.traSo({ root, cau, slug });
  const { goc, trongKho } = giaiGoc(root, cfg);
  const khongDoc = !trongKho && !existsSync(goc) ? dongKhongDoc(cfg) + goc : null;
  const trang = [];
  if (!khongDoc) {
    const tn = TTT.thuatNgu(cau); const K = khuon.khoa;
    const tro = p => `${trongKho ? '' : `${cfg.kho.ten}:`}${path.relative(goc, p).split(path.sep).join('/')}#${bamTep(p)}`;
    const khoaTro = r => { const m = String(r).match(khuon.conTro); return m ? `${m[1] ? `${m[1]}:` : ''}${m[2]}` : null; };
    const theoKhoa = new Map(); const nen = []; const khop = [];
    for (const p of moiTep(path.join(goc, 'wiki')).filter(x => x.endsWith('.md'))) {
      const txt = readFileSync(p, 'utf8'); const fm = docFrontmatter(txt);
      if (!fm) continue;
      const than = txt.replace(/\r\n?/g, '\n').split('\n');
      const tieuDe = (than.find(l => /^# /.test(l)) || '').replace(/^# /, '').trim();
      const muc = than.filter(l => /^#{2,3} /.test(l)).map(l => l.replace(/^#+ /, ''));
      const r = tro(p); const o = { tro: r, tieu_de: tieuDe || path.basename(p, '.md') };
      theoKhoa.set(khoaTro(r), r);
      if (fm[K.loai] === 'nen') { nen.push({ ...o, diem: null }); continue; }
      const d = TTT.diem(tn, tieuDe, Object.values(fm), muc);
      if (d >= TTT.TRA.diemToiThieu) khop.push({ ...o, diem: d });
    }
    khop.sort((a, b) => b.diem - a.diem || a.tro.localeCompare(b.tro));
    const daCo = new Set();
    const them = o => { const k = khoaTro(o.tro); if (daCo.has(k)) return; daCo.add(k); trang.push(o); };
    if (slug) {
      const { napKhuonNguon, docDongNguon } = require(path.join(__dirname, 'tri-thuc-nguon.cjs'));
      const p = path.join(root, '_acceptance', slug, 'opportunity.md');
      const o = docDongNguon(existsSync(p) ? readFileSync(p, 'utf8') : '', napKhuonNguon());
      for (const r of o.conTro) them({ tro: theoKhoa.get(khoaTro(r)) || r, tieu_de: '(dòng «Nguồn:» của ô)', diem: null });
    }
    for (const o of nen) them(o);
    for (const o of khop.slice(0, TTT.TRA.trangToiDa)) them(o);
  }
  const dongTra = { tra: String(cau), trang: trang.map(t => t.tro), so: so.map(s => s.tro), ...(khongDoc ? { khong_doc: khongDoc } : {}) };
  return { thoat: 0, tra: String(cau), trang, so, hong, khongDoc, dongTra };
}
function inTra(kq) {
  const TTT = require(path.join(__dirname, 'tri-thuc-tra.cjs'));
  const ra = [`trang (${kq.trang.length}):`];
  if (kq.khongDoc) ra.push(`  ${kq.khongDoc}`);
  else if (!kq.trang.length) ra.push(`  ${TTT.CO.khongLienQuan}`);
  for (const t of kq.trang) ra.push(`- ${t.tro} — ${t.tieu_de}${t.diem == null ? '' : ` (điểm ${t.diem})`}`);
  ra.push(`sổ hồ sơ trước (${kq.so.length}):`);
  for (const s of kq.so) ra.push(`- ${s.tro} [${s.stage || '-'}${s.nguoi ? ', lời người' : ''}] ${s.decision}${s.can_cu ? `\n  can_cu: ${JSON.stringify(s.can_cu)}` : ''}`);
  ra.push(`tri_thuc_tra: ${JSON.stringify(kq.dongTra)}`);
  return ra;
}

const isMain = (() => { try { return realpathSync(process.argv[1]) === realpathSync(__filename); } catch { return false; } })();
if (isMain) {
  const a = process.argv.slice(2);
  const lay = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const root = path.resolve(lay('--root') || '.');
  let kq;
  try {
    if (a.includes('--kiem')) kq = await kiem({ root, phamVi: lay('--pham-vi') });
    else if (a.includes('--con-tro')) kq = conTro({ root, ref: lay('--con-tro') });
    else if (a.includes('--tra')) {
      let cau = ''; try { cau = readFileSync(0, 'utf8'); } catch { cau = ''; }
      kq = traMoTa({ root, cau: cau.replace(/\n$/, ''), slug: lay('--slug') });
      if (kq.thoat === 0) {
        if (kq.hong) process.stderr.write(`tri-thuc: cảnh báo: bỏ ${kq.hong} dòng sổ hỏng (không đọc được JSON) khi tra sổ hồ sơ trước\n`);
        kq.ra = a.includes('--json') ? [JSON.stringify({ tra: kq.tra, trang: kq.trang, so: kq.so, khong_doc: kq.khongDoc, tri_thuc_tra: kq.dongTra }, null, 2)] : inTra(kq);
      }
    }
    else kq = { thoat: 2, loiChay: ['cần --kiem [--pham-vi <tệp>], --con-tro <ref> hoặc --tra [--slug <hồ sơ>] (câu qua stdin)'] };
  } catch (e) { kq = { thoat: 2, loiChay: [e.message] }; }
  for (const c of kq.canhBao || []) process.stdout.write(`cảnh báo: ${c}\n`);
  for (const d of kq.ra || []) process.stdout.write(d + '\n');
  for (const l of kq.loiChay || []) process.stderr.write(`tri-thuc: ${l}\n`);
  process.exit(kq.thoat);
}
