// Ca của bước chờ trong sao-luu.mjs (hồ sơ áp HT26 mục 3): nhật ký vừa xoay vòng, lượt cuối chết giữa chừng, lượt đang chạy quá trần.
import assert from "node:assert/strict";
import { test } from "node:test";
import { choRanh, trangThaiLuot } from "./cho-ranh.mjs";

const BD = "sync bắt đầu 2026-11-26T12:30:00.000Z";
const XONG = "sync xong 2026-11-26T12:50:00.000Z (run x): 1 dòng; leak gate PASS";

/** Đồng hồ giả: mỗi lần ngủ tiến thời gian; ghi số lần ngủ. */
function dongHo() {
  let t = Date.parse("2026-11-26T13:00:00Z");
  const h = { ngu: 0, bao: [] };
  h.bayGio = () => t;
  h.nguFn = async (ms) => { h.ngu++; t += ms; };
  h.baoFn = (s) => h.bao.push(s);
  return h;
}

test("CR-1: lượt cuối đã có dòng kết thúc → rảnh ngay, không ngủ", async () => {
  const h = dongHo();
  const tt = await choRanh({ docLog: () => `${BD}\n  WARN x\n${XONG}\n`, coTienTrinh: () => false, ngu: h.nguFn, bayGio: h.bayGio, bao: h.baoFn });
  assert.equal(tt.ranh, true);
  assert.equal(h.ngu, 0);
});

test("CR-2: nhật ký vừa xoay vòng (không còn «sync bắt đầu») — không ném TypeError; không tiến trình thì rảnh, có thì chờ", async () => {
  assert.deepEqual(trangThaiLuot("dòng lạ\n", false).ranh, true);
  assert.deepEqual(trangThaiLuot("", true).ranh, false);
  const h = dongHo();
  let lan = 0;
  const tt = await choRanh({ docLog: () => "", coTienTrinh: () => lan++ < 2, ngu: h.nguFn, bayGio: h.bayGio, bao: h.baoFn });
  assert.equal(tt.ranh, true);
  assert.equal(h.ngu, 2, "chờ đúng hai nhịp khi tiến trình còn sống");
  assert.ok(h.bao.every((s) => /xoay vòng/.test(s)));
});

test("CR-3: tệp nhật ký vắng (ENOENT) như nhật ký rỗng; lỗi đọc khác thì ném có tên", async () => {
  const h = dongHo();
  const vang = () => { throw Object.assign(new Error("không có"), { code: "ENOENT" }); };
  assert.equal((await choRanh({ docLog: vang, coTienTrinh: () => false, ngu: h.nguFn, bayGio: h.bayGio })).ranh, true);
  const hong = () => { throw Object.assign(new Error("EACCES"), { code: "EACCES" }); };
  await assert.rejects(choRanh({ docLog: hong, coTienTrinh: () => false, ngu: h.nguFn, bayGio: h.bayGio }), /không đọc được nhật ký sync/);
});

test("CR-4: lượt cuối chết giữa chừng (không dòng kết thúc, không tiến trình) → rảnh, nêu lý do; không chờ mãi", async () => {
  const tt = trangThaiLuot(`${XONG}\n${BD}\n  areas: 3\n`, false);
  assert.equal(tt.ranh, true);
  assert.match(tt.lyDo, /chết giữa chừng/);
});

test("CR-5: lượt đang chạy quá trần → ném lỗi có tên sau đúng số nhịp, không gọi tiếp", async () => {
  const h = dongHo();
  await assert.rejects(
    choRanh({ docLog: () => `${BD}\n`, coTienTrinh: () => true, ngu: h.nguFn, bayGio: h.bayGio, bao: h.baoFn, tranPhut: 40 }),
    /chờ 40\.0′ \(trần 40′\) mà lượt sync đang chạy — dừng, báo GS/,
  );
  assert.equal(h.ngu, 80, "40 phút / nhịp 30 s = 80 nhịp");
});

test("CR-6: đối chứng — bản cũ (chỉ đọc nhật ký) ném TypeError ở nhật ký xoay vòng và không tự dừng ở lượt chết", () => {
  // Bản cũ của vòng 1, nguyên khối phán: dong[iBd] với iBd = -1.
  const cu = (text) => {
    const dong = text.split("\n").filter((l) => /^sync bắt đầu|^sync xong|SYNC FAIL/.test(l));
    const iBd = dong.findLastIndex((l) => l.startsWith("sync bắt đầu"));
    const xong = dong.slice(iBd + 1).some((l) => /^sync xong|SYNC FAIL/.test(l));
    Date.parse(dong[iBd].split(" ")[3]);
    return xong;
  };
  assert.throws(() => cu(""), TypeError);
  assert.equal(cu(`${BD}\n`), false, "bản cũ coi lượt chết là đang chạy — chờ mãi");
});
