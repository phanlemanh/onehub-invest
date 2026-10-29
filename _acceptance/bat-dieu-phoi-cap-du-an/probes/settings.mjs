#!/usr/bin/env node
// Thước của hồ sơ bat-dieu-phoi-cap-du-an: AC-1 (nội dung so nền cố định), AC-2 (gói có thật trong
// marketplace), AC-3 (phạm vi diff của nhánh), AC-4 (bảy bản phá đỏ trên cùng các hàm).
// Nền AC-1 ghim cứng 0103d246 (đỉnh main lúc cắt nhánh) — không so merge-base: sau gộp merge-base
// chứa sẵn khoá nên phép so mất nghĩa (hồ sơ m2-ac10-so-cap-co-dinh).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const NEN = '0103d246474b50587ec92ed1a5a6da3cdb637fc2';
export const KHOA = 'dieu-phoi@acceptance-gate-kit';
const DONG_KHOA = `    "${KHOA}": true,\n`;
const MANIFEST = join(homedir(), '.claude/plugins/marketplaces/acceptance-gate-kit/.claude-plugin/marketplace.json');
const CHO_PHEP = new Set(['.claude/settings.json', '_acceptance/config.yaml']);

// AC-1: khoá đúng giá trị; bỏ khoá thì giống hệt nền (cả thứ tự khoá lẫn chữ của tệp).
export function kiemNoiDung(baseText, curText) {
  const base = JSON.parse(baseText);
  const cur = JSON.parse(curText);
  if (cur.enabledPlugins?.[KHOA] !== true) throw new Error('khoá dieu-phoi phải là true');
  const bo = structuredClone(cur);
  delete bo.enabledPlugins[KHOA];
  if (JSON.stringify(bo) !== JSON.stringify(base) || curText.replace(DONG_KHOA, '') !== baseText) {
    throw new Error('khác nền ngoài khoá dieu-phoi');
  }
}

// AC-2: khoá mới mang hậu tố của các gói kit có sẵn, tên gói có trong manifest, nguồn marketplace giữ nguyên.
export function kiemGoi(cur, base, manifest) {
  const tenManifest = new Set(manifest.plugins.map((p) => p.name));
  const goiKit = Object.keys(base.enabledPlugins).filter((k) => tenManifest.has(k.split('@')[0]));
  const hauTo = [...new Set(goiKit.map((k) => k.split('@')[1]))];
  if (goiKit.length !== 4 || hauTo.length !== 1 || hauTo[0] !== manifest.name) {
    throw new Error(`nền lạ: ${goiKit.length} gói kit, hậu tố ${hauTo.join(',')}, manifest ${manifest.name}`);
  }
  const moi = Object.keys(cur.enabledPlugins).filter((k) => !(k in base.enabledPlugins));
  for (const k of moi) {
    const [ten, mk] = k.split('@');
    if (mk !== hauTo[0]) throw new Error(`hậu tố marketplace: ${k} (chờ @${hauTo[0]})`);
    if (ten !== 'dieu-phoi' || !tenManifest.has(ten)) throw new Error(`không có gói dieu-phoi trong marketplace (khoá: ${k})`);
  }
  if (moi.length !== 1) throw new Error(`không có gói dieu-phoi trong marketplace (khoá mới: ${moi.length})`);
  const src = (s) => JSON.stringify(s.extraKnownMarketplaces?.[hauTo[0]]);
  if (src(cur) !== src(base)) throw new Error(`nguồn extraKnownMarketplaces.${hauTo[0]} đổi`);
}

// AC-3: tệp đổi ngoài hồ sơ/tài liệu ⊆ {settings.json, config.yaml}; config.yaml chỉ thêm đúng dòng bdp_settings.
export function kiemPhamVi(files, configDiff) {
  const ngoai = files.filter(
    (f) => (f === '_acceptance/config.yaml' || !f.startsWith('_acceptance/')) &&
      !f.startsWith('docs/') && f !== 'PRODUCT-MAP.md' && f !== 'LO-TRINH.html' && !CHO_PHEP.has(f),
  );
  if (ngoai.length) throw new Error(`tệp ngoài vùng: ${ngoai.join(', ')}`);
  if (!files.includes('_acceptance/config.yaml')) return;
  const them = configDiff.filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  const bot = configDiff.filter((l) => l.startsWith('-') && !l.startsWith('---'));
  if (them.length !== 1 || bot.length !== 0 || !/^\+ {4}bdp_settings: /.test(them[0])) {
    throw new Error(`config.yaml phải thêm đúng một dòng bdp_settings (thêm ${them.length}, bớt ${bot.length})`);
  }
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });

function main() {
  let fail = 0;
  const chay = (ten, f, okMsg) => {
    try {
      f();
      console.log(`ok   ${ten} ${okMsg}`);
    } catch (e) {
      fail++;
      console.log(`FAIL ${ten} ${e.message}`);
    }
  };

  try {
    git('cat-file', '-e', `${NEN}^{commit}`);
  } catch {
    console.log(`FAIL thiếu commit nền ${NEN} — kho tải nông? chạy git fetch --unshallow`);
    process.exit(1);
  }
  const baseText = git('show', `${NEN}:.claude/settings.json`);
  const curText = readFileSync('.claude/settings.json', 'utf8');
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const mb = git('merge-base', 'origin/main', 'HEAD').trim();
  const files = git('diff', '--name-only', mb).split('\n').filter(Boolean);
  const configDiff = git('diff', '-U0', mb, '--', '_acceptance/config.yaml').split('\n');

  chay('AC-1', () => kiemNoiDung(baseText, curText),
    'settings.json = nền 0103d246 + đúng khoá dieu-phoi@acceptance-gate-kit=true (bỏ khoá thì giống hệt, cả thứ tự)');
  chay('AC-2', () => kiemGoi(JSON.parse(curText), JSON.parse(baseText), manifest),
    'gói dieu-phoi có trong manifest marketplace acceptance-gate-kit; hậu tố trùng 4 gói kit; extraKnownMarketplaces.acceptance-gate-kit giữ nguyên');
  chay('AC-3', () => kiemPhamVi(files, configDiff),
    'tệp đổi từ merge-base ngoài hồ sơ/tài liệu ⊆ {.claude/settings.json, _acceptance/config.yaml}; config.yaml +1 dòng bdp_settings');

  // AC-4: bản phá dựng từ một bản «tốt» tổng hợp (nền + dòng khoá), không từ tệp hiện tại — bản phá
  // đỏ đúng chỗ dù nhánh đã sửa settings hay chưa.
  const tot = baseText.replace(/("road-map@acceptance-gate-kit": true,\n)/, `$1${DONG_KHOA}`);
  const base = JSON.parse(baseText);
  const dongCfg = '+    bdp_settings: "node _acceptance/bat-dieu-phoi-cap-du-an/probes/settings.mjs"';
  const filesTot = ['.claude/settings.json', '_acceptance/config.yaml', '_acceptance/bat-dieu-phoi-cap-du-an/contract.md', 'docs/a.md', 'PRODUCT-MAP.md'];
  const doiKhoa = (moi) => {
    const o = JSON.parse(tot);
    o.enabledPlugins = Object.fromEntries(Object.entries(o.enabledPlugins).map(([k, v]) => [k === KHOA ? moi : k, v]));
    return o;
  };
  const banPha = [
    ['gia-tri-false', 'khoá dieu-phoi phải là true', () => kiemNoiDung(baseText, tot.replace(`"${KHOA}": true`, `"${KHOA}": false`))],
    ['thieu-khoa', 'khoá dieu-phoi phải là true', () => kiemNoiDung(baseText, baseText)],
    ['them-quyen', 'khác nền ngoài khoá dieu-phoi', () => kiemNoiDung(baseText, tot.replace('"Bash(npm test)",', '"Bash(npm test)",\n      "Bash(rm *)",'))],
    ['hau-to-khac', 'hậu tố marketplace', () => kiemGoi(doiKhoa('dieu-phoi@acceptance-gate'), base, manifest)],
    ['ten-goi-la', 'không có gói dieu-phoi trong marketplace', () => kiemGoi(doiKhoa('dieu-phoj@acceptance-gate-kit'), base, manifest)],
    ['tep-ngoai-vung', 'tệp ngoài vùng: scripts/x.sh', () => kiemPhamVi([...filesTot, 'scripts/x.sh'], [dongCfg])],
    ['config-hai-dong', 'config.yaml phải thêm đúng một dòng bdp_settings', () => kiemPhamVi(filesTot, [dongCfg, '+    khac: "x"'])],
  ];
  // Đối chứng: bản tốt xanh trên cùng ba hàm — không thì bản phá đỏ vì lý do khác.
  chay('AC-4', () => {
    kiemNoiDung(baseText, tot);
    kiemGoi(JSON.parse(tot), base, manifest);
    kiemPhamVi(filesTot, [dongCfg]);
  }, 'bản tốt tổng hợp xanh trên cùng ba hàm');
  for (const [ten, cho, f] of banPha) {
    try {
      f();
      fail++;
      console.log(`FAIL AC-4 bản phá ${ten} không đỏ`);
    } catch (e) {
      if (e.message.includes(cho)) console.log(`ok   AC-4 bản phá ${ten} đỏ: ${e.message}`);
      else {
        fail++;
        console.log(`FAIL AC-4 bản phá ${ten} đỏ sai chỗ: ${e.message} (chờ «${cho}»)`);
      }
    }
  }
  process.exit(fail ? 1 : 0);
}

main();
