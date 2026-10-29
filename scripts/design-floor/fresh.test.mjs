// Độ tươi của hai tệp sinh và bậc M1 giữ nguyên (hồ sơ dung-m2-song-song AC-8, AC-10).
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { GEN_REGISTRY, GEN_TOKENS, KIT, ROOT, copyRepo, requireKitFile, run } from './test-helpers.mjs';

const TOKENS = 'design/tokens.json';
const REGISTRY = 'design/component-registry.json';

function writeBoth(dir) {
  for (const s of [GEN_TOKENS, GEN_REGISTRY]) assert.equal(run(s, ['--root', dir]).code, 0);
}

test('M2-AC-8 --check thoát 0 khi tệp khớp nguồn; ghi hai lần giống từng byte', () => {
  const dir = copyRepo();
  writeBoth(dir);
  const first = [TOKENS, REGISTRY].map((f) => readFileSync(path.join(dir, f), 'utf8'));
  writeBoth(dir);
  assert.deepEqual([TOKENS, REGISTRY].map((f) => readFileSync(path.join(dir, f), 'utf8')), first);
  const t = run(GEN_TOKENS, ['--root', dir, '--check']);
  const r = run(GEN_REGISTRY, ['--root', dir, '--check']);
  assert.equal(t.code, 0, t.stderr);
  assert.equal(r.code, 0, r.stderr);
  assert.match(t.stdout, /--check: design\/tokens\.json khớp nguồn/);
  assert.match(r.stdout, /--check: design\/component-registry\.json khớp nguồn/);
});

test('M2-AC-8 cặp đỏ: sửa một giá trị globals.css → tokens --check thoát 1 nêu tệp và lệnh sinh lại', () => {
  const dir = copyRepo();
  writeBoth(dir);
  const css = path.join(dir, 'app/src/app/globals.css');
  const src = readFileSync(css, 'utf8');
  const broken = src.replace('--chart-1: oklch(0.646 0.222 41.116);', '--chart-1: oklch(0.6 0.2 40);');
  assert.notEqual(broken, src, 'đột biến không áp được');
  writeFileSync(css, broken);
  const t = run(GEN_TOKENS, ['--root', dir, '--check']);
  assert.equal(t.code, 1);
  assert.match(t.stderr, /design\/tokens\.json lệch nguồn .*node scripts\/design-floor\/gen-tokens\.mjs/);
});

test('M2-AC-8 cặp đỏ: xoá một tệp ui/*.tsx → registry --check thoát 1', () => {
  const dir = copyRepo();
  writeBoth(dir);
  rmSync(path.join(dir, 'app/src/components/ui/kbd.tsx'));
  const r = run(GEN_REGISTRY, ['--root', dir, '--check']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /design\/component-registry\.json lệch nguồn .*gen-registry\.mjs/);
});

test('M2-AC-8 cặp đỏ: xoá tệp sinh → --check thoát 1 «chưa có»', () => {
  const dir = copyRepo();
  writeBoth(dir);
  rmSync(path.join(dir, TOKENS));
  rmSync(path.join(dir, REGISTRY));
  for (const [s, f] of [[GEN_TOKENS, TOKENS], [GEN_REGISTRY, REGISTRY]]) {
    const r = run(s, ['--root', dir, '--check']);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes(`${f} chưa có`), r.stderr);
  }
});

/** Khoá design_floor ở bất kỳ cấp thụt lề nào (không bắt khoá executors design_floor_gen/design_floor_fresh). */
const hasDesignFloorKey = (yaml) => /^\s*design_floor\s*:/m.test(yaml);

function bac(root) {
  const r = spawnSync(process.execPath, [requireKitFile(path.join(KIT, 'scripts/design-floor-bac.mjs')), '--root', root], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

test('M2-AC-10 config không khai design_floor; kit 2.35.0 vẫn đọc «bậc M1»', () => {
  assert.equal(hasDesignFloorKey(readFileSync(path.join(ROOT, '_acceptance/config.yaml'), 'utf8')), false);
  assert.match(bac(ROOT), /bậc M1/);
});

test('M2-AC-10 cặp đỏ: bản chép khai design_floor.tokens + registry → thước bắt khoá và kit đọc «bậc M2»', () => {
  const dir = copyRepo(['_acceptance/config.yaml']);
  writeBoth(dir);
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['add', '-A'], { cwd: dir });
  assert.match(bac(dir), /bậc M1/);
  appendFileSync(path.join(dir, '_acceptance/config.yaml'), `design_floor:\n  tokens: "${TOKENS}"\n  registry: "${REGISTRY}"\n`);
  assert.equal(hasDesignFloorKey(readFileSync(path.join(dir, '_acceptance/config.yaml'), 'utf8')), true);
  assert.match(bac(dir), /bậc M2/);
});

test('M2-AC-10 diff config.yaml so merge-base origin/main chỉ thêm hai dòng executors của hồ sơ', () => {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
  const base = git('merge-base', 'HEAD', 'origin/main');
  const lines = git('diff', '--unified=0', base, '--', '_acceptance/config.yaml').split('\n');
  const added = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  const removed = lines.filter((l) => l.startsWith('-') && !l.startsWith('---'));
  assert.deepEqual(removed, []);
  assert.equal(added.length, 2, added.join('\n'));
  assert.match(added[0], /^\+\s+design_floor_gen: /);
  assert.match(added[1], /^\+\s+design_floor_fresh: /);
});
