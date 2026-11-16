// khong-dau-that.test.ts — KD-AC-6 phần (b) của hồ sơ duong-thang-n-khong-dau, dời khỏi suite chung (hồ sơ
// l2-bao-thu-doi-probe-that): khoá ô đường không đổi khi bỏ dấu, đo trên mọi street_raw của DB máy thu (chỉ SELECT).
// Chạy ở: executors.test.judge_entity_khong_dau (eval đã ký) và scripts/probe-du-lieu-that.sh (/ops-check mục B5).
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import * as that from "../src/agents/judge-entity.js";
import { goSaiDauTienTo, kiemAc6 } from "../tests/khong-dau-chung.js";
import { dbUrl, dotBienLuoi, giaDo, trongScript } from "./chung.js";

type Mod = typeof that;
// Hai dòng đưa dạng không dấu về dạng có dấu (cùng chỗ đột biến với tests/judge-entity-khong-dau.test.ts).
const DONG_THANG = '\n    .replace(/(^|\\s)thang(?=\\s+\\d)/gu, "$1tháng");';
const DONG_TRAN = '  if (/^(?:so|ngo|ngach|hem|kiet)$/.test(boDau(t))) t = "ngõ";\n';

test("KD-AC-6 có dấu = không dấu — dữ liệu thật (phần b)", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  giaDo("khong-dau-that");
  const c = new pg.Client({ connectionString: dbUrl() });
  await c.connect();
  try {
    const { rows } = await c.query<{ v: string }>("SELECT DISTINCT street_raw AS v FROM sale_offers WHERE street_raw IS NOT NULL");
    const tat = rows.map((r) => r.v);
    const saiDau = tat.filter(goSaiDauTienTo);
    const kq = kiemAc6(that, tat.filter((v) => !goSaiDauTienTo(v)));
    t.diagnostic(`KD-AC-6: ${kq.so} giá trị so · ${kq.loai} giá trị loại · ${kq.lech.length} lệch · ${saiDau.length} tiền tố gõ sai dấu đếm riêng`);
    assert.ok(kq.so >= 100, `KD-AC-6 bàn đo quá ít: ${kq.so} giá trị`);
    assert.deepEqual(kq.lech, [], "KD-AC-6 khoá đổi khi bỏ dấu trên dữ liệu thật");
    if (trongScript()) return;
    const khongTran = await dotBienLuoi<Mod>("judge-entity", "kd", "tran", (s) => s.replace(DONG_TRAN, ""));
    const khongThang = await dotBienLuoi<Mod>("judge-entity", "kd", "thang", (s) => s.replace(DONG_THANG, ";"));
    assert.ok(kiemAc6(khongTran, tat).lech.length > 0 || kiemAc6(khongThang, tat).lech.length > 0, "KD-AC-6 dữ liệu thật không phân biệt bản trước vòng");
  } finally {
    await c.end();
  }
});
