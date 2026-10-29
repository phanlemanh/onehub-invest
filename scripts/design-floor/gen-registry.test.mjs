// Test lệnh sinh design/component-registry.json (hồ sơ dung-m2-song-song AC-4…AC-6).
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { CATALOG, buildRegistry, cvaVariants } from './gen-registry.mjs';
import { GEN_REGISTRY, ROOT, VARIANT_MATRIX, copyRepo, run } from './test-helpers.mjs';

const REG = buildRegistry(ROOT);
const byName = new Map(REG.components.map((c) => [c.name, c]));
const KIT_KEYS = new Set(['name', 'category', 'markup', 'tokensUsed', 'variants', 'states', 'description', 'status',
  'scope', 'deprecated', 'figmaNode']);


test('M2-AC-4 gốc đúng {version, components}; mỗi bản ghi chỉ khoá thuộc khuôn kit, markup rỗng, tokensUsed rỗng', () => {
  assert.deepEqual(Object.keys(REG), ['version', 'components']);
  assert.equal(typeof REG.version, 'string');
  for (const c of REG.components) {
    assert.deepEqual(Object.keys(c).filter((k) => !KIT_KEYS.has(k)), [], c.name);
    assert.equal(typeof c.name, 'string');
    assert.ok(c.category.length > 0, c.name);
    assert.equal(c.markup, '', c.name);
    assert.deepEqual(c.tokensUsed, [], c.name);
  }
});

test('M2-AC-4 tập tên ui/, ui/svgs/, reui/ bằng tập tệp và thư mục đọc độc lập', () => {
  const dir = (rel) => path.join(ROOT, 'app/src/components', rel);
  const expected = new Set();
  for (const f of readdirSync(dir('ui'))) if (f.endsWith('.tsx')) expected.add(`ui/${f.slice(0, -4)}`);
  for (const f of readdirSync(dir('ui/svgs'))) if (f.endsWith('.tsx')) expected.add(`ui/svgs/${f.slice(0, -4)}`);
  for (const f of readdirSync(dir('reui'))) {
    if (f.endsWith('.tsx')) expected.add(`reui/${f.slice(0, -4)}`);
    else if (statSync(path.join(dir('reui'), f)).isDirectory()) expected.add(`reui/${f}`);
  }
  const got = new Set(REG.components.filter((c) => /^(ui|reui)\//.test(c.name)).map((c) => c.name));
  assert.deepEqual([...got].sort(), [...expected].sort());
  for (const c of REG.components) {
    if (c.name.startsWith('ui/svgs/')) assert.equal(c.category, 'logo', c.name);
    else if (c.name.startsWith('ui/')) assert.equal(c.category, 'shadcn', c.name);
    else if (c.name.startsWith('reui/')) assert.equal(c.category, 'reui', c.name);
  }
});

test('M2-AC-4 ma trận biến thể viết tay bằng đúng đầu ra (không thừa, không thiếu, không trục giả)', () => {
  for (const [name, pairs] of Object.entries(VARIANT_MATRIX)) {
    assert.deepEqual(byName.get(name)?.variants, [...pairs].sort(), name);
  }
  for (const c of REG.components) {
    for (const v of c.variants ?? []) assert.ok(!/^(defaultVariants|compoundVariants|variants|class|className)=/.test(v), `${c.name}: ${v}`);
  }
  assert.equal(byName.get('ui/card').variants, undefined, 'tệp không cva thì không có khoá variants');
  assert.equal(byName.get('reui/data-grid').variants, undefined);
});

test('M2-AC-4 cặp đỏ: thư mục reui/x hai tệp cva → hợp cả hai; bỏ một tệp → mất cặp của nó; bỏ hết → mất bản ghi', () => {
  const dir = copyRepo();
  const x = path.join(dir, 'app/src/components/reui/x');
  mkdirSync(x);
  writeFileSync(path.join(x, 'a.tsx'), 'const a = cva("", { variants: { tone: { calm: "", loud: "" } }, defaultVariants: { tone: "calm" } })\n');
  writeFileSync(path.join(x, 'b.tsx'), 'const b = cva("", { variants: { size: { sm: "a{b}", "lg-x": "" } }, compoundVariants: [{ size: "sm", class: "" }] })\n');
  const reg = () => new Map(buildRegistry(dir).components.map((c) => [c.name, c]));
  assert.deepEqual(reg().get('reui/x').variants, ['size=lg-x', 'size=sm', 'tone=calm', 'tone=loud']);
  rmSync(path.join(x, 'b.tsx'));
  assert.deepEqual(reg().get('reui/x').variants, ['tone=calm', 'tone=loud']);
  rmSync(x, { recursive: true });
  assert.equal(reg().get('reui/x'), undefined);
});

test('M2-AC-4 bộ đọc cva bỏ qua variants ngoài lời gọi cva', () => {
  assert.deepEqual([...cvaVariants('const m = { variants: { hidden: { opacity: 0 } } }')], []);
});

/** Ô đầu các dòng bảng, kèm tên bảng — đọc độc lập theo tiêu đề mục `##`. */
function catalogTables() {
  const tables = {};
  let section = null;
  for (const line of readFileSync(path.join(ROOT, CATALOG), 'utf8').split('\n')) {
    if (line.startsWith('## ')) section = line.slice(3).trim();
    else if (line.startsWith('| ') && !line.startsWith('| Block') && !line.startsWith('| Component') && !line.startsWith('|--')) {
      (tables[section] ??= []).push(line.split('|').map((c) => c.trim()).slice(1, -1));
    }
  }
  return tables;
}

test('M2-AC-5 số dòng mỗi bảng bằng số viết trước; mỗi mã block có đúng một bản ghi template hoặc trùng component đã cài', () => {
  const t = catalogTables();
  const reuiBlocks = t['ReUI Blocks (installed 2026-10-17)'];
  const opsBlocks = t['Cổng Ops — block Solutions (B1, cài 2026-10-23)'];
  const apps = t['Custom Components (created — LAST RESORT only)'];
  assert.deepEqual([reuiBlocks.length, opsBlocks.length, apps.length], [36, 10, 12]);
  const installed = new Set(REG.components.filter((c) => /^(ui|reui)\//.test(c.name)).map((c) => c.name.split('/').pop()));
  let seen = 0;
  for (const row of [...reuiBlocks, ...opsBlocks]) {
    for (const m of row[0].matchAll(/`(@(?:reui|mapcn)\/([a-z0-9-]+))`/g)) {
      seen++;
      if (installed.has(m[2])) assert.equal(byName.get(m[1]), undefined, `${m[1]} trùng component đã cài`);
      else assert.equal(byName.get(m[1])?.category, 'template', m[1]);
    }
  }
  assert.ok(seen >= 46, `đếm mã block ${seen}`);
  const templates = REG.components.filter((c) => c.category === 'template');
  assert.equal(templates.length, seen - [...new Set(['frame', 'icon-tile', 'filters', 'number-field', 'map'])].length);
  for (const gone of ['@reui/frame', '@reui/icon-tile', '@reui/filters', '@reui/number-field', '@mapcn/map']) {
    assert.equal(byName.get(gone), undefined, gone);
  }
});

// Ô File viết tay từ catalog — thước của `description`.
const DESCRIPTIONS = {
  '@reui/hero-8': 'blocks/hero-8/ → marketing/hero.tsx',
  '@mapcn/store-locator': '(không giữ bản gốc — khuôn tham chiếu) → listing/listings-map.tsx',
  StatTiles: 'components/page/',
};
const descriptionErrors = (components) => {
  const m = new Map(components.map((c) => [c.name, c]));
  return Object.entries(DESCRIPTIONS).filter(([n, d]) => m.get(n)?.description !== d).map(([n]) => n);
};

test('M2-AC-5 block và ví dụ c-* là template; description bằng đúng ô File viết tay; app tách theo « / »', () => {
  assert.equal(byName.get('@reui/hero-8').category, 'template');
  assert.equal(byName.get('@reui/c-chart-16').category, 'template');
  assert.deepEqual(descriptionErrors(REG.components), []);
  const apps = REG.components.filter((c) => c.category === 'app').map((c) => c.name);
  assert.equal(apps.length, 15);
  for (const n of ['PageHeader', 'StatTiles', 'ListingKpis', 'ListingComps', 'charts/*', 'MiniMap']) assert.ok(apps.includes(n), n);
});

test('M2-AC-5 cặp đỏ: catalog chép mất ô File của hero-8 → thước description gọi tên @reui/hero-8', () => {
  const dir = copyRepo();
  const f = path.join(dir, CATALOG);
  const md = readFileSync(f, 'utf8');
  const broken = md.replace('| `@reui/hero-8` | blocks/hero-8/ → marketing/hero.tsx |', '| `@reui/hero-8` |  |');
  assert.notEqual(broken, md, 'đột biến không áp được');
  writeFileSync(f, broken);
  assert.deepEqual(descriptionErrors(buildRegistry(dir).components), ['@reui/hero-8']);
});

test('M2-AC-5 tên duy nhất, sắp tăng theo so chuỗi thô', () => {
  const names = REG.components.map((c) => c.name);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(names, [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
});

const BROKEN = [
  ['không catalog', (d) => rmSync(path.join(d, CATALOG)), 'không đọc được catalog'],
  ['catalog không bảng block', (d) => {
    const f = path.join(d, CATALOG);
    writeFileSync(f, readFileSync(f, 'utf8').replace(/^\| Block \|/gm, '| Khối |'));
  }, 'catalog ra 0 block'],
  ['catalog không bảng Custom Components', (d) => {
    const f = path.join(d, CATALOG);
    writeFileSync(f, readFileSync(f, 'utf8').replace(/^\| Component \|/gm, '| Thành phần |'));
  }, 'catalog ra 0 component app'],
  ['không thư mục reui', (d) => rmSync(path.join(d, 'app/src/components/reui'), { recursive: true }), 'thiếu thư mục app/src/components/reui'],
];

test('M2-AC-6 bản chép thật: thoát 0 và ghi tệp', () => {
  const dir = copyRepo();
  const r = run(GEN_REGISTRY, ['--root', dir]);
  assert.equal(r.code, 0, r.stderr);
  assert.ok(existsSync(path.join(dir, 'design/component-registry.json')));
});

for (const [label, breakRepo, message] of BROKEN) {
  test(`M2-AC-6 ${label}: thoát 1, không ghi tệp, thông điệp ghim`, () => {
    const dir = copyRepo();
    breakRepo(dir);
    const r = run(GEN_REGISTRY, ['--root', dir]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes(message), r.stderr);
    assert.ok(!existsSync(path.join(dir, 'design/component-registry.json')));
  });
}
