// entrypoint-symlink.test.mjs — vòng loi-vao-script-chay-qua-symlink: lối vào script chạy được khi gọi qua
// symlink. launchd gọi mọi job qua ~/dev/one-invest → onehub-invest; Node giải symlink cho import.meta.url
// còn argv[1] giữ đường gõ — so chuỗi thô thì main() không chạy và thoát 0 im lặng (đêm 24/10).
// Không ghi DB: tệp cần DB chạy với DATABASE_URL trỏ cổng 9 (không ai nghe) → phải thoát ≠ 0 kèm ECONNREFUSED.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { after, test } from "node:test";

const ROOT = join(import.meta.dirname, "../..");
const DEAD_DB = "postgres://127.0.0.1:9/x";
const TSX = join(ROOT, "agent/node_modules/.bin/tsx");

const tmp = mkdtempSync(join(tmpdir(), "loi-vao-"));
const LINK = join(tmp, "repo"); // đóng vai ~/dev/one-invest
symlinkSync(ROOT, LINK);
after(() => rmSync(tmp, { recursive: true, force: true }));

// Ma trận viết trước (AC-1): mọi tệp từng mang lối vào so chuỗi thô, đo 24/10 bằng git grep.
const ENTRY_MATRIX = [
  ["pipeline/transform-zalo.mjs", "db"],
  ["pipeline/transform-fb.mjs", "db"],
  ["pipeline/transform-chotot.mjs", "db"],
  ["pipeline/refresh-bait-gap.mjs", "db"],
  ["pipeline/resolve-properties.mjs", "db"],
  ["pipeline/dq-enum-vocab.mjs", "db"],
  ["pipeline/scripts/test-data-residue.mjs", "db"],
  ["scripts/dev-ops-account.mjs", "db"],
  ["scripts/check-api-surface.mjs", "static"],
  ["scripts/check-deals-api.mjs", "static"],
  ["scripts/smoke-api-matrix.mjs", "smoke"],
  ["agent/scripts/enrich-revert.ts", "tsx"],
];
const HOW = ["symlink", "abs", "rel"];

/** Gọi tệp theo một cách; trả { code, out }. */
function run(file, kind, how) {
  const abs = join(ROOT, file);
  const target = how === "symlink" ? join(LINK, file) : how === "abs" ? abs : `./${basename(file)}`;
  const cwd = how === "rel" ? dirname(abs) : how === "symlink" ? dirname(join(LINK, file)) : ROOT;
  const env = { ...process.env, DATABASE_URL: DEAD_DB, BASE_URL: "http://127.0.0.1:9", OPS_API_TOKEN: "gia" };
  const args = {
    db: [process.execPath, [target]],
    static: [process.execPath, [target, "static"]],
    smoke: [process.execPath, [target]],
    tsx: [TSX, [target, "--ids", "1"]],
  }[kind];
  const r = spawnSync(args[0], args[1], { cwd, env, encoding: "utf8", timeout: 60_000 });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/** Lối vào đã chạy chưa — theo loại tệp. */
function ran(kind, { code, out }) {
  if (kind === "db") return code !== 0 && /ECONNREFUSED/.test(out);
  if (kind === "static") return /^(ok|FAIL)\b/m.test(out);
  if (kind === "smoke") return /fetch failed|ECONNREFUSED/.test(out);
  return code !== 0 && /--actor/.test(out);
}

test("AC-1 mười hai lối vào chạy qua symlink", { timeout: 600_000 }, () => {
  let n = 0;
  const silent = [];
  for (const [file, kind] of ENTRY_MATRIX) {
    for (const how of HOW) {
      if (!ran(kind, run(file, kind, how))) silent.push(`AC-1 lối vào câm (${how}): ${file}`);
      n++;
    }
  }
  assert.equal(n, 36, "AC-1 ma trận phải đủ 36 ô");
  assert.deepEqual(silent, []);
});

// Ba khuôn lối vào mẫu: hai khuôn cũ cho đúng triệu chứng đêm 24/10, khuôn đúng chạy.
const GUARDS = {
  "cu-pathtofileurl.mjs": `import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log("CHAY");`,
  "cu-path-resolve.mjs": `import path from "node:path"; import { fileURLToPath } from "node:url";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log("CHAY");`,
  "dung-realpath.mjs": `import { realpathSync } from "node:fs"; import { fileURLToPath } from "node:url";
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) console.log("CHAY");`,
};

test("AC-2 khuôn cũ câm, khuôn mới chạy", () => {
  const dir = join(tmp, "mau");
  const realDir = mkdtempSync(join(tmp, "mau-that-"));
  for (const [name, src] of Object.entries(GUARDS)) writeFileSync(join(realDir, name), src);
  symlinkSync(realDir, dir);
  const out = (name) => spawnSync(process.execPath, [join(dir, name)], { encoding: "utf8" });
  for (const name of ["cu-pathtofileurl.mjs", "cu-path-resolve.mjs"]) {
    const r = out(name);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), "", "AC-2 khuôn cũ không câm — phép đo không phân biệt");
  }
  assert.equal(out("dung-realpath.mjs").stdout.trim(), "CHAY", "AC-2 khuôn đúng không chạy qua symlink");
});

/**
 * Tệp nhắc cả argv[1] và import.meta.url (bỏ chú thích) mà không so qua realpathSync trên vế argv[1].
 * Tính theo cả tệp — khuôn cũ tách dòng hay gán biến trung gian vẫn bị bắt.
 * @param {{ path: string, text: string }[]} files
 */
export function scanEntrypoints(files) {
  const code = (t) => t.split("\n").filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n");
  const GOOD = /realpathSync\(\s*(path\.resolve\(\s*)?process\.argv\[1\]/;
  return files
    .filter((f) => {
      const t = code(f.text);
      return /argv\[1\]/.test(t) && /import\.meta\.url/.test(t) && !GOOD.test(t);
    })
    .map((f) => f.path);
}

function codeFiles(dirs) {
  const out = [];
  const walk = (d) => {
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (["node_modules", ".next", "dist"].includes(e.name)) continue;
        walk(full);
      } else if (/\.(mjs|ts)$/.test(e.name)) {
        out.push({ path: relative(ROOT, full), text: readFileSync(full, "utf8") });
      }
    }
  };
  for (const d of dirs) walk(join(ROOT, d));
  return out;
}

test("AC-3 không còn khuôn cũ", () => {
  const files = codeFiles(["pipeline", "scripts", "agent", "collector/src", "data-api/src", "tools"]);
  assert.ok(files.length > 50, "AC-3 bộ quét đọc quá ít tệp — đường dẫn hỏng");
  // Loại khỏi phép quét: chính tệp này (khuôn mẫu nằm trong chuỗi) và bản chép kit product-map.mjs —
  // nó so qua hàm same() bọc realpathSync (chú thích ở dòng «So bằng realpath, KHÔNG bằng path.resolve»);
  // bản chép kit không sửa tay (AGENTS.md).
  const SKIP = new Set(["pipeline/scripts/entrypoint-symlink.test.mjs", "scripts/product-map.mjs"]);
  assert.match(files.find((f) => f.path === "scripts/product-map.mjs").text, /realpathSync/, "AC-3 product-map.mjs thôi so bằng realpath — bỏ khỏi danh sách cho phép");
  const bad = scanEntrypoints(files.filter((f) => !SKIP.has(f.path)));
  assert.deepEqual(bad.map((p) => `AC-3 còn lối vào khuôn cũ: ${p}`), []);

  // Ma trận mẫu đỏ (6 ô): năm khuôn sai bị trả, khuôn đúng không.
  const SAMPLES = {
    "mot-dong.mjs": "if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();",
    "resolve.mjs": "if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();",
    "tach-dong.mjs": "const entry = process.argv[1];\nconst me = import.meta.url;\nif (me === pathToFileURL(entry).href) main();",
    "ends-with.mjs": "if (import.meta.url.endsWith(basename(process.argv[1]))) main();",
    "boc-nham.mjs": "if (process.argv[1] === realpathSync(fileURLToPath(import.meta.url))) main();",
    "dung.mjs": "if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();",
  };
  const hit = scanEntrypoints(Object.entries(SAMPLES).map(([path, text]) => ({ path, text }))).sort();
  assert.deepEqual(hit, ["boc-nham.mjs", "ends-with.mjs", "mot-dong.mjs", "resolve.mjs", "tach-dong.mjs"]);
});

const IMPORTED = [
  "pipeline/transform-zalo.mjs", "pipeline/transform-fb.mjs", "pipeline/transform-chotot.mjs",
  "pipeline/refresh-bait-gap.mjs", "pipeline/resolve-properties.mjs", "pipeline/dq-enum-vocab.mjs",
  "pipeline/scripts/test-data-residue.mjs", "scripts/dev-ops-account.mjs",
];

test("AC-4 nhập như mô-đun không chạy main", { timeout: 120_000 }, () => {
  const realDir = mkdtempSync(join(tmp, "runner-"));
  const linkDir = join(tmp, "runner-link");
  symlinkSync(realDir, linkDir);
  const imports = IMPORTED.map((f) => `await import(${JSON.stringify(join(ROOT, f))});`).join("\n");
  writeFileSync(join(realDir, "runner.mjs"), `${imports}\nconsole.log("NHAP_XONG");\n`);
  // Đối chứng cùng runner: gọi một hàm có kết nối → phép đo thấy ECONNREFUSED nếu có.
  writeFileSync(join(realDir, "runner-doi-chung.mjs"), `${imports}
const pg = (await import(${JSON.stringify(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))})).default;
const { measureResidue } = await import(${JSON.stringify(join(ROOT, "pipeline/scripts/test-data-residue.mjs"))});
const c = new pg.Client({ connectionString: ${JSON.stringify(DEAD_DB)} });
try { await c.connect(); await measureResidue(c); } catch (e) { console.error(String(e.code ?? e)); }
console.log("NHAP_XONG");\n`);
  const env = { ...process.env, DATABASE_URL: DEAD_DB };
  for (const dir of [linkDir, realDir]) {
    const r = spawnSync(process.execPath, [join(dir, "runner.mjs")], { env, encoding: "utf8", timeout: 60_000 });
    const out = `${r.stdout}${r.stderr}`;
    assert.equal(r.status, 0, `AC-4 nhập mô-đun kích hoạt main: ${out.slice(0, 300)}`);
    assert.match(out, /NHAP_XONG/);
    assert.doesNotMatch(out, /ECONNREFUSED/, "AC-4 nhập mô-đun kích hoạt main");
  }
  const ctrl = spawnSync(process.execPath, [join(realDir, "runner-doi-chung.mjs")], { env, encoding: "utf8", timeout: 60_000 });
  assert.match(`${ctrl.stdout}${ctrl.stderr}`, /ECONNREFUSED/, "AC-4 đối chứng: phép đo không thấy lỗi kết nối");
});
