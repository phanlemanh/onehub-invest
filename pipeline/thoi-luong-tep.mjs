// thoi-luong-tep.mjs — bộ báo cáo node:test cộng thời lượng các ca cấp cao nhất theo từng tệp, in JSON mỗi dòng
// {"tep":"scripts/x.test.mjs","giay":12.3,"ca":4,"hong":0}. Dùng qua chay-nua.mjs (THOI_LUONG_TEP) để chia lại hai nửa.
// Giới hạn: sự kiện của tệp con tới bộ báo cáo dồn cục, nên không đo được thời gian tường; số này không gồm nạp mô-đun
// và before/after cấp tệp (đo 13/11: tổng các tệp thấp hơn thời gian tường vài phần trăm).
import { relative } from 'node:path';

export default async function* thoiLuongTep(nguon) {
  const tong = new Map();
  for await (const { type, data } of nguon) {
    if ((type !== 'test:pass' && type !== 'test:fail') || data.nesting !== 0 || !data.file) continue;
    const tep = relative(process.cwd(), data.file);
    const o = tong.get(tep) ?? { tep, giay: 0, ca: 0, hong: 0 };
    o.giay += (data.details?.duration_ms ?? 0) / 1000;
    o.ca += 1;
    if (type === 'test:fail') o.hong += 1;
    tong.set(tep, o);
  }
  for (const o of [...tong.values()].sort((x, y) => y.giay - x.giay)) {
    yield `${JSON.stringify({ ...o, giay: Math.round(o.giay * 10) / 10 })}\n`;
  }
}
