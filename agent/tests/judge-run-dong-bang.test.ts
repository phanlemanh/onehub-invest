// judge-run-dong-bang.test.ts — hồ sơ dong-bang-stage-b-resolve E2 (AC-2): Ghép căn đóng băng (V7).
// Chạy tiến trình con THẬT của scripts/judge-run.ts với DATABASE_URL trỏ cổng đóng và khoá model rỗng: lệnh phải in đúng dòng
// đóng băng rồi thoát 0 — mở DB hay gọi model là lộ ra ngay (ECONNREFUSED / lỗi khoá). Đối chứng: bản judge-run.ts của
// cây gốc vòng GOC_VONG (ghim sha, đứng yên sau khi gộp) chép cạnh scripts/ (để import tương đối còn đúng) chạy cùng lệnh thì
// đỏ. Job agent của CI checkout nông, không có sha gốc → ca đối chứng bỏ qua có tên (như judge-entity-khong-dau.test.ts).
// Chạy: cd agent && node --import tsx --test tests/judge-run-dong-bang.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { JUDGE_RUN_DONG_BANG } from "../scripts/judge-run.js";

const AGENT = join(import.meta.dirname, "..");
/** Gốc của vòng (origin/main lúc mở nhánh): bản judge-run.ts trước đóng băng. */
const GOC_VONG = "773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df";
const ENV = { ...process.env, DATABASE_URL: "postgres://127.0.0.1:1/x", ANTHROPIC_API_KEY: "", OPENAI_API_KEY: "" };

const chay = (tep: string, co: string[]) =>
  spawnSync(process.execPath, ["--import", "tsx", tep, ...co], { cwd: AGENT, env: ENV, encoding: "utf8", timeout: 60_000 });

function kiem(r: ReturnType<typeof chay>) {
  const lo = /ECONNREFUSED|connect|API key|apiKey/i.test(r.stderr ?? "");
  if (r.status !== 0 || lo || !(r.stdout ?? "").split("\n").includes(JUDGE_RUN_DONG_BANG))
    throw new Error("DBS-AC-2 judge-run còn mở DB");
}

test("DBS-AC-2 judge-run đóng băng: in một dòng, thoát 0, không mở DB, không gọi model", () => {
  assert.equal(JUDGE_RUN_DONG_BANG, "judge-run: Ghép căn đóng băng (V7) — không chấm, không gieo hay rút thẻ");
  for (const co of [[], ["--khong-llm"]]) {
    const r = chay("scripts/judge-run.ts", co);
    assert.doesNotThrow(() => kiem(r), `cờ ${co.join(" ") || "(không)"}: exit ${r.status}\n${r.stdout}\n${r.stderr}`);
  }
});

test("DBS-AC-2 đối chứng đỏ: bản judge-run.ts của gốc vòng mở DB ở cổng đóng", (t) => {
  try {
    execFileSync("git", ["cat-file", "-e", `${GOC_VONG}:agent/scripts/judge-run.ts`], { cwd: AGENT, stdio: "ignore" });
  } catch {
    return t.skip(`không có mốc ${GOC_VONG.slice(0, 8)} trong lịch sử (CI checkout nông)`);
  }
  const cu = join(AGENT, "scripts", `.judge-run-goc-${process.pid}.ts`);
  writeFileSync(cu, execFileSync("git", ["show", `${GOC_VONG}:agent/scripts/judge-run.ts`], { cwd: AGENT, encoding: "utf8" }));
  try {
    const r = chay(cu, ["--khong-llm"]);
    assert.throws(() => kiem(r), /^Error: DBS-AC-2 judge-run còn mở DB$/);
  } finally {
    rmSync(cu, { force: true });
  }
});
