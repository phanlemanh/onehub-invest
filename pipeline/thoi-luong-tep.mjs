// thoi-luong-tep.mjs — bộ báo cáo node:test đo thời lượng tường của từng tệp khi chạy tuần tự (--test-concurrency=1):
// từ sự kiện cuối của tệp trước tới sự kiện cuối của tệp này, nên gồm cả nạp mô-đun và before/after. In JSON mỗi dòng
// {"tep":"scripts/x.test.mjs","giay":12.3,"ca":4,"hong":0}. Dùng qua chay-nua.mjs (THOI_LUONG_TEP) để chia lại hai nửa.
import { relative } from 'node:path';

export default async function* thoiLuongTep(nguon) {
  const tong = new Map();
  let mocCuoi = performance.now();
  for await (const { type, data } of nguon) {
    const bay = performance.now();
    if (data?.file) {
      const tep = relative(process.cwd(), data.file);
      let o = tong.get(tep);
      if (!o) { o = { tep, batDau: mocCuoi, ketThuc: bay, ca: 0, hong: 0 }; tong.set(tep, o); }
      o.ketThuc = bay;
      if ((type === 'test:pass' || type === 'test:fail') && data.nesting === 0) {
        o.ca += 1;
        if (type === 'test:fail') o.hong += 1;
      }
    }
    mocCuoi = bay;
  }
  const dong = [...tong.values()].map(({ tep, batDau, ketThuc, ca, hong }) =>
    ({ tep, giay: Math.round((ketThuc - batDau) / 100) / 10, ca, hong }));
  for (const o of dong.sort((x, y) => y.giay - x.giay)) yield `${JSON.stringify(o)}\n`;
}
