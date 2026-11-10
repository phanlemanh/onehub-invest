// Thước của scripts/suite-neu-doi.mjs (hồ sơ s4-suite-theo-vung). Không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VUNG, quyetDinh, trongVung } from "./suite-neu-doi.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const LENH = path.join(HERE, "suite-neu-doi.mjs");

const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// Repo tạm: commit gốc (nhánh goc) rồi nhánh viec; trả { dir, base }.
function repoTam(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "s4v-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  git(dir, "init", "-q", "-b", "goc");
  git(dir, "config", "user.email", "t@local.test");
  git(dir, "config", "user.name", "t");
  for (const f of ["app/a.ts", "pipeline/p.mjs", "collector/src/c.ts", "data-api/README.md", "docs/research/r.md"]) {
    mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    writeFileSync(path.join(dir, f), "x\n");
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "goc");
  git(dir, "switch", "-qc", "viec");
  return { dir, base: "goc" };
}

const ghi = (dir, f, s = "y\n") => { mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); writeFileSync(path.join(dir, f), s); };

// Chạy lệnh bọc; lệnh con chạm tệp DAU và ghi pwd của nó.
function chay(dir, ten, { base = "goc", lenh = "pwd > DAU", env = {} } = {}) {
  const r = spawnSync(process.execPath, [LENH, ten, "--", lenh], {
    cwd: dir, encoding: "utf8", env: { ...process.env, SUITE_NEU_DOI: "", SUITE_NEU_DOI_BASE: base, ...env },
  });
  const dau = path.join(dir, "DAU");
  const daChay = existsSync(dau);
  const pwd = daChay ? readFileSync(dau, "utf8").trim() : null;
  if (daChay) rmSync(dau);
  return { code: r.status, out: r.stdout, daChay, pwd };
}

test("S4V-AC-1 — diff ngoài vùng: không chạy, một dòng bỏ qua, thoát 0; đối chứng tệp app chưa theo dõi thì chạy", (t) => {
  const { dir } = repoTam(t);
  ghi(dir, "collector/src/c.ts", "doi\n");
  git(dir, "commit", "-qam", "collector");
  const r = chay(dir, "app");
  assert.equal(r.daChay, false, "S4V-AC-1 lệnh đã chạy dù diff ngoài vùng app");
  assert.equal(r.code, 0);
  const dong = r.out.trim().split("\n");
  assert.equal(dong.length, 1, `S4V-AC-1 phải đúng một dòng: ${r.out}`);
  assert.match(dong[0], /^suite-neu-doi: bỏ qua app: không đổi /);
  // chiều đỏ cùng fixture
  ghi(dir, "app/x.ts");
  const r2 = chay(dir, "app");
  assert.equal(r2.daChay, true, "S4V-AC-1 đối chứng: tệp app/x.ts chưa theo dõi mà không chạy");
  assert.match(r2.out, /^suite-neu-doi: chạy app — đổi app\/x\.ts/m);
});

test("S4V-AC-1 (symlink) — node_modules nối bằng symlink không tính là tệp đổi", (t) => {
  const { dir } = repoTam(t);
  ghi(dir, ".gitignore", "node_modules/\n");
  git(dir, "add", ".gitignore");
  git(dir, "commit", "-qm", "gi");
  ghi(dir, "collector/src/c.ts", "doi\n");
  git(dir, "commit", "-qam", "collector");
  const ngoai = mkdtempSync(path.join(tmpdir(), "s4v-nm-"));
  t.after(() => rmSync(ngoai, { recursive: true, force: true }));
  execFileSync("ln", ["-s", ngoai, path.join(dir, "app", "node_modules")]);
  const r = chay(dir, "app");
  assert.equal(r.daChay, false, `S4V-AC-1 symlink app/node_modules làm app chạy: ${r.out}`);
  assert.match(r.out, /^suite-neu-doi: bỏ qua app:/m);
});

test("S4V-AC-2 — tệp trong vùng (commit · sửa chưa commit · chưa theo dõi) thì chạy từ gốc kho, mã thoát đi qua", (t) => {
  const ca = [
    ["đã commit", (dir) => { ghi(dir, "pipeline/p.mjs", "z\n"); git(dir, "commit", "-qam", "p"); }, "pipeline/p.mjs"],
    ["sửa chưa commit", (dir) => ghi(dir, "pipeline/p.mjs", "w\n"), "pipeline/p.mjs"],
    ["chưa theo dõi", (dir) => ghi(dir, "pipeline/moi.mjs"), "pipeline/moi.mjs"],
  ];
  for (const [ten, lam, tep] of ca) {
    const { dir } = repoTam(t);
    ghi(dir, "data-api/README.md", "doi\n");
    git(dir, "commit", "-qam", "data-api");
    const truoc = chay(dir, "pipeline");
    assert.equal(truoc.daChay, false, `S4V-AC-2 ${ten}: đối chứng chưa đổi vùng mà đã chạy`);
    lam(dir);
    mkdirSync(path.join(dir, "pipeline", "sau"), { recursive: true });
    const r = spawnSync(process.execPath, [LENH, "pipeline", "--", "pwd > DAU"], {
      cwd: path.join(dir, "pipeline", "sau"), encoding: "utf8", env: { ...process.env, SUITE_NEU_DOI: "", SUITE_NEU_DOI_BASE: "goc" },
    });
    assert.equal(r.status, 0);
    assert.equal(readFileSync(path.join(dir, "DAU"), "utf8").trim(), execFileSync("realpath", [dir], { encoding: "utf8" }).trim(),
      `S4V-AC-2 ${ten}: lệnh không chạy từ gốc kho`);
    rmSync(path.join(dir, "DAU"));
    assert.match(r.stdout, new RegExp(`^suite-neu-doi: chạy pipeline — đổi ${tep.replace(/[./]/g, "\\$&")}`, "m"), `S4V-AC-2 ${ten}: dòng in không nêu tệp`);
    assert.equal(chay(dir, "pipeline", { lenh: "exit 3" }).code, 3, `S4V-AC-2 ${ten}: mã 3 không đi qua`);
    assert.equal(chay(dir, "pipeline", { lenh: "exit 0" }).code, 0);
  }
});

test("S4V-AC-3 — ma trận viết trước: migration, pipeline, collector, ROADMAP × sáu suite", () => {
  const MA_TRAN = {
    "db/migrations/090_x.sql": { app: true, app_ui: true, ui_lint_rules: true, pipeline: true, agent: true, portal_static: false },
    "pipeline/lib/x.mjs": { app: true, app_ui: true, ui_lint_rules: false, pipeline: true, agent: true, portal_static: false },
    "collector/src/x.ts": { app: false, app_ui: false, ui_lint_rules: false, pipeline: true, agent: false, portal_static: false },
    "docs/ROADMAP.md": { app: false, app_ui: false, ui_lint_rules: false, pipeline: true, agent: false, portal_static: false },
  };
  let so = 0;
  for (const [tep, mong] of Object.entries(MA_TRAN)) {
    for (const [suite, chayMong] of Object.entries(mong)) {
      assert.equal(quyetDinh(suite, [tep]).chay, chayMong, `S4V-AC-3 ô ${tep} × ${suite}: mong ${chayMong ? "chạy" : "bỏ qua"}`);
      so++;
    }
  }
  assert.equal(so, 24);
  assert.deepEqual(Object.keys(VUNG).sort(), ["agent", "app", "app_ui", "pipeline", "portal_static", "ui_lint_rules"]);
});

test("S4V-AC-4 — không chắc thì chạy, dòng in nêu lý do; đối chứng ngoài vùng thì bỏ qua", (t) => {
  const { dir } = repoTam(t);
  // đối chứng
  ghi(dir, "collector/src/c.ts", "doi\n");
  git(dir, "commit", "-qam", "collector");
  assert.equal(chay(dir, "agent").daChay, false, "S4V-AC-4 đối chứng: diff ngoài vùng agent mà chạy");
  const ca = [
    ["ref gốc vắng", () => chay(dir, "agent", { base: "khong-co-ref" }), /không giải được gốc/],
    ["suite lạ", () => chay(dir, "khong-co-suite"), /suite lạ «khong-co-suite»/],
    ["ép chạy", () => chay(dir, "agent", { env: { SUITE_NEU_DOI: "chay" } }), /ép chạy/],
  ];
  for (const [ten, f, re] of ca) {
    const r = f();
    assert.equal(r.daChay, true, `S4V-AC-4 ${ten}: không chạy`);
    assert.match(r.out, re, `S4V-AC-4 ${ten}: dòng in thiếu lý do`);
  }
  // chỉ _acceptance/ và diff rỗng: repo mới cho từng ca
  const r1 = repoTam(t);
  ghi(r1.dir, "_acceptance/x/contract.md");
  const a = chay(r1.dir, "agent");
  assert.equal(a.daChay, true, "S4V-AC-4 chỉ _acceptance/: không chạy");
  assert.match(a.out, /chưa có thay đổi mã/);
  const r3 = repoTam(t);
  for (const f of ["_acceptance/x/contract.md", "docs/superpowers/specs/x.md", "docs/plan/lo-trinh.json"]) ghi(r3.dir, f);
  const d3 = chay(r3.dir, "agent");
  assert.equal(d3.daChay, true, "S4V-AC-4 hồ sơ + thiết kế + kế hoạch (không tệp nào thuộc vùng): không chạy");
  assert.match(d3.out, /chưa có thay đổi mã/);
  const r2 = repoTam(t);
  const b = chay(r2.dir, "agent");
  assert.equal(b.daChay, true, "S4V-AC-4 diff rỗng: không chạy");
  assert.match(b.out, /chưa có thay đổi mã/);
  // không phải kho git
  const ngoai = mkdtempSync(path.join(tmpdir(), "s4v-ngoai-"));
  t.after(() => rmSync(ngoai, { recursive: true, force: true }));
  const c = chay(ngoai, "agent");
  assert.equal(c.daChay, true, "S4V-AC-4 không phải kho git: không chạy");
  assert.match(c.out, /không giải được gốc/);
});

// ── S4V-AC-5: canh phủ bảng vùng ─────────────────────────────────────────────
const MA = /\.(m?[jt]sx?|cjs|sh)$/;
const TOP = /^(db|docs|CONTEXT\.md|_acceptance|scripts|pipeline|app|agent|\.claude|collector|data-api|tools|LO-TRINH\.html|PRODUCT-MAP\.md|AGENTS\.md|CLAUDE\.md)(\/|$)/;
const RE_CHUOI = /["'`]([^"'`\n]{2,200})["'`]/g;
const RE_IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["'`]([^"'`\n]{2,200})["'`]/g;

// Đường trong kho mà một tệp mã nêu bằng chuỗi literal: "../x" theo thư mục tệp, hoặc chuỗi bắt đầu bằng thư mục gốc.
function thamChieu(f, src, re, ton) {
  const out = new Set();
  for (const m of src.matchAll(re)) {
    const lit = m[1];
    const ung = [];
    if (lit.includes("../")) ung.push(path.posix.normalize(path.posix.join(path.posix.dirname(f), lit)));
    if (TOP.test(lit)) ung.push(path.posix.normalize(lit));
    for (let x of ung) { x = x.replace(/\/$/, ""); if (!x.startsWith("..") && ton(x)) out.add(x); }
  }
  return out;
}

// Bao đóng: chuỗi đường của mọi tệp đã thăm; đệ quy ra ngoài module chỉ theo cạnh import.
export function quetNgoai(root, mods, tepKho) {
  const set = new Set(tepKho);
  const thuMuc = new Set();
  for (const f of tepKho) for (let d = path.posix.dirname(f); d !== "."; d = path.posix.dirname(d)) thuMuc.add(d);
  const ton = (p) => set.has(p) || thuMuc.has(p);
  const trongMod = (p) => mods.some((m) => p === m || p.startsWith(m + "/"));
  const hang = tepKho.filter((f) => trongMod(f) && MA.test(f));
  const daTham = new Set(hang);
  const ngoai = new Map();
  while (hang.length) {
    const f = hang.pop();
    const src = readFileSync(path.join(root, f), "utf8");
    for (const r of thamChieu(f, src, RE_CHUOI, ton)) if (!trongMod(r) && !ngoai.has(r)) ngoai.set(r, f);
    for (const r of thamChieu(f, src, RE_IMPORT, ton)) {
      if (!trongMod(r) && set.has(r) && MA.test(r) && !daTham.has(r)) { daTham.add(r); hang.push(r); }
    }
  }
  return ngoai;
}

const MODULE = {
  app: ["app"], app_ui: ["app"], ui_lint_rules: ["app/eslint-plugin-onehub-ui"],
  pipeline: ["pipeline"], agent: ["agent"], portal_static: ["scripts/check-portal-compliance.mjs"],
};

// Ngoại lệ: đường phép quét thấy mà vùng cố ý không phủ — mỗi dòng một lý do; ngoại lệ không còn được quét thấy là đỏ.
const NGOAI_LE = [
  { suite: "app", duong: "collector", ly_do: "app/src/lib/ops/zalo-media.ts: đường mặc định SNAPSHOTS_DIR lúc chạy, không phải tệp test đọc" },
  { suite: "app", duong: "docs", ly_do: "app/src/components/blocks/*: id «docs» của dữ liệu biểu đồ mẫu, không phải đường dẫn" },
  { suite: "app_ui", duong: "collector", ly_do: "như app" },
  { suite: "app", duong: ".claude", ly_do: "routes-map.test.mjs ghép tới .claude/skills/onehub-ui/routes.md — đã phủ" },
  { suite: "app_ui", duong: ".claude", ly_do: "như app" },
  { suite: "ui_lint_rules", duong: ".claude", ly_do: "như app" },
  { suite: "app_ui", duong: "docs", ly_do: "như app" },
  { suite: "pipeline", duong: "collector", ly_do: "vocab.mjs ghép tới collector/docs/field-targets.yaml (đã phủ); vocab.test.mjs băm cây collector chỉ để so trước/sau" },
  { suite: "pipeline", duong: "docs", ly_do: "vocab.mjs: mảnh «docs» của join(root, \"collector\", \"docs\", …) — đã phủ bằng collector/docs/**" },
  { suite: "pipeline", duong: "_acceptance", ly_do: "vocab.test.mjs ghép tới _acceptance/truong-nhan-s03-081/decisions.jsonl — đã phủ" },
  { suite: "agent", duong: "app", ly_do: "agent/src/memory/store.ts: giá trị enum source «app», không phải đường dẫn" },
];

export function chuaPhu(root, vung, ngoaiLe = NGOAI_LE) {
  const tepKho = git(root, "ls-files").trim().split("\n");
  const ket = {};
  for (const [suite, mods] of Object.entries(MODULE)) {
    const ngoai = quetNgoai(root, mods, tepKho);
    const nl = ngoaiLe.filter((x) => x.suite === suite);
    const thieu = [...ngoai].filter(([d]) => !nl.some((x) => x.duong === d) && !trongVung(d, vung[suite]) && !trongVung(d + "/x", vung[suite]));
    const chet = nl.filter((x) => !ngoai.has(x.duong)).map((x) => x.duong);
    ket[suite] = { thieu, chet };
  }
  return ket;
}

test("S4V-AC-5 — bảng vùng phủ mọi đường dẫn mã tham chiếu; ngoại lệ còn sống; đối chứng bỏ pipeline/** khỏi app thì đỏ", () => {
  const ket = chuaPhu(ROOT, VUNG);
  const loi = [];
  for (const [suite, { thieu, chet }] of Object.entries(ket)) {
    for (const [d, f] of thieu) loi.push(`suite ${suite}: ${d} ← ${f} nằm ngoài vùng — thêm vào VUNG.${suite} (scripts/suite-neu-doi.mjs) hoặc NGOAI_LE có lý do`);
    for (const d of chet) loi.push(`suite ${suite}: ngoại lệ «${d}» không còn được quét thấy — gỡ khỏi NGOAI_LE`);
  }
  assert.deepEqual(loi, [], "S4V-AC-5 bảng vùng không phủ hết");
  // chiều đỏ: bản sao bảng vùng thiếu pipeline/** ở app
  const hong = { ...VUNG, app: VUNG.app.filter((g) => g !== "pipeline/**") };
  const thieuApp = chuaPhu(ROOT, hong).app.thieu.map(([d]) => d);
  assert.ok(thieuApp.some((d) => d.startsWith("pipeline/")), "S4V-AC-5 đối chứng: bỏ pipeline/** khỏi app mà phép quét không đỏ");
});

test("S4V-AC-6 — executors.suite.* bọc nguyên văn lệnh hiện hành, suite_keys trỏ đúng sáu key; thêm key test mới vẫn xanh", () => {
  const cfg = readFileSync(path.join(ROOT, "_acceptance/config.yaml"), "utf8");
  const ten = ["agent", "app", "app_ui", "pipeline", "ui_lint_rules", "portal_static"];
  const khoi = (c, k) => { const m = c.match(new RegExp(`^  ${k}:\\n((?:    .*\\n|\\s*#.*\\n|\\s*\\n)*)`, "m")); return m ? m[1] : ""; };
  const lenh = (khoiTxt, k) => { const m = khoiTxt.match(new RegExp(`^    ${k}: "((?:[^"\\\\]|\\\\.)*)"`, "m")); return m ? m[1] : null; };
  const kiem = (c) => {
    const sai = [];
    const keys = c.match(/^  suite_keys: \[([^\]]*)\]/m);
    if (!keys || keys[1].split(",").map((x) => x.trim()).join() !== ten.map((x) => `executors.suite.${x}`).join()) sai.push("suite_keys");
    for (const x of ten) {
      const goc = lenh(khoi(c, x === "portal_static" ? "script" : "test"), x);
      if (!goc || goc.includes("'")) { sai.push(`${x}: lệnh gốc vắng hoặc có nháy đơn`); continue; }
      if (lenh(khoi(c, "suite"), x) !== `node scripts/suite-neu-doi.mjs ${x} -- '${goc}'`) sai.push(x);
    }
    return sai;
  };
  assert.deepEqual(kiem(cfg), [], "S4V-AC-6 executors.suite.<tên> không bọc nguyên văn lệnh hiện hành");
  // chiều đỏ: một ký tự lệnh bọc của app lệch
  const lech = cfg.replace(`app -- 'cd app && npx tsc --noEmit && npm run lint'`, `app -- 'cd app && npx tsc --noEmit && npm run lint '`);
  assert.notEqual(lech, cfg);
  assert.deepEqual(kiem(lech), ["app"], "S4V-AC-6 đối chứng: lệnh bọc lệch mà không đỏ");
  // chiều xanh: hàng sau thêm executors.test.moi — không được làm đỏ
  const them = cfg.replace("\n  test:\n", '\n  test:\n    moi: "node --test x.test.mjs"\n');
  assert.notEqual(them, cfg);
  assert.deepEqual(kiem(them), [], "S4V-AC-6 thêm key executors.test mới mà đỏ");
});
