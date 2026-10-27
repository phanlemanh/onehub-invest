#!/usr/bin/env node
// fixture-goc.mjs — răng của hồ sơ wanted-thanh-inquiry (AC-7, E7b). Bản chụp markup «trước vòng» của hai component trang
// Thu thập phải dựng lại được từ sha main ghi trong chính nó: lấy hai tệp ở sha đó (git show), đặt bản tạm cạnh tệp gốc
// để import tương đối còn đúng, render bằng app/tests/fixtures/tu-ngu-collections/render.tsx, so byte với bản chụp.
// Cần clone đầy đủ (có sha), không cần DB.
//
//   node _acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs          kiểm
//   node _acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs --ghi    chụp lại ở SHA_GOC (chỉ dùng trước khi sửa component)
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "app");
const DIR = path.join(APP, "src/components/ops/collections");
const FIX = path.join(APP, "tests/fixtures/tu-ngu-collections");
const SHA_GOC = "a4a47d15bdc3a9030157c6858b26cf14bcee87a0";
const TEP = { sync: "sync-activity.tsx", tiles: "collections-tiles.tsx" };

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
/** Bản chụp = dòng đầu `<!-- sha: <sha> sha256: <hex> -->` + thân. */
export function docBanChup(text) {
  const m = text.match(/^<!-- sha: ([0-9a-f]{40}) sha256: ([0-9a-f]{64}) -->\n/);
  if (!m) throw new Error("bản chụp thiếu dòng đầu sha/sha256");
  return { sha: m[1], bam: m[2], than: text.slice(m[0].length) };
}

function renderOSha(sha) {
  const tam = {};
  try {
    for (const [k, f] of Object.entries(TEP)) {
      tam[k] = path.join(DIR, `.__goc-${f}`);
      // bản tạm (dotfile) nằm ngoài include của tsconfig → tsx biên JSX kiểu cổ điển, cần React trong phạm vi — cùng lệ
      // với collections-khong-so-s02.test.tsx; dòng thêm không đổi markup.
      const goc = execFileSync("git", ["-C", ROOT, "show", `${sha}:app/src/components/ops/collections/${f}`], { encoding: "utf8" });
      writeFileSync(tam[k], 'import * as React from "react";\n' + goc);
    }
    const r = spawnSync(process.execPath, ["--import", "tsx", path.join(FIX, "render.tsx"), tam.sync, tam.tiles],
      { cwd: APP, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`render lỗi: ${r.stderr}`);
    return JSON.parse(r.stdout);
  } finally {
    for (const p of Object.values(tam)) rmSync(p, { force: true });
  }
}

function main() {
  if (process.argv.includes("--ghi")) {
    const m = renderOSha(SHA_GOC);
    for (const k of Object.keys(TEP)) {
      writeFileSync(path.join(FIX, `${k}.html`), `<!-- sha: ${SHA_GOC} sha256: ${sha256(m[k])} -->\n${m[k]}`);
      console.log(`đã chụp ${k}.html ở ${SHA_GOC.slice(0, 8)}`);
    }
    return 0;
  }
  let ma = 0;
  const banChup = Object.fromEntries(Object.keys(TEP).map((k) => [k, docBanChup(readFileSync(path.join(FIX, `${k}.html`), "utf8"))]));
  const sha = banChup.sync.sha;
  const m = renderOSha(sha);
  for (const k of Object.keys(TEP)) {
    const b = banChup[k];
    if (sha256(b.than) !== b.bam) { console.error(`lệch băm: ${k}.html`); ma = 1; continue; }
    if (m[k] !== b.than) { console.error(`lệch bản chụp: ${k}.html khác render ở ${sha.slice(0, 8)}`); ma = 1; continue; }
    console.log(`ok bản chụp khớp render ở ${sha.slice(0, 8)}: ${k}.html`);
  }
  // đối chứng: một ký tự đổi trong bản sao bản chụp → phải lệch
  const sao = banChup.sync.than.replace("Luồng", "Luông");
  if (sao === banChup.sync.than || sao === m.sync) { console.error("răng hỏng: đối chứng không đổi được bản sao"); ma = 1; }
  else console.log("đối chứng: bản sao đổi một ký tự → lệch bản chụp (đúng)");
  return ma;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
