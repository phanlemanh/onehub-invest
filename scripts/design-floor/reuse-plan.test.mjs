// Bộ kiểm kế hoạch dùng lại của acceptance-gate 2.35.0 đọc được hai tệp sinh (hồ sơ dung-m2-song-song AC-7, AC-9;
// round-trip ma trận biến thể của AC-4). Chạy trên tệp sinh từ nguồn hiện tại, ghi vào thư mục tạm.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { buildRegistry, render as renderRegistry } from './gen-registry.mjs';
import { SOURCE, buildTokens, render as renderTokens } from './gen-tokens.mjs';
import { ROOT, UI, VARIANT_MATRIX, requireKitFile } from './test-helpers.mjs';

const WORK = mkdtempSync(path.join(tmpdir(), 'reuse-plan-'));
const REGISTRY = path.join(WORK, 'component-registry.json');
const TOKENS = path.join(WORK, 'tokens.json');
writeFileSync(REGISTRY, renderRegistry(buildRegistry(ROOT)));
writeFileSync(TOKENS, renderTokens(buildTokens(readFileSync(path.join(ROOT, SOURCE), 'utf8')).tokens));

/** Chạy `ui reuse-plan check` trên một kế hoạch; trả mã thoát và các mã finding. */
function check(planText) {
  const plan = path.join(mkdtempSync(path.join(WORK, 'plan-')), 'reuse-plan.md');
  writeFileSync(plan, planText);
  const r = spawnSync(process.execPath, [requireKitFile(UI), 'reuse-plan', 'check', plan, '--file', REGISTRY, '--tokens', TOKENS, '--json'],
    { cwd: WORK, encoding: 'utf8' });
  let data = null;
  try { data = JSON.parse(r.stdout).data; } catch { /* để assert dưới nói */ }
  assert.ok(data, `ui.mjs không trả JSON (mã ${r.status}): ${r.stdout}${r.stderr}`);
  return { code: r.status, errorCount: data.errorCount, codes: data.findings.map((f) => f.code) };
}

const PLAN = `## Screen: Trang chủ
Pattern: @reui/hero-8

| Slot | Rung | Use | Reason |
|---|---|---|---|
| hero | 2 | @reui/hero-8 | — |
| nút | 3 | ui/button | — |
| ô KPI | 3 | StatTiles | — |
| nút xoá | 4 | ui/button (variant=destructive) | — |
| vùng trống | 5 | reui/frame + ui/empty | — |
| dải màu | 6 | color.chart-1, radius.base | — |
| thẻ người bán | 7 | ds-new: Seller chip | catalog chưa có thẻ người bán |
| quảng cáo | 1 | skip | sản phẩm không chạy quảng cáo |
`;

test('M2-AC-7 kế hoạch đủ bảy bậc trên tệp sinh thật → thoát 0, 0 finding', () => {
  assert.deepEqual(check(PLAN), { code: 0, errorCount: 0, codes: [] });
});

const BROKEN = [
  ['tên bịa', '| nút | 3 | ui/button |', '| nút | 3 | ui/fancy-button |', 'UNKNOWN_COMPONENT'],
  ['biến thể không có', 'ui/button (variant=destructive)', 'ui/button (variant=rainbow)', 'BAD_VARIANT_VALUE'],
  ['token không có', 'color.chart-1, radius.base', 'color.chart-9, radius.base', 'UNRESOLVED_TOKEN'],
  ['template là component', '| hero | 2 | @reui/hero-8 |', '| hero | 2 | ui/button |', 'RUNG2_NOT_TEMPLATE'],
];

for (const [label, from, to, code] of BROKEN) {
  test(`M2-AC-7 cặp đỏ — ${label}: thoát 2, mã ${code}`, () => {
    const broken = PLAN.replace(from, to);
    assert.notEqual(broken, PLAN, 'đột biến không áp được');
    const r = check(broken);
    assert.equal(r.code, 2);
    assert.deepEqual(r.codes, [code]);
  });
}

test('M2-AC-4 mọi cặp của ma trận biến thể qua được bậc 4 của bộ kiểm', () => {
  const rows = Object.entries(VARIANT_MATRIX).flatMap(([name, pairs]) =>
    pairs.map((pair, i) => `| ${name} ${i} | 4 | ${name} (${pair}) | — |`));
  const plan = `## Screen: Ma trận\nPattern: none — kế hoạch đo, không phải màn thật\n\n| Slot | Rung | Use | Reason |\n|---|---|---|---|\n${rows.join('\n')}\n`;
  assert.deepEqual(check(plan), { code: 0, errorCount: 0, codes: [] });
});

/** Khối mẫu giữa hai marker của SKILL.md, bỏ dòng rào ``` (bộ kiểm bỏ qua nội dung trong rào). */
function skillExample() {
  const md = readFileSync(path.join(ROOT, '.claude/skills/onehub-ui/SKILL.md'), 'utf8');
  const blocks = md.split('<!-- REUSE-PLAN-MAU -->').slice(1);
  assert.equal(blocks.length, 1, 'phải có đúng một marker mở REUSE-PLAN-MAU');
  const body = blocks[0].split('<!-- /REUSE-PLAN-MAU -->');
  assert.equal(body.length, 2, 'thiếu marker đóng /REUSE-PLAN-MAU');
  return body[0].split('\n').filter((l) => !/^\s*```/.test(l)).join('\n');
}

test('M2-AC-9 mẫu kế hoạch trong SKILL.md qua reuse-plan check trên tệp sinh thật', () => {
  const example = skillExample();
  assert.match(example, /^## Screen: /m);
  assert.deepEqual(check(example), { code: 0, errorCount: 0, codes: [] });
});

test('M2-AC-9 cặp đỏ: mẫu đổi một tên thành tên bịa → thoát 2 UNKNOWN_COMPONENT', () => {
  const example = skillExample();
  const broken = example.replace('| PageHeader |', '| PageHeaderX |');
  assert.notEqual(broken, example, 'đột biến không áp được');
  const r = check(broken);
  assert.equal(r.code, 2);
  assert.deepEqual(r.codes, ['UNKNOWN_COMPONENT']);
});
