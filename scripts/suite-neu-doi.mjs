#!/usr/bin/env node
// suite-neu-doi.mjs — chạy một suite của lượt chấm S4 / ghim lại CHỈ khi nhánh đổi vùng của suite đó.
//
//   node scripts/suite-neu-doi.mjs <tên-suite> -- <lệnh>
//
// Tệp đổi = merge-base(origin/main, HEAD)..HEAD ∪ cây làm việc (so HEAD) ∪ tệp chưa theo dõi. Có tệp trong vùng → chạy
// `bash -c <lệnh>` từ gốc kho, trả đúng mã thoát. Không có → in «bỏ qua», thoát 0. Không chắc → CHẠY (bảo thủ):
// không giải được gốc, suite lạ, chỉ đổi _acceptance/ (đường nền đầu vòng), diff rỗng, SUITE_NEU_DOI=chay.
// CI (`ci-test.yml`) vẫn chạy đủ agent, app, app_ui, pipeline, ui_lint_rules trên mọi PR (pipeline ở CI vẫn là
// một lệnh; lượt chấm chạy hai nửa pipeline_a, pipeline_b) — đây chỉ cắt lượt chấm trên
// máy. RIÊNG portal_static (check-portal-compliance.mjs, gồm cổng lộ tầng A) KHÔNG có trong CI: nó chỉ chạy ở lượt chấm
// và ghim lại, nên vùng của nó phải phủ đủ mọi tệp nó nạp (S4 r1 t1).
// Hồ sơ: _acceptance/s4-suite-theo-vung. Bảng vùng đo bằng test canh phủ (scripts/suite-neu-doi.test.mjs, S4V-AC-5).
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Tệp test của các module đọc tệp của module khác (import, chép fixture, quét cây) — vùng rộng theo đo 10/11.
const LOI_APP = [
  "app/**", "agent/**", "pipeline/**", "scripts/**", "db/**", "data-api/**", "CONTEXT.md",
  ".claude/skills/onehub-ui/**", "docs/architecture/**", "docs/product/**", "docs/ops/**",
  "_acceptance/tap-nhan-mau-ocp1/**",
];

const LOI_PIPELINE = [
  "pipeline/**", "db/**", "scripts/**", "agent/**", "app/**", "collector/src/**", "collector/docs/**",
  "collector/scripts/**", "data-api/src/**", "tools/**", "CONTEXT.md", "LO-TRINH.html", "docs/ROADMAP.md",
  "docs/ops/**",
  "docs/adr/**", "docs/research/pty-project-type-s06.md",
  "_acceptance/danh-ba-phuong-xa-toan-quoc/**", "_acceptance/du-an-cua-tin-len-dinh-vi/**",
  "_acceptance/gop-tin-chi-anh-o-transform/**",
  "_acceptance/lay-mau-khu-trung-theo-tin/**", "_acceptance/nhom-dang-ky-hai-lan-s03/**",
  "_acceptance/s03-len-cong/**", "_acceptance/tap-nhan-mau-ocp1/**", "_acceptance/truong-nhan-s03-081/**",
];

export const VUNG = {
  app: LOI_APP,
  app_ui: LOI_APP,
  ui_lint_rules: ["app/**", "db/**", "CONTEXT.md", ".claude/skills/onehub-ui/**"],
  // Hai nửa của `cd pipeline && npm test` (tach-suite-pipeline, 13/11) chạy trên cùng một cây mã, nên cùng vùng:
  // tệp nào kéo nửa A thì cũng kéo nửa B. Chia nửa là chia theo tệp test, không theo vùng mã.
  pipeline_a: LOI_PIPELINE,
  pipeline_b: LOI_PIPELINE,
  agent: [
    "agent/**", "db/**", "pipeline/**", "scripts/**", "docs/ops/**",
    "app/src/lib/ops/review-can-cu.ts", "app/src/lib/vocab.generated.ts",
    "app/tests/the-duyet-du-can-cu.test.tsx", "app/tests/the-duyet-phuong-lech-gia.test.tsx",
    // agent/probes/du-lieu-that.test.ts readdirSync đúng thư mục này để đếm tệp tạm của lượt (l2-bao-thu-doi-probe-that,
    // nhận main 16/11); cả đường thư mục trần lẫn tệp dưới nó đều phải nằm trong vùng.
    "app/probes", "app/probes/**",
    "_acceptance/config.yaml", "_acceptance/chon-model-theo-o/**", "_acceptance/the-ghep-can-tin-roi-kho/**",
  ],
  // check-portal-compliance.mjs nạp các cổng check-*.mjs cùng thư mục; tier-a-source-names.mjs rút tên nguồn từ
  // db/migrations (seed source_registry) và mask-source-names.mjs của pipeline — đổi migration là đổi cổng tầng A.
  portal_static: [
    "app/**", "db/**", "scripts/check-portal-compliance.mjs", "scripts/check-ops-tier-a.mjs",
    "scripts/check-deals-api.mjs", "scripts/check-api-surface.mjs", "scripts/check-mcp-tools.mjs",
    "scripts/lib/ops-visible-strings.mjs", "scripts/lib/tier-a-source-names.mjs", "pipeline/lib/mask-source-names.mjs",
  ],
};

// Mỗi suite còn chạy khi chính bộ lọc đổi — bộ lọc sai thì mọi quyết định sau nó sai.
const CHUNG = ["scripts/suite-neu-doi.mjs"];

// «**/» giữa đường = không hay nhiều tầng thư mục (pipeline/**/*.test.mjs khớp cả pipeline/x.test.mjs).
const reGlob = (g) =>
  new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\//g, "\u0001").replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*").replace(/\u0001/g, "(?:.*/)?").replace(/\u0000/g, ".*") + "$");

// `x/**` = mọi đường dưới x; không có `*` = khớp nguyên đường.
export function khop(duong, glob) {
  if (glob.endsWith("/**")) return duong.startsWith(glob.slice(0, -2));
  if (!glob.includes("*")) return duong === glob;
  return reGlob(glob).test(duong);
}

export const trongVung = (duong, vung) => vung.some((g) => khop(duong, g));

// ── Suite «scripts» (hồ sơ suite-scripts-vao-luot-cham): chọn TỪNG tệp scripts/*.test.mjs theo tệp khai vùng viết tay.
// Không tính vùng tự động: lời đọc liệt kê nằm nhiều trong tệp được import, xét an toàn thì 20–34/43 tệp phải luôn chạy.
export const TEP_KHAI = "scripts/suite-scripts-vung.json";
// Hạ tầng chung: đổi một tệp này thì mọi tệp test có thể đổi kết quả → trọn bộ.
export const HA_TANG = [
  "scripts/lib/**", "db/migrations/**", "scripts/ci-db-init.mjs", "scripts/ci-bo-qua.json", ".github/workflows/ci-test.yml",
  TEP_KHAI, "app/package.json", "app/package-lock.json", "pipeline/package.json", "pipeline/package-lock.json",
  "agent/package.json", "agent/package-lock.json",
];

export function docKhai(root, tep = path.join(root, TEP_KHAI)) {
  try {
    const khai = JSON.parse(readFileSync(tep, "utf8"));
    if (!khai || typeof khai !== "object" || Array.isArray(khai)) throw new Error("gốc không phải object");
    return { khai, loi: null };
  } catch (e) {
    return { khai: null, loi: `không đọc được tệp khai ${TEP_KHAI}: ${e.message}` };
  }
}

// Đúng tập `scripts/*.test.mjs` mà glob của job CI mở ra (một tầng, kể cả tệp chưa theo dõi).
export const testsScripts = (root) =>
  readdirSync(path.join(root, "scripts")).filter((f) => f.endsWith(".test.mjs")).sort().map((f) => `scripts/${f}`);

// Quyết định thuần. tep = null nghĩa là không đọc được diff. Tệp test chưa có dòng khai được coi là «luon».
export function chonScripts({ tep, khai, tests, ep = false, loiKhai = null }) {
  const tronBo = (ly) => ({ chon: [...tests], ly_do: Object.fromEntries(tests.map((t) => [t, `trọn bộ: ${ly}`])), tron_bo: ly });
  if (ep) return tronBo("ép chạy (SUITE_NEU_DOI=chay)");
  if (tep === null) return tronBo("không giải được gốc so sánh");
  if (!khai) return tronBo(loiKhai || `không đọc được tệp khai ${TEP_KHAI}`);
  if (tep.length === 0) return tronBo("diff rỗng");
  const ht = tep.find((p) => trongVung(p, HA_TANG));
  if (ht) return tronBo(`chạm hạ tầng chung ${ht}`);
  const chon = [], ly_do = {};
  for (const t of tests) {
    const co = Object.hasOwn(khai, t);
    const z = co ? khai[t] : "luon";
    if (z === "luon") { chon.push(t); ly_do[t] = co ? "luôn" : "luôn (chưa khai)"; continue; }
    if (tep.includes(t)) { chon.push(t); ly_do[t] = "tệp test trong diff"; continue; }
    const p = tep.find((x) => trongVung(x, z));
    if (p) { chon.push(t); ly_do[t] = `vùng: ${p}`; }
  }
  return { chon, ly_do, tron_bo: null };
}

const tomTat = (vung) => (vung.length <= 4 ? vung.join(", ") : `${vung.slice(0, 4).join(", ")} … (+${vung.length - 4})`);

// Quyết định thuần: { chay, ly_do, kich? }. tep = null nghĩa là không đọc được diff.
export function quyetDinh(ten, tep, { ep = false } = {}) {
  if (ep) return { chay: true, ly_do: "ép chạy (SUITE_NEU_DOI=chay)" };
  const vung = VUNG[ten];
  if (!vung) return { chay: true, ly_do: `suite lạ «${ten}» — không có trong bảng vùng` };
  if (tep === null) return { chay: true, ly_do: "không giải được gốc so sánh — chạy đủ" };
  const ma = tep.filter((t) => !t.startsWith("_acceptance/"));
  // «Chưa có mã»: không tệp nào (ngoài _acceptance/) thuộc vùng của BẤT KỲ suite nào — đầu vòng nhánh mới có hồ sơ,
  // tài liệu thiết kế, kế hoạch; đường nền cần đủ sáu suite.
  const vungHop = [...CHUNG, ...Object.values(VUNG).flat()];
  if (!ma.some((t) => trongVung(t, vungHop))) return { chay: true, ly_do: "chưa có thay đổi mã (không tệp nào thuộc vùng suite nào) — chạy đủ làm nền" };
  const kich = ma.filter((t) => trongVung(t, [...CHUNG, ...vung]));
  const kichAcc = tep.filter((t) => t.startsWith("_acceptance/") && trongVung(t, vung));
  const tatCa = [...kich, ...kichAcc];
  if (tatCa.length) return { chay: true, ly_do: `đổi ${tatCa[0]}${tatCa.length > 1 ? ` (+${tatCa.length - 1} tệp trong vùng)` : ""}`, kich: tatCa };
  return { chay: false, ly_do: `không đổi ${tomTat(vung)} (${ma.length} tệp đổi ngoài vùng)` };
}

const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

// Tập tệp đổi của nhánh; null khi không đọc được (không phải kho git, ref gốc vắng…).
export function tepDoi(cwd, base = process.env.SUITE_NEU_DOI_BASE) {
  try {
    const goc = base || "origin/main";
    const mb = git(cwd, "merge-base", goc, "HEAD").trim();
    // --no-renames: git bật nhận diện đổi tên mặc định, nên `git mv a b` chỉ in đường ĐÍCH. Tệp chuyển RA KHỎI vùng
    // của một suite sẽ không được tính là «đổi trong vùng» và suite bị bỏ qua tuy module vừa mất một tệp (S4 r3 t6).
    const dong = [
      git(cwd, "diff", "--no-renames", "--name-only", mb, "HEAD"),
      git(cwd, "diff", "--no-renames", "--name-only", "HEAD"),
      git(cwd, "ls-files", "--others", "--exclude-standard"),
    ].join("\n");
    // node_modules nối bằng symlink (dung-worktree-cham.sh) không phải thay đổi của nhánh.
    return [...new Set(dong.split("\n").map((s) => s.trim()).filter((s) => s && !/(^|\/)node_modules(\/|$)/.test(s)))].sort();
  } catch {
    return null;
  }
}

function gocKho(cwd) {
  try { return git(cwd, "rev-parse", "--show-toplevel").trim(); } catch { return cwd; }
}

// ── Lệnh suite scripts: chạy đúng các bước `run` của job `scripts` trong ci-test.yml (đọc từ chính tệp workflow của
// gốc đang chấm), chỉ thay glob `scripts/*.test.mjs` bằng tập chọn. Bước checkout, setup-node, «cài phụ thuộc» miễn:
// worktree chấm đã nối node_modules (dung-worktree-cham.sh). DB trống dựng mới trong cùng server :5433 — cùng ảnh
// kartoza/postgis với services của job — và xoá khi thoát, kể cả khi bị ngắt. GitHub đặt CI=true cho mọi bước.
export const BUOC_CI = ["kiểm cú pháp .mjs", "dựng DB trống từ migration", "test"];
const GLOB_TEST = "scripts/*.test.mjs";
const DB_CONTAINER = "one-invest-db";
const dbUrl = (ten) => `postgres://oneinvest:oneinvest@localhost:5433/${ten}`;

export function buocSuite(root) {
  const yaml = createRequire(path.join(root, "app/package.json"))("js-yaml");
  const job = yaml.load(readFileSync(path.join(root, ".github/workflows/ci-test.yml"), "utf8")).jobs?.scripts;
  if (!job) throw new Error("ci-test.yml không có job scripts");
  return BUOC_CI.map((ten) => {
    const b = (job.steps ?? []).find((s) => s.name === ten);
    if (!b?.run) throw new Error(`job scripts thiếu bước «${ten}»`);
    return { ten, lenh: b.run.trim() };
  });
}

const dx = (...a) => spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", DB_CONTAINER, ...a], { encoding: "utf8" });

async function mainScripts(argv) {
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const root = opt("--root") ? path.resolve(opt("--root")) : gocKho(process.cwd());
  const tests = testsScripts(root);
  let r;
  if (opt("--tep")) {
    const chon = opt("--tep").split(",").filter(Boolean);
    r = { chon, ly_do: Object.fromEntries(chon.map((t) => [t, "chỉ định bằng --tep"])), tron_bo: null };
  } else {
    // --khai: đọc tệp khai từ đường khác gốc đang chấm — probe tái hiện chạy tệp khai của HEAD trên cây của đỉnh cũ.
    const { khai, loi } = docKhai(root, opt("--khai") ? path.resolve(opt("--khai")) : undefined);
    r = chonScripts({ tep: tepDoi(root, opt("--base")), khai, tests, ep: process.env.SUITE_NEU_DOI === "chay", loiKhai: loi });
  }
  console.log(`suite-neu-doi: scripts — ${r.chon.length}/${tests.length} tệp${r.tron_bo ? ` (trọn bộ: ${r.tron_bo})` : ""}`);
  for (const t of r.chon) console.log(`  ${t} ← ${r.ly_do[t]}`);
  if (argv[0] === "--chon-scripts") return 0;

  let buoc;
  try { buoc = buocSuite(root); } catch (e) { console.error(`suite-neu-doi: ${e.message}`); return 2; }
  const ten = `oneinvest_ci_scripts_${process.pid}`;
  const tao = dx("createdb", "-U", "oneinvest", "-h", "localhost", ten);
  if (tao.status !== 0) { console.error(`suite-neu-doi: không dựng được DB trống ${ten}: ${(tao.stderr || tao.error?.message || "").trim()}`); return 2; }
  let daXoa = false;
  const xoa = () => { if (!daXoa) { daXoa = true; dx("dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", "--force", ten); } };
  // Bước chạy trong nhóm tiến trình riêng: nhận tín hiệu thì ngắt cả nhóm (bash, node --test và con của nó), xoá DB,
  // thoát 128 + số hiệu. spawnSync không làm được việc này: trình xử lý tín hiệu chỉ chạy sau khi con xong.
  let con = null;
  const ngat = (sig, so) => process.on(sig, () => {
    if (con?.pid) { try { process.kill(-con.pid, "SIGTERM"); } catch { /* nhóm đã thoát */ } }
    xoa(); process.exit(128 + so);
  });
  ngat("SIGINT", 2); ngat("SIGTERM", 15);
  try {
    // NODE_TEST_CONTEXT: khi lệnh này chạy từ trong một lượt `node --test`, biến ấy làm `node --test` lồng bên trong
    // báo về cha thay vì tự chạy tệp. Bước CI thật không có biến này.
    const { NODE_TEST_CONTEXT: _bo, ...goc } = process.env;
    const env = { ...goc, CI: "true", DATABASE_URL: dbUrl(ten) };
    for (const { ten: tb, lenh } of buoc) {
      let l = lenh;
      if (tb === "test") {
        if (!r.chon.length) { console.log("suite-neu-doi: bước test bỏ — không tệp nào được chọn"); continue; }
        if (!l.includes(GLOB_TEST)) { console.error(`suite-neu-doi: bước test không còn glob ${GLOB_TEST} — lệnh CI đã đổi`); return 2; }
        l = l.replace(GLOB_TEST, r.chon.map((t) => `'${t}'`).join(" "));
      }
      console.log(`suite-neu-doi: bước «${tb}»`);
      const k = await new Promise((xong) => {
        con = spawn("bash", ["-eo", "pipefail", "-c", l], { cwd: root, env, stdio: "inherit", detached: true });
        con.on("exit", (status, signal) => xong({ status, signal }));
        con.on("error", (error) => xong({ status: 127, signal: null, error }));
      });
      con = null;
      if (k.signal) return 128 + ({ SIGINT: 2, SIGKILL: 9, SIGTERM: 15 }[k.signal] ?? 1);
      if (k.status !== 0) { console.error(`suite-neu-doi: bước «${tb}» thoát ${k.status}`); return k.status ?? 1; }
    }
    return 0;
  } finally { xoa(); }
}

function main(argv) {
  if (argv[0] === "--chon-scripts" || argv[0] === "--chay-scripts") return mainScripts(argv);
  const i = argv.indexOf("--");
  const ten = argv[0];
  if (!ten || ten === "--" || i < 0 || i === argv.length - 1) {
    console.error("dùng: node scripts/suite-neu-doi.mjs <tên-suite> -- <lệnh>");
    return 2;
  }
  const lenh = argv.slice(i + 1).join(" ");
  const goc = gocKho(process.cwd());
  const q = quyetDinh(ten, tepDoi(goc), { ep: process.env.SUITE_NEU_DOI === "chay" });
  if (!q.chay) {
    console.log(`suite-neu-doi: bỏ qua ${ten}: ${q.ly_do}`);
    return 0;
  }
  console.log(`suite-neu-doi: chạy ${ten} — ${q.ly_do}`);
  const r = spawnSync("bash", ["-c", lenh], { cwd: goc, stdio: "inherit" });
  if (r.error) { console.error(`suite-neu-doi: không chạy được bash: ${r.error.message}`); return 127; }
  if (r.signal) { const so = { SIGINT: 2, SIGKILL: 9, SIGTERM: 15 }[r.signal] ?? 1; return 128 + so; }
  return r.status ?? 1;
}

const laLoiVao = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (laLoiVao) {
  const ma = main(process.argv.slice(2));
  if (ma instanceof Promise) ma.then((c) => { process.exitCode = c; }); else process.exitCode = ma;
}
