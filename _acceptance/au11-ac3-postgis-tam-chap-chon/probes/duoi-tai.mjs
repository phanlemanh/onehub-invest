#!/usr/bin/env node
// au11-ac3-postgis-tam-chap-chon AC-3: dưới tải đốt CPU (bằng số nhân), BẢN CŨ của scripts/ci-test-module.test.mjs phải đỏ ít nhất
// một lần «Connection terminated» (không thì tải không chứng gì → «TAI KHONG TAI HIEN LOI CU»), rồi BẢN MỚI 10/10 xanh dưới cùng
// tải; thêm: log docker thật (gộp stdout + stderr) qua daQuaKhoiDongLai ra true và dòng mốc khớp bộ log của test.
// Luôn dọn tiến trình đốt CPU, container au11-pg-*, tệp tạm.
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TEP = "scripts/ci-test-module.test.mjs";
const { daQuaKhoiDongLai, MOC_KHOI_DONG_LAI } = await import(pathToFileURL(path.join(ROOT, "scripts/lib/cho-postgis-tam.mjs")).href);
const SO_LAN = 10;
const CPU = os.availableParallelism();
const CU = path.join(ROOT, "scripts", `.ci-test-module-cu-${process.pid}.test.mjs`);
const dot = [];

function don() {
  for (const p of dot) { try { p.kill("SIGKILL"); } catch {} }
  rmSync(CU, { force: true });
  const ids = spawnSync("docker", ["ps", "-aq", "--filter", "name=au11-"], { encoding: "utf8" }).stdout.trim().split("\n").filter(Boolean);
  if (ids.length) spawnSync("docker", ["rm", "-f", ...ids]);
}
process.on("exit", don);
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

function chay(tep) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ["--test", tep], { cwd: ROOT, encoding: "utf8", env: Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT")) });
  return { ok: r.status === 0, giay: ((Date.now() - t0) / 1000).toFixed(1), out: `${r.stdout}${r.stderr}` };
}

let sai = 0;
// Dòng mốc trong log thật khớp bộ log của test.
{
  const ten = `au11-log-${process.pid}`;
  execFileSync("docker", ["run", "-d", "--name", ten, "-e", "POSTGRES_USER=oneinvest", "-e", "POSTGRES_PASS=oneinvest", "-e", "POSTGRES_DB=oneinvest", "kartoza/postgis:17-3.5"], { stdio: "ignore" });
  let log = "";
  for (let i = 0; i < 90 && !daQuaKhoiDongLai(log); i++) {
    execFileSync("sleep", ["2"]);
    const r = spawnSync("docker", ["logs", ten], { encoding: "utf8" });
    log = `${r.stdout}${r.stderr}`;
  }
  spawnSync("docker", ["rm", "-f", ten]);
  const dongThat = log.split("\n").find((l) => l.includes(MOC_KHOI_DONG_LAI)) ?? "";
  const nguonTest = readFileSync(path.join(ROOT, TEP), "utf8");
  const cum = "Postgres initialisation process completed .... restarting in foreground";
  const khop = daQuaKhoiDongLai(log) && dongThat.includes(cum) && nguonTest.includes(cum);
  console.log(khop ? "LOG THAT KHOP MOC" : `LOG THAT LECH MOC: «${dongThat.trim()}»`);
  if (!khop) sai++;
}

// Tải: đốt CPU bằng số nhân.
for (let i = 0; i < CPU; i++) dot.push(spawn(process.execPath, ["-e", "for(;;){}"], { stdio: "ignore" }));
console.log(`tải: ${CPU} tiến trình đốt CPU (os.availableParallelism)`);

// Bản cũ phải đỏ ít nhất một lần «Connection terminated».
const goc = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: ROOT, encoding: "utf8" }).trim();
writeFileSync(CU, execFileSync("git", ["show", `${goc}:${TEP}`], { cwd: ROOT, encoding: "utf8" }));
let doCu = 0, lanCu = 0;
for (; lanCu < SO_LAN && doCu === 0; ) {
  lanCu++;
  const r = chay(CU);
  const conn = /Connection terminated/.test(r.out);
  console.log(`  bản cũ lần ${lanCu}: ${r.ok ? "xanh" : "ĐỎ"} ${r.giay}s${!r.ok && conn ? " (Connection terminated)" : ""}`);
  if (!r.ok && conn) doCu++;
}
console.log(`BAN CU DO ${doCu}/${lanCu}`);
if (doCu === 0) { console.log("TAI KHONG TAI HIEN LOI CU"); sai++; }

// Bản mới 10/10 dưới cùng tải.
let xanh = 0;
for (let i = 1; i <= SO_LAN; i++) {
  const r = chay(TEP);
  console.log(`  bản mới lần ${i}: ${r.ok ? "xanh" : "ĐỎ"} ${r.giay}s`);
  if (r.ok) xanh++;
  else console.log(r.out.split("\n").filter((l) => /✖|Error/.test(l)).slice(0, 4).join("\n"));
}
console.log(xanh === SO_LAN ? `AU11-DUOI-TAI PASS ${xanh}/${SO_LAN}` : `AU11-DUOI-TAI FAIL ${xanh}/${SO_LAN}`);
if (xanh !== SO_LAN) sai++;
don();
const conLai = spawnSync("docker", ["ps", "-aq", "--filter", "name=au11-"], { encoding: "utf8" }).stdout.trim();
console.log(conLai ? "CON SOT CONTAINER" : "đã dọn tiến trình đốt CPU và container tạm");
process.exitCode = sai ? 1 : 0;
