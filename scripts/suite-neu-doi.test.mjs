// Thước của scripts/suite-neu-doi.mjs (hồ sơ s4-suite-theo-vung). Không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUOC_CI, HA_TANG, VUNG, buocSuite, chonScripts, docKhai, khop, quyetDinh, testsScripts, trongVung } from "./suite-neu-doi.mjs";
import { createRequire } from "node:module";

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
    const truoc = chay(dir, "pipeline_a");
    assert.equal(truoc.daChay, false, `S4V-AC-2 ${ten}: đối chứng chưa đổi vùng mà đã chạy`);
    lam(dir);
    mkdirSync(path.join(dir, "pipeline", "sau"), { recursive: true });
    const r = spawnSync(process.execPath, [LENH, "pipeline_a", "--", "pwd > DAU"], {
      cwd: path.join(dir, "pipeline", "sau"), encoding: "utf8", env: { ...process.env, SUITE_NEU_DOI: "", SUITE_NEU_DOI_BASE: "goc" },
    });
    assert.equal(r.status, 0);
    assert.equal(readFileSync(path.join(dir, "DAU"), "utf8").trim(), execFileSync("realpath", [dir], { encoding: "utf8" }).trim(),
      `S4V-AC-2 ${ten}: lệnh không chạy từ gốc kho`);
    rmSync(path.join(dir, "DAU"));
    assert.match(r.stdout, new RegExp(`^suite-neu-doi: chạy pipeline_a — đổi ${tep.replace(/[./]/g, "\\$&")}`, "m"), `S4V-AC-2 ${ten}: dòng in không nêu tệp`);
    assert.equal(chay(dir, "pipeline_a", { lenh: "exit 3" }).code, 3, `S4V-AC-2 ${ten}: mã 3 không đi qua`);
    assert.equal(chay(dir, "pipeline_a", { lenh: "exit 0" }).code, 0);
  }
});

test("S4V-AC-2 (đổi tên) — tệp chuyển RA KHỎI vùng vẫn kéo suite; đối chứng bản sao bỏ --no-renames thì bỏ qua", (t) => {
  const { dir } = repoTam(t);
  git(dir, "mv", "app/a.ts", "collector/src/a.ts");
  git(dir, "commit", "-qm", "mv app -> collector");
  // Vật lành: vùng app vừa mất app/a.ts nên suite app PHẢI chạy, và dòng in phải nêu đường NGUỒN.
  const r = chay(dir, "app");
  assert.equal(r.daChay, true, `S4V-AC-2 đổi tên: app/a.ts rời vùng app mà suite app bị bỏ qua: ${r.out}`);
  assert.match(r.out, /^suite-neu-doi: chạy app — đổi app\/a\.ts/m, "S4V-AC-2 đổi tên: dòng in không nêu đường nguồn app/a.ts");
  // Chiều đỏ cùng fixture: bản sao lệnh bỏ --no-renames (đặt NGOÀI kho thử để không thành tệp đổi của chính nó).
  const ngoai = mkdtempSync(path.join(tmpdir(), "s4v-hong-"));
  t.after(() => rmSync(ngoai, { recursive: true, force: true }));
  const hong = path.join(ngoai, "suite-neu-doi-hong.mjs");
  const nguon = readFileSync(LENH, "utf8");
  assert.ok(nguon.includes('"--no-renames", '), "S4V-AC-2 đối chứng: không tìm thấy --no-renames để gỡ — thước đã mất mỏ neo");
  writeFileSync(hong, nguon.replaceAll('"--no-renames", ', ""));
  const rh = spawnSync(process.execPath, [hong, "app", "--", "pwd > DAU"], {
    cwd: dir, encoding: "utf8", env: { ...process.env, SUITE_NEU_DOI: "", SUITE_NEU_DOI_BASE: "goc" },
  });
  assert.equal(existsSync(path.join(dir, "DAU")), false,
    "S4V-AC-2 đối chứng: bản sao bỏ --no-renames mà vẫn chạy app — thước không đo chiều nào");
  assert.match(rh.stdout, /^suite-neu-doi: bỏ qua app:/m,
    "S4V-AC-2 đối chứng: bản sao bỏ --no-renames phải bỏ qua app (git nuốt đường nguồn của git mv)");
});

test("S4V-AC-3 — ma trận viết trước: migration, pipeline, collector, ROADMAP × bảy suite", () => {
  const MA_TRAN = {
    "db/migrations/090_x.sql": { app: true, app_ui: true, ui_lint_rules: true, pipeline_a: true, pipeline_b: true, agent: true, portal_static: true },
    "pipeline/lib/x.mjs": { app: true, app_ui: true, ui_lint_rules: false, pipeline_a: true, pipeline_b: true, agent: true, portal_static: false },
    "collector/src/x.ts": { app: false, app_ui: false, ui_lint_rules: false, pipeline_a: true, pipeline_b: true, agent: false, portal_static: false },
    "docs/ROADMAP.md": { app: false, app_ui: false, ui_lint_rules: false, pipeline_a: true, pipeline_b: true, agent: false, portal_static: false },
  };
  let so = 0;
  for (const [tep, mong] of Object.entries(MA_TRAN)) {
    for (const [suite, chayMong] of Object.entries(mong)) {
      assert.equal(quyetDinh(suite, [tep]).chay, chayMong, `S4V-AC-3 ô ${tep} × ${suite}: mong ${chayMong ? "chạy" : "bỏ qua"}`);
      so++;
    }
  }
  assert.equal(so, 28);
  assert.deepEqual(Object.keys(VUNG).sort(), ["agent", "app", "app_ui", "pipeline_a", "pipeline_b", "portal_static", "ui_lint_rules"]);
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

// Đường trong kho mà một tệp mã nêu bằng chuỗi literal: "./x" hay "../x" theo thư mục tệp, hoặc chuỗi bắt đầu bằng thư
// mục gốc. "./x" phải tính: module một tệp (portal_static) nạp tệp cùng thư mục — S4 r1 t2.
function thamChieu(f, src, re, ton) {
  const out = new Set();
  for (const m of src.matchAll(re)) {
    const lit = m[1];
    const ung = [];
    if (lit.includes("../") || lit.startsWith("./")) ung.push(path.posix.normalize(path.posix.join(path.posix.dirname(f), lit)));
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
  pipeline_a: ["pipeline"], pipeline_b: ["pipeline"], agent: ["agent"],
  portal_static: ["scripts/check-portal-compliance.mjs"],
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
  { suite: "pipeline_a", duong: "collector", ly_do: "vocab.mjs ghép tới collector/docs/field-targets.yaml (đã phủ); vocab.test.mjs băm cây collector chỉ để so trước/sau" },
  { suite: "pipeline_a", duong: "docs", ly_do: "vocab.mjs: mảnh «docs» của join(root, \"collector\", \"docs\", …) — đã phủ bằng collector/docs/**" },
  { suite: "pipeline_a", duong: "_acceptance", ly_do: "vocab.test.mjs ghép tới _acceptance/truong-nhan-s03-081/decisions.jsonl — đã phủ" },
  { suite: "pipeline_b", duong: "collector", ly_do: "như pipeline_a — hai nửa cùng cây mã" },
  { suite: "pipeline_b", duong: "docs", ly_do: "như pipeline_a" },
  { suite: "pipeline_b", duong: "_acceptance", ly_do: "như pipeline_a" },
  { suite: "agent", duong: "app", ly_do: "agent/src/memory/store.ts: giá trị enum source «app», không phải đường dẫn" },
  // Nhận main 16/11: bốn đường mới là chú thích, danh sách bỏ qua, hay thư mục GHI ra — không phải tệp suite nạp.
  { suite: "app", duong: "_acceptance/sao-luu-ma-hoa-b2", ly_do: "scripts/lib/sao-luu-ngoai-may.mjs: chuỗi trong khối chú thích đầu tệp (trỏ hồ sơ), không phải đường lúc chạy" },
  { suite: "app", duong: "docs/superpowers/specs/2026-11-11-sao-luu-ma-hoa-b2-design.md", ly_do: "như trên — chú thích trỏ tài liệu thiết kế" },
  { suite: "app_ui", duong: "_acceptance/sao-luu-ma-hoa-b2", ly_do: "như app" },
  { suite: "app_ui", duong: "docs/superpowers/specs/2026-11-11-sao-luu-ma-hoa-b2-design.md", ly_do: "như app" },
  { suite: "pipeline_a", duong: "_acceptance/sao-luu-ma-hoa-b2", ly_do: "như app" },
  { suite: "pipeline_a", duong: "docs/superpowers/specs/2026-11-11-sao-luu-ma-hoa-b2-design.md", ly_do: "như app" },
  { suite: "pipeline_a", duong: "PRODUCT-MAP.md", ly_do: "pipeline/scripts/tap-nhan-hai-khu-ranh-gioi.mjs: tên nằm trong tập MAY_SINH để BỎ QUA khi đọc diff, không phải tệp nạp" },
  { suite: "pipeline_a", duong: "_acceptance/ma-du-an-s06-thanh-nut/evidence", ly_do: "pipeline/scripts/noi-du-an-s06-that.mjs: thư mục GHI bằng chứng (mkdirSync + writeFileSync), không phải đầu vào" },
  { suite: "pipeline_b", duong: "_acceptance/sao-luu-ma-hoa-b2", ly_do: "như pipeline_a" },
  { suite: "pipeline_b", duong: "docs/superpowers/specs/2026-11-11-sao-luu-ma-hoa-b2-design.md", ly_do: "như pipeline_a" },
  { suite: "pipeline_b", duong: "PRODUCT-MAP.md", ly_do: "như pipeline_a" },
  { suite: "pipeline_b", duong: "_acceptance/ma-du-an-s06-thanh-nut/evidence", ly_do: "như pipeline_a" },
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
  // chiều đỏ thứ hai (S4 r1 t1/t2): module một tệp nạp tệp cùng thư mục bằng "./x" — bỏ cổng tầng A khỏi portal_static
  const hongPs = { ...VUNG, portal_static: VUNG.portal_static.filter((g) => g !== "scripts/check-ops-tier-a.mjs" && g !== "db/**") };
  const thieuPs = chuaPhu(ROOT, hongPs).portal_static.thieu.map(([d]) => d);
  assert.ok(thieuPs.includes("scripts/check-ops-tier-a.mjs"), "S4V-AC-5 đối chứng: bỏ check-ops-tier-a.mjs khỏi portal_static mà phép quét không đỏ");
  assert.ok(thieuPs.includes("db"), "S4V-AC-5 đối chứng: bỏ db/** khỏi portal_static mà phép quét không thấy tier-a-source-names đọc db/migrations");
});

test("S4V-AC-6 — executors.suite.* bọc nguyên văn lệnh hiện hành, suite_keys trỏ đúng tám key; thêm key test mới vẫn xanh", () => {
  const cfg = readFileSync(path.join(ROOT, "_acceptance/config.yaml"), "utf8");
  const ten = ["agent", "app", "app_ui", "pipeline_a", "pipeline_b", "ui_lint_rules", "portal_static", "scripts"];
  // suite scripts (suite-scripts-vao-luot-cham) không bọc nguyên văn: nó chạy các bước job CI scripts trên tập chọn theo
  // tệp khai; lệnh gốc executors.test.scripts vẫn phải còn nguyên.
  const RIENG = { scripts: "node scripts/suite-neu-doi.mjs --chay-scripts" };
  const khoi = (c, k) => { const m = c.match(new RegExp(`^  ${k}:\\n((?:    .*\\n|\\s*#.*\\n|\\s*\\n)*)`, "m")); return m ? m[1] : ""; };
  const lenh = (khoiTxt, k) => { const m = khoiTxt.match(new RegExp(`^    ${k}: "((?:[^"\\\\]|\\\\.)*)"`, "m")); return m ? m[1] : null; };
  const kiem = (c) => {
    const sai = [];
    const keys = c.match(/^  suite_keys: \[([^\]]*)\]/m);
    if (!keys || keys[1].split(",").map((x) => x.trim()).join() !== ten.map((x) => `executors.suite.${x}`).join()) sai.push("suite_keys");
    for (const x of ten) {
      const goc = lenh(khoi(c, x === "portal_static" ? "script" : "test"), x);
      if (!goc || goc.includes("'")) { sai.push(`${x}: lệnh gốc vắng hoặc có nháy đơn`); continue; }
      const mong = RIENG[x] ?? `node scripts/suite-neu-doi.mjs ${x} -- '${goc}'`;
      if (lenh(khoi(c, "suite"), x) !== mong) sai.push(x);
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

// ── suite-scripts-vao-luot-cham: bộ chọn tệp test scripts theo tệp khai vùng ─────────────────────────────────────
const KHAI_GIA = { "scripts/a.test.mjs": ["pipeline/x.mjs"], "scripts/b.test.mjs": ["app/**"], "scripts/c.test.mjs": "luon" };
const TESTS_GIA = Object.keys(KHAI_GIA);
const chonGia = (tep, them = {}) => chonScripts({ tep, khai: KHAI_GIA, tests: TESTS_GIA, ...them });

test("SSL-AC-2 — chọn theo tệp khai: vùng chạm diff thì chạy, không chạm thì bỏ, lý do có tên", () => {
  const a = chonGia(["pipeline/x.mjs"]);
  assert.deepEqual(a.chon, ["scripts/a.test.mjs", "scripts/c.test.mjs"], "SSL-AC-2 diff pipeline/x.mjs phải chọn a và c, không b");
  assert.equal(a.ly_do["scripts/a.test.mjs"], "vùng: pipeline/x.mjs");
  assert.equal(a.ly_do["scripts/c.test.mjs"], "luôn");
  assert.deepEqual(chonGia(["app/src/y.ts"]).chon, ["scripts/b.test.mjs", "scripts/c.test.mjs"], "SSL-AC-2 diff app/ phải chọn b và c");
  const b = chonGia(["scripts/b.test.mjs"]);
  assert.ok(b.chon.includes("scripts/b.test.mjs"), "SSL-AC-2 chính tệp test trong diff phải được chọn");
  assert.equal(b.ly_do["scripts/b.test.mjs"], "tệp test trong diff");
  assert.deepEqual(chonGia(["docs/khong-ai-doc.md"]).chon, ["scripts/c.test.mjs"], "SSL-AC-2 diff ngoài mọi vùng chỉ còn tập luôn");
  // Review Focus 1: «**» giữa đường; 3: tệp đã xoá vẫn so được bằng đường.
  assert.ok(khop("pipeline/x.test.mjs", "pipeline/**/*.test.mjs") && khop("pipeline/a/b/x.test.mjs", "pipeline/**/*.test.mjs"),
    "SSL-AC-2 glob «**/» phải khớp cả không tầng lẫn nhiều tầng");
  assert.ok(!khop("pipeline/x.mjs", "pipeline/**/*.test.mjs"), "SSL-AC-2 đối chứng: «**/*.test.mjs» không khớp tệp thường");
  assert.deepEqual(chonGia(["pipeline/x.mjs"]).chon, chonScripts({ tep: ["pipeline/x.mjs"], khai: KHAI_GIA, tests: TESTS_GIA }).chon);
});

test("SSL-AC-4 — diff chạm hạ tầng chung thì trọn bộ, gọi tên tệp; tệp scripts thường thì không", () => {
  const MAU = {
    "scripts/lib/**": "scripts/lib/x.mjs", "db/migrations/**": "db/migrations/999_x.sql",
    "scripts/ci-db-init.mjs": "scripts/ci-db-init.mjs", "scripts/ci-bo-qua.json": "scripts/ci-bo-qua.json",
    ".github/workflows/ci-test.yml": ".github/workflows/ci-test.yml", "scripts/suite-scripts-vung.json": "scripts/suite-scripts-vung.json",
    "app/package.json": "app/package.json", "app/package-lock.json": "app/package-lock.json",
    "pipeline/package.json": "pipeline/package.json", "pipeline/package-lock.json": "pipeline/package-lock.json",
    "agent/package.json": "agent/package.json", "agent/package-lock.json": "agent/package-lock.json",
  };
  assert.deepEqual(Object.keys(MAU).sort(), [...HA_TANG].sort(), "SSL-AC-4 ma trận viết trước phải đủ đúng các phần tử HA_TANG");
  for (const [glob, tep] of Object.entries(MAU)) {
    const r = chonGia([tep]);
    assert.equal(r.chon.length, TESTS_GIA.length, `SSL-AC-4 ${glob}: diff ${tep} phải trọn bộ`);
    assert.match(r.tron_bo ?? "", new RegExp(tep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `SSL-AC-4 ${glob}: lý do phải gọi tên ${tep}`);
  }
  for (const tep of ["scripts/x.mjs", "scripts/lib-khac/x.mjs"]) assert.equal(chonGia([tep]).tron_bo, null, `SSL-AC-4 đối chứng: ${tep} không được trọn bộ`);
});

test("SSL-AC-8 — không chắc thì trọn bộ, lý do có tên; diff chạm vùng thì không", () => {
  const ca = [
    [{ tep: null }, /không giải được gốc/], [{ tep: [] }, /diff rỗng/],
    [{ tep: ["pipeline/x.mjs"], khai: null, loiKhai: "không đọc được tệp khai: Unexpected token" }, /không đọc được tệp khai/],
    [{ tep: ["pipeline/x.mjs"], ep: true }, /ép chạy/],
  ];
  for (const [them, re] of ca) {
    const r = chonScripts({ khai: KHAI_GIA, tests: TESTS_GIA, ...them });
    assert.equal(r.chon.length, TESTS_GIA.length, `SSL-AC-8 ${re}: phải trọn bộ`);
    assert.match(r.tron_bo ?? "", re, `SSL-AC-8 lý do phải khớp ${re}`);
  }
  assert.equal(chonGia(["pipeline/x.mjs"]).tron_bo, null, "SSL-AC-8 đối chứng: diff chạm một vùng thì không trọn bộ");
  // tệp khai hỏng JSON trên đĩa → docKhai trả lỗi có tên
  const dir = mkdtempSync(path.join(tmpdir(), "ssl8-"));
  try {
    mkdirSync(path.join(dir, "scripts"));
    writeFileSync(path.join(dir, "scripts/suite-scripts-vung.json"), "{ hỏng");
    const k = docKhai(dir);
    assert.equal(k.khai, null);
    assert.match(k.loi ?? "", /không đọc được tệp khai/, "SSL-AC-8 docKhai phải gọi tên lỗi tệp khai");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// Ca canh: mọi scripts/*.test.mjs có đúng một dòng khai đúng hình; trả danh sách lỗi có tên.
function loiKhai(khai, tests) {
  const loi = [];
  for (const t of tests) if (!Object.hasOwn(khai, t)) loi.push(`thiếu dòng khai: ${t}`);
  for (const [t, z] of Object.entries(khai)) {
    if (!tests.includes(t)) loi.push(`dòng khai thừa (tệp không tồn tại): ${t}`);
    else if (z !== "luon" && !(Array.isArray(z) && z.length && z.every((g) => typeof g === "string" && g))) loi.push(`vùng khai hỏng: ${t}`);
  }
  return loi;
}

test("SSL-AC-3 — tệp khai đủ, đúng hình; tệp chưa khai thì đỏ và bộ chọn coi là luôn", () => {
  const { khai, loi } = docKhai(ROOT);
  assert.equal(loi, null, `SSL-AC-3 ${loi}`);
  const tests = testsScripts(ROOT);
  assert.deepEqual(loiKhai(khai, tests), [], "SSL-AC-3 tệp khai lệch tập scripts/*.test.mjs");
  // chiều đỏ trên bản sao
  const thieu = { ...khai }; delete thieu["scripts/db-thu.test.mjs"];
  assert.deepEqual(loiKhai(thieu, tests), ["thiếu dòng khai: scripts/db-thu.test.mjs"], "SSL-AC-3 đối chứng: bỏ một dòng phải gọi tên tệp thiếu");
  const r = chonScripts({ tep: ["docs/khong-ai-doc.md"], khai: thieu, tests });
  assert.equal(r.ly_do["scripts/db-thu.test.mjs"], "luôn (chưa khai)", "SSL-AC-3 tệp chưa khai phải được bộ chọn coi là luôn");
  assert.deepEqual(loiKhai({ ...khai, "scripts/khong-co.test.mjs": ["app/**"] }, tests), ["dòng khai thừa (tệp không tồn tại): scripts/khong-co.test.mjs"]);
  assert.deepEqual(loiKhai({ ...khai, "scripts/db-thu.test.mjs": [] }, tests), ["vùng khai hỏng: scripts/db-thu.test.mjs"]);
});

test("SSL-AC-5 — tệp khai khớp ma trận đọc tay: luôn ⇔ liệt kê cả kho, chủ thể trong vùng, vùng db-thu khoanh ba bộ", () => {
  const { khai } = docKhai(ROOT);
  const mt = JSON.parse(readFileSync(path.join(ROOT, "_acceptance/suite-scripts-vao-luot-cham/ma-tran.json"), "utf8"));
  const tests = testsScripts(ROOT);
  assert.equal(Object.keys(mt.doc).length, tests.length, "SSL-AC-5 ma trận phải có đúng một dòng cho mỗi tệp test");
  for (const t of tests) {
    const caKho = (mt.doc[t] ?? "").startsWith("lietke-ca-kho");
    assert.equal(khai[t] === "luon", caKho, `SSL-AC-5 ${t}: luon phải trùng «liệt kê cả kho» của ma trận (ma trận: ${mt.doc[t]})`);
  }
  const loThieu = (k) => Object.entries(mt.chu_the).filter(([t, c]) => k[t] !== "luon" && !trongVung(c, k[t])).map(([t]) => t);
  assert.equal(Object.keys(mt.chu_the).length, 15, "SSL-AC-5 ma trận phải ghi đủ 15 cặp chủ thể");
  assert.deepEqual(loThieu(khai), [], "SSL-AC-5 vùng khai thiếu chủ thể cùng thân tên");
  const dt = khai["scripts/db-thu.test.mjs"];
  assert.ok(Array.isArray(dt) && !dt.includes("**"), "SSL-AC-5 vùng db-thu không được là luon hay «**»");
  for (const p of ["app/tests/x.test.tsx", "app/probes/x.test.tsx", "pipeline/a/b.test.mjs", "agent/tests/x.test.ts"])
    assert.ok(trongVung(p, dt), `SSL-AC-5 vùng db-thu phải khớp ${p}`);
  // chiều đỏ: bỏ chủ thể khỏi vùng của dung-worktree-cham
  const hong = { ...khai, "scripts/dung-worktree-cham.test.mjs": khai["scripts/dung-worktree-cham.test.mjs"].filter((g) => g !== "scripts/dung-worktree-cham.sh") };
  assert.deepEqual(loThieu(hong), ["scripts/dung-worktree-cham.test.mjs"], "SSL-AC-5 đối chứng: bỏ chủ thể phải gọi tên dung-worktree-cham");
});

// ── SSL-AC-1: lệnh suite scripts tương đương job CI scripts ─────────────────────────────────────────────────────
const yamlLib = createRequire(path.join(ROOT, "app/package.json"))("js-yaml");
const jobScripts = () => yamlLib.load(readFileSync(path.join(ROOT, ".github/workflows/ci-test.yml"), "utf8")).jobs.scripts;
function phanTu(job) {
  const out = (job.steps ?? []).map((s) => (s.uses ? `uses ${s.uses.split("@")[0]}` : `run: ${s.name}`));
  for (const [svc, cfg] of Object.entries(job.services ?? {})) {
    out.push(`services.${svc}.image`);
    if (cfg.env) out.push(`services.${svc}.env`);
  }
  for (const k of Object.keys(job.env ?? {})) out.push(`env.${k}`);
  return out;
}
const MT_CI = () => JSON.parse(readFileSync(path.join(ROOT, "_acceptance/suite-scripts-vao-luot-cham/ma-tran.json"), "utf8")).ci;
const lechCi = (job, ci) => {
  const pt = phanTu(job);
  return [...pt.filter((p) => !Object.hasOwn(ci, p)).map((p) => `phần tử chưa có dòng: ${p}`),
    ...Object.keys(ci).filter((k) => !pt.includes(k)).map((k) => `dòng thừa: ${k}`)];
};
const coDocker = () => spawnSync("docker", ["inspect", "-f", "{{.Config.Image}}", "one-invest-db"], { encoding: "utf8" });

test("SSL-AC-1 ma trận — mọi phần tử job scripts có dòng; bước tương đương, ảnh DB và bản chính Node khớp", (t) => {
  const job = jobScripts(), ci = MT_CI();
  assert.deepEqual(lechCi(job, ci), [], "SSL-AC-1 ma trận ci lệch phần tử job scripts");
  const tuong = Object.entries(ci).filter(([k, v]) => k.startsWith("run: ") && v.startsWith("tuong-duong")).map(([k]) => k.slice(5));
  assert.deepEqual(tuong, BUOC_CI, "SSL-AC-1 bước tương đương của ma trận phải đúng BUOC_CI");
  assert.deepEqual(buocSuite(ROOT).map((b) => b.ten), BUOC_CI);
  for (const b of buocSuite(ROOT)) assert.equal(b.lenh, job.steps.find((s) => s.name === b.ten).run.trim(), `SSL-AC-1 lệnh «${b.ten}» phải là nguyên văn run của job`);
  const node = String(job.steps.find((s) => (s.uses ?? "").startsWith("actions/setup-node")).with["node-version"]);
  assert.equal(process.versions.node.split(".")[0], node, "SSL-AC-1 bản chính Node lệch job");
  // chiều đỏ cùng fixture
  const them = structuredClone(job); them.steps.push({ name: "bước lạ", run: "true" });
  assert.deepEqual(lechCi(them, ci), ["phần tử chưa có dòng: run: bước lạ"], "SSL-AC-1 đối chứng: bước mới phải đỏ gọi tên");
  const d = coDocker();
  if (process.env.CI || d.status !== 0) return t.skip("không có container one-invest-db — chỉ kiểm được ảnh trên máy thu");
  const anh = (j) => Object.values(j.services)[0].image;
  assert.equal(d.stdout.trim(), anh(job), "SSL-AC-1 ảnh DB của máy lệch services của job");
  const doi = structuredClone(job); Object.values(doi.services)[0].image = "postgres:16";
  assert.notEqual(d.stdout.trim(), anh(doi), "SSL-AC-1 đối chứng: đổi ảnh services phải lệch, gọi tên postgres:16");
});

test("SSL-AC-1 đầu ra thật — test nối DB trống vừa dựng, CI=true, ca bỏ đúng ci-bo-qua; DB bị xoá kể cả khi SIGTERM", async (t) => {
  if (process.env.CI || coDocker().status !== 0) return t.skip("cần docker và container one-invest-db của máy thu");
  const dir = mkdtempSync(path.join(tmpdir(), "ssl1-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ra = path.join(dir, "ra.json");
  const mau = (cho) => `import { test } from "node:test"; import { writeFileSync } from "node:fs"; import { createRequire } from "node:module";
const pg = createRequire(${JSON.stringify(path.join(ROOT, "app/package.json"))})("pg");
test("ssl1-mau", async () => { const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
  const db = (await c.query("select current_database() as d")).rows[0].d; await c.end();
  writeFileSync(${JSON.stringify(ra)}, JSON.stringify({ db, ci: process.env.CI, no: process.env.NODE_OPTIONS ?? "" }));
  ${cho ? "await new Promise((r) => setTimeout(r, 60000));" : ""} });`;
  const coDb = (ten) => spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost", "-d", "oneinvest", "-At", "-c", `select count(*) from pg_database where datname='${ten}'`], { encoding: "utf8" }).stdout.trim() === "1";
  writeFileSync(path.join(dir, "mau.test.mjs"), mau(false));
  const r = spawnSync(process.execPath, [LENH, "--chay-scripts", "--tep", path.join(dir, "mau.test.mjs")], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, `SSL-AC-1 lệnh suite thoát ${r.status}: ${(r.stderr || "").slice(-400)}`);
  const o = JSON.parse(readFileSync(ra, "utf8"));
  assert.match(o.db, /^oneinvest_ci_scripts_\d+$/, `SSL-AC-1 test phải nối DB trống vừa dựng, không phải ${o.db}`);
  assert.equal(o.ci, "true", "SSL-AC-1 bước test phải thấy CI=true như runner GitHub");
  const mong = spawnSync(process.execPath, ["scripts/lib/ci-can-du-lieu.mjs", "scripts"], { cwd: ROOT, encoding: "utf8", env: { ...process.env, CI: "true" } }).stdout.trim();
  assert.equal(o.no.trim(), mong, "SSL-AC-1 NODE_OPTIONS phải đúng danh sách ca bỏ của ci-bo-qua.json cho scripts");
  assert.equal(coDb(o.db), false, `SSL-AC-1 DB ${o.db} phải bị xoá khi lệnh xong`);
  // Review Focus 4: ngắt giữa chừng
  rmSync(ra, { force: true }); writeFileSync(path.join(dir, "mau.test.mjs"), mau(true));
  const { spawn } = await import("node:child_process");
  const p = spawn(process.execPath, [LENH, "--chay-scripts", "--tep", path.join(dir, "mau.test.mjs")], { cwd: ROOT, stdio: "ignore" });
  for (let i = 0; i < 240 && !existsSync(ra); i++) await new Promise((res) => setTimeout(res, 500));
  const db2 = JSON.parse(readFileSync(ra, "utf8")).db;
  const ma = await new Promise((res) => { p.on("exit", (c, s) => res(c ?? s)); p.kill("SIGTERM"); });
  assert.equal(ma, 143, "SSL-AC-1 bị SIGTERM thì thoát 143");
  assert.equal(coDb(db2), false, `SSL-AC-1 DB ${db2} phải bị xoá cả khi lệnh bị ngắt`);
});

test("SSL-AC-4 node --check — không tệp nào được chọn thì bước kiểm cú pháp vẫn chạy, bước test bỏ có lời", (t) => {
  if (process.env.CI || coDocker().status !== 0) return t.skip("cần docker và container one-invest-db của máy thu");
  const r = spawnSync(process.execPath, [LENH, "--chay-scripts", "--tep", ","], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, `SSL-AC-4 lệnh với tập rỗng thoát ${r.status}: ${(r.stderr || "").slice(-300)}`);
  assert.match(r.stdout, /scripts — 0\/\d+ tệp/, "SSL-AC-4 tập chọn phải rỗng");
  assert.match(r.stdout, /bước «kiểm cú pháp \.mjs»/, "SSL-AC-4 bước node --check phải chạy kể cả khi không chọn tệp nào");
  assert.match(r.stdout, /bước test bỏ — không tệp nào được chọn/, "SSL-AC-4 bước test phải bỏ có lời, không gọi node --test rỗng");
});
