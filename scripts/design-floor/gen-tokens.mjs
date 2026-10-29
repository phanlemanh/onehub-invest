#!/usr/bin/env node
// Sinh design/tokens.json (DTCG) từ app/src/app/globals.css — nguyên liệu bậc M2 của design-floor (hồ sơ dung-m2-song-song).
//
//   node scripts/design-floor/gen-tokens.mjs [--root <gốc kho>] [--check]
//
// Bên đọc là `ui reuse-plan check` của acceptance-gate (bản vendored Design OS): mọi khoá gốc là một nhóm, lá cần
// `$type` + `$value`, chế độ tối ở `$extensions["mode.dark"].$value`, bậc 6 tra `<nhóm>.<tên>` hai đoạn.
// Không khai báo nào bị bỏ lặng: mỗi khai báo của ba khối hoặc thành lá, hoặc nhập vào lá (tối), hoặc là cầu nối đã
// kiểm; khai báo không xếp được → thoát 1, không ghi tệp.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE = 'app/src/app/globals.css';
export const OUTPUT = 'design/tokens.json';
const DARK_MODE = 'mode.dark';

export class TokensError extends Error {}

/** Thân `{…}` của khối mở bằng `opener` ở cấp ngoài cùng; null khi không có. */
function blockBody(css, opener) {
  const re = new RegExp(`^${opener.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`, 'm');
  const m = re.exec(css);
  if (!m) return null;
  let depth = 1;
  for (let i = m.index + m[0].length; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(m.index + m[0].length, i);
  }
  throw new TokensError(`khối ${opener} không đóng`);
}

/** Các khai báo `--tên: giá trị;` theo thứ tự trong khối. */
export function declarations(body) {
  const out = [];
  for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out.push({ name: m[1], value: m[2].trim() });
  return out;
}

/** Biến CSS → đường token `<nhóm>.<tên>` và `$type`. */
function classify(name) {
  const bare = name.slice(2);
  if (bare === 'radius') return { group: 'radius', key: 'base', type: 'dimension' };
  if (bare.startsWith('radius-')) return { group: 'radius', key: bare.slice(7), type: 'dimension' };
  if (bare.startsWith('font-')) return { group: 'font', key: bare.slice(5), type: 'fontFamily' };
  return { group: 'color', key: bare, type: 'color' };
}

/**
 * globals.css → { tokens, dem }. `dem` đếm từng loại khai báo để người gọi đối chiếu với nguồn.
 * @throws TokensError khi một khai báo không xếp được.
 */
export function buildTokens(cssText) {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const bodies = {};
  for (const opener of [':root', '.dark', '@theme inline']) {
    const body = blockBody(css, opener);
    if (body === null) throw new TokensError(`thiếu khối ${opener}`);
    bodies[opener] = declarations(body);
  }

  const leaves = new Map(); // biến CSS → { group, key, type, value, dark }
  const pathOf = (name) => leaves.get(name) && `${leaves.get(name).group}.${leaves.get(name).key}`;
  const bridges = new Map(); // --color-X → --X
  const dem = { root: 0, dark: 0, theme: 0, bridge: 0 };

  for (const d of bodies[':root']) {
    const c = classify(d.name);
    if (c.type === 'fontFamily') throw new TokensError(`chưa biết xếp ${d.name} ở :root`);
    leaves.set(d.name, { ...c, value: d.value });
    dem.root++;
  }
  for (const d of bodies['.dark']) {
    const leaf = leaves.get(d.name);
    if (!leaf) throw new TokensError(`${d.name} chỉ có ở .dark`);
    leaf.dark = d.value;
    dem.dark++;
  }
  for (const d of bodies['@theme inline']) {
    const bridge = /^--color-([a-z0-9-]+)$/.exec(d.name);
    if (bridge) {
      const target = /^var\((--[a-z0-9-]+)\)$/.exec(d.value);
      if (!target || target[1] !== `--${bridge[1]}`) throw new TokensError(`chưa biết xếp ${d.name}: ${d.value}`);
      if (!leaves.has(target[1]) || leaves.get(target[1]).group !== 'color') {
        throw new TokensError(`cầu nối ${d.name} trỏ ${target[1]} không có`);
      }
      bridges.set(d.name, target[1]);
      dem.bridge++;
      continue;
    }
    const c = classify(d.name);
    if (c.group === 'color') throw new TokensError(`chưa biết xếp ${d.name}`);
    if (leaves.has(d.name)) throw new TokensError(`${d.name} khai hai lần`);
    leaves.set(d.name, { ...c, value: d.value });
    dem.theme++;
  }

  // Giá trị trọn vẹn var(--Y) với --Y là token (hay cầu nối tới token) → alias DTCG; còn lại giữ nguyên chuỗi.
  const alias = (value) => {
    const m = /^var\((--[a-z0-9-]+)\)$/.exec(value);
    if (!m) return value;
    const target = bridges.get(m[1]) ?? m[1];
    return leaves.has(target) ? `{${pathOf(target)}}` : value;
  };

  const tokens = {};
  for (const leaf of leaves.values()) {
    const out = { $type: leaf.type, $value: alias(leaf.value) };
    if (leaf.dark !== undefined) out.$extensions = { [DARK_MODE]: { $value: alias(leaf.dark) } };
    (tokens[leaf.group] ??= {})[leaf.key] = out;
  }
  return { tokens, dem };
}

export function render(tokens) {
  return `${JSON.stringify(tokens, null, 2)}\n`;
}

function main(argv) {
  let root = '.';
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') root = argv[++i];
    else if (argv[i] === '--check') check = true;
    else {
      process.stderr.write(`gen-tokens: đối số lạ ${argv[i]}\n`);
      return 2;
    }
  }
  const out = path.join(root, OUTPUT);
  let built;
  try {
    built = buildTokens(readFileSync(path.join(root, SOURCE), 'utf8'));
  } catch (e) {
    process.stderr.write(`gen-tokens: ${e instanceof TokensError ? e.message : `không đọc được ${SOURCE}: ${e.message}`}\n`);
    return 1;
  }
  const text = render(built.tokens);
  if (check) {
    if (!existsSync(out)) {
      process.stderr.write(`--check: ${OUTPUT} chưa có — chạy node scripts/design-floor/gen-tokens.mjs\n`);
      return 1;
    }
    if (readFileSync(out, 'utf8') !== text) {
      process.stderr.write(`--check: ${OUTPUT} lệch nguồn ${SOURCE} — chạy node scripts/design-floor/gen-tokens.mjs\n`);
      return 1;
    }
    process.stdout.write(`--check: ${OUTPUT} khớp nguồn\n`);
    return 0;
  }
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, text);
  const { root: r, dark, theme, bridge } = built.dem;
  process.stdout.write(`gen-tokens: ${OUTPUT} — ${r} :root + ${dark} .dark + ${theme} @theme riêng + ${bridge} cầu nối = ${r + dark + theme + bridge} khai báo\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
