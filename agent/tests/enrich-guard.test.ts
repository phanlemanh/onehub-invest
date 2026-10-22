// enrich-guard.test.ts — AC-1: agent/ không còn đường ghi thẳng sale_offers/properties.
// Mọi lần ghi đi qua hàm SQL apply_enrichment (migration 033).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const AGENT_ROOT = join(import.meta.dirname, "..");
const DIRECT_WRITE = /UPDATE\s+(sale_offers|properties)\b/i;

/** Trả '<tệp>:<dòng>' cho mỗi dòng ghi thẳng vào sale_offers/properties. */
export function scanDirectWrites(files: { path: string; text: string }[]): string[] {
  const hits: string[] = [];
  for (const f of files) {
    f.text.split("\n").forEach((line, i) => {
      // Dòng comment (// hoặc * của khối /** */) không ghi gì — bỏ qua; SQL trong chuỗi vẫn bị bắt.
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      if (DIRECT_WRITE.test(line)) hits.push(`${f.path}:${i + 1}`);
    });
  }
  return hits;
}

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

const read = (paths: string[]) =>
  paths.map((p) => ({ path: relative(AGENT_ROOT, p), text: readFileSync(p, "utf8") }));

test("AC-1 không ghi thẳng", () => {
  const files = read([...tsFiles(join(AGENT_ROOT, "src")), ...tsFiles(join(AGENT_ROOT, "scripts"))]);
  assert.ok(files.length > 5, "bộ quét phải thấy tệp thật của agent/ (đối chứng dương)");
  const hits = scanDirectWrites(files);
  assert.deepEqual(hits, [], `ghi thẳng: ${hits.join(", ")}`);
});

test("AC-1 chiều đỏ: bộ quét bắt được câu ghi thẳng", () => {
  const dir = mkdtempSync(join(tmpdir(), "enrich-guard-"));
  const p = join(dir, "bad.ts");
  writeFileSync(
    p,
    "await c.query(`UPDATE sale_offers SET bedrooms = 2`);\n// UPDATE sale_offers trong comment\nUPDATE properties p SET street = 'x'\n",
  );
  const hits = scanDirectWrites([{ path: "bad.ts", text: readFileSync(p, "utf8") }]);
  assert.deepEqual(hits, ["bad.ts:1", "bad.ts:3"], "ghi thẳng: bộ quét phải gọi tên tệp:dòng");
});
