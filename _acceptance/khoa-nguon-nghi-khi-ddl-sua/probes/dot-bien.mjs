// dot-bien.mjs — hồ sơ khoa-nguon-nghi-khi-ddl-sua E4 (AC-4). Chạy trên DB của riêng lượt (db/db-thu.sh --chay), không DB chung:
//   cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kndb --chay node ../_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs
// 1. Danh sách tệp test import thư viện (git grep) bằng đúng danh sách hồi quy của AC-5.
// 2. Ca KN- trên bản thật xanh đủ 4 (đối chứng dương).
// 3. Bốn đột biến trên bản chép tạm .dot-<pid> của lib + test; mỗi bản đỏ với thông điệp ghim của đúng ca nó phá.
// Tệp thật không bị đổi (so băm trước/sau); bản chép tạm bị xoá cả khi probe lỗi hay vượt trần.
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PIPE = path.join(ROOT, "pipeline");
const LIB = "pipeline/lib/luoc-do-rieng.mjs";
const TEST = "pipeline/scripts/luoc-do-rieng.test.mjs";
const HOI_QUY = [
  "app/tests/can-gia-tot-biet-can.test.tsx",
  "app/tests/deals-phi-ly.test.tsx",
  "app/tests/dq-moi-nhat.test.tsx",
  "pipeline/scripts/bait-gap-sellers.test.mjs",
  "pipeline/scripts/deals-phi-ly.test.mjs",
  "pipeline/scripts/gan-sdt-s06.test.mjs",
  "pipeline/scripts/importer-schema-v5.test.mjs",
  "pipeline/scripts/kiem-do-sau-070.test.mjs",
  "pipeline/scripts/luoc-do-rieng.test.mjs",
  "pipeline/scripts/so-ghep-s06.test.mjs",
];

const TAM = [];
const don = () => { for (const f of TAM.splice(0)) try { unlinkSync(f); } catch {} };
const hong = (thong, ma = 1) => { don(); console.error(thong); process.exit(ma); };
process.on("uncaughtException", (e) => hong(`PROBE LOI: ${e.stack ?? e}`));
setTimeout(() => hong("PROBE VUOT TRAN 600 s", 3), 600_000).unref();

const doc = (f) => readFileSync(path.join(ROOT, f), "utf8");
const bam = (f) => createHash("sha256").update(doc(f)).digest("hex");

// 1. Danh sách hồi quy.
const dung = execFileSync("git", ["grep", "-l", "-e", "luoc-do-rieng.mjs", "--", "app/tests", "pipeline/scripts"], { cwd: ROOT, encoding: "utf8" })
  .split("\n").filter((f) => /\.test\.(mjs|tsx|ts)$/.test(f)).sort();
if (JSON.stringify(dung) !== JSON.stringify([...HOI_QUY].sort())) {
  hong(`DANH SACH HOI QUY LECH: tệp import thư viện ${JSON.stringify(dung)} khác AC-5 ${JSON.stringify(HOI_QUY)}`);
}
console.log(`# danh sách hồi quy khớp: ${dung.length} tệp`);

const bamTruoc = [bam(LIB), bam(TEST)];
const chayKN = (tepTest) => {
  const r = spawnSync("node", ["--test", "--test-concurrency=1", "--test-name-pattern=^KN-", tepTest],
    { cwd: PIPE, encoding: "utf8", timeout: 240_000, env: process.env });
  return { ma: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

// 2. Bản thật.
const that = chayKN(path.relative("pipeline", TEST));
console.log(`# bản thật: thoát ${that.ma}`);
if (that.ma !== 0 || !/ℹ pass 4\b/.test(that.out)) hong(`BAN THAT KHONG XANH DU 4 CA KN:\n${that.out.slice(-1500)}`);

// 3. Đột biến: [tên, [[từ, thành], …], [thông điệp phải có, …]].
const NGHI = "    await new Promise((r) => setTimeout(r, 100));\n";
const DOT = [
  ["mã cũ — chỉ nghỉ khi chưa tới lượt",
    [[NGHI, "    if (!toiLuot) await new Promise((r) => setTimeout(r, 100));\n"]],
    ["KN KHOA NGOAI 33033 QUAY KHONG NGHI", "KN HET LUOT MA KHONG NGHI"]],
  ["nghỉ khi còn giữ 33033",
    [[NGHI, ""],
     ['      if (e.code !== "55P03" || lan >= toiDa) throw e; // 55P03 lock_not_available\n',
      '      if (e.code !== "55P03" || lan >= toiDa) throw e; // 55P03 lock_not_available\n      await new Promise((r) => setTimeout(r, 100));\n']],
    ["KN NGHI KHI GIU 33033"]],
  ["quên nhả 33033 khi vào được",
    [['      if (toiLuot) await c.query("SELECT pg_advisory_unlock(33033)");', '      if (toiLuot && !duoc) await c.query("SELECT pg_advisory_unlock(33033)");']],
    ["KN CON GIU 33033"]],
  ["thử lại mọi mã lỗi",
    [['if (e.code !== "55P03" || lan >= toiDa) throw e;', "if (lan >= toiDa) throw e;"]],
    ["KN LOI KHAC VAN THU LAI"]],
];
const lib = doc(LIB);
const test = doc(TEST);
for (const [ten, doi, mong] of DOT) {
  let ban = lib;
  for (const [tu, thanh] of doi) {
    if (!ban.includes(tu)) hong(`DOT BIEN KHONG AP DUOC: «${ten}» không thấy chỗ cần đổi`, 2);
    ban = ban.replace(tu, thanh);
  }
  const libTam = LIB.replace(".mjs", `.dot-${process.pid}.mjs`);
  const testTam = TEST.replace(".test.mjs", `.dot-${process.pid}.test.mjs`);
  TAM.push(path.join(ROOT, libTam), path.join(ROOT, testTam));
  writeFileSync(path.join(ROOT, libTam), ban);
  writeFileSync(path.join(ROOT, testTam), test.replace("../lib/luoc-do-rieng.mjs", `../lib/${path.basename(libTam)}`));
  const r = chayKN(path.relative("pipeline", testTam));
  don();
  console.log(`# đột biến «${ten}»: thoát ${r.ma}`);
  if (r.ma === 0) hong(`DOI CHUNG KHONG BAT: đột biến «${ten}» vẫn xanh`);
  for (const m of mong) if (!r.out.includes(m)) hong(`đột biến «${ten}» đỏ mà thiếu thông điệp ghim «${m}»:\n${r.out.slice(-1500)}`);
}

if (bam(LIB) !== bamTruoc[0] || bam(TEST) !== bamTruoc[1]) hong("TEP THAT BI DOI trong lúc probe chạy");
console.log("DOT BIEN OK");
