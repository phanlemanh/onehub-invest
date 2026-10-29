// Dùng chung cho test của scripts/design-floor (hồ sơ dung-m2-song-song): gốc kho suy từ vị trí tệp, bản chép kho tạm,
// đường tới bản gói acceptance-gate 2.35.0, ma trận biến thể viết tay.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync } from 'node:fs';
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
