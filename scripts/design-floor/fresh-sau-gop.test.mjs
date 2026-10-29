// Ca M2-AC-10 không đỏ ở trạng thái sau gộp, ở nhánh chưa gộp có sửa config.yaml, và khi không có ref origin/main
// (hồ sơ m2-ac10-so-cap-co-dinh AC-2). Đo trên bản clone --shared của kho: cây đang kiểm không tái hiện được trạng thái
// sau gộp, vì trên nhánh chưa gộp ca merge-base cũ vẫn xanh.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { BEFORE_FIX, CONFIG_PAIR, HERE, ROOT, blobAt, git, requireCommit } from './test-helpers.mjs';

const OLD_DIFF_CASE = 'M2-AC-10 diff config.yaml so merge-base origin/main chỉ thêm hai dòng executors của hồ sơ';

function mustGit(args, cwd) {
  const r = git(args, cwd);
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

/** Bản clone mang mã scripts/design-floor của cây đang kiểm và một commit thêm khoá vào config.yaml. */
function cloneWithConfigKey() {
  requireCommit(CONFIG_PAIR);
  requireCommit(BEFORE_FIX);
  const dir = path.join(mkdtempSync(path.join(tmpdir(), 'sau-gop-')), 'kho');
  mustGit(['clone', '--shared', '-q', ROOT, dir], tmpdir());
  for (const f of readdirSync(HERE).filter((x) => x.endsWith('.mjs'))) cpSync(path.join(HERE, f), path.join(dir, 'scripts/design-floor', f));
  mustGit(['add', '-A', 'scripts/design-floor'], dir);
  mustGit(['-c', 'user.name=t', '-c', 'user.email=t@local.test', 'commit', '-q', '--allow-empty', '-m', 'mã design-floor đang kiểm'], dir);
  appendFileSync(path.join(dir, '_acceptance/config.yaml'), 'pr_khac_them_khoa: true\n');
  mustGit(['-c', 'user.name=t', '-c', 'user.email=t@local.test', 'commit', '-q', '-am', 'PR khác thêm khoá config'], dir);
  return dir;
}

/** Chạy fresh.test.mjs của bản clone; bỏ NODE_TEST_CONTEXT để node --test lồng không lặng lẽ bỏ chạy tệp. */
function runFresh(dir) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'scripts/design-floor/fresh.test.mjs'], { cwd: dir, env, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}
const notOkLines = (tap) => tap.split('\n').filter((l) => /^\s*not ok\b/.test(l));
const okLine = (tap, name) => tap.split('\n').some((l) => /^ok \d+ - /.test(l) && l.includes(name));
const NEW_DIFF_CASE = 'M2-AC-10 diff config.yaml cặp cố định 3b3a33e5^→3b3a33e5 chỉ thêm hai dòng executors';

const STATES = [
  ['(a) origin/main = HEAD — sau gộp', (dir) => mustGit(['update-ref', 'refs/remotes/origin/main', 'HEAD'], dir), true],
  ['(b) origin/main = cha commit thêm khoá — nhánh chưa gộp sửa config', (dir) => mustGit(['update-ref', 'refs/remotes/origin/main', 'HEAD^'], dir), true],
  ['(c) không có ref origin/main', (dir) => mustGit(['update-ref', '-d', 'refs/remotes/origin/main'], dir), false],
];

for (const [label, setRef, oldMustFail] of STATES) {
  test(`M2-AC-10 sau gộp ${label}: bản sửa thoát 0${oldMustFail ? '; bản 98757b5f đỏ đúng ca diff' : ''}`, () => {
    const dir = cloneWithConfigKey();
    setRef(dir);
    const fixed = runFresh(dir);
    assert.deepEqual(notOkLines(fixed.out), [], fixed.out);
    assert.equal(fixed.code, 0, fixed.out);
    assert.ok(okLine(fixed.out, NEW_DIFF_CASE), `bản sửa phải chạy thật ca diff: ${fixed.out.slice(0, 400)}`);
    if (!oldMustFail) return;
    writeFileSync(path.join(dir, 'scripts/design-floor/fresh.test.mjs'), blobAt(BEFORE_FIX, 'scripts/design-floor/fresh.test.mjs'));
    const old = runFresh(dir);
    assert.notEqual(old.code, 0, old.out);
    const bad = notOkLines(old.out);
    assert.equal(bad.length, 1, bad.join('\n'));
    assert.ok(bad[0].includes(OLD_DIFF_CASE), bad[0]);
    assert.ok(okLine(old.out, 'M2-AC-10 config không khai design_floor'), 'bản cũ phải chạy thật các ca còn lại');
  });
}
