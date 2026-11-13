// chay-nua.mjs — chạy một nửa bộ test pipeline theo test-nua.json (hàng tach-suite-pipeline).
//   node chay-nua.mjs a|b          chạy nửa đó, tuần tự (--test-concurrency=1), trên DB mà db-thu.sh --chay trỏ sẵn
//   node chay-nua.mjs a|b --liet   in danh sách tệp, không chạy
//   THOI_LUONG_TEP=<tệp> …         thêm bộ ghi thời lượng từng tệp (JSON mỗi dòng) để chia lại hai nửa
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const goc = dirname(fileURLToPath(import.meta.url));
const nua = process.argv[2];
const chia = JSON.parse(readFileSync(join(goc, 'test-nua.json'), 'utf8'));
if (!Array.isArray(chia[nua])) {
  console.error(`chay-nua: nửa phải là ${Object.keys(chia).filter((k) => !k.startsWith('_')).join('|')}`);
  process.exit(2);
}
if (process.argv.includes('--liet')) {
  console.log(chia[nua].join('\n'));
  process.exit(0);
}
const bao = process.env.THOI_LUONG_TEP
  ? ['--test-reporter=spec', '--test-reporter-destination=stdout',
     `--test-reporter=${join(goc, 'thoi-luong-tep.mjs')}`, `--test-reporter-destination=${process.env.THOI_LUONG_TEP}`]
  : [];
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...bao, ...chia[nua]], { cwd: goc, stdio: 'inherit' });
process.exit(r.status ?? 1);
