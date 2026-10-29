// Test lệnh sinh design/tokens.json (hồ sơ dung-m2-song-song AC-1…AC-3).
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { SOURCE, buildTokens } from './gen-tokens.mjs';
import { GEN_TOKENS, ROOT, copyRepo, run } from './test-helpers.mjs';

const CSS = readFileSync(path.join(ROOT, SOURCE), 'utf8');

/** Khai báo `--x: v;` của từng khối, đọc độc lập với lệnh sinh: cắt theo dòng mở khối tới dòng `}` đầu tiên. */
function independentBlocks(css) {
  const lines = css.split('\n');
  const take = (head) => {
    const start = lines.findIndex((l) => l.trim() === `${head} {`);
    const end = lines.findIndex((l, i) => i > start && l.trim() === '}');
    return lines.slice(start + 1, end)
      .map((l) => /^\s*(--[a-z0-9-]+):\s*(.+);\s*$/.exec(l))
      .filter(Boolean)
      .map((m) => ({ name: m[1], value: m[2] }));
  };
  return { root: take(':root'), dark: take('.dark'), theme: take('@theme inline') };
}

/** Thước kiểm đếm: mọi khai báo của nguồn phải có chỗ trong đầu ra — trả danh sách khai báo bị bỏ. */
function droppedDeclarations(css, tokens) {
  const b = independentBlocks(css);
  const leafNames = new Set();
  const darkNames = new Set();
  for (const [group, leaves] of Object.entries(tokens)) {
    for (const [key, leaf] of Object.entries(leaves)) {
      const name = group === 'color' ? `--${key}` : key === 'base' ? `--${group}` : `--${group}-${key}`;
      leafNames.add(name);
      if (leaf.$extensions?.['mode.dark']) darkNames.add(name);
    }
  }
  const dropped = [];
  for (const d of b.root) if (!leafNames.has(d.name)) dropped.push(d.name);
  for (const d of b.dark) if (!darkNames.has(d.name)) dropped.push(`${d.name} (.dark)`);
  for (const d of b.theme) {
    const bridge = /^--color-(.+)$/.exec(d.name);
    if (bridge ? !leafNames.has(`--${bridge[1]}`) : !leafNames.has(d.name)) dropped.push(`${d.name} (@theme)`);
  }
  return dropped;
}

test('M2-AC-1 đếm 41 :root + 40 .dark + 9 @theme riêng + 40 cầu nối = 130, khớp đếm độc lập', () => {
  const b = independentBlocks(CSS);
  assert.deepEqual([b.root.length, b.dark.length, b.theme.length], [41, 40, 49]);
  const { tokens, dem } = buildTokens(CSS);
  assert.deepEqual(dem, { root: 41, dark: 40, theme: 9, bridge: 40 });
  assert.equal(dem.root + dem.dark + dem.theme + dem.bridge, 130);
  const leafCount = Object.values(tokens).reduce((n, g) => n + Object.keys(g).length, 0);
  assert.equal(leafCount, 41 + 9);
  assert.deepEqual(droppedDeclarations(CSS, tokens), []);
});

/** Ma trận tên → (sáng, tối) rút độc lập từ nguồn, so với lá cùng tên; trả các biến lệch. */
function leafMismatches(css, tokens) {
  const b = independentBlocks(css);
  const dark = new Map(b.dark.map((d) => [d.name, d.value]));
  const bad = [];
  for (const d of b.root) {
    const leaf = d.name === '--radius' ? tokens.radius?.base : tokens.color?.[d.name.slice(2)];
    const type = d.name === '--radius' ? 'dimension' : 'color';
    const darkValue = leaf?.$extensions?.['mode.dark']?.$value;
    if (!leaf || leaf.$type !== type || leaf.$value !== d.value || darkValue !== dark.get(d.name)) bad.push(d.name);
  }
  return bad;
}

test('M2-AC-1 ma trận đủ 41 biến: mỗi biến :root một lá đúng $type, giá trị sáng/tối nguyên văn', () => {
  const { tokens } = buildTokens(CSS);
  assert.equal(independentBlocks(CSS).root.length, 41);
  assert.deepEqual(leafMismatches(CSS, tokens), []);
  assert.equal(tokens.color.border.$extensions['mode.dark'].$value, 'oklch(1 0 0 / 10%)');
  assert.equal(tokens.radius.sm.$value, 'calc(var(--radius) * 0.6)');
});

test('M2-AC-1 cặp đỏ: tráo giá trị tối của hai lá → ma trận gọi tên đúng hai biến', () => {
  const { tokens } = buildTokens(CSS);
  const a = tokens.color.card.$extensions['mode.dark'];
  tokens.color.card.$extensions['mode.dark'] = tokens.color['card-foreground'].$extensions['mode.dark'];
  tokens.color['card-foreground'].$extensions['mode.dark'] = a;
  assert.deepEqual(leafMismatches(CSS, tokens), ['--card', '--card-foreground']);
});

test('M2-AC-1 khoá gốc chỉ là nhóm token (không $schema hay khoá meta)', () => {
  const { tokens } = buildTokens(CSS);
  assert.deepEqual(Object.keys(tokens).sort(), ['color', 'font', 'radius']);
  for (const [group, leaves] of Object.entries(tokens)) {
    for (const [key, leaf] of Object.entries(leaves)) {
      assert.deepEqual(Object.keys(leaf).filter((k) => !['$type', '$value', '$extensions'].includes(k)), [], `${group}.${key}`);
    }
  }
});

test('M2-AC-1 cặp đỏ: thêm khai báo :root → có lá mới, tổng 131; đầu ra mất lá → thước báo «khai báo bị bỏ»', () => {
  const css = CSS.replace('--radius: 0.625rem;', '--radius: 0.625rem;\n  --foo: oklch(0.5 0 0);');
  const { tokens, dem } = buildTokens(css);
  assert.equal(tokens.color.foo.$value, 'oklch(0.5 0 0)');
  assert.equal(dem.root + dem.dark + dem.theme + dem.bridge, 131);
  assert.deepEqual(droppedDeclarations(css, tokens), []);
  delete tokens.color.foo;
  assert.deepEqual(droppedDeclarations(css, tokens), ['--foo'], 'khai báo bị bỏ: --foo');
});

test('M2-AC-2 alias {nhóm.tên} cho var trỏ token của tệp; var ngoài tệp giữ chuỗi', () => {
  const { tokens } = buildTokens(CSS);
  assert.equal(tokens.radius.lg.$value, '{radius.base}');
  assert.equal(tokens.color['destructive-foreground'].$value, 'var(--color-red-800)');
  assert.equal(tokens.font.sans.$value, 'var(--font-geist-sans)');
  assert.equal(tokens.font.sans.$type, 'fontFamily');
});

test('M2-AC-2 cặp trên cùng fixture: var trỏ biến ngoài tệp không thành alias, trỏ cầu nối thì thành alias', () => {
  const outside = buildTokens(CSS.replace('--radius-lg: var(--radius);', '--radius-lg: var(--not-ours);'));
  assert.equal(outside.tokens.radius.lg.$value, 'var(--not-ours)');
  const viaBridge = buildTokens(CSS.replace('--font-mono: var(--font-geist-mono);', '--font-mono: var(--color-primary);'));
  assert.equal(viaBridge.tokens.font.mono.$value, '{color.primary}');
});

test('M2-AC-2 tên phẳng tra được bằng đường hai đoạn', () => {
  const { tokens } = buildTokens(CSS);
  for (const p of ['color.chart-1', 'color.sidebar-primary-foreground', 'radius.base', 'radius.2xl', 'font.mono']) {
    const [group, key] = p.split('.');
    assert.ok(tokens[group]?.[key]?.$value, p);
  }
});

const BROKEN = [
  ['biến chỉ có ở .dark', (c) => c.replace('.dark {\n', '.dark {\n  --only-dark: oklch(0 0 0);\n'), '--only-dark chỉ có ở .dark'],
  ['cầu nối trỏ token không có', (c) => c.replace('--color-ring: var(--ring);', '--color-ghost: var(--ghost);'), 'cầu nối --color-ghost trỏ --ghost không có'],
  ['khai báo @theme lạ', (c) => c.replace('--font-sans: var(--font-geist-sans);', '--font-sans: var(--font-geist-sans);\n  --shadow-x: 0 0 1px black;'), 'chưa biết xếp --shadow-x'],
  ['thiếu khối :root', (c) => c.replace(':root {', ':where(html) {'), 'thiếu khối :root'],
];

test('M2-AC-3 bản chép thật: thoát 0 và ghi tệp', () => {
  const dir = copyRepo();
  const r = run(GEN_TOKENS, ['--root', dir]);
  assert.equal(r.code, 0, r.stderr);
  assert.ok(existsSync(path.join(dir, 'design/tokens.json')));
});

for (const [label, breakCss, message] of BROKEN) {
  test(`M2-AC-3 ${label}: thoát 1, không ghi tệp, thông điệp ghim`, () => {
    const dir = copyRepo();
    const file = path.join(dir, SOURCE);
    const broken = breakCss(readFileSync(file, 'utf8'));
    assert.notEqual(broken, readFileSync(file, 'utf8'), 'đột biến không áp được');
    writeFileSync(file, broken);
    const r = run(GEN_TOKENS, ['--root', dir]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes(message), r.stderr);
    assert.ok(!existsSync(path.join(dir, 'design/tokens.json')));
  });
}
