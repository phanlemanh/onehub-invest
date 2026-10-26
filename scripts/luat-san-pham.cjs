#!/usr/bin/env node
'use strict';
// luat-san-pham.cjs — luật sản phẩm của kho tiêu thụ (hồ sơ bat-bien-san-pham, ADR 0024).
// Tệp luật ở gốc kho, tên cố định PRODUCT-INVARIANTS.md; tệp là CỦA KHO — mô-đun này chỉ ĐỌC.
// Khuôn tệp: khối marker PRODUCT-INVARIANTS-TEMPLATE trong skills/acceptance/references/product-invariants-template.md
// (bộ kiểm rút đúng khối đó để dựng tệp thử — đổi nhãn một phía là ca LS-01 đỏ).
// Người dùng: bộ xếp lớp căn cứ (can-cu-s1.cjs) · thẻ (gate-card.js) · vị từ còn-cần-người (khong-can-nguoi.mjs,
// start-scan.mjs) · bộ kiểm (tests/scripts/luat-san-pham.ca.mjs).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const TEP_LUAT = 'PRODUCT-INVARIANTS.md';
const MA_RE = /^SP-\d+$/;
const TIEU_DE_RE = /^##\s+(SP-\d+)\s+·\s+(.+?)\s*$/;
const TRUONG_RE = /^-\s+(Mức|Chủ luật|Giữ bằng|Dấu hiệu|Phạm vi|Vì sao):\s*(.*)$/;
const MUC = { 'thường': 'thuong', 'khó đảo': 'kho-dao' };
const MUC_CHU = { thuong: 'thường', 'kho-dao': 'khó đảo' };

// Băm kiểu git blob — khớp `git hash-object`, tính được không cần git (thẻ không chạm git ở đây).
function banLuat(text) {
  const b = Buffer.from(String(text), 'utf8');
  return crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
}

function docLuat(text) {
  const t = String(text == null ? '' : text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const khoi = []; let cur = null;
  t.split('\n').forEach((l, i) => {
    const h = l.match(TIEU_DE_RE);
    if (h) { cur = { ma: h[1], cau: h[2], dong: i + 1, tr: {} }; khoi.push(cur); return; }
    if (/^#{1,2}\s/.test(l)) { cur = null; return; }
    const f = cur && l.match(TRUONG_RE);
    if (f && !(f[1] in cur.tr)) cur.tr[f[1]] = f[2].trim();
  });
  const luat = [], sai_khuon = [], daCo = new Set();
  for (const k of khoi) {
    const sai = ly_do => sai_khuon.push({ ma: k.ma, dong: k.dong, ly_do });
    if (daCo.has(k.ma)) { sai('mã trùng'); continue; }
    if (!k.tr['Chủ luật']) { sai('thiếu Chủ luật'); continue; }
    const muc = MUC[String(k.tr['Mức'] || '').toLowerCase()];
    if (!muc) { sai(`mức lạ: ${k.tr['Mức'] || '(trống)'}`); continue; }
    let re = null, nguon = null;
    if (k.tr['Dấu hiệu']) {
      nguon = k.tr['Dấu hiệu'].replace(/^`(.*)`$/, '$1');
      try { re = new RegExp(nguon); } catch (_) { sai('dấu hiệu không biên dịch được'); continue; }
      if (re.test('')) { sai('dấu hiệu khớp chuỗi rỗng'); continue; }
    }
    const pham_vi = String(k.tr['Phạm vi'] || '').split(',').map(s => s.trim().replace(/^`(.*)`$/, '$1')).filter(Boolean);
    daCo.add(k.ma);
    luat.push({ ma: k.ma, cau: k.cau, muc, chu: k.tr['Chủ luật'], giu: k.tr['Giữ bằng'] || '', dau_hieu: re, dau_hieu_nguon: nguon, pham_vi, vi_sao: k.tr['Vì sao'] || '' });
  }
  return { luat, sai_khuon };
}

// Đọc tệp luật ở cây làm việc (ref vắng) hoặc ở một ref git. Vắng tệp → co_tep:false.
function docTepLuat(root, ref) {
  let text = null;
  if (ref) {
    const r = spawnSync('git', ['-C', root, 'show', `${ref}:${TEP_LUAT}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    text = r.status === 0 ? r.stdout : null;
  } else {
    try { text = fs.readFileSync(path.join(root, TEP_LUAT), 'utf8'); } catch (_) { text = null; }
  }
  if (text === null) return { co_tep: false, text: null, ban: null, luat: [], sai_khuon: [] };
  return Object.assign({ co_tep: true, text, ban: banLuat(text) }, docLuat(text));
}

// ── Bước thiết kế: dòng sổ S1 mang `can_cu.pham_luat` (phạm một luật đã khai) ──────────────────────────
// Ba luật đỏ, thông điệp ghim một nguồn ở đây; can-cu-s1.cjs gộp chúng vào bảng LY_DO của nó và gọi
// xetPhamLuat ngay sau kiểm nguồn lạ. Trả null khi dòng không phạm luật hoặc phạm hợp lệ (chỉ-người,
// đúng nhãn khó-đảo) — lúc đó bộ xếp lớp A2 xếp tiếp như mọi câu chỉ-người.
const LY_DO_LUAT = {
  'pham-luat-may-quyet': 'phạm luật sản phẩm là câu hỏi cho người',
  'luat-vang': 'mã luật không có trong tệp luật sản phẩm',
  'luat-kho-dao': 'luật khó đảo phải mang nhãn khó-đảo',
};
function xetPhamLuat(c, layTep) {
  if (!c || typeof c !== 'object' || typeof c.pham_luat !== 'string') return null;
  const l = (layTep().luat || []).find(x => x.ma === c.pham_luat);
  const them = { luat_ma: c.pham_luat };
  if (!l) return { lop: 'do', ma: 'luat-vang', them };
  if (c.nguon !== 'chi-nguoi') return { lop: 'do', ma: 'pham-luat-may-quyet', them };
  if (l.muc === 'kho-dao' && c.kho_dao !== true) return { lop: 'do', ma: 'luat-kho-dao', them };
  return null;
}
// Mã luật mà một câu trích thuộc về (câu trích nằm trong câu luật, so sau khi gom khoảng trắng). Không có → null.
const gomKt = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
function maTheoTrich(luat, trich) {
  const t = gomKt(trich); if (!t) return null;
  const l = (luat || []).find(x => gomKt(x.cau).includes(t) || t.includes(gomKt(x.cau)));
  return l ? l.ma : null;
}

// ── Thẻ Cổng Phạm vi: chữ và cờ rút từ tệp luật + sổ — thẻ chỉ chèn móc (gate-card.js nhánh Cổng 1) ────
const CO_LUAT = {
  thieuNap: 'Kho đã khai luật sản phẩm mà sổ bước thiết kế chưa có dòng nạp — lựa chọn của vòng chưa được soi theo luật.',
  doi: (cu, moi) => `Luật sản phẩm đã đổi sau khi bước thiết kế nạp (nạp bản ${String(cu).slice(0, 7)}, nay ${String(moi).slice(0, 7)}) — soi lại lựa chọn theo bản mới.`,
  saiKhuon: s => `Tệp luật sản phẩm có khối sai khuôn: ${s.ma || 'dòng ' + s.dong} — ${s.ly_do}; luật đó chưa được nạp.`,
};
// entries = dòng sổ đã đọc; draft = hồ sơ đang ở Cổng Phạm vi (chỉ lúc đó mới có cờ — hồ sơ đã qua cổng đọc như cũ).
function theCong1({ root, entries, draft }) {
  const tep = docTepLuat(root);
  if (!tep.co_tep) return { khoa: { co_tep: false }, co: [], tienTo: () => '', hauTo: () => '' };
  const dongNap = (entries || []).find(e => e && e.stage === 'S1' && e.luat_nap && typeof e.luat_nap.ban === 'string');
  const nap = dongNap ? { ban: dongNap.luat_nap.ban, khop: dongNap.luat_nap.ban === tep.ban } : null;
  const co = [];
  if (draft) {
    if (!nap) co.push(['fwarn', CO_LUAT.thieuNap]);
    else if (!nap.khop) co.push(['fwarn', CO_LUAT.doi(nap.ban, tep.ban)]);
    for (const sk of tep.sai_khuon) co.push(['fwarn', CO_LUAT.saiKhuon(sk)]);
  }
  const theoMa = ma => tep.luat.find(x => x.ma === ma);
  // Tiền tố câu hỏi «Phạm luật SP-n — <câu> (chủ luật: <tên>)» cho dòng chỉ-người mang pham_luat.
  const tienTo = c => { const l = c && typeof c.pham_luat === 'string' ? theoMa(c.pham_luat) : null; return l ? `Phạm luật ${l.ma} — ${l.cau} (chủ luật: ${l.chu})` : ''; };
  // Hậu tố «theo luật SP-n» cho dòng máy đã quyết trích một câu luật.
  const hauTo = c => { if (!c || c.nguon !== 'muc-tieu' || String(c.tep || '').replace(/^\.\//, '') !== TEP_LUAT) return ''; const ma = maTheoTrich(tep.luat, c.trich); return ma ? `theo luật ${ma}` : ''; };
  return { khoa: { co_tep: true, so_luat: tep.luat.length, sai_khuon: tep.sai_khuon.map(({ ma, dong, ly_do }) => ({ ma, dong, ly_do })), nap }, co, tienTo, hauTo };
}

// ── Lượt chấm: soi dòng THÊM của diff theo `Dấu hiệu` của từng luật → _acceptance/<slug>/luat-cham.json ──
// Thẻ Cổng Bằng chứng và vị từ còn-cần-người chỉ ĐỌC tệp này (thẻ không tự gọi git diff).
const DONG_MAY = /^Co-Authored-By:\s*Claude\b/mi;   // dấu duy nhất có sẵn trong lịch sử để tách commit máy/người
const gitOut = (root, a) => {
  const r = spawnSync('git', ['-C', root, ...a], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${String(r.stderr || '').trim()}`);
  return r.stdout;
};
let _globRe = null;
const khopGlob = (g, tep) => { if (!_globRe) _globRe = require('../lib/evidence-core.cjs').pathGlobToRe; return _globRe(g).test(tep); };
// null = kho không khai luật (không có tệp ở cả base lẫn den).
function quet({ root, base, den }) {
  const dau = docTepLuat(root, den), cu = docTepLuat(root, base);
  if (!dau.co_tep && !cu.co_tep) return null;
  const sua = { may: [], nguoi: [] };
  for (const sha of gitOut(root, ['log', '--format=%H', `${base}..${den}`, '--', TEP_LUAT]).split('\n').filter(Boolean))
    (DONG_MAY.test(gitOut(root, ['log', '-1', '--format=%B', sha])) ? sua.may : sua.nguoi).push(sha);
  const cham = [];
  const luat = dau.luat.filter(l => l.dau_hieu);
  if (luat.length) {
    let tep = null, dong = 0;
    for (const l of gitOut(root, ['diff', '--no-color', '--no-ext-diff', '--unified=0', '-M', `${base}...${den}`]).split('\n')) {
      if (l.startsWith('diff --git ')) { tep = null; continue; }
      if (l.startsWith('+++ ')) { tep = l === '+++ /dev/null' ? null : l.slice(6); continue; }
      const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/); if (h) { dong = +h[1]; continue; }
      if (!tep || !l.startsWith('+')) continue;
      const chu = l.slice(1);
      if (!tep.startsWith('_acceptance/') && tep !== TEP_LUAT)
        for (const r of luat)
          if ((!r.pham_vi.length || r.pham_vi.some(g => khopGlob(g, tep))) && r.dau_hieu.test(chu))
            cham.push({ ma: r.ma, tep, dong, chu: chu.slice(0, 160) });
      dong++;
    }
  }
  return { ban: dau.ban, base: gitOut(root, ['rev-parse', base]).trim(), den: gitOut(root, ['rev-parse', den]).trim(), sua_tep_luat: sua, cham };
}
const docCham = (root, slug) => { try { return JSON.parse(fs.readFileSync(path.join(root, '_acceptance', slug, 'luat-cham.json'), 'utf8')); } catch (_) { return null; } };

// ── Vị từ còn-cần-người + thẻ Cổng Bằng chứng: chỉ ĐỌC luat-cham.json ───────────────────────────────────
// Trạng thái đã qua Cổng Bằng chứng: không soi lại, không cờ (hồ sơ đời trước vòng này không có luat-cham.json).
// Hỏi bộ đọc hồ sơ dùng chung, đừng chép danh sách (lib/workspace-record.cjs: «chép là hai bản trôi»).
let _daQua = null;
const daQua = st => { if (!_daQua) { const W = require('../lib/workspace-record.cjs'); _daQua = new Set([...W.DA_THONG_CONG_2, ...(W.DA_DONG_THUC_TE || [])]); } return _daQua.has(st); };
const fmVal = (t, k) => { const m = String(t || '').match(/^---\r?\n([\s\S]*?)\r?\n---/); if (!m) return ''; const mm = m[1].match(new RegExp(`^${k}\\s*:\\s*(.*)$`, 'm')); return mm ? mm[1].replace(/\s+#.*$/, '').trim() : ''; };
// ctx.luat cho khongCanNguoi — null khi kho không khai luật (vị từ đi đường cũ, giữ đẳng thức LV5).
function ctxLuat(root, slug, contractTxt, evidenceTxt) {
  if (!docTepLuat(root).co_tep) return null;
  return { co_tep: true, cham: docCham(root, slug), verified_commit: fmVal(evidenceTxt, 'verified_commit') || null, da_qua: daQua(fmVal(contractTxt, 'status').toLowerCase()) };
}
// Lý do còn cần người vì luật sản phẩm; '' khi không chặn. Một nguồn cho khong-can-nguoi và thẻ.
function chanLuat(L) {
  if (!L || !L.co_tep || L.da_qua) return '';
  if (!L.cham || L.cham.den !== L.verified_commit) return 'còn cần người: luật sản phẩm (chưa soi luật trên bản đã chấm)';
  if ((L.cham.cham || []).length) return `còn cần người: luật sản phẩm (${L.cham.cham.length} chỗ chạm)`;
  if (((L.cham.sua_tep_luat || {}).may || []).length) return 'còn cần người: luật sản phẩm (máy sửa tệp luật)';
  return '';
}
const CO_LUAT_G2 = {
  sua: 'Vòng này sửa tệp luật sản phẩm — máy không sửa luật; tách thành commit riêng của chủ kho',
  nguoiSua: n => `Chủ kho sửa tệp luật trong nhánh vòng (${n} commit)`,
  chuaSoi: 'Chưa soi luật sản phẩm trên bản đã chấm',
};
// esc = hàm thoát HTML của thẻ. Trả null khi kho không khai luật.
function theCong2({ root, slug, contractTxt, evidenceTxt, esc }) {
  const L = ctxLuat(root, slug, contractTxt, evidenceTxt);
  if (!L) return null;
  const tep = docTepLuat(root); const theoMa = ma => tep.luat.find(x => x.ma === ma);
  const c = L.cham, co = [], slots = [], ymItems = [];
  const chuaSoi = !L.da_qua && (!c || c.den !== L.verified_commit);
  if (chuaSoi) co.push(['fwarn', CO_LUAT_G2.chuaSoi]);
  const may = c ? (c.sua_tep_luat || {}).may || [] : [], nguoi = c ? (c.sua_tep_luat || {}).nguoi || [] : [];
  if (may.length) co.push(['fred', CO_LUAT_G2.sua]);
  else if (nguoi.length) co.push(['finfo', CO_LUAT_G2.nguoiSua(nguoi.length)]);
  const nhom = new Map(); for (const x of (c && c.cham) || []) { if (!nhom.has(x.ma)) nhom.set(x.ma, []); nhom.get(x.ma).push(x); }
  let html = '';
  if (nhom.size) {
    html = `<div class="lab">Luật sản phẩm bị chạm</div><div class="grp gdo">` + [...nhom].map(([ma, ds]) => {
      const l = theoMa(ma) || { cau: '(luật không còn trong tệp)', chu: '?', muc: 'thuong' };
      const cho = ds.slice(0, 3).map(x => `${x.tep}:${x.dong}`).join(' · ') + (ds.length > 3 ? ` · và ${ds.length - 3} chỗ nữa` : '');
      return `<p class="li" data-luat="${esc(ma)}"><b>${esc(ma)}</b> · ${esc(l.cau)} · chủ luật: ${esc(l.chu)} · ${l.muc === 'kho-dao' ? '<b>khó-đảo</b>' : 'thường'} — ${esc(cho)}</p>`;
    }).join('') + `</div>`;
    for (const ma of nhom.keys()) {
      slots.push({ lbl: ma, val: 'sửa vật' });
      ymItems.push(`<b>Quyết luật ${esc(ma)}</b> — làm gì: đọc mục ${esc(ma)} ở khối "Luật sản phẩm bị chạm"; máy khuyên «sửa vật»; trả lời dạng: «${esc(ma)}: sửa vật» hoặc «${esc(ma)}: chấp nhận có tên».`);
    }
  }
  if (may.length) { slots.push({ lbl: 'Tệp luật', val: '___' }); ymItems.push(`<b>Tệp luật</b> — làm gì: tách thay đổi tệp luật thành commit riêng của chủ kho; trả lời dạng: «Tệp luật: <đã tách / lý do>».`); }
  const nhanNgoai = f => {
    const ma = [...new Set((`${f.title || ''} ${f.plain || ''} ${f.detail || ''}`.match(/\bSP-\d+\b/g) || []))].filter(m => theoMa(m));
    return ma.map(m => `luật ${m} · ${MUC_CHU[theoMa(m).muc]}`).join(' · ');
  };
  return { chan: !!chanLuat(L), khoa: { co_tep: true, cham: (c && c.cham) || [], sua_tep_luat: c ? c.sua_tep_luat : null, chua_soi: chuaSoi }, html, co, slots, ymItems, nhanNgoai };
}

// ── Đường đo cho Cổng Giá trị: mỗi hồ sơ có sổ một hàng ─────────────────────────────────────────────────
// ngay_khai = ngày (UTC) commit đầu thêm tệp luật; tu = giữ hồ sơ có dòng sổ đầu mang `at` ≥ ngày đó.
function dem(root, { tu } = {}) {
  let ngay_khai = null;
  try { const ds = gitOut(root, ['log', '--diff-filter=A', '--format=%cI', '--', TEP_LUAT]).split('\n').filter(Boolean); if (ds.length) ngay_khai = new Date(ds[ds.length - 1]).toISOString().slice(0, 10); } catch (_) { ngay_khai = null; }
  const tep = docTepLuat(root); const coMa = new Set(tep.luat.map(l => l.ma));
  let ds = [];
  try { ds = fs.readdirSync(path.join(root, '_acceptance')).filter(n => !n.startsWith('.')).sort(); } catch (_) { return { ngay_khai, hang: [] }; }
  const hang = [];
  for (const slug of ds) {
    let txt; try { txt = fs.readFileSync(path.join(root, '_acceptance', slug, 'decisions.jsonl'), 'utf8'); } catch (_) { continue; }
    const entries = []; for (const l of txt.split('\n')) { if (!l.trim()) continue; try { const e = JSON.parse(l); if (e && typeof e === 'object') entries.push(e); } catch (_) { /* dòng hỏng bỏ qua */ } }
    const dau = entries.find(e => typeof e.at === 'string');
    if (tu && (!dau || dau.at.slice(0, 10) < tu)) continue;
    const biThay = new Set(entries.filter(e => typeof e.supersedes === 'string').map(e => e.supersedes));
    const s1 = entries.filter(e => e.stage === 'S1');
    const c = docCham(root, slug) || { cham: [], sua_tep_luat: { may: [], nguoi: [] } };
    let nhan_ngoai = 0;
    try {
      const f = fs.readFileSync(path.join(root, '_acceptance', slug, 'review-findings.md'), 'utf8');
      for (const x of require('../lib/out-of-contract.cjs').parse(f).findings)
        if ((`${x.title || ''} ${x.plain || ''} ${x.detail || ''}`.match(/\bSP-\d+\b/g) || []).some(m => coMa.has(m))) nhan_ngoai++;
    } catch (_) { /* không có tệp phát hiện */ }
    hang.push({
      slug,
      dong_nap: s1.some(e => e.luat_nap && typeof e.luat_nap.ban === 'string') ? 1 : 0,
      pham_thiet_ke: s1.filter(e => e.can_cu && typeof e.can_cu.pham_luat === 'string' && !biThay.has(e.id)).length,
      cham_diff: (c.cham || []).length,
      nhan_ngoai,
      may_sua: ((c.sua_tep_luat || {}).may || []).length,
      nguoi_sua: ((c.sua_tep_luat || {}).nguoi || []).length,
    });
  }
  return { ngay_khai, hang };
}

module.exports = { TEP_LUAT, MA_RE, MUC_CHU, LY_DO_LUAT, CO_LUAT, CO_LUAT_G2, banLuat, docLuat, docTepLuat, xetPhamLuat, maTheoTrich, theCong1, quet, docCham, ctxLuat, chanLuat, theCong2, dem };

if (require.main === module) {
  const a = process.argv.slice(2); const opt = n => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; };
  const root = opt('--root') || '.'; const slug = opt('--slug');
  if (a.includes('--quet')) {
    const base = opt('--base'), den = opt('--den');
    if (!slug || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) || !base || !den) { process.stderr.write('luat-san-pham: --quet cần --slug <hồ sơ> --base <ref> --den <ref>\n'); process.exit(2); }
    let o; try { o = quet({ root, base, den }); } catch (e) { process.stderr.write(`luat-san-pham: ${e.message}\n`); process.exit(2); }
    if (o === null) { process.stdout.write('kho không khai luật\n'); process.exit(0); }
    const txt = JSON.stringify(o, null, 1) + '\n';
    if (a.includes('--write')) { fs.writeFileSync(path.join(root, '_acceptance', slug, 'luat-cham.json'), txt); process.stdout.write(`luat-cham.json: ${o.cham.length} chỗ chạm · máy sửa tệp luật ${o.sua_tep_luat.may.length} · chủ kho sửa ${o.sua_tep_luat.nguoi.length}\n`); }
    else process.stdout.write(txt);
    process.exit(0);
  }
  if (a.includes('--dem')) {
    const tu = opt('--tu');
    if (tu && !/^\d{4}-\d{2}-\d{2}$/.test(tu)) { process.stderr.write('luat-san-pham: --tu cần YYYY-MM-DD\n'); process.exit(2); }
    const o = dem(root, { tu });
    if (a.includes('--json')) process.stdout.write(JSON.stringify(o, null, 2) + '\n');
    else {
      process.stdout.write(`ngày khai tệp luật: ${o.ngay_khai || '(chưa khai)'}${tu ? ` · từ ${tu}` : ''} · ${o.hang.length} hồ sơ\n`);
      for (const h of o.hang) process.stdout.write(`${h.slug} · dòng nạp ${h.dong_nap} · phạm ở thiết kế ${h.pham_thiet_ke} · chạm trên diff ${h.cham_diff} · nhãn ngoài hợp đồng ${h.nhan_ngoai} · máy sửa tệp luật ${h.may_sua} · chủ kho sửa ${h.nguoi_sua}\n`);
    }
    process.exit(0);
  }
  process.stderr.write('luat-san-pham: dùng --quet (hoặc --dem)\n'); process.exit(2);
}
