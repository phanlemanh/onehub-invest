// s06-thu-duoi-do E1–E3 chiều đỏ — chạy trong lượt chấm, không mượn lời làn thu: dựng bản chép tạm của bộ thu + tệp test,
// phá từng nhánh, chạy tệp test (không DB, không mạng thật) và đòi ca đúng nhánh ấy đỏ. Bản chép lành chạy trước làm đối
// chứng dương trên cùng dựng (0 ca đỏ). Mã thật trong kho không bị đụng.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const PL = join(ROOT, "pipeline");
const GOC = readFileSync(join(PL, "collect-s06-duoi.mjs"), "utf8");
const DOT_BIEN = [
  { ten: "bo-cong-vong-doi", tim: "if (!cong.run) maLuot = MA_THOAT.CONG_DONG;", thay: "", can: /cổng vòng đời đóng/ },
  { ten: "bo-dung-gap-tin-da-co", tim: "if (daCo.has(id) || trong.has(id)) {", thay: "if (false) {", can: /CA ĐỎ của lời giao/ },
  { ten: "bo-nhan-dien-403-429", tim: "if (http === 403 || http === 429) throw chan(", thay: "if (false) throw chan(", can: /429 và 403/ },
];

function chay(maNguon) {
  const t = mkdtempSync(join(tmpdir(), "s06-duoi-dot-bien-"));
  try {
    const p = join(t, "pipeline");
    mkdirSync(join(p, "scripts"), { recursive: true });
    writeFileSync(join(p, "collect-s06-duoi.mjs"), maNguon);
    cpSync(join(PL, "scripts/collect-s06-duoi.test.mjs"), join(p, "scripts/collect-s06-duoi.test.mjs"));
    for (const x of ["lib", "node_modules", "import-chotot.mjs"]) symlinkSync(join(PL, x), join(p, x));
    const env = { ...process.env, HOME: t };
    delete env.DATABASE_URL;
    const r = spawnSync(process.execPath, ["--test", "scripts/collect-s06-duoi.test.mjs"], { cwd: p, env, encoding: "utf8", timeout: 300_000 });
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
