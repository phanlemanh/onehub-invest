// s06-thu-duoi-lich-va-chon-snapshot E1b, E2b — chiều đỏ trong lượt chấm: bản chép tạm của wrapper + tệp test, phá từng
// nhánh, chạy tệp test (shim, không DB, không mạng) và đòi ca đúng nhánh ấy đỏ. Bản chép lành chạy trước làm đối chứng
// dương trên cùng dựng (0 ca đỏ). Mã thật trong kho không bị đụng.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const GOC = readFileSync(join(ROOT, "scripts/thu-duoi-s06.sh"), "utf8");
const DOT_BIEN = [
  { ten: "bo-kiem-pid-song", tim: `if [ -n "$PID_CU" ] && kill -0 "$PID_CU" 2>/dev/null; then`, thay: "if false; then", can: /khoá bận \(pid lượt trước còn sống\)/ },
  { ten: "bo-nhuong-luot", tim: `if pgrep -f "scripts/chotot-daily.sh" >/dev/null 2>&1; then`, thay: "if false; then", can: /script nạp ngày đang chạy/ },
];

function chay(maNguon) {
  const t = mkdtempSync(join(tmpdir(), "zc18-dot-bien-"));
  try {
    mkdirSync(join(t, "scripts"));
    writeFileSync(join(t, "scripts/thu-duoi-s06.sh"), maNguon);
    cpSync(join(ROOT, "scripts/thu-duoi-s06.test.mjs"), join(t, "scripts/thu-duoi-s06.test.mjs"));
    // chép thật (không symlink): CLI của thu-duoi-moc.mjs so import.meta.url với argv[1] không qua realpath
    for (const f of ["pipeline/lib/thu-duoi-moc.mjs", "pipeline/cron/com.oneinvest.thu-duoi-s06.plist"]) {
      mkdirSync(dirname(join(t, f)), { recursive: true }); cpSync(join(ROOT, f), join(t, f));
    }
    const env = { ...process.env, HOME: t };
    delete env.DATABASE_URL;
    const r = spawnSync(process.execPath, ["--test", "scripts/thu-duoi-s06.test.mjs"], { cwd: t, env, encoding: "utf8", timeout: 300_000 });
    const do_ = [...r.stdout.matchAll(/^✖ (.+?) \(\d/gm)].map((m) => m[1]).filter((s) => !/^(failing tests|tests)/.test(s));
    return { exit: r.status, do_: [...new Set(do_)] };
  } finally { rmSync(t, { recursive: true, force: true }); }
}

let loi = 0;
const lanh = chay(GOC);
console.log(`ban chep lanh: exit ${lanh.exit} · ${lanh.do_.length} ca đỏ`);
if (lanh.exit !== 0 || lanh.do_.length) { loi++; console.log("DOI CHUNG HONG"); }
for (const d of DOT_BIEN) {
  if (GOC.split(d.tim).length !== 2) { loi++; console.log(`KHONG TIM THAY CHO PHA ${d.ten}`); continue; }
  const r = chay(GOC.replace(d.tim, d.thay));
  const trung = r.do_.filter((s) => d.can.test(s));
  console.log(`${trung.length ? "ĐỘT BIẾN BỊ BẮT" : "ĐỘT BIẾN SỐNG"} ${d.ten}: ${r.do_.length} ca đỏ, ${trung.length} đúng nhánh${trung[0] ? " — " + trung[0] : ""}`);
  if (!trung.length) loi++;
}
console.log(loi ? `DOT-BIEN DO (${loi})` : "DOT-BIEN OK");
process.exit(loi ? 1 : 0);
