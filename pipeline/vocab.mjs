#!/usr/bin/env node
// vocab.mjs — CLI của sổ từ vựng một nguồn (PL6). Sổ: khối `enums:` của pipeline/mappings.yaml.
//   --write                    sinh hằng pipeline/agent/app + khối CONTEXT.md
//   --check                    tệp sinh khớp sổ chưa (lệch → thoát 1, nêu tệp)
// Chung: --root <gốc kho> (mặc định suy từ vị trí tệp) · --mappings <tệp sổ>.
// Mã thoát: 0 khớp · 1 lệch/đỏ · 2 dùng sai hoặc không chạy được.
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkTargets, readMappings, renderTargets, spliceContext, VocabError } from "./lib/vocab-core.mjs";

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

export async function main(argv = process.argv.slice(2)) {
  const o = args(argv);
  const CMDS = { write, check };
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
