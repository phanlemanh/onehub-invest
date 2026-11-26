// chay-that.mjs — suite pipeline_that (hồ sơ db-thu-tach-khoi-cum-that AC-3): chạy ĐÚNG các ca pipeline của
// scripts/ci-bo-qua.json (ca cần dữ liệu thật), không ca nào khác, trên DB mà db-thu.sh --chay trỏ sẵn (bản chép dữ liệu thật).
// Mỗi ca một --test-name-pattern khớp nguyên tên; chỉ nạp các tệp có ca trong danh sách. Mục lệch (tệp vắng, tên ca không còn,
// ca bị cấm) → thoát 2 gọi tên mục, không bỏ qua lặng.
//   node chay-that.mjs              chạy
//   node chay-that.mjs --liet       in tệp và mẫu tên, không chạy
//   node chay-that.mjs --danh-sach <json> --goc <thư mục>   (chỉ để test) danh sách và gốc khác
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DANH_SACH, loiDanhSach } from '../scripts/lib/ci-can-du-lieu.mjs';

const pipe = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const goc = resolve(arg('--goc') ?? join(pipe, '..'));
const ds = JSON.parse(readFileSync(arg('--danh-sach') ?? DANH_SACH, 'utf8')).pipeline ?? [];
const loi = loiDanhSach(ds, goc);
if (loi.length) {
  for (const l of loi) console.error(`chay-that: mục lệch của ci-bo-qua.json — ${l}`);
  process.exit(2);
}
if (!ds.length) { console.error('chay-that: danh sách ca pipeline rỗng'); process.exit(2); }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mau = ds.map((m) => `--test-name-pattern=^${esc(m.ca)}$`);
const tep = [...new Set(ds.map((m) => join(goc, m.tep)))];
if (process.argv.includes('--liet')) {
  console.log(tep.map((t) => relative(goc, t)).join('\n'));
  console.log(ds.map((m) => m.ca).join('\n'));
  process.exit(0);
}
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...mau, ...tep], { cwd: pipe, stdio: 'inherit' });
process.exit(r.status ?? 1);
