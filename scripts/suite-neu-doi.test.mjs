// Thước của scripts/suite-neu-doi.mjs (hồ sơ s4-suite-theo-vung). Không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUOC_CI, VUNG, buocSuite, quyetDinh, tomTatScripts, trongVung } from "./suite-neu-doi.mjs";
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

test("S4V-AC-6 — executors.suite.* bọc nguyên văn lệnh hiện hành, suite_keys trỏ đúng bảy key; thêm key test mới vẫn xanh", () => {
  const cfg = readFileSync(path.join(ROOT, "_acceptance/config.yaml"), "utf8");
  const ten = ["agent", "app", "app_ui", "pipeline_a", "pipeline_b", "ui_lint_rules", "portal_static"];
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

// ── suite-scripts-vao-luot-cham: lệnh --chay-scripts chạy trọn bộ scripts theo đúng các bước job CI ─────────────
const yamlLib = createRequire(path.join(ROOT, "app/package.json"))("js-yaml");
const jobScripts = () => yamlLib.load(readFileSync(path.join(ROOT, ".github/workflows/ci-test.yml"), "utf8")).jobs.scripts;
function phanTu(job) {
  const out = (job.steps ?? []).map((s) => (s.uses ? `uses ${s.uses.split("@")[0]}` : `run: ${s.name}`));
  for (const [svc, cfg] of Object.entries(job.services ?? {})) { out.push(`services.${svc}.image`); if (cfg.env) out.push(`services.${svc}.env`); }
  for (const k of Object.keys(job.env ?? {})) out.push(`env.${k}`);
  return out;
}
const MT_CI = () => JSON.parse(readFileSync(path.join(ROOT, "_acceptance/suite-scripts-vao-luot-cham/ma-tran.json"), "utf8")).ci;
const lechCi = (job, ci) => { const pt = phanTu(job);
  return [...pt.filter((p) => !Object.hasOwn(ci, p)).map((p) => `phần tử chưa có dòng: ${p}`), ...Object.keys(ci).filter((k) => !pt.includes(k)).map((k) => `dòng thừa: ${k}`)]; };
const coDocker = () => spawnSync("docker", ["inspect", "-f", "{{.Config.Image}}", "one-invest-db"], { encoding: "utf8" });
const coDb = (ten) => spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost", "-d", "oneinvest", "-At", "-c", `select count(*) from pg_database where datname='${ten}'`], { encoding: "utf8" }).stdout.trim() === "1";
const dongCuoi = (out) => JSON.parse(out.trim().split("\n").pop());
function tepMau(dir, { ra, cho = false, do_ = false }) {
  const f = path.join(dir, `mau-${Math.random().toString(36).slice(2)}.test.mjs`);
  writeFileSync(f, `import { test } from "node:test"; import assert from "node:assert"; import { writeFileSync } from "node:fs"; import { createRequire } from "node:module";
const pg = createRequire(${JSON.stringify(path.join(ROOT, "app/package.json"))})("pg");
test("ssl-mau", async () => { const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
  const db = (await c.query("select current_database() as d")).rows[0].d; await c.end();
  writeFileSync(${JSON.stringify(ra)}, JSON.stringify({ db, ci: process.env.CI, no: process.env.NODE_OPTIONS ?? "" }));
  ${cho ? "await new Promise((r) => setTimeout(r, 60000));" : ""} ${do_ ? 'assert.fail("ssl-mau đỏ cố ý");' : ""} });`);
  return f;
}

test("SSL-AC-1 ma trận — mọi phần tử job scripts có dòng; bước là nguyên văn run của job; ảnh DB và bản chính Node khớp", (t) => {
  const job = jobScripts(), ci = MT_CI();
  assert.deepEqual(lechCi(job, ci), [], "SSL-AC-1 ma trận ci lệch phần tử job scripts");
  const tuong = Object.entries(ci).filter(([k, v]) => k.startsWith("run: ") && v.startsWith("tuong-duong")).map(([k]) => k.slice(5));
  assert.deepEqual(tuong, BUOC_CI, "SSL-AC-1 bước tương đương của ma trận phải đúng BUOC_CI");
  for (const b of buocSuite(ROOT)) assert.equal(b.lenh, job.steps.find((s) => s.name === b.ten).run.trim(), `SSL-AC-1 lệnh «${b.ten}» phải là nguyên văn run của job`);
  const node = String(job.steps.find((s) => (s.uses ?? "").startsWith("actions/setup-node")).with["node-version"]);
  assert.equal(process.versions.node.split(".")[0], node, "SSL-AC-1 bản chính Node lệch job");
  const them = structuredClone(job); them.steps.push({ name: "bước lạ", run: "true" });
  assert.deepEqual(lechCi(them, ci), ["phần tử chưa có dòng: run: bước lạ"], "SSL-AC-1 đối chứng: bước mới phải đỏ gọi tên");
  const d = coDocker();
  if (process.env.CI || d.status !== 0) return t.skip("không có container one-invest-db — chỉ kiểm được ảnh trên máy thu");
  const anh = (j) => Object.values(j.services)[0].image;
  assert.equal(d.stdout.trim(), anh(job), "SSL-AC-1 ảnh DB của máy lệch services của job");
  const doi = structuredClone(job); Object.values(doi.services)[0].image = "postgres:16";
  assert.notEqual(d.stdout.trim(), anh(doi), "SSL-AC-1 đối chứng: đổi ảnh services phải lệch, gọi tên postgres:16");
});

test("SSL-AC-1 đầu ra thật — test nối DB trống vừa dựng, thấy CI=true, ca bỏ đúng ci-bo-qua", (t) => {
  if (process.env.CI || coDocker().status !== 0) return t.skip("cần docker và container one-invest-db của máy thu");
  const dir = mkdtempSync(path.join(tmpdir(), "ssl1-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ra = path.join(dir, "ra.json");
  const r = spawnSync(process.execPath, [LENH, "--chay-scripts", "--tep", tepMau(dir, { ra })], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, `SSL-AC-1 lệnh thoát ${r.status}: ${(r.stderr || "").slice(-400)}`);
  const o = JSON.parse(readFileSync(ra, "utf8"));
  assert.match(o.db, /^oneinvest_ci_scripts_\d+$/, `SSL-AC-1 test phải nối DB trống vừa dựng, không phải ${o.db}`);
  assert.equal(o.ci, "true", "SSL-AC-1 bước test phải thấy CI=true như runner GitHub");
  const mong = spawnSync(process.execPath, ["scripts/lib/ci-can-du-lieu.mjs", "scripts"], { cwd: ROOT, encoding: "utf8", env: { ...process.env, CI: "true" } }).stdout.trim();
  assert.equal(o.no.trim(), mong, "SSL-AC-1 NODE_OPTIONS phải đúng danh sách ca bỏ của ci-bo-qua.json cho scripts");
});

test("SSL-AC-2 — dòng scripts-ci khi xanh và khi đỏ, --ho-so ghi run-log, hồ sơ vắng thoát 2, DB luôn được dọn", async (t) => {
  if (process.env.CI || coDocker().status !== 0) return t.skip("cần docker và container one-invest-db của máy thu");
  const dir = mkdtempSync(path.join(tmpdir(), "ssl2-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const slug = `ssl2-tam-${process.pid}`, hs = path.join(ROOT, "_acceptance", slug);
  mkdirSync(hs); t.after(() => rmSync(hs, { recursive: true, force: true }));
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  const chay = (f, them = []) => spawnSync(process.execPath, [LENH, "--chay-scripts", "--tep", f, ...them], { cwd: ROOT, encoding: "utf8" });
  const ra = path.join(dir, "ra.json");
  const x = chay(tepMau(dir, { ra }), ["--ho-so", slug]);
  const d = dongCuoi(x.stdout);
  assert.equal(x.status, 0);
  assert.deepEqual([d.kind, d.sha, d.exit, d.tests, d.pass, d.fail], ["scripts-ci", sha, 0, 1, 1, 0], "SSL-AC-2 dòng tóm tắt khi xanh");
  assert.equal(typeof d.giay, "number");
  const log = readFileSync(path.join(hs, "run-log.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(log.at(-1), d, "SSL-AC-2 --ho-so phải nối đúng dòng tóm tắt vào run-log của hồ sơ");
  assert.equal(coDb(JSON.parse(readFileSync(ra, "utf8")).db), false, "SSL-AC-2 DB phải bị xoá khi lệnh xong");
  const dd = chay(tepMau(dir, { ra, do_: true }));
  const dt = dongCuoi(dd.stdout);
  assert.notEqual(dd.status, 0, "SSL-AC-2 tệp mẫu đỏ thì lệnh phải đỏ");
  assert.ok(dt.exit !== 0 && dt.fail >= 1, `SSL-AC-2 dòng tóm tắt khi đỏ phải mang exit ≠ 0 và fail ≥ 1: ${JSON.stringify(dt)}`);
  const v = spawnSync(process.execPath, [LENH, "--chay-scripts", "--ho-so", "khong-co-ho-so-nay"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(v.status, 2, "SSL-AC-2 hồ sơ không tồn tại phải thoát 2");
  assert.equal(existsSync(path.join(ROOT, "_acceptance/khong-co-ho-so-nay")), false, "SSL-AC-2 không được tạo hồ sơ hay run-log");
  // ngắt giữa chừng
  rmSync(ra, { force: true });
  const { spawn } = await import("node:child_process");
  const p = spawn(process.execPath, [LENH, "--chay-scripts", "--tep", tepMau(dir, { ra, cho: true })], { cwd: ROOT, stdio: "ignore" });
  for (let i = 0; i < 240 && !existsSync(ra); i++) await new Promise((res) => setTimeout(res, 500));
  const db2 = JSON.parse(readFileSync(ra, "utf8")).db;
  const ma = await new Promise((res) => { p.on("exit", (c, s) => res(c ?? s)); p.kill("SIGTERM"); });
  assert.equal(ma, 143, "SSL-AC-2 bị SIGTERM thì thoát 143");
  assert.equal(coDb(db2), false, `SSL-AC-2 DB ${db2} phải bị xoá cả khi lệnh bị ngắt`);
});

test("SSL-AC-2 tomTatScripts — đọc số ca từ dòng tổng kết spec hay tap; không có dòng thì null", () => {
  assert.deepEqual(tomTatScripts("ℹ tests 5\nℹ pass 4\nℹ fail 1\n", { sha: "a", exit: 1, giay: 2 }).fail, 1);
  assert.deepEqual(tomTatScripts("# tests 3\n# pass 3\n# fail 0\n", { sha: "a", exit: 0, giay: 2 }).tests, 3);
  const k = tomTatScripts("bị giết giữa chừng", { sha: "a", exit: 143, giay: 2 });
  assert.deepEqual([k.tests, k.pass, k.fail], [null, null, null], "SSL-AC-2 không có dòng tổng kết thì số ca phải null, không bịa 0");
});
