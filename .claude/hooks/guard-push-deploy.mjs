#!/usr/bin/env node
// Phần phân tích của hook PreToolUse (Bash) `guard-push-deploy.sh` — xem chú thích ở đó.
// Đọc JSON hook từ stdin, in JSON `permissionDecision: "ask"` khi lệnh:
//   - `git push` đích là main/master (hoặc không xác định được đích), hay có cờ force;
//   - `vercel` / `npx vercel` với lệnh con ghi (deploy, --prod, promote, env add…).
// Còn lại không in gì (exit 0) → luật quyền thường quyết. Không chắc → hỏi (fail-closed).
// Chạy tay: node guard-push-deploy.mjs --explain 'git push origin main'   (in quyết định + lý do)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";

const PROTECTED = new Set(["main", "master"]);
const SHELLS = new Set(["bash", "sh", "zsh", "dash"]);
// Từ đứng trước lệnh thật mà không đổi nghĩa của nó.
const PREFIX_WORDS = new Set(["time", "nohup", "command", "exec", "builtin", "nice", "caffeinate", "{", "}", "!", "then", "do", "else", "elif"]);

class Unsure extends Error {}

// ---------- tách lệnh shell thành các vế ----------
// Trả về danh sách vế; mỗi vế = { words: [{ text, dynamic }], heredocs: [body] }.
// `dynamic` = từ chứa mở rộng biến/lệnh ($, `) → giá trị không biết trước.
// Lệnh con trong $(…), `…`, <(…) được tách đệ quy và nối thêm vào danh sách vế.
function splitCommands(src) {
  const segments = [];
  let words = [];
  let heredocs = [];
  let pendingHeredocs = [];
  let cur = null; // { text, dynamic }
  let i = 0;

  const startWord = () => { if (!cur) cur = { text: "", dynamic: false }; };
  const endWord = () => { if (cur) { words.push(cur); cur = null; } };
  const endSegment = () => {
    endWord();
    if (words.length) segments.push({ words, heredocs });
    words = [];
    heredocs = [];
  };
  // Đọc tới dấu đóng khớp của $( … ) / <( … ), tính lồng ngoặc và nháy.
  const readBalanced = () => {
    let depth = 1, out = "";
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") { out += c + (src[i + 1] ?? ""); i += 2; continue; }
      if (c === "'") { const j = src.indexOf("'", i + 1); if (j < 0) throw new Unsure("nháy đơn không đóng"); out += src.slice(i, j + 1); i = j + 1; continue; }
      if (c === '"') {
        let j = i + 1;
        while (j < src.length && src[j] !== '"') j += src[j] === "\\" ? 2 : 1;
        if (j >= src.length) throw new Unsure("nháy kép không đóng");
        out += src.slice(i, j + 1); i = j + 1; continue;
      }
      // Heredoc trong $( … ): chép nguyên thân tới dòng delimiter, ngoặc trong thân không tính.
      const hd = c === "<" && src[i + 1] === "<" && src[i + 2] !== "<" && /^<<-?[ \t]*(['"]?)([A-Za-z_][\w-]*)\1/.exec(src.slice(i));
      if (hd) {
        const nl = src.indexOf("\n", i);
        if (nl < 0) throw new Unsure("heredoc không có thân");
        let j = nl + 1;
        for (;;) {
          if (j >= src.length) throw new Unsure("heredoc không đóng");
          let e = src.indexOf("\n", j);
          if (e < 0) e = src.length;
          const line = src.slice(j, e);
          j = e + 1;
          if (line.replace(/^\t+/, "") === hd[2]) break;
        }
        out += src.slice(i, Math.min(j, src.length)); i = Math.min(j, src.length);
        if (src[i - 1] !== "\n") out += "\n";
        continue;
      }
      if (c === "(") depth++;
      if (c === ")") { depth--; if (depth === 0) { i++; return out; } }
      out += c; i++;
    }
    throw new Unsure("ngoặc $( không đóng");
  };
  const readBacktick = () => {
    let out = "";
    while (i < src.length && src[i] !== "`") { if (src[i] === "\\") { out += src[i + 1] ?? ""; i += 2; continue; } out += src[i++]; }
    if (i >= src.length) throw new Unsure("backtick không đóng");
    i++;
    return out;
  };
  const nested = (body) => { for (const s of splitCommands(body)) segments.push(s); };
  // Sau xuống dòng: nuốt thân các heredoc đang chờ.
  const consumeHeredocs = () => {
    for (const h of pendingHeredocs) {
      const lines = [];
      for (;;) {
        if (i >= src.length) break;
        let j = src.indexOf("\n", i);
        if (j < 0) j = src.length;
        const line = src.slice(i, j);
        i = j + 1;
        if ((h.strip ? line.replace(/^\t+/, "") : line) === h.delim) break;
        lines.push(line);
      }
      h.target.push(lines.join("\n"));
    }
    pendingHeredocs = [];
  };

  while (i < src.length) {
    const c = src[i];
    if (c === "\n") { endSegment(); i++; if (pendingHeredocs.length) consumeHeredocs(); continue; }
    if (c === " " || c === "\t") { endWord(); i++; continue; }
    if (c === "#" && !cur) { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "\\") { if (src[i + 1] === "\n") { i += 2; continue; } startWord(); cur.text += src[i + 1] ?? ""; i += 2; continue; }
    if (c === "'") {
      startWord();
      const j = src.indexOf("'", i + 1);
      if (j < 0) throw new Unsure("nháy đơn không đóng");
      cur.text += src.slice(i + 1, j); i = j + 1; continue;
    }
    if (c === '"') {
      startWord(); i++;
      while (i < src.length && src[i] !== '"') {
        const d = src[i];
        if (d === "\\" && '"\\$`\n'.includes(src[i + 1])) { cur.text += src[i + 1]; i += 2; continue; }
        if (d === "$" && src[i + 1] === "(") { i += 2; nested(readBalanced()); cur.dynamic = true; cur.text += "$()"; continue; }
        if (d === "`") { i++; nested(readBacktick()); cur.dynamic = true; cur.text += "$()"; continue; }
        if (d === "$" && /[A-Za-z_{0-9@*#?!$-]/.test(src[i + 1] ?? "")) cur.dynamic = true;
        cur.text += d; i++;
      }
      if (i >= src.length) throw new Unsure("nháy kép không đóng");
      i++; continue;
    }
    if (c === "$" && src[i + 1] === "(") { startWord(); i += 2; nested(readBalanced()); cur.dynamic = true; cur.text += "$()"; continue; }
    if (c === "`") { startWord(); i++; nested(readBacktick()); cur.dynamic = true; cur.text += "$()"; continue; }
    if ((c === "<" || c === ">") && src[i + 1] === "(") { endWord(); i += 2; nested(readBalanced()); continue; }
    if (c === "$" && src[i + 1] === "'") { // $'…' (ANSI-C) — coi như nháy đơn
      startWord();
      const j = src.indexOf("'", i + 2);
      if (j < 0) throw new Unsure("nháy $' không đóng");
      cur.text += src.slice(i + 2, j); i = j + 1; continue;
    }
    if (c === "$") { startWord(); cur.dynamic = true; cur.text += c; i++; continue; }
    if (c === ";" || c === "&" || c === "|" || c === "(" || c === ")") {
      // `&>`/`>&` là chuyển hướng, không phải tách lệnh.
      if (c === "&" && src[i + 1] === ">") { endWord(); i += 2; if (src[i] === ">") i++; skipRedirectTarget(); continue; }
      endSegment(); i++;
      while (src[i] === ";" || src[i] === "&" || src[i] === "|") i++;
      continue;
    }
    if (c === ">" || c === "<") {
      // Số fd đứng liền trước (2>…) thuộc về chuyển hướng, không phải đối số.
      if (cur && /^\d+$/.test(cur.text) && !cur.dynamic) cur = null; else endWord();
      if (c === "<" && src[i + 1] === "<" && src[i + 2] !== "<") {
        i += 2;
        const strip = src[i] === "-";
        if (strip) i++;
        while (src[i] === " " || src[i] === "\t") i++;
        let delim = "";
        while (i < src.length && !/[\s;&|<>()]/.test(src[i])) {
          if (src[i] === "'" || src[i] === '"') { const q = src[i]; const j = src.indexOf(q, i + 1); if (j < 0) throw new Unsure("delimiter heredoc không đóng"); delim += src.slice(i + 1, j); i = j + 1; continue; }
          if (src[i] === "\\") { delim += src[i + 1] ?? ""; i += 2; continue; }
          delim += src[i++];
        }
        if (!delim) throw new Unsure("heredoc thiếu delimiter");
        pendingHeredocs.push({ delim, strip, target: heredocs });
        continue;
      }
      i++;
      while (src[i] === ">" || src[i] === "<" || src[i] === "&" || src[i] === "|") i++;
      skipRedirectTarget();
      continue;
    }
    startWord(); cur.text += c; i++;
  }
  endSegment();
  return segments;

  function skipRedirectTarget() {
    while (src[i] === " " || src[i] === "\t") i++;
    // Đích chuyển hướng là một từ; đọc bằng cách dựng tạm rồi bỏ đi.
    const saved = { words, cur };
    words = []; cur = null;
    while (i < src.length && !/[\s;&|<>()]/.test(src[i])) {
      const c = src[i];
      if (c === "'" || c === '"') { const j = src.indexOf(c, i + 1); if (j < 0) throw new Unsure("nháy không đóng"); i = j + 1; continue; }
      if (c === "$" && src[i + 1] === "(") { i += 2; nested(readBalanced()); continue; }
      if (c === "\\") { i += 2; continue; }
      i++;
    }
    words = saved.words; cur = saved.cur;
  }
}

// ---------- git ----------
function git(dir, args) {
  try {
    return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 2000 }).trim();
  } catch {
    return null;
  }
}

// Bỏ tiền tố để so tên nhánh: +, refs/heads/, refs/remotes/<remote>/.
function branchOf(ref) {
  return ref.replace(/^\+/, "").replace(/^refs\/heads\//, "").replace(/^refs\/remotes\/[^/]+\//, "");
}

// Trả về lý do cần hỏi, hoặc null nếu cho qua.
function checkGitPush(args, ctx) {
  // args = các từ sau `push`. ctx = { dir: thư mục git (null = không biết) }.
  const positional = [];
  for (let k = 0; k < args.length; k++) {
    const w = args[k];
    const t = w.text;
    if (w.dynamic) return `git push có đối số động (${t}) — không biết trước đích`;
    if (t === "--") { for (const r of args.slice(k + 1)) { if (r.dynamic) return "git push có đối số động"; positional.push(r.text); } break; }
    if (t.startsWith("--")) {
      const name = t.split("=")[0];
      if (["--all", "--branches", "--mirror"].includes(name)) return `git push ${name} đẩy cả main`;
      if (name.startsWith("--force")) return `git push ${name} (force)`;
      if (name === "--repo") return "git push --repo — không phân tích, hỏi cho chắc";
      if (["--push-option", "--receive-pack", "--exec"].includes(name) && !t.includes("=")) k++;
      continue;
    }
    if (t.startsWith("-") && t.length > 1) {
      const flags = t.slice(1);
      for (let p = 0; p < flags.length; p++) {
        const f = flags[p];
        if (f === "f") return `git push ${t} (force)`;
        if (f === "o") { if (p === flags.length - 1) k++; break; }
      }
      continue;
    }
    positional.push(t);
  }

  const refspecs = positional.slice(1);
  if (refspecs.length === 0) return checkImplicitPush(ctx);

  for (const spec of refspecs) {
    if (spec.startsWith("+")) return `refspec ${spec} là force push`;
    if (spec.includes("*")) return `refspec glob ${spec} có thể gồm main`;
    const colon = spec.indexOf(":");
    let dst;
    if (colon >= 0) {
      dst = spec.slice(colon + 1);
      if (!dst) return `refspec ${spec} — đích rỗng`;
    } else if (spec === "HEAD" || spec === "@") {
      const cur = currentBranch(ctx);
      if (cur.reason) return cur.reason;
      dst = cur.branch;
    } else {
      dst = spec;
    }
    if (dst === "HEAD" || dst === "@") return `refspec ${spec} — đích HEAD không rõ`;
    if (PROTECTED.has(branchOf(dst))) return `git push lên ${branchOf(dst)}`;
  }
  return null;
}

function currentBranch(ctx) {
  if (!ctx.dir) return { reason: "không biết thư mục git (cd/-C động) để xác định nhánh hiện tại" };
  const b = git(ctx.dir, ["symbolic-ref", "--short", "-q", "HEAD"]);
  if (!b) return { reason: `không xác định được nhánh hiện tại ở ${ctx.dir} (detached HEAD hoặc không phải repo)` };
  return { branch: b };
}

// `git push` / `git push <remote>` không refspec: đích theo push.default + upstream.
function checkImplicitPush(ctx) {
  const cur = currentBranch(ctx);
  if (cur.reason) return `git push không refspec — ${cur.reason}`;
  if (PROTECTED.has(cur.branch)) return `git push không refspec trong khi nhánh hiện tại là ${cur.branch}`;
  const mode = git(ctx.dir, ["config", "--get", "push.default"]) || "simple";
  if (mode === "matching") return "push.default=matching — git push không refspec đẩy mọi nhánh trùng tên, kể cả main";
  if (git(ctx.dir, ["config", "--get-regexp", "^remote\\..*\\.push$"])) return "có remote.<tên>.push trong config — đích không đọc được từ lệnh";
  const merge = git(ctx.dir, ["config", "--get", `branch.${cur.branch}.merge`]);
  if (merge && PROTECTED.has(branchOf(merge)) && mode !== "current") return `nhánh ${cur.branch} có upstream là ${branchOf(merge)}`;
  return null;
}

// ---------- vercel ----------
// Tuỳ chọn toàn cục nhận đối số rời (không có `=`).
const VERCEL_ARG_OPTS = new Set(["--token", "-t", "--scope", "-S", "--cwd", "--local-config", "-A", "--global-config", "-Q", "--team", "-T", "--api"]);
const VERCEL_READ_TOP = new Set(["ls", "list", "inspect", "logs", "whoami", "help"]);
// Lệnh con có hành động con: chỉ các hành động đọc được cho qua.
const VERCEL_READ_SUB = {
  env: ["ls", "list"],
  project: ["ls", "list", "inspect"],
  projects: ["ls", "list", "inspect"],
  domains: ["ls", "list", "inspect"],
  domain: ["ls", "list", "inspect"],
  alias: ["ls", "list"],
  aliases: ["ls", "list"],
  dns: ["ls", "list"],
  certs: ["ls", "list"],
  cert: ["ls", "list"],
  teams: ["ls", "list"],
  team: ["ls", "list"],
};

function checkVercel(args) {
  const positional = [];
  let infoOnly = false;
  for (let k = 0; k < args.length; k++) {
    const w = args[k];
    const t = w.text;
    if (t === "--prod" || t.startsWith("--prod=") || t === "--production") return "vercel --prod";
    if (t.startsWith("-")) {
      if (["--version", "-v", "--help", "-h"].includes(t)) infoOnly = true;
      if (VERCEL_ARG_OPTS.has(t)) k++;
      continue;
    }
    // Chỉ lệnh con và hành động con quyết định; đối số động phía sau không đổi kết luận.
    if (w.dynamic && positional.length < 2) return `vercel có đối số động (${t})`;
    positional.push({ text: t, at: k });
  }
  const [sub, action] = positional.map((p) => p.text);
  if (!sub) return infoOnly ? null : "vercel không lệnh con = deploy";
  if (VERCEL_READ_TOP.has(sub)) return null;
  if (sub === "api") return checkVercelApi(args.slice(positional[0].at + 1));
  if (sub in VERCEL_READ_SUB) {
    if (action && VERCEL_READ_SUB[sub].includes(action)) return null;
    return `vercel ${sub} ${action ?? ""}`.trim() + " — thao tác ghi hoặc không rõ";
  }
  return `vercel ${sub} — thao tác ghi hoặc không rõ`;
}

// `vercel api <endpoint>`: mặc định GET (đọc). Có thân (-F/-f/--input) hoặc -X khác GET/HEAD → ghi.
function checkVercelApi(args) {
  for (let k = 0; k < args.length; k++) {
    const w = args[k];
    const [name, inline] = w.text.split(/=(.*)/s);
    if (["-F", "--field", "-f", "--raw-field", "--input"].includes(name)) return `vercel api ${name} (có thân request = ghi)`;
    if (name === "--dangerously-skip-permissions") return "vercel api --dangerously-skip-permissions";
    if (name === "-X" || name === "--method") {
      const v = inline !== undefined ? w : args[++k];
      const m = inline !== undefined ? inline : v?.text;
      if (!v || v.dynamic || !/^(GET|HEAD)$/i.test(m ?? "")) return `vercel api ${name} ${m ?? ""}`.trim() + " — không phải GET";
      continue;
    }
    if (["-H", "--header", "--generate", "--spec-url"].includes(name) && inline === undefined) k++;
  }
  return null;
}

// ---------- duyệt từng vế ----------
function expandDir(t, base) {
  let p = t;
  if (p === "~" || p.startsWith("~/")) p = homedir() + p.slice(1);
  return isAbsolute(p) ? p : base ? resolve(base, p) : null;
}

const basename = (t) => t.slice(t.lastIndexOf("/") + 1);

// Bóc tiền tố (gán biến, env, time…, npx) để tới lệnh thật. Trả { words, viaShell }.
function stripPrefixes(words) {
  let k = 0;
  for (;;) {
    const w = words[k];
    if (!w) return words.slice(k);
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w.text)) { k++; continue; }
    if (PREFIX_WORDS.has(w.text)) { k++; continue; }
    if (basename(w.text) === "env") { k++; while (words[k] && (words[k].text.startsWith("-") || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[k].text))) k++; continue; }
    if (w.text === "sudo") { k++; while (words[k] && words[k].text.startsWith("-")) k++; continue; }
    if (w.text === "timeout") { k++; while (words[k] && words[k].text.startsWith("-")) k++; k++; continue; }
    return words.slice(k);
  }
}

// Gỡ lớp chạy gói: npx/bunx/pnpm dlx|exec/yarn dlx|exec/npm exec → từ còn lại bắt đầu bằng tên gói.
function stripRunner(words) {
  const head = basename(words[0]?.text ?? "");
  let k;
  if (head === "npx" || head === "bunx") k = 1;
  else if ((head === "pnpm" || head === "yarn") && ["dlx", "exec"].includes(words[1]?.text)) k = 2;
  else if (head === "npm" && ["exec", "x"].includes(words[1]?.text)) k = 2;
  else return words;
  while (words[k]) {
    const t = words[k].text;
    if (t === "--") { k++; break; }
    if (!t.startsWith("-")) break;
    if (["-p", "--package", "-c", "--call"].includes(t)) k++;
    k++;
  }
  return words.slice(k);
}

// `$VAR`, `${VAR}`, `$VAR/đuôi` với VAR gán tĩnh trước đó trong cùng lệnh → giá trị thật.
function resolveWord(w, vars) {
  if (!w.dynamic) return w;
  const m = /^\$(?:\{([A-Za-z_]\w*)\}|([A-Za-z_]\w*))([^$]*)$/.exec(w.text);
  const name = m && (m[1] ?? m[2]);
  return name && vars.has(name) ? { text: vars.get(name) + m[3], dynamic: false } : w;
}

function analyzeSegments(segments, state, depth) {
  if (depth > 5) return "lồng shell quá sâu";
  state.vars ??= new Map();
  for (const seg of segments) {
    const resolved = seg.words.map((w) => resolveWord(w, state.vars));
    // Vế chỉ gồm phép gán (W=/đường/dẫn) → nhớ giá trị tĩnh cho các vế sau.
    if (resolved.every((w) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(w.text))) {
      for (const w of resolved) {
        const [name, value] = w.text.split(/=(.*)/s);
        if (w.dynamic) {
          const v = resolveWord({ text: value, dynamic: true }, state.vars);
          if (v.dynamic) state.vars.delete(name); else state.vars.set(name, v.text);
        } else state.vars.set(name, value);
      }
      continue;
    }
    let words = stripPrefixes(resolved);
    if (!words.length) continue;
    const head = words[0].text;
    const name = basename(head);

    if (name === "cd" || name === "pushd") {
      const target = words.slice(1).find((w) => !w.text.startsWith("-") || w.text === "-");
      if (!target) state.dir = homedir();
      else if (target.dynamic || target.text === "-") state.dir = null;
      else state.dir = expandDir(target.text, state.dir);
      continue;
    }

    // Lớp chạy chuỗi lệnh: bash -c "…", eval "…", heredoc vào shell.
    if (SHELLS.has(name) || name === "eval") {
      let body = null;
      if (name === "eval") body = words.slice(1).map((w) => w.text).join(" ");
      else {
        const ci = words.findIndex((w, idx) => idx > 0 && /^-[a-zA-Z]*c[a-zA-Z]*$/.test(w.text));
        if (ci > 0 && words[ci + 1]) body = words[ci + 1].text;
        else if (seg.heredocs.length) body = seg.heredocs.join("\n");
        // Shell đọc lệnh từ stdin (… | bash) mà không có tệp script → không thấy nội dung.
        else if (words.slice(1).every((w) => w.text.startsWith("-")) && /\bgit\b[\s\S]*\bpush\b|\bvercel\b/.test(state.raw)) {
          return `${name} đọc lệnh từ stdin trong lệnh có git push/vercel`;
        }
      }
      if (body !== null) {
        if (/\$\(|`/.test(body) && /\b(push|vercel)\b/.test(body)) return `chuỗi lệnh trong ${name} có lệnh con động`;
        const r = analyzeSegments(splitCommands(body), { dir: state.dir, raw: body, vars: new Map(state.vars) }, depth + 1);
        if (r) return r;
      }
      continue;
    }
    if (name === "xargs" || name === "parallel" || name === "watch") {
      const rest = words.slice(1).map((w) => w.text).join(" ");
      if (/\bgit\b.*\bpush\b|\bvercel\b/.test(rest)) return `${name} chạy git push/vercel với đối số không biết trước`;
      continue;
    }

    words = stripRunner(words);
    if (!words.length) continue;
    const cmd = basename(words[0].text);

    if (cmd === "vercel" || /^vercel@/.test(cmd)) {
      const r = checkVercel(words.slice(1));
      if (r) return r;
      continue;
    }

    if (cmd === "git") {
      let dir = state.dir;
      let k = 1;
      for (; k < words.length; k++) {
        const w = words[k];
        const t = w.text;
        if (t === "-C") { const p = words[++k]; dir = !p || p.dynamic ? null : expandDir(p.text, dir); continue; }
        if (t === "-c" || t === "--config-env") { k++; continue; }
        if (["--git-dir", "--work-tree", "--namespace"].includes(t)) { k++; dir = null; continue; }
        if (/^--(git-dir|work-tree|namespace)=/.test(t)) { dir = null; continue; }
        if (t.startsWith("-")) continue;
        break;
      }
      const sub = words[k];
      if (!sub) continue;
      if (sub.dynamic) return "git với lệnh con động";
      if (sub.text !== "push") continue;
      const r = checkGitPush(words.slice(k + 1), { dir });
      if (r) return r;
    }
  }
  return null;
}

function decide(command, cwd) {
  if (!/push|vercel/.test(command)) return null; // đường nhanh
  try {
    return analyzeSegments(splitCommands(command), { dir: cwd || null, raw: command }, 0);
  } catch (e) {
    if (e instanceof Unsure) return `không phân tích được lệnh (${e.message})`;
    throw e;
  }
}

function main() {
  if (process.argv[2] === "--explain") {
    const reason = decide(process.argv[3] ?? "", process.argv[4] ?? process.cwd());
    console.log(reason ? `ask: ${reason}` : "pass");
    return;
  }
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    emitAsk("hook không đọc được input JSON");
    return;
  }
  if (input.tool_name && input.tool_name !== "Bash") return;
  const command = input.tool_input?.command;
  if (typeof command !== "string") return;
  let reason;
  try {
    reason = decide(command, input.cwd);
  } catch (e) {
    reason = `hook lỗi khi phân tích (${e.message})`;
  }
  if (reason) emitAsk(reason);
}

function emitAsk(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: `Cổng onehub: ${reason}. Push lên main và Vercel ghi cần người duyệt (guard-push-deploy).`,
    },
  }) + "\n");
}

main();
