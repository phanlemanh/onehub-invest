// pipeline-that.test.mjs — hồ sơ db-thu-tach-khoi-cum-that E2c, E3b, E6: tập ca pipeline_that (pipeline/chay-that.mjs) và
// tập ca chuẩn-CI bỏ qua (scripts/lib/ci-can-du-lieu.mjs, chay-nua.mjs dưới CI=true) cùng rút từ ci-bo-qua.json; lệnh
// pipeline_that chỉ chạy ca trong danh sách; config cổng nối đúng ba suite pipeline. Không cần DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeOptions } from "./lib/ci-can-du-lieu.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const THAT = path.join(ROOT, "pipeline/chay-that.mjs");
const DS = JSON.parse(readFileSync(path.join(ROOT, "scripts/ci-bo-qua.json"), "utf8")).pipeline;
const TEN_THAT = DS.map((m) => m.ca).sort();
// node --test lồng trong một ca test thấy NODE_TEST_CONTEXT của bộ chạy ngoài và in dạng giao thức nội bộ — bỏ biến ấy.
const ENV = { ...process.env, ONEHUB_HAI_MAY_TEP: "/khong-co/hai-may.env" }; // vai máy thu (HT33): ca này đo tập đủ, máy nào cũng vậy
delete ENV.NODE_TEST_CONTEXT;

/** Tên ca trong các mẫu `--test-skip-pattern="^…$"` mà chuẩn-CI truyền qua NODE_OPTIONS. */
const tenBoQua = (opts) => [...opts.matchAll(/"--test-skip-pattern=\^(.*?)\$"/g)]
  .map((m) => m[1].replace(/\\\\/g, "\\").replace(/\\(.)/g, "$1")).sort();

test("tập bỏ qua của chuẩn-CI = tập chạy của pipeline_that = 34 mục ci-bo-qua pipeline", () => {
  // 30 mục lúc duyệt + 4 ca CI bỏ qua ngầm (thiếu DATABASE_URL) thêm ở S4 r1 của hồ sơ db-thu-tach-khoi-cum-that
  assert.equal(TEN_THAT.length, 34);
  assert.deepEqual(tenBoQua(nodeOptions(DS, true)), TEN_THAT);
  const r = spawnSync(process.execPath, [THAT, "--liet"], { encoding: "utf8", env: ENV });
  assert.equal(r.status, 0, r.stderr);
  const dong = r.stdout.split("\n").filter(Boolean);
  const chay = dong.filter((l) => !l.startsWith("pipeline/")).sort();
  assert.deepEqual(chay, TEN_THAT);
  // chay-nua.mjs dưới CI=true dùng đúng hàm nodeOptions với danh sách pipeline
  const nua = readFileSync(path.join(ROOT, "pipeline/chay-nua.mjs"), "utf8");
  assert.match(nua, /nodeOptions\(ds, true\)/);
  assert.match(nua, /\.pipeline;/);
});

test("chiều đỏ: danh sách thêm một ca không có trong tệp → chay-that từ chối, ghim «không còn ca»", () => {
  const d = mkdtempSync(path.join(tmpdir(), "pt-lech-"));
  const ds = path.join(d, "ci-bo-qua.json");
  writeFileSync(ds, JSON.stringify({ pipeline: [...DS, { tep: DS[0].tep, ca: "CA-MA không tồn tại", ly_do: "thử" }] }));
  const r = spawnSync(process.execPath, [THAT, "--danh-sach", ds, "--liet"], { encoding: "utf8", env: ENV });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /không còn ca «CA-MA không tồn tại»/);
});

function khoGia() {
  const g = mkdtempSync(path.join(tmpdir(), "pt-gia-"));
  mkdirSync(path.join(g, "pipeline"));
  writeFileSync(path.join(g, "pipeline/gia.test.mjs"), `import { test, describe } from "node:test";
test("CA-1 trong danh sách", () => { console.log("CHAY CA-1"); });
describe("khối", () => { test("CA-2 trong danh sách", () => { console.log("CHAY CA-2"); }); });
test("CA-3 ngoài danh sách", () => { console.log("CHAY CA-3"); });
`);
  return g;
}

test("lệnh pipeline_that chỉ chạy ca trong danh sách (tệp giả: hai ca trong, một ca ngoài)", () => {
  const g = khoGia();
  const ds = path.join(g, "ds.json");
  writeFileSync(ds, JSON.stringify({ pipeline: [
    { tep: "pipeline/gia.test.mjs", ca: "CA-1 trong danh sách", ly_do: "thử" },
    { tep: "pipeline/gia.test.mjs", ca: "CA-2 trong danh sách", ly_do: "thử" },
  ] }));
  const r = spawnSync(process.execPath, [THAT, "--danh-sach", ds, "--goc", g], { encoding: "utf8", env: ENV });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /CHAY CA-1/);
  assert.match(r.stdout, /CHAY CA-2/);
  assert.doesNotMatch(r.stdout, /CHAY CA-3/);
  assert.match(r.stdout, /ℹ tests 2\b/);
});

test("chiều đỏ: mục trỏ ca không còn → lệnh thoát khác 0, gọi tên mục", () => {
  const g = khoGia();
  const ds = path.join(g, "ds.json");
  writeFileSync(ds, JSON.stringify({ pipeline: [
    { tep: "pipeline/gia.test.mjs", ca: "CA-1 trong danh sách", ly_do: "thử" },
    { tep: "pipeline/gia.test.mjs", ca: "CA-9 đã xoá", ly_do: "thử" },
  ] }));
  const r = spawnSync(process.execPath, [THAT, "--danh-sach", ds, "--goc", g], { encoding: "utf8", env: ENV });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /CA-9 đã xoá/);
  assert.doesNotMatch(r.stdout, /CHAY CA-1/, "danh sách lệch thì không chạy ca nào");
});

// ── E6: khoá config của cổng ────────────────────────────────────────────────────────────────────────────────────────────
const yaml = createRequire(path.join(ROOT, "app/package.json"))("js-yaml");
const PKG = JSON.parse(readFileSync(path.join(ROOT, "pipeline/package.json"), "utf8")).scripts;

/** Lỗi của config: thiếu khoá, hay lệnh không nối đúng ba suite pipeline. */
export function loiConfig(cfgTxt, pkg = PKG) {
  const c = yaml.load(cfgTxt);
  const loi = [];
  const keys = c.feature_loop?.suite_keys ?? [];
  if (!keys.includes("executors.suite.pipeline_that")) loi.push("feature_loop.suite_keys thiếu executors.suite.pipeline_that");
  const t = c.executors?.test ?? {};
  const su = c.executors?.suite ?? {};
  for (const [k, npm] of [["pipeline_a", "test:a"], ["pipeline_b", "test:b"]]) {
    if (t[k] !== `cd pipeline && npm run ${npm}`) loi.push(`executors.test.${k} không chạy npm run ${npm}`);
    else if (!/db-thu\.sh \S+ --chay-trong /.test(pkg[npm] ?? "")) loi.push(`executors.test.${k}: npm run ${npm} không qua --chay-trong`);
  }
  if (!t.pipeline_that) loi.push("executors.test.pipeline_that vắng");
  else if (!/db-thu\.sh \S+ --chay node chay-that\.mjs$/.test(pkg["test:that"] ?? "")) loi.push("executors.test.pipeline_that: npm run test:that không chạy chay-that.mjs trên bản chép");
  if (su.pipeline_that !== `node scripts/suite-neu-doi.mjs pipeline_that -- '${t.pipeline_that}'`) loi.push("executors.suite.pipeline_that không bọc nguyên văn executors.test.pipeline_that bằng suite-neu-doi");
  return loi;
}

test("config: suite_keys có pipeline_that; test.pipeline_a|b qua --chay-trong; test.pipeline_that bọc ở suite; đủ tám khoá suite", () => {
  const txt = readFileSync(path.join(ROOT, "_acceptance/config.yaml"), "utf8");
  assert.deepEqual(loiConfig(txt), []);
  assert.equal(yaml.load(txt).feature_loop.suite_keys.length, 8);
});

test("chiều đỏ config: bản sao bỏ khoá → ghim tên khoá", () => {
  const txt = readFileSync(path.join(ROOT, "_acceptance/config.yaml"), "utf8");
  const boKey = txt.replace("executors.suite.pipeline_that, ", "");
  assert.notEqual(boKey, txt);
  assert.throws(() => { const l = loiConfig(boKey); if (l.length) throw new Error(l.join("; ")); }, /suite_keys thiếu executors\.suite\.pipeline_that/);
  const veChay = { ...PKG, "test:a": PKG["test:a"].replace("--chay-trong", "--chay") };
  assert.throws(() => { const l = loiConfig(txt, veChay); if (l.length) throw new Error(l.join("; ")); }, /executors\.test\.pipeline_a: npm run test:a không qua --chay-trong/);
});
