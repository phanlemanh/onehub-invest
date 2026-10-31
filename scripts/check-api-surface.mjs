#!/usr/bin/env node
// Kiểm TĨNH sổ bề mặt API (hồ sơ so-be-mat-api, NT4): mỗi route.ts dưới app/src/app/api khớp đúng một dòng của
// app/src/lib/api-surface.ts và cổng trong mã khớp chế độ sổ khai. Đo trạng thái cây, không đo diff.
//   node scripts/check-api-surface.mjs static    — đo cây thật (exit 0 = đạt, 1 = vi phạm)
//   node scripts/check-api-surface.mjs mutation  — bản nguyên phải ĐẠT, bảng đột biến M1–M20 phải TRƯỢT đúng thông điệp
// check-portal-compliance.mjs gọi checkApiSurface trên cây thật (làn ghim lại).
import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkDealsRoute, MUTANTS as GUARD_MUTANTS } from "./check-deals-api.mjs";

export const MSG = {
  undeclared: "chưa khai trong sổ",
  stale: "sổ trỏ route không còn",
  methods: "phương thức lệch sổ",
  publicSale: "đọc sale_offers mà sổ khai public",
  guardOrder: "cổng ops (canCallOpsApi) chạy trước pool.query",
  ops: "chế độ ops mà mã thiếu cổng",
  opsSession: "chế độ ops-session mà mã thiếu canAccessOps",
  opsSessionBearer: "chế độ ops-session mà mã nhận bearer OPS_API_TOKEN",
  admin: "chế độ admin mà mã không có isAdmin",
  adminBearer: "chế độ admin mà mã nhận bearer OPS_API_TOKEN",
  noop: "chế độ session-or-noop mà khách không nhận 204",
  kqThieu: "phương thức thiếu kiemQuyen",
  kqMode: "chế độ sổ lệch bảng quyền (kiemQuyen)",
};

// TV1 quyen-bon-vai-mot-cho: route gọi kiemQuyen(req, "<hành động>") — chế độ sổ của mỗi phương thức phải khớp dòng của
// hành động trong QUYEN_OPS (app/src/lib/ops-access.ts): ops ↔ bearer được; ops-session ↔ không bearer, vai viewer/ops;
// admin ↔ không bearer, vai admin/owner.
const OPS_ACCESS = "app/src/lib/ops-access.ts";
export function bangQuyen(files) {
  const bang = {};
  for (const m of (files[OPS_ACCESS] ?? "").matchAll(/"([a-z_.]+)":\s*\{\s*vai:\s*"(\w+)",\s*bearer:\s*(true|false)\s*\}/g)) {
    bang[m[1]] = { vai: m[2], bearer: m[3] === "true" };
  }
  return bang;
}
const thanPhuongThuc = (run, method) => {
  const i = run.search(new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`));
  if (i < 0) return "";
  const j = run.indexOf("\nexport ", i + 1);
  return run.slice(i, j < 0 ? undefined : j);
};
const hopCheDo = (mode, q) =>
  mode === "ops" ? q.bearer
  : mode === "ops-session" ? !q.bearer && ["viewer", "ops"].includes(q.vai)
  : mode === "admin" ? !q.bearer && ["admin", "owner"].includes(q.vai)
  : false;

const API_DIR = "app/src/app/api";
const routeFile = (route) => `${API_DIR}/${route}/route.ts`;

// Bỏ comment (khối + dòng) — một chú thích nhắc sale_offers không phải là đọc bảng.
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
// Mã chạy, không tính dòng import — tên hàm xuất hiện ở import không chứng minh nó được gọi.
const code = (src) =>
  stripComments(src)
    .split("\n")
    .filter((l) => !/^\s*import\s/.test(l))
    .join("\n");

const importSpecs = (src) => {
  const out = [];
  for (const m of stripComments(src).matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g)) out.push(m[1]);
  return out;
};

// Giải một import về đường tương đối gốc kho; gói ngoài (không @/ hay ./) → null.
function resolveImport(fromFile, spec, files) {
  let base;
  if (spec.startsWith("@/")) base = `app/src/${spec.slice(2)}`;
  else if (spec.startsWith(".")) base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
  else return null;
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) if (cand in files) return cand;
  return null;
}

// Bao đóng import bắc cầu (cả @/ lẫn tương đối), có tập đã thăm — import vòng không lặp vô hạn.
export function importClosure(entry, files) {
  const seen = new Set([entry]);
  const stack = [entry];
  while (stack.length) {
    const f = stack.pop();
    for (const spec of importSpecs(files[f] ?? "")) {
      const r = resolveImport(f, spec, files);
      if (r && !seen.has(r)) {
        seen.add(r);
        stack.push(r);
      }
    }
  }
  return [...seen];
}

const exportedMethods = (src) =>
  [...code(src).matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]).sort();

/** files: { "<đường gốc kho>": "<mã nguồn>" } — gồm mọi route.ts và mọi module có thể import. */
export function checkApiSurface({ entries, files }) {
  const violations = [];
  const routesOnDisk = Object.keys(files)
    .filter((f) => f.startsWith(`${API_DIR}/`) && f.endsWith("/route.ts"))
    .map((f) => f.slice(API_DIR.length + 1, -"/route.ts".length));
  const declared = new Map(entries.map((e) => [e.route, e]));

  for (const r of routesOnDisk) if (!declared.has(r)) violations.push(`${r}: ${MSG.undeclared}`);
  for (const e of entries) {
    const f = routeFile(e.route);
    if (!(f in files)) {
      violations.push(`${e.route}: ${MSG.stale}`);
      continue;
    }
    const src = files[f];
    const run = code(src);
    const got = exportedMethods(src);
    const want = [...e.methods].sort();
    if (got.join(",") !== want.join(",")) violations.push(`${e.route}: ${MSG.methods} (mã ${got.join("/")}, sổ ${want.join("/")})`);

    const closure = importClosure(f, files);
    const readsSale = closure.some((g) => /\bsale_offers\b/.test(stripComments(files[g] ?? "")));
    if (e.mode === "public" && readsSale) violations.push(`${e.route}: ${MSG.publicSale}`);

    // Route có nhắc canCallOpsApi (kể cả chỉ còn dòng import) phải gọi nó đúng khuôn AU2: await, 401, trước truy vấn.
    if (/\bcanCallOpsApi\b/.test(stripComments(src)) && !checkDealsRoute(src).ok) violations.push(`${e.route}: ${MSG.guardOrder}`);
    // Nhánh bearer: route (hoặc module nó import, trừ ops-access.ts nơi ĐỊNH NGHĨA canCallOpsApi) đọc OPS_API_TOKEN,
    // hoặc gọi canCallOpsApi(...). Sổ phải rộng bằng hoặc hơn mã: chế độ chỉ-phiên mà mã nhận bearer là sổ nói dối.
    const own = closure.filter((g) => g !== "app/src/lib/ops-access.ts");
    const bearer = own.some((g) => /\bOPS_API_TOKEN\b/.test(code(files[g] ?? ""))) || /\bcanCallOpsApi\(/.test(run);
    const sessionGate = /\bcanAccessOps\(/.test(run) || /(?<!function\s)\bisAdmin\(/.test(run);
    if (/\bkiemQuyen\(/.test(run)) {
      // Cổng một chỗ (TV1): mỗi phương thức gọi kiemQuyen, hành động của nó khớp chế độ sổ (methodModes ghi đè theo phương thức).
      const bang = bangQuyen(files);
      for (const m of got) {
        const mode = e.methodModes?.[m] ?? e.mode;
        const hds = [...thanPhuongThuc(run, m).matchAll(/\bkiemQuyen\(req,\s*"([a-z_.]+)"\)/g)].map((x) => x[1]);
        if (hds.length === 0) violations.push(`${e.route} ${m}: ${MSG.kqThieu}`);
        for (const hd of hds) {
          if (!bang[hd] || !hopCheDo(mode, bang[hd])) violations.push(`${e.route} ${m}: ${MSG.kqMode} (${hd} ↔ ${mode})`);
        }
      }
    } else {
      if (e.mode === "ops" && !(/\bcanCallOpsApi\(/.test(run) || (bearer && sessionGate))) violations.push(`${e.route}: ${MSG.ops}`);
      if (e.mode === "ops-session" && !/\bcanAccessOps\(/.test(run)) violations.push(`${e.route}: ${MSG.opsSession}`);
      // Lời gọi isAdmin(...) trong bao đóng — không tính chỗ định nghĩa `function isAdmin(` ở ops-access.ts.
      if (e.mode === "admin" && !closure.some((g) => /(?<!function\s)\bisAdmin\(/.test(code(files[g] ?? ""))))
        violations.push(`${e.route}: ${MSG.admin}`);
    }
    if (e.mode === "ops-session" && bearer) violations.push(`${e.route}: ${MSG.opsSessionBearer}`);
    if (e.mode === "admin" && bearer) violations.push(`${e.route}: ${MSG.adminBearer}`);
    if (e.mode === "session-or-noop" && !/if \(!user\) return new NextResponse\(null, \{ status: 204 \}\)/.test(run))
      violations.push(`${e.route}: ${MSG.noop}`);
  }
  return { violations, routes: routesOnDisk.length, declared: entries.length };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FS = { readdirSync, statSync, readFileSync };
// Mục biến mất giữa lúc đọc tên và lúc stat/đọc (bản đột biến tạm của test khác chạy song song vừa bị xoá) thì bỏ qua;
// lỗi khác vẫn ném — sổ bề mặt không được im lặng thiếu một tệp đọc hỏng.
const matGiuaChung = (e) => e?.code === "ENOENT";

function walk(dir, out = [], io = FS) {
  let names;
  try { names = io.readdirSync(dir); } catch (e) { if (matGiuaChung(e)) return out; throw e; }
  for (const name of names) {
    const p = path.join(dir, name);
    let st;
    try { st = io.statSync(p); } catch (e) { if (matGiuaChung(e)) continue; throw e; }
    if (st.isDirectory()) walk(p, out, io);
    // Tệp ẩn (`.on3-mut-…`, `.nt2-mut-…`) là bản đột biến tạm của test khác, không phải mã của app; thư mục ẩn vẫn quét.
    else if (name.startsWith(".")) continue;
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** Đọc mọi .ts/.tsx dưới <base>/app/src thành map đường tương đối base → mã nguồn. */
export function loadFiles(base = root, io = FS) {
  const files = {};
  for (const p of walk(path.join(base, "app/src"), [], io)) {
    let src;
    try { src = io.readFileSync(p, "utf8"); } catch (e) { if (matGiuaChung(e)) continue; throw e; }
    files[path.relative(base, p).split(path.sep).join("/")] = src;
  }
  return files;
}

export async function loadEntries() {
  const { API_SURFACE } = await import(path.join(root, "app/src/lib/api-surface.ts"));
  return API_SURFACE;
}

// Bảng đột biến viết trước (design §2). Mỗi bản trả { entries, files } hỏng, hoặc null khi không áp được.
const replaceIn = (files, file, from, to) =>
  file in files && files[file].includes(from) ? { ...files, [file]: files[file].replace(from, to) } : null;
const guardMutant = (name) => ({ entries, files }) => {
  const f = routeFile("v1/offers");
  const m = f in files ? GUARD_MUTANTS[name](files[f]) : null;
  return m === null ? null : { entries, files: { ...files, [f]: m } };
};
const SALE_ROUTE = `import { pool } from "@/lib/db";\nexport async function GET() {\n  const { rows } = await pool.query("SELECT offer_id FROM sale_offers");\n  return Response.json(rows);\n}\n`;
const pub = (route) => ({ route, methods: ["GET"], mode: "public", note: "đột biến" });

export const MUTATIONS = [
  ["M1", "thêm route mới chưa khai", MSG.undeclared, ({ entries, files }) => ({
    entries,
    files: { ...files, [routeFile("v1/moi-chua-khai")]: "export async function GET() {\n  return Response.json({});\n}\n" },
  })],
  ["M2", "sổ giữ dòng của route đã xoá", MSG.stale, ({ entries, files }) => {
    const f = routeFile("v1/markets");
    if (!(f in files)) return null;
    const rest = { ...files };
    delete rest[f];
    return { entries, files: rest };
  }],
  ["M3", "route export thêm POST mà sổ chỉ khai GET", MSG.methods, ({ entries, files }) => {
    const f = routeFile("v1/markets");
    return f in files ? { entries, files: { ...files, [f]: `${files[f]}\nexport async function POST() {\n  return Response.json({});\n}\n` } } : null;
  }],
  ["M4", "route public mới truy vấn sale_offers trực tiếp", MSG.publicSale, ({ entries, files }) => ({
    entries: [...entries, pub("v1/moi-sale")],
    files: { ...files, [routeFile("v1/moi-sale")]: SALE_ROUTE },
  })],
  ["M5", "route public import @/lib/x, x truy vấn sale_offers", MSG.publicSale, ({ entries, files }) => ({
    entries: [...entries, pub("v1/moi-qua-lib")],
    files: {
      ...files,
      [routeFile("v1/moi-qua-lib")]: `import { docTin } from "@/lib/moi-x";\nexport async function GET() {\n  return Response.json(await docTin());\n}\n`,
      "app/src/lib/moi-x.ts": SALE_ROUTE.replace("export async function GET()", "export async function docTin()"),
    },
  })],
  ["M6", "như M5 nhưng x import ./y, y truy vấn sale_offers", MSG.publicSale, ({ entries, files }) => ({
    entries: [...entries, pub("v1/moi-hai-tang")],
    files: {
      ...files,
      [routeFile("v1/moi-hai-tang")]: `import { docA } from "@/lib/moi-a";\nexport async function GET() {\n  return Response.json(await docA());\n}\n`,
      "app/src/lib/moi-a.ts": `import { docB } from "./moi-b";\nexport const docA = () => docB();\n`,
      "app/src/lib/moi-b.ts": SALE_ROUTE.replace("export async function GET()", "export async function docB()"),
    },
  })],
  ["M7", "offers bỏ cổng", MSG.guardOrder, guardMutant("bỏ cổng (giữ dòng import)")],
  ["M8", "offers gọi cổng không await", MSG.guardOrder, guardMutant("gọi cổng không await")],
  ["M9", "offers gọi cổng mà không trả 401", MSG.guardOrder, guardMutant("gọi cổng mà không return 401")],
  ["M10", "offers truy vấn trước cổng", MSG.guardOrder, guardMutant("cổng sau truy vấn")],
  ["M11", "route ops bỏ cổng kiemQuyen (không còn cổng nào)", MSG.ops, ({ entries, files }) => {
    const r = replaceIn(files, routeFile("v1/ops/coverage"), 'const q = await kiemQuyen(req, "ops.read");\n  if (!q.ok) return q.res;', "");
    return r && { entries, files: r };
  }],
  ["M12", "route ops-session (dựng mới) thiếu canAccessOps", MSG.opsSession, ({ entries, files }) => ({
    entries: [...entries, { route: "v1/moi-phien", methods: ["GET"], mode: "ops-session", note: "đột biến" }],
    files: {
      ...files,
      [routeFile("v1/moi-phien")]: `import { getSessionUser } from "@/lib/auth";\nexport async function GET() {\n  if (!(await getSessionUser())) return Response.json({}, { status: 401 });\n  return Response.json({});\n}\n`,
    },
  })],
  // M13/M15: route admin không qua kiemQuyen dựng giả — zalo-media thôi là route admin (sổ ops-session, api-surface-anh-vai-ops).
  ["M13", "route admin (dựng mới) mất isAdmin", MSG.admin, ({ entries, files }) => ({
    entries: [...entries, { route: "v1/moi-admin", methods: ["GET"], mode: "admin", note: "đột biến" }],
    files: {
      ...files,
      [routeFile("v1/moi-admin")]: `import { getSessionUser } from "@/lib/auth";\nexport async function GET() {\n  if (!(await getSessionUser())) return new Response("not found", { status: 404 });\n  return Response.json({});\n}\n`,
    },
  })],
  ["M14", "beacon bỏ nhánh 204", MSG.noop, ({ entries, files }) => {
    const r = replaceIn(
      files,
      routeFile("v1/user-events"),
      "if (!user) return new NextResponse(null, { status: 204 });",
      'if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });',
    );
    return r && { entries, files: r };
  }],
  ["M15", "route admin (dựng mới) thêm nhánh bearer", MSG.adminBearer, ({ entries, files }) => ({
    entries: [...entries, { route: "v1/moi-admin-bearer", methods: ["GET"], mode: "admin", note: "đột biến" }],
    files: {
      ...files,
      [routeFile("v1/moi-admin-bearer")]: `import { getSessionUser } from "@/lib/auth";\nimport { isAdmin } from "@/lib/ops-access";\nexport async function GET(req: Request) {\n  if (req.headers.get("authorization") === \`Bearer \${process.env.OPS_API_TOKEN}\`) return new Response("ok");\n  return isAdmin(await getSessionUser()) ? Response.json({}) : new Response("not found", { status: 404 });\n}\n`,
    },
  })],
  ["M16", "route ops-session (dựng mới) có nhánh bearer", MSG.opsSessionBearer, ({ entries, files }) => ({
    entries: [...entries, { route: "v1/moi-phien-bearer", methods: ["GET"], mode: "ops-session", note: "đột biến" }],
    files: {
      ...files,
      [routeFile("v1/moi-phien-bearer")]: `import { getSessionUser } from "@/lib/auth";\nimport { canAccessOps } from "@/lib/ops-access";\nexport async function GET(req: Request) {\n  const ok = req.headers.get("authorization") === \`Bearer \${process.env.OPS_API_TOKEN}\` || canAccessOps(await getSessionUser());\n  return ok ? Response.json({}) : Response.json({}, { status: 401 });\n}\n`,
    },
  })],
  ["M17", "route admin (zalo/accounts) kiểm hành động cho bearer", MSG.kqMode, ({ entries, files }) => {
    const r = replaceIn(files, routeFile("v1/ops/zalo/accounts"), 'kiemQuyen(req, "zalo.admin")', 'kiemQuyen(req, "ops.read")');
    return r && { entries, files: r };
  }],
  ["M18", "zalo/login DELETE bỏ kiemQuyen (phương thức khác còn)", MSG.kqThieu, ({ entries, files }) => {
    const f = routeFile("v1/ops/zalo/login");
    if (!(f in files)) return null;
    const moi = files[f].replace(
      /(export async function DELETE\(req: Request\) \{\n)  const q = await kiemQuyen\(req, "zalo\.admin"\);\n  if \(!q\.ok\) return q\.res;/,
      '$1  const q = { ok: true, actor: "x" } as const;',
    );
    return moi === files[f] ? null : { entries, files: { ...files, [f]: moi } };
  }],
  ["M19", "bảng quyền cho bearer ở zalo.admin", MSG.kqMode, ({ entries, files }) => {
    const r = replaceIn(files, OPS_ACCESS, '"zalo.admin": { vai: "admin", bearer: false }', '"zalo.admin": { vai: "admin", bearer: true }');
    return r && { entries, files: r };
  }],
  ["M20", "route ops-session (zalo-media) mất canAccessOps", MSG.opsSession, ({ entries, files }) => {
    const r = replaceIn(files, routeFile("zalo-media"), "if (!canAccessOps(user)) return", "if (!user) return");
    return r && { entries, files: r };
  }],
];

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const mode = process.argv[2] ?? "static";
  const fails = [];
  const check = (ok, msg) => {
    console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
    if (!ok) fails.push(msg);
  };
  const base = { entries: await loadEntries(), files: loadFiles() };
  const r = checkApiSurface(base);
  if (mode === "static") {
    for (const v of r.violations) check(false, v);
    check(r.violations.length === 0, `sổ bề mặt API: ${r.routes}/${r.declared} route khớp sổ (đường + phương thức)`);
  } else if (mode === "mutation") {
    check(r.violations.length === 0, `bản nguyên ĐẠT — sổ bề mặt API: ${r.routes}/${r.declared} route khớp sổ${r.violations.length ? ` (${r.violations.join("; ")})` : ""}`);
    for (const [id, name, want, mutate] of MUTATIONS) {
      const m = mutate(base);
      if (!m) {
        check(false, `${id} «${name}» không áp được lên mã hiện tại`);
        continue;
      }
      const got = checkApiSurface(m).violations;
      check(got.some((v) => v.endsWith(want) || v.includes(`: ${want}`)), `${id} «${name}» TRƯỢT với «${want}»${got.length ? "" : " (không vi phạm nào)"}`);
    }
  } else {
    console.error(`chế độ lạ: ${mode} (static | mutation)`);
    process.exit(2);
  }
  console.log(fails.length === 0 ? `\napi-surface ${mode}: ĐẠT` : `\napi-surface ${mode}: ${fails.length} lỗi`);
  process.exit(fails.length === 0 ? 0 : 1);
}

