#!/usr/bin/env node
// do-mo-phong.mjs — bộ đo của hồ sơ ngoai-n-tu-dinh-tuyen-bat.
//
// Dựng lại trạng thái NGAY TRƯỚC Cổng Bằng chứng của 9 hồ sơ đã ký thật (lấy từ git ở mốc ghim, không viết tay):
// contract `status: verified`, bỏ `human_signoff`, bỏ mọi dòng sổ `stage: gate2`. Rồi chạy bộ ghi của kit
// (`dinh-tuyen-may.cjs`) với `_acceptance/config.yaml` THẬT của cây đang đo, và so với số đã khai ở hợp đồng.
//
// Ca (mỗi ca in một dòng «NNTD-<mã>: ĐẠT|ĐỎ …»; có ca đỏ thì thoát 1):
//   NNTD-KHOA     config của cây đọc ra feature_loop.ngoai_n_tu_dinh_tuyen = true (lib/evidence-core.cjs của kho)
//   NNTD-CHEP     bốn tệp kit chép trong kho (bộ đọc lưới trước-merge và làn V) khớp byte bản kit đang chạy
//   NNTD-T2       sáu hồ sơ T2: máy xếp đúng số mục từng hồ sơ (tổng 28/38), mỗi dòng máy đúng khuôn
//   NNTD-T3       ba hồ sơ T3: «không định tuyến: hạng T3», sổ không đổi một byte
//   NNTD-DOI      so dòng máy với dòng người thật ở mốc ghim: 24 khớp · 3 đổi qua lại KL↔chấp nhận · 1 đảo thật
//   NNTD-LANV     sau khi máy xếp: đúng hai hồ sơ đủ xanh-sạch (sua-xa-bo-nut-ung-vien, nap-s09)
//   NNTD-TAT      đối chứng: cùng chín hồ sơ, config bỏ khoá → mọi hồ sơ «tắt», 0 dòng máy
//
// Dùng: node _acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs [--rev <mốc>]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const REV = argv.includes("--rev") ? argv[argv.indexOf("--rev") + 1] : "d2b4beaf";
const require = createRequire(import.meta.url);

// Số đã khai ở hợp đồng (AC-2, AC-3, AC-4, AC-5). Đổi số ở đây là đổi thước — phải đi cùng hợp đồng.
const T2 = { "tap-nhan-ghep-tin-hai-khu": [7, 4], "sua-xa-bo-nut-ung-vien": [1, 1], "s06-tran-trang": [9, 7], "nap-s09": [3, 3], "toa-s09-hai-khu-vao-danh-ba": [12, 11], "stg-du-an-s08": [6, 2] };
const T3 = ["khoa-gop-can-khong-gia", "phuong-tu-du-an", "ma-du-an-s06-thanh-nut"];
const DOI = { khop: 24, doiQuaLai: 3, daoThat: ["nap-s09 Ngoài-1"] };
const LANV = ["nap-s09", "sua-xa-bo-nut-ung-vien"];

let doCount = 0;
const ca = (ma, ok, chu) => { if (!ok) doCount++; console.log(`NNTD-${ma}: ${ok ? "ĐẠT" : "ĐỎ"} — ${chu}`); };

function giaiAG() {
  if (process.env.AG_ROOT) return process.env.AG_ROOT;
  const rp = path.join(os.homedir(), ".claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs");
  return execFileSync("node", [rp, "--plugin", "acceptance-gate", "--require", "scripts/dinh-tuyen-may.cjs"], { encoding: "utf8" }).trim();
}
const AG = giaiAG();
const DTM = path.join(AG, "scripts/dinh-tuyen-may.cjs");
const BAN_KIT = "2.37.0";
// Số đo gắn với đúng bản kit đã khai ở hợp đồng; bản khác thì báo «sai bản kit» thay vì lệch số.
if (path.basename(AG) !== BAN_KIT) { console.log(`NNTD-BAN: ĐỎ — sai bản kit: đang dùng ${AG}, hợp đồng đo trên ${BAN_KIT}`); process.exit(1); }
console.log(`NNTD-BAN: ĐẠT — kit ${AG}`);
const { parse: parseNgoai } = require(path.join(ROOT, "lib/out-of-contract.cjs"));

const docSo = f => fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
const bam = f => fs.existsSync(f) ? crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex") : "vang";

// Dựng một gốc kho tạm chứa config (có hoặc không khoá) và chín hồ sơ ở trạng thái trước Cổng 2.
function dungGoc(coKhoa) {
  const g = fs.mkdtempSync(path.join(os.tmpdir(), "nntd-"));
  execFileSync("git", ["init", "-q"], { cwd: g });
  fs.mkdirSync(path.join(g, "_acceptance"));
  let cfg = fs.readFileSync(path.join(ROOT, "_acceptance/config.yaml"), "utf8");
  if (!coKhoa) cfg = cfg.split("\n").filter(l => !/^\s*ngoai_n_tu_dinh_tuyen:/.test(l)).join("\n");
  fs.writeFileSync(path.join(g, "_acceptance/config.yaml"), cfg);
  for (const s of [...Object.keys(T2), ...T3]) {
    const tar = execFileSync("git", ["-C", ROOT, "archive", REV, `_acceptance/${s}`], { maxBuffer: 1 << 28 });
    execFileSync("tar", ["-x", "-C", g], { input: tar });
    const d = path.join(g, "_acceptance", s);
    const c = path.join(d, "contract.md");
    fs.writeFileSync(c, fs.readFileSync(c, "utf8").replace(/^status: .*$/m, "status: verified"));
    const r = path.join(d, "evidence-report.md");
    fs.writeFileSync(r, fs.readFileSync(r, "utf8").replace(/^human_signoff:.*$/m, "human_signoff:"));
    const L = path.join(d, "decisions.jsonl");
    if (fs.existsSync(L)) fs.writeFileSync(L, fs.readFileSync(L, "utf8").split("\n").filter(l => l.trim() && !/"stage"\s*:\s*"gate2"/.test(l)).join("\n") + "\n");
  }
  return g;
}
const chay = (g, s, mode) => spawnSync("node", [DTM, mode, "--root", g, "--slug", s], { encoding: "utf8" });

// NNTD-KHOA
{
  const { resolveConfigKey } = require(path.join(ROOT, "lib/evidence-core.cjs"));
  const cfgPath = path.join(ROOT, "_acceptance/config.yaml");
  let v;
  try { v = resolveConfigKey(fs.readFileSync(cfgPath, "utf8"), "feature_loop.ngoai_n_tu_dinh_tuyen"); } catch (e) { v = `lỗi: ${e.message}`; }
  ca("KHOA", v === true || v === "true", `feature_loop.ngoai_n_tu_dinh_tuyen = ${JSON.stringify(v)} (đòi true)`);
}

// NNTD-CHEP — bộ đọc của kho (lưới trước-merge, làn V) phải là đúng bản kit mà bộ ghi dùng
{
  const tep = ["lib/out-of-contract.cjs", "lib/evidence-core.cjs", "scripts/khong-can-nguoi.mjs", "scripts/pre-merge-check.sh"];
  const lech = tep.filter(f => bam(path.join(ROOT, f)) !== bam(path.join(AG, f)));
  ca("CHEP", lech.length === 0, `bản chép của kho so kit ${path.basename(AG)}: ${lech.length ? "LỆCH " + lech.join(", ") : "khớp byte cả " + tep.length + " tệp"}`);
}

// NNTD-T2, NNTD-T3, NNTD-DOI, NNTD-LANV trên gốc có khoá
const g = dungGoc(true);
let tongMay = 0, tongMuc = 0, tongKL = 0, tongWF = 0;
const conLai = [];
const may = {};
for (const [s, [muc, ky]] of Object.entries(T2)) {
  const truoc = docSo(path.join(g, "_acceptance", s, "decisions.jsonl")).length;
  const r = chay(g, s, "--write");
  const dong = docSo(path.join(g, "_acceptance", s, "decisions.jsonl")).slice(truoc);
  may[s] = dong;
  const khuon = dong.every(d => d.may === "dinh-tuyen-ngoai-n" && d.stage === "gate2" && !d.decided_by && /^Ngoài-\d+: (ghi Known limits|chấp nhận, không sửa)$/.test(d.decision) && d.dao === `/acceptance-gate:signoff ${s} ${d.decision.split(":")[0]}: mở hợp đồng mới; Ký` && d.tieu_de);
  tongMay += dong.length; tongMuc += muc;
  tongKL += dong.filter(d => /: ghi Known limits$/.test(d.decision)).length;
  tongWF += dong.filter(d => /: chấp nhận, không sửa$/.test(d.decision)).length;
  // Mục máy KHÔNG xếp: đề xuất của chính máy cho mục ấy (bộ đọc lib/out-of-contract.cjs của kho)
  const fds = parseNgoai(fs.readFileSync(path.join(g, "_acceptance", s, "review-findings.md"), "utf8")).findings;
  const daXep = new Set(dong.map(d => d.decision.split(":")[0]));
  fds.forEach((f, i) => { if (!daXep.has(`Ngoài-${i + 1}`)) conLai.push(`${s} Ngoài-${i + 1}=${f.proposal || "(không đọc được: " + (f.proposal_raw || "vắng") + ")"}`); });
  ca("T2", r.status === 0 && dong.length === ky && khuon, `${s}: máy xếp ${dong.length}/${muc} mục (đòi ${ky}), khuôn dòng máy ${khuon ? "đúng" : "SAI"}, thoát ${r.status}${r.status ? " — " + (r.stderr || r.stdout).trim() : ""}`);
}
ca("T2", tongMay === 28 && tongMuc === 38, `tổng T2: máy xếp ${tongMay}/${tongMuc} (đòi 28/38) — Mạnh còn ${tongMuc - tongMay} (đòi 10)`);
ca("T2", tongKL === 23 && tongWF === 5, `chia theo loại: ghi Known limits ${tongKL} (đòi 23) · chấp nhận, không sửa ${tongWF} (đòi 5)`);
{
  const khongPhaiMoi = conLai.filter(x => !x.endsWith("=new-contract"));
  ca("T2", conLai.length === 10 && khongPhaiMoi.length === 0, `${conLai.length} mục còn về Mạnh, đề xuất của máy: ${khongPhaiMoi.length ? "CÓ mục không phải new-contract: " + khongPhaiMoi.join(", ") : "cả " + conLai.length + " là new-contract"}`);
}
{
  const d = (may["nap-s09"] || [])[0];
  ca("T2", !!d && d.dao === "/acceptance-gate:signoff nap-s09 Ngoài-1: mở hợp đồng mới; Ký", `lệnh đảo dòng máy đầu của nap-s09: «${d ? d.dao : "vắng"}»`);
}

for (const s of T3) {
  const L = path.join(g, "_acceptance", s, "decisions.jsonl");
  const b0 = bam(L), r = chay(g, s, "--write"), b1 = bam(L);
  ca("T3", r.status === 0 && /không định tuyến: hạng T3/.test(r.stdout) && b0 === b1, `${s}: «${r.stdout.trim()}», sổ ${b0 === b1 ? "không đổi" : "BỊ ĐỔI"}`);
}

{
  let khop = 0, doiQuaLai = 0; const daoThat = [];
  const THU = /^(ghi Known limits|chấp nhận, không sửa)/;
  for (const s of Object.keys(T2)) {
    const nguoi = docSo(path.join(ROOT, "_acceptance", s, "decisions.jsonl")).filter(d => d.stage === "gate2" && /^Ngoài-\d+:/.test(d.decision || ""));
    for (const m of may[s]) {
      const n = m.decision.split(":")[0];
      const h = nguoi.filter(x => x.decision.split(":")[0] === n).pop();
      const hv = h ? h.decision.slice(n.length + 1).trim() : "";
      const mv = m.decision.slice(n.length + 1).trim();
      if (hv.startsWith(mv)) khop++; else if (THU.test(hv)) doiQuaLai++; else daoThat.push(`${s} ${n}`);
    }
  }
  const ok = khop === DOI.khop && doiQuaLai === DOI.doiQuaLai && JSON.stringify(daoThat) === JSON.stringify(DOI.daoThat);
  ca("DOI", ok, `khớp ${khop} (đòi ${DOI.khop}) · đổi qua lại KL↔chấp nhận ${doiQuaLai} (đòi ${DOI.doiQuaLai}) · đảo thật ${daoThat.length}: ${daoThat.join(", ") || "không"} (đòi ${DOI.daoThat.join(", ")}) · tỉ lệ đảo thật ${(100 * daoThat.length / tongMay).toFixed(1)}% (ngưỡng thiết kế 10%)`);
}

{
  const KCN = path.join(ROOT, "scripts/khong-can-nguoi.mjs");
  const qua = [];
  for (const s of [...Object.keys(T2), ...T3]) if (spawnSync("node", [KCN, "--check", "--root", g, "--slug", s], { encoding: "utf8" }).status === 0) qua.push(s);
  qua.sort();
  ca("LANV", JSON.stringify(qua) === JSON.stringify(LANV), `hồ sơ đủ xanh-sạch sau khi máy xếp: ${qua.join(", ") || "không"} (đòi ${LANV.join(", ")})`);
}
fs.rmSync(g, { recursive: true, force: true });

// NNTD-TAT — đối chứng: bỏ khoá thì máy không xếp mục nào
{
  const g2 = dungGoc(false);
  let tat = 0, dongMay = 0;
  for (const s of [...Object.keys(T2), ...T3]) {
    const L = path.join(g2, "_acceptance", s, "decisions.jsonl");
    const r = chay(g2, s, "--write");
    if (r.status === 0 && /dinh-tuyen-may: tắt/.test(r.stdout)) tat++;
    dongMay += docSo(L).filter(d => d.may).length;
  }
  ca("TAT", tat === 9 && dongMay === 0, `config bỏ khoá: ${tat}/9 hồ sơ «tắt», ${dongMay} dòng máy (đòi 9/9, 0)`);
  fs.rmSync(g2, { recursive: true, force: true });
}

console.log(`do-mo-phong: mốc ${REV}, kit ${path.basename(AG)} — ${doCount ? doCount + " ca ĐỎ" : "mọi ca ĐẠT"}`);
process.exit(doCount ? 1 : 0);
