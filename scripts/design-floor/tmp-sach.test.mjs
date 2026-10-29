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
/** Tên ca thật (kể cả ca sinh từ bảng hay đặt tên bằng hằng) từ dòng TAP cấp ngoài cùng của một lượt chạy. */
const tapNames = (out) => out.split('\n').map((l) => /^(?:not )?ok \d+ - (.*?)(?: # (?:SKIP|TODO)\b.*)?$/.exec(l)?.[1]).filter(Boolean);
const NAMES = { now: null, before: null };
/** Dòng TAP `ok N - <tên>` cấp ngoài cùng, không mang # SKIP hay # TODO. */
const okReal = (out, name) => out.split('\n').some((l) => /^ok \d+ - /.test(l) && l.includes(name) && !/# (SKIP|TODO)/.test(l));

test('tmp-sạch: bộ test bản sửa để TMPDIR rỗng', { skip: NESTED ? 'lượt lồng — tránh đệ quy' : false }, () => {
  const logDir = tempDir('tmp-sach-log-');
  const log = path.join(logDir, 'tempdir.log');
  const files = readdirSync(HERE).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => `scripts/design-floor/${f}`);
  assert.ok(files.includes(`scripts/design-floor/${SELF}`), 'lượt đo phải chạy cả tệp đo');
  const r = runSuite(ROOT, files, { TMP_SACH_NESTED: '1', DESIGN_FLOOR_TMP_LOG: log });
  NAMES.now = tapNames(r.out);
  assert.deepEqual(tapLines(r.out, /^\s*not ok\b/), [], r.out.slice(-2000));
  assert.equal(r.code, 0, r.out.slice(-2000));
  for (const name of ['M2-AC-10 diff config.yaml cặp cố định', 'M2-AC-10 sau gộp (a)', 'tmp-sạch cặp đỏ']) {
    assert.ok(okReal(r.out, name), `thiếu dòng ok thật của «${name}»`);
  }
  const made = new Set(readFileSync(log, 'utf8').trim().split('\n').map((p) => path.basename(p).replace(/-[^-]+$/, '')));
  for (const prefix of SOURCES) assert.ok(made.has(prefix), `nhật ký tempDir không có ${prefix} — nguồn chưa được tạo trong lượt đo`);
  assert.deepEqual(leftoverPrefixes(r.tmp), [], 'TMPDIR còn thư mục sau lượt chạy');
});

/** Bản clone --shared của kho, đứng ở commit `sha` (cây cũ trọn vẹn, tự dọn qua tempDir). */
function cloneAt(sha) {
  requireCommit(sha);
  const dir = path.join(tempDir('tmp-sach-clone-'), 'kho');
  assert.equal(git(['clone', '--shared', '-q', ROOT, dir], path.dirname(dir)).status, 0);
  assert.equal(git(['checkout', '-q', sha], dir).status, 0);
  return dir;
}
const testFiles = (root) => readdirSync(path.join(root, 'scripts/design-floor')).filter((f) => f.endsWith('.test.mjs')).sort()
  .map((f) => `scripts/design-floor/${f}`);

test('tmp-sạch cặp đỏ: bản 89730e6b để rác ở đủ bốn nguồn', () => {
  const dir = cloneAt(BEFORE_TMP_FIX);
  const files = testFiles(dir);
  assert.ok(!files.includes(`scripts/design-floor/${SELF}`), 'bản cũ không được có tệp đo');
  const r = runSuite(dir, files);
  NAMES.before = tapNames(r.out);
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
/** Danh sách miễn ĐÓNG viết trước: đúng hai cặp (tệp, vùng). */
const MIEN = ['test-helpers.mjs:TEMPDIR-MIEN', 'tmp-sach.test.mjs:RAW-MKDTEMP-DOI-CHUNG'];
/** Lời gọi mkdtemp trần ngoài vùng miễn và các vùng miễn gặp được: { hits: ['<tệp>:<dòng>'], regions: ['<tệp>:<vùng>'] }. */
export function rawMkdtemp(sources) {
  const hits = [];
  const regions = [];
  for (const { name, text } of sources) {
    let open = null;
    text.split('\n').forEach((line, i) => {
      const start = REGION.exec(line);
      if (start) { open = start[1]; regions.push(`${name}:${open}`); return; }
      if (open && line.trim() === `// ${open}>>>`) { open = null; return; }
      if (!open && RAW_CALL.test(line)) hits.push(`${name}:${i + 1}`);
    });
    assert.equal(open, null, `${name}: vùng miễn ${open} không đóng`);
  }
  return { hits, regions };
}
/** Mọi chỗ lệch so với danh sách miễn đóng: lời gọi trần, vùng miễn thừa, vùng miễn thiếu. */
export function mienLech({ hits, regions }) {
  return [...hits.map((h) => `gọi trần ${h}`),
    ...regions.filter((r) => !MIEN.includes(r)).map((r) => `vùng miễn thừa ${r}`),
    ...MIEN.filter((m) => regions.filter((r) => r === m).length !== 1).map((m) => `vùng miễn thiếu hoặc lặp ${m}`)];
}
const designFloorSources = () => readdirSync(HERE).filter((f) => f.endsWith('.mjs')).sort()
  .map((name) => ({ name, text: readFileSync(path.join(HERE, name), 'utf8') }));

test('tmp-sạch: không mkdtempSync trần ngoài hai vùng miễn', () => {
  const sources = designFloorSources();
  assert.deepEqual(rawMkdtemp(sources).regions.sort(), [...MIEN].sort());
  assert.deepEqual(mienLech(rawMkdtemp(sources)), []);
  const edit = (name, fn) => sources.map((s) => (s.name === name ? { name, text: fn(s.text.split('\n')).join('\n') } : s));
  const call = `const leak = ${'mkdtemp'}Sync('x');`;
  const insertAt = (at, ...rows) => (lines) => { lines.splice(at - 1, 0, ...rows); return lines; };
  assert.deepEqual(mienLech(rawMkdtemp(edit('reuse-plan.test.mjs', insertAt(3, call)))), ['gọi trần reuse-plan.test.mjs:3']);
  assert.deepEqual(mienLech(rawMkdtemp(edit(SELF, insertAt(12, call)))), [`gọi trần ${SELF}:12`]);
  // vùng miễn giả quanh một lời gọi trần ở tệp khác: hits rỗng nhưng thước gọi tên vùng thừa
  assert.deepEqual(mienLech(rawMkdtemp(edit('reuse-plan.test.mjs', insertAt(3, '// <<<TEMPDIR-MIEN', call, '// TEMPDIR-MIEN>>>')))),
    ['vùng miễn thừa reuse-plan.test.mjs:TEMPDIR-MIEN']);
  // bỏ dấu mốc của vùng đối chứng: lộ lời gọi trần và thiếu vùng
  const lechBo = mienLech(rawMkdtemp(edit(SELF, (lines) => lines.filter((l) => !/RAW-MKDTEMP-DOI-CHUNG/.test(l) || /^const |MIEN = /.test(l.trim())))));
  assert.ok(lechBo.some((x) => x.startsWith(`gọi trần ${SELF}:`)), lechBo.join(' | '));
  assert.ok(lechBo.includes(`vùng miễn thiếu hoặc lặp ${SELF}:RAW-MKDTEMP-DOI-CHUNG`), lechBo.join(' | '));
});

const lostCases = (before, now) => before.filter((n) => !new Set(now).has(n));

test('tmp-sạch: không hạ thước — mọi ca của bản 89730e6b còn', { skip: NESTED ? 'lượt lồng — cần tên từ ca AC-1' : false }, () => {
  const { before, now } = NAMES;
  assert.ok(before && now, 'thiếu tên ca: ca AC-1 hoặc AC-2 chưa chạy trước ca này');
  assert.equal(before.length, 49, `bản 89730e6b có 49 ca (đếm lúc viết thước): đếm được ${before.length}`);
  assert.ok(before.includes('M2-AC-10 diff config.yaml cặp cố định 3b3a33e5^→3b3a33e5 chỉ thêm hai dòng executors'), 'ca đặt tên bằng hằng phải có');
  assert.ok(before.filter((n) => n.startsWith('M2-AC-6 ')).length >= 5, 'ca sinh từ bảng phải được liệt kê từng ca');
  assert.deepEqual(lostCases(before, now), []);
  const dropped = before.find((n) => n.startsWith('M2-AC-6 ') && n !== before[0]);
  assert.deepEqual(lostCases(before, now.filter((n) => n !== dropped)), [dropped], 'thước phải gọi tên ca sinh từ bảng bị mất');
});
