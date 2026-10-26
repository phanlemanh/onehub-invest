#!/usr/bin/env node
// vocab.mjs — CLI của sổ từ vựng một nguồn (PL6). Sổ: khối `enums:` của pipeline/mappings.yaml.
//   --write                    sinh hằng pipeline/agent/app + khối CONTEXT.md
//   --check                    tệp sinh khớp sổ chưa (lệch → thoát 1, nêu tệp)
//   --lint                     danh sách enum viết tay ngoài sổ (đỏ → thoát 1)
//   --check-db                 DB (ref_lookup, ref_field_lookup, CHECK của `columns`) khớp sổ (DATABASE_URL)
//   --emit-seed                in SQL nạp ref_* — dán vào migration mới khi sổ đổi
//   --check-field-targets [tệp] tên trường FIELD_TARGET (G3) thuộc canonical.fields (mặc định collector/docs/field-targets.yaml; chỉ đọc)
// Chung: --root <gốc kho> (mặc định suy từ vị trí tệp) · --mappings <tệp sổ>.
// Mã thoát: 0 khớp · 1 lệch/đỏ · 2 dùng sai hoặc không chạy được.
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { checkDb, checkFieldTargets, checkTargets, emitSeed, lintTree, readMappings, renderTargets, spliceContext, VocabError } from "./lib/vocab-core.mjs";

function args(argv) {
  const o = { root: resolve(dirname(fileURLToPath(import.meta.url)), ".."), mappings: null, cmd: null, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") o.root = resolve(argv[++i]);
    else if (a === "--mappings") o.mappings = resolve(argv[++i]);
    else if (a.startsWith("--") && !o.cmd) o.cmd = a.slice(2);
    else o.rest.push(a);
  }
  return o;
}

function write(root, reg) {
  const ctxPath = join(root, "CONTEXT.md");
  const out = [];
  for (const t of renderTargets(reg)) {
    if (t.block) out.push([ctxPath, spliceContext(readFileSync(ctxPath, "utf8"), t.content)]);
    else out.push([join(root, t.path), t.content]);
  }
  // kiểm mốc CONTEXT xong mới ghi — lỗi thì không đích nào đổi
  for (const [p, c] of out) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, c);
  }
  console.log(`vocab --write: ${out.length} đích`);
  return 0;
}

function check(root, reg) {
  const lech = checkTargets(root, reg);
  const n = renderTargets(reg).length;
  if (lech.length) {
    for (const p of lech) console.error(`vocab --check: lệch sổ — ${p} (chạy node pipeline/vocab.mjs --write)`);
    console.error(`vocab --check: ${n - lech.length}/${n} đích khớp sổ`);
    return 1;
  }
  console.log(`vocab --check: ${n}/${n} đích khớp sổ`);
  return 0;
}

function lint(root, reg) {
  const kq = lintTree(root, reg);
  const dong = (h) => `${h.path}:${h.line} · ${h.axis} · ${h.codes.join(",")}`;
  for (const h of kq.hits) console.error(`vocab --lint: viết tay ngoài sổ — ${dong(h)}`);
  for (const x of kq.allowBad) console.error(`vocab --lint: enums_lint_allow thiếu reason — ${x.path} · ${x.axis}`);
  for (const x of kq.allowStale) console.error(`vocab --lint: ngoại lệ không còn khớp — ${x.path} · ${x.axis}`);
  for (const h of kq.allowed) {
    const x = reg.allow.find((a) => a.path === h.path && a.axis === h.axis);
    console.log(`vocab --lint: ngoại lệ — ${dong(h)} — ${x.reason}`);
  }
  if (kq.collectorCount) console.log(`vocab --lint: collector: ${kq.collectorCount} chỗ (không quét đỏ — làn ZCode)`);
  const nAllow = new Set(kq.allowed.map((h) => `${h.path}|${h.axis}`)).size;
  const msg = `vocab --lint: ${kq.hits.length} chỗ viết tay ngoài sổ · ngoại lệ ${nAllow}`;
  const red = kq.hits.length + kq.allowBad.length + kq.allowStale.length;
  (red ? console.error : console.log)(msg);
  return red ? 1 : 0;
}

async function checkDbCmd(root, reg) {
  const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await c.connect();
  } catch (e) {
    console.error(`vocab --check-db: không kết nối được DB — ${e.code ?? e.message}`);
    return 2;
  }
  try {
    const lech = await checkDb(c, reg);
    for (const x of lech) console.error(`vocab --check-db: ${x.msg}`);
    const nCot = reg.axes.reduce((n, a) => n + a.columns.length, 0);
    const nLookup = reg.axes.reduce((n, a) => n + a.values.length, 0);
    if (lech.length) { console.error(`vocab --check-db: ${lech.length} lệch`); return 1; }
    console.log(`vocab --check-db: ${nCot} cột · ${nLookup} lookup khớp sổ`);
    return 0;
  } finally {
    await c.end();
  }
}

function emitSeedCmd(root, reg) {
  process.stdout.write(emitSeed(reg));
  return 0;
}

function fieldTargetsCmd(root, reg, o) {
  const tep = o.rest[0] ? resolve(o.rest[0]) : join(root, "collector", "docs", "field-targets.yaml");
  if (!existsSync(tep)) {
    console.log(`vocab --check-field-targets: chưa có tệp ${tep} — không có gì để kiểm`);
    return 0;
  }
  const kq = checkFieldTargets(readFileSync(tep, "utf8"), reg);
  for (const e of kq.errors) console.error(`vocab --check-field-targets: ${e}`);
  if (!kq.ok) return 1;
  console.log(`vocab --check-field-targets: ${kq.recognized} trường khớp mappings.yaml`);
  return 0;
}

export async function main(argv = process.argv.slice(2)) {
  const o = args(argv);
  const CMDS = { write, check, lint, "check-db": checkDbCmd, "emit-seed": emitSeedCmd, "check-field-targets": fieldTargetsCmd };
  if (!o.cmd || !CMDS[o.cmd]) {
    console.error(`dùng: vocab.mjs [--root <dir>] [--mappings <tệp>] --${Object.keys(CMDS).join("|--")}`);
    return 2;
  }
  let reg;
  try {
    reg = readMappings(o.root, o.mappings ?? undefined);
  } catch (e) {
    console.error(e instanceof VocabError ? e.message : `vocab: không đọc được sổ — ${e.message}`);
    return 1;
  }
  try {
    return await CMDS[o.cmd](o.root, reg, o);
  } catch (e) {
    if (e instanceof VocabError) { console.error(e.message); return 1; }
    throw e;
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = await main();
