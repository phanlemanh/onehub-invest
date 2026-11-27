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
const TEST = readFileSync(join(ROOT, "scripts/thu-duoi-s06.test.mjs"), "utf8");
// Ca phải đỏ được nhận theo DẤU trong THÂN ca test (cách ca dựng nhánh đó), không theo tên ca: lượt chấm S4 vòng 1 (27/11)
// đỏ giả vì làn thu đổi tên ca mà probe còn dò tên cũ. Dấu không khớp ca nào → probe đỏ, nói rõ lý do.
const DOT_BIEN = [
  { ten: "bo-kiem-pid-song", tim: `if [ -n "$PID_CU" ] && kill -0 "$PID_CU" 2>/dev/null; then`, thay: "if false; then", dau: 'writeFileSync(join(`${t.goc}.lock`, "pid"), String(con.pid))' },
  { ten: "bo-nhuong-luot", tim: `if pgrep -f "scripts/chotot-daily.sh" >/dev/null 2>&1; then`, thay: "if false; then", dau: 'PGREP_GIA_QUET_DU: "1"' },
];

// tên các ca test( mà thân chứa dấu — thân tính tới ca test( kế tiếp
function caTheoDau(nguon, dau) {
  const mo = [...nguon.matchAll(/^test\("((?:[^"\\]|\\.)*)"/gm)];
  return mo.filter((m, i) => nguon.slice(m.index, i + 1 < mo.length ? mo[i + 1].index : nguon.length).includes(dau)).map((m) => m[1]);
}

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
// tự kiểm bộ dò: một dấu không có trong tệp test phải khớp 0 ca (nếu khớp thì bộ dò hỏng, mọi kết luận dưới vô nghĩa)
const gia = caTheoDau(TEST, "__ZC18_DAU_KHONG_TON_TAI__");
console.log(`tu kiem mau do: dau gia khop ${gia.length} ca${gia.length ? "" : " (DUNG)"}`);
if (gia.length) { loi++; console.log("TU KIEM MAU DO HONG"); }
const lanh = chay(GOC);
console.log(`ban chep lanh: exit ${lanh.exit} · ${lanh.do_.length} ca đỏ`);
if (lanh.exit !== 0 || lanh.do_.length) { loi++; console.log("DOI CHUNG HONG"); }
for (const d of DOT_BIEN) {
  if (GOC.split(d.tim).length !== 2) { loi++; console.log(`KHONG TIM THAY CHO PHA ${d.ten}`); continue; }
  const can = caTheoDau(TEST, d.dau);
  if (!can.length) { loi++; console.log(`MAU DO KHONG KHOP CA NAO ${d.ten}: khong ca test( nao chua dau ${JSON.stringify(d.dau)}`); continue; }
  const r = chay(GOC.replace(d.tim, d.thay));
  const trung = r.do_.filter((s) => can.includes(s));
  console.log(`${trung.length ? "ĐỘT BIẾN BỊ BẮT" : "ĐỘT BIẾN SỐNG"} ${d.ten}: ${r.do_.length} ca đỏ, ${trung.length} đúng nhánh${trung[0] ? " — " + trung[0] : ""}`);
  if (!trung.length) loi++;
}
console.log(loi ? `DOT-BIEN DO (${loi})` : "DOT-BIEN OK");
process.exit(loi ? 1 : 0);
