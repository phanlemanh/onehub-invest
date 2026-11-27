#!/usr/bin/env node
// dot-bien.mjs — ghi-tam-do-sau-co-han: chạy ca của một AC trên mã thật (phải xanh), rồi trên từng bản đột biến (phải đỏ với
// thông điệp ghim). Bản đột biến là một cây chép ở thư mục tạm NGOÀI kho (agent/src, agent/tests, cấu hình, db/migrations;
// node_modules, pipeline/, scripts/ nối mềm) — không ghi tệp nào trong cây kho. Dùng: node dot-bien.mjs AC-n (cần DATABASE_URL cho ca DB).
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GOC = join(import.meta.dirname, "../../..");
const TEP_TEST = "tests/ghi-tam.test.ts";
const AC = process.argv[2];
if (!/^AC-\d+$/.test(AC ?? "")) { console.error("dùng: dot-bien.mjs AC-n"); process.exit(2); }
const E = `E${AC.slice(3)}`;

/** [AC, tên, [[tệp tương đối gốc kho, chuỗi tìm (đúng một lần), chuỗi thay], …], thông điệp ghim] */
const DB = [
  ["AC-1", "trả lại dòng loại hình của luật", [["agent/src/agents/enrich-text.ts",
    "  // NB10 AC-1: không đưa loại hình",
    "  if (context?.propertyType) ctxParts.push(`Loại hình từ nhóm: ${context.propertyType}`);\n  // NB10 AC-1: không đưa loại hình"]],
    /AC-1 ô loại=true toà=(true|false): lời nhắc còn dòng «Loại hình từ nhóm»/],
  ["AC-1", "trả lại dòng mã toà của luật", [["agent/src/agents/enrich-text.ts",
    "  // NB10 AC-1: không đưa loại hình",
    "  if (context?.buildingHint) ctxParts.push(`Mã tòa phát hiện: ${context.buildingHint}`);\n  // NB10 AC-1: không đưa loại hình"]],
    /AC-1 ô loại=(true|false) toà=true: lời nhắc còn dòng «Mã tòa phát hiện»/],
  ["AC-2", "bỏ kiểm phiếu độc lập", [["agent/src/enrich/run.ts",
    "const docLap = llmRes?.result ? phieuDocLap(llmRes.prompt) : false;", "const docLap = !!llmRes?.result;"]],
    /AC-2 tin B \(lời nhắc mang đáp án\) route corroborated/],
  ["AC-2", "bỏ dấu danh sách toà", [["agent/src/enrich/ghi-tam/doc-lap.ts",
    '  "danh sách toà",\n', ""]], /AC-2 (dấu «danh sách toà» lọt qua|tin C \(danh sách toà\) route corroborated)/],
  ["AC-3", "áp không mở lô (lượt đêm)", [["agent/src/enrich/run.ts",
    "        t.lo.push(await ganLo(c, ids, {", "        if (ids.length < 0) t.lo.push(await ganLo(c, ids, {"]],
    /AC-3 (lô của lượt lệch|đề xuất corroborated thiếu lô hoặc thiếu cờ)/],
  ["AC-3", "áp không mở lô (đọc toàn bộ)", [["agent/src/enrich/doc-toan-bo.ts",
    "        await ganLo(c, ids, { runId: o.runId, field, docLap: true,", "        if (ids.length < 0) await ganLo(c, ids, { runId: o.runId, field, docLap: true,"]],
    /AC-3 đọc toàn bộ áp mà thiếu lô/],
  ["AC-5", "rút bỏ lọc theo lô", [["db/migrations/129_ghi_tam_lo.sql",
    "FROM enrichment_proposals WHERE lo_id = p_ma AND status = 'applied';",
    "FROM enrichment_proposals WHERE offer_id IN (SELECT offer_id FROM enrichment_proposals WHERE lo_id = p_ma) AND status = 'applied';"]],
    /AC-5 (rút lô toà làm đổi loại hình — rút ngoài lô|số giá trị rút)/],
  ["AC-6", "bỏ kiểm hạn đo bù", [["db/migrations/129_ghi_tam_lo.sql",
    "AND g.han_do_bu < current_date", "AND g.han_do_bu < current_date - 100000"]],
    /AC-6 (lượt kế không rút lô quá hạn|xét hạn độc lập không rút đúng lô)/],
  ["AC-6", "ô dừng vẫn ghi", [["agent/src/enrich/run.ts",
    ': o.oDung.has(r.field) ? "o-dung" : null;', ': null;']], /AC-6 lô quá hạn vẫn ghi thêm loại hình/],
  ["AC-6", "bẫy 066: bỏ bước chạy lại 129", [["agent/tests/ghi-tam.test.ts",
    '    await c.query(await readFile(join(MIG_DIR, "129_ghi_tam_lo.sql"), "utf8"));\n', ""]],
    /AC-6 chạy lại 129 không phục hồi bản vá/],
  ["AC-6", "đọc toàn bộ bỏ xét quá hạn", [["agent/src/enrich/doc-toan-bo.ts",
    "      for (const f of await truongQuaHan(c)) oDung.add(f);\n", ""]],
    /AC-6 đọc toàn bộ vẫn ghi tạm loại hình khi lô quá hạn/],
  ["AC-7", "actor máy rút mọi đề xuất", [["db/migrations/129_ghi_tam_lo.sql",
    "WHERE e.id IS NULL OR e.lo_id IS NULL OR NOT e.ghi_tam)))", "WHERE false)))"]], /AC-7 actor máy rút được đề xuất ngoài lô/],
  ["AC-7", "đạt mà không thôi cờ", [["db/migrations/129_ghi_tam_lo.sql",
    "UPDATE enrichment_proposals SET ghi_tam = false WHERE lo_id = p_ma AND ghi_tam;", "PERFORM 1;"]],
    /AC-7 lô đạt mà giá trị còn cờ hoặc bị rút/],
  ["AC-8", "bỏ điều kiện ghi tạm ở B3", [["db/migrations/129_ghi_tam_lo.sql",
    "AND ep.status = 'applied' AND ep.ghi_tam)", "AND ep.status = 'applied' AND ep.ghi_tam AND false)"]],
    /AC-8 căn lên bậc nhờ loại hình ghi tạm/],
  ["AC-9", "áp corroborated khi ô dừng", [["agent/src/enrich/run.ts",
    ': o.oDung.has(r.field) ? "o-dung" : null;', ': null;']], /AC-9 áp corroborated khi ô dừng/],
];

function banChep() {
  const goc = mkdtempSync(join(tmpdir(), "nb10-dot-bien-"));
  for (const d of ["agent/src", "agent/tests", "agent/config", "db/migrations"]) cpSync(join(GOC, d), join(goc, d), { recursive: true });
  for (const t of ["agent/package.json", "agent/tsconfig.json"]) cpSync(join(GOC, t), join(goc, t));
  symlinkSync(join(GOC, "agent/node_modules"), join(goc, "agent/node_modules"));
  // agent nạp mã pipeline (eval-labels, eval-classify…) và scripts; không đột biến chúng nên nối mềm (soát M5 @b191078df).
  for (const d of ["pipeline", "scripts"]) symlinkSync(join(GOC, d), join(goc, d));
  return goc;
}
function chayTest(goc) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", `--test-name-pattern=^${E} ${AC} `, TEP_TEST],
    { cwd: join(goc, "agent"), env: process.env, encoding: "utf8", maxBuffer: 64 << 20 });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const so = (out, k) => Number(new RegExp(`ℹ ${k} (\\d+)`).exec(out)?.[1] ?? 0);

const that = chayTest(GOC);
if (that.code !== 0 || so(that.out, "pass") === 0 || so(that.out, "skipped") > 0) {
  console.log(`ĐỎ ${AC} trên mã thật (thoát ${that.code}, pass ${so(that.out, "pass")}, skipped ${so(that.out, "skipped")}):\n${that.out.slice(-3000)}`);
  process.exit(1);
}
console.log(`xanh ${AC} trên mã thật: tests ${so(that.out, "tests")}, skipped ${so(that.out, "skipped")}`);
let hong = 0;
for (const [ac, ten, sua, ghim] of DB.filter((d) => d[0] === AC)) {
  const goc = banChep();
  try {
    for (const [t, a, b] of sua) {
      const p = join(goc, t), s = readFileSync(p, "utf8");
      if (s.split(a).length !== 2) throw new Error(`đột biến «${ten}»: không thấy đúng một chỗ «${a.slice(0, 60)}» trong ${t}`);
      writeFileSync(p, s.replace(a, b));
    }
    const r = chayTest(goc);
    if (r.code === 0) { console.log(`HỎNG đột biến «${ten}»: thước vẫn xanh`); hong++; }
    else if (!ghim.test(r.out)) { console.log(`HỎNG đột biến «${ten}»: đỏ nhưng không có thông điệp ghim ${ghim}\n${r.out.slice(-2000)}`); hong++; }
    else console.log(`đỏ đúng ${ac} «${ten}»: ${ghim.exec(r.out)[0]}`);
  } finally {
    rmSync(goc, { recursive: true, force: true });
  }
}
process.exit(hong ? 1 : 0);
