// Bộ test design-floor không để rác trong TMPDIR (hồ sơ don-clone-tam-design-floor AC-1…AC-5): chạy cả bộ dưới một
// TMPDIR rỗng mới rồi đòi nó rỗng sau khi thoát; bản 89730e6b trên bản clone là chiều đỏ của cùng thước.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { BEFORE_TMP_FIX, HERE, ROOT, blobAt, git, requireCommit, tempDir } from './test-helpers.mjs';

const NESTED = Boolean(process.env.TMP_SACH_NESTED);
const SOURCES = ['cap-config', 'design-floor', 'reuse-plan', 'sau-gop'];
const SELF = 'tmp-sach.test.mjs';

/** Tiền tố (bỏ đuôi ngẫu nhiên của mkdtemp) của mọi mục còn trong một thư mục, sắp tăng. */
export function leftoverPrefixes(dir) {
  return [...new Set(readdirSync(dir).map((n) => n.replace(/-[^-]+$/, '')))].sort();
}

/** Chạy node --test trên các tệp trong `cwd` với TMPDIR riêng; bỏ NODE_TEST_CONTEXT để lượt lồng chạy thật. */
function runSuite(cwd, files, extraEnv = {}) {
  const tmp = tempDir('tmp-sach-tmp-');
  const env = { ...process.env, TMPDIR: tmp, ...extraEnv };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd, env, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}`, tmp };
}
const tapLines = (out, re) => out.split('\n').filter((l) => re.test(l));
/** Dòng TAP `ok N - <tên>` cấp ngoài cùng, không mang # SKIP hay # TODO. */
const okReal = (out, name) => out.split('\n').some((l) => /^ok \d+ - /.test(l) && l.includes(name) && !/# (SKIP|TODO)/.test(l));

test('tmp-sạch: bộ test bản sửa để TMPDIR rỗng', { skip: NESTED ? 'lượt lồng — tránh đệ quy' : false }, () => {
  const logDir = tempDir('tmp-sach-log-');
  const log = path.join(logDir, 'tempdir.log');
  const files = readdirSync(HERE).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => `scripts/design-floor/${f}`);
  assert.ok(files.includes(`scripts/design-floor/${SELF}`), 'lượt đo phải chạy cả tệp đo');
  const r = runSuite(ROOT, files, { TMP_SACH_NESTED: '1', DESIGN_FLOOR_TMP_LOG: log });
  assert.deepEqual(tapLines(r.out, /^\s*not ok\b/), [], r.out.slice(-2000));
  assert.equal(r.code, 0, r.out.slice(-2000));
  for (const name of ['M2-AC-10 diff config.yaml cặp cố định', 'M2-AC-10 sau gộp (a)', 'tmp-sạch cặp đỏ']) {
    assert.ok(okReal(r.out, name), `thiếu dòng ok thật của «${name}»`);
  }
  const made = new Set(readFileSync(log, 'utf8').trim().split('\n').map((p) => path.basename(p).replace(/-[^-]+$/, '')));
  for (const prefix of SOURCES) assert.ok(made.has(prefix), `nhật ký tempDir không có ${prefix} — nguồn chưa được tạo trong lượt đo`);
  assert.deepEqual(leftoverPrefixes(r.tmp), [], 'TMPDIR còn thư mục sau lượt chạy');
});

test('tmp-sạch cặp đỏ: bản 89730e6b để rác ở đủ bốn nguồn', () => {
  requireCommit(BEFORE_TMP_FIX);
  const dir = path.join(tempDir('tmp-sach-clone-'), 'kho');
  assert.equal(git(['clone', '--shared', '-q', ROOT, dir], path.dirname(dir)).status, 0);
  assert.equal(git(['checkout', '-q', BEFORE_TMP_FIX], dir).status, 0);
  const files = readdirSync(path.join(dir, 'scripts/design-floor')).filter((f) => f.endsWith('.test.mjs')).sort()
    .map((f) => `scripts/design-floor/${f}`);
  assert.ok(!files.includes(`scripts/design-floor/${SELF}`), 'bản cũ không được có tệp đo');
  const r = runSuite(dir, files);
  const left = leftoverPrefixes(r.tmp);
  for (const prefix of SOURCES) assert.ok(left.includes(prefix), `bản cũ phải để rác ${prefix}; còn: ${left.join(', ')}`);
});

const HELPERS = pathToFileURL(path.join(HERE, 'test-helpers.mjs')).href;
function runThrowing(body) {
  const tmp = tempDir('tmp-sach-nem-');
  const env = { ...process.env, TMPDIR: tmp };
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', body], { env, encoding: 'utf8' });
  return { code: r.status, dir: r.stdout.trim().split('\n')[0] };
}

test('tmp-sạch: ném giữa chừng vẫn dọn; mkdtemp trần thì còn', () => {
  const viaHelper = runThrowing(`import { tempDir } from '${HELPERS}';
const d = tempDir('nem-'); console.log(d); throw new Error('ca đỏ giữa chừng');`);
  assert.notEqual(viaHelper.code, 0);
  assert.ok(viaHelper.dir.includes('nem-'), viaHelper.dir);
  assert.equal(existsSync(viaHelper.dir), false, 'tempDir phải dọn khi tiến trình ném');
  // <<<RAW-MKDTEMP-DOI-CHUNG
  const raw = runThrowing(`import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import path from 'node:path';
const d = mkdtempSync(path.join(tmpdir(), 'nem-')); console.log(d); throw new Error('ca đỏ giữa chừng');`);
  // RAW-MKDTEMP-DOI-CHUNG>>>
  assert.notEqual(raw.code, 0);
  assert.equal(existsSync(raw.dir), true, 'đối chứng: mkdtemp trần phải còn');
  rmSync(raw.dir, { recursive: true, force: true });
});

const RAW_CALL = /mkdtemp[S]ync\(/;
const REGION = /^\s*\/\/ <<<(TEMPDIR-MIEN|RAW-MKDTEMP-DOI-CHUNG)\s*$/;
/** Lời gọi mkdtemp trần ngoài vùng miễn đóng; trả { hits: ['<tệp>:<dòng>'], regions: số vùng miễn }. */
export function rawMkdtemp(sources) {
  const hits = [];
  let regions = 0;
  for (const { name, text } of sources) {
    let open = null;
    text.split('\n').forEach((line, i) => {
      const start = REGION.exec(line);
      if (start) { open = start[1]; regions++; return; }
      if (open && line.trim() === `// ${open}>>>`) { open = null; return; }
      if (!open && RAW_CALL.test(line)) hits.push(`${name}:${i + 1}`);
    });
    assert.equal(open, null, `${name}: vùng miễn ${open} không đóng`);
  }
  return { hits, regions };
}
const designFloorSources = () => readdirSync(HERE).filter((f) => f.endsWith('.mjs')).sort()
  .map((name) => ({ name, text: readFileSync(path.join(HERE, name), 'utf8') }));

test('tmp-sạch: không mkdtempSync trần ngoài hai vùng miễn', () => {
  const sources = designFloorSources();
  assert.deepEqual(rawMkdtemp(sources), { hits: [], regions: 2 });
  const inject = (name, at) => sources.map((s) => {
    if (s.name !== name) return s;
    const lines = s.text.split('\n');
    lines.splice(at - 1, 0, `const leak = ${'mkdtemp'}Sync('x');`);
    return { name, text: lines.join('\n') };
  });
  assert.deepEqual(rawMkdtemp(inject('reuse-plan.test.mjs', 3)).hits, ['reuse-plan.test.mjs:3']);
  assert.deepEqual(rawMkdtemp(inject(SELF, 12)).hits, [`${SELF}:12`]);
});

const caseNames = (src) => [...src.matchAll(/\btest\(\s*(['`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);
const lostCases = (before, now) => before.filter((n) => !new Set(now).has(n));

test('tmp-sạch: không hạ thước — mọi ca của bản 89730e6b còn', () => {
  const r = git(['ls-tree', '--name-only', `${BEFORE_TMP_FIX}:scripts/design-floor`]);
  assert.equal(r.status, 0, r.stderr);
  const oldFiles = r.stdout.trim().split('\n').filter((f) => f.endsWith('.test.mjs'));
  const before = oldFiles.flatMap((f) => caseNames(blobAt(BEFORE_TMP_FIX, `scripts/design-floor/${f}`)));
  assert.ok(before.length >= 25, `đếm ca bản trước: ${before.length}`);
  const now = designFloorSources().filter((s) => s.name.endsWith('.test.mjs')).flatMap((s) => caseNames(s.text));
  assert.deepEqual(lostCases(before, now), []);
  assert.deepEqual(lostCases(before, now.filter((n) => n !== before[0])), [before[0]], 'thước phải gọi tên ca bị mất');
});
