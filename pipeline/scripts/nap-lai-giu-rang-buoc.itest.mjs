// nap-lai-giu-rang-buoc.itest.mjs — hồ sơ itest-nap-lai-migration-cu-sau-095 AC-1: nạp lại migration cũ không bao giờ thu hẹp
// trục phát biểu (field_assertions_field_chk). Ma trận bốn ô trên chữ thật của 045, 059, 061 (thuần), rồi hai ca trên DB đủ
// migration trong BEGIN … ROLLBACK. Chạy: bash ../db/db-thu.sh oneinvest_suite_<bộ> --chay node --test scripts/<tệp>
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { CAU_TRUONG, giuTruong, sqlNapLaiDayDu, truongSong } from "../lib/nap-view-song.mjs";
import { napDacTrung } from "../lib/nap-061.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const mig = (f) => readFileSync(join(ROOT, "db/migrations", f), "utf8");
const TEP = { "045": mig("045_phat_bieu_va_phan_xu.sql"), "059": mig("059_thoi_gian_hieu_luc.sql"), "061": mig("061_dac_trung_nha.sql") };
const tach = (s) => [...String(s).matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]);
/** Tập trường của từng câu ADD ràng buộc trường trong một khối SQL. */
const cacTap = (sql) => [...sql.matchAll(new RegExp(CAU_TRUONG.source, "g"))].map((m) => tach(m[1]));
const GIA = "qx_thu";   // trường giả mô phỏng migration mới (096…) thêm vào trục

test("ITNL-AC-1 ma trận bốn ô × 045, 059, 061: không bỏ trường nào, sống ⊆ tệp thì nguyên từng byte", () => {
  let so = 0;
  for (const [ten, sql] of Object.entries(TEP)) {
    const tep = cacTap(sql)[0];
    assert.ok(tep?.length > 0, `ITNL-AC-1 ${ten}: không bắt được câu ADD ràng buộc trường — khuôn CAU_TRUONG lệch tệp`);
    const O = [
      ["bằng nhau", [...tep], true],
      ["sống ⊊ tệp", tep.slice(0, -1), true],
      ["tệp ⊊ sống", [...tep, GIA], false],
      ["giao một phần", [...tep.slice(1), GIA], false],
    ];
    for (const [o, song, nguyen] of O) {
      const ra = giuTruong(sql, song);
      if (nguyen) assert.equal(ra, sql, `ITNL-AC-1 ${ten} · ${o}: phải giữ nguyên từng byte`);
      const hop = [...new Set([...song, ...tep])];
      for (const tap of cacTap(ra)) {
        const thieu = hop.filter((f) => !tap.includes(f));
        assert.deepEqual(thieu, [], `ITNL-AC-1 ${ten} · ${o}: câu ADD sau nạp thiếu ${thieu.join(", ")}`);
      }
      so++;
    }
  }
  assert.equal(so, 12, "ITNL-AC-1 đủ 4 ô × 3 tệp");
});

let c;
before(async () => { c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect(); });
after(async () => { await c?.end(); });
async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try { await c.query("SELECT pg_advisory_xact_lock(33033)"); return await fn(); } finally { await c.query("ROLLBACK"); }
}

test("ITNL-AC-1 DB đủ migration: nạp lại 061 không vỡ và giữ trục sống", async () => {
  await trongGiaoDich(async () => {
    const truoc = (await truongSong(c)).sort();
    const { rows: [{ n }] } = await c.query(`SELECT count(*)::int AS n FROM field_assertions WHERE NOT field = ANY($1)`, [tach(cacTap(TEP["061"])[0])]);
    assert.ok(n > 0, "ITNL-AC-1 tiền đề: DB phải có phát biểu thuộc trường ngoài 061 (082/095)");
    await napDacTrung(c);
    assert.deepEqual((await truongSong(c)).sort(), truoc, "ITNL-AC-1 nạp lại 061 làm đổi trục sống");
  });
});

test("ITNL-AC-1 trường giả thêm vào trục sống (mô phỏng 096) còn sau khi nạp lại 061 và 045", async () => {
  await trongGiaoDich(async () => {
    const song = await truongSong(c);
    await c.query("ALTER TABLE field_assertions DROP CONSTRAINT field_assertions_field_chk");
    await c.query(`ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk CHECK (field IN (${[...song, GIA].map((f) => `'${f}'`).join(", ")}))`);
    await napDacTrung(c);
    assert.ok((await truongSong(c)).includes(GIA), `ITNL-AC-1 nạp lại 061 bỏ mất ${GIA}`);
    await c.query(await sqlNapLaiDayDu(c, TEP["045"]));
    assert.ok((await truongSong(c)).includes(GIA), `ITNL-AC-1 nạp lại 045 bỏ mất ${GIA}`);
  });
});
