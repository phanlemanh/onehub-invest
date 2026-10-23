#!/usr/bin/env node
// Phát lại (hồ sơ narrow-ask-rules): lấy mọi lệnh Bash có `git push` / `vercel` trong transcript
// Claude Code của dự án trên máy này, đưa qua hook thật, đếm bao nhiêu lệnh luật ask cũ
// (`git push *`, `vercel *`, `npx vercel *`) đã hỏi và hook mới còn hỏi bao nhiêu.
// Chỉ in số đếm và lý do hỏi — không in nguyên văn lệnh (có thể chứa giá trị env).
// Nhánh/cwd lúc chạy lại là trạng thái HIỆN TẠI, không phải lúc lệnh gốc chạy (xấp xỉ).
// Dùng: node guard-push-deploy.replay.mjs [thư mục projects] [--min-old N] [--min-drop PHẦN_TRĂM]
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const HOOK = join(here, "..", "guard-push-deploy.sh");
const args = process.argv.slice(2);
const minIdx = args.indexOf("--min-old");
const minOld = minIdx >= 0 ? Number(args[minIdx + 1]) : 1;
const dropIdx = args.indexOf("--min-drop");
const minDrop = dropIdx >= 0 ? Number(args[dropIdx + 1]) : 1;
const root = args.find((a, i) => !a.startsWith("--") && i !== minIdx + 1 && i !== dropIdx + 1) ?? join(homedir(), ".claude", "projects");

// Luật ask cũ khớp theo tiền tố của từng vế lệnh (xấp xỉ cách Claude Code tách lệnh ghép; dùng segs bên dưới).
const OLD_ASK = [/^git push( |$)/, /^vercel( |$)/, /^npx vercel( |$)/];
// Vế an toàn, đo độc lập với hook: lệnh nhắm RÕ vào main hay vercel ghi thì hook phải hỏi.
// Không có vế này, chỉ số «giảm %» sẽ thưởng cho một hook yếu đi.
// Xét theo vế (tách &&, ;, |, xuống dòng) sau khi bỏ thân heredoc và chuỗi trong nháy; vế phải
// BẮT ĐẦU bằng git push / vercel — chữ nằm trong chuỗi hay heredoc không tính.
const MUST_ASK = [
  /^git push\b.*\s(\+|:)?(refs\/heads\/)?(main|master)$/,
  /^git push\b.*\s\S+:(refs\/heads\/)?(main|master)$/,
  /^(npx (-y |--yes )?)?vercel\b.*(\s--prod\b|\s(deploy|promote|rollback|redeploy)\b|\senv (add|rm|pull)\b)/,
];
const unquote = (cmd) => cmd
  .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\n|$)/g, "")
  .replace(/'[^']*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""');
const segs = (cmd) => unquote(cmd).split(/&&|\|\||;|\||\n/).map((p) => p.trim().replace(/\s+\d?>.*$/, ""));
const mustAsk = (cmd) => segs(cmd).some((p) => MUST_ASK.some((re) => re.test(p)));
const oldAsks = (cmd) => segs(cmd).some((p) => OLD_ASK.some((re) => re.test(p)));

const dirs = readdirSync(root).filter((d) => d.startsWith("-Users-manhphan-dev-onehub-invest")).map((d) => join(root, d));
const seen = new Set();
const rows = [];
for (const d of dirs) {
  for (const f of readdirSync(d)) {
    if (!f.endsWith(".jsonl")) continue;
    const p = join(d, f);
    if (!statSync(p).isFile()) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      if (!line.includes('"Bash"') || !/push|vercel/.test(line)) continue;
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      for (const c of o.message?.content ?? []) {
        if (c?.type !== "tool_use" || c.name !== "Bash" || typeof c.input?.command !== "string") continue;
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        if (!/\bgit\b[\s\S]*\bpush\b|\bvercel\b/.test(c.input.command)) continue;
        rows.push({ command: c.input.command, cwd: o.cwd ?? homedir() });
      }
    }
  }
}

let old = 0, both = 0, newOnly = 0, must = 0, missed = 0;
const reasons = new Map();
for (const r of rows) {
  const payload = JSON.stringify({ tool_name: "Bash", tool_input: { command: r.command }, cwd: r.cwd });
  const out = execFileSync("bash", [HOOK], { input: payload, encoding: "utf8" }).trim();
  const asks = out.includes('"ask"');
  const o = oldAsks(r.command);
  if (o) old++;
  if (o && asks) both++;
  if (!o && asks) newOnly++;
  if (mustAsk(r.command)) { must++; if (!asks) missed++; }
  if (asks) {
    const why = JSON.parse(out).hookSpecificOutput.permissionDecisionReason
      .replace(/^Cổng onehub: /, "").replace(/ \(guard-push-deploy\)\.$|\. Push lên main.*$/, "")
      .replace(/\/[^\s)]+/g, "<đường dẫn>");
    reasons.set(why, (reasons.get(why) ?? 0) + 1);
  }
}

console.log(`[narrow-ask-rules] phát lại ${rows.length} lệnh git push/vercel từ ${dirs.length} thư mục transcript`);
console.log(`luật ask cũ hỏi: ${old}`);
console.log(`hook mới hỏi:    ${both + newOnly} (trong đó ${both} luật cũ cũng hỏi, ${newOnly} luật cũ không hỏi)`);
console.log(`giảm:            ${old - both} lần hỏi (${old ? Math.round((100 * (old - both)) / old) : 0}%)`);
console.log(`vế an toàn:      ${must} lệnh nhắm rõ main/vercel ghi → hook hỏi ${must - missed}/${must}`);
console.log("lý do hook mới còn hỏi:");
for (const [why, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${why}`);
if (old < minOld) { console.log(`FAIL: chỉ có ${old} lệnh luật cũ hỏi (< ${minOld}) — mẫu quá nhỏ`); process.exit(1); }
if (missed > 0) { console.log(`FAIL: ${missed} lệnh nhắm rõ main/vercel ghi mà hook không hỏi`); process.exit(1); }
const drop = old ? (100 * (old - both)) / old : 0;
if (drop < minDrop) { console.log(`FAIL: chỉ giảm ${Math.round(drop)}% (< ${minDrop}%)`); process.exit(1); }
console.log("REPLAY PASS");
