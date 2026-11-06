// dau-chung.mjs — hồ sơ dau-luoc-do-ban-mau E8b. Gọi `bash db/db-thu.sh --dau` hai lần trên DB chung thật :5433 (chỉ đọc catalog), đo thời gian,
// đọc chi_doc của chính lời gọi đó. Đối chứng cùng thước: bản chép script bỏ cờ chỉ đọc phải ra chi_doc=off, không thì thước hỏng.
//   node _acceptance/dau-luoc-do-ban-mau/probes/dau-chung.mjs
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const GOC = path.resolve(import.meta.dirname, "../../..");
const SH = path.join(GOC, "db/db-thu.sh");
const CO = ` -e "PGOPTIONS=-c default_transaction_read_only=on"`;

function goi(sh) {
  const t0 = performance.now();
  const r = spawnSync("bash", [sh, "--dau"], { encoding: "utf8" });
  const ms = Math.round(performance.now() - t0);
  const dong = r.stdout.trim().split("\n");
  return { exit: r.status, ms, chi_doc: dong[0]?.replace(/^chi_doc=/, "") ?? null, dau: dong[1] ?? null, loi: r.stderr.trim() };
}

const a = goi(SH);
const b = goi(SH);
if (a.exit !== 0 || !a.dau) {
  console.log(`thước hỏng: không đọc được dấu (exit ${a.exit}) ${a.loi}`);
  process.exit(3);
}

// Đối chứng: bản chép bỏ cờ trong thư mục tạm, cùng tệp câu dấu.
const tam = mkdtempSync(path.join(tmpdir(), "dau-chung-"));
const goc = readFileSync(SH, "utf8");
if (!goc.includes(CO)) {
  console.log("thước hỏng: script không còn cờ chỉ đọc để bỏ — đối chứng rỗng");
  process.exit(3);
}
writeFileSync(path.join(tam, "db-thu.sh"), goc.replace(CO, ""));
copyFileSync(path.join(GOC, "db/dau-luoc-do.sql"), path.join(tam, "dau-luoc-do.sql"));
const dc = goi(path.join(tam, "db-thu.sh"));
if (dc.chi_doc !== "off") {
  console.log(`thước hỏng: đối chứng bỏ cờ vẫn ra chi_doc=${dc.chi_doc}`);
  process.exit(3);
}
console.log("đối chứng: không chỉ đọc khi bỏ cờ");

const kq = { chi_doc: a.chi_doc, dau1: a.dau, dau2: b.dau, ms1: a.ms, ms2: b.ms };
console.log(JSON.stringify(kq));
const loi = [];
if (a.chi_doc !== "on" || b.chi_doc !== "on") loi.push("lời gọi dấu không chạy chỉ đọc");
if (!/^[0-9a-f]{32}$/.test(a.dau)) loi.push("dấu không phải 32 hex");
if (a.dau !== b.dau) loi.push("hai lần đọc khác dấu");
if (a.ms >= 3000 || b.ms >= 3000) loi.push("tính dấu từ 3 giây trở lên");
if (loi.length) {
  console.log(`E8b đỏ: ${loi.join("; ")}`);
  process.exit(1);
}
console.log("E8b đạt");
