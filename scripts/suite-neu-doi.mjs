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
import { appendFileSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
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
  // pipeline/sync-cloud-che.test.mjs (HT26 SCC-9) chạy mã TypeScript của data-api bằng tsx của chính gói data-api.
  "data-api/**",
  "_acceptance/danh-ba-phuong-xa-toan-quoc/**", "_acceptance/du-an-cua-tin-len-dinh-vi/**",
  "_acceptance/gop-tin-chi-anh-o-transform/**",
  "_acceptance/lay-mau-khu-trung-theo-tin/**", "_acceptance/nhom-dang-ky-hai-lan-s03/**",
  "_acceptance/s03-len-cong/**", "_acceptance/tap-nhan-mau-ocp1/**", "_acceptance/truong-nhan-s03-081/**",
  "_acceptance/the-dia-chi-nhom-s03/ap-may-thu/**",
  // pipeline/scripts/mau-bai-lac-du-an.test.mjs đọc hồ sơ mẫu v2 thật (khoá 100 mã, hạt giống, n) — đầu vào của test (TG2).
  "_acceptance/dong-dau-dia-chi-luc-nap/evidence/mau-bai-lac-du-an-v2.md",
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
    // scripts/do-ten-nguon-cloud.mjs (HT26) mượn pg qua createRequire(app/package.json).
    "app/package.json",
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

const reGlob = (g) =>
  new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$");

// `x/**` = mọi đường dưới x; không có `*` = khớp nguyên đường.
export function khop(duong, glob) {
  if (glob.endsWith("/**")) return duong.startsWith(glob.slice(0, -2));
  if (!glob.includes("*")) return duong === glob;
  return reGlob(glob).test(duong);
}

export const trongVung = (duong, vung) => vung.some((g) => khop(duong, g));

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

// ── Lệnh scripts (hồ sơ suite-scripts-vao-luot-cham): chạy TRỌN bộ scripts/*.test.mjs theo đúng các bước `run` của job
// `scripts` trong ci-test.yml (đọc nguyên văn từ tệp workflow của gốc đang chạy), NGOÀI khoá s4 — bước chạy khô trước
// khi xin chấm và sau mỗi lần nhận main chạm scripts/**. Bước checkout, setup-node, «cài phụ thuộc» miễn: worktree đã nối
// node_modules (dung-worktree-cham.sh). DB trống dựng mới trong cùng server :5433 (cùng ảnh kartoza/postgis với services
// của job), xoá khi thoát kể cả khi bị ngắt; GitHub đặt CI=true cho mọi bước. Dòng cuối stdout là JSON `scripts-ci`;
// `--ho-so <slug>` nối dòng ấy vào _acceptance/<slug>/run-log.jsonl. `--tep a,b` chỉ cho phép đo: thay glob bằng tệp ấy.
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

// Đọc số ca từ dòng tổng kết của node --test (reporter spec «ℹ tests N» hay tap «# tests N»); không có thì null.
// Giữ các dòng tổng kết «ℹ|# tests|pass|fail N» khi chúng chảy qua. Reporter spec in chúng TRƯỚC khối «✖ failing tests»
// (in lại mọi ca đỏ kèm stack), nên giữ đuôi đầu ra là mất số ca đúng khi lượt đỏ dài.
const MAU_TONG_KET = /^(?:ℹ|#) (?:tests|pass|fail) \d+/;
export function boTongKet() {
  let du = "";
  const giu = [];
  return {
    nap(b) {
      const dong = (du + b).split("\n");
      du = dong.pop();
      for (const l of dong) if (MAU_TONG_KET.test(l)) giu.push(l);
    },
    text() { return [...giu, ...(MAU_TONG_KET.test(du) ? [du] : [])].join("\n"); },
  };
}

export function tomTatScripts(out, { sha, exit, giay }) {
  const so = (k) => { const m = [...out.matchAll(new RegExp(`^(?:ℹ|#) ${k} (\\d+)`, "gm"))].pop(); return m ? Number(m[1]) : null; };
  return { kind: "scripts-ci", ts: new Date().toISOString(), sha, exit, tests: so("tests"), pass: so("pass"), fail: so("fail"), giay };
}

// Tệp làm cây «bẩn» theo `git status --porcelain -z`: mọi thay đổi ngoài _acceptance/ (hồ sơ được phép đổi trong lượt, cùng
// luật với dòng scripts-ci và làn ghim lại). Đổi tên/chép có thêm một mục đường cũ ngay sau.
export function tepBan(z) {
  const muc = z.split("\0"), ra = [];
  for (let i = 0; i < muc.length; i++) {
    if (muc[i].length < 4) continue;
    const duong = [muc[i].slice(3)];
    if (/[RC]/.test(muc[i].slice(0, 2))) duong.push(muc[++i]);
    for (const d of duong) if (d && !d.startsWith("_acceptance/")) ra.push(d);
  }
  return ra;
}

const dx = (...a) => spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", DB_CONTAINER, ...a], { encoding: "utf8" });

// Shell của bước: job không khai `shell:` thì runner Linux chạy `bash -e {0}` — không pipefail. Lệch thì gọi tên trong
// lechMoiTruong để SSL-AC-1 đỏ.
export const SHELL_CI = ["-e", "-c"];
export function lechMoiTruong(job, anhMay) {
  const sai = [];
  for (const [svc, c] of Object.entries(job.services ?? {}))
    if (c.image !== anhMay) sai.push(`services.${svc}.image: job ${c.image} ≠ máy ${anhMay}`);
  if (job.defaults?.run?.shell) sai.push(`defaults.run.shell: ${job.defaults.run.shell}`);
  for (const st of job.steps ?? []) if (st.run && st.shell) sai.push(`shell của bước «${st.name}»: ${st.shell}`);
  return sai;
}

// DB của lượt trước bị giết cứng (SIGKILL, máy tắt) không qua được finally: lượt sau xoá DB nào có pid ở đuôi không còn sống.
const MAU_DB = /^oneinvest_ci_scripts_(\d+)$/;
export function dbMoCoi(ten, song, pidMinh = process.pid) {
  return ten.filter((t) => { const m = MAU_DB.exec(t); return m && Number(m[1]) !== pidMinh && !song(Number(m[1])); });
}
const pidSong = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

async function mainScripts(argv) {
  for (const k of ["--root", "--ho-so", "--tep"]) {
    const i = argv.indexOf(k);
    if (i >= 0 && (argv[i + 1] === undefined || argv[i + 1].startsWith("--"))) { console.error(`suite-neu-doi: ${k} thiếu giá trị`); return 2; }
  }
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const root = opt("--root") ? path.resolve(opt("--root")) : gocKho(process.cwd());
  const hoSo = opt("--ho-so");
  if (hoSo !== undefined && !(/^[a-z0-9][a-z0-9-]*$/.test(hoSo) && existsSync(path.join(root, "_acceptance", hoSo))))
    { console.error(`suite-neu-doi: hồ sơ «${hoSo}» không có ở ${root}/_acceptance`); return 2; }
  const tep = opt("--tep") ? opt("--tep").split(",").filter(Boolean) : null;
  const batDau = Date.now();
  const tongKet = boTongKet();
  // sha đọc TRƯỚC khi chạy: luật gộp buộc kết quả vào đỉnh bằng trường này, đọc sau thì commit giữa lượt nhận kết quả của cây cũ.
  let sha = null;
  try { sha = git(root, "rev-parse", "HEAD").trim(); } catch { /* không phải kho git: bị từ chối ở bước kiểm cây */ }
  // Mọi đường ra sau khi hồ sơ hợp lệ đi qua đây: luật gộp đọc dòng MỚI NHẤT, lượt hỏng không để dấu thì dòng xanh cũ vẫn thắng.
  const ket = (ma) => {
    const dong = JSON.stringify(tomTatScripts(tongKet.text(), { sha, exit: ma, giay: Math.round((Date.now() - batDau) / 100) / 10 }));
    if (hoSo) appendFileSync(path.join(root, "_acceptance", hoSo, "run-log.jsonl"), dong + "\n");
    console.log(dong);
    return ma;
  };
  let ban;
  try { ban = tepBan(git(root, "status", "--porcelain", "-z")); } catch (e) { console.error(`suite-neu-doi: không đọc được trạng thái cây ${root}: ${e.message}`); return ket(2); }
  if (ban.length) { console.error(`suite-neu-doi: từ chối chạy trên cây bẩn (${ban.length} tệp ngoài _acceptance/): ${ban.slice(0, 10).join(", ")}`); return ket(2); }
  let buoc;
  try { buoc = buocSuite(root); } catch (e) { console.error(`suite-neu-doi: ${e.message}`); return ket(2); }
  // Bước chạy trong nhóm tiến trình riêng: nhận tín hiệu thì ngắt cả nhóm (bash, node --test và con của nó) rồi đi tiếp đường
  // ra chung để xoá DB và ghi dòng tóm tắt. spawnSync không làm được: trình xử lý tín hiệu chỉ chạy sau khi con xong.
  let con = null, maNgat = 0;
  const ngat = (sig, so) => process.on(sig, () => {
    if (maNgat) return;
    maNgat = 128 + so;
    if (!con?.pid) return;
    const nhom = con.pid;
    try { process.kill(-nhom, "SIGTERM"); } catch { /* nhóm đã thoát */ }
    setTimeout(() => { try { process.kill(-nhom, "SIGKILL"); } catch { /* nhóm đã thoát */ } }, 10000).unref();
  });
  ngat("SIGHUP", 1); ngat("SIGINT", 2); ngat("SIGTERM", 15);
  const ten = `oneinvest_ci_scripts_${process.pid}`;
  const ds = dx("psql", "-U", "oneinvest", "-h", "localhost", "-d", "oneinvest", "-At", "-c", "select datname from pg_database");
  for (const cu of dbMoCoi((ds.stdout || "").split("\n").map((x) => x.trim()), pidSong)) {
    const r = dx("dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", "--force", cu);
    console.error(`suite-neu-doi: ${r.status === 0 ? "đã xoá" : "không xoá được"} DB mồ côi ${cu}`);
  }
  const tao = dx("createdb", "-U", "oneinvest", "-h", "localhost", ten);
  if (tao.status !== 0) { console.error(`suite-neu-doi: không dựng được DB trống ${ten}: ${(tao.stderr || tao.error?.message || "").trim()}`); return ket(2); }
  let daXoa = false;
  const xoa = () => {
    if (daXoa) return true;
    daXoa = true;
    const r = dx("dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", "--force", ten);
    if (r.status !== 0) console.error(`suite-neu-doi: KHÔNG xoá được DB ${ten}: ${(r.stderr || r.error?.message || "").trim()}`);
    return r.status === 0;
  };
  let ma = 0;
  try {
    // NODE_TEST_CONTEXT: khi lệnh chạy từ trong một lượt `node --test`, biến ấy làm `node --test` lồng bên trong báo về
    // cha thay vì tự chạy tệp. Bước CI thật không có biến này.
    const { NODE_TEST_CONTEXT: _bo, ...goc } = process.env;
    const env = { ...goc, CI: "true", DATABASE_URL: dbUrl(ten) };
    for (const { ten: tb, lenh } of buoc) {
      if (maNgat) break;
      let l = lenh;
      if (tb === "test") {
        if (!l.includes(GLOB_TEST)) { console.error(`suite-neu-doi: bước test không còn glob ${GLOB_TEST} — lệnh CI đã đổi`); ma = 2; break; }
        if (tep) l = l.replace(GLOB_TEST, tep.map((t) => `'${t}'`).join(" "));
      }
      console.log(`suite-neu-doi: bước «${tb}»`);
      const k = await new Promise((xong) => {
        con = spawn("bash", [...SHELL_CI, l], { cwd: root, env, stdio: ["inherit", tb === "test" ? "pipe" : "inherit", "inherit"], detached: true });
        // setEncoding: mẩu đọc từ pipe có thể cắt giữa «ℹ» (3 byte UTF-8); StringDecoder giữ phần byte dở sang mẩu sau.
        if (tb === "test") { con.stdout.setEncoding("utf8"); con.stdout.on("data", (b) => { process.stdout.write(b); tongKet.nap(b); }); }
        con.on("close", (status, signal) => xong({ status, signal }));
        con.on("error", () => xong({ status: 127, signal: null }));
      });
      con = null;
      if (maNgat) break;
      if (k.signal) { ma = 128 + ({ SIGINT: 2, SIGKILL: 9, SIGTERM: 15 }[k.signal] ?? 1); break; }
      if (k.status !== 0) { console.error(`suite-neu-doi: bước «${tb}» thoát ${k.status}`); ma = k.status ?? 1; break; }
    }
  } finally {
    // DB tạm rò lại trên server dùng chung: lượt chạy khô không được báo xanh.
    if (!xoa() && ma === 0) ma = 3;
  }
  return ket(maNgat || ma);
}

function main(argv) {
  if (argv[0] === "--chay-scripts") return mainScripts(argv);
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
