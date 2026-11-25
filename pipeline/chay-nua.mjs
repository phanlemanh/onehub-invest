// chay-nua.mjs — chạy một nửa bộ test pipeline theo test-nua.json (hàng tach-suite-pipeline).
//   node chay-nua.mjs a|b          chạy nửa đó, tuần tự (--test-concurrency=1), trên DB mà db-thu.sh --chay trỏ sẵn
//   node chay-nua.mjs a|b --liet   in danh sách tệp, không chạy
//   THOI_LUONG_TEP=<tệp> …         thêm bộ ghi thời lượng từng tệp (JSON mỗi dòng) để chia lại hai nửa
// CI=true (db-thu.sh --chay-trong đặt, hồ sơ db-thu-tach-khoi-cum-that): bỏ đúng ca pipeline của scripts/ci-bo-qua.json
// như job pipeline của CI — cùng hàm nodeOptions của scripts/lib/ci-can-du-lieu.mjs; danh sách lệch thì dừng gọi tên mục.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DANH_SACH, loiDanhSach, nodeOptions } from '../scripts/lib/ci-can-du-lieu.mjs';

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
let env = process.env;
if (process.env.CI === 'true') {
  const ds = JSON.parse(readFileSync(DANH_SACH, 'utf8')).pipeline;
  const loi = loiDanhSach(ds);
  if (loi.length) {
    for (const l of loi) console.error(`chay-nua: ci-bo-qua.json — ${l}`);
    process.exit(2);
  }
  env = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, nodeOptions(ds, true)].filter(Boolean).join(' ') };
  // --test-skip-pattern lọc ca khỏi lượt mà không in dòng SKIP — in danh sách để đầu ra tự chứng tập bỏ qua
  // (người đọc đối chiếu: không tên nào dưới đây có dòng ✔/✖ của lượt).
  const cuaNua = ds.filter((m) => chia[nua].some((t) => m.tep === `pipeline/${t}`));
  console.log(`chay-nua: bỏ qua ${cuaNua.length} ca của ci-bo-qua.json có tệp trong nửa ${nua} (CI=true)`);
  for (const m of cuaNua) console.log(`chay-nua: bỏ qua — ${m.tep} — ${m.ca}`);
}
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...bao, ...chia[nua]], { cwd: goc, stdio: 'inherit', env });
process.exit(r.status ?? 1);
