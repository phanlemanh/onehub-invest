#!/usr/bin/env node
// Sinh design/component-registry.json từ components/ui + components/reui + catalog onehub-ui — nguyên liệu bậc M2 của
// design-floor (hồ sơ dung-m2-song-song).
//
//   node scripts/design-floor/gen-registry.mjs [--root <gốc kho>] [--check]
//
// Bên đọc là `ui reuse-plan check` của acceptance-gate: gốc đúng `{version, components}`, mỗi bản ghi chỉ mang khoá
// thuộc khuôn kit. Tên theo đúng cách kho gọi (`ui/<x>`, `reui/<x>`, `@reui/<block>`, tên component của app). Block
// của catalog (kể cả ví dụ `c-*`) là template — bậc 2, thứ trang được dựng từ đó (`routes.md`, cột Block đích); thành
// phần đã cài và component của app là bậc 3.
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const COMPONENTS_DIR = 'app/src/components';
export const CATALOG = '.claude/skills/onehub-ui/catalog.md';
export const OUTPUT = 'design/component-registry.json';
export const VERSION = '0.1.0';

export class RegistryError extends Error {}

// ─── Đọc cva(…) ───────────────────────────────────────────────────────────────

function skipString(s, i) {
  const q = s[i];
  for (i++; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === q) return i + 1;
  }
  return s.length;
}

function skipSpace(s, i) {
  for (;;) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s.startsWith('//', i)) i = s.indexOf('\n', i) === -1 ? s.length : s.indexOf('\n', i);
    else if (s.startsWith('/*', i)) i = s.indexOf('*/', i) === -1 ? s.length : s.indexOf('*/', i) + 2;
    else return i;
  }
}

/** s[i] là ( [ {; trả chỉ số ngay sau dấu đóng tương ứng, bỏ qua chuỗi và chú thích. */
function skipGroup(s, i) {
  let depth = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(s, i); continue; }
    if (s.startsWith('//', i) || s.startsWith('/*', i)) { i = skipSpace(s, i); continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if ((c === ')' || c === ']' || c === '}') && --depth === 0) return i + 1;
    i++;
  }
  return s.length;
}

/** Khoá cấp một của object literal mở ở s[i] === '{', kèm vị trí giá trị. */
function objectEntries(s, i) {
  const entries = [];
  i = skipSpace(s, i + 1);
  while (i < s.length && s[i] !== '}') {
    let key;
    if (s[i] === '"' || s[i] === "'") {
      const end = skipString(s, i);
      key = s.slice(i + 1, end - 1);
      i = end;
    } else {
      const m = /^[A-Za-z0-9_$-]+/.exec(s.slice(i));
      if (!m) return entries;
      key = m[0];
      i += key.length;
    }
    i = skipSpace(s, i);
    if (s[i] !== ':') return entries;
    i = skipSpace(s, i + 1);
    const start = i;
    while (i < s.length && s[i] !== ',' && s[i] !== '}') {
      if ('"\'`'.includes(s[i])) i = skipString(s, i);
      else if ('([{'.includes(s[i])) i = skipGroup(s, i);
      else i++;
    }
    entries.push({ key, start });
    if (s[i] === ',') i = skipSpace(s, i + 1);
  }
  return entries;
}

/** Mọi cặp `trục=giá trị` trong khối `variants` của các lời gọi cva(…) của một tệp. */
export function cvaVariants(src) {
  const out = new Set();
  for (const m of src.matchAll(/\bcva\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const call = src.slice(open, skipGroup(src, open));
    const v = /\bvariants\s*:\s*\{/.exec(call);
    if (!v) continue;
    const at = v.index + v[0].length - 1;
    for (const axis of objectEntries(call, at)) {
      if (call[axis.start] !== '{') continue;
      for (const value of objectEntries(call, axis.start)) out.add(`${axis.key}=${value.key}`);
    }
  }
  return out;
}

// ─── Thành phần đã cài ────────────────────────────────────────────────────────

function listDir(root, rel) {
  const dir = path.join(root, rel);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new RegistryError(`thiếu thư mục ${rel}`);
  return readdirSync(dir).sort();
}

function tsxUnder(abs) {
  if (statSync(abs).isFile()) return abs.endsWith('.tsx') || abs.endsWith('.ts') ? [abs] : [];
  return readdirSync(abs).sort().flatMap((f) => tsxUnder(path.join(abs, f)));
}

function componentRecord(name, category, abs) {
  const variants = new Set();
  for (const f of tsxUnder(abs)) for (const v of cvaVariants(readFileSync(f, 'utf8'))) variants.add(v);
  const rec = { name, category, markup: '', tokensUsed: [] };
  if (variants.size > 0) rec.variants = [...variants].sort();
  return rec;
}

/** Bản ghi cho `ui/` (kèm `ui/svgs/`) và `reui/`; cộng tập stem đã cài để lọc block trùng tên. */
export function installedComponents(root) {
  const records = [];
  const stems = new Set();
  for (const lib of ['ui', 'reui']) {
    const rel = `${COMPONENTS_DIR}/${lib}`;
    for (const entry of listDir(root, rel)) {
      const abs = path.join(root, rel, entry);
      const isDir = statSync(abs).isDirectory();
      if (lib === 'ui' && entry === 'svgs') {
        for (const f of readdirSync(abs).sort().filter((x) => x.endsWith('.tsx'))) {
          records.push({ name: `ui/svgs/${f.slice(0, -4)}`, category: 'logo', markup: '', tokensUsed: [] });
        }
        continue;
      }
      if (!isDir && !entry.endsWith('.tsx')) continue;
      const stem = isDir ? entry : entry.slice(0, -4);
      stems.add(stem);
      records.push(componentRecord(`${lib}/${stem}`, lib === 'ui' ? 'shadcn' : 'reui', abs));
    }
  }
  return { records, stems };
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

function cells(line) {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split(/(?<!\\)\|/).map((c) => c.trim());
}

/** Bảng block (cột đầu «Block») và bảng «Custom Components» (cột đầu «Component») của catalog.md. */
export function catalogRecords(md, installedStems) {
  const blocks = [];
  const apps = [];
  let kind = null; // 'block' | 'app' | null — theo hàng tiêu đề của bảng đang đọc
  let header = true;
  for (const line of md.split('\n')) {
    if (!line.trim().startsWith('|')) { kind = null; header = true; continue; }
    const row = cells(line);
    if (header) {
      kind = row[0] === 'Block' ? 'block' : row[0] === 'Component' ? 'app' : null;
      header = false;
      continue;
    }
    if (row.every((c) => /^:?-+:?$/.test(c))) continue;
    if (kind === 'block') {
      for (const m of row[0].matchAll(/`@(reui|mapcn)\/([a-z0-9-]+)`/g)) {
        if (installedStems.has(m[2])) continue;
        blocks.push({
          name: `@${m[1]}/${m[2]}`,
          category: 'template',
          description: row[1] ?? '',
          markup: '',
          tokensUsed: [],
        });
      }
    } else if (kind === 'app') {
      for (const name of row[0].split(' / ').map((n) => n.replace(/`/g, '').trim()).filter(Boolean)) {
        apps.push({ name, category: 'app', description: row[1] ?? '', markup: '', tokensUsed: [] });
      }
    }
  }
  if (blocks.length === 0) throw new RegistryError('catalog ra 0 block');
  if (apps.length === 0) throw new RegistryError('catalog ra 0 component app');
  return [...blocks, ...apps];
}

/** Gốc kho → registry `{version, components}`. */
export function buildRegistry(root) {
  const { records, stems } = installedComponents(root);
  let md;
  try {
    md = readFileSync(path.join(root, CATALOG), 'utf8');
  } catch {
    throw new RegistryError(`không đọc được catalog ${CATALOG}`);
  }
  const byName = new Map();
  for (const rec of [...records, ...catalogRecords(md, stems)]) if (!byName.has(rec.name)) byName.set(rec.name, rec);
  const components = [...byName.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { version: VERSION, components };
}

export function render(registry) {
  return `${JSON.stringify(registry, null, 2)}\n`;
}

function main(argv) {
  let root = '.';
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') root = argv[++i];
    else if (argv[i] === '--check') check = true;
    else {
      process.stderr.write(`gen-registry: đối số lạ ${argv[i]}\n`);
      return 2;
    }
  }
  const out = path.join(root, OUTPUT);
  let registry;
  try {
    registry = buildRegistry(root);
  } catch (e) {
    process.stderr.write(`gen-registry: ${e instanceof RegistryError ? e.message : e.stack}\n`);
    return 1;
  }
  const text = render(registry);
  if (check) {
    if (!existsSync(out)) {
      process.stderr.write(`--check: ${OUTPUT} chưa có — chạy node scripts/design-floor/gen-registry.mjs\n`);
      return 1;
    }
    if (readFileSync(out, 'utf8') !== text) {
      process.stderr.write(`--check: ${OUTPUT} lệch nguồn (components/ui, components/reui, catalog) — chạy node scripts/design-floor/gen-registry.mjs\n`);
      return 1;
    }
    process.stdout.write(`--check: ${OUTPUT} khớp nguồn\n`);
    return 0;
  }
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, text);
  const by = {};
  for (const c of registry.components) by[c.category] = (by[c.category] ?? 0) + 1;
  process.stdout.write(`gen-registry: ${OUTPUT} — ${registry.components.length} thành phần (${Object.entries(by).map(([k, n]) => `${k} ${n}`).join(', ')})\n`);
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
