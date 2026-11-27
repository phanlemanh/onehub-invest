#!/usr/bin/env node
// kiem-ht35.mjs — ba phép đo tĩnh của hồ sơ test-khong-roi-ve-db-chung (HT35), chỉ đọc kho, không nối DB.
//   bash db/db-thu.sh oneinvest_suite_ht35 --chay node scripts/kiem-ht35.mjs chay [--ci]   AC-3/AC-5: chạy thật, 0 fail, 0 bỏ qua
//   node scripts/kiem-ht35.mjs s09-vung         AC-6: tệp S09 khác gốc hàng chỉ ở vùng chọn DB
//   node scripts/kiem-ht35.mjs executor-db-thu  AC-7: bốn lệnh chấm chạy check-freshness.test đều qua db/db-thu.sh --chay
//   node scripts/kiem-ht35.mjs bang-phu         AC-8: bảng phủ khớp tập tệp quét lại từ kho, mỗi dòng có ô, thiết kế nêu A–B
// Thoát 0 = đạt; 1 = lệch (in dòng lệch); 2 = gọi sai.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", ["-C", GOC, ...a], { encoding: "utf8" });
const doc = (p) => readFileSync(path.join(GOC, p), "utf8");
const HO_SO = "_acceptance/test-khong-roi-ve-db-chung";
const TEP_S09 = "pipeline/import-s09-danh-ba.test.mjs";
let loi = 0;
const sai = (m) => { console.log(`FAIL ${m}`); loi = 1; };
const dat = (m) => console.log(`PASS ${m}`);

// AC-6 (GS chốt cuối 27/11): tệp S09 của làn zk chỉ đổi ở vùng chọn DB (hạ tầng test, làn Claude) — không chạm logic nạp hay
// ca nghiệp vụ. So với gốc của hàng: mọi dòng diff phải thuộc tập cho phép dưới.
function s09Vung() {
  const diff = git("diff", "--unified=0", GOC_HANG, "--", TEP_S09).split("\n").filter((l) => /^[+-](?![+-])/.test(l));
  const cho = [
    /^-const DB_URL =$/,
    /^-  process\.env\.DATABASE_URL \?\? "postgres:\/\/oneinvest:oneinvest@localhost:5433\/oneinvest";$/,
    /^\+import \{ chotDbThu \} from "\.\/lib\/db-thu-chot\.mjs";$/,
    /^\+\/\/ (HT35 |DATABASE_URL thì|Ca chứng minh)/,
    /^\+const DB_URL = chotDbThu\(\{ ten: "import-s09-danh-ba\.test", khiThieu: "bo-qua" \}\);$/,
  ];
  const la = diff.filter((l) => !cho.some((m) => m.test(l)));
  for (const l of la) sai(`dòng ngoài vùng chọn DB: ${l.slice(0, 160)}`);
  if (!diff.some((l) => cho[4].test(l))) sai("thiếu dòng rào chotDbThu");
  if (!la.length && diff.length) dat(`${TEP_S09} khác ${GOC_HANG} đúng ${diff.length} dòng ở vùng chọn DB`);
}

function executorDbThu() {
  const cfg = doc("_acceptance/config.yaml").split("\n");
  const khoa = { "test.scripts": "scripts", check_freshness: "check_freshness", sl_freshness: "sl_freshness", s08l_do: "s08l_do" };
  for (const [nhan, k] of Object.entries(khoa)) {
    const dong = cfg.find((l) => new RegExp(`^    ${k}: "`).test(l) && (k !== "scripts" || /scripts\/\*\.test\.mjs/.test(l)));
    if (!dong) { sai(`không thấy khoá ${nhan}`); continue; }
    const lenh = dong.replace(/^\s+\w+: "/, "").replace(/".*$/, "");
    if (/^bash db\/db-thu\.sh oneinvest_suite_[a-z0-9_]+ --chay /.test(lenh)) dat(`${nhan} chạy qua db-thu: ${lenh.slice(0, 90)}`);
    else sai(`${nhan} chạy trần: ${lenh.slice(0, 120)}`);
  }
  const tran = cfg.filter((l) => /^    [a-z0-9_]+: "/.test(l) && /(scripts\/check-freshness\.test\.mjs|scripts\/\*\.test\.mjs)/.test(l))
    .filter((l) => !/: "(bash db\/db-thu\.sh oneinvest_suite_[a-z0-9_]+ --chay |node scripts\/suite-neu-doi\.mjs )/.test(l));
  for (const l of tran) sai(`khoá khác chạy check-freshness.test trần: ${l.trim().slice(0, 140)}`);
}

// Bảng phủ đếm tại gốc của hàng (main 1a2cb6a43, trước khi rào hai tệp) — quét lại đúng cây ấy.
const GOC_HANG = "1a2cb6a43";
function quetKho(rev) {
  const tep = (rev ? git("ls-tree", "-r", "--name-only", rev) : git("ls-files")).split("\n").filter((f) => /\.(i?test)\.(mjs|js|ts|tsx|cjs)$/.test(f));
  const ra = [];
  for (const f of tep) {
    let s;
    try { s = rev ? git("show", `${rev}:${f}`) : doc(f); } catch { continue; }
    const m = s.match(/DATABASE_URL\s*(\?\?|\|\|)\s*[`"']([^`"']+)/);
    if (m && /\/oneinvest$/.test(m[2])) ra.push(f);
  }
  return ra.sort();
}

function bangPhu() {
  const bang = doc(`${HO_SO}/bang-phu.md`);
  const dong = bang.split("\n").filter((l) => /^\| `[^`]+` \|/.test(l));
  const trongBang = dong.map((l) => l.match(/^\| `([^`]+)`/)[1]).sort();
  const kho = quetKho(GOC_HANG);
  const thua = trongBang.filter((f) => !kho.includes(f));
  const thieu = kho.filter((f) => !trongBang.includes(f));
  for (const f of thua) sai(`bảng có tệp kho không còn: ${f}`);
  for (const f of thieu) sai(`bảng thiếu tệp: ${f}`);
  if (!thua.length && !thieu.length) dat(`bảng phủ khớp kho @${GOC_HANG}: ${kho.length} tệp rơi về DB chung`);
  // Hai tệp trong phạm vi không còn chuỗi mặc định DB chung ở cây đang kiểm.
  const conLai = quetKho(null);
  for (const f of ["pipeline/import-s09-danh-ba.test.mjs", "scripts/check-freshness.test.mjs"]) {
    if (conLai.includes(f)) sai(`tệp trong phạm vi vẫn rơi về DB chung: ${f}`);
    else dat(`tệp trong phạm vi đã rào: ${f}`);
  }
  // AC-8: ô phải là ĐÚNG một trong ba loại và khớp cột Ghi/Rào cùng dòng — không chỉ «khác rỗng» (S4 r1, hình dạng 3).
  //   tệp trong phạm vi                → «**trong phạm vi**…» (và chỉ hai tệp ấy)
  //   Ghi=không                         → «ngoài phạm vi, vì chỉ đọc…»
  //   Ghi=có, Rào=có                    → «ngoài phạm vi, vì đã có rào…»
  //   Ghi=có, Rào trống                 → «để lại cho HT36…»
  const TRONG = ["pipeline/import-s09-danh-ba.test.mjs", "scripts/check-freshness.test.mjs"];
  const loaiO = (o) =>
    /^\*\*trong phạm vi\*\*/.test(o) ? "trong" :
    /^ngoài phạm vi, vì \S/.test(o) ? "ngoai" :
    /^để lại cho HT36\b/.test(o) ? "ht36" : null;
  let lech = 0;
  for (const l of dong) {
    const c = l.split("|").map((x) => x.trim());
    const tep = c[1].replace(/`/g, ""), ghi = c[3], rao = c[5], o = c[6] ?? "";
    const loai = loaiO(o);
    let mong;
    if (TRONG.includes(tep)) mong = ["trong", /^\*\*trong phạm vi\*\*/];
    else if (ghi === "không") mong = ["ngoai", /^ngoài phạm vi, vì chỉ đọc/];
    else if (ghi === "có" && rao === "có") mong = ["ngoai", /^ngoài phạm vi, vì đã có rào/];
    else if (ghi === "có" && rao === "") mong = ["ht36", /^để lại cho HT36/];
    else mong = null;
    if (!loai) { sai(`ô không thuộc ba loại (${tep}): «${o.slice(0, 80)}»`); lech += 1; }
    else if (!mong) { sai(`cột Ghi/Rào lạ (${tep}): Ghi=«${ghi}» Rào=«${rao}»`); lech += 1; }
    else if (loai !== mong[0] || !mong[1].test(o)) { sai(`ô lệch cột Ghi/Rào (${tep}): Ghi=«${ghi}» Rào=«${rao}» mà ô «${o.slice(0, 80)}»`); lech += 1; }
  }
  const soTrong = dong.filter((l) => loaiO(l.split("|")[6]?.trim() ?? "") === "trong").length;
  if (soTrong !== TRONG.length) { sai(`số dòng «trong phạm vi» = ${soTrong}, phải = ${TRONG.length}`); lech += 1; }
  if (!lech) dat(`mọi dòng có đúng một loại ô khớp cột Ghi/Rào (${dong.length})`);
  const tk = doc("docs/superpowers/specs/2026-11-27-test-khong-roi-ve-db-chung-design.md");
  const muc = tk.split(/^## /m).find((m) => /để lại cho HT36/i.test(m.split("\n")[0])) ?? "";
  if (/\*\*A:\*\*/.test(muc) && /\*\*B:\*\*/.test(muc)) dat("thiết kế nêu đề xuất A, B cho HT36");
  else sai("thiết kế thiếu mục «để lại cho HT36» có A và B");
}

// AC-3, AC-5: chạy THẬT hai tệp trên DB của lượt (gọi dưới db/db-thu.sh … --chay), đòi 0 fail và 0 ca bỏ qua — ca bỏ qua
// vì «DB không tới» cũng cho 0 fail, nên chỉ đếm fail là xanh rỗng. `--ci`: đặt CI=true (runner CI, URL tên khác oneinvest).
// Tệp trong phạm vi chạy thật.
const TEP_CHAY = ["pipeline/import-s09-danh-ba.test.mjs", "scripts/check-freshness.test.mjs"];
function chay() {
  const ci = process.argv.includes("--ci");
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/oneinvest_suite_[a-z0-9_]+(\?|$)/.test(url)) { console.error("kiem-ht35 chay: cần DATABASE_URL của db/db-thu.sh … --chay"); process.exit(2); }
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  if (ci) env.CI = "true"; else delete env.CI;
  const r = spawnSync(process.execPath, ["--test", "--test-concurrency=1", "--test-skip-pattern=GT-AC-1", ...TEP_CHAY],
    { cwd: GOC, env, encoding: "utf8", timeout: 900_000 });
  const ra = (r.stdout || "") + (r.stderr || "");
  const so = (k) => Number((ra.match(new RegExp(`^(?:ℹ|#) ${k} (\\d+)$`, "m")) ?? [])[1] ?? NaN);
  const [tests, pass, fail, skipped] = ["tests", "pass", "fail", "skipped"].map(so);
  console.log(`${ci ? "CI=true" : "ngoài CI"} · tests ${tests} · pass ${pass} · fail ${fail} · skipped ${skipped}`);
  if (r.status !== 0 || fail !== 0) sai(`có ca đỏ hay tiến trình lỗi (exit ${r.status})`);
  else if (!(skipped === 0)) sai(`có ${skipped} ca bỏ qua — DB không tới hay rào trả URL sai`);
  else if (!(pass > 0 && pass === tests)) sai(`pass ${pass} ≠ tests ${tests}`);
  else dat(`${TEP_CHAY.length} tệp chạy đủ ${pass} ca${ci ? " khi CI=true" : ""}`);
}

const lenh = { chay, "s09-vung": s09Vung, "executor-db-thu": executorDbThu, "bang-phu": bangPhu }[process.argv[2]];
if (!lenh) { console.error("dùng: kiem-ht35.mjs chay [--ci]|s09-vung|executor-db-thu|bang-phu"); process.exit(2); }
lenh();
process.exit(loi);
