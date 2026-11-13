// chia-nua.test.mjs — hàng tach-suite-pipeline: hai nửa test:a, test:b (test-nua.json) phủ đúng tập tệp `npm test` chạy,
// không sót, không trùng; mỗi nửa một DB thử riêng. Thêm tệp test mới mà quên xếp nửa thì ca này đỏ. Hàm thuần, không DB.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const goc = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(goc, 'package.json'), 'utf8'));
const chia = JSON.parse(readFileSync(join(goc, 'test-nua.json'), 'utf8'));

// Mẫu tệp của `npm test`: các đối số trong nháy đơn sau --test-concurrency=1 — rút từ chính lệnh, không chép tay.
function tepCuaNpmTest() {
  const mau = [...pkg.scripts.test.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(mau.length > 0, 'không rút được mẫu tệp từ scripts.test');
  return new Set(mau.flatMap((m) => globSync(m, { cwd: goc })));
}

test('CN-1 hợp hai nửa bằng đúng tập tệp npm test chạy, không sót, không trùng', () => {
  const a = chia.a, b = chia.b;
  assert.ok(a.length > 0 && b.length > 0, 'nửa rỗng');
  const tatCa = [...a, ...b];
  const trung = tatCa.filter((f, i) => tatCa.indexOf(f) !== i);
  assert.deepEqual(trung, [], `tệp xếp hai lần: ${trung.join(', ')}`);
  const can = tepCuaNpmTest();
  const sot = [...can].filter((f) => !tatCa.includes(f)).sort();
  const thua = tatCa.filter((f) => !can.has(f)).sort();
  assert.deepEqual(sot, [], `tệp npm test chạy mà chưa xếp vào nửa nào (thêm vào test-nua.json): ${sot.join(', ')}`);
  assert.deepEqual(thua, [], `tệp trong test-nua.json mà npm test không chạy: ${thua.join(', ')}`);
});

test('CN-2 mỗi nửa chạy qua db-thu.sh --chay trên DB thử tên riêng, khác DB của npm test', () => {
  const db = (lenh) => lenh.match(/db-thu\.sh (oneinvest_suite_[a-z0-9_]+) --chay/)?.[1];
  const ten = ['test', 'test:a', 'test:b'].map((k) => db(pkg.scripts[k] ?? ''));
  ten.forEach((t, i) => assert.ok(t, `scripts.${['test', 'test:a', 'test:b'][i]} không chạy qua db-thu.sh --chay`));
  assert.equal(new Set(ten).size, 3, `trùng tên DB thử: ${ten.join(', ')}`);
  assert.match(pkg.scripts['test:a'], /chay-nua\.mjs a$/);
  assert.match(pkg.scripts['test:b'], /chay-nua\.mjs b$/);
});
