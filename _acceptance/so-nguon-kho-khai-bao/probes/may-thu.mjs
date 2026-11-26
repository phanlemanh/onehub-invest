#!/usr/bin/env node
// may-thu.mjs — E7 (AC-7) của so-nguon-kho-khai-bao: số trên màn sau khi áp 122 lên DB máy thu và điền tên S09, S17.
// Chạy ở checkout chính SAU khi kéo main (ap-may-thu.md bước kiểm). Chỉ đọc: phiên đặt default_transaction_read_only.
//   1. CLI `scripts/check-freshness.mjs --json --now <mốc>` (tiến trình con) và `readFreshness` của app (app/src/lib/freshness.ts —
//      hàm trang Thu thập đọc) trên cùng DB, cùng mốc → so từng hàng (mã, thành phố, tuổi, nhịp, trạng thái).
//   2. Bốn điều đích: S16 có hàng, không «chưa khai SLO»; S01 chỉ hanoi; S11 không hàng; S09 có hàng.
//   3. Danh sách tên bộ soát tầng A của push-ops-facts đọc (docSourceNameEntries) có mục cho S09 và S17 — chỉ in số mục.
//   DATABASE_URL mặc định DB máy thu. Thoát 0 + «MAY THU OK» khi đủ; «MAY THU DO» + thoát 1 khi thiếu một điều.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const NOW = new Date();
const require = createRequire(path.join(ROOT, "app/package.json"));
const pg = require("pg");

const loi = [];
const ok = (dk, dong) => { console.log(dk ? dong : `THIẾU ${dong}`); if (!dk) loi.push(dong); };

// 1. CLI
const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/check-freshness.mjs"), "--json", "--now", NOW.toISOString()], {
  env: { ...process.env, DATABASE_URL: DB, WEBHOOK_URL: "" }, encoding: "utf8",
});
let cli;
try {
  cli = JSON.parse(r.stdout);
} catch {
  console.log(`MAY THU DO: CLI không ra JSON (thoát ${r.status}) — ${(r.stderr || "").split("\n")[0]}`);
  process.exit(1);
}
// 2. App
const c = new pg.Client({ connectionString: DB });
await c.connect();
await c.query("SET default_transaction_read_only = on");
let app;
let ten;
try {
  const appFresh = await import(pathToFileURL(path.join(ROOT, "app/src/lib/freshness.ts")).href);
  app = await appFresh.readFreshness(c, { now: NOW });
  const { docSourceNameEntries } = await import(pathToFileURL(path.join(ROOT, "pipeline/lib/source-name-entries.mjs")).href);
  ten = await docSourceNameEntries(c);
} finally {
  await c.end();
}

const key = (x) => JSON.stringify([x.code, x.city, x.ageHours, x.sloHours, x.status]);
const a = cli.map(key).sort();
const b = app.map(key).sort();
const lech = a.filter((k) => !b.includes(k)).length + b.filter((k) => !a.includes(k)).length;
ok(lech === 0, `app (checkout chính) và CLI: ${cli.length} hàng, lệch ${lech}`);

const of = (ma) => cli.filter((x) => x.code === ma);
ok(of("S16").length > 0 && of("S16").every((x) => x.status !== "no-slo"), "S16: có hàng, không «chưa khai SLO»");
ok(JSON.stringify(of("S01").map((x) => x.city)) === JSON.stringify(["hanoi"]), "S01: chỉ hanoi");
ok(of("S11").length === 0, "S11: không hàng");
ok(of("S09").length > 0 && of("S09").every((x) => x.city !== null), "S09: có hàng");
for (const x of cli.filter((y) => ["S09", "S16", "S01"].includes(y.code)))
  console.log(`  ${x.code}/${x.city ?? "—"}: ${x.status}, tuổi ${x.ageHours ?? "—"} giờ, nhịp ${x.sloHours ?? "—"} giờ`);

const dem = (ma) => ten.filter((e) => e.code === ma).length;
ok(dem("S09") > 0 && dem("S17") > 0, `bộ soát tầng A: S09 ${dem("S09")} mục, S17 ${dem("S17")} mục`);

if (loi.length) {
  console.log(`MAY THU DO: ${loi.length} điều chưa đạt`);
  process.exit(1);
}
console.log("MAY THU OK");
