// s06-thu-duoi-do E5 — tệp test của bộ thu đuôi không gọi mạng thật và không ghi vào HOME.
// Chạy tệp test trong tiến trình con: HOME = thư mục tạm rỗng, không DATABASE_URL, --import chan-mang.mjs (fetch và socket
// ra ngoài bị chặn và đếm). Đạt khi: test exit 0, 0 lời gọi mạng, HOME tạm vẫn rỗng.
// Tự kiểm: một tệp test tạm gọi fetch tới địa chỉ thật dưới cùng bộ chặn → bộ đếm phải bắt 1 lời.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");
const CHAN = join(HERE, "chan-mang.mjs");

function chay(tep) {
  const home = mkdtempSync(join(tmpdir(), "s06-duoi-home-"));
  const ghi = join(mkdtempSync(join(tmpdir(), "s06-duoi-mang-")), "dem.txt");
  const env = { ...process.env, HOME: home, CHAN_MANG_GHI: ghi };
  delete env.DATABASE_URL;
  const r = spawnSync(process.execPath, ["--import", CHAN, "--test", tep], { cwd: join(ROOT, "pipeline"), env, encoding: "utf8", timeout: 300_000 });
  const mang = existsSync(ghi) ? readFileSync(ghi, "utf8").split("\n").filter(Boolean) : [];
  const homeCon = readdirSync(home);
  rmSync(home, { recursive: true, force: true }); rmSync(dirname(ghi), { recursive: true, force: true });
  const so = (k) => Number(new RegExp(`ℹ ${k} (\\d+)`).exec(r.stdout)?.[1] ?? -1);
  return { exit: r.status, mang, homeCon, pass: so("pass"), fail: so("fail"), skipped: so("skipped") };
}

let loi = 0;
const a = chay("scripts/collect-s06-duoi.test.mjs");
console.log(`collect-s06-duoi.test.mjs: exit ${a.exit} · pass ${a.pass} · fail ${a.fail} · bỏ qua ${a.skipped} (ca DB, không DATABASE_URL)`);
console.log(`loi goi mang that: ${a.mang.length}${a.mang.length ? " — " + a.mang.slice(0, 3).join("; ") : ""}`);
console.log(`HOME tam sau khi chay: ${a.homeCon.length ? "CO TEP: " + a.homeCon.join(", ") : "rong"}`);
if (a.exit !== 0 || a.fail !== 0) { loi++; console.log("TEST DO"); }
if (a.mang.length) { loi++; console.log("GOI MANG THAT"); }
if (a.homeCon.length) { loi++; console.log("GHI VAO HOME"); }

const tam = mkdtempSync(join(tmpdir(), "s06-duoi-tu-kiem-"));
try {
  const t = join(tam, "goi-that.test.mjs");
  writeFileSync(t, `import test from "node:test";\ntest("gọi thật", async () => { try { await fetch("https://example.com/"); } catch {} });\n`);
  const b = chay(t);
  console.log(`tu kiem: tệp test gọi fetch thật → bộ đếm bắt ${b.mang.length} lời ${b.mang.length === 1 ? "(TRUNG)" : "(HONG)"}`);
  if (b.mang.length !== 1) { loi++; console.log("TU KIEM HONG"); }
} finally { rmSync(tam, { recursive: true, force: true }); }
console.log(loi ? `KHONG-MANG DO (${loi})` : "KHONG-MANG OK");
process.exit(loi ? 1 : 0);
