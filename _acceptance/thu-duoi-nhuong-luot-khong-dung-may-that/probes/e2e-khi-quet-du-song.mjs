#!/usr/bin/env node
// e2e-khi-quet-du-song.mjs — E1 của thu-duoi-nhuong-luot-khong-dung-may-that (HT46). Chạy dưới
// `db/db-thu.sh oneinvest_suite_ht46 --chay-trong` (TEST_DATABASE_URL_ADMIN trỏ cụm dùng một lần).
// Dựng một tiến trình thật có dòng lệnh chứa scripts/chotot-daily.sh (giả lượt nạp ngày đang chạy), kiểm pgrep thật thấy nó,
// rồi chạy: (1) tệp e2e của cây → phải xanh trọn; (2) bản tệp ấy ghim ở 2beb7d6ba (trước HT46) trong cùng điều kiện → phải đỏ ở
// «snapshot C mới thật phải được nạp». Bản cũ chép tạm vào pipeline/scripts/ (cần đường tương đối của nó), xoá trong finally.
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const TEP = "pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs";
const GHIM = "2beb7d6ba";
let loi = 0;
if (!process.env.TEST_DATABASE_URL_ADMIN) { console.log("PROBE HONG: thiếu TEST_DATABASE_URL_ADMIN — chạy dưới db-thu.sh --chay-trong"); process.exit(1); }
const T = mkdtempSync(join(tmpdir(), "ht46-quet-du-"));
mkdirSync(join(T, "scripts"));
writeFileSync(join(T, "scripts/chotot-daily.sh"), "sleep 900\n");
const gia = spawn("bash", [join(T, "scripts/chotot-daily.sh")], { stdio: "ignore" });
const banCu = join(ROOT, "pipeline/scripts/.ht46-ban-truoc-e2e.test.mjs");
const dem = (s, k) => Number((s.match(new RegExp(`ℹ ${k} (\\d+)`)) ?? [])[1] ?? -1);
try {
  await new Promise((r) => setTimeout(r, 500));
  const pg = spawnSync("pgrep", ["-f", "scripts/chotot-daily.sh"], { encoding: "utf8" });
  if (pg.stdout.split("\n").includes(String(gia.pid))) console.log(`tien trinh gia song: pgrep that thay pid ${gia.pid}`);
  else { console.log(`PGREP KHONG THAY tiến trình giả ${gia.pid}`); loi++; }
  const cay = spawnSync(process.execPath, ["--test", join(ROOT, TEP)], { encoding: "utf8", env: process.env, timeout: 600_000 });
  const p = dem(cay.stdout, "pass"), f = dem(cay.stdout, "fail"), s = dem(cay.stdout, "skipped");
  if (cay.status === 0 && p === 2 && f === 0 && s === 0) console.log("ban cay: 2 pass · 0 fail · 0 skip");
  else if (s > 0) { console.log(`BAN CAY BO QUA: ${s} ca skip (DB?)`); loi++; }
  else { console.log(`BAN CAY DO: thoát ${cay.status} · pass ${p} · fail ${f}\n${cay.stdout.slice(-1200)}`); loi++; }
  writeFileSync(banCu, execFileSync("git", ["-C", ROOT, "show", `${GHIM}:${TEP}`], { encoding: "utf8" }));
  const cu = spawnSync(process.execPath, ["--test", banCu], { encoding: "utf8", env: process.env, timeout: 600_000 });
  // đối chứng nguyên nhân: CÙNG bản cũ, PATH đầu có pgrep giả thoát 1 («không có lượt quét đủ») → phải xanh. Chỉ khi đối
  // chứng xanh thì chiều đỏ ở trên mới là do nhường lượt, không do wrapper/schema trôi sau 2beb7d6ba.
  const shim = join(T, "shim"); mkdirSync(shim);
  writeFileSync(join(shim, "pgrep"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  const dc = spawnSync(process.execPath, ["--test", banCu], { encoding: "utf8", timeout: 600_000,
    env: { ...process.env, PATH: `${shim}:${process.env.PATH}` } });
  const dcXanh = dc.status === 0 && dem(dc.stdout, "pass") === 2;
  if (dcXanh) console.log(`doi chung ${GHIM} + pgrep gia: 2 pass (nguyen nhan la nhuong luot)`);
  else { console.log(`DOI CHUNG KHONG XANH: thoát ${dc.status}\n${dc.stdout.slice(-800)}`); loi++; }
  if (dcXanh && cu.status !== 0 && /snapshot C mới thật phải được nạp/.test(cu.stdout)) console.log(`ban ${GHIM}: do o «snapshot C mới thật phải được nạp» (dung chieu do)`);
  else { console.log(`BAN CU KHONG DO: thoát ${cu.status}\n${cu.stdout.slice(-800)}`); loi++; }
} catch (e) { console.log(`PROBE HONG: ${e.message}`); loi++; }
finally {
  gia.kill("SIGKILL");
  rmSync(banCu, { force: true });
  rmSync(T, { recursive: true, force: true });
}
console.log(loi ? `E2E-CACH-LY DO (${loi})` : "E2E-CACH-LY OK");
process.exit(loi ? 1 : 0);
