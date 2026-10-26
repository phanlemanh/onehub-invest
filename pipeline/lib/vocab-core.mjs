// vocab-core.mjs — PL6 sổ từ vựng một nguồn (phần thuần: đọc sổ, kiểm khuôn).
// Sổ = khối `enums:` của pipeline/mappings.yaml theo khuôn RESO Lookup/RelatedLookup (ADR-0013 §8).
// Không I/O ở đây ngoài readMappings; CLI là pipeline/vocab.mjs.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

export class VocabError extends Error {
  constructor(message, axis = null, code = null) {
    super(message);
    this.name = "VocabError";
    this.axis = axis;
    this.code = code;
  }
}

const CODE_RE = /^[a-z][a-z0-9_]*$|^[A-Z][0-9]$/;

/** Đọc chuỗi YAML của mappings.yaml → Register (chưa kiểm khuôn; gọi validateRegister). */
export function loadRegister(yamlText) {
  const doc = YAML.parse(yamlText) ?? {};
  const enums = doc.enums ?? {};
  const axes = [];
  for (const [name, a] of Object.entries(enums)) {
    if (a && "values_from" in a) continue; // `source` lấy từ source_registry.code — không phải lookup của sổ
    const axisLocal = a?.local === true;
    axes.push({
      name,
      term_vi: a?.term_vi,
      dd_field: a?.dd_field ?? null,
      columns: Array.isArray(a?.columns) ? a.columns : a?.columns,
      nullable: a?.nullable === true,
      local: axisLocal,
      rationale: a?.rationale,
      checked_on: a?.checked_on,
      values: (a?.values ?? []).map((v) => ({
        code: v?.code,
        label_vi: v?.label_vi,
        dd_lookup: v?.dd_lookup,
        local: v?.local === true || (axisLocal && !v?.dd_lookup && v?.local !== false),
        localKhai: v?.local === true,
        rationale: v?.rationale ?? (axisLocal ? a?.rationale : undefined),
        checked_on: v?.checked_on ?? a?.checked_on,
      })),
    });
  }
  const allow = (doc.enums_lint_allow ?? []).map((x) => ({ path: x?.path, axis: x?.axis, reason: x?.reason }));
  const canonicalFields = Object.keys(doc.canonical?.fields ?? {});
  return { axes, allow, canonicalFields };
}

/** Kiểm khuôn sổ; ném VocabError nêu trục + code đầu tiên sai. */
export function validateRegister(reg) {
  const cotCuaTruc = new Map();
  for (const a of reg.axes) {
    const loi = (msg, code = null) => {
      throw new VocabError(`sổ từ vựng: trục ${a.name}${code != null ? ` · ${code}` : ""}: ${msg}`, a.name, code);
    };
    if (!a.term_vi) loi("thiếu term_vi");
    if (!Array.isArray(a.columns)) loi("columns phải là danh sách (có thể rỗng)");
    if (!a.values.length) loi("không có giá trị nào");
    if (a.local && !a.rationale) loi("trục local thiếu rationale");
    for (const col of a.columns) {
      if (!/^[a-z_]+\.[a-z_]+$/.test(col)) loi("cột phải dạng bảng.cột", col);
      if (cotCuaTruc.has(col)) loi(`cột đã khai ở trục ${cotCuaTruc.get(col)}`, col);
      cotCuaTruc.set(col, a.name);
    }
    const thay = new Set();
    for (const v of a.values) {
      const code = v.code;
      if (typeof code !== "string" || !CODE_RE.test(code)) loi("code sai khuôn (chữ thường snake_case hoặc mã bậc như P1)", String(code));
      if (thay.has(code)) loi("code trùng trong trục", code);
      thay.add(code);
      if (!v.label_vi) loi("thiếu label_vi", code);
      if (v.label_vi !== v.label_vi.normalize("NFC")) loi("label_vi không ở dạng NFC", code);
      if (v.localKhai && v.dd_lookup) loi("vừa dd_lookup vừa local", code);
      if (!v.dd_lookup && !v.local) loi("cần dd_lookup hoặc local: true", code);
      if (v.local && !v.rationale) loi("local thiếu rationale", code);
      if (v.local && !v.checked_on) loi("local thiếu checked_on", code);
    }
  }
  for (const x of reg.allow) {
    if (!x.path || !x.axis) throw new VocabError(`enums_lint_allow: mục thiếu path/axis (${x.path ?? "?"})`, x.axis);
  }
}

/** Đọc + kiểm sổ từ gốc kho (hoặc tệp chỉ định). */
export function readMappings(root, mappingsPath = join(root, "pipeline", "mappings.yaml")) {
  const reg = loadRegister(readFileSync(mappingsPath, "utf8"));
  validateRegister(reg);
  return reg;
}

// ---------------------------------------------------------------------------------------------------------------------
// Bộ sinh — bốn đích. Thứ tự trục/giá trị = thứ tự trong sổ; luôn `\n`, kết thúc một `\n`.

export const HEADER = "// MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write";
export const BEGIN = "<!-- VOCAB:BEGIN -->";
export const END = "<!-- VOCAB:END -->";
export const TARGETS = {
  pipeline: "pipeline/lib/vocab.generated.mjs",
  agent: "agent/src/vocab.generated.ts",
  app: "app/src/lib/vocab.generated.ts",
  context: "CONTEXT.md",
};

const hang = (axis) => axis.toUpperCase();
const kieu = (axis) => axis.replace(/(^|_)([a-z])/g, (_, __, c) => c.toUpperCase());
const q = (s) => JSON.stringify(s);
const mangCode = (a) => `[${a.values.map((v) => q(v.code)).join(", ")}]`;
const objCode = (a) => `{ ${a.values.map((v) => `${v.code}: ${q(v.code)}`).join(", ")} }`;

function renderJs(reg) {
  const L = [HEADER, "// Sổ từ vựng một nguồn (PL6) — hằng cho pipeline/ và scripts/.", ""];
  L.push("export const VOCAB = Object.freeze({");
  for (const a of reg.axes) L.push(`  ${a.name}: Object.freeze(${mangCode(a)}),`);
  L.push("});", "");
  for (const a of reg.axes) L.push(`export const ${hang(a.name)} = Object.freeze(${objCode(a)});`);
  L.push("", `export const CANONICAL_FIELDS = Object.freeze([${reg.canonicalFields.map(q).join(", ")}]);`, "");
  L.push("/** Danh sách code nối bằng `|` — cho chuỗi enum trong prompt LLM. */");
  L.push("export function promptEnum(axis) {", "  return VOCAB[axis].join(\"|\");", "}", "");
  return L.join("\n");
}

function renderTs(reg, { labels }) {
  const L = [HEADER, `// Sổ từ vựng một nguồn (PL6) — hằng cho ${labels ? "app/" : "agent/"}.`, ""];
  L.push("export const VOCAB = {");
  for (const a of reg.axes) L.push(`  ${a.name}: ${mangCode(a)},`);
  L.push("} as const;", "", "export type VocabAxis = keyof typeof VOCAB;");
  for (const a of reg.axes) L.push(`export type ${kieu(a.name)} = (typeof VOCAB.${a.name})[number];`);
  L.push("");
  for (const a of reg.axes) L.push(`export const ${hang(a.name)} = ${objCode(a)} as const;`);
  L.push("", `export const CANONICAL_FIELDS = [${reg.canonicalFields.map(q).join(", ")}] as const;`, "");
  if (labels) {
    L.push("/** Nhãn tiếng Việt từng giá trị (label_vi của sổ). */");
    L.push("export const LABELS_VI = {");
    for (const a of reg.axes) {
      L.push(`  ${a.name}: { ${a.values.map((v) => `${v.code}: ${q(v.label_vi)}`).join(", ")} },`);
    }
    L.push("} as const satisfies Record<VocabAxis, Record<string, string>>;", "");
  }
  L.push("/** Danh sách code nối bằng `|` — cho chuỗi enum trong prompt LLM. */");
  L.push("export function promptEnum(axis: VocabAxis): string {", "  return VOCAB[axis].join(\"|\");", "}", "");
  return L.join("\n");
}

function renderContextBlock(reg) {
  const L = [BEGIN, "<!-- MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write -->", ""];
  L.push("| Thuật ngữ | Code | RESO | Cột bị ràng | Giá trị (code «nhãn») |", "|---|---|---|---|---|");
  for (const a of reg.axes) {
    const reso = a.dd_field ?? "local";
    const cot = a.columns.length ? a.columns.map((c) => `\`${c}\``).join(", ") : "—";
    const gt = a.values.map((v) => `\`${v.code}\` «${v.label_vi}»`).join(" · ");
    L.push(`| ${a.term_vi} | \`${a.name}\` | ${reso} | ${cot} | ${gt} |`);
  }
  L.push("", END);
  return L.join("\n");
}

/** Bốn đích; đích CONTEXT mang nội dung KHỐI (BEGIN…END), không phải cả tệp. */
export function renderTargets(reg) {
  return [
    { path: TARGETS.pipeline, content: renderJs(reg) },
    { path: TARGETS.agent, content: renderTs(reg, { labels: false }) },
    { path: TARGETS.app, content: renderTs(reg, { labels: true }) },
    { path: TARGETS.context, content: renderContextBlock(reg), block: true },
  ];
}

/** Thay khối giữa hai mốc; ném khi thiếu mốc (không chèn lặng). */
export function spliceContext(text, block) {
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) throw new VocabError(`CONTEXT.md thiếu mốc VOCAB (${BEGIN} … ${END})`);
  return text.slice(0, i) + block + text.slice(j + END.length);
}

/** Đường các đích lệch sổ (so với nội dung sinh lại). */
export function checkTargets(root, reg, read = (p) => readFileSync(join(root, p), "utf8")) {
  const lech = [];
  for (const t of renderTargets(reg)) {
    let cur;
    try { cur = read(t.path); } catch { lech.push(t.path); continue; }
    if (t.block) {
      const i = cur.indexOf(BEGIN);
      const j = cur.indexOf(END);
      if (i < 0 || j < 0 || cur.slice(i, j + END.length) !== t.content) lech.push(t.path);
    } else if (cur !== t.content) lech.push(t.path);
  }
  return lech;
}

// ---------------------------------------------------------------------------------------------------------------------
// Lint — tìm danh sách enum viết tay ngoài sổ. Một «chỗ viết tay» = một nhóm literal chứa ≥2 code khác nhau của
// cùng một trục. Nhóm: cặp ngoặc trong cùng ([] () và {} của object); literal trong khối lệnh `{…}` hoặc ngoài mọi ngoặc
// gom theo dòng. Trong nội dung một literal: chuỗi nối `a|b` và danh sách SQL `('a','b')` / `ARRAY['a','b']` là nhóm
// riêng. Khoá object chưa nháy chỉ tính khi object là map nhãn (mọi giá trị là chuỗi literal). Comment bị bỏ.
// Nhóm mà quá nửa phần tử chuỗi KHÔNG phải code của trục (danh sách cột, dữ liệu mẫu) không phải danh sách của trục.

const PIPE_SEQ = /[A-Za-z0-9_]+(?:\|[A-Za-z0-9_]+)+/g;
const QUOTED_PIPE = /(["'])[A-Za-z0-9_]+\1(?:\s*\|\s*(["'])[A-Za-z0-9_]+\2)+/g;
const SQL_LIST = /[([]\s*'[^'\n]*'(?:\s*(?:::\s*[a-z]+)?\s*,\s*'[^'\n]*')+/g;
const REGEX_PREV = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "return", "typeof", "=>", "+", "-", "*", "%", "<", ">", "~", "^"]);
const BLOCK_PREV = new Set([")", "=>", "{", "}", ";", "else", "try", "finally", "do", null]);

/** Tách token JS/TS: {t:'str'|'id'|'p', v, line}. Comment bỏ; template literal → một token str (phần tĩnh). */
function tokenizeJs(src) {
  const out = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  const prevSig = () => (out.length ? out[out.length - 1] : null);
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; }
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const start = line;
      let v = "";
      i++;
      while (i < n && src[i] !== c && src[i] !== "\n") { if (src[i] === "\\") { v += src[i + 1] ?? ""; i += 2; } else v += src[i++]; }
      i++;
      out.push({ t: "str", v, line: start });
      continue;
    }
    if (c === "`") {
      const start = line;
      let v = "";
      i++;
      let depth = 0;
      while (i < n) {
        const ch = src[i];
        if (depth === 0 && ch === "`") { i++; break; }
        if (ch === "\n") line++;
        if (depth === 0 && ch === "\\") { v += src[i + 1] ?? ""; i += 2; continue; }
        if (depth === 0 && ch === "$" && src[i + 1] === "{") { depth = 1; v += "\u0000"; i += 2; continue; }
        if (depth > 0) {
          if (ch === "{") depth++;
          else if (ch === "}") depth--;
          i++;
          continue;
        }
        v += ch;
        i++;
      }
      out.push({ t: "str", v, line: start });
      continue;
    }
    if (c === "/") {
      const p = prevSig();
      const isRegex = !p || (p.t === "p" && REGEX_PREV.has(p.v)) || (p.t === "id" && REGEX_PREV.has(p.v));
      if (isRegex) {
        i++;
        let inClass = false;
        while (i < n && src[i] !== "\n") {
          const ch = src[i];
          if (ch === "\\") { i += 2; continue; }
          if (ch === "[") inClass = true;
          else if (ch === "]") inClass = false;
          else if (ch === "/" && !inClass) { i++; break; }
          i++;
        }
        while (i < n && /[a-z]/i.test(src[i])) i++;
        out.push({ t: "p", v: "regex", line });
        continue;
      }
    }
    if (/[A-Za-z_$]/.test(c)) {
      let v = "";
      while (i < n && /[A-Za-z0-9_$]/.test(src[i])) v += src[i++];
      out.push({ t: "id", v, line });
      continue;
    }
    if (c === "=" && src[i + 1] === ">") { out.push({ t: "p", v: "=>", line }); i += 2; continue; }
    out.push({ t: "p", v: c, line });
    i++;
  }
  return out;
}

// SQL: bỏ comment «--» và khối comment, giữ số dòng.
function stripSqlComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/--[^\n]*/g, "");
}

function codeIndex(reg) {
  const m = new Map();
  for (const a of reg.axes) for (const v of a.values) {
    if (!m.has(v.code)) m.set(v.code, []);
    m.get(v.code).push(a.name);
  }
  return m;
}

/** Danh sách nhóm con trong nội dung một literal: chuỗi nối `a|b`, danh sách SQL. */
function subGroups(content) {
  const gs = [];
  for (const m of content.matchAll(PIPE_SEQ)) gs.push(m[0].split("|"));
  for (const m of content.matchAll(QUOTED_PIPE)) gs.push([...m[0].matchAll(/["']([A-Za-z0-9_]+)["']/g)].map((x) => x[1]));
  for (const m of content.matchAll(SQL_LIST)) gs.push([...m[0].matchAll(/'([^'\n]*)'/g)].map((x) => x[1]));
  return gs;
}

/** Chỗ viết tay trong một văn bản. */
export function scanText(text, path, reg) {
  const idx = codeIndex(reg);
  const groups = []; // {line, items: [{code, line}]}
  const addSub = (content, line) => {
    for (const g of subGroups(content)) groups.push({ n: g.length, items: g.map((code) => ({ code, line })) });
  };
  if (path.endsWith(".sql")) {
    const src = stripSqlComments(text);
    let line = 1;
    for (const m of src.matchAll(SQL_LIST)) {
      line = src.slice(0, m.index).split("\n").length + (m[0].slice(0, m[0].indexOf("'")).split("\n").length - 1);
      const items = [...m[0].matchAll(/'([^'\n]*)'/g)].map((x) => ({ code: x[1], line }));
      groups.push({ n: items.length, items });
    }
  } else {
    const toks = tokenizeJs(text);
    const stack = []; // {kind, block, items, keys, labelMap}
    const lineGroups = new Map();
    const lineGroup = (l) => { if (!lineGroups.has(l)) lineGroups.set(l, { n: 0, items: [] }); return lineGroups.get(l); };
    const finalize = (g) => {
      if (g.kind === "{" && !g.block && g.labelMap && g.keys.length) { g.items.push(...g.keys); g.n += g.keys.length; }
      groups.push(g);
    };
    for (let k = 0; k < toks.length; k++) {
      const tk = toks[k];
      const prev = toks[k - 1] ?? null;
      const next = toks[k + 1] ?? null;
      const top = stack[stack.length - 1];
      if (tk.t === "p" && (tk.v === "(" || tk.v === "[" || tk.v === "{")) {
        const block = tk.v === "{" && (prev == null || BLOCK_PREV.has(prev.v) || (prev.t === "id" && ["else", "try", "finally", "do"].includes(prev.v)));
        stack.push({ kind: tk.v, block, n: 0, items: [], keys: [], labelMap: true });
        continue;
      }
      if (tk.t === "p" && (tk.v === ")" || tk.v === "]" || tk.v === "}")) {
        const g = stack.pop();
        if (g) finalize(g);
        continue;
      }
      const isKey = top && top.kind === "{" && !top.block && next && next.t === "p" && next.v === ":" && prev && prev.t === "p" && (prev.v === "{" || prev.v === ",");
      if (isKey && (tk.t === "id" || tk.t === "str")) {
        const val = toks[k + 2];
        if (!val || val.t !== "str") top.labelMap = false;
        top.keys.push({ code: tk.v, line: tk.line });
        k++; // bỏ dấu ':'
        if (val && val.t === "str") {
          // giá trị là nhãn → không tính phần tử; giá trị là code ({s: 'sale'}) → phần tử của nhóm
          addSub(val.v, val.line);
          if (idx.has(val.v)) { top.items.push({ code: val.v, line: val.line }); top.n++; }
          k++;
        }
        continue;
      }
      if (tk.t !== "str") continue;
      addSub(tk.v, tk.line);
      const target = !top || top.block ? lineGroup(tk.line) : top;
      target.items.push({ code: tk.v, line: tk.line });
      target.n++;
    }
    while (stack.length) finalize(stack.pop());
    groups.push(...lineGroups.values());
  }
  const hits = [];
  for (const g of groups) {
    const perAxis = new Map();
    for (const it of g.items) {
      for (const axis of idx.get(it.code) ?? []) {
        if (!perAxis.has(axis)) perAxis.set(axis, []);
        const arr = perAxis.get(axis);
        if (!arr.some((x) => x.code === it.code)) arr.push(it);
      }
    }
    for (const [axis, arr] of perAxis) {
      const soCode = g.items.filter((it) => (idx.get(it.code) ?? []).includes(axis)).length;
      if (arr.length >= 2 && soCode * 2 >= g.n) hits.push({ path, line: Math.min(...arr.map((x) => x.line)), axis, codes: arr.map((x) => x.code) });
    }
  }
  const key = (h) => `${h.path}:${h.line}:${h.axis}:${h.codes.join(",")}`;
  const seen = new Set();
  return hits.filter((h) => (seen.has(key(h)) ? false : (seen.add(key(h)), true))).sort((a, b) => a.line - b.line || a.axis.localeCompare(b.axis));
}

export const LINT_DIRS = ["pipeline", "agent/src", "app/src", "data-api/src", "scripts"];
export const LINT_SKIP_FILES = new Set(["scripts/pre-merge-check.sh", "scripts/product-map.mjs", "scripts/check-lo-trinh.sh"]);
const LINT_EXT = /\.(mjs|js|ts|tsx|sql)$/;
const SKIP_DIR = new Set(["node_modules", ".next", "dist", "tests", "__fixtures__", "fixtures"]);
// Mã cài từ registry (shadcn/ReUI) — không sửa tay (AGENTS.md khối ReUI), cùng nếp tệp chép từ kit.
export const LINT_SKIP_DIRS = new Set(["app/src/components/ui", "app/src/components/reui", "app/src/components/blocks"]);
const SKIP_FILE = /\.generated\.|\.test\.|\.itest\./;

function* walkFiles(root, rel) {
  let entries;
  try { entries = readdirSync(join(root, rel), { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name) && !LINT_SKIP_DIRS.has(p)) yield* walkFiles(root, p); }
    else if (LINT_EXT.test(e.name) && !SKIP_FILE.test(e.name) && !LINT_SKIP_FILES.has(p)) yield p;
  }
}

/** Lint cả cây: hits đỏ, allowed (khớp ngoại lệ), allowBad (thiếu reason), allowStale (không còn khớp). */
export function lintTree(root, reg) {
  const all = [];
  for (const d of LINT_DIRS) for (const p of walkFiles(root, d)) all.push(...scanText(readFileSync(join(root, p), "utf8"), p, reg));
  let collectorCount = 0;
  for (const p of walkFiles(root, "collector")) collectorCount += scanText(readFileSync(join(root, p), "utf8"), p, reg).length;
  const allowBad = reg.allow.filter((x) => !x.reason || !String(x.reason).trim());
  const okAllow = reg.allow.filter((x) => !allowBad.includes(x));
  const match = (h, x) => h.path === x.path && h.axis === x.axis;
  const allowed = all.filter((h) => okAllow.some((x) => match(h, x)));
  const hits = all.filter((h) => !okAllow.some((x) => match(h, x)));
  const allowStale = okAllow.filter((x) => !all.some((h) => match(h, x)));
  return { hits, allowed, allowBad, allowStale, collectorCount };
}

// ---------------------------------------------------------------------------------------------------------------------
// DB — bảng tra ref_lookup (RESO Lookup) + ref_field_lookup (RelatedLookup) và CHECK của các cột khai trong `columns`.

const sqlStr = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

/** SQL nạp ref_* từ sổ (idempotent) — dán vào migration khi sổ đổi. */
export function emitSeed(reg) {
  const rows = reg.axes.flatMap((a) => a.values.map((v, i) =>
    `  (${sqlStr(a.name)}, ${sqlStr(v.code)}, ${sqlStr(v.dd_lookup ?? null)}, ${sqlStr(v.label_vi)}, ${v.local ? "true" : "false"}, ${i + 1})`));
  const rel = reg.axes.flatMap((a) => a.columns.map((col) => {
    const [t, c] = col.split(".");
    return `  (${sqlStr(t)}, ${sqlStr(c)}, ${sqlStr(a.name)})`;
  }));
  return [
    "INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES",
    rows.join(",\n"),
    "ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,",
    "  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;",
    "",
    "INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES",
    rel.join(",\n"),
    "ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;",
    "",
  ].join("\n");
}

/** So DB với sổ; trả danh sách lệch {axis, value?, column?, msg}. Rỗng = khớp. */
export async function checkDb(client, reg) {
  const lech = [];
  const can = "cần migration mới";
  const coBang = (await client.query("SELECT to_regclass('ref_lookup') AS a, to_regclass('ref_field_lookup') AS b")).rows[0];
  if (!coBang.a || !coBang.b) {
    lech.push({ axis: null, msg: `thiếu bảng ref_lookup/ref_field_lookup — ${can} (043)` });
  } else {
    const rows = (await client.query("SELECT lookup_name, lookup_value, standard_lookup_value, label_vi, is_local FROM ref_lookup")).rows;
    const key = (a, v) => `${a}|${v}`;
    const db = new Map(rows.map((r) => [key(r.lookup_name, r.lookup_value), r]));
    const so = new Set();
    for (const a of reg.axes) for (const v of a.values) {
      const k = key(a.name, v.code);
      so.add(k);
      const r = db.get(k);
      if (!r) lech.push({ axis: a.name, value: v.code, msg: `ref_lookup thiếu ${a.name} · ${v.code} — ${can}` });
      else if (r.label_vi !== v.label_vi || (r.standard_lookup_value ?? null) !== (v.dd_lookup ?? null) || r.is_local !== (v.local === true)) {
        lech.push({ axis: a.name, value: v.code, msg: `ref_lookup lệch sổ ở ${a.name} · ${v.code} (nhãn/RESO/local) — ${can}` });
      }
    }
    for (const r of rows) {
      const k = key(r.lookup_name, r.lookup_value);
      if (!so.has(k)) lech.push({ axis: r.lookup_name, value: r.lookup_value, msg: `ref_lookup thừa ${r.lookup_name} · ${r.lookup_value} (sổ không còn) — ${can}` });
    }
    const rel = new Map((await client.query("SELECT table_name, column_name, lookup_name FROM ref_field_lookup")).rows
      .map((r) => [`${r.table_name}.${r.column_name}`, r.lookup_name]));
    for (const a of reg.axes) for (const col of a.columns) {
      if (rel.get(col) !== a.name) lech.push({ axis: a.name, column: col, msg: `ref_field_lookup thiếu/lệch ${col} → ${a.name} — ${can}` });
    }
  }
  for (const a of reg.axes) for (const col of a.columns) {
    const [t, cot] = col.split(".");
    const defs = (await client.query(
      `SELECT conname, convalidated, pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE contype = 'c' AND conrelid = to_regclass($1)`, [t])).rows
      .filter((r) => new RegExp(`\\b${cot}\\b`).test(r.def) && /'[^']*'::text/.test(r.def));
    if (!defs.length) { lech.push({ axis: a.name, column: col, msg: `${col}: thiếu CHECK theo trục ${a.name} — ${can}` }); continue; }
    const r = defs[0];
    const trongDb = new Set([...r.def.matchAll(/'([^']*)'::text/g)].map((m) => m[1]));
    const trongSo = new Set(a.values.map((v) => v.code));
    const thieu = [...trongSo].filter((x) => !trongDb.has(x));
    const thua = [...trongDb].filter((x) => !trongSo.has(x));
    if (thieu.length || thua.length) {
      lech.push({ axis: a.name, column: col, msg: `${col} (${r.conname}): CHECK lệch sổ — thiếu [${thieu.join(", ")}] thừa [${thua.join(", ")}] — ${can}` });
    }
    if (!r.convalidated) lech.push({ axis: a.name, column: col, msg: `${col} (${r.conname}): CHECK chưa VALIDATE — ${can}` });
  }
  return lech;
}
