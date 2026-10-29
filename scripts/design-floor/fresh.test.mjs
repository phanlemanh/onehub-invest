// Độ tươi của hai tệp sinh và bậc M1 giữ nguyên (hồ sơ dung-m2-song-song AC-8, AC-10; ca diff so cặp cố định —
// hồ sơ m2-ac10-so-cap-co-dinh).
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  BEFORE_FIX, CONFIG_PAIR, GEN_REGISTRY, GEN_TOKENS, HERE, KIT, ROOT, blobAt, copyRepo, kiemCapM2, requireKitFile, run,
} from './test-helpers.mjs';

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

const DIFF_CASE = 'M2-AC-10 diff config.yaml cặp cố định 3b3a33e5^→3b3a33e5 chỉ thêm hai dòng executors';
const OLD_DIFF_CASE = 'M2-AC-10 diff config.yaml so merge-base origin/main chỉ thêm hai dòng executors của hồ sơ';
const CONFIG = '_acceptance/config.yaml';

test(DIFF_CASE, () => {
  const { added } = kiemCapM2(blobAt(`${CONFIG_PAIR}^`, CONFIG), blobAt(CONFIG_PAIR, CONFIG));
  assert.match(added[0], /^\+\s+design_floor_gen: /);
  assert.match(added[1], /^\+\s+design_floor_fresh: /);
});

test('M2-AC-10 hàm kiểm cặp: cặp thật qua; bản sau thêm hay bớt một dòng → lỗi nêu đúng dòng', () => {
  const before = blobAt(`${CONFIG_PAIR}^`, CONFIG);
  const after = blobAt(CONFIG_PAIR, CONFIG);
  const ok = kiemCapM2(before, after);
  assert.deepEqual(ok.removed, []);
  assert.equal(ok.added.length, 2);
  const extra = after.replace(/^(\s+design_floor_gen: .*)$/m, '$1\n    x: 1');
  assert.notEqual(extra, after, 'đột biến thêm dòng không áp được');
  assert.throws(() => kiemCapM2(before, extra), (e) => e.message.includes('thiếu: không; thừa: +    x: 1'));
  for (const [key, other] of [['design_floor_fresh', 'design_floor_gen'], ['design_floor_gen', 'design_floor_fresh']]) {
    const dropped = after.replace(new RegExp(`^\\s+${key}: .*\\n`, 'm'), '');
    assert.notEqual(dropped, after, `đột biến bớt ${key} không áp được`);
    assert.throws(() => kiemCapM2(before, dropped), (e) => e.message.includes(`thiếu: ${key};`) && !e.message.includes(`thiếu: ${other}`), key);
  }
  const firstLine = after.split('\n')[0];
  const lost = after.slice(firstLine.length + 1);
  assert.ok(firstLine && before.startsWith(`${firstLine}\n`), 'dòng đầu phải là dòng có sẵn ở bản trước');
  assert.throws(() => kiemCapM2(before, lost), (e) => e.message === `cặp config bớt dòng: -${firstLine}`);
});

test('M2-AC-10 thiếu commit ghim: blobAt đỏ có tên và gợi ý; commit thật thì trả blob', () => {
  const zero = '0'.repeat(40);
  assert.throws(() => blobAt(zero, CONFIG), (e) => e.message.includes(`thiếu commit ghim ${zero}`) && e.message.includes('git fetch --unshallow'));
  assert.throws(() => blobAt(`${zero}^`, CONFIG), new RegExp(`thiếu commit ghim ${zero}`));
  assert.match(blobAt(CONFIG_PAIR, CONFIG), /design_floor_gen/);
});

/** Thân một ca `test('<tên>'` hay `test(<HẰNG>` tới dòng `});` đóng đầu tiên ở cột 0. */
function caseBody(src, head) {
  const i = src.indexOf(head);
  assert.ok(i >= 0, `không thấy ca ${head}`);
  return src.slice(i, src.indexOf('\n});\n', i) + 4);
}

test('M2-AC-10 ca diff không đọc cây hay merge-base: thân ca chỉ gọi kiemCapM2 trên hai blob ghim', () => {
  const body = caseBody(readFileSync(new URL(import.meta.url), 'utf8'), 'test(DIFF_CASE');
  for (const banned of ['merge-base', 'origin/main', 'readFileSync', 'ROOT']) assert.ok(!body.includes(banned), banned);
  assert.match(body, /kiemCapM2\(blobAt\(`\$\{CONFIG_PAIR\}\^`, CONFIG\), blobAt\(CONFIG_PAIR, CONFIG\)\)/);
});

const TEST_FILES = ['fresh.test.mjs', 'gen-tokens.test.mjs', 'gen-registry.test.mjs', 'reuse-plan.test.mjs'];
/** Tên ca thô (giữ nguyên `${…}` của tên động) của mọi lời gọi test( trong một tệp. */
const caseNames = (src) => [...src.matchAll(/\btest\(\s*(['`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);
/** Tên ca ở bản trước sửa (trừ ca diff được đổi) mà tập hiện tại không còn. */
function lostCases(beforeNames, currentNames) {
  const now = new Set(currentNames);
  return beforeNames.filter((n) => n !== OLD_DIFF_CASE && !now.has(n));
}

test('M2-AC-10 không hạ thước: mọi ca của bản 98757b5f còn (trừ đúng ca diff đổi tên), hai ca M2-AC-10 còn lại không đổi thân', () => {
  const before = TEST_FILES.flatMap((f) => caseNames(blobAt(BEFORE_FIX, `scripts/design-floor/${f}`)));
  assert.ok(before.includes(OLD_DIFF_CASE), 'bản trước sửa phải có ca diff cũ');
  assert.ok(before.length >= 20, `đếm ca bản trước: ${before.length}`);
  const current = readdirSync(HERE).filter((f) => f.endsWith('.test.mjs'))
    .flatMap((f) => caseNames(readFileSync(path.join(HERE, f), 'utf8')));
  assert.deepEqual(lostCases(before, current), []);
  assert.ok(!current.includes(OLD_DIFF_CASE));
  const oldSrc = blobAt(BEFORE_FIX, 'scripts/design-floor/fresh.test.mjs');
  const nowSrc = readFileSync(new URL(import.meta.url), 'utf8');
  for (const name of ['M2-AC-10 config không khai design_floor', 'M2-AC-10 cặp đỏ: bản chép khai design_floor']) {
    assert.equal(caseBody(nowSrc, `test('${name}`), caseBody(oldSrc, `test('${name}`), name);
  }
  const drop = current.filter((n) => n !== before[0]);
  assert.deepEqual(lostCases(before, drop), [before[0]], 'thước phải gọi tên ca bị mất');
});
