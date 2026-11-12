#!/usr/bin/env node
// itest-nap-lai-migration-cu-sau-095 AC-5: hai đối chứng đỏ.
//  (RB) Trên DB thử đủ migration (DATABASE_URL, trong BEGIN … ROLLBACK): đường nạp lại CŨ (sqlNapLai, không giữ trục) áp 061
//       → lỗi «violated by some row»; xoá tạm phát biểu ngoài 061 rồi thêm trường giả qx_thu → đường cũ làm mất qx_thu.
//       Đường MỚI (sqlNapLaiDayDu) trên cùng hai kịch bản: không lỗi, qx_thu còn.
//  (TEP) Worktree tạm tách rời ở merge-base: bốn tệp kiểm chạy trên DB của riêng lượt đều đỏ như trên main.
// Chạy: bash db/db-thu.sh oneinvest_suite_<bộ> --chay node _acceptance/<slug>/probes/doi-chung.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const { sqlNapLai, sqlNapLaiDayDu, truongSong } = await import(pathToFileURL(path.join(ROOT, "pipeline/lib/nap-view-song.mjs")).href);
const { MIG_061 } = await import(pathToFileURL(path.join(ROOT, "pipeline/lib/nap-061.mjs")).href);
const TEP = ["s06-duong", "sdt-trong-duong", "phat-bieu-db", "danh-ba-vat-the-that"];
const GIA = "qx_thu";
let sai = 0;
const kiem = (ok, m) => { console.log(`${ok ? "ok  " : "FAIL"} ${m}`); if (!ok) sai++; };

// (RB)
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
async function kichBan(hamNap, giaTruoc) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    if (giaTruoc) {
      const truc061 = [...MIG_061.matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]);
      await c.query("DELETE FROM field_assertions WHERE NOT field = ANY($1)", [truc061]);
      const song = await truongSong(c);
      await c.query("ALTER TABLE field_assertions DROP CONSTRAINT field_assertions_field_chk");
      await c.query(`ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk CHECK (field IN (${[...song, GIA].map((f) => `'${f}'`).join(", ")}))`);
    }
    await c.query(await hamNap(c, MIG_061));
    return { loi: null, coGia: (await truongSong(c)).includes(GIA) };
  } catch (e) { return { loi: e.message, coGia: null }; } finally { await c.query("ROLLBACK"); }
}
const cu1 = await kichBan(sqlNapLai, false), moi1 = await kichBan(sqlNapLaiDayDu, false);
const cu2 = await kichBan(sqlNapLai, true), moi2 = await kichBan(sqlNapLaiDayDu, true);
await c.end();
const okRB = /violated by some row/.test(cu1.loi ?? "") && moi1.loi === null && cu2.loi === null && cu2.coGia === false && moi2.coGia === true;
console.log(`RB: cũ «${cu1.loi ?? "không lỗi"}» · mới ${moi1.loi ?? "không lỗi"} · cũ mất ${GIA}: ${cu2.coGia === false} · mới giữ ${GIA}: ${moi2.coGia}`);
kiem(okRB, okRB ? "DOI CHUNG RB DO" : "DOI CHUNG RB KHONG DO DUNG");

// (TEP)
const goc = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: ROOT, encoding: "utf8" }).trim();
const WT = mkdtempSync(path.join(tmpdir(), "itnl-goc-"));
rmSync(WT, { recursive: true, force: true });
execFileSync("git", ["worktree", "add", "--detach", WT, goc], { cwd: ROOT, stdio: "ignore" });
try {
  for (const m of ["pipeline", "app"]) symlinkSync(path.join(ROOT, m, "node_modules"), path.join(WT, m, "node_modules"));
  let doTep = 0;
  for (const [i, t] of TEP.entries()) {
    const r = spawnSync("bash", ["../db/db-thu.sh", `oneinvest_suite_itnl_goc${i}`, "--chay", process.execPath, "--test", "--test-concurrency=1", `scripts/${t}.itest.mjs`],
      { cwd: path.join(WT, "pipeline"), encoding: "utf8", env: Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT")) });
    const fail = /ℹ fail (\d+)/.exec(`${r.stdout}${r.stderr}`)?.[1];
    const ok = r.status !== 0 && Number(fail) > 0;
    console.log(`  ${t} ở merge-base: mã ${r.status}, fail ${fail ?? "?"} → ${ok ? "đỏ" : "KHÔNG ĐỎ"}`);
    if (ok) doTep++;
  }
  kiem(doTep === TEP.length, `DOI CHUNG TEP DO ${doTep}/${TEP.length} (${TEP.join(", ")})`);
} finally {
  execFileSync("git", ["worktree", "remove", "--force", WT], { cwd: ROOT, stdio: "ignore" });
}
console.log(sai ? `ITNL-DOI-CHUNG FAIL (${sai})` : "ITNL-DOI-CHUNG PASS");
process.exitCode = sai ? 1 : 0;
