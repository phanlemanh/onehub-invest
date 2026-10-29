// Dùng chung cho test của scripts/design-floor (hồ sơ dung-m2-song-song): gốc kho suy từ vị trí tệp, bản chép kho tạm,
// đường tới bản gói acceptance-gate 2.35.0, ma trận biến thể viết tay.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');

/** Gói acceptance-gate mà ý định hàng nêu tên (2.35.0); ghi đè bằng ACCEPTANCE_GATE_KIT. */
export const KIT = process.env.ACCEPTANCE_GATE_KIT
  || path.join(homedir(), '.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.35.0');
/** Bản gói Design OS của kit — cùng biến môi trường mà design-floor-s1.mjs của kit đọc. */
export const UI = process.env.DESIGN_FLOOR_UI || path.join(KIT, 'design-floor/dist/ui.mjs');

export function requireKitFile(file) {
  if (!existsSync(file)) {
    throw new Error(`không thấy ${file} — đặt DESIGN_FLOOR_UI / ACCEPTANCE_GATE_KIT trỏ bản acceptance-gate 2.35.0`);
  }
  return file;
}

/** Chép các nguồn của hai lệnh sinh (và tệp tuỳ chọn khác) sang một gốc tạm. */
export function copyRepo(extra = []) {
  const dir = mkdtempSync(path.join(tmpdir(), 'design-floor-'));
  for (const rel of ['app/src/app/globals.css', 'app/src/components/ui', 'app/src/components/reui',
    '.claude/skills/onehub-ui/catalog.md', ...extra]) {
    cpSync(path.join(ROOT, rel), path.join(dir, rel), { recursive: true });
  }
  return dir;
}

export function run(script, args, cwd = ROOT) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

// Cặp commit cố định của ca M2-AC-10 (hồ sơ m2-ac10-so-cap-co-dinh): 3b3a33e5 là commit duy nhất của dung-m2-song-song
// đổi _acceptance/config.yaml. So cặp blob này thay vì merge-base — merge-base đỏ sau khi gộp và trên nhánh sửa config.
export const CONFIG_PAIR = '3b3a33e53671584edebf43a8c431a17507583954';
/** Main ngay sau PR #165 — bản test trước khi sửa ca M2-AC-10. */
export const BEFORE_FIX = '98757b5ff29c1801f5af25d07afd63e31a62d521';
export const M2_EXECUTOR_KEYS = ['design_floor_gen', 'design_floor_fresh'];

export function git(args, cwd = ROOT) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

/** Commit ghim phải có trong kho; kho tải nông thì đỏ có tên thay vì lỗi git thô hay xanh lặng. */
export function requireCommit(sha, cwd = ROOT) {
  if (git(['cat-file', '-e', `${sha}^{commit}`], cwd).status !== 0) {
    throw new Error(`thiếu commit ghim ${sha} — kho tải nông? chạy git fetch --unshallow`);
  }
}

/** Blob của `rel` ở commit `rev` (`<sha>` hay `<sha>^`); kiểm commit ghim trước khi đọc. */
export function blobAt(rev, rel, cwd = ROOT) {
  requireCommit(rev.replace(/\^+$/, ''), cwd);
  const r = git(['show', `${rev}:${rel}`], cwd);
  if (r.status !== 0) throw new Error(`git show ${rev}:${rel} lỗi: ${r.stderr.trim()}`);
  return r.stdout;
}

/** Dòng thêm/bớt giữa hai bản văn (git diff --no-index, bỏ dòng tiêu đề diff). */
export function soCapConfig(before, after) {
  const dir = mkdtempSync(path.join(tmpdir(), 'cap-config-'));
  writeFileSync(path.join(dir, 'before'), before);
  writeFileSync(path.join(dir, 'after'), after);
  const r = git(['diff', '--no-index', '--unified=0', 'before', 'after'], dir);
  if (r.status !== 0 && r.status !== 1) throw new Error(`git diff --no-index lỗi: ${r.stderr.trim()}`);
  const lines = r.stdout.split('\n');
  return {
    added: lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')),
    removed: lines.filter((l) => l.startsWith('-') && !l.startsWith('---')),
  };
}

/** Bất biến của commit 3b3a33e5: 0 dòng bớt, đúng hai dòng thêm design_floor_gen rồi design_floor_fresh; lệch thì ném lỗi nêu dòng. */
export function kiemCapM2(before, after) {
  const { added, removed } = soCapConfig(before, after);
  if (removed.length) throw new Error(`cặp config bớt dòng: ${removed.join(' | ')}`);
  const keys = added.map((l) => /^\+\s+([a-z_]+):/.exec(l)?.[1] ?? null);
  if (added.length !== 2 || keys[0] !== M2_EXECUTOR_KEYS[0] || keys[1] !== M2_EXECUTOR_KEYS[1]) {
    throw new Error(`cặp config thêm ${added.length} dòng, chờ đúng ${M2_EXECUTOR_KEYS.join(', ')}: ${added.join(' | ')}`);
  }
  return { added, removed };
}

export const GEN_TOKENS = path.join(HERE, 'gen-tokens.mjs');
export const GEN_REGISTRY = path.join(HERE, 'gen-registry.mjs');

// Ma trận viết tay — đọc từ mã nguồn của từng tệp, không từ lệnh sinh.
export const VARIANT_MATRIX = {
  'reui/badge': [
    ...['default', 'outline', 'secondary', 'info', 'success', 'warning', 'destructive', 'focus', 'invert',
      'primary-light', 'warning-light', 'success-light', 'info-light', 'destructive-light', 'invert-light', 'focus-light',
      'primary-outline', 'warning-outline', 'success-outline', 'info-outline', 'destructive-outline', 'invert-outline',
      'focus-outline'].map((v) => `variant=${v}`),
    ...['xs', 'sm', 'default', 'lg', 'xl'].map((v) => `size=${v}`),
    'radius=default', 'radius=full',
  ],
  'ui/button': [
    ...['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'].map((v) => `variant=${v}`),
    ...['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'].map((v) => `size=${v}`),
  ],
  'ui/item': [
    ...['default', 'outline', 'muted', 'icon', 'image'].map((v) => `variant=${v}`),
    ...['default', 'sm', 'xs'].map((v) => `size=${v}`),
  ],
  'reui/filters': ['size=default', 'size=sm'],
};
